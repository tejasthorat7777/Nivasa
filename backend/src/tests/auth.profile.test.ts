import { updateProfile } from "../controllers/auth.controller";
import { User } from "../models/user.model";

jest.mock("../models/user.model", () => ({
  User: {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

describe("Profile updates", () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates only validated profile fields and returns the saved user", async () => {
    const updatedUser = {
      id: "user-id",
      name: "Updated Name",
      email: "updated@example.com",
      phone: "9876543210",
      address: "New address",
    };
    (User.findOne as jest.Mock).mockResolvedValue(null);
    const select = jest.fn().mockResolvedValue(updatedUser);
    (User.findByIdAndUpdate as jest.Mock).mockReturnValue({ select });

    await updateProfile(
      {
        user: { userId: "user-id" },
        body: {
          name: "Updated Name",
          email: "UPDATED@example.com",
          phone: "9876543210",
          address: "New address",
        },
      } as any,
      res as any
    );

    expect(User.findOne).toHaveBeenCalledWith({
      _id: { $ne: "user-id" },
      $or: [
        { email: "updated@example.com" },
        { phone: "9876543210" },
      ],
    });
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "user-id",
      {
        name: "Updated Name",
        email: "updated@example.com",
        phone: "9876543210",
        address: "New address",
      },
      { new: true, runValidators: true }
    );
    expect(select).toHaveBeenCalledWith("-passwordHash");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, user: updatedUser })
    );
  });

  it("rejects email or phone values owned by another user", async () => {
    (User.findOne as jest.Mock).mockResolvedValue({ id: "another-user" });

    await updateProfile(
      {
        user: { userId: "user-id" },
        body: { email: "taken@example.com" },
      } as any,
      res as any
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("does not accept role or PG association changes", async () => {
    await updateProfile(
      {
        user: { userId: "user-id" },
        body: { role: "LANDLORD", pgId: "another-pg" },
      } as any,
      res as any
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(User.findOne).not.toHaveBeenCalled();
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});
