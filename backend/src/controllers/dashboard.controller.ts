import { Request, Response } from "express";
import { PG } from "../models/pg.model";
import { Room } from "../models/room.model";
import { StudentProfile } from "../models/studentprofile.model";
import { Bill } from "../models/bill.model";
import { Expense } from "../models/expense.model";
import { Payment } from "../models/payment.model";

export const getLandlordDashboard = async (req: Request, res: Response) => {
  try {
    const pgId = (req as any).user.pgId;

    // Get basic PG info
    const pg = await PG.findById(pgId);

    // Get rooms and occupancy
    const rooms = await Room.find({ pgId });
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === "OCCUPIED").length;
    const availableRooms = rooms.filter(r => r.status === "AVAILABLE").length;
    const noticeRooms = rooms.filter(r => r.status === "NOTICE_GIVEN").length;

    // Calculate revenue
    const bills = await Bill.find({ pgId }).sort({ createdAt: -1 });
    const totalMonthlyRevenue = bills
      .filter(b => b.status === "PAID" || b.status === "PARTIALLY_PAID")
      .reduce((sum, bill) => sum + bill.paidAmount, 0);

    const rentCollected = bills
      .filter(b => b.status === "PAID" || b.status === "PARTIALLY_PAID")
      .reduce((sum, bill) => sum + bill.paidAmount, 0);

    const pendingRent = bills
      .filter(b => b.status === "UNPAID")
      .reduce((sum, bill) => sum + bill.balanceAmount, 0);

    // Calculate monthly expenses from the current month
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthlyExpenses = await Expense.find({
      pgId,
      expenseDate: {
        $gte: new Date(currentYear, currentMonth - 1, 1),
        $lte: new Date(currentYear, currentMonth, 0),
      },
    }).then((expenses) => {
      return expenses.reduce((sum, exp) => sum + exp.amount, 0);
    }) || 0;

    const netIncome = rentCollected - monthlyExpenses;

    // Recent payments
    const recentPayments = await Payment.find({ pgId })
      .sort({ paymentDate: -1 })
      .limit(5);

    // Recent complaints
    const recentComplaints = await globalThis.Complaint?.find({ pgId })
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      dashboard: {
        pg,
        occupancy: {
          totalRooms,
          occupiedRooms,
          availableRooms,
          noticeRooms,
          occupancyRate: totalRooms > 0 ? (occupiedRooms / totalRooms * 100).toFixed(2) : 0,
        },
        revenue: {
          totalMonthlyRevenue,
          rentCollected,
          pendingRent,
          monthlyExpenses,
          netIncome,
        },
        recentPayments,
        recentComplaints,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getManagerDashboard = async (req: Request, res: Response) => {
  try {
    const pgId = (req as any).user.pgId;

    // Open complaints
    const openComplaints = await globalThis.Complaint?.countDocuments({
      pgId,
      status: "OPEN",
    });

    // Pending maintenance
    const pendingMaintenance = await globalThis.MaintenanceTask?.countDocuments({
      pgId,
      status: "PENDING",
    });

    // Equipment failures
    const equipmentFailures = await globalThis.Equipment?.countDocuments({
      pgId,
      status: "NOT_WORKING",
    });

    // Completed tasks (last 30 days)
    const completedTasks = await globalThis.MaintenanceTask?.countDocuments({
      pgId,
      status: "COMPLETED",
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    return res.status(200).json({
      success: true,
      dashboard: {
        openComplaints,
        pendingMaintenance,
        equipmentFailures,
        completedTasks,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStudentDashboard = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.userId;
    const pgId = (req as any).user.pgId;

    // Get student profile
    const student = await globalThis.StudentProfile?.findOne({ userId: studentId });
    const pg = await PG.findById(pgId);

    // Get current bill
    const currentBill = await Bill.findOne({
      pgId,
      studentId,
      status: { $ne: "PAID" },
    }).sort({ createdAt: -1 });

    // Get room info
    let roomInfo = null;
    if (student?.roomId) {
      roomInfo = await globalThis.Room?.findById(student.roomId);
    }

    // Get upcoming announcements
    const announcements = await Announcement.find({
      pgId,
      targetAudience: { $in: ["ALL", "STUDENT"] },
    }).sort({ createdAt: -1 }).limit(3);

    return res.status(200).json({
      success: true,
      dashboard: {
        student,
        pg,
        currentBill,
        roomInfo,
        announcements,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};