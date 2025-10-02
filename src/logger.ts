// logger.ts
import { createLogger, format, transports } from "winston";
import { axiosApiConnector } from "./data-sources/connectors/axios-api-connector";

async function notifyServer() {
  try {
    await axiosApiConnector.post('/client/crash');
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
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
  exceptionHandlers: [
    new transports.Console(),
    new transports.File({ filename: 'logs/exceptions.log' }),
    notifyServer()
  ],
  rejectionHandlers: [
    new transports.Console(),
    new transports.File({ filename: 'logs/rejections.log' }),
    notifyServer()
  ]
});