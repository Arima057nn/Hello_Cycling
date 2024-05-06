const StationCyclingModel = require("../models/stationCyclingModel");
const StationModel = require("../models/stationModel");
const { Client } = require("@googlemaps/google-maps-services-js");
const client = new Client({});

const createStation = async (req, res, next) => {
  try {
    const station = req.body;
    const existingStation = await StationModel.findOne({
      code: station.code,
    });

    if (existingStation) {
      return res.status(400).json({ error: "Station already exists" });
    }

    const newStation = await StationModel.create({
      name: station.name,
      code: station.code,
      position: station.position,
      latitude: station.latitude,
      longitude: station.longitude,
      image: station.image,
    });

    res.json(newStation);
  } catch (error) {
    console.error("Error creating station:", error);
    res.status(500).json({ error: "Failed to create station" });
  }
};

const getAllStation = async (req, res, next) => {
  try {
    const stations = await StationModel.find();
    res.json(stations);
  } catch (error) {
    console.error("Error getting stations:", error);
    res.status(500).json({ error: "Failed to get stations" });
  }
};

const calculateDistance = async (req, res, next) => {
  const { origin, destination } = req.body;
  try {
    const response = await client.distancematrix({
      params: {
        origins: [origin],
        destinations: [destination],
        key: process.env.GOOGLE_MAP_API_KEY,
      },
    });
    const distance = response.data.rows[0].elements[0].distance.text;
    const duration = response.data.rows[0].elements[0].duration.text;
    res.json({ distance, duration });
  } catch (error) {
    console.error(error);
  }
};

const calculateDistanceToAllStations = async (req, res, next) => {
  const { origin } = req.body;
  const stations = await StationModel.find();

  try {
    let destinations = stations.map(
      (station) => `${station.latitude},${station.longitude}`
    );

    const response = await client.distancematrix({
      params: {
        origins: [origin],
        destinations: destinations,
        key: process.env.GOOGLE_MAP_API_KEY,
      },
    });

    // Xử lý kết quả để trả về mảng các khoảng cách và thời gian
    let distancesAndDurations = response.data.rows[0].elements.map(
      (element, index) => ({
        station: stations[index]._id,
        distance: element.distance.text,
        duration: element.duration.text,
      })
    );

    res.json(distancesAndDurations);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const getDistanceAndCountOfCyclingAtStations = async (req, res, next) => {
  const { origin } = req.body;
  const stations = await StationModel.find();

  try {
    const stationsWithCyclingCount = await StationCyclingModel.aggregate([
      {
        $group: {
          _id: "$stationId",
          count: { $sum: 1 },
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
          station: { $arrayElemAt: ["$station", 0] },
          count: 1,
        },
      },
      {
        $sort: { "station.createdAt": 1 },
      },
    ]);

    let destinations = stationsWithCyclingCount.map(
      (station) => `${station.station.latitude},${station.station.longitude}`
    );

    const response = await client.distancematrix({
      params: {
        origins: [origin],
        destinations: destinations,
        key: process.env.GOOGLE_MAP_API_KEY,
      },
    });

    let distancesAndDurations = response.data.rows[0].elements.map(
      (element, index) => ({
        station: stations[index],
        distance: element.distance.text,
        duration: element.duration.text,
        countOfCycling: stationsWithCyclingCount[index].count,
      })
    );
    distancesAndDurations.sort(
      (a, b) =>
        parseFloat(a.distance.replace(",", "")) -
        parseFloat(b.distance.replace(",", ""))
    );
    res.json(distancesAndDurations);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

module.exports = {
  createStation,
  getAllStation,
  calculateDistance,
  calculateDistanceToAllStations,
  getDistanceAndCountOfCyclingAtStations,
};
