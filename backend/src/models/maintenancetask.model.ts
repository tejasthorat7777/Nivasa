import mongoose, { Document, model, Schema } from "mongoose";

export interface IMaintenanceTask extends Document {
  pgId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: "ELECTRICAL" | "PLUMBING" | "HVAC" | "CLEANING" | "OTHER";
  location: string;
  assignedTo?: mongoose.Types.ObjectId;
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: Date;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  completedAt?: Date;
}

const maintenanceTaskSchema = new Schema<IMaintenanceTask>(
  {
    pgId: { type: Schema.Types.ObjectId, ref: "PG", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: ["ELECTRICAL", "PLUMBING", "HVAC", "CLEANING", "OTHER"], required: true },
    location: { type: String, required: true, trim: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ["PENDING", "IN_PROGRESS", "COMPLETED"], default: "PENDING" },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

maintenanceTaskSchema.index({ pgId: 1, status: 1 });
maintenanceTaskSchema.index({ assignedTo: 1, status: 1 });

export const MaintenanceTask = model<IMaintenanceTask>("MaintenanceTask", maintenanceTaskSchema);