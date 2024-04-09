const express = require("express");
const {
  createStation,
  getAllStation,
  calculateDistance,
  calculateDistanceToAllStations,
  getDistanceAndCountOfCyclingAtStations,
} = require("../controllers/stationController");
const {
  createCyclingAtStation,
  GetCountOfAllCyclingAtStation,
  getCyclingsAtStation,
  findCyclingAtStation,
} = require("../controllers/stationCyclingController");

const router = express.Router();

router.post("/create", createStation);
router.post("/createCycling", createCyclingAtStation);
router.get("/", getAllStation);
router.get("/count", GetCountOfAllCyclingAtStation);
router.get("/info", getCyclingsAtStation);
router.post("/calculate", calculateDistance);
router.post("/calculateAll", calculateDistanceToAllStations);
router.post("/cycling", getDistanceAndCountOfCyclingAtStations);
router.get("/find", findCyclingAtStation);

module.exports = router;
