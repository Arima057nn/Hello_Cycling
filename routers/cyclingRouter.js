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
  updateQrcodeCycling,
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
router.post("/updateCoordinate", authenTokenAdmin, updateCoordinate);
/// Admin
router.get("/", authenTokenAdmin, getAllCycling);
router.post("/updateQrCode", authenTokenAdmin, updateQrCode);
router.post("/maintenance", authenTokenAdmin, startMaintenance);
router.post("/finish", authenTokenAdmin, finishMaintenance);
router.post("/disable", authenTokenAdmin, disableCycling);
router.post("/updateC", authenTokenAdmin, updateCycling);
router.post("/updateQr", authenTokenAdmin, updateQrcodeCycling);

module.exports = router;
