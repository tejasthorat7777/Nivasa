import { Request, Response } from "express";
import { Announcement } from "../models/announcement.model";

export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const pgId = (req as any).user.pgId;
    const { targetAudience } = req.query;

    let query: any = { pgId };

    if (targetAudience) {
      query.targetAudience = targetAudience as string;
    }

    const announcements = await Announcement.find(query).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      announcements,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const { title, message, targetAudience } = req.body;
    const pgId = (req as any).user.pgId;

    const announcement = await Announcement.create({
      pgId,
      title,
      message,
      targetAudience: targetAudience || "ALL",
      createdBy: (req as any).user.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      announcement,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pgId = (req as any).user.pgId;

    // Verify ownership - landlords can delete, managers can delete their own, students cannot
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // Landlords can delete any announcement
    if (req.user.role === "LANDLORD") {
      await Announcement.findByIdAndDelete(id);
      return res.status(200).json({
        success: true,
        message: "Announcement deleted successfully",
      });
    }

    // Managers can delete announcements targeting them
    if (req.user.role === "MANAGER" && announcement.targetAudience === "MANAGER") {
      await Announcement.findByIdAndDelete(id);
      return res.status(200).json({
        success: true,
        message: "Announcement deleted successfully",
      });
    }

    // Students cannot delete announcements
    return res.status(403).json({
      success: false,
      message: "You do not have permission to delete this announcement",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};