const {
  BOOKING_STATUS,
  CHANGE_DISTANCE,
  REMAINING_MINUTE_TICKET,
  KEEPING_TIME,
} = require("../constants/booking");
const admin = require("firebase-admin");
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
const { Client } = require("@googlemaps/google-maps-services-js");
const client = new Client({});

const createKeepCycling = async (req, res) => {
  try {
    const { cyclingId, startStation, ticketId } = req.body;
    const { user_id } = req.user;
    const user = await UserModel.findOne({ uid: user_id });
    let paymentCycling = 0;
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

    const cycling = await CyclingModel.findById(cyclingId);
    if (cycling.status !== CYCLING_STATUS.READY) {
      return res.status(400).json({ error: "Xe đang được sử dụng" });
    }
    const stationCycling = await StationCyclingModel.findOne({
      cyclingId: cyclingId,
      stationId: startStation,
    });

    if (!stationCycling) {
      return res.status(400).json({ error: "Xe không ở trạm này" });
    }

    const ticket = await TicketModel.findById(ticketId).populate("type");
    if (!ticket) {
      return res.status(404).json({ error: "Không tìm thấy vé" });
    }
    if (ticket.type.value === TICKET_TYPE.DAY) {
      if (user.balance < ticket.price / 5) {
        return res.status(400).json({
          error: `Bạn đang sử dụng vé ngày, tài khoản trên ${
            ticket.price / 5
          } mới có thể đặt xe`,
        });
      } else paymentCycling = ticket.price / 5;
    }
    if (ticket.type.value === TICKET_TYPE.MONTHLY) {
      if (user.balance < ticket.price / 12) {
        return res.status(400).json({
          error: `Bạn đang sử dụng vé tháng, tài khoản trên ${
            ticket.price / 12
          } mới có thể đặt giữ xe`,
        });
      } else paymentCycling = ticket.price / 12;
    }
    let userTicket;
    if (ticket.type.value === TICKET_TYPE.DEFAULT) {
      if (user.balance < ticket.price * 2) {
        return res.status(400).json({
          error: `Bạn đang sử dụng vé lượt, tài khoản trên ${
            ticket.price * 2
          } mới có thể đặt giữ xe`,
        });
      } else paymentCycling = ticket.price * 2;
    } else {
      userTicket = await UserTicketModel.findOne({
        userId: user._id,
        ticketId: ticketId,
      }).populate({ path: "ticketId", populate: { path: "type" } });
      if (!userTicket) {
        return res.status(404).json({ error: "Bạn chưa mua vé này" });
      } else {
        if (userTicket.status !== USER_TICKET_STATUS.READY) {
          return res.status(400).json({ error: "Vé đã được sử dụng" });
        }
        if (userTicket.dateEnd < new Date()) {
          return res
            .status(400)
            .json({ error: "Vé đã hết hạn sử dụng. Vui lòng mua vé mới" });
        }
        if (userTicket.ticketId.timer < userTicket.usage) {
          return res.status(400).json({
            error:
              "Vé đã dùng hết thời lượng có thể sử dụng. Vui lòng mua vé mới",
          });
        }
        userTicket.status = USER_TICKET_STATUS.KEEPING;
        await userTicket.save();
      }
    }
    user.balance -= paymentCycling;
    await user.save();
    const newKeepBooking = await BookingModel.create({
      userId: user._id,
      cyclingId: cyclingId,
      startStation: startStation,
      status: BOOKING_STATUS.KEEPING,
      ticketId: ticketId,
      payment: paymentCycling,
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
    if (
      keepBooking.createdAt.getTime() + KEEPING_TIME * 60 * 1000 <
      new Date().getTime()
    ) {
      return res
        .status(400)
        .json({ error: "Không thể bắt đầu vì thời gian giữ xe đã hết" });
    }
    const newBooking = await BookingModel.create({
      userId: keepBooking.userId,
      cyclingId: keepBooking.cyclingId,
      startStation: keepBooking.startStation,
      status: BOOKING_STATUS.ACTIVE,
      ticketId: keepBooking.ticketId,
      payment: keepBooking.payment,
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
    user.balance = user.balance - ticket[0].price / 2 + keepBooking.payment;
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
    let paymentCycling = 0;
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

    const cycling = await CyclingModel.findById(booking.cyclingId);
    if (cycling.status !== CYCLING_STATUS.READY) {
      return res.status(400).json({ error: "Xe đang được sử dụng" });
    }

    const stationCycling = await StationCyclingModel.findOne({
      cyclingId: booking.cyclingId,
      stationId: booking.startStation,
    });

    if (!stationCycling) {
      return res.status(400).json({ error: "Xe không ở trạm này" });
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
      paymentCycling = ticket.price * 2;
    } else {
      userTicket = await UserTicketModel.findOne({
        userId: user._id,
        ticketId: booking.ticketId,
      }).populate({ path: "ticketId", populate: { path: "type" } });
      if (!userTicket) {
        return res.status(404).json({ error: "Bạn chưa mua vé này" });
      } else {
        if (userTicket.status !== USER_TICKET_STATUS.READY) {
          return res.status(400).json({ error: "Vé đã được sử dụng" });
        }
        if (userTicket.dateEnd < new Date()) {
          return res
            .status(400)
            .json({ error: "Vé đã hết hạn sử dụng. Vui lòng mua vé mới" });
        }
        if (userTicket.ticketId.timer < userTicket.usage) {
          return res.status(400).json({
            error:
              "Vé đã dùng hết thời lượng có thể sử dụng. Vui lòng mua vé mới",
          });
        }
        if (
          userTicket.ticketId.timer - userTicket.usage <=
          REMAINING_MINUTE_TICKET
        ) {
          if (
            (userTicket.ticketId.type.value === TICKET_TYPE.DAY &&
              user.balance < userTicket.ticketId.price / 5) ||
            (userTicket.ticketId.type.value === TICKET_TYPE.MONTHLY &&
              user.balance < userTicket.ticketId.price / 12)
          ) {
            {
              return res.status(400).json({
                error: `Thời lượng sử dụng còn lại của ${
                  userTicket.ticketId.name
                } dưới ${REMAINING_MINUTE_TICKET} phút thì TK phải trên ${
                  userTicket.ticketId.type.value === TICKET_TYPE.DAY
                    ? userTicket.ticketId.price / 5
                    : userTicket.ticketId.price / 12
                } điểm mới có thể đặt xe`,
              });
            }
          } else {
            if (userTicket.ticketId.type.value === TICKET_TYPE.DAY) {
              paymentCycling = userTicket.ticketId.price / 5;
            }
            if (userTicket.ticketId.type.value === TICKET_TYPE.MONTHLY) {
              paymentCycling = userTicket.ticketId.price / 12;
            }
          }
        }
      }
    }
    user.balance -= paymentCycling;
    await user.save();
    const newBooking = await BookingModel.create({
      userId: user._id,
      cyclingId: booking.cyclingId,
      startStation: booking.startStation,
      ticketId: booking.ticketId,
      status: BOOKING_STATUS.ACTIVE,
      payment: paymentCycling,
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
    const checkCycling = await StationCyclingModel.findOne({
      cyclingId: booking.cyclingId,
    });
    if (checkCycling) {
      return res.status(400).json({
        error: "Xe bạn trả hiện đang ở trạm khác, vui lòng kiểm tra lại",
      });
    }

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
      }
      userTicket.usage = userTicket.usage + total;
      userTicket.status = USER_TICKET_STATUS.READY;
      await userTicket.save();
    } else {
      if (total > booking.ticketId.timer) {
        payment =
          overduePriceToPay(
            total - booking.ticketId.timer,
            booking.ticketId.overduePrice,
            booking.ticketId.duration
          ) + booking.ticketId.price;
      } else {
        payment = booking.ticketId.price;
      }
    }

    booking.status = BOOKING_STATUS.CLOSED;
    user.balance = user.balance - payment + booking.payment;
    console.log("payment", user.balance, payment, booking.payment);
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
    const history = await BookingDetailModel.find({ uid: user_id })
      .populate("bookingId")
      .sort({ createdAt: -1 });
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

const changeCycling = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { bookingId, cyclingId } = req.body;
    const user = await UserModel.findOne({ uid: user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const booking = await BookingModel.findById(bookingId).populate({
      path: "cyclingId",
    });
    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy chuyến đi" });
    }
    if (
      booking.status === BOOKING_STATUS.KEEPING &&
      booking.createdAt.getTime() + 15 * 60 * 1000 < new Date().getTime()
    ) {
      return res.status(400).json({
        error: "Không thể thực hiện đổi xe vì thời gian giữ xe đã hết",
      });
    }
    if (booking.cyclingId.status === CYCLING_STATUS.READY) {
      return res.status(400).json({ error: "Xe đang ở trạng thái sẵn sàng" });
    }
    const cycling = await CyclingModel.findById(cyclingId);
    if (cycling._id.toString() === booking.cyclingId._id.toString()) {
      return res.status(400).json({ error: "Hai xe này là một" });
    }
    const checkCycling = await StationCyclingModel.findOne({
      cyclingId: booking.cyclingId._id,
    });
    if (checkCycling && booking.status !== BOOKING_STATUS.KEEPING) {
      return res.status(400).json({
        error:
          "Xe bạn đang sử dụng hiện đang ở trạm nào đó, vui lòng kiểm tra lại",
      });
    }
    if (booking.cyclingId.category.toString() !== cycling.category.toString()) {
      return res.status(400).json({ error: "Hai xe không cùng loại" });
    }
    if (cycling.status !== CYCLING_STATUS.READY) {
      return res.status(400).json({ error: "Xe đang được sử dụng" });
    }
    const stationCycling = await StationCyclingModel.findOne({
      cyclingId,
    }).populate("stationId");
    if (!stationCycling) {
      return res.status(400).json({ error: "Không tìm thấy xe ở trạm" });
    }
    const CyclingToNewCyclingDistance = await client.distancematrix({
      params: {
        origins: [
          { lat: booking.cyclingId.latitude, lng: booking.cyclingId.longitude },
        ],
        destinations: [{ lat: cycling.latitude, lng: cycling.longitude }],
        key: process.env.GOOGLE_MAP_API_KEY,
      },
    });
    if (
      CyclingToNewCyclingDistance.data.rows[0].elements[0].distance.value >
      CHANGE_DISTANCE
    ) {
      return res.status(400).json({
        error: "Không thể thực hiển đổi xe vì khoảng cách 2 xe quá xa",
      });
    }

    const CyclingToStationDistance = await client.distancematrix({
      params: {
        origins: [
          { lat: booking.cyclingId.latitude, lng: booking.cyclingId.longitude },
        ],
        destinations: [
          {
            lat: stationCycling.stationId.latitude,
            lng: stationCycling.stationId.longitude,
          },
        ],
        key: process.env.GOOGLE_MAP_API_KEY,
      },
    });
    if (
      CyclingToStationDistance.data.rows[0].elements[0].distance.value >
      CHANGE_DISTANCE
    ) {
      return res.status(400).json({
        error: "Xe bạn muốn đổi hiện đang ở cách xa trạm này",
      });
    }
    cycling.status = booking.cyclingId.status;
    cycling.coordinate = booking.cyclingId.coordinate;
    await cycling.save();
    await CyclingModel.findByIdAndUpdate(booking.cyclingId._id, {
      status: CYCLING_STATUS.READY,
      coordinate: [],
    });

    if (booking.status === BOOKING_STATUS.ACTIVE) {
      await StationCyclingModel.deleteOne({ cyclingId: cycling._id });
      await StationCyclingModel.create({
        stationId: stationCycling.stationId._id,
        cyclingId: booking.cyclingId._id,
      });
    }

    await BookingModel.findByIdAndUpdate(bookingId, {
      cyclingId: cyclingId,
    });

    res.json({ message: "Đổi xe thành công" });
  } catch (error) {
    console.error("Error change cycling:", error);
    res.status(500).json({ error: "Failed to change cycling" });
  }
};

const getAllTripDetail = async (req, res) => {
  try {
    const tripDetails = await BookingDetailModel.find({})
      .populate({
        path: "bookingId",
        populate: [
          { path: "cyclingId", populate: { path: "category" } },
          { path: "startStation" },
          { path: "ticketId" },
        ],
      })
      .populate("endStation");
    res.json(tripDetails);
  } catch (error) {
    console.error("Error get all trip detail:", error);
    res.status(500).json({ error: "Failed to get all trip detail" });
  }
};

const GetAllKeepBooking = async (req, res) => {
  try {
    const keepBookings = await BookingModel.find({
      status: BOOKING_STATUS.KEEPING,
    }).populate("ticketId");
    console.log("length", keepBookings.length);
    for (const keepBooking of keepBookings) {
      console.log("11");
      if (
        keepBooking.createdAt.getTime() + KEEPING_TIME * 60 * 1000 <
        new Date().getTime()
      ) {
        const user = await UserModel.findById(keepBooking.userId);
        const cycling = await CyclingModel.findByIdAndUpdate(
          keepBooking.cyclingId,
          {
            status: CYCLING_STATUS.READY,
          }
        );
        await BookingModel.findByIdAndDelete(keepBooking._id);

        await UserTicketModel.findOneAndUpdate(
          { userId: user._id, ticketId: keepBooking.ticketId },
          { status: USER_TICKET_STATUS.READY }
        );

        const tickets = await TicketModel.find({
          categoryId: keepBooking.ticketId.categoryId,
        }).populate("type");
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
        user.balance = user.balance - ticket[0].price / 2 + keepBooking.payment;
        await user.save();

        const message = {
          notification: {
            title: "Giữ xe",
            body: `Thời gian giữ xe ${cycling.name} trong 1 giờ đã hết`,
          },
          token: user.fcm,
        };
        console.log("user", user.fcm);
        admin
          .messaging()
          .send(message)
          .then((response) => {
            console.log("Successfully sent message:", response);
          })
          .catch((error) => {
            console.log("Error sending message:", error);
          });
      }
    }
  } catch (error) {
    console.error("Error get all keep booking:", error);
    res.status(500).json({ error: "Failed to get all keep booking" });
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
  changeCycling,
  getAllTripDetail,
  GetAllKeepBooking,
};
