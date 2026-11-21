import mongoose, { Document, model, Schema } from "mongoose";

export interface IStudentProfile extends Document {
  userId: mongoose.Types.ObjectId;
  pgId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  bedNumber?: string;
  joiningDate: Date;
  expectedCheckoutDate?: Date;
  actualCheckoutDate?: Date;
  checkoutRequestedAt?: Date;
  checkoutStatus?: "PENDING_LANDLORD" | "APPROVED_LANDLORD" | "CONFIRMED";
  landlordApprovedAt?: Date;
  securityDeposit: number;
  monthlyRent: number;
  emergencyContact: string;
  collegeName: string;
  status: "ACTIVE" | "GRADUATED" | "TRANSFERRED" | "EXPELLED" | "CHECKED_OUT";
}

const studentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    pgId: { type: Schema.Types.ObjectId, ref: "PG", required: true },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    bedNumber: { type: String, trim: true },
    joiningDate: { type: Date, required: true },
    expectedCheckoutDate: { type: Date },
    actualCheckoutDate: { type: Date },
    checkoutRequestedAt: { type: Date },
    checkoutStatus: { type: String, enum: ["PENDING_LANDLORD", "APPROVED_LANDLORD", "CONFIRMED"] },
    landlordApprovedAt: { type: Date },
    securityDeposit: { type: Number, required: true },
    monthlyRent: { type: Number, required: true },
    emergencyContact: { type: String, required: true },
    collegeName: { type: String, trim: true },
    status: { type: String, enum: ["ACTIVE", "GRADUATED", "TRANSFERRED", "EXPELLED", "CHECKED_OUT"] },
  },
  { timestamps: true }
);

studentProfileSchema.index({ userId: 1, status: 1 });
studentProfileSchema.index({ pgId: 1, status: 1 });
studentProfileSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { status: "ACTIVE" } }
);
studentProfileSchema.index(
  { pgId: 1, bedNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: "ACTIVE",
      bedNumber: { $exists: true },
    },
  }
);

export const StudentProfile = model<IStudentProfile>("StudentProfile", studentProfileSchema);