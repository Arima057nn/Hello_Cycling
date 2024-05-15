const express = require("express");
const {
  register,
  updateProfile,
  getInfoUser,
} = require("../controllers/userController");
const { authenTokenUser } = require("../middleware/auth");

const router = express.Router();

router.post("/register", authenTokenUser, register);
router.post("/updateProfile", authenTokenUser, updateProfile);
router.get("/info", authenTokenUser, getInfoUser);
module.exports = router;
