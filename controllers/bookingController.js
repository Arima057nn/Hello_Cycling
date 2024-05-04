const { BOOKING_STATUS } = require("../constants/booking");
const { CYCLING_STATUS } = require("../constants/cycling");
const BookingDetailModel = require("../models/bookingDetailModel");
const BookingModel = require("../models/bookingModel");
const CyclingModel = require("../models/cyclingModel");
const StationCyclingModel = require("../models/stationCyclingModel");

const createBooking = async (req, res) => {
  try {
    const booking = req.body;

    const existingUser = await BookingModel.findOne({
      userId: booking.userId,
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
      userId: booking.userId,
      cyclingId: booking.cyclingId,
      startStation: booking.startStation,
      status: booking.status,
    });

    res.json(newBooking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
};

const createTripDetail = async (req, res) => {
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
    const userId = req.query.userId;
    const trip = await BookingModel.findOne({
      status: BOOKING_STATUS.ACTIVE,
      userId: userId,
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
};
