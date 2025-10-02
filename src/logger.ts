// logger.ts
import { createLogger, format, transports } from "winston";
import Transport from "winston-transport";
import axios from "axios";
export class NotifyServerTransport extends Transport {
  async log(info: any, callback: () => void) {
    setImmediate(() => this.emit("logged", info));
    try {
      await axios.get(
        `${process.env.CENTRAL_API_BASE_URL}client/crash`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.ACCESS_TOKEN}` || "",
          },
        }
      );
    } catch (err) {
      console.error("Falha ao notificar servidor:", err);
    }
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
