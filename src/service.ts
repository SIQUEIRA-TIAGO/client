import path from "path";
import { Service } from "node-windows";

const serviceName = "Intraguard-service";
  const compiledFile = path.join(__dirname, "server.js");

  const svc = new Service({
    name: serviceName,
    script: compiledFile,
    nodeOptions: "--max-old-space-size=8192",
  });

// Função para instalar e iniciar o serviço
function installAndStart() {
  svc.on("install", () => {
    console.log("✔ Serviço instalado, iniciando...");
    svc.start();
  });
  svc.install();
}

function restartService() {
  console.log("🔄 Reiniciando serviço...");
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