const express = require("express");
const {
  createBooking,
  createTripDetail,
  deleteAllBooking,
  getTripDetail,
  findTrip,
  createKeepCycling,
  getTripHistory,
  findTripById,
  startFromKeepCycling,
  cancalKeepCycling,
  deleteBooking,
  deleteBookingDetail,
  findTripsCurrent,
  changeCycling,
} = require("../controllers/bookingController");
const { authenTokenUser } = require("../middleware/auth");

const router = express.Router();

router.post("/create", authenTokenUser, createBooking);
router.post("/tripDetail", authenTokenUser, createTripDetail);
router.delete("/delete", deleteAllBooking);
router.get("/tripDetail", getTripDetail);
router.get("/findTrip", authenTokenUser, findTrip);
router.get("/trips", authenTokenUser, findTripsCurrent);
router.get("/findTripById", authenTokenUser, findTripById);
router.post("/createKeep", authenTokenUser, createKeepCycling);
router.get("/history", authenTokenUser, getTripHistory);
router.post("/start", authenTokenUser, startFromKeepCycling);
router.post("/cancel", authenTokenUser, cancalKeepCycling);
router.get("/deleteOne", deleteBooking);
router.get("/deleteDetailOne", deleteBookingDetail);
router.post("/change", authenTokenUser, changeCycling);

module.exports = router;
