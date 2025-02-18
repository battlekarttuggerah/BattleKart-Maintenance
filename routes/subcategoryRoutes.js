const express = require("express");
const router = express.Router();
const Subcategory = require("../models/Subcategory");

// ✅ Get All Subcategories
router.get("/", async (req, res) => {
    try {
        const subcategories = await Subcategory.find();
        res.status(200).json(subcategories);
    } catch (err) {
        console.error("❌ Error fetching subcategories:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Create New Subcategory
router.post("/", async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: "Subcategory name is required" });

        const existing = await Subcategory.findOne({ name });
        if (existing) return res.status(400).json({ error: "Subcategory already exists" });

        const subcategory = new Subcategory({ name, fields: [] });
        await subcategory.save();

        res.status(201).json({ message: "✅ Subcategory created successfully", subcategory });
    } catch (err) {
        console.error("❌ Error creating subcategory:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Delete Subcategory
router.delete("/:id", async (req, res) => {
    try {
        const result = await Subcategory.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ error: "Subcategory not found" });

        res.status(200).json({ message: "✅ Subcategory deleted successfully" });
    } catch (err) {
        console.error("❌ Error deleting subcategory:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Add Field
router.put("/:id/fields", async (req, res) => {
    try {
        const { field } = req.body;
        if (!field) return res.status(400).json({ error: "Field name is required" });

        const subcategory = await Subcategory.findById(req.params.id);
        if (!subcategory) return res.status(404).json({ error: "Subcategory not found" });

        subcategory.fields.push(field);
        await subcategory.save();

        res.status(200).json({ message: "✅ Field added successfully", subcategory });
    } catch (err) {
        console.error("❌ Error adding field:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Remove Field
router.put("/:id/fields/remove", async (req, res) => {
    try {
        const { field } = req.body;
        if (!field) return res.status(400).json({ error: "Field name is required" });

        const subcategory = await Subcategory.findById(req.params.id);
        if (!subcategory) return res.status(404).json({ error: "Subcategory not found" });

        subcategory.fields = subcategory.fields.filter(f => f !== field);
        await subcategory.save();

        res.status(200).json({ message: "✅ Field deleted successfully", subcategory });
    } catch (err) {
        console.error("❌ Error removing field:", err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
