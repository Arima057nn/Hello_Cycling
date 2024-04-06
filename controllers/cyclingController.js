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
    const cycling = await CyclingModel.findOne({ code, status: 0 });
    if (!cycling) {
      return res.status(404).json({ error: "Cycling not found" });
    }
    res.json(cycling);
  } catch (error) {
    console.error("Error finding cycling:", error);
    res.status(500).json({ error: "Failed to find cycling" });
  }
};

module.exports = { createCycling, findCycling };
