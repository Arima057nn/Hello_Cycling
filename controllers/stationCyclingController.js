const StationCyclingModel = require("../models/stationCyclingModel");

const createCyclingAtStation = async (req, res, next) => {
  try {
    const { cyclingId, stationId } = req.body;

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
    const stations = await StationCyclingModel.aggregate([
      {
        $group: {
          _id: "$stationId",
          count: { $sum: 1 }, // Đếm số lượng Cycling trong mỗi Station
        },
      },
      {
        $lookup: {
          from: "Stations",
          localField: "_id",
          foreignField: "_id",
          as: "station",
        },
      },
      {
        $project: {
          _id: 0, // Loại bỏ trường _id
          station: { $arrayElemAt: ["$station", 0] }, // Lấy thông tin của Station từ trường station
          count: 1, // Giữ trường count
        },
      },
      {
        $sort: { "station.createdAt": 1 }, // Sắp xếp các station theo trường code, sử dụng 1 cho thứ tự tăng dần
      },
    ]);

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
    }).populate("cyclingId");
    res.json(cyclings);
  } catch (error) {
    console.error("Error getting cycling at station:", error);
    res.status(500).json({ error: "Failed to get cycling at station" });
  }
};

module.exports = {
  createCyclingAtStation,
  GetCountOfAllCyclingAtStation,
  getCyclingsAtStation,
};
