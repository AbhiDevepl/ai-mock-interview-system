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
    // Hardened: Do not select out '-isActive' so that we can check if the user is deactivated.
    const user = await User.findById(userId).select('-firebaseUID').lean();
    if (!user) {
      console.error(`User not found for ID: ${userId}`);
      return res.status(401).json({ message: "Authentication required." });
    }

    if (user.isActive === false) {
      const isProduction = process.env.NODE_ENV === "production";
      const COOKIE_OPTIONS = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
      };
      res.clearCookie("token", COOKIE_OPTIONS);
      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      console.warn(`Deactivated user access attempt blocked: ${userId}`);
      return res.status(401).json({ message: "Authentication required." });
    }

    // Manually serialize id since Mongoose toJSON transform won't run on lean objects
    user.id = user._id.toString();
    delete user.isActive;
    return res.status(200).json(user);
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
