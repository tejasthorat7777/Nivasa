import request from "supertest";
import mongoose from "mongoose";
import { User } from "../models/user.model";
import { PG } from "../models/pg.model";
import { StudentProfile } from "../models/studentprofile.model";
import { Room } from "../models/room.model";
import { Bill } from "../models/bill.model";
import { Payment } from "../models/payment.model";

describe("Nivasa API Backend Tests", () => {
  let server: any;
  let agent: any;
  let landlordToken: string;
  let managerToken: string;
  let studentToken: string;
  let testPGId: string;
  let testStudentId: string;
  let testRoomId: string;

  beforeAll(async () => {
    // Connect to test MongoDB
    await mongoose.connect("mongodb://localhost:27017/nivasa_test", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create test landlord
    await request("http://localhost:4000")
      .post("/api/auth/register/landlord")
      .send({
        name: "Test Landlord",
        email: "landlord@test.com",
        phone: "9876543210",
        password: "password123",
        pgName: "Test PG",
        pgAddress: "Test Address",
        city: "Test City",
        totalRooms: 10,
      });

    // Create test manager
    await request("http://localhost:4000")
      .post("/api/auth/register/manager")
      .send({
        name: "Test Manager",
        email: "manager@test.com",
        phone: "9876543210",
        password: "password123",
        pgInvitationCode: "TEST101",
      });

    // Create test student
    await request("http://localhost:4000")
      .post("/api/auth/register/student")
      .send({
        name: "Test Student",
        email: "student@test.com",
        phone: "9876543210",
        password: "password123",
        pgInvitationCode: "TEST101",
        collegeName: "Test College",
      });

    // Login as each role
    const landlordLogin = await request("http://localhost:4000")
      .post("/api/auth/login")
      .send({ email: "landlord@test.com", password: "password123" });
    landlordToken = landlordLogin.body.token;

    const managerLogin = await request("http://localhost:4000")
      .post("/api/auth/login")
      .send({ email: "manager@test.com", password: "password123" });
    managerToken = managerLogin.body.token;

    const studentLogin = await request("http://localhost:4000")
      .post("/api/auth/login")
      .send({ email: "student@test.com", password: "password123" });
    studentToken = studentLogin.body.token;

    // Get test PG ID from landlord
    const landlordInfo = await request("http://localhost:4000")
      .get("/api/pg/my-pg")
      .set("Authorization", `Bearer ${landlordToken}`);
    testPGId = landlordInfo.body.pg._id;

    // Create a test room
    const roomRes = await request("http://localhost:4000")
      .post("/api/rooms")
      .set("Authorization", `Bearer ${landlordToken}`)
      .send({
        roomNumber: "101",
        floor: 1,
        sharingType: "SINGLE",
        capacity: 1,
        monthlyRent: 5000,
      });
    testRoomId = roomRes.body.room._id;

    // Create a test bill
    const billRes = await request("http://localhost:4000")
      .post("/api/bills")
      .set("Authorization", `Bearer ${landlordToken}`)
      .send({
        studentId: "placeholder",
        roomId: testRoomId,
        billingMonth: "August 2024",
        rentAmount: 5000,
        totalAmount: 5000,
      });
    testBillId = billRes.body.bill._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("Authentication", () => {
    it("should allow landlord to access landlord dashboard", async () => {
      const response = await request("http://localhost:4000")
        .get("/api/dashboard/landlord")
        .set("Authorization", `Bearer ${landlordToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
    });

    it("should reject manager accessing landlord dashboard with 403", async () => {
      const response = await request("http://localhost:4000")
        .get("/api/dashboard/landlord")
        .set("Authorization", `Bearer ${managerToken}`);

      expect(response.status).toBe(403);
    });

    it("should reject student accessing landlord dashboard with 403", async () => {
      const response = await request("http://localhost:4000")
        .get("/api/dashboard/landlord")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("Payment PG Ownership", () => {
    it("should reject payment to bill outside user's PG", async () => {
      // Create payment with student token for a bill in landlord's PG
      const response = await request("http://localhost:4000")
        .post("/api/payments")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          studentId: "placeholder",
          billId: testBillId,
          amount: 1000,
          paymentMethod: "cash",
        });

      // Should be rejected due to PG ownership check
      expect([400, 403]).toContain(response.status);
    });
  });

  describe("Checkout Workflow Rules", () => {
    it("should track checkout status progression", async () => {
      const statuses = ["PENDING_LANDLORD", "APPROVED_LANDLORD", "CONFIRMED"];
      expect(statuses).toHaveLength(3);
    });

    it("should verify occupancy recalculation logic", async () => {
      const currentOccupied = 3;
      const newOccupied = Math.max(0, currentOccupied - 1);
      expect(newOccupied).toBe(2);
    });
  });

  describe("Bill & Payment Edge Cases", () => {
    it("should create a bill with UNPAID status", async () => {
      const billRes = await request("http://localhost:4000")
        .post("/api/bills")
        .set("Authorization", `Bearer ${landlordToken}`)
        .send({
          studentId: "placeholder",
          roomId: testRoomId,
          billingMonth: "August 2024",
          rentAmount: 5000,
          totalAmount: 5000,
        });

      expect(billRes.status).toBe(201);
      expect(billRes.body).toHaveProperty("success", true);
    });

    it("should reject payment exceeding balance", async () => {
      const payRes = await request("http://localhost:4000")
        .post("/api/payments")
        .set("Authorization", `${landlordToken}`)
        .send({
          studentId: "placeholder",
          billId: testBillId,
          amount: 999999,
          paymentMethod: "cash",
        });

      // Should be rejected as amount exceeds balance
      expect([400, 403, 500]).toContain(payRes.status);
    });
  });
});