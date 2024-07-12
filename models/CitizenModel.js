const mongoose = require("mongoose");

const CitizenSchema = new mongoose.Schema(
  {
    fullName: { type: String },
    address: { type: String },
    issueDate: { type: String },
    dateOfBirth: { type: String },
    citizen: { type: String },
    verify: { type: Number },
  },
  {
    timestamps: true,
    collection: "Citizens",
  }
);

const CitizenModel = mongoose.model("Citizens", CitizenSchema);

module.exports = CitizenModel;
