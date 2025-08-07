export interface IFileSystemDataSource {
    getJson: <T extends object>(args: {where: string}) => Promise<T>;
    saveJson: (args: {where: string, what: string}) => Promise<void>;
    
}