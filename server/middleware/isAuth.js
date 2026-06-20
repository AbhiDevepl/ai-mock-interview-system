import jwt from "jsonwebtoken";
import { logAuthEvent } from "../config/logger.js";
import { isJtiBlacklisted, getSession } from "../services/session.service.js";

const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication required. Please log in." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId, role, jti } = decoded;

    const blacklisted = await isJtiBlacklisted(jti);
    if (blacklisted) {
      logAuthEvent("TOKEN_INVALID", req, {
        userId,
        metadata: { reason: "Session revoked (blacklisted)", jti },
      });
      return res.status(401).json({ message: "Session revoked." });
    }

    req.userId = userId;
    req.userRole = role || "user";
    req.token = token;
    req.jti = jti;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      logAuthEvent("TOKEN_EXPIRED", req, {
        metadata: { error: error.message },
      });
      return res
        .status(401)
        .json({ message: "Session expired. Please log in again." });
    }
    if (error.name === "JsonWebTokenError") {
      logAuthEvent("TOKEN_INVALID", req, {
        metadata: { error: error.message },
      });
      return res.status(401).json({ message: "Invalid authentication token." });
    }
    return res.status(401).json({ message: "Authentication error." });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const blacklisted = await isJtiBlacklisted(decoded.jti);
      if (!blacklisted) {
        req.userId = decoded.userId;
        req.userRole = decoded.role || "user";
        req.token = token;
        req.jti = decoded.jti;
      }
    }
  } catch {
  }
  next();
};

export default isAuth;
