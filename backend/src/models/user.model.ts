import mongoose, { Document, model, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: "LANDLORD" | "MANAGER" | "STUDENT";
  pgId?: mongoose.Types.ObjectId;
  isActive: boolean;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  resetPasswordToken?: string;
  resetPasswordExpires?: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["LANDLORD", "MANAGER", "STUDENT"], required: true },
    pgId: { type: Schema.Types.ObjectId, ref: "PG" },
    isActive: { type: Boolean, default: true },
    approvalStatus: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Number, select: false },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, pgId: 1 });

export const User = model<IUser>("User", userSchema);