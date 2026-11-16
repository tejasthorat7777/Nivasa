import { Router, Request, Response } from "express";
import {
  submitCheckout,
  landlordApproveCheckout,
  managerConfirmCheckout,
  getCheckoutRequests,
} from "../controllers/checkout.controller";
import { authenticateUser } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/auth.middleware";

const router = Router();

// Student submits checkout notice
router.post("/checkout", authenticateUser, submitCheckout);

// Landlord reviews pending checkout requests
router.get(
  "/checkout/requests",
  authenticateUser,
  authorizeRoles("LANDLORD"),
  getCheckoutRequests
);

// Landlord approves checkout request
router.patch(
  "/checkout/:id/approve",
  authenticateUser,
  authorizeRoles("LANDLORD"),
  landlordApproveCheckout
);

// Manager confirms actual checkout
router.patch(
  "/checkout/:id/confirm",
  authenticateUser,
  authorizeRoles("MANAGER"),
  managerConfirmCheckout
);

export default router;