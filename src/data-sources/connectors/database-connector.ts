import { Sequelize } from 'sequelize';
import 'colorts/lib/string';
import dotenv from 'dotenv';
import path from 'path';
import oracledb from 'oracledb';
import { existsSync } from 'fs';
import { logger } from '@/logger';

const cwd = process.cwd();
dotenv.config({ path: path.join(cwd, '.env') });
const libDir = path.resolve(cwd, "src/resources/instantclient_19_28");

if (!existsSync(libDir)) {
    logger.error('Orable libDir not found')
    throw new Error('Oracle libDir not found:' + libDir)
} else {
    oracledb.initOracleClient({ libDir });
}

export const databaseConnection = new Sequelize(
    process.env.DB_DATABASE as string,
    process.env.DB_USER as string,
    process.env.DB_PASSWORD as string,
    {
        host: process.env.DB_HOST as string,
        port: +(process.env.DB_PORT ?? 0) as number,
        dialect: process.env.DB_DIALECT as
            | 'mysql'
            | 'postgres'
            | 'sqlite'
            | 'mariadb'
            | 'mssql'
            | 'oracle',
        dialectModule:
            process.env.DB_DIALECT == 'oracle' ? oracledb : undefined,
        schema: process.env.DB_SCHEMA || undefined,
    }
);

(async () => {
    try {
        await databaseConnection.authenticate({ logging: false });
        logger.info(
            'DATABASE: Connection has been established successfully.'.bgBlue
        );
    } catch (error) {
        logger.error(
            'DATABASE: Unable to connect to the database:'.bgRed,
            error
        );
    }
})();
