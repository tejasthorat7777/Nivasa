import { Router, Request, Response } from "express";
import {
  createPG,
  getMyPG,
  getMyPGs,
  setActivePG,
  updateBuildingSetup,
  updatePG,
} from "../controllers/pg.controller";
import { authenticateUser, authorizeRoles, verifyPgAccess } from "../middleware/auth.middleware";

const router = Router();

// Landlord creates/updates PG
router.post("/", authenticateUser, authorizeRoles("LANDLORD"), createPG);
router.get(
  "/my-pgs",
  authenticateUser,
  authorizeRoles("LANDLORD"),
  getMyPGs
);
router.patch(
  "/active",
  authenticateUser,
  authorizeRoles("LANDLORD"),
  setActivePG
);
router.get("/my-pg", authenticateUser, getMyPG);
router.patch(
  "/my-pg/building-setup",
  authenticateUser,
  authorizeRoles("LANDLORD"),
  updateBuildingSetup
);
router.patch("/:id", authenticateUser, authorizeRoles("LANDLORD"), updatePG);

export default router;