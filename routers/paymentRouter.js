const express = require("express");
const {
  Momo,
  Callback,
  TransactionStatus,
} = require("../controllers/paymentController");
const { authenTokenUser } = require("../middleware/auth");

const router = express.Router();

router.post("/momo", authenTokenUser, Momo);
router.post("/callback", Callback);
router.post("/transaction-status", authenTokenUser, TransactionStatus);

module.exports = router;
