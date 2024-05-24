const express = require("express");
const { Payment, Momo } = require("../controllers/paymentController");

const router = express.Router();

router.post("/", Payment);
router.post("/momo", Momo);

module.exports = router;
