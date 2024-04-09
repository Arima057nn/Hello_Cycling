const express = require("express");
const {
  createBooking,
  createTripDetail,
  deleteAllBooking,
} = require("../controllers/bookingController");

const router = express.Router();

router.post("/create", createBooking);
router.post("/tripDetail", createTripDetail);
router.delete("/delete", deleteAllBooking);
module.exports = router;
