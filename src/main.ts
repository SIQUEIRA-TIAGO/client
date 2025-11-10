import { observerDataSourceImpl } from '@/data-sources/implementations/observer-data-source';
import { fileSystemDataSourceImpl } from '@/data-sources/implementations/file-system-data-source';
import { jobFactory } from '@/factories/jobFactory';
import { sqlDataSourceImpl } from '@/data-sources/implementations/sql-data-source';
import 'colorts/lib/colors';
import { CronJob } from 'cron';
import { remoteFileSystemDataSourceImpl } from './data-sources/implementations/remote-file-system-data-source';
import { downloadObservers } from './common/helpers/download-observers';
import { logger } from './logger';
import { Observer } from './entities/observer';

const cleanUpOldObservers = async () => {
    logger.info('Cleaning up old observers data'.bgBlue.black);

    await fileSystemDataSourceImpl.saveJson({
        what: '[]',
        where: '../remoteData/observers.json',
    });
};

const saveObservers = async (observers: Observer[]) => {
    const observersFile = JSON.stringify(observers);

    await fileSystemDataSourceImpl.saveJson({
        where: '../remoteData/observers.json',
        what: observersFile,
    });
};

const processObservers = async (observers: Observer[]) => {
    await Promise.all(
        observers.map(async (observer) => {
            if (observer.sql_url && observer.sql_url.includes(process.env.ORG_ID)) {
                try {
                    const sql = await remoteFileSystemDataSourceImpl
                        .downloadFile(observer.sql_url);
                    const sqlFile = JSON.stringify({
                        observerId: observer.observer_id,
                        sql,
                    })
                    await fileSystemDataSourceImpl.saveJson({
                        where: `../remoteData/sqls/${observer.observer_id}.json`,
                        what: sqlFile,
                    });
                } catch (error) {
                    logger.error(`Error downloading SQL for observer ${observer.observer_id}: ${error}`);
                }
            }
        })
    );
};

export const init = async () => {
    try {
        await cleanUpOldObservers()

        const observerDataSource = observerDataSourceImpl({
            fileSystemDataSource: fileSystemDataSourceImpl,
        })
        const observers = await observerDataSource.getRemoteObservers();

        await saveObservers(observers);
        await processObservers(observers);

        const jobs = await jobFactory({
            sqlDataSource: sqlDataSourceImpl,
            fileSystemDataSource: fileSystemDataSourceImpl,
            observerDataSourceImpl,
        });

        return jobs;
    } catch (error) {
        throw error;
    }
};

//Em prod mudar pra 0 */3 * * *  |||| a cada 3 horas
export const mainCron = () => {
    return CronJob.from({
        cronTime: '*/1 * * * *',
        onTick: async () => {
            try {
                await downloadObservers();
            } catch (error) {
                logger.info('Error when trying to download observers' + error)
            }
        },
        runOnInit: true,
    });
};
