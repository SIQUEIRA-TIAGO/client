import 'colorts/lib/colors';
import { CronJob } from 'cron';
import { refreshObservers } from './common/helpers/download-observers';
import { logger } from './logger';
import { observerDataSourceImpl } from './data-sources/implementations/observer-data-source';
import { fileSystemDataSourceImpl } from './data-sources/implementations/file-system-data-source';
import { sqlDataSourceImpl } from './data-sources/implementations/sql-data-source';
import { runObserver } from './common/helpers/run-observer';
import { checkObserverDue } from './common/helpers/observer-schedule';
import { lastRunStore } from './common/helpers/last-run-store';
import { mapWithConcurrency } from './common/helpers/map-with-concurrency';
import { resendPendingOcurrences } from './common/helpers/pending-ocurrences';
import { Observer } from './entities/observer';

// Timezone das expressões cron (ex.: America/Sao_Paulo). Sem essa variável,
// vale a hora local do servidor — que pode não ser a que o cliente espera.
const CRON_TIMEZONE = process.env.CRON_TIMEZONE || undefined;
const OBSERVER_CONCURRENCY = +(process.env.OBSERVER_CONCURRENCY ?? 5);

export const refreshObserversCron = () => {
    return CronJob.from({
        cronTime: '15 */3 * * *',
        timeZone: CRON_TIMEZONE,
        onTick: async () => {
            try {
                await refreshObservers();
            } catch (error) {
                logger.error(`Error when trying to download observers: ${error}`);
            }
        },
        runOnInit: true,
    });
};

const findDueObservers = (
    observers: Observer[],
    lastRuns: Map<string, Date>,
    now: Date
): { observer: Observer; scheduledAt: Date }[] => {
    const due: { observer: Observer; scheduledAt: Date }[] = [];

    for (const observer of observers) {
        if (!observer.cron_expression) {
            logger.error(`Missing cron expression for observer ID: ${observer?.observer_id}`);
            continue;
        }

        const lastRun = lastRuns.get(observer.observer_id);
        if (!lastRun) {
            // Primeiro contato com o observer: baseline = agora,
            // executa na próxima janela do cron dele
            lastRuns.set(observer.observer_id, now);
            continue;
        }

        const check = checkObserverDue({
            cronExpression: observer.cron_expression,
            lastRun,
            now,
            timezone: CRON_TIMEZONE,
        });

        if (check.error) {
            logger.error(`Invalid cron expression "${observer.cron_expression}" for observer ${observer.observer_id}: ${check.error}`);
            continue;
        }
        if (check.due && check.scheduledAt) {
            due.push({ observer, scheduledAt: check.scheduledAt });
        }
    }

    return due;
};

const runDueObservers = async (): Promise<void> => {
    const observerDataSource = observerDataSourceImpl({
        fileSystemDataSource: fileSystemDataSourceImpl,
    });
    const observers = await observerDataSource.getLocalObservers();
    if (!Array.isArray(observers) || observers.length === 0) return;

    const lastRuns = await lastRunStore.load();
    const now = new Date();
    const dueObservers = findDueObservers(observers, lastRuns, now);

    await mapWithConcurrency(dueObservers, OBSERVER_CONCURRENCY, async ({ observer, scheduledAt }) => {
        try {
            logger.info(`Observer ${observer.observer_id} due (scheduled for ${scheduledAt.toISOString()}), executing`);
            lastRuns.set(observer.observer_id, now);

            const sql = await sqlDataSourceImpl({
                fileSystemDataSource: fileSystemDataSourceImpl,
            }).getLocalSql({ observerId: observer.observer_id });

            if (!sql) {
                logger.error(`Missing SQL for observer ID: ${observer.observer_id}`);
                return;
            }

            await runObserver(observer, sql);
        } catch (error) {
            logger.error(`Error running observer ${observer.observer_id}: ${error}`);
        }
    });

    lastRunStore.prune(observers.map((observer) => observer.observer_id));
    await lastRunStore.persist();
};

let tickRunning = false;
export const tickCron = () => {
    return CronJob.from({
        cronTime: '* * * * *',
        timeZone: CRON_TIMEZONE,
        onTick: async () => {
            // Sem sobreposição de ticks: observers que vencerem enquanto
            // este roda são pegos pelo próximo (comparação por janela)
            if (tickRunning) {
                logger.info('Previous tick still running, skipping this one (due observers will be caught up on the next tick)');
                return;
            }
            tickRunning = true;
            try {
                await runDueObservers();
            } catch (error) {
                logger.error(`Error in tick: ${error}`);
            } finally {
                tickRunning = false;
            }
        },
        runOnInit: true,
    });
};

let resendRunning = false;
export const resendPendingOcurrencesCron = () => {
    return CronJob.from({
        cronTime: '*/5 * * * *',
        timeZone: CRON_TIMEZONE,
        onTick: async () => {
            if (resendRunning) return;
            resendRunning = true;
            try {
                await resendPendingOcurrences();
            } catch (error) {
                logger.error(`Error resending pending ocurrences: ${error}`);
            } finally {
                resendRunning = false;
            }
        },
    });
};
