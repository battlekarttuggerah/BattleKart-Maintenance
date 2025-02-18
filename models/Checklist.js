const mongoose = require("mongoose");

const ChecklistSchema = new mongoose.Schema({
    name: { type: String, required: true },
    frequency: { type: Number, required: true }, 
    fields: [
        {
            name: { type: String, required: true },
            responseType: { type: String, enum: ["text", "number", "date", "pass/fail"], required: true },
        }
    ],
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: "Subcategory", required: true },
}, { timestamps: true });

module.exports = mongoose.model("Checklist", ChecklistSchema);
