import { observerDataSourceImpl } from '@/data-sources/implementations/observer-data-source';
import { fileSystemDataSourceImpl } from '@/data-sources/implementations/file-system-data-source';
import { jobFactory } from '@/factories/jobFactory';
import { sqlDataSourceImpl } from '@/data-sources/implementations/sql-data-source';
import 'colorts/lib/colors';
import { CronJob } from 'cron';
import { remoteFileSystemDataSourceImpl } from './data-sources/implementations/remote-file-system-data-source';
import { downloadObservers } from './common/helpers/download-observers';
import './logger'

export const init = async () => {
    try {
        console.log('Cleaning up old data'.bgBlue.black);
        await fileSystemDataSourceImpl.saveJson({ what: '[]', where: '../remoteData/observers.json' });

        console.log('Initializing sync'.bgBlue.black);

        const observers = await observerDataSourceImpl({
            fileSystemDataSource: fileSystemDataSourceImpl,
        }).getRemoteObservers();
        const stringfiedObservers = JSON.stringify(observers);

        await fileSystemDataSourceImpl.saveJson({
            where: '../remoteData/observers.json',
            what: stringfiedObservers,
        });

        await Promise.all(
            observers.map(async (observer) => {
                if (!observer.sql_url) return;
                if (observer.sql_url.includes(process.env.ORG_ID || '')) {

                    let downloadedSql =
                        await remoteFileSystemDataSourceImpl.downloadFile(
                            observer.sql_url
                        );

                    await fileSystemDataSourceImpl.saveJson({
                        where: `../remoteData/sqls/${observer.observer_id}.json`,
                        what: JSON.stringify({
                            observerId: observer.observer_id,
                            sql: downloadedSql,
                        }),
                    });
                }
            })
        );

        console.log('Observers and sqls saved'.bgBlue.black);


        const jobs = await jobFactory({
            sqlDataSource: sqlDataSourceImpl,
            fileSystemDataSource: fileSystemDataSourceImpl,
            observerDataSource: observerDataSourceImpl,
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
                console.log(error)
            }
        },
        runOnInit: true,
    });
};
