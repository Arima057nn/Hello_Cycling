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

module.exports = { createCycling };
