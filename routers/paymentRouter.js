const express = require("express");
const {
  Momo,
  Callback,
  TransactionStatus,
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/momo", Momo);
router.post("/callback", Callback);
router.post("/transaction-status", TransactionStatus);

module.exports = router;
