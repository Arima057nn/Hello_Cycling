const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Users",
      require: true,
    },
    bookingDetailId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "BookingDetails",
    },
    type: { type: String, required: true },
    payment: { type: Number, required: true },
    status: { type: Number },
  },
  {
    timestamps: true,
    collection: "Transactions",
  }
);

const TransactionModel = mongoose.model("Transactions", TransactionSchema);

module.exports = TransactionModel;
