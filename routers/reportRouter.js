const express = require("express");
const {
  createReport,
  getALlReport,
  changeStatusReport,
} = require("../controllers/reportController");
const { authenTokenUser, authenTokenAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/create", authenTokenUser, createReport);
router.get("/", authenTokenAdmin, getALlReport);
router.post("/change", authenTokenAdmin, changeStatusReport);

module.exports = router;
