const mongoose = require("mongoose");

const CyclingTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    value: { type: Number, required: true },
  },
  {
    timestamps: true,
    collection: "CyclingTypes",
  }
);

const CyclingTypeModel = mongoose.model("CyclingTypes", CyclingTypeSchema);

module.exports = CyclingTypeModel;
