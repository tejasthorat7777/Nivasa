import { Request, Response } from "express";
import { PG } from "../models/pg.model";
import { Room } from "../models/room.model";
import { StudentProfile } from "../models/studentprofile.model";
import {
  ensureRoomsFromBuildingSetup,
  getBedNumber,
  RoomInventoryConflictError,
} from "../utils/room-inventory.util";

export const getRooms = async (req: Request, res: Response) => {
  try {
    const pgId = (req as any).user.pgId;
    if (!pgId) {
      return res.status(403).json({
        success: false,
        message: "Your account is not linked to a PG.",
      });
    }
    const pg = await PG.findById(pgId);
    if (pg?.buildingSetup) {
      await ensureRoomsFromBuildingSetup(pgId, pg.buildingSetup);
    }

    const rooms = await Room.find({ pgId });
    const roomIds = rooms.map((room) => room._id);
    const studentProfiles = roomIds.length
      ? await StudentProfile.find({
          pgId,
          status: "ACTIVE",
          roomId: { $in: roomIds },
        }).populate<{
          userId: {
            name: string;
            address?: string;
            email: string;
            studentCode?: string;
          };
        }>("userId", "name address email studentCode")
      : [];

    for (const profile of studentProfiles) {
      if (profile.bedNumber) continue;

      const room = rooms.find(
        (candidate) => candidate._id.toString() === profile.roomId.toString()
      );
      if (!room) continue;

      const occupiedBedNumbers = studentProfiles
        .filter(
          (assigned) =>
            assigned.roomId.toString() === room._id.toString() &&
            assigned.bedNumber
        )
        .map((assigned) => assigned.bedNumber);
      const availableBedNumber = Array.from(
        { length: room.capacity },
        (_, index) => getBedNumber(room.floor, room.roomNumber, index + 1)
      ).find((bedNumber) => !occupiedBedNumbers.includes(bedNumber));

      if (availableBedNumber) {
        profile.bedNumber = availableBedNumber;
        await profile.save();
      }
    }

    const roomsWithBeds = rooms.map((room) => ({
      ...room.toObject(),
      beds: Array.from({ length: room.capacity }, (_, index) => {
        const bedNumber = getBedNumber(room.floor, room.roomNumber, index + 1);
        const profile = studentProfiles.find(
          (candidate) =>
            candidate.roomId.toString() === room._id.toString() &&
            candidate.bedNumber === bedNumber
        );
        return {
          bedNumber,
          occupied: !!profile,
          monthlyRent: profile?.monthlyRent ?? null,
          student: profile
            ? {
                name: profile.userId.name,
                address: profile.userId.address ?? "",
                email: profile.userId.email,
                studentCode: profile.userId.studentCode ?? "",
              }
            : null,
        };
      }),
    }));

    return res.status(200).json({
      success: true,
      rooms: roomsWithBeds,
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