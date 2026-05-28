import genToken from "../config/token.js"
import User from "../models/user.model.js"
import admin from "../config/firebase.js"


export const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "ID Token is required" });
    }

    // Security: Verify identity using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return res.status(400).json({ message: "Email not found in token" });
    }

    let user = await User.findOne({ firebaseUID: uid });

    // Migration logic: If user not found by UID, check by email to link existing account
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.firebaseUID = uid;
        if (picture) user.avatar = picture;
        await user.save();
      } else {
        // Create new user if neither UID nor email exists
        user = await User.create({
          firebaseUID: uid,
          name: name || email.split('@')[0],
          email,
          avatar: picture
        });
      }
    } else {
      // Update avatar if it has changed or was missing
      if (picture && user.avatar !== picture) {
        user.avatar = picture;
        await user.save();
      }
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