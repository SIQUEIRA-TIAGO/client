import { databaseConnection } from '@/data-sources/connectors/database-connector';
import { firestoreDataSourceImpl } from '@/data-sources/implementations/firestore-data-source';
import { Observer } from '@/entities/observer';
import { checkFieldRestrictions } from '@/helpers/checkFieldRestrictions';
import { checkRowRestrictions } from '@/helpers/checkRowRestrictions';
import { sendAt } from 'cron';
import { QueryTypes } from 'sequelize';
import { generateUUIDv7 } from './generate-uuidv7';
import { OcurrenceData } from '@/entities/ocurrence-data';
import { remoteFileSystemDataSourceImpl } from '@/data-sources/implementations/remote-file-system-data-source';
import { Blob } from 'buffer';
import { ocurrenceDataSourceImpl } from '@/data-sources/implementations/occurence-data-source';
import { logger } from '@/logger';

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

    const queryResult = await databaseConnection.query(sql?.sql, {
        type: QueryTypes.SELECT,
        benchmark: true,
        logging: (_, timming) => {
            executionMS = timming ?? 0;
        },
    });

    if (!queryResult?.length) {
        logger.error(`No results found for query: ${sql?.sql}`);
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

    let {should_send_recovery} = await firestoreDataSourceImpl.updateClientJobsStatus({
        last_execution_date: new Date().valueOf(),
        last_execution_MS: executionMS,
        last_result_ok: !(
            !!fieldRestrictionsTriggered || !!rowRestrictionsTriggered
        ),
        next_execution_date: sendAt(observer.cron_expression).toMillis(),
        observer_id: observer.observer_id,
    });

    const sendOcurrence = async (is_recovery: boolean) => {
        logger.info(`Observer ${observer?.sql_url} triggered`.bgRed);
        const ocurrenceId = generateUUIDv7();

        await remoteFileSystemDataSourceImpl.uploadFile(
            new Blob([JSON.stringify(ocurrenceJson)], {
                type: 'application/json',
            }),
            `/${process.env.ORG_ID}/ocurrences/${ocurrenceId}.json`
        ),
            await ocurrenceDataSourceImpl().postOcurrence({
                client_id: process.env.ORG_ID as string,
                observer_id: observer.observer_id,
                ocurrence_id: ocurrenceId,
                ocurrence_url: `ocurrences/${ocurrenceId}.json`,
                is_recovery: is_recovery,
                ocurrenceJson,
                org_id: process.env.ORG_ID as string,
            });
    }

    if(should_send_recovery){
        await sendOcurrence(true)
    }
    if (!!fieldRestrictionsTriggered || !!rowRestrictionsTriggered) {
       await sendOcurrence(false)
    }
    firestoreDataSourceImpl.updateClientStatus('last_cron_exec', {
        observer_id: observer.observer_id,
        error: null,
        ocurrence_triggered:
            !!fieldRestrictionsTriggered || !!rowRestrictionsTriggered,
    });

    return {
        executionMS,
        fieldRestrictionsTriggered,
        rowRestrictionsTriggered,
        queryResult,
    };
};
