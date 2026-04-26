import jwt from "jsonwebtoken";

const genToken = (userId) => {
    try {
        // Generates a synchronous token
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });
        return token;
    } catch (error) {
        console.error("JWT Generation Error:", error);
        // Re-throwing allows the calling function to handle the failure
        throw new Error("Failed to generate authentication token");
    }
};

export default genToken;