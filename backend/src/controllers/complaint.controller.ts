import { Request, Response } from "express";
import { Complaint } from "../models/complaint.model";

export const getComplaints = async (req: Request, res: Response) => {
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

    const complaints = await Complaint.find(query).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      complaints,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createComplaint = async (req: Request, res: Response) => {
  try {
    const { category, title, description, priority } = req.body;
    const pgId = (req as any).user.pgId;
    const studentId = (req as any).user.userId;

    const complaint = await Complaint.create({
      pgId,
      studentId,
      roomId: (req as any).user.pgId ? undefined : undefined, // Will be filled based on student's room
      category,
      title,
      description,
      priority,
      status: "OPEN",
    });

    // If student has a room, update it
    if (studentId) {
      const student = await globalThis.StudentProfile?.findOne({ userId: studentId });
      if (student && student.roomId) {
        complaint.roomId = student.roomId;
        await complaint.save();
      }
    }

    return res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      complaint,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateComplaint = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, resolutionNotes } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    complaint.status = status || complaint.status;
    complaint.assignedTo = assignedTo !== undefined ? assignedTo : complaint.assignedTo;
    complaint.resolutionNotes = resolutionNotes !== undefined ? resolutionNotes : complaint.resolutionNotes;

    if (status === "RESOLVED") {
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: "Complaint updated successfully",
      complaint,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};