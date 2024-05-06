const express = require("express");
const {
  register,
  login,
  updateProfile,
} = require("../controllers/userController");
const { authenTokenUser } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/updateProfile", authenTokenUser, updateProfile);
module.exports = router;
