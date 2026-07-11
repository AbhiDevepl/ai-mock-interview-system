import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    req.userId = decoded.userId;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    // Fail securely: return 401 for all auth-related errors including expired/invalid tokens
    return res.status(401).json({ message: "Unauthorized access." });
  }
};

export default isAuth;
