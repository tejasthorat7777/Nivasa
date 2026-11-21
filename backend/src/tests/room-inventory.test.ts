import { ensureRoomsFromBuildingSetup } from "../utils/room-inventory.util";
import { Room } from "../models/room.model";

jest.mock("../models/room.model", () => ({
  Room: {
    find: jest.fn(),
    create: jest.fn(),
  },
}));
jest.mock("../models/studentprofile.model", () => ({
  StudentProfile: {
    find: jest.fn(),
  },
}));

describe("Room inventory provisioning", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Room.find as jest.Mock).mockResolvedValue([]);
    (Room.create as jest.Mock).mockResolvedValue({});
  });

  it("creates operational room records from the saved building layout", async () => {
    await ensureRoomsFromBuildingSetup("pg-1", {
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
    });

    expect(Room.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pgId: "pg-1",
        floor: 1,
        roomNumber: 1,
        capacity: 2,
        occupiedBeds: 0,
      })
    );
  });
});
