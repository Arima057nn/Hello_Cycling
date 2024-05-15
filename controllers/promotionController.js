const PromotionModel = require("../models/promotionModel");

const createPromotion = async (req, res) => {
  try {
    const { name, description, discount, dateStart, dateEnd, status } =
      req.body;

    const existingPromotion = await PromotionModel.findOne({ name });
    if (existingPromotion) {
      return res.status(400).json({ error: "Promotion already exists" });
    }

    const newPromotion = await PromotionModel.create({
      name,
      description,
      discount,
      dateStart,
      dateEnd,
      status,
    });

    res.json(newPromotion);
  } catch (error) {
    console.error("Error creating promotion:", error);
    res.status(500).json({ error: "Failed to create promotion" });
  }
};

const getAllPromotion = async (req, res) => {
  try {
    const promotions = await PromotionModel.find();
    res.json(promotions);
  } catch (error) {
    console.error("Error getting promotions:", error);
    res.status(500).json({ error: "Failed to get promotions" });
  }
};

module.exports = { createPromotion, getAllPromotion };
