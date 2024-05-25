const { BOOKING_STATUS } = require("../constants/booking");
const { CYCLING_STATUS } = require("../constants/cycling");
const { TICKET_TYPE } = require("../constants/ticket");
const { TRANSACTION_ACTION } = require("../constants/transaction");
const BookingDetailModel = require("../models/bookingDetailModel");
const BookingModel = require("../models/bookingModel");
const CyclingModel = require("../models/cyclingModel");
const StationCyclingModel = require("../models/stationCyclingModel");
const TicketModel = require("../models/ticketModel");
const TransactionModel = require("../models/transactionModel");
const UserModel = require("../models/userModel");
const UserTicketModel = require("../models/userTicketModel ");
const { overduePriceToPay } = require("../utils/overduePrice");

const createKeepCycling = async (req, res) => {
  try {
    const { cyclingId, startStation, ticketId } = req.body;
    const { user_id } = req.user;
    const user = await UserModel.findOne({ uid: user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    let existingBooking = await BookingModel.findOne({
      userId: user._id,
      status: BOOKING_STATUS.ACTIVE,
    });
    if (!existingBooking) {
      existingBooking = await BookingModel.findOne({
        userId: user._id,
        status: BOOKING_STATUS.KEEPING,
      });
      if (existingBooking) {
        return res
          .status(404)
          .json({ error: "User already on the keep trips" });
      }
    } else return res.status(404).json({ error: "User already on the trips" });

    const stationCycling = await StationCyclingModel.findOne({
      cyclingId: cyclingId,
      stationId: startStation,
    });

    if (!stationCycling) {
      return res.status(400).json({ error: "Xe không ở trạm này" });
    }
    const cycling = await CyclingModel.findById(cyclingId);
    if (cycling.status !== CYCLING_STATUS.READY) {
      return res.status(400).json({ error: "Xe đang được sử dụng" });
    }
    const ticket = await TicketModel.findById(ticketId).populate("type");
    if (
      ticket.type.value === TICKET_TYPE.DAY &&
      user.balance < ticket.price / 10
    ) {
      return res.status(400).json({
        error: `Bạn đang sử dụng vé ngày, tài khoản phải trên ${
          ticket.price / 10
        } mới có thể đặt giữ xe`,
      });
    } else if (
      ticket.type.value === TICKET_TYPE.MONTHLY &&
      user.balance < ticket.price / 24
    ) {
      return res.status(400).json({
        error: `Bạn đang sử dụng vé tháng, tài khoản phải trên ${
          ticket.price / 24
        } mới có thể đặt giữ xe`,
      });
    }

    if (
      ticket.type.value === TICKET_TYPE.DEFAULT &&
      user.balance < ticket.price * 2
    ) {
      return res.status(400).json({
        error: `Bạn đang sử dụng vé lượt, tài khoản phải trên ${
          ticket.price * 2
        } mới có thể đặt giữ xe`,
      });
    }
    const newKeepBooking = await BookingModel.create({
      userId: user._id,
      cyclingId: cyclingId,
      startStation: startStation,
      status: BOOKING_STATUS.KEEPING,
      ticketId: ticketId,
    });
    cycling.status = CYCLING_STATUS.KEEPING;
    await cycling.save();
    res.json(newKeepBooking);
  } catch (error) {
    console.error("Error keep cycling:", error);
    res.status(500).json({ error: "Failed to keep cycling" });
  }
};

const startFromKeepCycling = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const keepBooking = await BookingModel.findById(bookingId);
    if (!keepBooking) {
      return res.status(404).json({ error: "User not on the keep trips" });
    }
    if (keepBooking.status !== BOOKING_STATUS.KEEPING) {
      return res.status(400).json({ error: "User already on the trips" });
    }
    const newBooking = await BookingModel.create({
      userId: keepBooking.userId,
      cyclingId: keepBooking.cyclingId,
      startStation: keepBooking.startStation,
      status: BOOKING_STATUS.ACTIVE,
      ticketId: keepBooking.ticketId,
    });
    await StationCyclingModel.deleteOne({ cyclingId: keepBooking.cyclingId });
    await CyclingModel.findByIdAndUpdate(keepBooking.cyclingId, {
      status: CYCLING_STATUS.ACTIVE,
    });
    await BookingModel.findByIdAndDelete(bookingId);
    res.json(newBooking);
  } catch (error) {
    console.error("Error start from keep cycling:", error);
    res.status(500).json({ error: "Failed to start from keep cycling" });
  }
};

const cancalKeepCycling = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { bookingId, category } = req.body;
    const user = await UserModel.findOne({ uid: user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const keepBooking = await BookingModel.findById(bookingId);
    if (!keepBooking) {
      return res.status(404).json({ error: "User not on the keep trips" });
    }
    cycling = await CyclingModel.findByIdAndUpdate(keepBooking.cyclingId, {
      status: CYCLING_STATUS.READY,
    });
    await BookingModel.findByIdAndDelete(bookingId);

    const tickets = await TicketModel.find({ categoryId: category }).populate(
      "type"
    );
    const ticket = tickets.filter(
      (ticket) => ticket.type.value === TICKET_TYPE.DEFAULT
    );

    await TransactionModel.create({
      title: TRANSACTION_ACTION[3].title,
      userId: user._id,
      type: TRANSACTION_ACTION[3].type,
      payment: ticket[0].price / 2,
      status: 1,
    });
    user.balance -= ticket[0].price / 2;
    await user.save();
    res.json({
      message: "Cancel keep cycling successfully",
    });
  } catch (error) {
    console.error("Error cancel keep cycling:", error);
    res.status(500).json({ error: "Failed to cancel keep cycling" });
  }
};
const createBooking = async (req, res) => {
  try {
    const { user_id } = req.user;
    const user = await UserModel.findOne({ uid: user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const booking = req.body;

    const existingUser = await BookingModel.findOne({
      userId: user._id,
      status: BOOKING_STATUS.ACTIVE,
    });
    if (existingUser) {
      return res.status(400).json({ error: "User already on the trips" });
    }

    const stationCycling = await StationCyclingModel.findOne({
      cyclingId: booking.cyclingId,
      stationId: booking.startStation,
    });

    if (!stationCycling) {
      return res.status(400).json({ error: "Xe không ở trạm này" });
    }

    const cycling = await CyclingModel.findById(booking.cyclingId);
    if (cycling.status !== CYCLING_STATUS.READY) {
      return res.status(400).json({ error: "Xe đang được sử dụng" });
    }
    const userTickets = await UserTicketModel.find({
      userId: user._id,
    }).populate({ path: "ticketId", populate: { path: "categoryId" } });

    const userTicketsFilter = userTickets.filter(
      (userTicket) =>
        userTicket.ticketId.categoryId._id.toHexString() ===
        cycling.category.toHexString()
    );
    if (userTicketsFilter.length > 0) {
      console.log("1. có vé");
      if (userTicketsFilter[0].dateEnd > new Date()) {
        console.log("2. vé còn hạn");
        if (userTicketsFilter[0].usage < userTicketsFilter[0].ticketId.timer) {
          console.log("3. vẫn còn thời gian để sử dụng, tạo booking ở đây");
          const newBooking = await BookingModel.create({
            userId: user._id,
            cyclingId: booking.cyclingId,
            startStation: booking.startStation,
            status: BOOKING_STATUS.ACTIVE,
            ticketId: userTicketsFilter[0].ticketId._id,
          });
          await CyclingModel.findByIdAndUpdate(booking.cyclingId, {
            status: CYCLING_STATUS.ACTIVE,
          });
          await StationCyclingModel.deleteOne({ cyclingId: booking.cyclingId });
          return res.json(newBooking);
        } else {
          console.log("3. đã dùng hết thời gian cho phép -> sử dụng vé lượt");
        }
      } else {
        console.log("2. vé hết hạn -> sử dụng vé lượt");
      }
    } else {
      console.log("1. không có vé -> sử dụng vé lượt");
    }
    const tickets = await TicketModel.find({
      categoryId: cycling.category,
    }).populate("type");
    const ticket = tickets.filter(
      (ticket) => ticket.type.value === TICKET_TYPE.DEFAULT
    );

    if (user.balance < ticket[0].price * 2) {
      return res.status(400).json({
        error: `Tài khoảng trên ${ticket[0].price * 2} mới có thể đặt xe`,
      });
    }
    user.balance -= ticket[0].price;
    await user.save();

    const newBooking = await BookingModel.create({
      userId: user._id,
      cyclingId: booking.cyclingId,
      startStation: booking.startStation,
      ticketId: ticket[0]._id,
      status: BOOKING_STATUS.ACTIVE,
    });

    await CyclingModel.findByIdAndUpdate(booking.cyclingId, {
      status: CYCLING_STATUS.ACTIVE,
    });

    await StationCyclingModel.deleteOne({ cyclingId: booking.cyclingId });

    res.json(newBooking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
};

const createTripDetail = async (req, res) => {
  const { user_id } = req.user;
  const { bookingId, status, endStation } = req.body;
  let payment = 0;
  try {
    const user = await UserModel.findOne({ uid: user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const booking = await BookingModel.findById(bookingId).populate({
      path: "ticketId",
      populate: { path: "type" },
    });

    const date = new Date();
    const total = Math.floor((date - booking.createdAt) / 60000);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    const cycling = await CyclingModel.findById(booking.cyclingId);
    if (booking.ticketId.type.value !== TICKET_TYPE.DEFAULT) {
      const userTicket = await UserTicketModel.findOne({
        userId: user._id,
        ticketId: booking.ticketId._id,
      });
      // check xem tổng usage lớn hơn timer => Tạo hóa đơn tính tiền => API transaction
      if (userTicket.usage + total > booking.ticketId.timer) {
        payment = overduePriceToPay(
          userTicket.usage + total - booking.ticketId.timer,
          booking.ticketId.overduePrice,
          booking.ticketId.duration
        );
        user.balance -= payment;
        console.log("tinh tien vé ngày/tháng sử dụng thêm", payment);
      } else {
        console.log("khong tinh tien, payment =", payment);
      }
      userTicket.usage = userTicket.usage + total;
      await userTicket.save();
    } else {
      // check xem total có lớn hơn timer không =? Tạo hóa đơn tính tiền => API transaction
      if (total > booking.ticketId.timer) {
        payment = overduePriceToPay(
          total - booking.ticketId.timer,
          booking.ticketId.overduePrice,
          booking.ticketId.duration
        );
        user.balance -= payment;
        console.log("tinh tien them thoi", payment);
        payment += booking.ticketId.price;
      } else {
        console.log(
          "khong tinh tien, chi tinh tien mua ve luot, payment =",
          booking.ticketId.price
        );
        payment = booking.ticketId.price;
      }
    }
    console.log("booking", booking.ticketId.type.value, total);

    booking.status = status;
    await booking.save();
    const newBookingDetail = await BookingDetailModel.create({
      uid: user_id,
      bookingId,
      endStation,
      total,
      tripHistory: cycling.coordinate,
      payment,
    });
    user.point += total;
    await user.save();
    await StationCyclingModel.create({
      stationId: endStation,
      cyclingId: booking.cyclingId,
    });
    await CyclingModel.findByIdAndUpdate(booking.cyclingId, {
      status: CYCLING_STATUS.READY,
      coordinate: [],
    });
    if (payment > 0) {
      await TransactionModel.create({
        title: TRANSACTION_ACTION[0].title,
        userId: user._id,
        type: TRANSACTION_ACTION[0].type,
        payment: payment,
        status: 1,
      });
    }
    res.json(newBookingDetail);
  } catch (error) {
    console.error("Error create trip detail:", error);
    res.status(500).json({ error: "Failed to create trip detail" });
  }
};

const deleteAllBooking = async (req, res) => {
  try {
    await BookingModel.deleteMany({});
    await BookingDetailModel.deleteMany({});
    res.json({ message: "Delete all booking successfully" });
  } catch (error) {
    console.error("Error delete all booking:", error);
    res.status(500).json({ error: "Failed to delete all booking" });
  }
};

const deleteAllBookingDetail = async (req, res) => {
  try {
    await BookingDetailModel.deleteMany({});
    res.json({ message: "Delete all booking detail successfully" });
  } catch (error) {
    console.error("Error delete all booking detail:", error);
    res.status(500).json({ error: "Failed to delete all booking detail" });
  }
};

const getTripDetail = async (req, res) => {
  try {
    const bookingId = req.query.bookingId;
    console.log("booking:", bookingId);
    const tripDetail = await BookingDetailModel.findOne({ bookingId });
    if (!tripDetail) {
      return res.status(404).json({ error: "Trip detail not found" });
    }
    res.json(tripDetail);
  } catch (error) {
    console.error("Error get trip detail:", error);
    res.status(500).json({ error: "Failed to get trip detail" });
  }
};

const findTrip = async (req, res) => {
  try {
    const { user_id } = req.user;
    const user = await UserModel.findOne({ uid: user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    let existingBooking = await BookingModel.findOne({
      userId: user._id,
      status: BOOKING_STATUS.ACTIVE,
    });
    if (!existingBooking) {
      existingBooking = await BookingModel.findOne({
        userId: user._id,
        status: BOOKING_STATUS.KEEPING,
      });
      if (!existingBooking) {
        return res.status(404).json({ error: "Trip not found" });
      }
    }
    res.json(existingBooking);
  } catch (error) {
    console.error("Error find trip:", error);
    res.status(500).json({ error: "Failed to find trip" });
  }
};

const findTripById = async (req, res) => {
  try {
    const { bookingId } = req.query;
    const trip = await BookingModel.findById(bookingId)
      .populate({ path: "cyclingId", populate: { path: "category" } })
      .populate("startStation");
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }
    res.json(trip);
  } catch (error) {
    console.error("Error find trip by id:", error);
    res.status(500).json({ error: "Failed to find trip by id" });
  }
};
const getTripHistory = async (req, res) => {
  try {
    const { user_id } = req.user;
    const history = await BookingDetailModel.find({ uid: user_id }).populate(
      "bookingId"
    );
    res.json(history);
  } catch (error) {
    console.error("Error get trip history:", error);
    res.status(500).json({ error: "Failed to get trip history" });
  }
};

const deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.query;
    const trip = await BookingModel.findByIdAndDelete(bookingId);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }
    res.json({ message: "Delete booking successfully" });
  } catch (error) {
    console.error("Error find trip by id:", error);
    res.status(500).json({ error: "Failed to find trip by id" });
  }
};
const deleteBookingDetail = async (req, res) => {
  try {
    const { bookingId } = req.query;
    const trip = await BookingDetailModel.findByIdAndDelete(bookingId);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }
    res.json({ message: "Delete booking successfully" });
  } catch (error) {
    console.error("Error find trip by id:", error);
    res.status(500).json({ error: "Failed to find trip by id" });
  }
};

module.exports = {
  createBooking,
  createTripDetail,
  deleteAllBooking,
  getTripDetail,
  findTrip,
  findTripById,
  createKeepCycling,
  startFromKeepCycling,
  cancalKeepCycling,
  getTripHistory,
  deleteBooking,
  deleteBookingDetail,
};
