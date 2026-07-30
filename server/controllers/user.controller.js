import User from "../models/user.model.js";

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    // Optimize performance using .lean() for read-only user query. Select isActive to verify account status.
    const user = await User.findById(userId).select('-firebaseUID').lean();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
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
    // Manually serialize id since Mongoose toJSON transform won't run on lean objects
    user.id = user._id.toString();
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
};
