import { Request, Response } from "express";
import { PG } from "../models/pg.model";
import { generateInvitationCode } from "../utils/invitation.util";

export const createPG = async (req: Request, res: Response) => {
  try {
    const { name, address, city, totalRooms, facilities } = req.body;

    const pg = await PG.create({
      name,
      address,
      city,
      ownerId: (req as any).user._id,
      invitationCode: generateInvitationCode(),
      totalRooms: Number(totalRooms) || 0,
      facilities: facilities || [],
    });

    return res.status(201).json({
      success: true,
      message: "PG created successfully",
      pg: {
        id: pg._id,
        name: pg.name,
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
    const pg = await PG.findOne({ ownerId: (req as any).user._id });
    if (!pg) {
      return res.status(404).json({
        success: false,
        message: "No PG found for this landlord",
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

export const updatePG = async (req: Request, res: Response) => {
  try {
    const { name, address, city, totalRooms, facilities } = req.body;
    const pgId = req.params.id;

    // Verify ownership
    const pg = await PG.findOne({ _id: pgId, ownerId: (req as any).user._id });
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