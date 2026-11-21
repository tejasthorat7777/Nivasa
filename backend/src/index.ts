import "dotenv/config";
import mongoose from "mongoose";
import app from "./app";
import { MONGODB_URI, PORT } from "./config/db.config";

let shuttingDown = false;
let retryTimer: NodeJS.Timeout | undefined;

const connectToDatabase = async (): Promise<void> => {
  if (shuttingDown) {
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");
  } catch (error: unknown) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`MongoDB connection failed (${errorName}); retrying in 5 seconds.`);
    if (!shuttingDown) {
      retryTimer = setTimeout(() => void connectToDatabase(), 5000);
    }
  }
};

const startServer = () => {
  const port = Number(PORT);
  const server = app.listen(port, () => {
    console.log(`Nivasa backend listening on port ${port}`);
  });

  const shutdown = () => {
    shuttingDown = true;
    if (retryTimer) {
      clearTimeout(retryTimer);
    }
    server.close(() => {
      void mongoose.disconnect();
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  void connectToDatabase();
};

try {
  startServer();
} catch (error: unknown) {
  const errorName = error instanceof Error ? error.name : "UnknownError";
  console.error(`Backend startup failed (${errorName}). Check the PORT setting.`);
  process.exitCode = 1;
}
