import { Sequelize } from 'sequelize';
import 'colorts/lib/string';
import dotenv from 'dotenv';
import path from 'path';
import oracledb from 'oracledb';

//dotenv.config({ path: path.resolve(process.cwd(), '../../../../../.env') });

dotenv.config({ path: path.join(__dirname, '../../../.env') });

dotenv.config({ path: path.join(__dirname, '../../../.env') });
oracledb.initOracleClient({ libDir: path.join(__dirname, '../../resources/instantclient-basiclite-windows.x64-19.28.0.0.0dbru/instantclient_19_28') });

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
    }
);

(async () => {
    try {
        await databaseConnection.authenticate({ logging: false });
        console.log(
            'DATABASE: Connection has been established successfully.'.bgBlue
        );
    } catch (error) {
        console.error(
            'DATABASE: Unable to connect to the database:'.bgRed,
            error
        );
    }
})();
