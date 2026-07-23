import User from "../models/user.model.js";

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    // Optimize performance using .lean() for read-only user query
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
      console.error(`Attempt to access getCurrentUser from deactivated user: ${userId}`);
      return res.status(401).json({ message: "Authentication required." });
    }

    // Manually serialize id since Mongoose toJSON transform won't run on lean objects
    user.id = user._id.toString();
    delete user.isActive;
    return res.status(200).json(user);
  } catch (error) {
    console.error("Failed to get current user:", error.message);
    return res.status(500).json({ message: "Internal server error." });
  }
};
