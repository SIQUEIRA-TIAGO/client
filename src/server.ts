import dotenv from 'dotenv';
import path from 'path';
import { mainCron } from './main';
import { globals } from '@/common/states/globals';
import { IErrors } from './common/interfaces/errors';
import firebaseConnector from './data-sources/connectors/auth/firebase/firebase-connector';
import { firestoreDataSourceImpl } from './data-sources/implementations/firestore-data-source';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

//TODO:
// - Verify if data is synced with server by sending integrity check
// - Verify if data is synced locally by comparing file contents | OK
// - endpoints informing if server is working properly, next update time, etc
// - verify if current queries are ocuppying the entire cron time-window and if it's possible to run more queries
// - auto update
// - auto install
// - auto start
// - security and flood protection - CORS
// - micro-service authentification and authorization | OK

(async () => {
    try {  
        if (!process.env.ACCESS_TOKEN)
            throw {
                origin: '.env',
                message: 'Error while connecting to searching for .env variables',
            } as IErrors;
        globals.access_token = process.env.ACCESS_TOKEN;
        await firebaseConnector();
        firestoreDataSourceImpl.listenForSqlTest();
        firestoreDataSourceImpl.listenForForcedExecution();
        firestoreDataSourceImpl.listenForForcedDownload();
        mainCron()?.start();
    } catch (error: IErrors | any) {
        console.error(error);
        if (!('origin' in error)) return;
        if (error.origin == '.env') process.exit(1);
    }
})();
