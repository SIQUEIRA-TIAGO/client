import { IErrors } from '@/common/interfaces/errors';
import { IFileSystemDataSource } from '@interfaces/file-system-data-source';
import fs from 'fs-extra';

export const fileSystemDataSourceImpl: IFileSystemDataSource = {
    getJson: async ({ where }) => {
        try {
            return JSON.parse(await fs.readFile(where, { encoding: 'utf-8' }));
        } catch (err) {
            console.log(err);
            throw { message: 'Error getting file', origin: 'fs' } as IErrors;
        }
    },
    saveJson: async ({ where, what }) => {
        try {
            await fs.createFile(where);
            return fs.writeFile(where, what, { encoding: 'utf-8' });
        } catch {
            throw { message: 'Error saving file', origin: 'fs' } as IErrors;
        }
    },
};
