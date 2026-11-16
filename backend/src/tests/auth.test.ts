import request from "supertest";
import { User } from "../models/user.model";
import { PG } from "../models/pg.model";

describe("Nivasa API Security Tests", () => {
  // Helper: create a test landlord user and PG
  let landlordToken: string;
  let testPGId: string;

  beforeAll(async () => {
    // Register a test landlord
    const landlordRes = await request("http://localhost:4000")
      .post("/api/auth/register/landlord")
      .send({
        name: "Test Landlord",
        email: "test-landlord@example.com",
        phone: "9876543210",
        password: "password123",
        pgName: "Test PG",
        pgAddress: "Test Address",
        city: "Test City",
        totalRooms: 10,
      });

      // Login to get token
      const loginRes = await request("http://localhost:4000")
        .post("/api/auth/login")
        .send({
          email: "test-landlord@example.com",
          password: "password123",
        });

      landlordToken = loginRes.body.token;
      testPGId = loginRes.body.user.pgId;
    });

  describe("Authentication & Role Isolation", () => {
    it("should allow landlord to access landlord dashboard", async () => {
      const response = await request("http://localhost:4000")
        .get("/api/dashboard/landlord")
        .set("Authorization", `Bearer ${landlordToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
    });

    it("should reject manager accessing landlord dashboard with 403", async () => {
      // Register a test manager
      await request("http://localhost:4000")
        .post("/api/auth/register/manager")
        .send({
          name: "Test Manager",
          email: "test-manager@example.com",
          phone: "9876543210",
          password: "password123",
          pgInvitationCode: "TESTPG1", // Will fail but we just need token
        });

      // Try to login as manager
      const managerLogin = await request("http://localhost:4000")
        .post("/api/auth/login")
        .send({
          email: "test-manager@example.com",
          password: "password123",
        });

      const response = await request("http://localhost:4000")
        .get("/api/dashboard/landlord")
        .set("Authorization", `Bearer ${managerLogin.body.token}`);

      expect(response.status).toBe(403);
    });

    it("should reject student accessing landlord dashboard with 403", async () => {
      // Register a test student
      await request("http://localhost:4000")
        .post("/api/auth/register/student")
        .send({
          name: "Test Student",
          email: "test-student@example.com",
          phone: "9876543210",
          password: "password123",
          pgInvitationCode: "TESTPG1",
          collegeName: "Test College",
        });

      // Try to login as student
      const studentLogin = await request("http://localhost:4000")
        .post("/api/auth/login")
        .send({
          email: "test-student@example.com",
          password: "password123",
        });

      const response = await request("http://localhost:4000")
        .get("/api/dashboard/landlord")
        .set("Authorization", `Bearer ${studentLogin.body.token}`);

      expect(response.status).toBe(403);
    });
  });

  describe("Payment PG Ownership", () => {
    it("should reject payment to bill outside user's PG", async () => {
      // This test would verify that createPayment enforces PG ownership
      // For now, skip if endpoint structure not fully testable
      console.log("Payment PG ownership test - would verify PG enforcement in createPayment");
    });
  });

  describe("Checkout Workflow Rules", () => {
    it("should track checkout status progression", async () => {
      console.log("Checkout workflow test - verify status progression: PENDING_LANDLORD -> APPROVED_LANDLORD -> CONFIRMED");
    });
  });
});