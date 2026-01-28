import '@/config/env'; // Garante que .env está carregado
import { Sequelize } from 'sequelize';
import 'colorts/lib/string';
import { existsSync } from 'fs';
import path from 'path';
import { logger } from '@/logger';

// Configuração CRÍTICA do PATH para Oracle Client
// DEVE ser configurado ANTES de qualquer import do oracledb
// Windows precisa ter as DLLs no PATH para carregar dependências
// Usando IC 19 para melhor compatibilidade com Windows Server 2012 R2
const libDir = path.resolve(process.cwd(), "resources/instantclient_19_29");
const DB_DIALECT_PRE = process.env.DB_DIALECT;

if (DB_DIALECT_PRE === 'oracle' && existsSync(libDir)) {
    const currentPath = process.env.PATH || '';
    if (!currentPath.includes(libDir)) {
        process.env.PATH = `${libDir};${currentPath}`;
        // Note: Este log não aparece porque logger ainda não foi importado
        // Mas o PATH está configurado corretamente
    }
}

// Agora sim importa oracledb - o PATH já está configurado
import oracledb from 'oracledb';

// Cache das variáveis de ambiente para otimização
const DB_DATABASE = process.env.DB_DATABASE as string;
const DB_USER = process.env.DB_USER as string;
const DB_PASSWORD = process.env.DB_PASSWORD as string;
const DB_HOST = process.env.DB_HOST as string;
const DB_PORT = +(process.env.DB_PORT ?? 0) as number;
const DB_DIALECT = process.env.DB_DIALECT as 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'oracle';
const DB_SCHEMA = process.env.DB_SCHEMA;

// Inicializa Oracle Client apenas se o dialeto for Oracle
if (DB_DIALECT === 'oracle') {
    if (!existsSync(libDir)) {
        const errorMsg = `Oracle Instant Client directory searched, but not found at: ${libDir}`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
    }
    
    // Garante que o PATH está configurado (redundante mas garante)
    const currentPath = process.env.PATH || '';
    if (!currentPath.includes(libDir)) {
        process.env.PATH = `${libDir};${currentPath}`;
        logger.info(`Oracle Client directory added to PATH: ${libDir}`);
    }
    
    try {
        logger.info('Initializing Oracle Client from: ' + ` ${libDir}`);
        logger.info('Node.js architecture: ' + process.arch);
        logger.info('Platform: ' + process.platform);
        logger.info('PATH configured: ' + (process.env.PATH?.includes(libDir) ? 'Yes' : 'No'));

        oracledb.initOracleClient({ libDir });
        logger.info('Oracle Client initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize Oracle Client'.bgRed, error);
        logger.error('Error details:', JSON.stringify(error, null, 2));
        logger.error('\n=== Troubleshooting Steps ===');
        logger.error('1. Check if Visual C++ Runtime DLLs exist in instantclient folder:');
        logger.error('   - msvcp140.dll');
        logger.error('   - vcruntime140.dll');
        logger.error('   - vcruntime140_1.dll');
        logger.error('2. Run: .\\copy-vcruntime-dlls.ps1 to copy missing DLLs');
        logger.error('3. Run: .\\diagnose-oracle.ps1 for detailed diagnostics');
        logger.error('4. Verify Node.js and Oracle Client match (both 64-bit or both 32-bit)');
        throw error;
    }
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
