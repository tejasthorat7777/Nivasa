import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        pgId?: string;
        name?: string;
        email?: string;
      };
    }
  }
}

export interface IAuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    pgId?: string;
    name?: string;
    email?: string;
  };
}

export const authenticateUser = async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.access_token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "nivasa_jwt_secret_key") as {
      userId: string;
    };

    const user = await User.findById(decoded.userId).select("-passwordHash");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User not found or inactive",
      });
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
      pgId: user.pgId?.toString(),
      name: user.name,
      email: user.email,
    };

    next();
  } catch (error: any) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: IAuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.role) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - No role assigned",
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden - Role ${req.user.role} not authorized`,
      });
    }
    next();
  };
};

export const verifyPgAccess = async (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.pgId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - No PG access",
      });
    }

    // For landlords, verify they own the PG
    if (req.user.role === "LANDLORD") {
      const pg = await globalThis.PG?.findById(req.user.pgId);
      if (!pg || pg.ownerId.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden - You do not own this PG",
        });
      }
    }

    // For managers and students, verify they are associated with the PG
    if (req.user.role === "MANAGER" || req.user.role === "STUDENT") {
      const isAssociated = await globalThis.StudentProfile?.findOne({
        _id: req.user.userId,
        pgId: req.user.pgId,
      });
      if (!isAssociated) {
        return res.status(403).json({
          success: false,
          message: "Forbidden - You are not associated with this PG",
        });
      }
    }

    next();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};