import jwt from "jsonwebtoken";

const isAuth = (req, res, next) => {
    try {
        let {token}= req.cookies;
        
        if(!token){
            return res.status(401).json({message: "User not logged in"});
        }
        const verifyToken = jwt.verify(token, process.env.JWT_SECRET);
         if(!verifyToken){
            return res.status(401).json({message: "Invalid token"});
        }
        req.userId = verifyToken.userId;
        next();
    } catch (error) {
        return res.status(500).json({message: "Internal server error"});
    }   
}

export default isAuth;