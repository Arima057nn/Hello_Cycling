const express = require("express");
const {
  createCycling,
  findCycling,
  getCycling,
  sendCoordinate,
  updateAllCycling,
  updateCoordinate,
  getAllCycling,
} = require("../controllers/cyclingController");
const {
  createCyclingType,
  getAllTypes,
} = require("../controllers/cyclingTypeController");
const { authenTokenAdmin } = require("../middleware/auth");

const router = express.Router();
/// User
router.post("/create", authenTokenAdmin, createCycling);
router.get("/find", findCycling);
router.get("/get", getCycling);
router.post("/coord", sendCoordinate);
router.post("/type", createCyclingType);
router.get("/type", getAllTypes);
router.post("/update", updateAllCycling);
router.post("/updateCoordinate", updateCoordinate);
/// Admin
router.get("/", authenTokenAdmin, getAllCycling);

module.exports = router;
