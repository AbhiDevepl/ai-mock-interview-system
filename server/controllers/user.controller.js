import User from "../models/user.model.js";

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    // Optimize performance using .lean() for read-only user query
    const user = await User.findById(userId).select('-firebaseUID -isActive').lean();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    // Manually serialize id since Mongoose toJSON transform won't run on lean objects
    user.id = user._id.toString();
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
};
