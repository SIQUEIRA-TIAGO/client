import {
    updateDoc,
    doc,
    setDoc,
    onSnapshot,
    increment,
    getDoc,
} from 'firebase/firestore';
import { firestoreConnector } from '../connectors/auth/firebase/firebase-connector';
import { firebaseGenericConverter } from '@/common/helpers/firebase-generic-converter';
import { sqlModels } from '@/models/sql-models';
import { IFirestoreDataSource } from '../interfaces/firestore-data-source';
import { runObserver } from '@/common/helpers/run-observer';
import { sqlDataSourceImpl } from './sql-data-source';
import { fileSystemDataSourceImpl } from './file-system-data-source';
import { observerDataSourceImpl } from './observer-data-source';
import { downloadObservers } from '@/common/helpers/download-observers';
import { logger } from '@/logger';

export const firestoreDataSourceImpl: IFirestoreDataSource = {
    updateClientStatus: async (key: string, value: any) => {
        try {
            setDoc(
                doc(
                    firestoreConnector,
                    process.env.ORG_ID as string,
                    'client'
                ),
                {
                    [key]: value,
                },
                { merge: true }
            ).catch((error) => {
                logger.error('Error updating document: ', error);
            });
        } catch (error) {
            throw error;
        }
    },
    updateClientJobsStatus: async ({
        last_execution_date,
        last_execution_MS,
        last_result_ok,
        next_execution_date,
        observer_id,
       
    }) => {
        try {
            let should_send_recovery = false;

            let lastRegister = (
                await getDoc(
                    doc(
                        firestoreConnector,
                        process.env.ORG_ID as string,
                        'client',
                        'jobs',
                        observer_id
                    ).withConverter(
                        firebaseGenericConverter<{
                            incident_counter?: number;
                        }>()
                    )
                )
            ).data();

            if (
                +(lastRegister?.incident_counter?.toString() ?? 0) > 0 &&
                last_result_ok
            ) {
                should_send_recovery = true;
            }

            setDoc(
                doc(
                    firestoreConnector,
                    process.env.ORG_ID as string,
                    'client',
                    'jobs',
                    observer_id
                ),
                {
                    observer_id,
                    last_execution_date,
                    last_execution_MS,
                    last_result_ok,
                    next_execution_date,
                    incident_counter: last_result_ok ? 0 : increment(1),
                },
                { merge: true }
            ).catch((error) => {
                logger.error('Error updating document: ', error);
            });

            return {
                should_send_recovery,
            };
        } catch (error) {
            throw error;
        }
    },
    listenForSqlTest: async () => {
        onSnapshot(
            doc(
                firestoreConnector,
                process.env.ORG_ID as string,
                'sql-test'
            ).withConverter(
                firebaseGenericConverter<{
                    id: string;
                    query: string;
                    result?:
                        | {
                              query: { field: string; type: string }[];
                              executionMS: number;
                          }
                        | false;
                }>()
            ),
            async (snapshot): Promise<void> => {
                try {
                    let data = snapshot.data();
                    if (!snapshot.exists()) return;
                    if (!data) return;
                    if (!!data?.result) return;
                    if (typeof data?.query !== 'string') return;
                    let query = await sqlModels.test({ sql: data.query });
                    await updateDoc(
                        doc(
                            firestoreConnector,
                            process.env.ORG_ID as string,
                            'sql-test'
                        ),
                        {
                            result: query,
                            id: data.id,
                            query: data.query,
                            testing: true
                        }
                    );
                } catch (error) {
                    console.log(error);
                }
            }
        );
    },
    listenForForcedExecution: async () => {
        const updateStatus = async ({
            already_ran,
            result_ok,
            error,
        }: {
            already_ran: boolean;
            result_ok: boolean;
            error: boolean;
        }) => {
            await updateDoc(
                doc(
                    firestoreConnector,
                    process.env.ORG_ID as string,
                    'forced-execution'
                ),
                {
                    already_ran,
                    result_ok,
                    error,
                }
            );
        };
        onSnapshot(
            doc(
                firestoreConnector,
                process.env.ORG_ID as string,
                'forced-execution'
            ).withConverter(
                firebaseGenericConverter<{
                    observer_id: string;
                    already_ran?: boolean;
                    result_ok?: boolean;
                }>()
            ),
            async (snapshot): Promise<void> => {
                try {
                    let data = snapshot.data();
                    if (!snapshot.exists()) return;
                    if (!data) return;
                    if (!!!data?.observer_id) return;
                    if (typeof data?.observer_id !== 'string') return;
                    if (!!data?.already_ran) return;

                    const { sql } = await sqlDataSourceImpl({
                        fileSystemDataSource: fileSystemDataSourceImpl,
                    }).getLocalSql({ observerId: data?.observer_id });

                    const observers = await observerDataSourceImpl({
                        fileSystemDataSource: fileSystemDataSourceImpl,
                    })?.getLocalObservers();

                    const observer = observers?.find(
                        (observer) => observer.observer_id === data?.observer_id
                    );

                    if (!observer) {
                        await updateStatus({
                            already_ran: true,
                            result_ok: false,
                            error: true,
                        });
                        return;
                    }

                    let {
                        fieldRestrictionsTriggered,
                        rowRestrictionsTriggered,
                        queryResult
                    } = await runObserver(observer, {
                        observerId: data?.observer_id,
                        sql: sql,
                    });

                    await updateStatus({
                        already_ran: true,
                        result_ok:
                            !fieldRestrictionsTriggered &&
                            !rowRestrictionsTriggered,
                        error: false,
                    });
                } catch (error) {
                    console.log(error);
                    updateStatus({
                        already_ran: true,
                        result_ok: false,
                        error: true,
                    });
                }
            }
        );
    },
    listenForForcedDownload: async () => {
        onSnapshot(
            doc(
                firestoreConnector,
                process.env.ORG_ID as string,
                'forced-download'
            ).withConverter(
                firebaseGenericConverter<{
                    should_restart: boolean;
                    id: string;
                }>()
            ),
            async (snapshot): Promise<void> => {
                try {
                    let data = snapshot.data();
                    if (!snapshot.exists()) return;
                    if (!data) return;
                    if (!!!data?.should_restart) return;
                    if (typeof data?.should_restart !== 'boolean') return;
                    if (data.should_restart) {
                        await downloadObservers();
                        await updateDoc(
                            doc(
                                firestoreConnector,
                                process.env.ORG_ID as string,
                                'forced-download'
                            ),
                            {
                                should_restart: false,
                            }
                        );
                    }
                } catch (error) {
                    console.log(error);
                }
            }
        );
    },
};
