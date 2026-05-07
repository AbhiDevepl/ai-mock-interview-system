import User from "../models/user.model.js"

export const getCurrentUser = async (req, res) => {
    try {
        let {userId} = req
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({message:"User not found"})
        }
        return res.status(200).json(user)
    } catch (error) {
        console.error("Failed to get current user:", error)
        return res.status(500).json({message: "Internal Server Error"})
    }
    
}