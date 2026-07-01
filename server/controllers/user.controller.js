import { COOKIE_OPTIONS } from "../config/cookie.js";
import User from "../models/user.model.js";

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.isActive) {
      res.clearCookie("token", COOKIE_OPTIONS);
      res.clearCookie("deviceId", COOKIE_OPTIONS);
      return res.status(401).json({ message: "Authentication required." });
    }
    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      credits: user.credits,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Error fetching current user:", error.message);
    return res.status(500).json({ message: "Failed to get current user." });
  }
};
