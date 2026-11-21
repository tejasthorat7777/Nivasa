import { randomBytes } from "crypto";

export const generateStudentCode = () =>
  randomBytes(5).toString("hex").toUpperCase();
