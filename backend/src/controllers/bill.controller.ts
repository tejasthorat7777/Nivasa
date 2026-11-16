import { Request, Response } from "express";
import { Bill } from "../models/bill.model";
import { StudentProfile } from "../models/studentprofile.model";

export const getBills = async (req: Request, res: Response) => {
  try {
    const pgId = (req as any).user.pgId;
    const { status, month } = req.query;

    let query: any = { pgId };

    if (status) {
      query.status = status as string;
    }
    if (month) {
      query.billingMonth = month as string;
    }

    const bills = await Bill.find(query).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      bills,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyBills = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.userId;
    const { status, month } = req.query;

    let query: any = { studentId };

    if (status) {
      query.status = status as string;
    }
    if (month) {
      query.billingMonth = month as string;
    }

    const bills = await Bill.find(query).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      bills,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createBill = async (req: Request, res: Response) => {
  try {
    const { studentId, roomId, billingMonth, rentAmount, electricityAmount, laundryAmount, wifiAmount, otherCharges } = req.body;
    const pgId = (req as any).user.pgId;

    // Calculate total
    const totalAmount = rentAmount + (electricityAmount || 0) + (laundryAmount || 0) + (wifiAmount || 0) + (otherCharges || 0);
    const balanceAmount = totalAmount;

    const bill = await Bill.create({
      pgId,
      studentId,
      roomId,
      billingMonth,
      rentAmount,
      electricityAmount: electricityAmount || 0,
      laundryAmount: laundryAmount || 0,
      wifiAmount: wifiAmount || 0,
      otherCharges: otherCharges || 0,
      totalAmount,
      paidAmount: 0,
      balanceAmount,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: "UNPAID",
    });

    return res.status(201).json({
      success: true,
      message: "Bill created successfully",
      bill,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateBillPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paidAmount } = req.body;

    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found",
      });
    }

    // Update payment
    bill.paidAmount = paidAmount;
    bill.balanceAmount = bill.totalAmount - paidAmount;

    // Update status based on payment
    if (bill.balanceAmount <= 0) {
      bill.status = "PAID";
    } else if (bill.paidAmount > 0) {
      bill.status = "PARTIALLY_PAID";
    }

    await bill.save();

    return res.status(200).json({
      success: true,
      message: "Bill payment updated",
      bill,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};