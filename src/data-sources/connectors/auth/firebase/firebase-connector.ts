import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {getStorage} from 'firebase/storage'
import {
    getAuth,
    signInWithCustomToken,
    onAuthStateChanged,
} from 'firebase/auth';
import { axiosApiConnector } from '../../axios-api-connector';
import { IErrors } from '@/common/interfaces/errors';
import { globals } from '@/common/states/globals';
import { logger } from '@/logger';

const firebaseConfig = {
    apiKey: 'AIzaSyDPvt6II8VgVvoq9c4eEroUzgdKl-6YZHw',
    authDomain: 'intraguard-6452c.firebaseapp.com',
    projectId: 'intraguard-6452c',
    storageBucket: 'intraguard-6452c.appspot.com',
    messagingSenderId: '495035776927',
    appId: '1:495035776927:web:d559ab98396a83b0af87aa',
    measurementId: 'G-W1HW7TEB78',
};

const app = initializeApp(firebaseConfig);

onAuthStateChanged(getAuth(app), (user) => {
    const interval = setInterval(() => {
        authenticateThroughApi()
            .then(() => {
                console.log('FIREBASE: User authenticated'.bgBlue);
            })
            .catch((error) => {
                logger.error(
                    'FIREBASE: Error while authenticating on firebase through main api, trying again in 10 minutes...'
                        .bgRed
                );
            });
    }, 1000 * 60 * 10);

    if (user) {
        console.log('FIREBASE: User authenticated on firebase'.bgBlue);
        globals.is_auth_firebase = true;
        clearInterval(interval);
    }else{
        globals.is_auth_firebase = false;
    }
});

const authenticateThroughApi = async () => {
    try {
        let result = (await axiosApiConnector.get('client/firebase/token'))
            .data as { payload: { token: string } };
        const auth = getAuth(app);
        await signInWithCustomToken(auth, result.payload.token);
    } catch (error) {
        throw {
            message: 'FIREBASE: Error while authenticating through main api',
            originalError: error,
            origin: 'firebase',
        } as IErrors;
    }
};

export default authenticateThroughApi;

export const firestoreConnector = getFirestore(app);

export const firebaseStorageConnector = getStorage(app);
