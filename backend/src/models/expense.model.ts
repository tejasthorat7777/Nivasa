import mongoose, { Document, model, Schema } from "mongoose";

export interface IExpense extends Document {
  pgId: mongoose.Types.ObjectId;
  title: string;
  category: string;
  amount: number;
  expenseDate: Date;
  description?: string;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    pgId: { type: Schema.Types.ObjectId, ref: "PG", required: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    expenseDate: { type: Date, required: true, default: Date.now },
    description: { type: String, trim: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

expenseSchema.index({ pgId: 1, expenseDate: -1 });

export const Expense = model<IExpense>("Expense", expenseSchema);
