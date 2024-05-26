const { TICKET_TYPE, USER_TICKET_STATUS } = require("../constants/ticket");
const TicketModel = require("../models/ticketModel");
const UserTicketModel = require("../models/userTicketModel ");
const UserModel = require("../models/userModel");
const TicketTypeModel = require("../models/ticketTypeModel");
const TransactionModel = require("../models/transactionModel");
const { TRANSACTION_ACTION } = require("../constants/transaction");
const CyclingModel = require("../models/cyclingModel");

const createTicket = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      overduePrice,
      timer,
      duration,
      condition,
      expiration,
      categoryId,
      type,
    } = req.body;

    const newTicket = await TicketModel.create({
      name,
      description,
      price,
      overduePrice,
      timer,
      duration,
      condition,
      expiration,
      categoryId,
      type,
    });

    res.json(newTicket);
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ error: "Failed to create ticket" });
  }
};

const getAllTicket = async (req, res) => {
  try {
    const tickets = await TicketModel.find()
      .populate("categoryId")
      .populate("type");
    res.json(tickets);
  } catch (error) {
    console.error("Error getting tickets:", error);
    res.status(500).json({ error: "Failed to get tickets" });
  }
};

const createTicketType = async (req, res) => {
  try {
    const { name, value } = req.body;
    const newTicketType = await TicketTypeModel.create({ name, value });
    res.json(newTicketType);
  } catch (error) {
    console.error("Error creating ticket type:", error);
    res.status(500).json({ error: "Failed to create ticket type" });
  }
};

const getAllTicketType = async (req, res) => {
  try {
    const ticketTypes = await TicketTypeModel.find();
    res.json(ticketTypes);
  } catch (error) {
    console.error("Error getting ticket types:", error);
    res.status(500).json({ error: "Failed to get ticket types" });
  }
};

const getMyTickets = async (req, res) => {
  try {
    const { user_id } = req.user;
    const user = await UserModel.findOne({ uid: user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const userTickets = await UserTicketModel.find({
      userId: user._id,
    }).populate({ path: "ticketId", populate: { path: "categoryId" } });
    res.json(userTickets);
  } catch (error) {
    console.error("Error getting user tickets:", error);
    res.status(500).json({ error: "Failed to get user tickets" });
  }
};

const selectTicketToUse = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { cyclingId } = req.query;
    const user = await UserModel.findOne({ uid: user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const cycling = await CyclingModel.findById(cyclingId);
    const userTickets = await UserTicketModel.find({
      userId: user._id,
    }).populate({ path: "ticketId", populate: { path: "categoryId" } });
    const userTicketsFilter = userTickets.filter(
      (userTicket) =>
        userTicket.ticketId.categoryId._id.toHexString() ===
        cycling.category.toHexString()
    );
    if (userTicketsFilter.length > 0) {
      if (userTicketsFilter[0].dateEnd > new Date()) {
        if (userTicketsFilter[0].usage < userTicketsFilter[0].ticketId.timer) {
          return res.json(userTicketsFilter[0].ticketId);
        }
      }
    }
    const tickets = await TicketModel.find({
      categoryId: cycling.category,
    }).populate("type");
    const ticket = tickets.filter(
      (ticket) => ticket.type.value === TICKET_TYPE.DEFAULT
    );
    res.json(ticket[0]);
  } catch (error) {
    console.error("Error getting user tickets:", error);
    res.status(500).json({ error: "Failed to get user tickets" });
  }
};

const buyTicket = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { ticketId } = req.body;
    const ticket = await TicketModel.findById({ _id: ticketId }).populate(
      "type"
    );
    if (ticket && ticket.type.value === TICKET_TYPE.DEFAULT) {
      return res.status(400).json({ error: "This ticket is defatult" });
    }
    const user = await UserModel.findOne({ uid: user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const userTickets = await UserTicketModel.find({
      userId: user._id,
    }).populate("ticketId");

    const userTicketsFilter = userTickets.filter(
      (userTicket) =>
        userTicket.ticketId.categoryId.toHexString() ===
        ticket.categoryId.toHexString()
    );
    if (userTicketsFilter.length > 0) {
      if (userTicketsFilter[0].dateEnd > new Date()) {
        return res.status(400).json({ error: "User already on ticket" });
      } else {
        await UserTicketModel.deleteOne({ _id: userTicketsFilter[0]._id });
      }
    }
    if (user.balance < 0 || user.balance < ticket.price) {
      return res.status(400).json({ error: "Not enough money" });
    }
    const userTicket = await UserTicketModel.create({
      userId: user._id,
      ticketId,
      usage: 0,
      dateEnd: new Date(
        new Date().getTime() + 1000 * 60 * 60 * ticket.expiration
      ),
      status: 0,
    });
    await TransactionModel.create({
      title: TRANSACTION_ACTION[1].title,
      userId: user._id,
      type: TRANSACTION_ACTION[1].type,
      payment: ticket.price,
      status: 1,
    });
    user.balance -= ticket.price;
    await user.save();
    res.json({ userTicket, message: "Buy ticket success" });
  } catch (error) {
    console.error("Error buying ticket:", error);
    res.status(500).json({ error: "Failed to buy ticket" });
  }
};

const cancelTicket = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { bookingId } = req.body;
    const user = await UserModel.findOne({ uid: user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const userTicket = await UserTicketModel.findById(bookingId);
    if (!bookingId) {
      return res.status(404).json({ error: "Không tìm thấy vé" });
    }
    if (userTicket.status !== USER_TICKET_STATUS.READY) {
      return res
        .status(400)
        .json({ error: "Vé đang được sử dụng nên không thể hủy" });
    }
    await UserTicketModel.findByIdAndDelete(bookingId);
    res.json({ message: "Cancel ticket success" });
  } catch (error) {
    console.error("Error cancel ticket:", error);
    res.status(500).json({ error: "Failed to cancel ticket" });
  }
};
module.exports = {
  createTicket,
  getAllTicket,
  createTicketType,
  buyTicket,
  getAllTicketType,
  getMyTickets,
  selectTicketToUse,
  cancelTicket,
};
