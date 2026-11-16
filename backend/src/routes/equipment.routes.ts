import { Router, Request, Response } from "express";
import { authenticateUser, authorizeRoles } from "../middleware/auth.middleware";
import {
  getEquipment,
  createEquipment,
  updateEquipmentStatus,
} from "../controllers/equipment.controller";

const router = Router();

// Get equipment list with optional filtering
router.get("/", authenticateUser, getEquipment);

// Create new equipment item
router.post("/", authenticateUser, authorizeRoles("LANDLORD"), createEquipment);

// Update equipment status
router.patch("/:id/status", authenticateUser, updateEquipmentStatus);

export default router;