const express = require("express");
const {
  createTicket,
  getAllTicket,
  buyTicket,
  createTicketType,
  getAllTicketType,
  getMyTickets,
  selectTicketToUse,
  cancelTicket,
} = require("../controllers/ticketController");
const { authenTokenUser } = require("../middleware/auth");

const router = express.Router();

router.post("/create", createTicket);
router.get("/", getAllTicket);
router.get("/myTicket", authenTokenUser, getMyTickets);
router.post("/type", createTicketType);
router.get("/type", getAllTicketType);
router.post("/buy", authenTokenUser, buyTicket);
router.get("/select", authenTokenUser, selectTicketToUse);
router.post("/cancel", authenTokenUser, cancelTicket);

module.exports = router;
