const TicketModel = require("../models/ticketModel");

const createTicket = async (req, res) => {
  try {
    const { name, description, price, overduePrice, timer, duration } =
      req.body;

    const existingTicket = await TicketModel.findOne({ name });
    if (existingTicket) {
      return res.status(400).json({ error: "Ticket already exists" });
    }

    const newTicket = await TicketModel.create({
      name,
      description,
      price,
      overduePrice,
      timer,
      duration,
    });

    res.json(newTicket);
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ error: "Failed to create ticket" });
  }
};

const getAllTicket = async (req, res) => {
  try {
    const tickets = await TicketModel.find();
    res.json(tickets);
  } catch (error) {
    console.error("Error getting tickets:", error);
    res.status(500).json({ error: "Failed to get tickets" });
  }
};

module.exports = { createTicket, getAllTicket };
