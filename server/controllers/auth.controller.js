import genToken from "../config/token.js"
import User from "../models/user.model.js"


export const googleAuth = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Basic input validation to prevent NoSQL injection and ensure data integrity
    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name || "User",
        email,
      });
    }

    let token = await genToken(user._id);

    // Secure cookie configuration
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json(user);
  } catch (error) {
    // Log the actual error for debugging but return a generic message to the client
    console.error("Google Auth Error:", error);
    return res.status(500).json({ message: "Authentication failed" });
  }
};

export const logOut = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("LogOut Error:", error);
    return res.status(500).json({ message: "Logout failed" });
  }
};