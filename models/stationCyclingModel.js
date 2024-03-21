const mongoose = require("mongoose");

const StationCyclingSchema = new mongoose.Schema(
  {
    stationId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Stations",
      require: true,
    },
    cyclingId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Cyclings",
      require: true,
    },
  },
  {
    timestamps: true,
    collection: "StationCyclings",
  }
);

const StationCyclingModel = mongoose.model(
  "StationCyclings",
  StationCyclingSchema
);

module.exports = StationCyclingModel;
