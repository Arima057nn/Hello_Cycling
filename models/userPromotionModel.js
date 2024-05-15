const mongoose = require("mongoose");

const UserPromotionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Users",
      require: true,
    },
    PromotionId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Promotions",
      require: true,
    },

    status: { type: Number, required: true },
    dateEnd: { type: Date, required: true },
  },
  {
    timestamps: true,
    collection: "UserPromotions",
  }
);

const UserPromotionModel = mongoose.model(
  "UserPromotions",
  UserPromotionSchema
);

module.exports = UserPromotionModel;
