import path from "path";
import { EventLogger, Service } from "node-windows";

const serviceName = "Intraguard-service";
const compiledFile = path.join(__dirname, "server.js");
const  log  =  new  EventLogger()

const svc = new Service({
  name: serviceName,
  script: compiledFile,
  nodeOptions: "--max-old-space-size=8192",
  logpath: path.join(__dirname, "logs"),
  wait: 2,
  grow: 0.25,
  maxRestarts: 5,
  abortOnError: false,
  stopparentfirst: true,
});

// Função para instalar e iniciar o serviço
function installAndStart() {
  svc.on("install", () => {
    log.info("✔ Serviço instalado, iniciando...");
    svc.start();
  });
  svc.install();
}

function restartService() {
  log.info("🔄 Reiniciando serviço...");
  svc.restart();
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