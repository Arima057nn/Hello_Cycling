const express = require("express");
const {
  createBooking,
  createTripDetail,
  deleteAllBooking,
  getTripDetail,
  findTrip,
  createKeepCycling,
} = require("../controllers/bookingController");
const { authenTokenUser } = require("../middleware/auth");

const router = express.Router();

router.post("/create", createBooking);
router.post("/tripDetail", createTripDetail);
router.delete("/delete", deleteAllBooking);
router.get("/tripDetail", getTripDetail);
router.get("/findTrip", findTrip);
router.post("/createKeep", authenTokenUser, createKeepCycling);
module.exports = router;
