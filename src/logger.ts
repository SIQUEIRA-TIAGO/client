import "@/config/env"; // Carrega .env primeiro
import { createLogger, format, transports } from "winston";
import Transport from "winston-transport";
import axios from "axios";

// Cache das variáveis de ambiente para otimização
const CENTRAL_API_BASE_URL = process.env.CENTRAL_API_BASE_URL;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

export class NotifyServerTransport extends Transport {
  private static hasNotified = false;
  private static readonly COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos

  async log(info: any, callback: () => void) {
    setImmediate(() => this.emit("logged", info));

    if (NotifyServerTransport.hasNotified) {
      callback();
      return;
    }

    NotifyServerTransport.hasNotified = true;

    try {
      await axios.get(
        `${CENTRAL_API_BASE_URL}client/crash`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: ACCESS_TOKEN ? `Bearer ${ACCESS_TOKEN}` : "",
          },
        }
      );
    } catch (err) {
      console.error("Falha ao notificar servidor:", err);
    }

    // Libera para reenviar após o cooldown
    setTimeout(() => {
      NotifyServerTransport.hasNotified = false;
    }, NotifyServerTransport.COOLDOWN_MS);

    callback();
  }
}

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.colorize(),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
});

// Handlers de exceções não capturadas
logger.exceptions.handle(
  new transports.Console(),
  new transports.File({ filename: "logs/exceptions.log" }),
  new NotifyServerTransport()
);

// Handlers de rejections não tratados
logger.rejections.handle(
  new transports.Console(),
  new transports.File({ filename: "logs/rejections.log" }),
  new NotifyServerTransport()
);
