import dotenv from 'dotenv';
import path from 'path';
import { mainCron } from './main';
import { keycloakConnector } from './data-sources/connectors/auth/keycloak/keycloak-connector';
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
        await keycloakConnector();
        await firebaseConnector();
        firestoreDataSourceImpl.listenForSqlTest();
        firestoreDataSourceImpl.listenForForcedExecution();
        firestoreDataSourceImpl.listenForForcedDownload();
        mainCron()?.start();
    } catch (error: IErrors | any) {
        console.error(error);
        if (!('origin' in error)) return;
        if (error.origin == 'keycloak') process.exit(1);
    }
})();
