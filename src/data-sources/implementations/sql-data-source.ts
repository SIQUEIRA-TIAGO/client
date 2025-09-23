import { ISqlDataSource } from '@interfaces/sql-data-source';
import path from 'path';
import { axiosApiConnector } from '../connectors/axios-api-connector';
import { IErrors } from '@/common/interfaces/errors';
import { logger } from '@/logger';

export const sqlDataSourceImpl: ISqlDataSource = ({ fileSystemDataSource }) => {
    return {
        getLocalSql: async ({ observerId }) => {
            try {
                const sql = await fileSystemDataSource.getJson<{
                    observerId: string;
                    sql: string;
                }>({
                    where: path.join(
                        process.cwd(),
                        `../remoteData/sqls/${observerId}.json`
                    ),
                });
                return sql;
            } catch (error) {
                logger.error(error);
                throw {
                    message: `Error reading %/remoteData/sqls/${observerId}.json`,
                    origin: 'fs',
                } as IErrors;
            }
        },
        getRemoteSql: async ({ url }): Promise<string> => {
            try {
                const sql = await axiosApiConnector.get<string>(url);
                return sql.data;
            } catch (error) {
                console.log(error);
                throw {
                    message: `Error reading ${url}`,
                    origin: 'api.axios',
                } as IErrors;
            }
        },
    };
};
