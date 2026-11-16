import mongoose, { Document, model, Schema } from "mongoose";

export interface IEquipment extends Document {
  pgId: mongoose.Types.ObjectId;
  name: string;
  category: "ELECTRICAL" | "PLUMBING" | "FURNITURE" | "HVAC" | "OTHER";
  location: string;
  status: "WORKING" | "NOT_WORKING" | "MAINTENANCE";
  lastChecked: Date;
  reportedBy: mongoose.Types.ObjectId;
  reportedAt: Date;
}

const equipmentSchema = new Schema<IEquipment>(
  {
    pgId: { type: Schema.Types.ObjectId, ref: "PG", required: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["ELECTRICAL", "PLUMBING", "FURNITURE", "HVAC", "OTHER"],
      required: true,
    },
    location: { type: String, required: true },
    status: {
      type: String,
      enum: ["WORKING", "NOT_WORKING", "MAINTENANCE"],
      default: "WORKING",
    },
    lastChecked: { type: Date, default: Date.now },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reportedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

equipmentSchema.index({ pgId: 1, status: 1 });

export const Equipment = model<IEquipment>("Equipment", equipmentSchema);