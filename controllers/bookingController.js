const BookingDetailModel = require("../models/bookingDetailModel");
const BookingModel = require("../models/bookingModel");

const createBooking = async (req, res) => {
  try {
    const booking = req.body;

    const existingUser = await BookingModel.findOne({
      userId: booking.userId,
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
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
  const { bookingId, status, endStation, tripHistory } = req.body;
  try {
    const booking = await BookingModel.findById(bookingId);
    const date = new Date();
    const total = Math.floor((date - booking.createdAt) / 60000);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    booking.status = status;
    await booking.save();
    const newBookingDetail = await BookingDetailModel.create({
      bookingId,
      endStation,
      total,
      tripHistory,
    });
    res.json(newBookingDetail);
  } catch (error) {
    console.error("Error create trip detail:", error);
    res.status(500).json({ error: "Failed to create trip detail" });
  }
};

module.exports = { createBooking, createTripDetail };
