import mongoose, { Document, model, Schema } from "mongoose";

export interface ICheckoutRequest extends Document {
  pgId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  expectedCheckoutDate: Date;
  reason: string;
  status: "PENDING" | "APPROVED" | "CONFIRMED" | "REJECTED";
  approvedBy?: mongoose.Types.ObjectId;
  actualCheckoutDate?: Date;
}

const checkoutRequestSchema = new Schema<ICheckoutRequest>(
  {
    pgId: { type: Schema.Types.ObjectId, ref: "PG", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    expectedCheckoutDate: { type: Date, required: true },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "CONFIRMED", "REJECTED"], default: "PENDING" },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    actualCheckoutDate: { type: Date },
  },
  { timestamps: true }
);

checkoutRequestSchema.index({ studentId: 1, status: 1 });
checkoutRequestSchema.index({ pgId: 1, status: 1 });

export const CheckoutRequest = model<ICheckoutRequest>("CheckoutRequest", checkoutRequestSchema);