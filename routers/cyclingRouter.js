const express = require("express");
const {
  createCycling,
  findCycling,
  getCycling,
  sendCoordinate,
  updateAllCycling,
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

module.exports = router;
