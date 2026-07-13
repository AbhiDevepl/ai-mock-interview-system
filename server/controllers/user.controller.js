import User from "../models/user.model.js";

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("-firebaseUID");
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Authentication required." });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
};
