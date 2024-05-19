const mongoose = require("mongoose");

const UserTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Users",
      require: true,
    },
    ticketId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Tickets",
      require: true,
    },
    usage: { type: Number, required: true },
    status: { type: Number },
    dateEnd: { type: Date, required: true },
  },
  {
    timestamps: true,
    collection: "UserTickets",
  }
);

const UserTicketModel = mongoose.model("UserTickets", UserTicketSchema);

module.exports = UserTicketModel;
