const { USER_STATUS, USER_ROLE } = require("../constants/user");
const UserModel = require("../models/userModel");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");

const register = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const existingUser = await UserModel.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UserModel({
      phone,
      password: hashedPassword,
      status: USER_STATUS.ACTIVE,
      role: USER_ROLE.USER,
    });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const existingUser = await UserModel.findOne({ phone: phone });
    if (!existingUser) {
      return res.status(401).json({ error: "Invalid phone or password" });
    }
    const isPasswordValid = bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid phone or password" });
    }

    const account = {
      phone: existingUser.phone,
      role: existingUser.role,
      status: existingUser.status,
      userId: existingUser._id,
    };
    const accessToken = jwt.sign(account, process.env.JWT_SECRET_KEY, {
      expiresIn: "30s",
    });
    existingUser.token = accessToken;
    await existingUser.save();
    res
      .status(200)
      .json({ message: "User logged in successfully", accessToken });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const checkExistingUser = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const existingUser = await UserModel.findOne({ phone: phoneNumber });

    if (!existingUser) {
      return res.status(401).json({ error: "" });
    }
    return res.status(200).json({ message: "User exists" });
  } catch (err) {
    console.log("error", err.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    const userLogged = req.user;
    const { name, point, member } = req.body;
    const user = await UserModel.findById(userLogged.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.name = name;
    user.point = point;
    user.member = member;
    await user.save();
    res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  register,
  login,
  updateProfile,
};
