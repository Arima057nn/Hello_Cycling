const CyclingTypeModel = require("../models/cyclingTypeModel");

const createCyclingType = async (req, res, next) => {
  const { name, value, description } = req.body;
  try {
    const existingType = await CyclingTypeModel.findOne({ name });
    if (existingType) {
      return res.status(400).json({ error: "Cycling type already exists" });
    }
    const newType = await CyclingTypeModel.create({ name, value, description });

    res.json(newType);
  } catch (error) {
    console.error("Error creating cycling type:", error);
    res.status(500).json({ error: "Failed to create cycling type" });
  }
};

const getAllTypes = async (req, res, next) => {
  try {
    const types = await CyclingTypeModel.find();
    res.json(types);
  } catch (error) {
    console.error("Error getting cycling types:", error);
    res.status(500).json({ error: "Failed to get cycling types" });
  }
};

module.exports = {
  createCyclingType,
  getAllTypes,
};
