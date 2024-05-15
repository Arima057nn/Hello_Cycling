const mongoose = require("mongoose");

const PromotionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    discount: { type: Number, required: true },
    dateStart: { type: Date, required: true },
    dateEnd: { type: Date, required: true },
    status: { type: Number, required: true },
  },
  {
    timestamps: true,
    collection: "Promotions",
  }
);

const PromotionModel = mongoose.model("Promotions", PromotionSchema);

module.exports = PromotionModel;
