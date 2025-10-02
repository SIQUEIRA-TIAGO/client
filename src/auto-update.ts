import { exec } from "child_process";
import simpleGit from "simple-git";
import cron from "node-cron";
import path from "path";
import { logger } from "./logger";

const git = simpleGit({
    binary: path.join(process.cwd(), 'resources', 'PortableGit', 'bin', 'git.exe'),
    unsafe: { allowUnsafeCustomBinary: true }
});

async function updateRepoAndBuild() {
    try {
        logger.info(`[${new Date().toISOString()}] Iniciando atualização...`);

        await git.pull();
        logger.info("✔ Repositório atualizado com sucesso");

        exec("npm run build", { cwd: process.cwd() }, (buildErr, buildStdout, buildStderr) => {
            if (buildErr) {
                logger.error("❌ Erro no build:", buildErr);
                return;
            }
            logger.info("✔ Build concluído");
            logger.info(buildStdout);
            if (buildStderr) logger.error(buildStderr);
        });

        exec("npm run restart-service", { cwd: process.cwd() }, (restartErr, restartStdout, restartStderr) => {
            if (restartErr) {
                logger.error("❌ Erro ao reiniciar serviço:", restartErr);
                return;
            }
            logger.info("🔄 Serviço reiniciado com sucesso");
            logger.info(restartStdout);
            if (restartStderr) logger.error(restartStderr);
        });
    } catch (error) {
        logger.error("❌ Erro na atualização:", error);
    }
}

// Agendamento: todos os dias às 00:00
cron.schedule("0 0 * * *", updateRepoAndBuild);
