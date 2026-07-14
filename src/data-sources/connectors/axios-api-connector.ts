import '@/config/env'; // Garante que .env está carregado
import axios from 'axios';
import { globals } from '@/common/states/globals';

// Cache da variável de ambiente para otimização
const CENTRAL_API_BASE_URL = process.env.CENTRAL_API_BASE_URL;
const API_TIMEOUT_MS = +(process.env.API_TIMEOUT_MS ?? 30_000);

export const axiosApiConnector = (() => {
    let connector = axios.create({
        baseURL: CENTRAL_API_BASE_URL,
        timeout: API_TIMEOUT_MS,
        headers: {
            'Content-Type': 'application/json',
        },
    });
    connector.interceptors.request.use((config) => {
        if (config?.headers)
            config.headers.Authorization = `Bearer ${globals.access_token}`;
        return config;
    });

    connector.interceptors.response.use(
        (response) => {
            globals.last_api_req_time = Date.now().valueOf();
            return response;
        }
    );

    return connector;
})();