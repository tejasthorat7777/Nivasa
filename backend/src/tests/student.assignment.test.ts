import { assignStudentToBed } from "../controllers/student.controller";
import { lookupStudentByCode } from "../controllers/student.controller";
import { PG } from "../models/pg.model";
import { Room } from "../models/room.model";
import { StudentProfile } from "../models/studentprofile.model";
import { User } from "../models/user.model";

jest.mock("../models/room.model", () => ({
  Room: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));
jest.mock("../models/studentprofile.model", () => ({
  StudentProfile: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));
jest.mock("../models/user.model", () => ({
  User: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));
jest.mock("../models/pg.model", () => ({
  PG: {
    findById: jest.fn(),
  },
}));

describe("Student bed assignment", () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const room = {
    _id: "room-id",
    floor: 1,
    roomNumber: 1,
    capacity: 2,
  };
  const student = {
    _id: "user-id",
    name: "Asha Student",
    email: "asha@example.com",
    phone: "9876543210",
    studentCode: "A1B2C3D4E5",
    collegeName: "City College",
  };
  const studentProfile = { _id: "profile-id" };
  const occupiedRoom = {
    ...room,
    occupiedBeds: 1,
    status: "PARTIALLY_OCCUPIED",
    save: jest.fn().mockResolvedValue(undefined),
  };
  const linkedStudent = {
    ...student,
    address: "Pune",
    approvalStatus: "APPROVED",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (User.findOne as jest.Mock).mockResolvedValue(student);
    (Room.findOne as jest.Mock).mockResolvedValue(room);
    (StudentProfile.findOne as jest.Mock).mockResolvedValue(null);
    (StudentProfile.create as jest.Mock).mockResolvedValue(studentProfile);
    (Room.findOneAndUpdate as jest.Mock).mockResolvedValue(occupiedRoom);
    const select = jest.fn().mockResolvedValue(linkedStudent);
    (User.findOneAndUpdate as jest.Mock).mockReturnValue({ select });
  });

  it("links the student account to the selected bed and saves rent", async () => {
    await assignStudentToBed(
      {
        user: { role: "LANDLORD", pgId: "pg-id" },
        body: {
          roomId: "room-id",
          bedNumber: "111",
          studentCode: "A1B2C3D4E5",
          monthlyRent: 12500,
          address: "Pune",
        },
      } as any,
      res as any
    );

    expect(StudentProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-id",
        pgId: "pg-id",
        roomId: "room-id",
        bedNumber: "111",
        monthlyRent: 12500,
        collegeName: "City College",
        status: "ACTIVE",
      })
    );
    expect(Room.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: "room-id",
        pgId: "pg-id",
        occupiedBeds: { $lt: 2 },
      }),
      { $inc: { occupiedBeds: 1 } },
      { new: true }
    );
    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: "user-id",
        role: "STUDENT",
        isActive: true,
        approvalStatus: { $ne: "REJECTED" },
      }),
      { pgId: "pg-id", address: "Pune", approvalStatus: "APPROVED" },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("finds eligible students globally and reports their current PG assignment", async () => {
    const activeProfile = {
      pgId: { toString: () => "old-pg-id" },
      bedNumber: "221",
    };
    const selectStudent = jest.fn().mockResolvedValue(student);
    const selectPG = jest.fn().mockResolvedValue({ name: "Old PG" });
    (User.findOne as jest.Mock).mockReturnValue({ select: selectStudent });
    (StudentProfile.findOne as jest.Mock).mockResolvedValue(activeProfile);
    (PG.findById as jest.Mock).mockReturnValue({ select: selectPG });

    await lookupStudentByCode(
      {
        user: { role: "LANDLORD", pgId: "new-pg-id" },
        params: { studentCode: "a1b2c3d4e5" },
      } as any,
      res as any
    );

    expect(User.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        studentCode: "A1B2C3D4E5",
        role: "STUDENT",
      })
    );
    expect((User.findOne as jest.Mock).mock.calls[0][0]).not.toHaveProperty("pgId");
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        student: expect.objectContaining({
          currentAssignment: {
            pgId: "old-pg-id",
            pgName: "Old PG",
            bedNumber: "221",
            isCurrentPG: false,
          },
        }),
      })
    );
  });

  it("transfers an active student and releases the previous PG bed", async () => {
    const previousProfile: {
      pgId: { toString: () => string };
      roomId: string;
      status: string;
      checkoutStatus?: string;
      actualCheckoutDate?: Date;
      save: jest.Mock;
    } = {
      pgId: { toString: () => "old-pg-id" },
      roomId: "old-room-id",
      status: "ACTIVE",
      save: jest.fn().mockResolvedValue(undefined),
    };
    const previousRoom = {
      _id: "old-room-id",
      pgId: "old-pg-id",
      occupiedBeds: 1,
      capacity: 2,
      status: "PARTIALLY_OCCUPIED",
      save: jest.fn().mockResolvedValue(undefined),
    };
    const releasedRoom = {
      ...previousRoom,
      occupiedBeds: 0,
      save: jest.fn().mockResolvedValue(undefined),
    };
    const newOccupiedRoom = {
      ...occupiedRoom,
      occupiedBeds: 1,
      save: jest.fn().mockResolvedValue(undefined),
    };
    (StudentProfile.findOne as jest.Mock)
      .mockResolvedValueOnce(previousProfile)
      .mockResolvedValueOnce(null);
    (Room.findOne as jest.Mock)
      .mockResolvedValueOnce(room)
      .mockResolvedValueOnce(previousRoom);
    (Room.findOneAndUpdate as jest.Mock)
      .mockResolvedValueOnce(releasedRoom)
      .mockResolvedValueOnce(newOccupiedRoom);
    (User.findOneAndUpdate as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(linkedStudent),
    });

    await assignStudentToBed(
      {
        user: { role: "LANDLORD", pgId: "new-pg-id" },
        body: {
          roomId: "room-id",
          bedNumber: "111",
          studentCode: "A1B2C3D4E5",
          monthlyRent: 12500,
          address: "Pune",
        },
      } as any,
      res as any
    );

    expect(previousProfile.status).toBe("TRANSFERRED");
    expect(previousProfile.checkoutStatus).toBe("CONFIRMED");
    expect(previousProfile.actualCheckoutDate).toBeInstanceOf(Date);
    expect(Room.findOneAndUpdate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ _id: "old-room-id", occupiedBeds: { $gt: 0 } }),
      { $inc: { occupiedBeds: -1 } },
      { new: true }
    );
    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: "user-id",
        role: "STUDENT",
        isActive: true,
        approvalStatus: { $ne: "REJECTED" },
      }),
      { pgId: "new-pg-id", address: "Pune", approvalStatus: "APPROVED" },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
