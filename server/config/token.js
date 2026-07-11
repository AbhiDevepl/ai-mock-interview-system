import jwt from "jsonwebtoken";
import crypto from "crypto";

// Main token used by the existing auth flow (access token, 7-day expiry)
export function genToken(userId, role = "user") {
  const jti = crypto.randomUUID();
  return jwt.sign({ userId, role, jti, type: "access" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

// Short-lived access token (used by token-rotation flow)
export function genAccessToken(userId, role = "user") {
  const jti = crypto.randomUUID();
  return jwt.sign({ userId, role, jti, type: "access" }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
}

// Long-lived refresh token
export function genRefreshToken(userId, role = "user") {
  const jti = crypto.randomUUID();
  return jwt.sign({ userId, role, jti, type: "refresh" }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
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
