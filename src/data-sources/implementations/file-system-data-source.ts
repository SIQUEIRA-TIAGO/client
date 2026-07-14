import { IErrors } from '@/common/interfaces/errors';
import { logger } from '@/logger';
import { IFileSystemDataSource } from '@interfaces/file-system-data-source';
import fs from 'fs-extra';

export const fileSystemDataSourceImpl: IFileSystemDataSource = {
    getJson: async ({ where }) => {
        try {
            return JSON.parse(await fs.readFile(where, { encoding: 'utf-8' }));
        } catch (err) {
            logger.info(err);
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
    saveJsonAtomic: async ({ where, what }) => {
        // Escreve em .tmp e faz rename: leitores concorrentes nunca veem
        // o arquivo vazio ou pela metade
        try {
            const tmp = `${where}.tmp`;
            await fs.outputFile(tmp, what, { encoding: 'utf-8' });
            await fs.move(tmp, where, { overwrite: true });
        } catch {
            throw { message: 'Error saving file', origin: 'fs' } as IErrors;
        }
    },
};
