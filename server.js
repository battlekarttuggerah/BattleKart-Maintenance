require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

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

// ✅ CORS Configuration - Allows Frontend to Communicate with Backend
const corsOptions = {
  origin: 'https://battlekart-maintenance-frontend.onrender.com', // Replace with your frontend's URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // ✅ Added PUT & DELETE
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow cookies and authorization headers
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // ✅ Handle Preflight Requests

// ✅ Middleware
app.use(express.json());

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
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

// ✅ Root route to confirm API is running
app.get("/", (req, res) => {
  res.send("BattleKart Maintenance API is running!");
});

// ✅ Serve static files for production (if React app is built inside 'client/build')
app.use(express.static(path.join(__dirname, 'client/build')));

// ✅ Handle all other routes and serve `index.html` (React Router support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// ✅ Start Server
const PORT = process.env.PORT || 5000; // Default to 5000 if not specified
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
