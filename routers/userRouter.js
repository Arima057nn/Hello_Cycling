const express = require("express");
const {
  register,
  updateProfile,
  getInfoUser,
  getAllUser,
  updateFCMToken,
  sendRequestIndentity,
} = require("../controllers/userController");
const { authenTokenUser, authenTokenAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/updateProfile", authenTokenUser, updateProfile);
router.get("/info", authenTokenUser, getInfoUser);
router.post("/fcm", authenTokenUser, updateFCMToken);
router.post("/verify", authenTokenUser, sendRequestIndentity);

// Admin
router.get("/", authenTokenAdmin, getAllUser);
module.exports = router;
