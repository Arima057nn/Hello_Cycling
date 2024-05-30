const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
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
    status: { type: Number, required: true },
  },
  {
    timestamps: true,
    collection: "Reports",
  }
);

const ReportModel = mongoose.model("Reports", ReportSchema);

module.exports = ReportModel;
