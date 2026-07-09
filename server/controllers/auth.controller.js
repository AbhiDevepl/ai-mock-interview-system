import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { admin } from "../config/firebaseAdmin.js";
import { genAccessToken, genRefreshToken, verifyToken } from "../config/token.js";
import { TOKEN_COOKIE_OPTIONS, COOKIE_OPTIONS } from "../config/cookie.js";
import { logAuthEvent } from "../config/logger.js";
import {
  createSession,
  deleteSession,
  generateDeviceId,
  blacklistJti,
  recordLoginAttempt,
  isLoginBlocked,
} from "../services/session.service.js";
import { setCachedUser, invalidateAllUserCaches } from "../services/cache.service.js";

const USER_DATA_FIELDS = [
  "_id",
  "name",
  "email",
  "picture",
  "credits",
  "role",
  "lastLoginAt",
  "createdAt",
];

function sanitizeUser(user) {
  const data = {};
  for (const field of USER_DATA_FIELDS) {
    data[field] = user[field];
  }
  return data;
}

export const googleAuth = async (req, res) => {
  try {
    const { idToken, name, photo } = req.body;

    if (!idToken) {
      return res.status(401).json({ message: "Authentication failed." });
    }

    const ip = req.ip || req.connection?.remoteAddress || "0.0.0.0";
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (firebaseError) {
      logAuthEvent("LOGIN_FAILURE", req, {
        metadata: { error: "Firebase token verification failed" },
      });
      return res.status(401).json({ message: "Authentication failed." });
    }

    const {
      email,
      email_verified,
      uid: firebaseUID,
      name: fbName,
      picture: fbPicture,
    } = decodedToken;

    // Security: require a verified email from the ID token to prevent
    // authentication bypass via unverified third-party accounts.
    if (!email || !email_verified) {
      logAuthEvent("LOGIN_FAILURE", req, {
        metadata: {
          error: !email ? "No email in token" : "Email not verified",
          email,
        },
      });
      return res.status(401).json({ message: "Authentication failed." });
    }

    const blocked = await isLoginBlocked(email);
    if (blocked) {
      logAuthEvent("LOGIN_FAILURE", req, {
        metadata: { error: "Login blocked due to too many attempts", email },
      });
      return res.status(429).json({ message: "Too many login attempts. Try again later." });
    }

    await recordLoginAttempt(email);

    let isNewUser = false;
    let user = await User.findOne({ email });

    const userName = fbName || name || email.split("@")[0];
    const userPicture = fbPicture || photo || "";

    if (!user) {
      user = await User.create({
        name: userName,
        email,
        picture: userPicture,
        firebaseUID,
        lastLoginAt: new Date(),
      });
      isNewUser = true;
    } else {
      // Security: block deactivated users
      if (!user.isActive) {
        logAuthEvent("LOGIN_FAILURE", req, {
          metadata: { error: "Account deactivated", email },
        });
        return res.status(403).json({
          message: "Your account has been deactivated. Please contact support.",
        });
      }

      user.name = userName;
      user.picture = userPicture;
      if (firebaseUID) user.firebaseUID = firebaseUID;
      user.lastLoginAt = new Date();
      await user.save();
    }

    const accessToken = genAccessToken(user._id, user.role);
    const refreshToken = genRefreshToken(user._id, user.role);

    const decoded = jwt.decode(accessToken);
    const jti = decoded.jti;
    const deviceId = generateDeviceId(req);

    await createSession(user._id, deviceId, {
      role: user.role,
      ip,
      device: req.get("User-Agent")?.includes("Mobile") ? "mobile" : "desktop",
      deviceName: req.get("User-Agent") || "unknown",
      jti,
      nonce: 0,
    });

    await setCachedUser(user._id, sanitizeUser(user));

    res.cookie("token", accessToken, TOKEN_COOKIE_OPTIONS);
    res.cookie("refreshToken", refreshToken, TOKEN_COOKIE_OPTIONS);
    res.cookie("deviceId", deviceId, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logAuthEvent(isNewUser ? "USER_CREATED" : "LOGIN_SUCCESS", req, {
      userId: user._id,
      email: user.email,
    });

    return res.status(200).json(sanitizeUser(user));
  } catch (error) {
    logAuthEvent("LOGIN_FAILURE", req, {
      metadata: { error: "Internal server error" },
    });
    return res.status(500).json({ message: "Authentication failed." });
  }
};

export const logOut = async (req, res) => {
  try {
    if (req.userId && req.token) {
      try {
        const decoded = jwt.decode(req.token);
        if (decoded && decoded.exp) {
          const remainingTtl = decoded.exp - Math.floor(Date.now() / 1000);
          if (remainingTtl > 0) {
            await blacklistJti(decoded.jti, remainingTtl);
          }
        }
      } catch {
      }

      const deviceId = req.cookies?.deviceId;
      if (deviceId) {
        await deleteSession(req.userId, deviceId);
      }

      await invalidateAllUserCaches(req.userId);
    }

    res.clearCookie("token", COOKIE_OPTIONS);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    res.clearCookie("deviceId", COOKIE_OPTIONS);

    if (req.userId) {
      logAuthEvent("LOGOUT", req, { userId: req.userId });
    }

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Logout failed." });
  }
};

export const refreshAuth = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required." });
    }

    const { valid, decoded, reason } = verifyToken(refreshToken);

    if (!valid || decoded.type !== "refresh") {
      logAuthEvent("TOKEN_INVALID", req, { metadata: { reason: reason || "Invalid token type" } });
      return res.status(401).json({ message: "Invalid refresh token." });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      logAuthEvent("UNAUTHORIZED_ACCESS", req, { metadata: { reason: "User not found or inactive" } });
      return res.status(401).json({ message: "Authentication required." });
    }

    const newAccessToken = genAccessToken(user._id, user.role);
    const newRefreshToken = genRefreshToken(user._id, user.role);

    res.cookie("token", newAccessToken, TOKEN_COOKIE_OPTIONS);
    res.cookie("refreshToken", newRefreshToken, TOKEN_COOKIE_OPTIONS);

    return res.status(200).json({ message: "Token refreshed successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Token refresh failed." });
  }
};

export const getMe = async (req, res) => {
  try {
    const { userId } = req;

    const user = await User.findById(userId);

    if (!user || !user.isActive) {
      res.clearCookie("token", COOKIE_OPTIONS);
      logAuthEvent("UNAUTHORIZED_ACCESS", req, {
        metadata: { reason: user ? "Account deactivated" : "User not found" },
      });
      return res.status(401).json({ message: "Authentication required." });
    }

    const sanitized = sanitizeUser(user);
    await setCachedUser(userId, sanitized);

    logAuthEvent("SESSION_REFRESH", req, {
      userId: user._id,
      email: user.email,
    });

    return res.status(200).json(sanitized);
  } catch (error) {
    return res.status(500).json({ message: "Failed to get current user." });
  }
};
