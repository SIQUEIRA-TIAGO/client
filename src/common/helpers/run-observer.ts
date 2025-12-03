import { databaseConnection } from '@/data-sources/connectors/database-connector';
import { Observer } from '@/entities/observer';
import { checkFieldRestrictions } from '@/helpers/checkFieldRestrictions';
import { checkRowRestrictions } from '@/helpers/checkRowRestrictions';
import { QueryTypes } from 'sequelize';
import { generateUUIDv7 } from './generate-uuidv7';
import { OcurrenceData } from '@/entities/ocurrence-data';
import { ocurrenceDataSourceImpl } from '@/data-sources/implementations/occurence-data-source';
import { logger } from '@/logger';
import { parseSQL } from './parseSql';

export const runObserver = async (
    observer: Observer,
    sql: {
        observerId: string;
        sql: string;
    }
): Promise<{
    executionMS: number;
    fieldRestrictionsTriggered:
    | false
    | {
        affectedRows: {
            [key: string]: any;
        }[];
        affectedFields: string[];
    }
    | null;
    rowRestrictionsTriggered: boolean;
    queryResult: object[];
}> => {
    let fieldRestrictionsTriggered:
        | false
        | {
            affectedRows: {
                [key: string]: any;
            }[];
            affectedFields: string[];
        }
        | null = false;
    let rowRestrictionsTriggered = false;
    let executionMS = 0;

    const finalSql = parseSQL(sql.sql, observer.conditions ?? {})
    const queryResult = await databaseConnection.query(finalSql, {
        type: QueryTypes.SELECT,
        benchmark: true,
        logging: (_, timming) => {
            executionMS = timming ?? 0;
        },
    });

    if (!queryResult?.length) {
        logger.error(`No results found for query: ${finalSql}`);
        return {
            executionMS,
            fieldRestrictionsTriggered: false,
            rowRestrictionsTriggered: false,
            queryResult: [],
        };
    }
    const fieldRestrictions = observer?.field_restrictions;
    if (fieldRestrictions?.length) {
        let result = checkFieldRestrictions(queryResult, fieldRestrictions);
        fieldRestrictionsTriggered = result;
    }
    const rowRestrictions = observer?.row_restrictions;
    if (rowRestrictions?.length) {
        let result = checkRowRestrictions(queryResult, rowRestrictions);
        rowRestrictionsTriggered = !!result;
    }

    let ocurrenceJson: OcurrenceData = {
        occurence: {
            affectedRows: {
                result:
                    fieldRestrictionsTriggered &&
                        fieldRestrictionsTriggered.affectedRows?.length
                        ? fieldRestrictionsTriggered.affectedRows
                        : queryResult,
                count:
                    fieldRestrictionsTriggered &&
                        fieldRestrictionsTriggered.affectedRows?.length
                        ? fieldRestrictionsTriggered.affectedRows.length
                        : queryResult.length,
            },
            affectedFields: {
                result:
                    fieldRestrictionsTriggered &&
                        fieldRestrictionsTriggered.affectedFields?.length
                        ? fieldRestrictionsTriggered.affectedFields
                        : [],
                count:
                    fieldRestrictionsTriggered &&
                        fieldRestrictionsTriggered.affectedFields?.length
                        ? fieldRestrictionsTriggered.affectedFields.length
                        : 0,
            },
            meta: {
                executionMS,
                totalRowsCount: queryResult.length,
                executionDate: new Date().toLocaleString('pt-br'),
            },
        },
        observer: {
            observerId: observer.observer_id,
        },
    };

    const sendOcurrence = async (is_recovery: boolean) => {
        logger.info(`Observer ${observer?.sql_url} triggered`.yellow);
        const ocurrenceId = generateUUIDv7();

            await ocurrenceDataSourceImpl().postOcurrence({
                client_id: process.env.ORG_ID as string,
                observer_id: observer.observer_id,
                ocurrence_id: ocurrenceId,
                ocurrence_url: ``,
                is_recovery: is_recovery,
                ocurrenceJson,
                org_id: process.env.ORG_ID as string,
            });
    }

    if (!!fieldRestrictionsTriggered || !!rowRestrictionsTriggered) {
        await sendOcurrence(false)
    } else {
        await sendOcurrence(true)
    }

    return {
        executionMS,
        fieldRestrictionsTriggered,
        rowRestrictionsTriggered,
        queryResult,
    };
};
