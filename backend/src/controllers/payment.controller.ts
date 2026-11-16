import { Request, Response } from "express";
import { Payment } from "../models/payment.model";
import { Bill } from "../models/bill.model";

export const getPayments = async (req: Request, res: Response) => {
  try {
    const pgId = (req as any).user.pgId;
    const { status } = req.query;

    let query: any = { pgId };

    if (status) {
      query.paymentStatus = status as string;
    }

    const payments = await Payment.find(query).sort({ paymentDate: -1 });
    return res.status(200).json({
      success: true,
      payments,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const { studentId, billId, amount, paymentMethod } = req.body;
    const pgId = (req as any).user.pgId;
    const userId = (req as any).user.userId;

    // Find the bill to verify amount
    const bill = await Bill.findById(billId).populate("studentId", "pgId");
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found",
      });
    }

    // Verify bill belongs to the user's PG
    if (bill.pgId.toString() !== pgId) {
      return res.status(403).json({
        success: false,
        message: "Payment cannot be made to a bill outside your PG",
      });
    }

    // Verify student belongs to the same PG
    const student = bill.studentId as any;
    if (student.pgId?.toString() !== pgId) {
      return res.status(403).json({
        success: false,
        message: "Student does not belong to your PG",
      });
    }

    // Check if amount exceeds balance
    if (amount > bill.balanceAmount) {
      return res.status(400).json({
        success: false,
        message: "Payment amount exceeds outstanding balance",
      });
    }

    // Check for duplicate pending payment
    const existingPayment = await Payment.findOne({ billId, paymentStatus: "PENDING" });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "A pending payment for this bill already exists",
      });
    }

    const payment = await Payment.create({
      pgId,
      studentId,
      billId,
      amount,
      paymentMethod,
      paymentStatus: "PENDING",
      transactionReference: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      recordedBy: userId,
    });

    // Update bill payment - only add if not already paid
    if (bill.status !== "PAID") {
      bill.paidAmount += amount;
      bill.balanceAmount = bill.totalAmount - bill.paidAmount;
    }

    if (bill.balanceAmount <= 0 && bill.status !== "PAID") {
      bill.status = "PAID";
    } else if (bill.paidAmount > 0 && bill.status !== "PAID") {
      bill.status = "PARTIALLY_PAID";
    }
    await bill.save();

    return res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      payment,
      bill,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.paymentStatus === "VERIFIED") {
      return res.status(400).json({
        success: false,
        message: "Payment already verified",
      });
    }

    // Verify this payment belongs to a bill in the user's PG
    const bill = await Bill.findById(payment.billId).populate("studentId", "pgId");
    if (!bill || bill.pgId.toString() !== (req as any).user.pgId) {
      return res.status(403).json({
        success: false,
        message: "Payment cannot be verified for a bill outside your PG",
      });
    }

    payment.paymentStatus = "VERIFIED";
    await payment.save();

    // Update bill status - add payment amount if not already counted
    if (bill.status !== "PAID") {
      bill.paidAmount += payment.amount;
      bill.balanceAmount = bill.totalAmount - bill.paidAmount;
    }

    if (bill.balanceAmount <= 0 && bill.status !== "PAID") {
      bill.status = "PAID";
    } else if (bill.paidAmount > 0 && bill.status !== "PAID") {
      bill.status = "PARTIALLY_PAID";
    }
    await bill.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment,
      bill,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};