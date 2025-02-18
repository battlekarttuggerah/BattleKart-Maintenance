require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Import routes
const authRoutes = require("./routes/authRoutes");
const subcategoryRoutes = require("./routes/subcategoryRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const checklistRoutes = require("./routes/checklistRoutes");
const checklistRecordsRoutes = require("./routes/checklistRecordsRoutes");
const checklistLogRoutes = require("./routes/checklistLogRoutes");
const profileRoutes = require("./routes/profileRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(cors());

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ MongoDB Connected");
}).catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
});

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/subcategories", subcategoryRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/checklists", checklistRoutes);
app.use("/api/checklistRecords", checklistRecordsRoutes);
app.use("/api/checklistLogs", checklistLogRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes); // ✅ Added User Management Route

// ✅ Root route to handle requests to "/"
app.get("/", (req, res) => {
    res.send("BattleKart Maintenance API is running!");
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
