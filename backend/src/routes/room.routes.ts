import { Router } from "express";
import { getRooms } from "../controllers/room.controller";
import { authenticateUser, authorizeRoles } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticateUser, authorizeRoles("LANDLORD", "MANAGER"), getRooms);

export default router;
