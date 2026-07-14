import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    // Reject refresh tokens used as access tokens
    if (decoded.type && decoded.type !== "access") {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized access." });
  }
};

// Passes through whether or not the user is authenticated;
// binds req.userId / req.userRole when a valid access token is present.
export const optionalAuth = async (req, res, next) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.type || decoded.type === "access") {
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        req.token = token;
      }
    } catch {
      // invalid / expired token — continue without binding user
    }
  }
  next();
};

export default isAuth;
