import { Request, Response } from "express";
import { Room } from "../models/room.model";

export const getRooms = async (req: Request, res: Response) => {
  try {
    const pgId = (req as any).user.pgId;
    const rooms = await Room.find({ pgId });
    return res.status(200).json({
      success: true,
      rooms,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }
    return res.status(200).json({
      success: true,
      room,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createRoom = async (req: Request, res: Response) => {
  try {
    const { roomNumber, floor, sharingType, capacity, monthlyRent } = req.body;
    const pgId = (req as any).user.pgId;

    const room = await Room.create({
      pgId,
      roomNumber,
      floor,
      sharingType,
      capacity,
      monthlyRent,
      occupiedBeds: 0,
      status: "AVAILABLE",
      facilities: [],
    });

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      room,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { roomNumber, floor, sharingType, capacity, monthlyRent, status } = req.body;

    // Verify PG access
    const room = await Room.findOne({ _id: id, pgId: (req as any).user.pgId });
    if (!room) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this room",
      });
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      { roomNumber, floor, sharingType, capacity, monthlyRent, status },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Room updated successfully",
      room: updatedRoom,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Only delete if no occupants
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (room.occupiedBeds > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete room with occupied beds",
      });
    }

    await Room.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};