import mongoose, { Document, model, Schema } from "mongoose";

export interface IBill extends Document {
  pgId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  billingMonth: string;
  rentAmount: number;
  electricityAmount: number;
  laundryAmount: number;
  wifiAmount: number;
  otherCharges: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: Date;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
}

const billSchema = new Schema<IBill>(
  {
    pgId: { type: Schema.Types.ObjectId, ref: "PG", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    billingMonth: { type: String, required: true },
    rentAmount: { type: Number, required: true },
    electricityAmount: { type: Number, default: 0 },
    laundryAmount: { type: Number, default: 0 },
    wifiAmount: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ["UNPAID", "PARTIALLY_PAID", "PAID", "OVERDUE"], default: "UNPAID" },
  },
  { timestamps: true }
);

billSchema.index({ studentId: 1, billingMonth: 1 });
billSchema.index({ pgId: 1, status: 1 });

export const Bill = model<IBill>("Bill", billSchema);