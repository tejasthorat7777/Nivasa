import { Request, Response } from "express";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "../validators/auth.validators";
import { User } from "../models/user.model";
import jwt from "jsonwebtoken";
import { comparePassword, hashPassword } from "../utils/password.util";
import { generateInvitationCode } from "../utils/invitation.util";
import { generateStudentCode } from "../utils/student-code.util";
import { PG } from "../models/pg.model";

export const signupLandlord = async (req: Request, res: Response) => {
  try {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: result.error.format(),
      });
    }

    const {
      name,
      email,
      phone,
      password,
      pgName,
      pgAddress,
      city,
    } = result.data;

    // Check email uniqueness
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate invitation code
    const invitationCode = generateInvitationCode();

    // Create PG record
    const pg = await PG.create({
      name: pgName,
      address: pgAddress,
      city,
      ownerId: req.body.landlordId || undefined, // Will be set after user creation
      invitationCode,
      totalRooms: 0,
      facilities: [],
    });

    // Create landlord user
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: "LANDLORD",
      pgId: pg._id,
      isActive: true,
      approvalStatus: "APPROVED",
    });

    // Update PG with owner reference
    await PG.findByIdAndUpdate(pg._id, { ownerId: user._id });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "nivasa_jwt_secret_key",
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Landlord registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address ?? "",
        role: user.role,
        pgId: user.pgId,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const signupManager = async (req: Request, res: Response) => {
  try {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: result.error.format(),
      });
    }

    const { name, email, phone, password, pgInvitationCode } = result.data;

    // Check email uniqueness
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Verify invitation code
    const pg = await PG.findOne({ invitationCode: pgInvitationCode });
    if (!pg) {
      return res.status(400).json({
        success: false,
        message: "Invalid PG invitation code",
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create manager user associated with PG
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: "MANAGER",
      pgId: pg._id,
      isActive: true,
      approvalStatus: "APPROVED",
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "nivasa_jwt_secret_key",
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Manager registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address ?? "",
        role: user.role,
        pgId: user.pgId,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const signupStudent = async (req: Request, res: Response) => {
  try {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: result.error.format(),
      });
    }

    const {
      name,
      email,
      phone,
      password,
      pgInvitationCode,
      collegeName,
    } = result.data;

    // Check email uniqueness
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Verify invitation code
    const pg = await PG.findOne({ invitationCode: pgInvitationCode });
    if (!pg) {
      return res.status(400).json({
        success: false,
        message: "Invalid PG invitation code",
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create student user with pending approval
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: "STUDENT",
      pgId: pg._id,
      collegeName,
      studentCode: generateStudentCode(),
      isActive: true,
      approvalStatus: "PENDING",
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "nivasa_jwt_secret_key",
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Student registration pending approval",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address ?? "",
        collegeName: user.collegeName,
        studentCode: user.studentCode,
        role: user.role,
        pgId: user.pgId,
        approvalStatus: user.approvalStatus,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: result.error.format(),
      });
    }

    const { email: identifier, password } = result.data;

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/mobile number or password",
      });
    }

    // Check password
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/mobile number or password",
      });
    }

    // Check if active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    if (user.role === "STUDENT" && !user.studentCode) {
      user.studentCode = generateStudentCode();
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "nivasa_jwt_secret_key",
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address ?? "",
        collegeName: user.collegeName,
        studentCode: user.studentCode,
        role: user.role,
        pgId: user.pgId,
        approvalStatus: user.approvalStatus,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  try {
    // Clear the cookie
    res.clearCookie("access_token");
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const result = forgotPasswordSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
      });
    }

    const { email } = result.data;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, a reset link has been sent",
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id, type: "reset-password" },
      process.env.JWT_SECRET || "nivasa_jwt_secret_key",
      { expiresIn: "1h" }
    );

    // Store hash in user document or separate collection
    // For prototype, we'll send it via a dev link
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // In production, send email. For dev, provide token in response
    return res.status(200).json({
      success: true,
      message: "Reset token generated",
      resetToken: process.env.NODE_ENV === "development" ? resetToken : undefined,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const result = resetPasswordSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
      });
    }

    const { token, newPassword } = result.data;

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "nivasa_jwt_secret_key");
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Find user
    const user = await User.findOne({
      _id: decoded.userId,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);
    user.passwordHash = passwordHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId).select("-passwordHash");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    if (user.role === "STUDENT" && !user.studentCode) {
      const studentCode = generateStudentCode();
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id, studentCode: { $exists: false } },
        { studentCode },
        { new: true }
      ).select("-passwordHash");
      if (updatedUser) {
        return res.status(200).json({
          success: true,
          user: updatedUser,
        });
      }
      const refreshedUser = await User.findById(user._id).select("-passwordHash");
      if (!refreshedUser?.studentCode) {
        throw new Error("Unable to create a student account code.");
      }
      return res.status(200).json({
        success: true,
        user: refreshedUser,
      });
    }
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const result = updateProfileSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: result.error.format(),
      });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const conflicts = [];
    if (result.data.email) conflicts.push({ email: result.data.email });
    if (result.data.phone) conflicts.push({ phone: result.data.phone });

    if (conflicts.length > 0) {
      const existingUser = await User.findOne({
        _id: { $ne: userId },
        $or: conflicts,
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email or phone number is already in use",
        });
      }
    }

    const user = await User.findByIdAndUpdate(userId, result.data, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email or phone number is already in use",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};