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
    // Retrieve isActive to check for account deactivation
    const user = await User.findById(userId).select('-firebaseUID').lean();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Harden: Reject deactivated users and clear session cookies to prevent exploitation
    if (user.isActive === false) {
      console.warn(`Deactivated user ${userId} attempted to access current-user endpoint.`);
      res.clearCookie("token", COOKIE_OPTIONS);
      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      res.clearCookie("deviceId", COOKIE_OPTIONS);
      return res.status(401).json({ message: "Unauthorized access." });
    }

    // Manually serialize id since Mongoose toJSON transform won't run on lean objects
    user.id = user._id.toString();
    // Delete internal state attributes before returning the user object
    delete user.isActive;

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
};
