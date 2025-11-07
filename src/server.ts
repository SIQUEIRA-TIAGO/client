import dotenv from 'dotenv';
import path from 'path';
import { mainCron } from './main';
import { globals } from '@/common/states/globals';
import { IErrors } from './common/interfaces/errors';
import firebaseConnector from './data-sources/connectors/auth/firebase/firebase-connector';
import { firestoreDataSourceImpl } from './data-sources/implementations/firestore-data-source';
//import "./auto-update"
import { logger } from './logger';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
//TODO:
// - endpoints informing if server is working properly, next update time, etc
// - verify if current queries are ocuppying the entire cron time-window and if it's possible to run more queries
// - auto update

const configureAccessToken = (): void => {
    if (!process.env.ACCESS_TOKEN) {
        throw {
            origin: '.env',
            message: 'Error while connecting to searching for .env variables',
        } as IErrors;
    }
    globals.access_token = process.env.ACCESS_TOKEN;
};

const initializeDataSources = async (): Promise<void> => {
    await firebaseConnector();
    firestoreDataSourceImpl.listenForSqlTest();
    firestoreDataSourceImpl.listenForForcedExecution();
    firestoreDataSourceImpl.listenForForcedDownload();
};

const initializeServer = async (): Promise<void> => {
    try {
        configureAccessToken();
        await initializeDataSources();

        const cronJob = mainCron();
        if (cronJob) {
            cronJob.start();
        }
    } catch (error: any) {
        if (error?.origin === '.env') {
            logger.error('Error in .env configuration', error);
        } else {
            logger.error('Unexpected error in server initialization', error);
        }
    }
};

initializeServer()

process.on("uncaughtException", (err) => {
    logger.error(`Uncaught Exception HEEERE: ${err.stack || err.message}`);
});

process.on("unhandledRejection", (reason) => {
    logger.error(`Unhandled Rejection HEERE: ${reason}`);
});