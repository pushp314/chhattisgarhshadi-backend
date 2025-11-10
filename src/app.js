import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { Server } from "socket.io";
import { rateLimiter } from "./middleware/rate-limiter.middleware.js";
import { errorHandler } from "./middleware/error-handler.middleware.js";
import { config } from "./config/config.js";
import api from "./api/index.js";

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.CORS_ORIGIN,
    credentials: true,
  },
});

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(helmet());
app.use(rateLimiter);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

// API routes
app.use("/api/v1", api);

app.use(errorHandler);

export { httpServer, io };
