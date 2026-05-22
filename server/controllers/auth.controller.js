import genToken from "../config/token.js"
import User from "../models/user.model.js"
import admin from "../config/firebase.js"


export const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Missing ID token" });
    }

    // Security: Verify Firebase ID token to authenticate the user
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { name, email, picture } = decodedToken;

    if (!email) {
      return res.status(400).json({ message: "Email not verified or missing in token" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email
      });
    }

    let token = await genToken(user._id);
    res.cookie("token", token, {
      httpOnly: true, // Security: Prevent XSS from accessing the token
      secure: process.env.NODE_ENV === "production", // Security: Ensure cookie is only sent over HTTPS in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json(user);

  } catch (error) {
    console.error("Google Auth Error:", error);
    // Security: Do not leak internal error details to the client
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logOut = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
    return res.status(200).json({ message: "LogOut Successfully" });
  } catch (error) {
    console.error("LogOut Error:", error);
    // Security: Do not leak internal error details to the client
    return res.status(500).json({ message: "Internal Server Error" });
  }
};