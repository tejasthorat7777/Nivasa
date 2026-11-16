import mongoose, { Document, model, Schema } from "mongoose";

export interface IPayment extends Document {
  pgId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  billId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "UPI" | "CARD";
  transactionReference?: string;
  paymentStatus: "PENDING" | "VERIFIED" | "REJECTED";
  paymentDate: Date;
  recordedBy: mongoose.Types.ObjectId;
}

const paymentSchema = new Schema<IPayment>(
  {
    pgId: { type: Schema.Types.ObjectId, ref: "PG", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true },
    billId: { type: Schema.Types.ObjectId, ref: "Bill", required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["CASH", "BANK_TRANSFER", "UPI", "CARD"], required: true },
    transactionReference: { type: String },
    paymentStatus: { type: String, enum: ["PENDING", "VERIFIED", "REJECTED"], default: "PENDING" },
    paymentDate: { type: Date, default: Date.now },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

paymentSchema.index({ studentId: 1, paymentStatus: 1 });
paymentSchema.index({ billId: 1 });

export const Payment = model<IPayment>("Payment", paymentSchema);