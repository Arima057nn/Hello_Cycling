const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: "Empty" },
    uid: { type: String, required: true, unique: true },
    email: { type: String },
    password: { type: String },
    gender: { type: Number },
    dateOfBirth: { type: Date },
    status: { type: Number },
    role: { type: Number },
    phone: { type: String, unique: true, required: true, default: "Admin" },
    point: { type: Number },
    member: { type: Number },
    balance: { type: Number },
    fcm: { type: String },
    verify: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Citizens",
    },
  },
  {
    timestamps: true,
    collection: "Users",
  }
);

const UserModel = mongoose.model("Users", UserSchema);

module.exports = UserModel;
