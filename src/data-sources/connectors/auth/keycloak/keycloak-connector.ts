import dotenv from 'dotenv';
import path from 'path';
import { axiosApiConnector } from '../../axios-api-connector';
import { globals } from '@/common/states/globals';
import 'colorts/lib/string';
import queryString from 'node:querystring';
import axios from 'axios';
import { IErrors } from '@/common/interfaces/errors';

dotenv.config({ path: path.join(process.cwd(), '../../', '.env') });

export const keycloakConnector = async (): Promise<string> => {
    try {
        const response = await axios.post<{ access_token: string }>(
            `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
            queryString.stringify({
                grant_type: 'client_credentials',
                client_id: process.env.KEYCLOAK_CLIENT_ID,
                client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        if (!response)
            throw {
                origin: 'keycloak',
                message: 'Error while connecting to keycloak',
            } as IErrors;

        console.log('KEYCLOAK: Successfully connected to Keycloak'.bgBlue);
           
        globals.keycloak_token = response.data?.access_token;

        return response.data.access_token;
    } catch (error:
        | { data: { error_description: string; error: string } }
        | any) {
        throw {
            message: 'KEYCLOAK: Error while connecting',
            origin: 'keycloak',
            originalError: error
        } as IErrors;
    }
};
