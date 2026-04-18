import getToken from "../config/token.js"
import User from "../models/user.model.js"

export const googleAuth = async (req, res) => {

    try {
       const {name, email, picture} = req.body 
       let user = await User.findOne({email})
       if (!user) {
        user = await User.create({
            name,
            email,
            picture,
            
        })
       
    } 
    let token = await getToken(user._id)
    res.cookie("token", token, {
        httpOnly: true,
        // Time of production remember to change to true 
        secure: false,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    res.status(200).json({user})
    } catch (error) {
        return res.status(500).json({message: `Internal server error ${error}`})
    }
}  

export const EmailAuth = async (req, res) => {
    try {
        
    } catch (error) {
        
    }
}
export const githubAuth = async (req, res) => {
    try {
        
    } catch (error) {
        
    }
}
export const logout = async (req, res) => {
    try {
        res.clearCookie("token")
        res.status(200).json({message: "User logged out successfully"})
    } catch (error) {
        return res.status(500).json({message: `Internal server error ${error}`})
}
}