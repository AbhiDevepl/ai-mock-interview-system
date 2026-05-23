import genToken from "../config/token.js"
import User from "../models/user.model.js"
import admin from "../config/firebase.js"


export const googleAuth = async (req, res) => {
  try {
    const { idToken, name } = req.body;

    // Security: Verify Firebase ID Token to ensure the request is authentic
    let email, verifiedName, picture;
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      email = decodedToken.email;
      verifiedName = decodedToken.name;
      picture = decodedToken.picture;
    } catch (error) {
      console.error("Firebase Token Verification Error:", error);
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    if (!email) {
      return res.status(401).json({ message: "Authentication failed: No email provided" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: verifiedName || name,
        email,
        picture
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