import { runObserver } from '@/common/helpers/run-observer';
import { IErrors } from '@/common/interfaces/errors';
import { IObserverJobContext } from '@/common/interfaces/observer-job-context';
import { firestoreDataSourceImpl } from '@/data-sources/implementations/firestore-data-source';
import { IFileSystemDataSource } from '@/data-sources/interfaces/file-system-data-source';
import { IObserverDataSource } from '@/data-sources/interfaces/observer-data-source';
import { ISqlDataSource } from '@/data-sources/interfaces/sql-data-source';
import { logger } from '@/logger';
import { CronJob, } from 'cron';

export const jobFactory = async ({
    observerDataSource,
    sqlDataSource,
    fileSystemDataSource,
}: {
    observerDataSource: IObserverDataSource;
    sqlDataSource: ISqlDataSource;
    fileSystemDataSource: IFileSystemDataSource;
}): Promise<CronJob<null, IObserverJobContext>[]> => {
    try {
        let observers = await observerDataSource({
            fileSystemDataSource,
        }).getRemoteObservers();

        if (!observers?.length) {
            return [];
        }
       
        let jobs = (
            await Promise.all(
                observers?.map(async (observer) => {
                    try {
                        let sql = await sqlDataSource({
                            fileSystemDataSource: fileSystemDataSource,
                        }).getLocalSql({ observerId: observer.observer_id });

                        if (!sql) {
                            logger.error(
                                `No sql found for id: ${observer?.observer_id})}`
                            );
                            return;
                        }

                        return CronJob.from<null, IObserverJobContext>({
                            cronTime: observer?.cron_expression,
                            onTick: async () => {
                                try {
                                    firestoreDataSourceImpl.updateClientStatus(
                                        'last_cron_exec_time',
                                        Date.now().valueOf()
                                    );
                                    await runObserver(observer, sql);
                                } catch (error) {
                                    firestoreDataSourceImpl.updateClientStatus(
                                        'last_cron_exec',
                                        {
                                            observer_id: observer.observer_id,
                                            error: JSON.stringify(error),
                                            ocurrence_triggered: false,
                                        }
                                    );
                                    console.log(error);
                                }
                            },
                            context: { name: observer?.sql_url },
                        });
                    } catch (error) {
                        console.log(error);
                    }
                })
            )
        )?.filter((job) => job !== undefined) as CronJob<
            null,
            IObserverJobContext
        >[];

        return jobs;
    } catch (error) {
        throw {
            message: 'Error while creating cron',
            origin: 'cron',
        } as IErrors;
    }
};
