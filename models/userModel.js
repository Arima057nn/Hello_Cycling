const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    password: { type: String },
    status: { type: Number },
    role: { type: Number },
    phone: { type: String, unique: true, required: true },
    point: { type: Number },
    member: { type: Number },
    token: { type: String },
  },
  {
    timestamps: true,
    collection: "Users",
  }
);

const UserModel = mongoose.model("Users", UserSchema);

module.exports = UserModel;
