const mongoose = require("mongoose");

const CyclingSchema = new mongoose.Schema(
  {
    name: { type: String },
    code: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    coordinate: { type: Array },
    password: { type: String },
    status: { type: Number },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CyclingTypes",
      require: true,
    },
  },
  {
    timestamps: true,
    collection: "Cyclings",
  }
);

const CyclingModel = mongoose.model("Cyclings", CyclingSchema);

module.exports = CyclingModel;
