import { Request, Response } from "express";
import { Expense } from "../models/expense.model";

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const pgId = (req as any).user.pgId;
    const { category, startDate, endDate } = req.query;

    let query: any = { pgId };

    if (category) {
      query.category = category as string;
    }

    // Date filtering
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) {
        query.expenseDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.expenseDate.$lte = new Date(endDate as string);
      }
    }

    const expenses = await Expense.find(query).sort({ expenseDate: -1 });
    return res.status(200).json({
      success: true,
      expenses,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    const { title, category, amount, description } = req.body;
    const pgId = (req as any).user.pgId;

    const expense = await Expense.create({
      pgId,
      title,
      category,
      amount: Number(amount),
      expenseDate: new Date(),
      description,
      recordedBy: (req as any).user.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Expense recorded successfully",
      expense,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};