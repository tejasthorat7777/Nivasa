import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import announcementRoutes from "./routes/announcement.routes";
import authRoutes from "./routes/auth.routes";
import checkoutRoutes from "./routes/checkout.routes";
import equipmentRoutes from "./routes/equipment.routes";
import pgRoutes from "./routes/pg.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    success: databaseReady,
    status: databaseReady ? "ok" : "degraded",
    database: databaseReady ? "connected" : "disconnected",
  });
});

app.use("/api", (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database is unavailable",
    });
  }
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/pg", pgRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api", checkoutRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

export default app;
