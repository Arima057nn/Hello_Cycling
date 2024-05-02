const express = require("express");
const {
  createCycling,
  findCycling,
  getCycling,
} = require("../controllers/cyclingController");

const router = express.Router();

router.post("/create", createCycling);
router.get("/find", findCycling);
router.get("/get", getCycling);

module.exports = router;
