const express = require("express");
const {
  createCycling,
  findCycling,
  getCycling,
  sendCoordinate,
  updateAllCycling,
  updateCoordinate,
  getAllCycling,
  updateQrCode,
  finishMaintenance,
  startMaintenance,
  disableCycling,
  updateCycling,
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
router.post("/updateQrCode", updateQrCode);
router.post("/maintenance", authenTokenAdmin, startMaintenance);
router.post("/finish", authenTokenAdmin, finishMaintenance);
router.post("/disable", authenTokenAdmin, disableCycling);
router.post("/updateC", authenTokenAdmin, updateCycling);
module.exports = router;
