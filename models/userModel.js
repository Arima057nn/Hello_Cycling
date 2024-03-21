const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    uid: { type: String },
    password: { type: String },
    // status: { type: Number },
    // role: { type: Number },
    // phone: { type: String, unique: true, required: true },
    // status: { type: Number },
    // point: { type: Number },
  },
  {
    timestamps: true,
    collection: "Users",
  }
);

const UserModel = mongoose.model("Users", UserSchema);

module.exports = UserModel;
