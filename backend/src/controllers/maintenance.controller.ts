import { Request, Response } from "express";
import { MaintenanceTask } from "../models/maintenancetask.model";

export const getMaintenanceTasks = async (req: Request, res: Response) => {
  try {
    const pgId = (req as any).user.pgId;
    const { status, category, assignedTo } = req.query;

    let query: any = { pgId };

    if (status) {
      query.status = status as string;
    }
    if (category) {
      query.category = category as string;
    }
    if (assignedTo) {
      query.assignedTo = assignedTo as string;
    }

    const tasks = await MaintenanceTask.find(query).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createMaintenanceTask = async (req: Request, res: Response) => {
  try {
    const { title, description, category, location, priority } = req.body;
    const pgId = (req as any).user.pgId;

    const task = await MaintenanceTask.create({
      pgId,
      title,
      description,
      category,
      location,
      priority: priority || "MEDIUM",
      status: "PENDING",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      assignedTo: (req as any).user.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Maintenance task created successfully",
      task,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateMaintenanceTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, priority } = req.body;

    const task = await MaintenanceTask.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Maintenance task not found",
      });
    }

    task.status = status || task.status;
    if (priority) task.priority = priority;
    if (status === "COMPLETED") {
      task.completedAt = new Date();
    }

    await task.save();

    return res.status(200).json({
      success: true,
      message: "Maintenance task updated",
      task,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};