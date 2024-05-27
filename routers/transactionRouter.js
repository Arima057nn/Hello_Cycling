const express = require("express");
const {
  getAllTransactions,
  deleteAllTransactions,
} = require("../controllers/transactionController");
const { authenTokenUser } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenTokenUser, getAllTransactions);
router.post("/", authenTokenUser, deleteAllTransactions);
module.exports = router;
