import mongoose, { Document, model, Schema } from "mongoose";

export interface IPG extends Document {
  name: string;
  address: string;
  city: string;
  ownerId?: mongoose.Types.ObjectId;
  invitationCode: string;
  totalRooms: number;
  facilities: string[];
  createdAt: Date;
  updatedAt: Date;
}

const pgSchema = new Schema<IPG>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User" },
    invitationCode: { type: String, required: true, unique: true, uppercase: true },
    totalRooms: { type: Number, required: true, min: 0 },
    facilities: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const PG = model<IPG>("PG", pgSchema);
