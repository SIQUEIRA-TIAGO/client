declare namespace NodeJS {
    export interface ProcessEnv {
        API_HTTP_PORT: string;
        CENTRAL_API_BASE_URL: string;
        APPLICATION_GMAIL: string;
        APPLICATION_GMAIL_APP_PASSWORD: string;
        DB_DATABASE: string
        DB_USER: string
        DB_PASSWORD: string
        DB_HOST: string
        DB_PORT: string
        DB_DIALECT: string
        ACCESS_TOKEN: string;
        ORG_ID: string;
    }
}

declare namespace Express {
    export interface Request {
        
    }
}
