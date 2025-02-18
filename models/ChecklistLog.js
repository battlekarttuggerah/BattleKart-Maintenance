const mongoose = require("mongoose");

const ChecklistLogSchema = new mongoose.Schema({
    device: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true },
    checklist: { type: mongoose.Schema.Types.ObjectId, ref: "Checklist", required: true },
    completedBy: { type: String, required: true },
    completedAt: { type: Date, default: Date.now },
    nextDueDate: { type: Date, required: true },
    status: { type: String, enum: ["Upcoming", "Overdue", "Completed"], required: true }
});

module.exports = mongoose.model("ChecklistLog", ChecklistLogSchema);
