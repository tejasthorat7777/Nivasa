import { z } from "zod";

export const assignBedSchema = z
  .object({
    roomId: z.string().min(1),
    bedNumber: z.string().regex(/^\d{3,7}$/),
    studentCode: z.string().regex(/^[A-F0-9]{10}$/i),
    monthlyRent: z.number().finite().min(1).max(10000000),
    address: z.string().trim().min(2).max(200),
  })
  .strict();
