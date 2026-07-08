import jwt from "jsonwebtoken";
import { logAuthEvent } from "../config/logger.js";
import { COOKIE_OPTIONS } from "../config/cookie.js";

// ponytail: stateless auth middleware - verify access token signature and expiration
const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication required. Please log in." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ponytail: verify token type is access
    if (decoded.type !== "access") {
      return res.status(401).json({ message: "Invalid token type." });
    }

    req.userId = decoded.userId;
    req.userRole = decoded.role || "user";
    req.token = token;

    next();
  } catch (error) {
    res.clearCookie("token", COOKIE_OPTIONS);
    if (error.name === "TokenExpiredError") {
      logAuthEvent("TOKEN_EXPIRED", req, {
        metadata: { error: error.message },
      });
      return res
        .status(401)
        .json({ message: "Session expired. Please log in again." });
    }
    logAuthEvent("TOKEN_INVALID", req, {
      metadata: { error: error.message },
    });
    return res.status(401).json({ message: "Invalid authentication token." });
  }
};

// ponytail: optional stateless authentication
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type === "access") {
        req.userId = decoded.userId;
        req.userRole = decoded.role || "user";
        req.token = token;
      }
    }
  } catch {
    // Ignore invalid/expired tokens for optional auth
  }
  next();
};

export default isAuth;
