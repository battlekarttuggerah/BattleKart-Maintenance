const mongoose = require("mongoose");

const SubcategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    fields: [{ type: String }], // List of fields to be filled for each subcategory
}, { timestamps: true });

module.exports = mongoose.model("Subcategory", SubcategorySchema);
