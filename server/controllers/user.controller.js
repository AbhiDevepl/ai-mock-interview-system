import User from "../models/user.model.js";

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    // Optimize performance using .lean() for read-only user query
    const user = await User.findById(userId).select('-firebaseUID').lean();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Security check: if user is deactivated, block access and clear cookies
    if (user.isActive === false) {
      console.error(`Deactivated user access attempt: userId=${userId}`);
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

    // Exclude isActive from client payload for security/minimalism
    delete user.isActive;

    // Manually serialize id since Mongoose toJSON transform won't run on lean objects
    user.id = user._id.toString();
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
};
