const express = require("express");
const {
  createPromotion,
  getAllPromotion,
} = require("../controllers/promotionController");

const router = express.Router();

router.post("/create", createPromotion);
router.get("/", getAllPromotion);

module.exports = router;
