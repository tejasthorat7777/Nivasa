import mongoose, { Document, model, Schema } from "mongoose";

export interface IRoom extends Document {
  pgId: mongoose.Types.ObjectId;
  roomNumber: number;
  floor: number;
  sharingType: "SINGLE" | "DOUBLE" | "TRIPLE";
  capacity: number;
  monthlyRent: number;
  occupiedBeds: number;
  status: "AVAILABLE" | "OCCUPIED" | "PARTIALLY_OCCUPIED" | "NOTICE_GIVEN" | "MAINTENANCE";
  facilities: string[];
}

const roomSchema = new Schema<IRoom>(
  {
    pgId: { type: Schema.Types.ObjectId, ref: "PG", required: true },
    roomNumber: { type: Number, required: true },
    floor: { type: Number, required: true },
    sharingType: { type: String, enum: ["SINGLE", "DOUBLE", "TRIPLE"], required: true },
    capacity: { type: Number, required: true },
    monthlyRent: { type: Number, required: true },
    occupiedBeds: { type: Number, default: 0 },
    status: { type: String, enum: ["AVAILABLE", "OCCUPIED", "PARTIALLY_OCCUPIED", "NOTICE_GIVEN", "MAINTENANCE"], default: "AVAILABLE" },
    facilities: [{ type: String }],
  },
  { timestamps: true }
);

roomSchema.index({ pgId: 1, status: 1 });

export const Room = model<IRoom>("Room", roomSchema);