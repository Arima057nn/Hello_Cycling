const mongoose = require("mongoose");

const BookingDetailSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Bookings",
      require: true,
    },
    uid: { type: String, require: true },
    endStation: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Stations",
      require: true,
    },
    total: { type: Number },
    tripHistory: { type: Array },
  },
  {
    timestamps: true,
    collection: "BookingDetails",
  }
);

const BookingDetailModel = mongoose.model(
  "BookingDetails",
  BookingDetailSchema
);

module.exports = BookingDetailModel;
