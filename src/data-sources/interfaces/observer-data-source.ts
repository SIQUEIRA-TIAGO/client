import { Observer } from "@/entities/observer";
import { IFileSystemDataSource } from "@interfaces/file-system-data-source";

export type IObserverDataSource = (args: { fileSystemDataSource: IFileSystemDataSource }) => {
    getRemoteObservers: () => Promise<Observer[]>;
    getLocalObservers: () => Promise<Observer[]>;
}