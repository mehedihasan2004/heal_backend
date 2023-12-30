import cors from "cors";
import cookieParser from "cookie-parser";
import express, { Application, NextFunction, Request, Response } from "express";

const app: Application = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get("/test", async (req: Request, res: Response) => {
  res.json("Heal server is on 🔥 💧 🔥");
});

// Handle not found
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: "Not Found!!",
    errorMessages: [{ path: req.originalUrl, message: "API Not Found!!" }],
  });

  next();
});

export default app;