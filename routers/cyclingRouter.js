const express = require("express");
const { createCycling } = require("../controllers/cyclingController");

const router = express.Router();

router.post("/create", createCycling);

module.exports = router;
