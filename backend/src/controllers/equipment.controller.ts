import { Request, Response } from "express";
import { Equipment } from "../models/equipment.model";

export const getEquipment = async (req: Request, res: Response) => {
  try {
    const pgId = (req as any).user.pgId;
    const { status, category } = req.query;

    let query: any = { pgId };

    if (status) {
      query.status = status as string;
    }
    if (category) {
      query.category = category as string;
    }

    const equipment = await Equipment.find(query).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      equipment,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createEquipment = async (req: Request, res: Response) => {
  try {
    const { name, category, location } = req.body;
    const pgId = (req as any).user.pgId;

    const equipment = await Equipment.create({
      pgId,
      name,
      category,
      location,
      status: "WORKING",
      lastChecked: new Date(),
      reportedBy: (req as any).user.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Equipment created successfully",
      equipment,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateEquipmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const equipment = await Equipment.findById(id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }

    equipment.status = status;
    equipment.lastChecked = new Date();
    await equipment.save();

    return res.status(200).json({
      success: true,
      message: "Equipment status updated",
      equipment,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};