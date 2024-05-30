const TransactionModel = require("../models/transactionModel");
const UserModel = require("../models/userModel");

const getAllTransactions = async (req, res) => {
  try {
    const { user_id } = req.user;
    const user = await UserModel.findOne({ uid: user_id });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const transactions = await TransactionModel.find({ userId: user._id }).sort(
      { createdAt: -1 }
    );

    res.json(transactions);
  } catch (error) {
    console.error("Error getting transactions:", error);
    res.status(500).json({ error: "Failed to get transactions" });
  }
};

const deleteAllTransactions = async (req, res) => {
  try {
    const { user_id } = req.user;
    const user = await UserModel.findOne({ uid: user_id });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    await TransactionModel.deleteMany({});
    res.json({ message: "All transactions deleted" });
  } catch (error) {
    console.error("Error deleting transactions:", error);
    res.status(500).json({ error: "Failed to delete transactions" });
  }
};

module.exports = {
  getAllTransactions,
  deleteAllTransactions,
};
