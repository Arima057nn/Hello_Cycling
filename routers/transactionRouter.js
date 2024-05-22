const express = require("express");
const { getAllTransactions } = require("../controllers/transactionController");
const { authenTokenUser } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenTokenUser, getAllTransactions);
module.exports = router;
