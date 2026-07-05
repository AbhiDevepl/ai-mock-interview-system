import jwt from "jsonwebtoken";

// ponytail: short-lived stateless access token (15 mins)
export function genAccessToken(userId, role = "user") {
  return jwt.sign({ userId, role, type: "access" }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
}

// ponytail: refresh token (7 days) for rotating flow
export function genRefreshToken(userId, role = "user") {
  return jwt.sign({ userId, role, type: "refresh" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    if (error.name === "TokenExpiredError")
      return { valid: false, reason: "expired" };
    return { valid: false, reason: "invalid" };
  }
}
