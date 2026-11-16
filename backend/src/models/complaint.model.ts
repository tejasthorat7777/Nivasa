import mongoose, { Document, model, Schema } from "mongoose";

export interface IComplaint extends Document {
  pgId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  category: "MAINTENANCE" | "CLEANING" | "FOOD" | "NOISE" | "OTHER";
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  assignedTo?: mongoose.Types.ObjectId;
  resolutionNotes?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

const complaintSchema = new Schema<IComplaint>(
  {
    pgId: { type: Schema.Types.ObjectId, ref: "PG", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    category: { type: String, enum: ["MAINTENANCE", "CLEANING", "FOOD", "NOISE", "OTHER"], required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], required: true },
    status: { type: String, enum: ["OPEN", "IN_PROGRESS", "RESOLVED"], default: "OPEN" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    resolutionNotes: { type: String },
  },
  { timestamps: true }
);

complaintSchema.index({ studentId: 1, status: 1 });
complaintSchema.index({ pgId: 1, status: 1 });
complaintSchema.index({ assignedTo: 1 });

export const Complaint = model<IComplaint>("Complaint", complaintSchema);