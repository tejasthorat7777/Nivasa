import mongoose, { Document, model, Schema } from "mongoose";

export interface IAnnouncement extends Document {
  pgId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  targetAudience: "ALL" | "LANDLORD" | "MANAGER" | "STUDENT";
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    pgId: { type: Schema.Types.ObjectId, ref: "PG", required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    targetAudience: { type: String, enum: ["ALL", "LANDLORD", "MANAGER", "STUDENT"], required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

announcementSchema.index({ pgId: 1, createdAt: -1 });

export const Announcement = model<IAnnouncement>("Announcement", announcementSchema);