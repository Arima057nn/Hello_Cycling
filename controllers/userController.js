const { USER_STATUS, USER_ROLE, USER_VERIFY } = require("../constants/user");
const CitizenModel = require("../models/CitizenModel");
const UserModel = require("../models/userModel");

const register = async (req, res, next) => {
  try {
    const { user_id, phone_number } = req.body;
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
      balance: 0,
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

const updateFCMToken = async (req, res, next) => {
  try {
    const { user_id } = req.user;
    const { fcmToken } = req.body;
    const user = await UserModel.findOne({ uid: user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.fcm = fcmToken;
    await user.save();
    res.status(200).json({ message: "Cập nhật FCM token thành công" });
  } catch (error) {
    console.error("Error updating FCM token:", error);
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

const getAllUser = async (req, res, next) => {
  try {
    const users = await UserModel.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error getting all users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const sendRequestIndentity = async (req, res, next) => {
  try {
    const { identification, fullName, dob, address, issueDate } = req.body;
    const { user_id } = req.user;
    const user = await UserModel.findOne({ uid: user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.verify) {
      verified = await CitizenModel.findById(user.verify);
      if (verified) {
        return res.status(400).json({ error: "Yêu cầu đã được gửi" });
      }
    }
    console.log("User:", identification, fullName, dob, address, issueDate);
    const verify = await CitizenModel.create({
      fullName,
      address,
      issueDate,
      dateOfBirth: dob,
      citizen: identification,
      verify: USER_VERIFY.VERIFING,
    });
    user.verify = verify._id;
    await user.save();
    res.status(200).json({ message: "Gửi yêu cầu xác thực thành công" });
  } catch (error) {
    console.error("Error sending request identity:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  register,
  getInfoUser,
  updateProfile,
  getAllUser,
  updateFCMToken,
  sendRequestIndentity,
};
