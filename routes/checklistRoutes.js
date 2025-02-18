const express = require("express");
const router = express.Router();
const Checklist = require("../models/Checklist");
const Subcategory = require("../models/Subcategory");

// ✅ Get all checklists
router.get("/", async (req, res) => {
    try {
        const checklists = await Checklist.find().populate("subcategory");
        res.status(200).json(checklists);
    } catch (error) {
        console.error("❌ Error fetching checklists:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Get single checklist by ID
router.get("/:id", async (req, res) => {
    try {
        const checklist = await Checklist.findById(req.params.id);
        if (!checklist) {
            return res.status(404).json({ error: "Checklist not found" });
        }
        res.status(200).json(checklist);
    } catch (error) {
        console.error("❌ Error fetching checklist:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Create a new checklist
router.post("/", async (req, res) => {
    try {
        const { name, frequency, subcategory, fields } = req.body;

        if (!name || !frequency || !subcategory) {
            return res.status(400).json({ error: "Checklist name, frequency, and subcategory are required" });
        }

        const existingSubcategory = await Subcategory.findById(subcategory);
        if (!existingSubcategory) {
            return res.status(400).json({ error: "Invalid subcategory ID" });
        }

        const newChecklist = new Checklist({
            name,
            frequency: parseInt(frequency, 10),
            subcategory,
            fields: fields || []
        });

        await newChecklist.save();
        res.status(201).json({ message: "Checklist created successfully", checklist: newChecklist });
    } catch (error) {
        console.error("❌ Error adding checklist:", error);
        res.status(500).json({ error: "Failed to create checklist" });
    }
});

// ✅ Edit a checklist
router.put("/:id", async (req, res) => {
    try {
        const { name, frequency, subcategory, fields } = req.body;

        const checklist = await Checklist.findById(req.params.id);
        if (!checklist) {
            return res.status(404).json({ error: "Checklist not found" });
        }

        checklist.name = name;
        checklist.frequency = frequency;
        checklist.subcategory = subcategory;
        checklist.fields = fields;

        await checklist.save();
        res.status(200).json({ message: "Checklist updated successfully", checklist });
    } catch (error) {
        console.error("❌ Error updating checklist:", error);
        res.status(500).json({ error: "Failed to update checklist" });
    }
});

// ✅ Add a new field
router.put("/:id/add-field", async (req, res) => {
    try {
        const { name, responseType } = req.body;
        if (!name || !responseType) {
            return res.status(400).json({ error: "Field name and response type are required" });
        }

        const checklist = await Checklist.findById(req.params.id);
        if (!checklist) {
            return res.status(404).json({ error: "Checklist not found" });
        }

        if (checklist.fields.some(field => field.name === name)) {
            return res.status(400).json({ error: "Field name already exists" });
        }

        checklist.fields.push({ name, responseType });
        await checklist.save();

        res.status(200).json({ message: "Field added successfully", checklist });
    } catch (error) {
        console.error("❌ Error adding field:", error);
        res.status(500).json({ error: "Failed to add field" });
    }
});

// ✅ Delete a field
router.put("/:id/delete-field", async (req, res) => {
    try {
        const { name } = req.body;

        const checklist = await Checklist.findById(req.params.id);
        if (!checklist) {
            return res.status(404).json({ error: "Checklist not found" });
        }

        const initialLength = checklist.fields.length;
        checklist.fields = checklist.fields.filter(field => field.name !== name);

        if (checklist.fields.length === initialLength) {
            return res.status(400).json({ error: "Field not found" });
        }

        await checklist.save();
        res.status(200).json({ message: "Field deleted successfully", checklist });
    } catch (error) {
        console.error("❌ Error deleting field:", error);
        res.status(500).json({ error: "Failed to delete field" });
    }
});

// ✅ Delete a checklist
router.delete("/:id", async (req, res) => {
    try {
        const deletedChecklist = await Checklist.findByIdAndDelete(req.params.id);
        if (!deletedChecklist) {
            return res.status(404).json({ error: "Checklist not found" });
        }
        res.status(200).json({ message: "Checklist deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting checklist:", error);
        res.status(500).json({ error: "Failed to delete checklist" });
    }
});

module.exports = router;
