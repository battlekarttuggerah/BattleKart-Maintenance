const express = require("express");
const router = express.Router();
const ChecklistLog = require("../models/ChecklistLog");
const Device = require("../models/Device");
const Checklist = require("../models/Checklist");

// 🎯 Fetch All Checklist Logs
router.get("/all", async (req, res) => {
    try {
        const logs = await ChecklistLog.find().populate("device checklist");
        res.status(200).json(logs);
    } catch (error) {
        console.error("❌ Error fetching checklist logs:", error);
        res.status(500).json({ error: "Failed to fetch checklist logs" });
    }
});

// 🛑 Fetch Overdue Checklists
router.get("/overdue", async (req, res) => {
    try {
        const today = new Date();
        const overdueLogs = await ChecklistLog.find({ nextDueDate: { $lt: today }, status: "Overdue" })
            .populate("device checklist");
        res.status(200).json(overdueLogs);
    } catch (error) {
        console.error("❌ Error fetching overdue checklists:", error);
        res.status(500).json({ error: "Failed to fetch overdue checklists" });
    }
});

// 📆 Fetch Upcoming Checklists
router.get("/upcoming", async (req, res) => {
    try {
        const today = new Date();
        const upcomingLogs = await ChecklistLog.find({ nextDueDate: { $gte: today }, status: "Upcoming" })
            .populate("device checklist");
        res.status(200).json(upcomingLogs);
    } catch (error) {
        console.error("❌ Error fetching upcoming checklists:", error);
        res.status(500).json({ error: "Failed to fetch upcoming checklists" });
    }
});

// 🆕 Create or Update Checklist Log
router.post("/record", async (req, res) => {
    try {
        const { deviceId, checklistId, completedBy } = req.body;

        // Fetch checklist to determine frequency
        const checklist = await Checklist.findById(checklistId);
        if (!checklist) {
            return res.status(404).json({ error: "Checklist not found" });
        }

        // Calculate next due date
        const nextDueDate = new Date();
        nextDueDate.setDate(nextDueDate.getDate() + checklist.frequency);

        const newLog = new ChecklistLog({
            device: deviceId,
            checklist: checklistId,
            completedBy,
            nextDueDate,
            status: nextDueDate < new Date() ? "Overdue" : "Upcoming"
        });

        await newLog.save();
        res.status(201).json({ message: "Checklist log recorded", log: newLog });
    } catch (error) {
        console.error("❌ Error creating checklist log:", error);
        res.status(500).json({ error: "Failed to create checklist log" });
    }
});

// 🚨 Fetch Failed Devices
router.get("/failed", async (req, res) => {
    try {
        const failedLogs = await ChecklistLog.find({ inspectionResult: "Fail" }).populate("device checklist");
        res.status(200).json(failedLogs);
    } catch (error) {
        console.error("❌ Error fetching failed devices:", error);
        res.status(500).json({ error: "Failed to fetch failed devices" });
    }
});

// ✅ PATCH: Mark Defect as Rectified
router.patch("/rectify/:id", async (req, res) => {
    const { field, date } = req.body;
    try {
        const log = await ChecklistLog.findById(req.params.id);
        if (!log) return res.status(404).json({ error: "Log not found" });

        // Add rectification date
        log.rectifiedDate = log.rectifiedDate || {};
        log.rectifiedDate[field] = date;

        // Check if all failed fields are rectified
        const allFieldsRectified = Object.keys(log.responses).every(
            (field) => log.responses[field] !== "Fail" || log.rectifiedDate[field]
        );

        // Update the inspection result if all fields are rectified
        if (allFieldsRectified) {
            log.inspectionResult = "Rectified";
        }

        await log.save();
        res.status(200).json({ message: `Defect for "${field}" rectified`, log });
    } catch (error) {
        console.error("❌ Error rectifying defect:", error);
        res.status(500).json({ error: "Failed to rectify defect" });
    }
});

module.exports = router;
