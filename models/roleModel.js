const mongoose = require("mongoose");

const RoleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    value: { type: Number, required: true },
  },
  {
    timestamps: true,
    collection: "Roles",
  }
);

const RoleModel = mongoose.model("Roles", RoleSchema);

module.exports = RoleModel;
