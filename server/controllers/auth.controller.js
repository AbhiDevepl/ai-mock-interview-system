import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { admin } from "../config/firebaseAdmin.js";
import { genAccessToken, genRefreshToken } from "../config/token.js";
import { COOKIE_OPTIONS } from "../config/cookie.js";
import { logAuthEvent } from "../config/logger.js";

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

// ponytail: in-memory login rate limiting per instance
const loginAttempts = new Map();
const ATTEMPTS_LIMIT = 5;
const BAN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const recordLoginAttempt = async (email) => {
  const now = Date.now();
  if (!loginAttempts.has(email)) {
    loginAttempts.set(email, []);
  }
  const history = loginAttempts.get(email);
  history.push(now);
  // Clean up old attempts
  const activeAttempts = history.filter((t) => now - t < BAN_WINDOW_MS);
  loginAttempts.set(email, activeAttempts);
};

const isLoginBlocked = async (email) => {
  const history = loginAttempts.get(email) || [];
  const now = Date.now();
  const activeAttempts = history.filter((t) => now - t < BAN_WINDOW_MS);
  return activeAttempts.length >= ATTEMPTS_LIMIT;
};

export const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(401).json({ message: "Authentication failed." });
    }

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
      name: verifiedName,
      picture: verifiedPicture,
    } = decodedToken;

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

    if (!user) {
      user = await User.create({
        name: verifiedName || email.split("@")[0],
        email,
        picture: verifiedPicture || "",
        firebaseUID,
        lastLoginAt: new Date(),
      });
      isNewUser = true;
    } else {
      if (!user.isActive) {
        logAuthEvent("LOGIN_FAILURE", req, {
          metadata: { error: "User account deactivated", email },
        });
        return res.status(403).json({
          message: "Your account has been deactivated. Please contact support.",
        });
      }

      if (verifiedPicture) user.picture = verifiedPicture;
      if (verifiedName) user.name = verifiedName;
      if (firebaseUID) user.firebaseUID = firebaseUID;
      user.lastLoginAt = new Date();
      await user.save();
    }

    // ponytail: generate stateless access and refresh tokens
    const accessToken = genAccessToken(user._id, user.role);
    const refreshToken = genRefreshToken(user._id, user.role);

    res.cookie("token", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 mins
    });
    res.cookie("refreshToken", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
    res.clearCookie("token", COOKIE_OPTIONS);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);

    if (req.userId) {
      logAuthEvent("LOGOUT", req, { userId: req.userId });
    }

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Logout failed." });
  }
};

export const getMe = async (req, res) => {
  try {
    const { userId } = req;
    const user = await User.findById(userId);

    if (!user || !user.isActive) {
      res.clearCookie("token", COOKIE_OPTIONS);
      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      logAuthEvent("UNAUTHORIZED_ACCESS", req, {
        metadata: { reason: user ? "Account deactivated" : "User not found" },
      });
      return res.status(401).json({ message: "Authentication required." });
    }

    const sanitized = sanitizeUser(user);
    logAuthEvent("SESSION_REFRESH", req, {
      userId: user._id,
      email: user.email,
    });

    return res.status(200).json(sanitized);
  } catch (error) {
    return res.status(500).json({ message: "Failed to get current user." });
  }
};

// ponytail: stateless refresh token rotation (RTR) endpoint
export const refreshAuth = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token missing." });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (decoded.type !== "refresh") {
      return res.status(401).json({ message: "Invalid token type." });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      res.clearCookie("token", COOKIE_OPTIONS);
      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      return res.status(401).json({ message: "User not found or inactive." });
    }

    // ponytail: issue rotated access and refresh tokens
    const newAccessToken = genAccessToken(user._id, user.role);
    const newRefreshToken = genRefreshToken(user._id, user.role);

    res.cookie("token", newAccessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", newRefreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    res.clearCookie("token", COOKIE_OPTIONS);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    return res.status(401).json({ message: "Invalid or expired refresh token." });
  }
};
