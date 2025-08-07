import path from 'path';
import { Service } from 'node-windows';

async function startService() {
  try {
    const compiledFile = path.join(__dirname, 'server.js');

    const svc = new Service({
      name: 'Intraguard-service',
      script: compiledFile,
      nodeOptions: '--max-old-space-size=8192',
    });

    svc.on('install', () => svc.start());

    svc.install();
  } catch (err) {
    console.error('Erro ao criar o serviço:', err);
  }
}

startService();
