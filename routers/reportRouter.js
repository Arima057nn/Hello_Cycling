const express = require("express");
const { createReport } = require("../controllers/reportController");
const { authenTokenUser } = require("../middleware/auth");

const router = express.Router();

router.post("/create", authenTokenUser, createReport);

module.exports = router;
