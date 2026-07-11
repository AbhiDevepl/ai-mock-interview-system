import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.userId || decoded.type !== "access") {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    req.user = decoded;
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized access." });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && decoded.userId && decoded.type === "access") {
        req.user = decoded;
        req.userId = decoded.userId;
        req.userRole = decoded.role;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

export default isAuth;
