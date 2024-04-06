const express = require("express");
const {
  createCycling,
  findCycling,
} = require("../controllers/cyclingController");

const router = express.Router();

router.post("/create", createCycling);
router.get("/find", findCycling);

module.exports = router;
