import jwt from "jsonwebtoken";
import crypto from "crypto";

export function genAccessToken(userId, role = "user") {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { userId, role, jti, type: "access" },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );
  return token;
}

export function genRefreshToken(userId, role = "user") {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { userId, role, jti, type: "refresh" },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
  return token;
}

export function genToken(userId, role = "user") {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { userId, role, jti, type: "access" },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
  return token;
}

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    if (error.name === "TokenExpiredError")
      return { valid: false, reason: "expired" };
    if (error.name === "JsonWebTokenError")
      return { valid: false, reason: "invalid" };
    return { valid: false, reason: "error" };
  }
}
