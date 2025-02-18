const express = require("express");
const router = express.Router();
const ChecklistRecord = require("../models/ChecklistRecord");

// ✅ POST: Create a new checklist record
router.post("/", async (req, res) => {
    try {
        const { device, checklist, completedBy, responses, failureDetails, failureSeverity } = req.body;

        if (!device || !checklist || !completedBy || !responses) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const inspectionResult = Object.values(responses).includes("Fail") ? "Fail" : "Pass";

        const newRecord = new ChecklistRecord({
            device,
            checklist,
            completedBy,
            responses,
            failureDetails: failureDetails || {},
            failureSeverity: failureSeverity || {},
            inspectionResult,
            rectifiedDate: {}
        });

        await newRecord.save();

        console.log("✅ Checklist record saved:", newRecord);
        res.status(201).json({ message: "Checklist record saved successfully", record: newRecord });
    } catch (error) {
        console.error("❌ Error saving checklist record:", error);
        res.status(500).json({ error: "Failed to save checklist record" });
    }
});

// ✅ GET: Get checklist records for a specific device
router.get("/", async (req, res) => {
    try {
        const { device } = req.query;
        if (!device) {
            return res.status(400).json({ error: "Device ID is required" });
        }

        const records = await ChecklistRecord.find({ device })
            .populate("checklist")
            .sort({ createdAt: -1 });

        console.log("📄 Checklist records retrieved:", records);
        res.status(200).json(records);
    } catch (error) {
        console.error("❌ Error fetching checklist records:", error);
        res.status(500).json({ error: "Failed to fetch records" });
    }
});

// ✅ PATCH: Rectify a defect (update responses to "Rectified")
router.patch("/rectify/:id", async (req, res) => {
    const { field, date } = req.body;

    try {
        const record = await ChecklistRecord.findById(req.params.id);
        if (!record) {
            return res.status(404).json({ error: "Checklist record not found" });
        }

        // ✅ Initialize rectifiedDate if necessary
        if (!record.rectifiedDate) record.rectifiedDate = {};

        // ✅ Update rectified date for the specified field
        record.rectifiedDate[field] = date;

        // ✅ Update responses to 'Rectified' if it was 'Fail'
        if (record.responses[field] === "Fail") {
            record.responses[field] = "Rectified";

            // ✅ Append rectification info to failureDetails
            if (record.failureDetails[field]) {
                record.failureDetails[field] += ` | Rectified on: ${date}`;
            } else {
                record.failureDetails[field] = `Rectified on: ${date}`;
            }

            console.log(`🔧 Field "${field}" updated to "Rectified".`);
        } else {
            console.warn(`⚠️ Field "${field}" was not marked as 'Fail', skipping update.`);
        }

        // ✅ Recalculate inspection result
        const responses = Object.values(record.responses);
        const hasFailures = responses.includes("Fail");
        const allPassedOrRectified = responses.every(resp => resp === "Pass" || resp === "Rectified");

        // ✅ Update inspectionResult accordingly
        if (hasFailures) {
            record.inspectionResult = "Fail";
        } else if (allPassedOrRectified) {
            record.inspectionResult = "Rectified";
        } else {
            record.inspectionResult = "Fail";
        }

        // ✅ Force mongoose to mark the nested path as modified
        record.markModified('responses');
        record.markModified('rectifiedDate');
        record.markModified('failureDetails');

        // ✅ Save the updated record
        await record.save();

        console.log(`✅ Defect rectified for "${field}". New responses:`, record.responses);
        console.log(`✅ New inspection result: ${record.inspectionResult}`);
        res.status(200).json({ message: "Defect rectified successfully", record });
    } catch (error) {
        console.error("❌ Error rectifying defect:", error);
        res.status(500).json({ error: "Failed to rectify defect" });
    }
});

// ✅ GET: Retrieve all checklist records
router.get("/all", async (req, res) => {
    try {
        const records = await ChecklistRecord.find()
            .populate("checklist device")
            .sort({ createdAt: -1 });

        console.log("📂 All checklist records retrieved:", records);
        res.status(200).json(records);
    } catch (error) {
        console.error("❌ Error fetching all checklist records:", error);
        res.status(500).json({ error: "Failed to fetch records" });
    }
});

// ✅ GET: Retrieve records by checklist ID
router.get("/byChecklist/:checklistId", async (req, res) => {
    try {
        const { checklistId } = req.params;

        const records = await ChecklistRecord.find({ checklist: checklistId })
            .populate("checklist")
            .sort({ createdAt: -1 });

        console.log(`📑 Records for checklist ID ${checklistId}:`, records);
        res.status(200).json(records);
    } catch (error) {
        console.error("❌ Error fetching records by checklist ID:", error);
        res.status(500).json({ error: "Failed to fetch records" });
    }
});

module.exports = router;
