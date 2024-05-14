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

router.post("/create", authenTokenUser, createBooking);
router.post("/tripDetail", authenTokenUser, createTripDetail);
router.delete("/delete", deleteAllBooking);
router.get("/tripDetail", getTripDetail);
router.get("/findTrip", authenTokenUser, findTrip);
router.post("/createKeep", authenTokenUser, createKeepCycling);
module.exports = router;
