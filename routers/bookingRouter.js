const express = require("express");
const {
  createBooking,
  createTripDetail,
} = require("../controllers/bookingController");

const router = express.Router();

router.post("/create", createBooking);
router.post("/tripDetail", createTripDetail);

module.exports = router;
