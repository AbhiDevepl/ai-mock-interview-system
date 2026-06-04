import genToken from "../config/token.js"
import User from "../models/user.model.js"
import admin from "../config/firebaseAdmin.js"


export const googleAuth = async (req, res) => {
  try {
    const { idToken, name, photo } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "ID Token is required" });
    }

    // Verify the ID token using Firebase Admin SDK
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
      if (!decodedToken) {
        throw new Error("No decoded token returned");
      }
    } catch (error) {
      console.error("Firebase ID Token Verification Error:", error);
      return res.status(401).json({ message: "Invalid or expired ID Token" });
    }

    const email = decodedToken.email;
    if (!email) {
      return res.status(400).json({ message: "Email not found in token" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: decodedToken.name || name,
        email,
        picture: decodedToken.picture || photo
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