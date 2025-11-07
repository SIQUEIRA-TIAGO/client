export interface IFirestoreDataSource {
    listenForSqlTest: () => Promise<void>;
    listenForForcedExecution: () => Promise<void>
    listenForForcedDownload: () => Promise<void>
}
