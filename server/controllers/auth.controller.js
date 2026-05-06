import genToken from "../config/token.js"
import User from "../models/user.model.js"


export const googleAuth = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Security: Basic input validation to prevent NoSQL injection if email is an object
    if (typeof email !== 'string') {
      return res.status(400).json({ message: "Invalid email format" });
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
      httpOnly: true, // Fixed: use httpOnly instead of http
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json(user);

  } catch (error) {
    console.error("Google Auth Error:", error); // Log the real error for debugging
    return res.status(500).json({ message: "Internal Server Error" }); // Don't leak error details
  }
};


export const logOut = async (req, res)=> {

  try {
    await res.clearCookie("token")
    return res.status(200).json({message:"LogOut Successfully"})
  } catch (error) {
    console.error("LogOut Error:", error);
    return res.status(500).json({message: "Internal Server Error"})
  }
  
}