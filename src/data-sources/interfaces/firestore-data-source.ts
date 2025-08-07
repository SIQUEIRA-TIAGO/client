export interface IFirestoreDataSource {
    updateClientStatus: (key: string, value: any) => Promise<void>;
    updateClientJobsStatus: (args: {
        observer_id: string;
        last_execution_date: number;
        last_result_ok: boolean;
        last_execution_MS: number;
        next_execution_date: number;
      
    }) => Promise<{
        should_send_recovery: boolean;
    }>;
    listenForSqlTest: () => Promise<void>;
    listenForForcedExecution: () => Promise<void>
    listenForForcedDownload: () => Promise<void>
    
}
