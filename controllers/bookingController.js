const { BOOKING_STATUS } = require("../constants/booking");
const { CYCLING_STATUS } = require("../constants/cycling");
const { TICKET_TYPE, USER_TICKET_STATUS } = require("../constants/ticket");
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
    // let existingBooking = await BookingModel.findOne({
    //   userId: user._id,
    //   status: BOOKING_STATUS.ACTIVE,
    // });
    // if (!existingBooking) {
    //   existingBooking = await BookingModel.findOne({
    //     userId: user._id,
    //     status: BOOKING_STATUS.KEEPING,
    //   });
    //   if (existingBooking) {
    //     return res
    //       .status(404)
    //       .json({ error: "User already on the keep trips" });
    //   }
    // } else return res.status(404).json({ error: "User already on the trips" });

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
    if (!ticket) {
      return res.status(404).json({ error: "Không tìm thấy vé" });
    }
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
    let userTicket;
    if (ticket.type.value === TICKET_TYPE.DEFAULT) {
      if (user.balance < ticket.price * 2)
        return res.status(400).json({
          error: `Bạn đang sử dụng vé lượt, tài khoản phải trên ${
            ticket.price * 2
          } mới có thể đặt giữ xe`,
        });
    } else {
      userTicket = await UserTicketModel.findOne({
        userId: user._id,
        ticketId: ticketId,
      });
      if (!userTicket) {
        return res.status(404).json({ error: "Bạn chưa mua vé này" });
      } else {
        if (userTicket.status !== USER_TICKET_STATUS.READY) {
          return res.status(400).json({ error: "Vé đã được sử dụng" });
        }
        userTicket.status = USER_TICKET_STATUS.KEEPING;
        await userTicket.save();
      }
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
    const { user_id } = req.user;
    const user = await UserModel.findOne({ uid: user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const { bookingId } = req.body;
    const keepBooking = await BookingModel.findById(bookingId);
    if (!keepBooking) {
      return res.status(404).json({ error: "Bạn đang không đặt giữ xe này" });
    }
    if (keepBooking.status !== BOOKING_STATUS.KEEPING) {
      return res.status(400).json({ error: "Chuyến đi đã này bắt đầu" });
    }
    const newBooking = await BookingModel.create({
      userId: keepBooking.userId,
      cyclingId: keepBooking.cyclingId,
      startStation: keepBooking.startStation,
      status: BOOKING_STATUS.ACTIVE,
      ticketId: keepBooking.ticketId,
    });
    await UserTicketModel.findOneAndUpdate(
      { userId: user._id, ticketId: keepBooking.ticketId },
      { status: USER_TICKET_STATUS.ACTIVE }
    );
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
      return res.status(404).json({ error: "Bạn đang không đặt giữ xe này" });
    }
    await CyclingModel.findByIdAndUpdate(keepBooking.cyclingId, {
      status: CYCLING_STATUS.READY,
    });
    await BookingModel.findByIdAndDelete(bookingId);

    await UserTicketModel.findOneAndUpdate(
      { userId: user._id, ticketId: keepBooking.ticketId },
      { status: USER_TICKET_STATUS.READY }
    );
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
      message: `Hủy giữ xe thành công, phí giữ xe là ${ticket[0].price / 2}`,
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

    // let existingUser = await BookingModel.findOne({
    //   userId: user._id,
    //   status: BOOKING_STATUS.ACTIVE,
    // });
    // if (!existingUser) {
    //   existingUser = await BookingModel.findOne({
    //     userId: user._id,
    //     status: BOOKING_STATUS.KEEPING,
    //   });
    //   if (existingUser) {
    //     return res
    //       .status(404)
    //       .json({ error: "User already on the keep trips" });
    //   }
    // } else return res.status(404).json({ error: "User already on the trips" });

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
    const ticket = await TicketModel.findById(booking.ticketId).populate(
      "type"
    );
    if (!ticket) {
      return res.status(404).json({ error: "Không tìm thấy vé" });
    }
    let userTicket;
    if (ticket.type.value === TICKET_TYPE.DEFAULT) {
      if (user.balance < ticket.price * 2)
        return res.status(400).json({
          error: `Tài khoảng trên ${ticket.price * 2} mới có thể đặt xe`,
        });
      user.balance -= ticket.price;
      await user.save();
    } else {
      userTicket = await UserTicketModel.findOne({
        userId: user._id,
        ticketId: booking.ticketId,
      });
      if (!userTicket) {
        return res.status(404).json({ error: "Bạn chưa mua vé này" });
      } else {
        if (userTicket.status !== USER_TICKET_STATUS.READY) {
          return res.status(400).json({ error: "Vé đã được sử dụng" });
        }
      }
    }

    const newBooking = await BookingModel.create({
      userId: user._id,
      cyclingId: booking.cyclingId,
      startStation: booking.startStation,
      ticketId: booking.ticketId,
      status: BOOKING_STATUS.ACTIVE,
    });

    await CyclingModel.findByIdAndUpdate(booking.cyclingId, {
      status: CYCLING_STATUS.ACTIVE,
    });

    await StationCyclingModel.deleteOne({ cyclingId: booking.cyclingId });

    if (userTicket) {
      userTicket.status = USER_TICKET_STATUS.ACTIVE;
      await userTicket.save();
    }
    res.json(newBooking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
};

const createTripDetail = async (req, res) => {
  const { user_id } = req.user;
  const { bookingId, endStation } = req.body;
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
      return res.status(404).json({ error: "Không tìm thấy chuyến đi" });
    }
    const cycling = await CyclingModel.findById(booking.cyclingId);
    if (booking.ticketId.type.value !== TICKET_TYPE.DEFAULT) {
      const userTicket = await UserTicketModel.findOne({
        userId: user._id,
        ticketId: booking.ticketId._id,
      });
      if (userTicket.usage + total > booking.ticketId.timer) {
        payment = overduePriceToPay(
          userTicket.usage + total - booking.ticketId.timer,
          booking.ticketId.overduePrice,
          booking.ticketId.duration
        );
        user.balance -= payment;
      }
      userTicket.usage = userTicket.usage + total;
      userTicket.status = USER_TICKET_STATUS.READY;
      await userTicket.save();
    } else {
      if (total > booking.ticketId.timer) {
        payment = overduePriceToPay(
          total - booking.ticketId.timer,
          booking.ticketId.overduePrice,
          booking.ticketId.duration
        );
        user.balance -= payment;
        payment += booking.ticketId.price;
      } else {
        payment = booking.ticketId.price;
      }
    }

    booking.status = BOOKING_STATUS.CLOSED;
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
    const tripDetail = await BookingDetailModel.findById(bookingId)
      .populate({
        path: "bookingId",
        populate: [
          { path: "cyclingId", populate: { path: "category" } },
          { path: "startStation" },
          { path: "ticketId" },
        ],
      })
      .populate("endStation");
    if (!tripDetail) {
      return res.status(404).json({ error: "Không tìm thấy chuyến đi" });
    }
    console.log("tripDetail", tripDetail);
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
        return res.status(404).json({ error: "Không tìm thấy chuyến đi" });
      }
    }
    res.json(existingBooking);
  } catch (error) {
    console.error("Error find trip:", error);
    res.status(500).json({ error: "Failed to find trip" });
  }
};

const findTripsCurrent = async (req, res) => {
  try {
    const { user_id } = req.user;
    const user = await UserModel.findOne({ uid: user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const trips = await BookingModel.find({
      userId: user._id,
      status: { $ne: BOOKING_STATUS.CLOSED },
    })
      .populate({ path: "cyclingId", populate: { path: "category" } })
      .populate("startStation")
      .populate("ticketId");
    res.json(trips);
  } catch (error) {
    console.error("Error find trips:", error);
    res.status(500).json({ error: "Failed to find trips" });
  }
};

const findTripById = async (req, res) => {
  try {
    const { bookingId } = req.query;
    const trip = await BookingModel.findById(bookingId)
      .populate({ path: "cyclingId", populate: { path: "category" } })
      .populate("startStation");
    if (!trip) {
      return res.status(404).json({ error: "Không tìm thấy chuyến đi" });
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
    const result = await BookingModel.deleteMany({ _id: { $ne: bookingId } });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "No trips found to delete" });
    }
    res.json({
      message: "Deleted all bookings except the specified one successfully",
    });
  } catch (error) {
    console.error("Error find trip by id:", error);
    res.status(500).json({ error: "Failed to find trip by id" });
  }
};
const deleteBookingDetail = async (req, res) => {
  try {
    const { bookingId } = req.query;
    const result = await BookingDetailModel.deleteMany({
      _id: { $ne: bookingId },
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "No trips found to delete" });
    }
    res.json({
      message:
        "Deleted all booking details  except the specified one successfully",
    });
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
  findTripsCurrent,
  findTripById,
  createKeepCycling,
  startFromKeepCycling,
  cancalKeepCycling,
  getTripHistory,
  deleteBooking,
  deleteBookingDetail,
};
