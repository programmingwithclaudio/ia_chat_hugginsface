// server/src/app.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectToDatabase } from "./config/mongo.db.js";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.routes.js";
import session from "express-session";

const app = express();

// Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      domain:
        process.env.NODE_ENV === "production" ? ".tudominio.com" : "localhost",
    },
  })
);

// Rutas
app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("API is running...");
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Connect to MongoDB
connectToDatabase()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  });

export default app;
