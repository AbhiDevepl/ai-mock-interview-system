import User from "../models/user.model.js";

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User not found for ID: ${userId}`);
      return res.status(401).json({ message: "Authentication required." });
    }
    if (!user.isActive) {
      console.error(`User deactivation check failed for ID: ${userId}`);
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
      });
      return res.status(401).json({ message: "Authentication required." });
    }

    const userObject = user.toObject();
    delete userObject.firebaseUID;
    delete userObject.isActive;
    return res.status(200).json(userObject);
  } catch (error) {
    console.error("Failed to get current user:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
