import { z } from "zod";

export const createPGSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  address: z.string().min(2).max(200).trim(),
  city: z.string().min(2).max(50).trim(),
  totalRooms: z.number().int().min(0).max(100),
  facilities: z.array(z.string()).optional(),
});

export const buildingSetupSchema = z
  .object({
    floors: z
      .array(
        z.object({
          floorNumber: z.number().int().min(0).max(30),
          sharedBathrooms: z.number().int().min(0).max(100),
          rooms: z
            .array(
              z.object({
                roomNumber: z
                  .string()
                  .trim()
                  .regex(/^(?:G|\d+)-\d+$/)
                  .max(20),
                beds: z.number().int().min(1).max(20),
                privateBathroom: z.boolean(),
              })
            )
            .min(1)
            .max(100),
        })
      )
      .min(1)
      .max(30),
    waterPurifier: z.object({
      available: z.boolean(),
      placement: z.enum(["COMMON", "PER_FLOOR"]),
      count: z.number().int().min(0).max(100),
    }),
    mess: z.object({
      available: z.boolean(),
      meals: z.array(z.enum(["BREAKFAST", "LUNCH", "DINNER"])),
    }),
    amenities: z.array(
      z.enum([
        "WIFI",
        "LAUNDRY",
        "PARKING",
        "CCTV",
        "SECURITY",
        "POWER_BACKUP",
        "COMMON_AREA",
        "KITCHEN",
        "DINING_AREA",
        "HOUSEKEEPING",
        "ELEVATOR",
        "FIRE_SAFETY",
        "AIR_CONDITIONING",
        "FAN",
      ])
    ),
  })
  .strict()
  .superRefine((setup, context) => {
    const floorNumbers = new Set<number>();
    let totalRooms = 0;
    setup.floors.forEach((floor, floorIndex) => {
      if (floorNumbers.has(floor.floorNumber)) {
        context.addIssue({
          code: "custom",
          path: ["floors", floorIndex, "floorNumber"],
          message: "Floor numbers must be unique",
        });
      }
      floorNumbers.add(floor.floorNumber);
      totalRooms += floor.rooms.length;

      const roomNumbers = new Set<string>();
      floor.rooms.forEach((room, roomIndex) => {
        if (roomNumbers.has(room.roomNumber)) {
          context.addIssue({
            code: "custom",
            path: ["floors", floorIndex, "rooms", roomIndex, "roomNumber"],
            message: "Room numbers must be unique on each floor",
          });
        }
        roomNumbers.add(room.roomNumber);
      });
    });

    if (totalRooms > 500) {
      context.addIssue({
        code: "custom",
        path: ["floors"],
        message: "A building can have at most 500 configured rooms",
      });
    }

    if (setup.waterPurifier.available && setup.waterPurifier.count < 1) {
      context.addIssue({
        code: "custom",
        path: ["waterPurifier", "count"],
        message: "Enter the number of available water purifiers",
      });
    }
  });

export type CreatePGData = z.infer<typeof createPGSchema>;
export type BuildingSetupData = z.infer<typeof buildingSetupSchema>;