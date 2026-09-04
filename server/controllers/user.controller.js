import User from "../models/user.model.js";

const isProduction = process.env.NODE_ENV === "production";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    // Optimize performance using .lean() for read-only user query
    const user = await User.findById(userId).select('-firebaseUID').lean();
    if (!user) {
      console.error(`User not found for ID: ${userId}`);
      return res.status(401).json({ message: "Authentication required." });
    }
    if (user.isActive === false) {
      const isProduction = process.env.NODE_ENV === "production";
      res.clearCookie("token", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
      });
      console.error(`User account deactivated for ID: ${userId}`);
      return res.status(401).json({ message: "Authentication required." });
    }

    // Hardening: Verify that the user account is active.
    // If deactivated, clear authentication cookies and return a 401 Unauthorized response to prevent further access.
    if (user.isActive === false) {
      console.error(`Deactivated user access attempt: ${userId}`);
      const isProduction = process.env.NODE_ENV === "production";
      const COOKIE_OPTIONS = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
      };
      res.clearCookie("token", COOKIE_OPTIONS);
      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      res.clearCookie("deviceId", COOKIE_OPTIONS);
      return res.status(401).json({ message: "Authentication required." });
    }

    // Manually serialize id since Mongoose toJSON transform won't run on lean objects
    user.id = user._id.toString();
    // Exclude isActive from response payload
    delete user.isActive;
    return res.status(200).json(user);
  } catch (error) {
    console.error("Failed to get current user:", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};
