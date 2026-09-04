import jwt from "jsonwebtoken";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import User from "../models/user.model.js";
import { genToken, genAccessToken, genRefreshToken } from "../config/token.js";

// Firebase Admin — initialised once per process
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}
const adminAuth = getAuth();

// Cookie options (inline — no separate cookie.js file)
const isProduction = process.env.NODE_ENV === "production";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};
const TOKEN_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

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
  if (user && user._id) {
    data.id = user._id.toString();
  }
  return data;
}

export const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(401).json({ message: "Authentication failed." });
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch {
      return res.status(401).json({ message: "Authentication failed." });
    }

    const { email, email_verified, uid: firebaseUID, name: firebaseName, picture: firebasePicture } = decodedToken;

    if (!email || !email_verified) {
      return res.status(401).json({ message: "Authentication failed." });
    }

    // Performance Optimization: Use .findOne().lean() to skip full Mongoose document hydration
    // for existing user queries, and run updates atomically with findOneAndUpdate and .lean().
    let user = await User.findOne({ email }).lean();

    if (!user) {
      const newUser = await User.create({
        name: firebaseName || email.split("@")[0],
        email,
        picture: firebasePicture || "",
        firebaseUID,
        lastLoginAt: new Date(),
      });
      user = newUser.toObject();
    } else {
      if (!user.isActive) {
        return res.status(403).json({ message: "This account has been deactivated." });
      }
      const updateData = {};
      if (firebaseName && firebaseName !== user.name) updateData.name = firebaseName;
      if (firebasePicture && firebasePicture !== user.picture) updateData.picture = firebasePicture;
      if (firebaseUID && firebaseUID !== user.firebaseUID) updateData.firebaseUID = firebaseUID;
      updateData.lastLoginAt = new Date();

      user = await User.findOneAndUpdate(
        { email },
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();
    }

    const token = genToken(user._id, user.role);
    res.cookie("token", token, TOKEN_COOKIE_OPTIONS);

    return res.status(200).json(sanitizeUser(user));
  } catch (error) {
    return res.status(500).json({ message: "Authentication failed." });
  }
};

export const logOut = async (req, res) => {
  try {
    res.clearCookie("token", COOKIE_OPTIONS);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    res.clearCookie("deviceId", COOKIE_OPTIONS);
    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Logout failed." });
  }
};

export const getMe = async (req, res) => {
  try {
    const { userId } = req;
    // Optimize performance by selecting only specific fields and using .lean()
    const user = await User.findById(userId)
      .select('_id name email picture credits role lastLoginAt createdAt isActive')
      .lean();

    if (!user || !user.isActive) {
      res.clearCookie("token", COOKIE_OPTIONS);
      return res.status(401).json({ message: "Authentication required." });
    }

    return res.status(200).json(sanitizeUser(user));
  } catch (error) {
    return res.status(500).json({ message: "Failed to get current user." });
  }
};

export const refreshAuth = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Authentication required." });
    }

    let decoded;
    try {
      // Hardened: Specify the expected signature algorithm HS256 to prevent key confusion attacks
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    } catch {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (decoded.type !== "refresh") {
      return res.status(401).json({ message: "Authentication required." });
    }

    // Optimize performance by selecting only specific fields and using .lean()
    const user = await User.findById(decoded.userId)
      .select('_id name email picture credits role lastLoginAt createdAt isActive')
      .lean();
    if (!user || !user.isActive) {
      res.clearCookie("token", COOKIE_OPTIONS);
      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      return res.status(401).json({ message: "Authentication required." });
    }

    const newToken = genAccessToken(user._id, user.role);
    const newRefreshToken = genRefreshToken(user._id, user.role);

    res.cookie("token", newToken, TOKEN_COOKIE_OPTIONS);
    res.cookie("refreshToken", newRefreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json(sanitizeUser(user));
  } catch (error) {
    return res.status(500).json({ message: "Failed to refresh session." });
  }
};
