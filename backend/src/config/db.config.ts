export const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/nivasa";

export const JWT_SECRET = process.env.JWT_SECRET || "nivasa_jwt_secret_key";

export const PORT = process.env.PORT || 4000;

export const BCRYPT_SALT = Number(process.env.BCRYPT_SALT) || 10;

export const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";