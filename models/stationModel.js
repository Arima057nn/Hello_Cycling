const mongoose = require("mongoose");

const StationSchema = new mongoose.Schema(
  {
    name: { type: String },
    code: { type: String },
    position: { type: String },
    latitude: { type: String },
    longitude: { type: String },
    imgae: {
      type: String,
      default:
        "https://a0.muscache.com/im/pictures/43518019/ead2dbb7_original.jpg?aki_policy=x_large",
    },
  },
  {
    timestamps: true,
    collection: "Stations",
  }
);

const StationModel = mongoose.model("Stations", StationSchema);

module.exports = StationModel;
