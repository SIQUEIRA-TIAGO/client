// logger.ts
import { createLogger, format, transports } from "winston";
import axios from "axios";

async function notifyServer() {
  try {
    await axios.post(
      `${process.env.CENTRAL_API_BASE_URL}client/crash`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.ACCESS_TOKEN || "",
        },
      }
    );
  } catch (err) {
    console.error("Falha ao notificar servidor:", err);
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
  new transports.File({ filename: "logs/exceptions.log" })
);

// Handlers de rejections não tratados
logger.rejections.handle(
  new transports.Console(),
  new transports.File({ filename: "logs/rejections.log" })
);

// Ouvindo eventos para notificar o servidor
logger.on("uncaughtException", (err) => {
  notifyServer();
});

logger.on("unhandledRejection", (reason) => {
  notifyServer();
});
