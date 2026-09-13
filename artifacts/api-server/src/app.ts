import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const httpServer = createServer(app);

export const io = new SocketIOServer(httpServer, {
  path: "/api/ws",
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "WebSocket client connected");

  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, "WebSocket client disconnected");
  });
});

// Emit simulated real-time metrics every 10 seconds
setInterval(() => {
  io.emit("metrics:update", {
    timestamp: new Date().toISOString(),
    cpuLoad: Math.random() * 40 + 20,
    networkIn: Math.random() * 1000 + 200,
    networkOut: Math.random() * 600 + 100,
    activeConnections: Math.floor(Math.random() * 50) + 10,
  });
}, 10000);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export { httpServer };
export default app;
