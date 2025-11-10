import { runObserver } from '@/common/helpers/run-observer';
import { IErrors } from '@/common/interfaces/errors';
import { IObserverJobContext } from '@/common/interfaces/observer-job-context';
import { IFileSystemDataSource } from '@/data-sources/interfaces/file-system-data-source';
import { IObserverDataSource } from '@/data-sources/interfaces/observer-data-source';
import { ISqlDataSource } from '@/data-sources/interfaces/sql-data-source';
import { Observer } from '@/entities/observer';
import { logger } from '@/logger';
import { CronJob, } from 'cron';

const createCronJobForObserver = async (
    observer: Observer,
    sql: { observerId: string; sql: string; },
): Promise<CronJob<null, IObserverJobContext> | undefined> => {
    try {
        return CronJob.from<null, IObserverJobContext>({
            cronTime: observer.cron_expression,
            onTick: async () => {
                try {
                    await runObserver(observer, sql);
                } catch (error) {
                    logger.error(error);
                }
            },
            context: { name: observer.sql_url },
        })
    } catch (error) {
        logger.error(`Error creating cron job for observer ID ${observer?.observer_id}: ${error}`);
    }
};

export const jobFactory = async ({
    observerDataSourceImpl,
    sqlDataSource,
    fileSystemDataSource,
}: {
    observerDataSourceImpl: IObserverDataSource;
    sqlDataSource: ISqlDataSource;
    fileSystemDataSource: IFileSystemDataSource;
}): Promise<CronJob<null, IObserverJobContext>[]> => {
    try {
        const observers = await observerDataSourceImpl({
            fileSystemDataSource,
        }).getRemoteObservers();
        if (!Array.isArray(observers) || observers.length === 0) return [];

        const jobs = (
            await Promise.all(
                observers.map(async (observer) => {
                    try {
                        const sql = await sqlDataSource({
                            fileSystemDataSource: fileSystemDataSource,
                        }).getLocalSql({ observerId: observer.observer_id });

                        if (!sql) {
                            logger.error(`Missing SQL for observer ID: ${observer?.observer_id})}`);
                            return;
                        }

                        if (!observer.cron_expression) {
                            logger.error(`Missing cron expression for observer ID: ${observer?.observer_id}`);
                            return;
                        }

                        const cronJob = await createCronJobForObserver(observer, sql)
                        return cronJob;
                    } catch (error) {
                        logger.info(error);
                    }
                })
            )
        );

        const validJobs = jobs.filter((job) => job !== undefined) as CronJob<null, IObserverJobContext>[]
        return validJobs;
    } catch (error) {
        throw {
            message: 'Error while creating cron',
            origin: 'cron',
        } as IErrors;
    }
};
