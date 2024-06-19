const { CYCLING_STATUS } = require("../constants/cycling");
const CyclingModel = require("../models/cyclingModel");
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

const createCyclingsAtStation = async (req, res, next) => {
  try {
    const { stationId, cyclings } = req.body; // Nhận stationId và mảng cyclings từ body

    // Dùng Promise.all để thực hiện các thao tác đồng thời
    const createPromises = cyclings.map(async (cycling) => {
      const { cyclingId } = cycling;

      const newCyclingAtStation = await StationCyclingModel.create({
        stationId: stationId,
        cyclingId: cyclingId,
      });

      return newCyclingAtStation;
    });

    const results = await Promise.all(createPromises);

    res.json(results);
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
      .populate({ path: "cyclingId", populate: { path: "category" } });
    res.json(cycling);
  } catch (error) {
    console.error("Error getting cycling at station:", error);
    res.status(500).json({ error: "Failed to get cycling at station" });
  }
};

const getCyclingsNotAtStation = async (req, res, next) => {
  try {
    const cyclingStations = await StationCyclingModel.find();

    const cyclingStationIds = cyclingStations.map((station) =>
      station.cyclingId.toString()
    );

    const cyclings = await CyclingModel.find({ status: CYCLING_STATUS.READY });

    const cyclingsNotAtStation = cyclings.filter((cycling) => {
      return cyclingStationIds.every(
        (stationId) => stationId !== cycling._id.toString()
      );
    });

    res.json({ cyclingsNotAtStation, length: cyclingsNotAtStation.length });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách xe đạp không ở trạm:", error);
    res
      .status(500)
      .json({ error: "Không thể lấy danh sách xe đạp không ở trạm" });
  }
};

module.exports = {
  createCyclingAtStation,
  createCyclingsAtStation,
  GetCountOfAllCyclingAtStation,
  getCyclingsAtStation,
  findCyclingAtStation,
  getCyclingsNotAtStation,
};
