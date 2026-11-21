import { Router } from "express";
import {
  assignStudentToBed,
  getStudents,
  lookupStudentByCode,
} from "../controllers/student.controller";
import { authenticateUser, authorizeRoles } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  authenticateUser,
  authorizeRoles("LANDLORD", "MANAGER"),
  getStudents
);
router.get(
  "/lookup/:studentCode",
  authenticateUser,
  authorizeRoles("LANDLORD"),
  lookupStudentByCode
);
router.post(
  "/assign-bed",
  authenticateUser,
  authorizeRoles("LANDLORD"),
  assignStudentToBed
);

export default router;
