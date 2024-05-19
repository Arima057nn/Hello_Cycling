const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true }, // giá mua
    overduePrice: { type: Number, required: true }, // giá khi vượt quá thời gian cho phép sử dụng
    timer: { type: Number, required: true }, // thời gian cho phép sử dụng
    duration: { type: Number, required: true }, // thời gian tính phí khi vượt quá thời gian cho phép sử dụng
    expiration: { type: Number, required: true }, // thời gian hết hạn trong (giờ)
    condition: { tpe: Number }, // điều kiện khi mua vé
    categoryId: {
      // loại xe
      type: mongoose.Schema.Types.ObjectId,
      ref: "CyclingTypes",
      required: true,
    },
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TicketTypes",
      required: true,
    }, // loại vé
  },
  {
    timestamps: true,
    collection: "Tickets",
  }
);

const TicketModel = mongoose.model("Tickets", TicketSchema);

module.exports = TicketModel;
