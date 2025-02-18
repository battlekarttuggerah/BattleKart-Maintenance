const express = require("express");
const router = express.Router();
const Device = require("../models/Device");
const Checklist = require("../models/Checklist");
const ChecklistRecord = require("../models/ChecklistRecord");

// ✅ Get All Devices (Filter by subcategory)
router.get("/", async (req, res) => {
    try {
        const { subcategory } = req.query;
        const filter = subcategory ? { subcategory } : {};
        const devices = await Device.find(filter).populate("subcategory");
        res.status(200).json(devices);
    } catch (error) {
        console.error("Error fetching devices:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Add a New Device with Custom Fields
router.post("/", async (req, res) => {
    try {
        const { name, subcategory, customFields } = req.body;

        if (!name || !subcategory) {
            return res.status(400).json({ error: "Device name and subcategory are required" });
        }

        const newDevice = new Device({ name, subcategory, customFields });
        await newDevice.save();

        res.status(201).json(newDevice);
    } catch (error) {
        console.error("Error adding device:", error);
        res.status(500).json({ error: "Failed to add device" });
    }
});

// ✅ Get Single Device Details
router.get("/:id", async (req, res) => {
    try {
        const device = await Device.findById(req.params.id).populate("subcategory");
        if (!device) {
            return res.status(404).json({ error: "Device not found" });
        }
        res.status(200).json(device);
    } catch (error) {
        console.error("Error fetching device details:", error);
        res.status(500).json({ error: "Failed to fetch device details" });
    }
});

// ✅ Update a Device (Name & Custom Fields)
router.put("/:id", async (req, res) => {
    try {
        const { name, customFields } = req.body;
        const updatedDevice = await Device.findByIdAndUpdate(
            req.params.id,
            { name, customFields },
            { new: true }
        );

        if (!updatedDevice) {
            return res.status(404).json({ error: "Device not found" });
        }

        res.status(200).json(updatedDevice);
    } catch (error) {
        console.error("Error updating device:", error);
        res.status(500).json({ error: "Failed to update device" });
    }
});

// ✅ Delete a Device
router.delete("/:id", async (req, res) => {
    try {
        const device = await Device.findByIdAndDelete(req.params.id);
        if (!device) {
            return res.status(404).json({ error: "Device not found" });
        }
        res.status(200).json({ message: "Device deleted successfully" });
    } catch (error) {
        console.error("Error deleting device:", error);
        res.status(500).json({ error: "Failed to delete device" });
    }
});

// ✅ Log a Completed Checklist for a Device
router.post("/:id/complete-checklist", async (req, res) => {
    try {
        const { checklistId, completedBy } = req.body;

        if (!checklistId || !completedBy) {
            return res.status(400).json({ error: "Checklist ID and Completed By are required" });
        }

        const newRecord = new ChecklistRecord({
            device: req.params.id,
            checklist: checklistId,
            completedBy,
        });

        await newRecord.save();

        res.status(201).json({ message: "Checklist completed successfully", record: newRecord });
    } catch (error) {
        console.error("Error completing checklist:", error);
        res.status(500).json({ error: "Failed to complete checklist" });
    }
});

// ✅ Get Devices with Overdue Checklists
router.get("/overdue-checklists", async (req, res) => {
    try {
        const devices = await Device.find().populate("subcategory");

        let overdueDevices = [];

        for (const device of devices) {
            const checklists = await Checklist.find({ subcategory: device.subcategory });

            for (const checklist of checklists) {
                const lastCheck = await ChecklistRecord.findOne({
                    device: device._id,
                    checklist: checklist._id,
                }).sort({ createdAt: -1 });

                let lastCheckDate = lastCheck ? new Date(lastCheck.createdAt) : null;
                let dueDate = lastCheckDate ? new Date(lastCheckDate) : new Date(device.createdAt);
                dueDate.setDate(dueDate.getDate() + checklist.frequency);

                if (!lastCheck || dueDate < new Date()) {
                    overdueDevices.push({
                        deviceId: device._id,
                        deviceName: device.name,
                        checklistName: checklist.name,
                        dueDate: dueDate.toISOString().split("T")[0],
                    });
                }
            }
        }

        res.status(200).json(overdueDevices);
    } catch (error) {
        console.error("Error fetching overdue checklists:", error);
        res.status(500).json({ error: "Failed to fetch overdue checklists" });
    }
});

module.exports = router;
