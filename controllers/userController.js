const { USER_STATUS, USER_ROLE } = require("../constants/user");
const UserModel = require("../models/userModel");

const register = async (req, res, next) => {
  try {
    const { user_id, phone_number } = req.user;
    const existingUser = await UserModel.findOne({ uid: user_id });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    const newUser = new UserModel({
      uid: user_id,
      phone: phone_number,
      status: USER_STATUS.ACTIVE,
      role: USER_ROLE.USER,
      point: 0,
      member: 0,
    });
    await newUser.save();
    res.status(201).json({ message: "Đăng kí thành công" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const { name } = req.body;
    const user = await UserModel.findOne({ uid: user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.name = name;
    await user.save();
    res.status(200).json({ message: "Cập nhật thông tin thành công" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getInfoUser = async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const user = await UserModel.findOne({ uid: user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error getting user info:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  register,
  getInfoUser,
  updateProfile,
};
