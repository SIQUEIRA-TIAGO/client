import { AxiosError } from "axios";

export interface IErrors{
    origin: 'keycloak' | 'api' | 'db' | 'cron' | 'observer' | 'fs' | `${string}.${string}` | 'firebase';
    message: string;
    originalError?: AxiosError;
}