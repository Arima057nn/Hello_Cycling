const express = require("express");
const {
  createCycling,
  findCycling,
  getCycling,
  sendCoordinate,
} = require("../controllers/cyclingController");

const router = express.Router();

router.post("/create", createCycling);
router.get("/find", findCycling);
router.get("/get", getCycling);
router.post("/coord", sendCoordinate);

module.exports = router;
