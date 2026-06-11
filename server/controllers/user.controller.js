import User, { USER_PUBLIC_FIELDS } from "../models/user.model.js";

export const getCurrentUser = async (req, res) => {
  try {
    // Use .lean() and .select() to optimize read performance and reduce payload
    const user = await User.findById(req.userId)
      .select([...USER_PUBLIC_FIELDS, "isActive"].join(" "))
      .lean();

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Authentication required." });
    }
    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      credits: user.credits,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get current user." });
  }
};
