import { Request, Response } from "express";
import { User } from "../models/user.model";
import { PG } from "../models/pg.model";
import { StudentProfile } from "../models/studentprofile.model";
import { IRoom, Room } from "../models/room.model";
import { IStudentProfile } from "../models/studentprofile.model";
import { assignBedSchema } from "../validators/student.validators";
import { getBedNumber } from "../utils/room-inventory.util";

class BedAssignmentConflictError extends Error {}

const updateRoomStatus = async (room: IRoom | null) => {
  if (!room || room.status === "MAINTENANCE") return;
  room.status =
    room.occupiedBeds === 0
      ? "AVAILABLE"
      : room.occupiedBeds >= room.capacity
        ? "OCCUPIED"
        : "PARTIALLY_OCCUPIED";
  await room.save();
};

const changeRoomOccupancy = async (roomId: unknown, increment: number) => {
  const room = await Room.findByIdAndUpdate(
    roomId,
    { $inc: { occupiedBeds: increment } },
    { new: true }
  );
  await updateRoomStatus(room);
};

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

export const lookupStudentByCode = async (req: Request, res: Response) => {
  try {
    const pgId = req.user?.pgId;
    if (!pgId) {
      return res.status(403).json({
        success: false,
        message: "Your account is not linked to a PG.",
      });
    }

    const studentCode = req.params.studentCode.trim().toUpperCase();
    const student = await User.findOne({
      studentCode,
      role: "STUDENT",
      isActive: true,
      approvalStatus: { $ne: "REJECTED" },
    }).select("name address email studentCode");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "No active student account matches this code.",
      });
    }

    const existingProfile = await StudentProfile.findOne({
      userId: student._id,
      status: "ACTIVE",
    });
    const currentPG = existingProfile
      ? await PG.findById(existingProfile.pgId).select("name")
      : null;

    return res.status(200).json({
      success: true,
      student: {
        id: student._id,
        name: student.name,
        address: student.address ?? "",
        email: student.email,
        studentCode: student.studentCode,
        currentAssignment: existingProfile
          ? {
              pgId: existingProfile.pgId.toString(),
              pgName: currentPG?.name ?? "another PG",
              bedNumber: existingProfile.bedNumber,
              isCurrentPG: existingProfile.pgId.toString() === pgId,
            }
          : null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const assignStudentToBed = async (req: Request, res: Response) => {
  try {
    const result = assignBedSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: result.error.format(),
      });
    }

    const pgId = req.user?.pgId;
    if (!pgId) {
      return res.status(403).json({
        success: false,
        message: "Your account is not linked to a PG.",
      });
    }

    const { roomId, bedNumber, studentCode, monthlyRent, address } = result.data;
    const student = await User.findOne({
      studentCode: studentCode.toUpperCase(),
      role: "STUDENT",
      isActive: true,
      approvalStatus: { $ne: "REJECTED" },
    });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "No active student account matches this code.",
      });
    }

    const room = await Room.findOne({ _id: roomId, pgId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found in your PG.",
      });
    }

    const validBedNumbers = Array.from({ length: room.capacity }, (_, index) =>
      getBedNumber(room.floor, room.roomNumber, index + 1)
    );
    if (!validBedNumbers.includes(bedNumber)) {
      return res.status(400).json({
        success: false,
        message: "This bed does not belong to the selected room.",
      });
    }

    const [existingProfile, existingBedAssignment] = await Promise.all([
      StudentProfile.findOne({ userId: student._id, status: "ACTIVE" }),
      StudentProfile.findOne({
        pgId,
        roomId: room._id,
        bedNumber,
        status: "ACTIVE",
      }),
    ]);
    if (existingProfile?.pgId.toString() === pgId) {
      return res.status(409).json({
        success: false,
        message: "This student already has an assigned bed in this PG.",
      });
    }
    if (existingBedAssignment) {
      return res.status(409).json({
        success: false,
        message: "This bed has already been assigned.",
      });
    }

    if (
      room.occupiedBeds >= room.capacity ||
      room.status === "MAINTENANCE"
    ) {
      return res.status(409).json({
        success: false,
        message: "This room no longer has an available bed.",
      });
    }

    const previousRoom = existingProfile
      ? await Room.findOne({
          _id: existingProfile.roomId,
          pgId: existingProfile.pgId,
        })
      : null;
    if (existingProfile && (!previousRoom || previousRoom.occupiedBeds < 1)) {
      return res.status(409).json({
        success: false,
        message: "The student's current bed could not be verified for transfer.",
      });
    }

    const previousProfileState = existingProfile
      ? {
          status: existingProfile.status,
          actualCheckoutDate: existingProfile.actualCheckoutDate,
          checkoutStatus: existingProfile.checkoutStatus,
        }
      : null;
    let previousProfileTransferred = false;
    let previousRoomReleased = false;
    let studentProfile: IStudentProfile | null = null;
    let newRoomClaimed = false;

    try {
      if (existingProfile && previousRoom) {
        existingProfile.status = "TRANSFERRED";
        existingProfile.actualCheckoutDate = new Date();
        existingProfile.checkoutStatus = "CONFIRMED";
        await existingProfile.save();
        previousProfileTransferred = true;

        const releasedRoom = await Room.findOneAndUpdate(
          {
            _id: previousRoom._id,
            pgId: existingProfile.pgId,
            occupiedBeds: { $gt: 0 },
          },
          { $inc: { occupiedBeds: -1 } },
          { new: true }
        );
        if (!releasedRoom) {
          throw new BedAssignmentConflictError(
            "The student's current bed could not be released."
          );
        }
        previousRoomReleased = true;
        await updateRoomStatus(releasedRoom);
      }

      studentProfile = await StudentProfile.create({
        userId: student._id,
        pgId,
        roomId: room._id,
        bedNumber,
        joiningDate: new Date(),
        securityDeposit: 0,
        monthlyRent,
        emergencyContact: student.phone,
        ...(student.collegeName ? { collegeName: student.collegeName } : {}),
        status: "ACTIVE",
      });

      const occupiedRoom = await Room.findOneAndUpdate(
        {
          _id: room._id,
          pgId,
          occupiedBeds: { $lt: room.capacity },
          status: { $ne: "MAINTENANCE" },
        },
        { $inc: { occupiedBeds: 1 } },
        { new: true }
      );
      if (!occupiedRoom) {
        throw new BedAssignmentConflictError(
          "This room no longer has an available bed."
        );
      }
      newRoomClaimed = true;
      await updateRoomStatus(occupiedRoom);

      const linkedStudent = await User.findOneAndUpdate(
        {
          _id: student._id,
          role: "STUDENT",
          isActive: true,
          approvalStatus: { $ne: "REJECTED" },
        },
        {
          pgId,
          address,
          approvalStatus: "APPROVED",
        },
        { new: true }
      ).select("-passwordHash");

      if (!linkedStudent) {
        throw new BedAssignmentConflictError(
          "Student account is no longer available."
        );
      }

      return res.status(201).json({
        success: true,
        message: existingProfile
          ? "Student transferred and assigned to bed successfully."
          : "Student assigned to bed successfully.",
        assignment: {
          bedNumber,
          monthlyRent,
          student: {
            id: linkedStudent._id,
            name: linkedStudent.name,
            address: linkedStudent.address ?? "",
            studentCode: linkedStudent.studentCode,
          },
        },
      });
    } catch (error) {
      const rollbackActions: Array<() => Promise<unknown>> = [];
      if (studentProfile) {
        const profileToDelete = studentProfile;
        rollbackActions.push(() =>
          StudentProfile.findByIdAndDelete(profileToDelete._id)
        );
      }
      if (newRoomClaimed) {
        rollbackActions.push(() => changeRoomOccupancy(room._id, -1));
      }
      if (previousProfileTransferred && existingProfile && previousProfileState) {
        rollbackActions.push(async () => {
          existingProfile.status = previousProfileState.status;
          existingProfile.actualCheckoutDate =
            previousProfileState.actualCheckoutDate;
          existingProfile.checkoutStatus = previousProfileState.checkoutStatus;
          await existingProfile.save();
        });
      }
      if (previousRoomReleased && previousRoom) {
        rollbackActions.push(() => changeRoomOccupancy(previousRoom._id, 1));
      }

      const rollbackErrors: unknown[] = [];
      for (const rollback of rollbackActions) {
        try {
          await rollback();
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
        }
      }
      if (rollbackErrors.length) {
        const detail =
          rollbackErrors[0] instanceof Error
            ? rollbackErrors[0].message
            : "Unknown rollback error";
        throw new Error(
          `Bed assignment failed and rollback was incomplete: ${detail}`
        );
      }
      throw error;
    }
  } catch (error: any) {
    if (error instanceof BedAssignmentConflictError) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This student or bed has already been assigned.",
      });
    }
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