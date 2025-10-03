import path from "path";
import { EventLogger, Service } from "node-windows";

const serviceName = "Intraguard-service";
const compiledFile = path.join(__dirname, "server.js");

const log = new EventLogger({ source: serviceName });

const svc = new Service({
  name: serviceName,
  description: "Intraguard Node service",
  script: compiledFile,
  nodeOptions: ["--max-old-space-size=8192"],
  wait: 2,
  grow: 0.25,
  maxRestarts: 5,
  abortOnError: false,
  stopparentfirst: true,
});

svc.on("error", (err) => log.error(`Erro: ${err?.message || err}`));
svc.on("install", () => { log.info("✔ Serviço instalado."); svc.start(); });
svc.on("alreadyinstalled", () => { log.warn("⚠ Já instalado. Iniciando..."); svc.start(); });
svc.on("invalidinstallation", () => log.error("Instalação inválida."));
svc.on("start", () => log.info("🚀 Serviço iniciado."));
svc.on("stop", () => log.info("🛑 Serviço parado."));

function installAndStart() {
  if (svc.exists) {
    log.info("Serviço já existe. Reinstalando...");
    svc.start();
  } else {
    log.info("Instalando serviço...");
    svc.install();
  }
}

function restartService() {
  log.info("🔄 Reiniciando serviço...");
  if (!svc.exists) {
    log.warn("Serviço não encontrado. Instalando e iniciando...");
    svc.on("install", () => svc.start());
    svc.install();
  } else {
    svc.restart();
  }
}

// --- CLI ---
const arg = process.argv[2];
switch (arg) {
  case "--start":
    installAndStart();
    break;
  case "--restart":
    restartService();
    break;
  default:
    console.log("Uso: node service --start | --restart");
    break;
}
