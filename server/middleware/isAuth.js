import jwt from "jsonwebtoken"

const isAuth = (req, res, next) => {

    try {
        let {token} = req.cookies

        if (!token) {
            return res.status(401).json({message:"Please login to access this resource"})
        }

        let verifyToken = jwt.verify(token, process.env.JWT_SECRET)

        if (!verifyToken) {
            return res.status(401).json({message:"Invalid token or token expired"})
        }

        req.userId = verifyToken.userId
        next()
    } catch (error) {
        console.error("isAuth middleware error:", error);
        // Security: Use 401 for auth-related failures and avoid leaking details
        return res.status(401).json({ message: "Authentication failed" });
    }
};

export default isAuth