import 'colorts/lib/colors';
import { CronJob } from 'cron';
import { refreshObservers } from './common/helpers/download-observers';
import { logger } from './logger';
import { observerDataSourceImpl } from './data-sources/implementations/observer-data-source';
import { fileSystemDataSourceImpl } from './data-sources/implementations/file-system-data-source';
import { sqlDataSourceImpl } from './data-sources/implementations/sql-data-source';
import { runObserver } from './common/helpers/run-observer';
import CronExpressionParser from 'cron-parser';

//Em prod mudar pra 0 */3 * * *  |||| a cada 3 horas
export const refreshObserversCron = () => {
    return CronJob.from({
        cronTime: '15 */3 * * *',
        onTick: async () => {
            try {
                await refreshObservers();
            } catch (error) {
                logger.info('Error when trying to download observers' + error)
            }
        },
        runOnInit: true,
    });
};

export const tickCron = () => {
    return CronJob.from({
        cronTime: '0-30 * * * *',
        onTick: async () => {
            try {
                const observerDataSource = observerDataSourceImpl({
                    fileSystemDataSource: fileSystemDataSourceImpl,
                })
                const observers = await observerDataSource.getLocalObservers();
                if (!Array.isArray(observers) || observers.length === 0) return

                const observerPromises = observers.map(async (observer) => {
                    try {
                        if (!observer.cron_expression) {
                            logger.error(`Missing cron expression for observer ID: ${observer?.observer_id}`);
                            return;
                        }

                        const now = new Date();
                        const cronExp = CronExpressionParser.parse(observer.cron_expression);
                        if (cronExp.includesDate(now)) {
                            const sql = await sqlDataSourceImpl({
                                fileSystemDataSource: fileSystemDataSourceImpl,
                            }).getLocalSql({ observerId: observer.observer_id });

                            if (!sql) {
                                logger.error(`Missing SQL for observer ID: ${observer?.observer_id})}`);
                                return;
                            }

                            await runObserver(observer, sql);
                        }
                    } catch (error) {
                        logger.info(error);
                    }
                });

                await Promise.all(observerPromises);
            } catch (error) {
                logger.info('Error in tick' + error)
            }
        },
        runOnInit: true,
    });
};
