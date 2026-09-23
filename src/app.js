import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import { allowedOrigins, env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import authRoutes from "./routes/auth.routes.js";

export const app = express();

app.set("trust proxy", 1);

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS."));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// Vercel serverless requests need a database connection, but CORS preflight
// and the basic health endpoint must remain available without MongoDB.
app.use(async (request, _response, next) => {
  if (request.method === "OPTIONS" || request.path === "/api/health") {
    return next();
  }

  try {
    await connectDatabase();
    return next();
  } catch (error) {
    return next(error);
  }
});

app.get("/api/health", (_request, response) =>
  response.json({ status: "ok" }),
);

const authAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === "test" ? 1000 : 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many authentication attempts. Try again in 15 minutes.",
  },
});

app.use("/api/auth/register", authAttemptLimiter);
app.use("/api/auth/login", authAttemptLimiter);
app.use("/api/auth/refresh", authAttemptLimiter);
app.use("/api/auth", authRoutes);

app.use((_request, response) =>
  response.status(404).json({ message: "Route not found." }),
);

app.use((error, _request, response, _next) => {
  console.error(error);
  if (error.message === "Origin is not allowed by CORS.") {
    return response.status(403).json({ message: error.message });
  }
  if (error.name === "MongooseServerSelectionError") {
    return response
      .status(503)
      .json({ message: "Database is temporarily unavailable." });
  }
  return response
    .status(500)
    .json({ message: "An unexpected server error occurred." });
});
