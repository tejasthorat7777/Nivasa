import { Router, Request, Response } from "express";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcement.controller";
import { authenticateUser } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/auth.middleware";

const router = Router();

// Get announcements filtered by target audience
router.get("/", authenticateUser, getAnnouncements);

// Create new announcement (landlord only)
router.post("/", authenticateUser, authorizeRoles("LANDLORD"), createAnnouncement);

// Delete announcement (landlord who owns the PG only)
router.delete("/:id", authenticateUser, authorizeRoles("LANDLORD"), deleteAnnouncement);

export default router;