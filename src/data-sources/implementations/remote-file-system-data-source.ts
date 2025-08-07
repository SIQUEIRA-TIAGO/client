import { getDownloadURL, ref, uploadBytes, getBytes } from 'firebase/storage';
import { firebaseStorageConnector } from '../connectors/auth/firebase/firebase-connector';
import { Blob } from 'buffer';

export const remoteFileSystemDataSourceImpl = {
    uploadFile: async (file: Blob, url: string) => {
        try {
            const fileData = new Uint8Array(await file.arrayBuffer());
            let result = await uploadBytes(
                ref(firebaseStorageConnector, url),
                fileData
            );
            if (!result) {
                throw new Error('Error uploading file');
            }
        } catch (error) {
            throw error;
        }
    },
    getDownloadURL: async (path: string) => {
        try {
            return await getDownloadURL(ref(firebaseStorageConnector, path));
        } catch (error) {
            throw error;
        }
    },
    downloadFile: async (path: string): Promise<string> => {
        try {
            const file = await getBytes(ref(firebaseStorageConnector, path));
            return Buffer.from(file).toString('utf-8');
        } catch (error) {
            throw error;
        }
    },
};
