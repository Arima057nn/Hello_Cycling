const express = require("express");
const {
  createStation,
  getAllStation,
  calculateDistance,
  calculateDistanceToAllStations,
  getDistanceAndCountOfCyclingAtStations,
  getStation,
  updateStation,
} = require("../controllers/stationController");
const {
  createCyclingAtStation,
  GetCountOfAllCyclingAtStation,
  getCyclingsAtStation,
  findCyclingAtStation,
  getCyclingsNotAtStation,
  createCyclingsAtStation,
  deleteCyclingAtStation,
} = require("../controllers/stationCyclingController");
const { authenTokenAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/create", authenTokenAdmin, createStation);
router.post("/createCycling", authenTokenAdmin, createCyclingAtStation);
router.post("/createCyclings", authenTokenAdmin, createCyclingsAtStation);
router.get("/", getAllStation);
router.get("/count", GetCountOfAllCyclingAtStation);
router.get("/info", getCyclingsAtStation);
router.post("/calculate", calculateDistance);
router.post("/calculateAll", calculateDistanceToAllStations);
router.post("/cycling", getDistanceAndCountOfCyclingAtStations);
router.get("/find", findCyclingAtStation);

// Admmin
router.get("/id", authenTokenAdmin, getStation);
router.post("/update", authenTokenAdmin, updateStation);
router.get("/cyclingReady", authenTokenAdmin,getCyclingsNotAtStation);
router.post("/deleteCycling", authenTokenAdmin, deleteCyclingAtStation);

module.exports = router;
