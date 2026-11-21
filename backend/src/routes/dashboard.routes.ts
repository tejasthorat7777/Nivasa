import { Router } from "express";
import {
  getLandlordDashboard,
  getManagerDashboard,
  getStudentDashboard,
} from "../controllers/dashboard.controller";
import { authenticateUser, authorizeRoles } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/landlord",
  authenticateUser,
  authorizeRoles("LANDLORD"),
  getLandlordDashboard
);
router.get(
  "/manager",
  authenticateUser,
  authorizeRoles("MANAGER"),
  getManagerDashboard
);
router.get(
  "/student",
  authenticateUser,
  authorizeRoles("STUDENT"),
  getStudentDashboard
);

export default router;
