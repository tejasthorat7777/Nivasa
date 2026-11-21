import { getMyPGs, setActivePG } from "../controllers/pg.controller";
import { PG } from "../models/pg.model";
import { User } from "../models/user.model";
import { createPGSchema } from "../validators/pg.validators";

jest.mock("../models/pg.model", () => ({
  PG: {
    find: jest.fn(),
    findOne: jest.fn(),
  },
}));
jest.mock("../models/user.model", () => ({
  User: {
    findByIdAndUpdate: jest.fn(),
  },
}));

describe("Landlord multi-property management", () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows a property to be created before its rooms are configured", () => {
    expect(
      createPGSchema.safeParse({
        name: "Willow House",
        address: "12 Lake Road",
        city: "Pune",
        totalRooms: 0,
      }).success
    ).toBe(true);
  });

  it("lists properties owned by the authenticated landlord", async () => {
    const properties = [
      {
        _id: { toString: () => "pg-1" },
        name: "Willow House",
        address: "12 Lake Road",
        city: "Pune",
        invitationCode: "NIVA23",
        totalRooms: 4,
      },
    ];
    const query = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(properties),
    };
    (PG.find as jest.Mock).mockReturnValue(query);

    await getMyPGs(
      { user: { userId: "landlord-id" } } as any,
      res as any
    );

    expect(PG.find).toHaveBeenCalledWith({ ownerId: "landlord-id" });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: [
          expect.objectContaining({
            id: "pg-1",
            name: "Willow House",
          }),
        ],
      })
    );
  });

  it("only switches to a property owned by the landlord", async () => {
    const pg = { _id: "pg-1", name: "Willow House" };
    const user = { _id: "landlord-id", pgId: "pg-1" };
    (PG.findOne as jest.Mock).mockResolvedValue(pg);
    (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });

    await setActivePG(
      {
        user: { userId: "landlord-id" },
        body: { pgId: "pg-1" },
      } as any,
      res as any
    );

    expect(PG.findOne).toHaveBeenCalledWith({
      _id: "pg-1",
      ownerId: "landlord-id",
    });
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "landlord-id",
      { pgId: "pg-1" },
      { new: true, runValidators: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
