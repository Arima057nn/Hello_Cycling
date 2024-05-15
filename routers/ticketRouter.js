const express = require("express");
const {
  createTicket,
  getAllTicket,
} = require("../controllers/ticketController");

const router = express.Router();

router.post("/create", createTicket);
router.get("/", getAllTicket);

module.exports = router;
