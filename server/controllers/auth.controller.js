import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { admin } from "../config/firebaseAdmin.js";
import { genToken } from "../config/token.js";
import { getRedisClient } from "../config/redis.js";
import { TOKEN_COOKIE_OPTIONS, COOKIE_OPTIONS } from "../config/cookie.js";
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

export const googleAuth = async (req, res) => {
  try {
    const { idToken, name, photo } = req.body;

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

    const { email, uid: firebaseUID } = decodedToken;

    if (!email) {
      return res.status(401).json({ message: "Authentication failed." });
    }

    // Find or create user — only trust data from the server-verified Firebase token
    let isNewUser = false;
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        picture: photo || "",
        firebaseUID,
        lastLoginAt: new Date(),
      });
      isNewUser = true;
    } else {
      if (photo) user.picture = photo;
      if (firebaseUID) user.firebaseUID = firebaseUID;
      user.lastLoginAt = new Date();
      if (!user.isActive) {
        user.isActive = true;
      }
      await user.save();
    }

    const token = genToken(user._id, user.role);

    res.cookie("token", token, TOKEN_COOKIE_OPTIONS);

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
    // Blacklist token in Redis if user was authenticated
    if (req.userId && req.token) {
      try {
        const decoded = jwt.decode(req.token);
        if (decoded && decoded.exp) {
          const remainingTtl = decoded.exp - Math.floor(Date.now() / 1000);
          if (remainingTtl > 0) {
            const redisClient = getRedisClient();
            if (redisClient) {
              await redisClient.set(
                `blacklist:token:${decoded.jti}`,
                "true",
                "EX",
                remainingTtl,
              );
              await redisClient.set(
                `blacklist:user:${req.userId}`,
                "true",
                "EX",
                remainingTtl,
              );
            }
          }
        }
      } catch {
        // Silent fail — logout proceeds even if blacklisting fails
      }
    }

    res.clearCookie("token", COOKIE_OPTIONS);

    if (req.userId) {
      logAuthEvent("LOGOUT", req, {
        userId: req.userId,
      });
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
      logAuthEvent("UNAUTHORIZED_ACCESS", req, {
        metadata: { reason: user ? "Account deactivated" : "User not found" },
      });
      return res.status(401).json({ message: "Authentication required." });
    }

    logAuthEvent("SESSION_REFRESH", req, {
      userId: user._id,
      email: user.email,
    });

    return res.status(200).json(sanitizeUser(user));
  } catch (error) {
    return res.status(500).json({ message: "Failed to get current user." });
  }
};
