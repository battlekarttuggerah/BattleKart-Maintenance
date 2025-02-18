const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();

// ✅ GET All Users
router.get("/", async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.status(200).json(users);
    } catch (error) {
        console.error("Failed to fetch users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// ✅ GET User Profile by Logged-In User
router.get("/profile", async (req, res) => {
    const { username } = req.query;
    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }

    try {
        const user = await User.findOne({ username }).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // ✅ Return user profile
        res.status(200).json(user);
    } catch (error) {
        console.error("Failed to fetch user profile:", error);
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
});

// ✅ POST Create User
router.post("/", async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword, role });
        await newUser.save();

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error("Failed to create user:", error);
        res.status(500).json({ error: "Failed to create user" });
    }
});

// ✅ DELETE User
router.delete("/:id", async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Failed to delete user:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
});

// ✅ PUT Update User Profile
router.put("/profile", async (req, res) => {
    const { username, email } = req.body;

    if (!username || !email) {
        return res.status(400).json({ error: "Username and email are required" });
    }

    try {
        const updatedUser = await User.findOneAndUpdate(
            { username },
            { email },
            { new: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Failed to update profile:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

// ✅ POST Login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // ✅ Generate a token & return username for profile lookup
        const token = `token_${Date.now()}`;
        
        // 🆕 Ensure the response includes `username`
        res.status(200).json({ 
            token, 
            username: user.username, 
            role: user.role 
        });
    } catch (error) {
        console.error("Failed to log in:", error);
        res.status(500).json({ error: "Failed to log in" });
    }
});

// 🆕 ✅ NEW ROUTE: Fetch Username by Email
router.get("/username-by-email", async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ username: user.username });
    } catch (error) {
        console.error("Failed to fetch username:", error);
        res.status(500).json({ error: "Failed to fetch username" });
    }
});

module.exports = router;
