import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

import { globals } from '@/common/states/globals';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const axiosApiConnector = (() => {
    let connector = axios.create({
        baseURL: process.env.CENTRAL_API_BASE_URL,
        headers: {
            'Content-Type': 'application/json',
        },
    });
    connector.interceptors.request.use((config) => {
        if (config?.headers)
            config.headers.Authorization = `Bearer ${globals.access_token}`;
        return config;
    });

    //if response is ok
    connector.interceptors.response.use(
        (response) => {
            globals.last_api_req_time = Date.now().valueOf();
            return response;
        }
    );

    return connector;
})();
