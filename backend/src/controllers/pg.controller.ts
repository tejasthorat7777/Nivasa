import { Request, Response } from "express";
import { User } from "../models/user.model";
import { PG } from "../models/pg.model";
import { generateInvitationCode } from "../utils/invitation.util";
import {
  ensureRoomsFromBuildingSetup,
  RoomInventoryConflictError,
  validateRoomCapacities,
} from "../utils/room-inventory.util";
import {
  buildingSetupSchema,
  createPGSchema,
} from "../validators/pg.validators";

export const createPG = async (req: Request, res: Response) => {
  try {
    const result = createPGSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: result.error.format(),
      });
    }

    const ownerId = req.user?.userId;
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { name, address, city, totalRooms, facilities } = result.data;

    const pg = await PG.create({
      name,
      address,
      city,
      ownerId,
      invitationCode: generateInvitationCode(),
      totalRooms,
      facilities: facilities || [],
    });

    return res.status(201).json({
      success: true,
      message: "PG created successfully",
      pg: {
        id: pg._id,
        name: pg.name,
        address: pg.address,
        city: pg.city,
        invitationCode: pg.invitationCode,
        totalRooms: pg.totalRooms,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyPG = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const pg = req.user?.role === "LANDLORD"
      ? await PG.findOne({ _id: req.user.pgId, ownerId: userId })
      : await PG.findById(req.user.pgId);
    if (!pg) {
      return res.status(404).json({
        success: false,
        message: "No active PG is selected for this account.",
      });
    }
    return res.status(200).json({
      success: true,
      pg,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyPGs = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.userId;
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const properties = await PG.find({ ownerId })
      .select("name address city invitationCode totalRooms")
      .sort({ name: 1 });
    return res.status(200).json({
      success: true,
      properties: properties.map((pg) => ({
        id: pg._id.toString(),
        name: pg.name,
        address: pg.address,
        city: pg.city,
        invitationCode: pg.invitationCode,
        totalRooms: pg.totalRooms,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const setActivePG = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.userId;
    const pgId =
      typeof req.body.pgId === "string" ? req.body.pgId.trim() : "";
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    if (!pgId) {
      return res.status(400).json({
        success: false,
        message: "A property ID is required.",
      });
    }

    const pg = await PG.findOne({ _id: pgId, ownerId });
    if (!pg) {
      return res.status(404).json({
        success: false,
        message: "This property does not belong to your account.",
      });
    }

    const user = await User.findByIdAndUpdate(
      ownerId,
      { pgId: pg._id },
      { new: true, runValidators: true }
    ).select("-passwordHash");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Landlord account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      pg,
      user,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateBuildingSetup = async (req: Request, res: Response) => {
  try {
    const result = buildingSetupSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: result.error.format(),
      });
    }

    const ownerId = req.user?.userId;
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }
    const pgId = req.user?.pgId;
    if (!pgId) {
      return res.status(403).json({
        success: false,
        message: "Your account is not linked to a PG.",
      });
    }

    const totalRooms = result.data.floors.reduce(
      (total, floor) => total + floor.rooms.length,
      0
    );
    await validateRoomCapacities(pgId, result.data);
    const pg = await PG.findOneAndUpdate(
      { _id: pgId, ownerId },
      { buildingSetup: result.data, totalRooms },
      { new: true, runValidators: true }
    );

    if (!pg) {
      return res.status(404).json({
        success: false,
        message: "PG not found for this landlord",
      });
    }

    await ensureRoomsFromBuildingSetup(pg._id, result.data);

    return res.status(200).json({
      success: true,
      message: "Building setup saved successfully",
      pg,
    });
  } catch (error: any) {
    if (error instanceof RoomInventoryConflictError) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePG = async (req: Request, res: Response) => {
  try {
    const { name, address, city, totalRooms, facilities } = req.body;
    const pgId = req.params.id;
    const ownerId = req.user?.userId;
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Verify ownership
    const pg = await PG.findOne({ _id: pgId, ownerId });
    if (!pg) {
      return res.status(403).json({
        success: false,
        message: "You do not own this PG",
      });
    }

    const updatedPG = await PG.findByIdAndUpdate(
      pgId,
      { name, address, city, totalRooms, facilities },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "PG updated successfully",
      pg: updatedPG,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};