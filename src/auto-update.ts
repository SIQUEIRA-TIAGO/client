import { exec } from "child_process";
import simpleGit from "simple-git";
import cron from "cron";
import path from "path";

const git = simpleGit({
    binary: path.join(process.cwd(), 'resources', 'PortableGit', 'bin', 'git.exe'),
    unsafe: { allowUnsafeCustomBinary: true }
});

async function updateRepoAndBuild() {
    try {
        console.log(`[${new Date().toISOString()}] Iniciando atualização...`);

        await git.pull();
        console.log("✔ Repositório atualizado com sucesso");

        exec("npm run build", { cwd: process.cwd() }, (buildErr, buildStdout, buildStderr) => {
            if (buildErr) {
                console.error("❌ Erro no build:", buildErr);
                return;
            }
            console.log("✔ Build concluído");
            console.log(buildStdout);
            if (buildStderr) console.error(buildStderr);
        });

        exec("npm run restart-service", { cwd: process.cwd() }, (restartErr, restartStdout, restartStderr) => {
            if (restartErr) {
                console.error("❌ Erro ao reiniciar serviço:", restartErr);
                return;
            }
            console.log("🔄 Serviço reiniciado com sucesso");
            console.log(restartStdout);
            if (restartStderr) console.error(restartStderr);
        });
    } catch (error) {
        console.error("❌ Erro na atualização:", error);
    }
}

// Agendamento: todos os dias às 00:00
const job = cron.CronJob.from({
    cronTime: "0 0 * * *",
    onTick: updateRepoAndBuild
});

job.start()
