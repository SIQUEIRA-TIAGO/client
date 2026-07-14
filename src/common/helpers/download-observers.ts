import path from 'path';
import { logger } from "@/logger";
import { observerDataSourceImpl } from '@/data-sources/implementations/observer-data-source';
import { fileSystemDataSourceImpl } from '@/data-sources/implementations/file-system-data-source';
import { remoteFileSystemDataSourceImpl } from '../../data-sources/implementations/remote-file-system-data-source';
import { Observer } from '../../entities/observer';
import { getNextRun } from './observer-schedule';

const CRON_TIMEZONE = process.env.CRON_TIMEZONE || undefined;

const saveObservers = async (observers: Observer[]) => {
    await fileSystemDataSourceImpl.saveJsonAtomic({
        where: path.join(process.cwd(), 'remoteData/observers.json'),
        what: JSON.stringify(observers),
    });
};

const downloadSqls = async (observers: Observer[]) => {
    const ORG_ID = process.env.ORG_ID;

    await Promise.all(
        observers.map(async (observer) => {
            if (!observer.sql_url) {
                logger.error(`Observer ${observer.observer_id} has no sql_url, keeping previous SQL if any`);
                return;
            }
            if (ORG_ID && !observer.sql_url.includes(ORG_ID)) {
                logger.error(`Observer ${observer.observer_id} sql_url does not belong to org ${ORG_ID}, skipping download`);
                return;
            }
            try {
                const sql = await remoteFileSystemDataSourceImpl
                    .downloadFile(observer.sql_url);
                await fileSystemDataSourceImpl.saveJsonAtomic({
                    where: path.join(process.cwd(), `remoteData/sqls/${observer.observer_id}.json`),
                    what: JSON.stringify({
                        observerId: observer.observer_id,
                        sql,
                    }),
                });
            } catch (error) {
                logger.error(`Error downloading SQL for observer ${observer.observer_id}, keeping previous version: ${error}`);
            }
        })
    );
};

const logSchedule = (observers: Observer[]) => {
    const now = new Date();
    for (const observer of observers) {
        const nextRun = getNextRun(observer.cron_expression, now, CRON_TIMEZONE);
        if (nextRun) {
            logger.info(`Observer ${observer.observer_id} (${observer.cron_expression}): next execution at ${nextRun.toISOString()}`);
        } else {
            logger.error(`Observer ${observer.observer_id} has an invalid cron expression: "${observer.cron_expression}"`);
        }
    }
};

export const refreshObservers = async () => {
    // A lista local só é substituída depois que tudo deu certo: falha de
    // rede/API em qualquer etapa preserva a versão anterior funcionando
    const observerDataSource = observerDataSourceImpl({
        fileSystemDataSource: fileSystemDataSourceImpl,
    });
    const observers = await observerDataSource.getRemoteObservers();

    const validObservers = (observers ?? []).filter((observer) => {
        if (!observer?.observer_id) {
            logger.error(`Discarding observer without observer_id: ${JSON.stringify(observer)}`);
            return false;
        }
        if (!observer.cron_expression) {
            logger.error(`Discarding observer ${observer.observer_id} without cron_expression`);
            return false;
        }
        return true;
    });

    await downloadSqls(validObservers);
    await saveObservers(validObservers);

    logger.info(`Refreshed ${validObservers.length} observers`.bgBlue.black);
    logSchedule(validObservers);
};
