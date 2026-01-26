import dotenv from 'dotenv';
import path from 'path';

// Carrega o .env uma única vez antes de qualquer outra importação
// Garante que process.env esteja populado em todo o aplicativo
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Validação básica de variáveis críticas
const requiredEnvVars = [
    'ACCESS_TOKEN',
    'CENTRAL_API_BASE_URL',
    'DB_DATABASE',
    'DB_USER',
    'DB_PASSWORD',
    'DB_HOST',
    'DB_PORT',
    'DB_DIALECT',
    'ORG_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error(`❌ ERRO: Variáveis de ambiente faltando: ${missingVars.join(', ')}`);
    console.error(`   Arquivo .env esperado em: ${envPath}`);
    process.exit(1);
}
