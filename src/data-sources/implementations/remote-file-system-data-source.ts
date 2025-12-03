import { ref, getBytes } from 'firebase/storage';
import { firebaseStorageConnector } from '../connectors/auth/firebase/firebase-connector';

export const remoteFileSystemDataSourceImpl = {
    downloadFile: async (path: string): Promise<string> => {
        try {
            const file = await getBytes(ref(firebaseStorageConnector, path));
            return Buffer.from(file).toString('utf-8');
        } catch (error) {
            throw error;
        }
    },
};
