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

    const userId = jwt.decode(req.cookies?.token)?.userId;

    if (error.name === "TokenExpiredError") {
      logAuthEvent("TOKEN_EXPIRED", req, {
        userId,
        metadata: { error: error.message },
      });
      return res
        .status(401)
        .json({ message: "Session expired. Please log in again." });
    }
    if (error.name === "JsonWebTokenError") {
      logAuthEvent("TOKEN_INVALID", req, {
        userId,
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

      const [blacklisted, session] = await Promise.all([
        isJtiBlacklisted(jti),
        getSession(userId, deviceId),
      ]);

      if (!blacklisted && session && session.jti === jti) {
        req.userId = userId;
        req.userRole = role || "user";
        req.token = token;
        req.jti = jti;
      } else if (blacklisted || (session && session.jti !== jti)) {
        res.clearCookie("token", COOKIE_OPTIONS);
        res.clearCookie("deviceId", COOKIE_OPTIONS);
      }
    } else if (token || deviceId) {
      // Inconsistent cookies, clear both
      res.clearCookie("token", COOKIE_OPTIONS);
      res.clearCookie("deviceId", COOKIE_OPTIONS);
    }
  } catch {
    res.clearCookie("token", COOKIE_OPTIONS);
    res.clearCookie("deviceId", COOKIE_OPTIONS);
  }
  next();
};

export default isAuth;
