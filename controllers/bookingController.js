const { BOOKING_STATUS } = require("../constants/booking");
const { CYCLING_STATUS } = require("../constants/cycling");
const BookingDetailModel = require("../models/bookingDetailModel");
const BookingModel = require("../models/bookingModel");
const CyclingModel = require("../models/cyclingModel");
const StationCyclingModel = require("../models/stationCyclingModel");
const UserModel = require("../models/userModel");

const createKeepCycling = async (req, res) => {
  try {
    const { cyclingId, startStation } = req.body;
    const user = req.user;
    const existingBooking = await BookingModel.findOne({
      userId: user.userId,
      status: BOOKING_STATUS.ACTIVE,
    });
    if (!existingBooking) {
      const existingKeepingBooking = await BookingModel.findOne({
        userId: user.userId,
        status: BOOKING_STATUS.KEEPING,
      });
      if (existingKeepingBooking) {
        return res
          .status(404)
          .json({ error: "User already on the keep trips" });
      }
    } else return res.status(404).json({ error: "User already on the trips" });

    const cycling = await CyclingModel.findById(cyclingId);
    if (cycling && cycling.status === CYCLING_STATUS.READY) {
      cycling.status = CYCLING_STATUS.KEEPING;
      await cycling.save();
    }
    const newKeepBooking = await BookingModel.create({
      userId: user.userId,
      cyclingId: cyclingId,
      startStation: startStation,
      status: BOOKING_STATUS.KEEPING,
    });

    res.json(newKeepBooking);
  } catch (error) {
    console.error("Error keep cycling:", error);
    res.status(500).json({ error: "Failed to keep cycling" });
  }
};

const startFromKeepCycling = async (req, res) => {
  try {
    const user = req.user;
    const keepBooking = BookingModel.findOne({
      userId: user.userId,
      status: BOOKING_STATUS.KEEPING,
    });
    if (!keepBooking) {
      return res.status(404).json({ error: "User not on the keep trips" });
    }
    await StationCyclingModel.deleteOne({ cyclingId: keepBooking.cyclingId });
    keepBooking.status = BOOKING_STATUS.ACTIVE;
    await keepBooking.save();
    res.json(keepBooking);
  } catch (error) {
    console.error("Error start from keep cycling:", error);
    res.status(500).json({ error: "Failed to start from keep cycling" });
  }
};

const cancalKeepCycling = async (req, res) => {
  try {
    const user = req.user;
    const keepBooking = BookingModel.findOne({
      userId: user.userId,
      status: BOOKING_STATUS.KEEPING,
    });
    if (!keepBooking) {
      return res.status(404).json({ error: "User not on the keep trips" });
    }
    keepBooking.status = BOOKING_STATUS.CANCEL;
    await keepBooking.save();
    res.json(keepBooking);
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
    await CyclingModel.findByIdAndUpdate(booking.cyclingId, {
      status: CYCLING_STATUS.ACTIVE,
    });
    await StationCyclingModel.deleteOne({ cyclingId: booking.cyclingId });
    const newBooking = await BookingModel.create({
      userId: user._id,
      cyclingId: booking.cyclingId,
      startStation: booking.startStation,
      status: BOOKING_STATUS.ACTIVE,
    });

    res.json(newBooking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
};

const createTripDetail = async (req, res) => {
  const { user_id } = req.user;
  const { bookingId, status, endStation } = req.body;
  try {
    const booking = await BookingModel.findById(bookingId);
    const date = new Date();
    const total = Math.floor((date - booking.createdAt) / 60000);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    const cycling = await CyclingModel.findById(booking.cyclingId);
    booking.status = status;
    await booking.save();
    const newBookingDetail = await BookingDetailModel.create({
      uid: user_id,
      bookingId,
      endStation,
      total,
      tripHistory: cycling.coordinate,
    });
    await StationCyclingModel.create({
      stationId: endStation,
      cyclingId: booking.cyclingId,
    });
    await CyclingModel.findByIdAndUpdate(booking.cyclingId, {
      status: CYCLING_STATUS.READY,
      coordinate: [],
    });
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
    const trip = await BookingModel.findOne({
      status: BOOKING_STATUS.ACTIVE,
      userId: user._id,
    });
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }
    res.json(trip);
  } catch (error) {
    console.error("Error find trip:", error);
    res.status(500).json({ error: "Failed to find trip" });
  }
};
module.exports = {
  createBooking,
  createTripDetail,
  deleteAllBooking,
  getTripDetail,
  findTrip,
  createKeepCycling,
  startFromKeepCycling,
  cancalKeepCycling,
};
