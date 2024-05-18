const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    overduePrice: { type: Number, required: true },
    timer: { type: Number, required: true },
    duration: { type: Number, required: true },
    expiration: { type: Number, required: true },
    condition: { tpe: Number },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CyclingTypes",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "Tickets",
  }
);

const TicketModel = mongoose.model("Tickets", TicketSchema);

module.exports = TicketModel;
