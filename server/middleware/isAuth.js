import jwt from "jsonwebtoken";
import { logAuthEvent } from "../config/logger.js";
import { isJtiBlacklisted, getSession } from "../services/session.service.js";
import { COOKIE_OPTIONS } from "../config/cookie.js";

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
    const deviceId = req.cookies?.deviceId;

    if (!deviceId) {
      res.clearCookie("token", COOKIE_OPTIONS);
      res.clearCookie("deviceId", COOKIE_OPTIONS);
      logAuthEvent("TOKEN_INVALID", req, {
        userId,
        metadata: { reason: "Missing device binding", jti },
      });
      return res.status(401).json({ message: "Invalid session." });
    }

    // Security: bind the JWT to the session record stored against this
    // device. A token presented without a matching, current session (e.g.
    // stolen and replayed from another device) is rejected even though
    // the JWT signature itself is valid.
    const session = await getSession(userId, deviceId);
    if (!session || session.jti !== jti) {
      res.clearCookie("token", COOKIE_OPTIONS);
      res.clearCookie("deviceId", COOKIE_OPTIONS);
      logAuthEvent("TOKEN_INVALID", req, {
        userId,
        metadata: { reason: "Session invalid or device mismatch", jti, deviceId },
      });
      return res.status(401).json({ message: "Session invalid or expired." });
    }

    const blacklisted = await isJtiBlacklisted(jti);
    if (blacklisted) {
      res.clearCookie("token", COOKIE_OPTIONS);
      res.clearCookie("deviceId", COOKIE_OPTIONS);
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
    res.clearCookie("token", COOKIE_OPTIONS);
    res.clearCookie("deviceId", COOKIE_OPTIONS);
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
    const deviceId = req.cookies?.deviceId;

    if (token && deviceId) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { userId, role, jti } = decoded;

      // Security: even in optional auth, we enforce device binding if a token is present.
      // This prevents a stolen token from being used in "soft" auth contexts.
      const [session, blacklisted] = await Promise.all([
        getSession(userId, deviceId),
        isJtiBlacklisted(jti),
      ]);

      if (session && session.jti === jti && !blacklisted) {
        req.userId = userId;
        req.userRole = role || "user";
        req.token = token;
        req.jti = jti;
      }
    }
  } catch {
  }
  next();
};

export default isAuth;
