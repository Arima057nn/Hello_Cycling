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
    startStation: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Stations",
      require: true,
    },
    ticketId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Tickets",
      require: true,
    },
    status: { type: Number },
    payment: { type: Number },
  },
  {
    timestamps: true,
    collection: "Bookings",
  }
);

const BookingModel = mongoose.model("Bookings", BookingSchema);

module.exports = BookingModel;
