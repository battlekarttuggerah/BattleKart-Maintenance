const mongoose = require("mongoose");

const checklistRecordSchema = new mongoose.Schema({
    device: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true },
    checklist: { type: mongoose.Schema.Types.ObjectId, ref: "Checklist", required: true },
    completedBy: { type: String, required: true },
    responses: { type: Object, required: true },
    failureDetails: { type: Object, default: {} },
    failureSeverity: { type: Object, default: {} },
    inspectionResult: { type: String, default: "Pass" },
    rectifiedDate: { type: Object, default: {} }, // 🆕 Stores rectification date by field
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ChecklistRecord", checklistRecordSchema);
