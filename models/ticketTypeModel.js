const mongoose = require("mongoose");

const TicketTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    value: { type: Number, required: true },
  },
  {
    timestamps: true,
    collection: "TicketTypes",
  }
);

const TicketTypeModel = mongoose.model("TicketTypes", TicketTypeSchema);

module.exports = TicketTypeModel;
