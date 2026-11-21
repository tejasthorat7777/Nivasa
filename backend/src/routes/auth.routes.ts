import { Router, Request, Response } from "express";
import {
  signupLandlord,
  signupManager,
  signupStudent,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
} from "../controllers/auth.controller";
import { authenticateUser } from "../middleware/auth.middleware";

const router = Router();

// Landlord registration
router.post("/register/landlord", signupLandlord);

// Manager registration (requires invitation code)
router.post("/register/manager", signupManager);

// Student registration (requires invitation code)
router.post("/register/student", signupStudent);

// Login
router.post("/login", loginUser);

// Logout
router.post("/logout", authenticateUser, logoutUser);

// Get current user profile
router.get("/me", authenticateUser, getMe);
router.patch("/me", authenticateUser, updateProfile);

// Forgot password
router.post("/forgot-password", forgotPassword);

// Reset password
router.post("/reset-password", resetPassword);

export default router;