const express = require("express");

const { authenTokenAdmin } = require("../middleware/auth");
const {
  getCountBookingOnDay,
  getCountBookingInMonth,
  getPeakBookingHour,
  getTop5PeakBookingMonthYear,
  getCountBookingLast10Days,
  getCountBookingInYear,
  getCountBookingInMonthAndYear,
  getRevenueInYear,
  getRevenueInMonthAndYear,
  getNewUsersInYear,
  getTopStationsInYear,
  getTopStationsInMonthYear,
  getTop5PeakBookingYear,
  getNewUserInMonthAndYear,
} = require("../controllers/statisticalController");

const router = express.Router();

router.get("/booking/day", authenTokenAdmin, getCountBookingOnDay);
router.get("/booking/month", authenTokenAdmin, getCountBookingInMonth);
router.get("/booking/peakHour", authenTokenAdmin, getPeakBookingHour);
router.get(
  "/booking/peak5Month",
  authenTokenAdmin,
  getTop5PeakBookingMonthYear
);
router.get("/booking/peak5Year", authenTokenAdmin, getTop5PeakBookingYear);
router.get("/booking/last10day", authenTokenAdmin, getCountBookingLast10Days);
router.get("/booking/year", authenTokenAdmin, getCountBookingInYear);
router.get(
  "/booking/monthyear",
  authenTokenAdmin,
  getCountBookingInMonthAndYear
);

router.get("/revenue/year", authenTokenAdmin, getRevenueInYear);
router.get("/revenue/monthyear", authenTokenAdmin, getRevenueInMonthAndYear);

router.get("/user/year", authenTokenAdmin, getNewUsersInYear);
router.get("/user/month", authenTokenAdmin, getNewUserInMonthAndYear);

router.get("/station/topYear", authenTokenAdmin, getTopStationsInYear);
router.get("/station/topMonth", authenTokenAdmin, getTopStationsInMonthYear);
module.exports = router;
