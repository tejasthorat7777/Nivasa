import { Request, Response } from "express";
import { User } from "../models/user.model";
import { StudentProfile } from "../models/studentprofile.model";
import { Room } from "../models/room.model";
import { Bill } from "../models/bill.model";

export const submitCheckout = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.userId;
    const pgId = (req as any).user.pgId;

    // Find student profile
    const student = await StudentProfile.findOne({ userId: studentId, pgId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    if (student.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Student account is not active",
      });
    }

    // Create or update checkout notice
    student.checkoutRequestedAt = new Date();
    student.checkoutStatus = "PENDING_LANDLORD";
    await student.save();

    return res.status(200).json({
      success: true,
      message: "Checkout request submitted successfully",
      student: {
        id: student._id,
        checkoutStatus: student.checkoutStatus,
        roomId: student.roomId,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const landlordApproveCheckout = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const landlordId = (req as any).user.userId;

    // Verify landlord owns the PG
    const student = await StudentProfile.findById(id).populate("pgId");
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const pg = student.pgId as any;
    if (pg.ownerId.toString() !== landlordId) {
      return res.status(403).json({
        success: false,
        message: "You do not own this PG",
      });
    }

    if (student.checkoutStatus !== "PENDING_LANDLORD") {
      return res.status(400).json({
        success: false,
        message: "Student checkout request is not in pending landlord review state",
      });
    }

    // Update checkout status to approved
    student.checkoutStatus = "APPROVED_LANDLORD";
    student.landlordApprovedAt = new Date();
    await student.save();

    return res.status(200).json({
      success: true,
      message: "Landlord approved checkout request",
      student: {
        id: student._id,
        checkoutStatus: student.checkoutStatus,
        roomId: student.roomId,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const managerConfirmCheckout = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const managerId = (req as any).user.userId;

    // Verify manager is associated with the PG
    const student = await StudentProfile.findById(id).populate("pgId");
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check if student is associated with manager's PG
    const isAssociated = await StudentProfile.findOne({
      _id: managerId,
      pgId: student.pgId._id,
    });
    if (!isAssociated) {
      return res.status(403).json({
        success: false,
        message: "You are not associated with this PG",
      });
    }

    if (student.checkoutStatus !== "APPROVED_LANDLORD") {
      return res.status(400).json({
        success: false,
        message: "Landlord has not yet approved the checkout request",
      });
    }

    // Mark actual checkout and update room availability
    student.actualCheckoutDate = new Date();
    student.status = "CHECKED_OUT";
    student.checkoutStatus = "CONFIRMED";

    // Update room occupancy - decrement occupied beds
    if (student.roomId) {
      const room = await Room.findById(student.roomId);
      if (room) {
        room.occupiedBeds = Math.max(0, room.occupiedBeds - 1);

        // Update room status based on occupancy
        if (room.occupiedBeds <= 0) {
          room.status = "AVAILABLE";
        } else if (room.occupiedBeds < room.capacity) {
          room.status = "PARTIALLY_OCCUPIED";
        }

        await room.save();
      }
    }

    await student.save();

    return res.status(200).json({
      success: true,
      message: "Checkout confirmed successfully",
      student: {
        id: student._id,
        status: student.status,
        actualCheckoutDate: student.actualCheckoutDate,
        roomId: student.roomId,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCheckoutRequests = async (req: Request, res: Response) => {
  try {
    const pgId = (req as any).user.pgId;
    const landlordId = (req as any).user.userId;

    // Only landlord who owns the PG can see requests
    const pg = await globalThis.PG?.findById(pgId);
    if (!pg || pg.ownerId.toString() !== landlordId) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to view checkout requests for this PG",
      });
    }

    const requests = await StudentProfile.find({ pgId, checkoutStatus: "PENDING_LANDLORD" })
      .populate("userId", "name email")
      .sort({ checkoutRequestedAt: -1 });

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};