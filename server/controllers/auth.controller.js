import genToken from "../config/token.js"
import User from "../models/user.model.js"
import { auth as firebaseAdminAuth } from "../config/firebaseAdmin.js"


export const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    // Security: Verify the Firebase ID token from the client to prevent authentication bypass
    if (!idToken || typeof idToken !== 'string') {
      return res.status(401).json({ message: "Invalid or missing ID token" });
    }

    const decodedToken = await firebaseAdminAuth.verifyIdToken(idToken);
    const { name, email, picture } = decodedToken;

    if (!email) {
      return res.status(400).json({ message: "Email not provided by identity provider" });
    }

    const normalizedEmail = email.toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User.create({
        name: name || "Anonymous",
        email: normalizedEmail
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
    await res.clearCookie("token");
    return res.status(200).json({ message: "LogOut Successfully" });
  } catch (error) {
    console.error("LogOut Error:", error);
    // Security: Do not leak internal error details to the client
    return res.status(500).json({ message: "Internal Server Error" });
  }
};