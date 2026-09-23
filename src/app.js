import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes.js";

export const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.get("/api/health", (_request, response) => response.json({ status: "ok" }));
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
  if (error.message === "Origin is not allowed by CORS.") {
    return response.status(403).json({ message: error.message });
  }
  console.error(error);
  return response
    .status(500)
    .json({ message: "An unexpected server error occurred." });
});
