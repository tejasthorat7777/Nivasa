import { Router, Request, Response } from "express";
import { createPG, getMyPG, updatePG } from "../controllers/pg.controller";
import { authenticateUser, authorizeRoles, verifyPgAccess } from "../middleware/auth.middleware";

const router = Router();

// Landlord creates/updates PG
router.post("/", authenticateUser, authorizeRoles("LANDLORD"), createPG);
router.get("/my-pg", authenticateUser, getMyPG);
router.patch("/:id", authenticateUser, authorizeRoles("LANDLORD"), updatePG);

export default router;