import express from "express";
import request from "supertest";
import dashboardRoutes from "../routes/dashboard.routes";

jest.mock("../middleware/auth.middleware", () => {
  const actual = jest.requireActual("../middleware/auth.middleware");
  return {
    ...actual,
    authenticateUser: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
      req.user = {
        userId: "test-user",
        role: req.header("x-test-role") ?? "",
        pgId: "test-pg",
      };
      next();
    },
  };
});

jest.mock("../controllers/dashboard.controller", () => ({
  getLandlordDashboard: (_req: express.Request, res: express.Response) =>
    res.status(200).json({ success: true, dashboard: {} }),
  getManagerDashboard: (_req: express.Request, res: express.Response) =>
    res.status(200).json({ success: true, dashboard: {} }),
  getStudentDashboard: (_req: express.Request, res: express.Response) =>
    res.status(200).json({ success: true, dashboard: {} }),
}));

const app = express();
app.use("/api/dashboard", dashboardRoutes);

describe("Dashboard routes", () => {
  it("serves the student dashboard to students", async () => {
    const response = await request(app)
      .get("/api/dashboard/student")
      .set("x-test-role", "STUDENT");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, dashboard: {} });
  });

  it("rejects other roles from the student dashboard", async () => {
    const response = await request(app)
      .get("/api/dashboard/student")
      .set("x-test-role", "MANAGER");

    expect(response.status).toBe(403);
  });
});
