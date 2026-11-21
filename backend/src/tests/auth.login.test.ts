import { loginUser } from "../controllers/auth.controller";
import { User } from "../models/user.model";
import { comparePassword } from "../utils/password.util";

jest.mock("../models/user.model", () => ({
  User: {
    findOne: jest.fn(),
  },
}));

jest.mock("../utils/password.util", () => ({
  comparePassword: jest.fn(),
  hashPassword: jest.fn(),
}));

describe("Phone number login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("looks up the account by phone number and authenticates it", async () => {
    const user = {
      _id: "user-id",
      passwordHash: "hashed-password",
      isActive: true,
      role: "STUDENT",
      email: "student@example.com",
      name: "Test Student",
      pgId: "pg-id",
      approvalStatus: "APPROVED",
    };
    const select = jest.fn().mockResolvedValue(user);
    (User.findOne as jest.Mock).mockReturnValue({ select });
    (comparePassword as jest.Mock).mockResolvedValue(true);

    const req = {
      body: { email: "9876543210", password: "password123" },
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;

    await loginUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({
      $or: [{ email: "9876543210" }, { phone: "9876543210" }],
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
