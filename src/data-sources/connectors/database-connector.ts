import '../../../config/env'; // Garante que .env está carregado
import { Sequelize } from 'sequelize';
import 'colorts/lib/string';
import oracledb from 'oracledb';
import { existsSync } from 'fs';
import path from 'path';
import { logger } from '@/logger';

// Cache das variáveis de ambiente para otimização
const DB_DATABASE = process.env.DB_DATABASE as string;
const DB_USER = process.env.DB_USER as string;
const DB_PASSWORD = process.env.DB_PASSWORD as string;
const DB_HOST = process.env.DB_HOST as string;
const DB_PORT = +(process.env.DB_PORT ?? 0) as number;
const DB_DIALECT = process.env.DB_DIALECT as 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'oracle';
const DB_SCHEMA = process.env.DB_SCHEMA;

const libDir = path.resolve(process.cwd(), "src/resources/instantclient_19_28");

if (!existsSync(libDir)) {
    logger.error('Oracle libDir not found')
    throw new Error('Oracle libDir not found:' + libDir)
} else {
    oracledb.initOracleClient({ libDir });
}

export const databaseConnection = new Sequelize(
    DB_DATABASE,
    DB_USER,
    DB_PASSWORD,
    {
        host: DB_HOST,
        port: DB_PORT,
        dialect: DB_DIALECT,
        dialectModule: DB_DIALECT === 'oracle' ? oracledb : undefined,
        schema: DB_SCHEMA || undefined,
    }
);

(async () => {
    try {
        await databaseConnection.authenticate({ logging: false });
        logger.info(
            'DATABASE: Connection has been established successfully.'.bgWhite.black
        );
    } catch (error) {
        logger.error(
            'DATABASE: Unable to connect to the database:'.bgRed,
            error
        );
    }
})();
