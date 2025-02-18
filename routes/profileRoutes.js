const express = require("express");
const router = express.Router();
const User = require("../models/User");

// ✅ GET Profile (Dynamic from MongoDB) - Original Code
router.get("/", async (req, res) => {
    try {
        const username = req.query.username;
        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        // Search for the user in MongoDB
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Respond with the user's profile data
        res.status(200).json({
            username: user.username,
            email: user.email,
            role: user.role
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
});

// ✅ PUT Profile Update (Allows email update) - Original Code
router.put("/", async (req, res) => {
    const { username, email } = req.body;

    if (!username || !email) {
        return res.status(400).json({ error: "Username and email are required" });
    }

    try {
        const updatedUser = await User.findOneAndUpdate(
            { username },
            { email },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

// ✅ NEW PROFILE ROUTE ADDED (for /api/users/profile)
router.get("/profile", async (req, res) => {
    try {
        const username = req.query.username;
        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({
            username: user.username,
            email: user.email,
            role: user.role
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
});

module.exports = router;
