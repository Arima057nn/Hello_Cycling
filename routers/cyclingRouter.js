const express = require("express");
const {
  createCycling,
  findCycling,
  getCycling,
  sendCoordinate,
  updateAllCycling,
  updateCoordinate,
} = require("../controllers/cyclingController");
const {
  createCyclingType,
  getAllTypes,
} = require("../controllers/cyclingTypeController");

const router = express.Router();

router.post("/create", createCycling);
router.get("/find", findCycling);
router.get("/get", getCycling);
router.post("/coord", sendCoordinate);
router.post("/type", createCyclingType);
router.get("/type", getAllTypes);
router.post("/update", updateAllCycling);
router.post("/updateCoordinate", updateCoordinate);

module.exports = router;
