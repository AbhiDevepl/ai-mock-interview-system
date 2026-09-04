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
    // Optimize performance using .lean() for read-only user query, but fetch isActive to verify account status
    const user = await User.findById(userId).select('-firebaseUID').lean();
    if (!user) {
      console.error(`User not found for ID: ${userId}`);
      return res.status(401).json({ message: "Authentication required." });
    }
    if (user.isActive === false) {
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
      });
      return res.status(401).json({ message: "This account has been deactivated." });
    }
    // Manually serialize id since Mongoose toJSON transform won't run on lean objects
    user.id = user._id.toString();
    // Do not leak internal isActive property to client
    delete user.isActive;
    return res.status(200).json(user);
  } catch (error) {
    console.error("Failed to get current user:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
