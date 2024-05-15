const { CYCLING_STATUS } = require("../constants/cycling");
const CyclingModel = require("../models/cyclingModel");

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
      return res.status(404).json({ error: "Cycling not found" });
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
      return res.status(404).json({ error: "Cycling not found" });
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
    console.log("cycling", cycling);
    console.log(code, coordinate);
    if (!cycling) {
      return res.status(404).json({ error: "Cycling not found" });
    }
    cycling.latitude = coordinate.latitude;
    cycling.longitude = coordinate.longitude;
    if (cycling.status === CYCLING_STATUS.ACTIVE) {
      cycling.coordinate.push(coordinate);
      console.log("Coordinate:", coordinate);
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

module.exports = {
  createCycling,
  findCycling,
  getCycling,
  sendCoordinate,
  updateAllCycling,
};
