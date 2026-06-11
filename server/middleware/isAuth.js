import jwt from "jsonwebtoken";
import { logAuthEvent } from "../config/logger.js";
import { getRedisClient } from "../config/redis.js";

const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication required. Please log in." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const redisClient = getRedisClient();
    if (redisClient) {
      const [isTokenBlacklisted, isUserBlacklisted] = await Promise.all([
        redisClient.get(`blacklist:token:${decoded.jti}`),
        redisClient.get(`blacklist:user:${decoded.userId}`),
      ]);

      if (isTokenBlacklisted || isUserBlacklisted) {
        logAuthEvent("TOKEN_INVALID", req, {
          userId: decoded.userId,
          metadata: { reason: "Session revoked" },
        });
        return res.status(401).json({ message: "Session revoked." });
      }
    }

    req.userId = decoded.userId;
    req.userRole = decoded.role || "user";
    req.token = token;

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
    return res.status(500).json({ message: "Authentication error." });
  }
};

/**
 * Optional auth middleware — attempts to authenticate from cookie
 * but never blocks the request. Sets req.userId, req.userRole and
 * req.token when a valid token is present.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      req.userRole = decoded.role || "user";
      req.token = token;
    }
  } catch {
    // Ignore — auth is optional for this route
  }
  next();
};

export default isAuth;
