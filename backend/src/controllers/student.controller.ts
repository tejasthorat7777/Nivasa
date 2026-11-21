import { Request, Response } from "express";
import { User } from "../models/user.model";
import { PG } from "../models/pg.model";
import { StudentProfile } from "../models/studentprofile.model";
import { Room } from "../models/room.model";

export const getStudents = async (req: Request, res: Response) => {
  try {
    const pgId = (req as any).user.pgId;
    const students = await StudentProfile.find({ pgId }).populate("userId", "name email role");
    return res.status(200).json({
      success: true,
      students,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await StudentProfile.findById(id).populate("userId", "name email role");
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }
    return res.status(200).json({
      success: true,
      student,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const approveStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await StudentProfile.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const user = await User.findByIdAndUpdate(
      student.userId,
      { approvalStatus: "APPROVED" },
      { new: true }
    ).select("-passwordHash");

    return res.status(200).json({
      success: true,
      message: "Student approved successfully",
      student: {
        ...student.toObject(),
        user,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const assignRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { roomId } = req.body;
    const pgId = (req as any).user.pgId;

    const student = await StudentProfile.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check room availability
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }
    if (room.status !== "AVAILABLE") {
      return res.status(400).json({
        success: false,
        message: "Room is not available",
      });
    }

    // Assign room to student
    student.roomId = roomId;
    student.status = "ACTIVE";

    // Update room occupancy
    room.occupiedBeds += 1;
    if (room.occupiedBeds >= room.capacity) {
      room.status = "OCCUPIED";
    }
    await room.save();

    await student.save();

    return res.status(200).json({
      success: true,
      message: "Room assigned successfully",
      student: {
        ...student.toObject(),
        room: {
          roomNumber: room.roomNumber,
          floor: room.floor,
          sharingType: room.sharingType,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const student = await StudentProfile.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("userId", "name email");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};