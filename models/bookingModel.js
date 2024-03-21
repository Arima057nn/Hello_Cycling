const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Users",
      require: true,
    },
    cyclingId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Cyclings",
      require: true,
    },
    endTime: { type: timestamps },
    startStation: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Stations",
      require: true,
    },
    endStation: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Stations",
      require: true,
    },
    total: { type: Number },
  },
  {
    timestamps: true,
    collection: "Bookings",
  }
);

const Model = mongoose.model("Bookings", BookingSchema);

module.exports = BookingModel;
