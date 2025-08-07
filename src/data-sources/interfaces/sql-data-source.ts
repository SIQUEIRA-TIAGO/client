import { IFileSystemDataSource } from "@interfaces/file-system-data-source";

export type ISqlDataSource = (args: { fileSystemDataSource: IFileSystemDataSource }) => {
    //getRemoteSql: (path: string) => Promise<string>;
    //getRemoteSqls: () => ;
    getLocalSql: (args: {observerId: string}) => Promise<{observerId: string, sql: string}>;
    getRemoteSql: (args: {url: string}) => Promise<string>;
}