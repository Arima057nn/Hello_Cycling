const ReportModel = require("../models/reportModel");
const UserModel = require("../models/userModel");

const createReport = async (req, res) => {
  try {
    const { user_id } = req.user;
    const user = await UserModel.findOne({ uid: user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const { title, description, cyclingId } = req.body;

    await ReportModel.create({
      title,
      description,
      userId: user._id,
      cyclingId,
      status: 0,
    });

    res.json({ message: "Thành công" });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ error: "Failed to create report" });
  }
};

const getALlReport = async (req, res) => {
  try {
    const reports = await ReportModel.find()
      .sort({ createdAt: -1 })
      .populate("cyclingId")
      .populate("userId");

    res.json(reports);
  } catch (error) {
    console.error("Error getting all reports:", error);
    res.status(500).json({ error: "Failed to get all reports" });
  }
};

const changeStatusReport = async (req, res) => {
  try {
    const { reportId, status } = req.body;
    await ReportModel.findByIdAndUpdate(reportId, {
      status,
    });
    res.json({ message: "Thành công" });
  } catch (error) {
    console.error("Error changing status report:", error);
    res.status(500).json({ error: "Failed to change status report" });
  }
};

module.exports = { createReport, getALlReport, changeStatusReport };
