const StationCyclingModel = require("../models/stationCyclingModel");
const StationModel = require("../models/stationModel");

const createCyclingAtStation = async (req, res, next) => {
  try {
    const { cyclingId, stationId } = req.body;

    const existingCycling = await StationCyclingModel.findOne({
      cyclingId: cyclingId,
    });

    if (existingCycling) {
      return res.status(400).json({ error: "Cycling already exists" });
    }

    const neweCyclingAtStation = await StationCyclingModel.create({
      stationId: stationId,
      cyclingId: cyclingId,
    });

    res.json(neweCyclingAtStation);
  } catch (error) {
    console.error("Error creating cycling at station:", error);
    res.status(500).json({ error: "Failed to create cycling at station" });
  }
};

const GetCountOfAllCyclingAtStation = async (req, res, next) => {
  try {
    const stationList = await StationModel.find();

    const stationCyclingList = await StationCyclingModel.aggregate([
      {
        $group: {
          _id: "$stationId",
          count: { $sum: 1 }, // Đếm số lượng Cycling trong mỗi Station
        },
      },
    ]);

    const stationCyclingMap = new Map();
    stationCyclingList.forEach((item) => {
      stationCyclingMap.set(item._id.toString(), item.count);
    });

    const stations = stationList.map((station) => {
      const count = stationCyclingMap.get(station._id.toString()) || 0;
      return {
        station,
        count,
      };
    });

    res.json(stations);
  } catch (error) {
    console.error("Error getting cycling at station:", error);
    res.status(500).json({ error: "Failed to get cycling at station" });
  }
};

const getCyclingsAtStation = async (req, res, next) => {
  try {
    const { stationId } = req.query;
    console.log(stationId);
    const cyclings = await StationCyclingModel.find({
      stationId: stationId,
    }).populate({ path: "cyclingId", populate: { path: "category" } });
    res.json(cyclings);
  } catch (error) {
    console.error("Error getting cycling at station:", error);
    res.status(500).json({ error: "Failed to get cycling at station" });
  }
};

const findCyclingAtStation = async (req, res, next) => {
  try {
    const { cyclingId } = req.query;
    const cycling = await StationCyclingModel.findOne({
      cyclingId: cyclingId,
    })
      .populate("stationId")
      .populate("cyclingId");
    res.json(cycling);
  } catch (error) {
    console.error("Error getting cycling at station:", error);
    res.status(500).json({ error: "Failed to get cycling at station" });
  }
};
module.exports = {
  createCyclingAtStation,
  GetCountOfAllCyclingAtStation,
  getCyclingsAtStation,
  findCyclingAtStation,
};
