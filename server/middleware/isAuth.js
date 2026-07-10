import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
  try {
    let { token } = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    const verifyToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verifyToken;

    if (!verifyToken) {
      return res.status(401).json({ message: "Unauthorized access." });
    }
    req.userId = verifyToken.userId;
    next();
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
};

export default isAuth;
