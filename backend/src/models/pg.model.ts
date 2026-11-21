import mongoose, { Document, model, Schema } from "mongoose";

export interface IPG extends Document {
  name: string;
  address: string;
  city: string;
  ownerId?: mongoose.Types.ObjectId;
  invitationCode: string;
  totalRooms: number;
  facilities: string[];
  buildingSetup?: {
    floors: Array<{
      floorNumber: number;
      sharedBathrooms: number;
      rooms: Array<{
        roomNumber: string;
        beds: number;
        privateBathroom: boolean;
      }>;
    }>;
    waterPurifier: {
      available: boolean;
      placement: "COMMON" | "PER_FLOOR";
      count: number;
    };
    mess: {
      available: boolean;
      meals: Array<"BREAKFAST" | "LUNCH" | "DINNER">;
    };
    amenities: Array<
      | "WIFI"
      | "LAUNDRY"
      | "PARKING"
      | "CCTV"
      | "SECURITY"
      | "POWER_BACKUP"
      | "COMMON_AREA"
      | "KITCHEN"
      | "DINING_AREA"
      | "HOUSEKEEPING"
      | "ELEVATOR"
      | "FIRE_SAFETY"
      | "AIR_CONDITIONING"
      | "FAN"
    >;
  };
  createdAt: Date;
  updatedAt: Date;
}

const buildingRoomSchema = new Schema(
  {
    roomNumber: { type: String, required: true, trim: true },
    beds: { type: Number, required: true, min: 1 },
    privateBathroom: { type: Boolean, required: true },
  },
  { _id: false }
);

const buildingFloorSchema = new Schema(
  {
    floorNumber: { type: Number, required: true, min: 0 },
    sharedBathrooms: { type: Number, required: true, min: 0 },
    rooms: { type: [buildingRoomSchema], required: true },
  },
  { _id: false }
);

const buildingSetupSchema = new Schema(
  {
    floors: { type: [buildingFloorSchema], required: true },
    waterPurifier: {
      available: { type: Boolean, required: true },
      placement: { type: String, enum: ["COMMON", "PER_FLOOR"], required: true },
      count: { type: Number, required: true, min: 0 },
    },
    mess: {
      available: { type: Boolean, required: true },
      meals: {
        type: [String],
        enum: ["BREAKFAST", "LUNCH", "DINNER"],
        default: [],
      },
    },
    amenities: {
      type: [String],
      enum: [
        "WIFI",
        "LAUNDRY",
        "PARKING",
        "CCTV",
        "SECURITY",
        "POWER_BACKUP",
        "COMMON_AREA",
        "KITCHEN",
        "DINING_AREA",
        "HOUSEKEEPING",
        "ELEVATOR",
        "FIRE_SAFETY",
        "AIR_CONDITIONING",
        "FAN",
      ],
      default: [],
    },
  },
  { _id: false }
);

const pgSchema = new Schema<IPG>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User" },
    invitationCode: { type: String, required: true, unique: true, uppercase: true },
    totalRooms: { type: Number, required: true, min: 0 },
    facilities: { type: [String], default: [] },
    buildingSetup: { type: buildingSetupSchema, required: false },
  },
  { timestamps: true }
);

export const PG = model<IPG>("PG", pgSchema);
