const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: "Subcategory", required: true },
    customFields: { type: Map, of: String } // ✅ Store dynamic custom fields
}, { timestamps: true });

module.exports = mongoose.model("Device", DeviceSchema);
