const express = require("express");

const { authenTokenAdmin } = require("../middleware/auth");
const {
  getCountBookingOnDay,
  getCountBookingInMonth,
  getPeakBookingHour,
  getTop5PeakBookingHours,
  getCountBookingLast10Days,
  getCountBookingInYear,
  getCountBookingInMonthAndYear,
} = require("../controllers/statisticalController");

const router = express.Router();

router.get("/booking/day", getCountBookingOnDay);
router.get("/booking/month", getCountBookingInMonth);
router.get("/booking/peakHour", getPeakBookingHour);
router.get("/booking/peak5Hour", getTop5PeakBookingHours);
router.get("/booking/last10day", getCountBookingLast10Days);
router.get("/booking/year", getCountBookingInYear);
router.get("/booking/monthyear", getCountBookingInMonthAndYear);

module.exports = router;
