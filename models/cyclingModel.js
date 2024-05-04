const mongoose = require("mongoose");

const CyclingSchema = new mongoose.Schema(
  {
    name: { type: String },
    code: { type: String },
    latitude: { type: String },
    longitude: { type: String },
    coordinate: { type: Array },
    password: { type: String },
    status: { type: Number },
    category: { type: Number },
  },
  {
    timestamps: true,
    collection: "Cyclings",
  }
);

const CyclingModel = mongoose.model("Cyclings", CyclingSchema);

module.exports = CyclingModel;
