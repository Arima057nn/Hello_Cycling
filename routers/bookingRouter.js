const express = require("express");
const {
  createBooking,
  createTripDetail,
  deleteAllBooking,
  getTripDetail,
  findTrip,
} = require("../controllers/bookingController");

const router = express.Router();

router.post("/create", createBooking);
router.post("/tripDetail", createTripDetail);
router.delete("/delete", deleteAllBooking);
router.get("/tripDetail", getTripDetail);
router.get("/findTrip", findTrip);
module.exports = router;
