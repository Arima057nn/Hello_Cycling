const UserModel = require("../models/userModel");

const register = async (req, res, next) => {
  try {
    const { name, email, uid } = req.body;
    const userFound = await UserModel.findOne({ uid });
    if (userFound) {
      return res.status(422).json({ message: "User already exists" });
    } else {
      const user = new UserModel({
        name,
        email,
        uid,
      });
      const newUser = await user.save();
      res.status(201).json({ message: "User created successfully" });
    }
  } catch (err) {
    console.log("error", err.message);
  }
};
module.exports = {
  register,
};
