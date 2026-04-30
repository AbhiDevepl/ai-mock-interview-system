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
        return res.status(500).json({message: "Internal server error"})
    }
}

export default isAuth