const { CYCLING_STATUS } = require("../constants/cycling");
const CyclingModel = require("../models/cyclingModel");
const StationCyclingModel = require("../models/stationCyclingModel");

const getAllCycling = async (req, res, next) => {
  try {
    const cyclings = await CyclingModel.find().populate("category");
    res.json(cyclings);
  } catch (error) {
    console.error("Error getting all cycling:", error);

    res.status(500).json({ error: "Failed to get all cycling" });
  }
};

const createCycling = async (req, res, next) => {
  try {
    const cycling = req.body;

    const existingCycling = await CyclingModel.findOne({
      code: cycling.code,
    });

    if (existingCycling) {
      return res.status(400).json({ error: "Cycling already exists" });
    }

    const newCycling = await CyclingModel.create({
      name: cycling.name,
      code: cycling.code,
      password: cycling.password,
      status: cycling.status,
      category: cycling.category,
    });

    res.json(newCycling);
  } catch (error) {
    console.error("Error creating cycling:", error);
    res.status(500).json({ error: "Failed to create cycling" });
  }
};

const findCycling = async (req, res, next) => {
  try {
    const { code } = req.query;
    const cycling = await CyclingModel.findOne({
      code,
      status: CYCLING_STATUS.READY,
    });
    if (!cycling) {
      return res.status(404).json({ error: "Không tìm thấy xe này" });
    }
    res.json(cycling);
  } catch (error) {
    console.error("Error finding cycling:", error);
    res.status(500).json({ error: "Failed to find cycling" });
  }
};

const getCycling = async (req, res, next) => {
  try {
    const { code } = req.query;
    const cycling = await CyclingModel.findOne({ code });
    if (!cycling) {
      return res.status(404).json({ error: "Không tìm thấy xe này" });
    }
    res.json(cycling);
  } catch (error) {
    console.error("Error finding cycling:", error);
    res.status(500).json({ error: "Failed to find cycling" });
  }
};

const sendCoordinate = async (req, res, next) => {
  try {
    const { code, coordinate } = req.body;
    const cycling = await CyclingModel.findOne({ code });
    console.log("cycling", code);
    if (!cycling) {
      return res.status(404).json({ error: "Không tìm thấy xe này" });
    }
    cycling.latitude = coordinate.latitude;
    cycling.longitude = coordinate.longitude;
    if (cycling.status === CYCLING_STATUS.ACTIVE) {
      cycling.coordinate.push(coordinate);
    }
    await cycling.save();
    res.json(cycling);
  } catch (error) {
    console.error("Error sending coordinate:", error);
    res.status(500).json({ error: "Failed to send coordinate" });
  }
};

const updateAllCycling = async (req, res, next) => {
  try {
    const { category } = req.body;
    const cyclings = await CyclingModel.find();
    cyclings.forEach(async (cycling) => {
      cycling.category = category;
      await cycling.save();
    });
    res.json(cyclings);
  } catch (error) {
    console.error("Error updating all cycling:", error);
    res.status(500).json({ error: "Failed to update all cycling" });
  }
};

const updateCoordinate = async (req, res, next) => {
  try {
    const stations = await StationCyclingModel.find().populate("stationId");
    for (const station of stations) {
      // Cập nhật tọa độ của xe
      await CyclingModel.findByIdAndUpdate(
        station.cyclingId,
        {
          latitude: station.stationId.latitude,
          longitude: station.stationId.longitude,
        },
        { new: true }
      );
    }
    res.json({
      message: "Coordinates updated for all cycles",
    });
  } catch (error) {
    console.error("Error adding coordinate:", error);
    res.status(500).json({ error: "Failed to add coordinate" });
  }
};
module.exports = {
  getAllCycling,
  createCycling,
  findCycling,
  getCycling,
  sendCoordinate,
  updateAllCycling,
  updateCoordinate,
};
