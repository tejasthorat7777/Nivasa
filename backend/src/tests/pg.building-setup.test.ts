import { updateBuildingSetup } from "../controllers/pg.controller";
import { PG } from "../models/pg.model";
import { Room } from "../models/room.model";

jest.mock("../models/pg.model", () => ({
  PG: {
    findOneAndUpdate: jest.fn(),
  },
}));
jest.mock("../models/room.model", () => ({
  Room: {
    find: jest.fn(),
    create: jest.fn(),
  },
}));
jest.mock("../models/studentprofile.model", () => ({
  StudentProfile: {
    countDocuments: jest.fn(),
  },
}));

describe("PG building setup", () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const setup = {
    floors: [
      {
        floorNumber: 0,
        sharedBathrooms: 1,
        rooms: [
          { roomNumber: "G-01", beds: 2, privateBathroom: false },
          { roomNumber: "G-02", beds: 1, privateBathroom: true },
        ],
      },
    ],
    waterPurifier: {
      available: true,
      placement: "COMMON",
      count: 1,
    },
    mess: {
      available: true,
      meals: ["BREAKFAST", "DINNER"],
    },
    amenities: ["WIFI", "FIRE_SAFETY"],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Room.find as jest.Mock).mockResolvedValue([]);
    (Room.create as jest.Mock).mockResolvedValue({});
  });

  it("saves the layout and derives the PG room total from configured floors", async () => {
    const updatedPG = { id: "pg-id", totalRooms: 2, buildingSetup: setup };
    (PG.findOneAndUpdate as jest.Mock).mockResolvedValue(updatedPG);

    await updateBuildingSetup(
      { user: { userId: "landlord-id", pgId: "pg-id" }, body: setup } as any,
      res as any
    );

    expect(PG.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: "pg-id", ownerId: "landlord-id" },
      { buildingSetup: setup, totalRooms: 2 },
      { new: true, runValidators: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, pg: updatedPG })
    );
  });

  it("rejects duplicate floor numbers before writing", async () => {
    const invalidSetup = {
      ...setup,
      floors: [setup.floors[0], setup.floors[0]],
    };

    await updateBuildingSetup(
      { user: { userId: "landlord-id" }, body: invalidSetup } as any,
      res as any
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(PG.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("requires an authenticated landlord account", async () => {
    await updateBuildingSetup({ body: setup } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(PG.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
