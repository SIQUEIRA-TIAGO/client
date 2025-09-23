// logger.ts
import { createLogger, format, transports } from "winston";
import path from "path";
import fs from "fs";

// Garante que a pasta logs exista
const logsDir = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logPath = path.join(logsDir, "service.log");

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: logPath, maxsize: 5_000_000, maxFiles: 5 }),
  ],
});

// Redireciona console.log / console.error para o logger
console.log = (...args: any[]) => logger.info(args.join(" "));
console.error = (...args: any[]) => logger.error(args.join(" "));
console.warn = (...args: any[]) => logger.warn(args.join(" "));

// Captura erros globais
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.stack || err.message}`);
});

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});
