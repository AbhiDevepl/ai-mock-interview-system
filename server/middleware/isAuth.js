import jwt from "jsonwebtoken"

const isAuth = (req, res, next) => {
    try {
        const { token } = req.cookies;

        if (!token) {
            return res.status(401).json({ message: "Authentication failed" });
        }

        const verifyToken = jwt.verify(token, process.env.JWT_SECRET);

        if (!verifyToken) {
            return res.status(401).json({ message: "Authentication failed" });
        }

        req.userId = verifyToken.userId;
        next();
    } catch (error) {
        console.error("isAuth middleware error:", error.message);
        return res.status(401).json({ message: "Authentication failed" });
    }
};

export default isAuth