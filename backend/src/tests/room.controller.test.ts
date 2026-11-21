import { getRooms } from "../controllers/room.controller";
import { PG } from "../models/pg.model";
import { Room } from "../models/room.model";
import { StudentProfile } from "../models/studentprofile.model";

jest.mock("../models/pg.model", () => ({
  PG: {
    findById: jest.fn(),
  },
}));
jest.mock("../models/room.model", () => ({
  Room: {
    create: jest.fn(),
    find: jest.fn(),
  },
}));
jest.mock("../models/studentprofile.model", () => ({
  StudentProfile: {
    find: jest.fn(),
  },
}));

describe("Room inventory API", () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const room = {
    _id: { toString: () => "room-1" },
    floor: 1,
    roomNumber: 1,
    capacity: 2,
    occupiedBeds: 0,
    sharingType: "DOUBLE",
    monthlyRent: 0,
    status: "AVAILABLE",
    facilities: [],
    toObject: () => ({
      _id: "room-1",
      floor: 1,
      roomNumber: 1,
      capacity: 2,
      occupiedBeds: 0,
      sharingType: "DOUBLE",
      monthlyRent: 0,
      status: "AVAILABLE",
      facilities: [],
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (PG.findById as jest.Mock).mockResolvedValue({
      buildingSetup: {
        floors: [
          {
            floorNumber: 1,
            sharedBathrooms: 1,
            rooms: [{ roomNumber: "1-01", beds: 2, privateBathroom: false }],
          },
        ],
        waterPurifier: { available: false, placement: "COMMON", count: 0 },
        mess: { available: false, meals: [] },
        amenities: [],
      },
    });
    (Room.create as jest.Mock).mockResolvedValue({});
    (Room.find as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([room]);
    (StudentProfile.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue([]),
    });
  });

  it("provisions rooms from saved layout and returns numbered bed slots", async () => {
    await getRooms({ user: { pgId: "pg-1" } } as any, res as any);

    expect(Room.create).toHaveBeenCalledWith(
      expect.objectContaining({ floor: 1, roomNumber: 1, capacity: 2 })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        rooms: [
          expect.objectContaining({
            beds: [
              expect.objectContaining({ bedNumber: "111", occupied: false }),
              expect.objectContaining({ bedNumber: "112", occupied: false }),
            ],
          }),
        ],
      })
    );
  });
});
