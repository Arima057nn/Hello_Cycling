const { CYCLING_STATUS } = require("../constants/cycling");
const CyclingModel = require("../models/cyclingModel");
const CyclingTypeModel = require("../models/cyclingTypeModel");
const StationCyclingModel = require("../models/stationCyclingModel");

const getAllCycling = async (req, res, next) => {
  try {
    const cyclings = await CyclingModel.find().populate("category");
    res.json(cyclings);
  } catch (error) {
    console.error("Error getting all cycling:", error);

    res.status(500).json({ error: "Failed to get all cycling" });
  }
};

const createCycling = async (req, res, next) => {
  try {
    const cycling = req.body;

    const existingCycling = await CyclingModel.findOne({
      code: cycling.code,
    });
    if (cycling.category === "default")
      return res.status(400).json({ error: "Bạn chưa chọn loại xe" });
    if (existingCycling) {
      return res.status(400).json({ error: "Cycling already exists" });
    }

    const newCycling = await CyclingModel.create({
      name: cycling.name,
      code: cycling.code,
      password: cycling.password,
      status: cycling.status,
      category: cycling.category,
      qrcode: cycling.qrcode,
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
    const cycling = await CyclingModel.findOne({
      code,
      status: CYCLING_STATUS.READY,
    });
    if (!cycling) {
      return res.status(404).json({ error: "Không tìm thấy xe này" });
    }
    res.json(cycling);
  } catch (error) {
    console.error("Error finding cycling:", error);
    res.status(500).json({ error: "Failed to find cycling" });
  }
};

const getCycling = async (req, res, next) => {
  try {
    const { code } = req.query;
    const cycling = await CyclingModel.findOne({ code }).populate("category");
    if (!cycling) {
      return res.status(404).json({ error: "Không tìm thấy xe này" });
    }
    res.json(cycling);
  } catch (error) {
    console.error("Error finding cycling:", error);
    res.status(500).json({ error: "Failed to find cycling" });
  }
};

const sendCoordinate = async (req, res, next) => {
  try {
    const { code, coordinate } = req.body;
    const cycling = await CyclingModel.findOne({ code });
    console.log("cycling", code);
    if (!cycling) {
      return res.status(404).json({ error: "Không tìm thấy xe này" });
    }
    cycling.latitude = coordinate.latitude;
    cycling.longitude = coordinate.longitude;
    if (cycling.status === CYCLING_STATUS.ACTIVE) {
      cycling.coordinate.push(coordinate);
    }
    await cycling.save();
    res.json(cycling);
  } catch (error) {
    console.error("Error sending coordinate:", error);
    res.status(500).json({ error: "Failed to send coordinate" });
  }
};

const updateAllCycling = async (req, res, next) => {
  try {
    const { category } = req.body;
    const cyclings = await CyclingModel.find();
    cyclings.forEach(async (cycling) => {
      cycling.category = category;
      await cycling.save();
    });
    res.json(cyclings);
  } catch (error) {
    console.error("Error updating all cycling:", error);
    res.status(500).json({ error: "Failed to update all cycling" });
  }
};

const updateCoordinate = async (req, res, next) => {
  try {
    const stations = await StationCyclingModel.find().populate("stationId");
    for (const station of stations) {
      // Cập nhật tọa độ của xe
      await CyclingModel.findByIdAndUpdate(
        station.cyclingId,
        {
          latitude: station.stationId.latitude,
          longitude: station.stationId.longitude,
        },
        { new: true }
      );
    }
    res.json({
      message: "Coordinates updated for all cycles",
    });
  } catch (error) {
    console.error("Error adding coordinate:", error);
    res.status(500).json({ error: "Failed to add coordinate" });
  }
};

const updateQrCode = async (req, res, next) => {
  try {
    const cyclings = req.body; // Dữ liệu đầu vào là một mảng các đối tượng { code, qrcode }

    // Dùng Promise.all để thực hiện các cập nhật đồng thời
    const updatePromises = cyclings.map(async (cycling) => {
      const { code, qrcode } = cycling;
      const cyclingDoc = await CyclingModel.findOne({ code });

      if (!cyclingDoc) {
        // Nếu không tìm thấy xe với mã code, trả về thông báo lỗi cho xe đó
        return { code, error: "Không tìm thấy xe này" };
      }

      cyclingDoc.qrcode = qrcode;
      await cyclingDoc.save();
      return cyclingDoc;
    });

    // Đợi tất cả các promise hoàn thành
    const results = await Promise.all(updatePromises);

    // Trả về kết quả của tất cả các cập nhật
    res.json(results);
  } catch (error) {
    console.error("Error updating qrcode:", error);
    res.status(500).json({ error: "Failed to update qrcode" });
  }
};

const startMaintenance = async (req, res, next) => {
  try {
    const { cyclingId } = req.body;
    const cycling = await CyclingModel.findById(cyclingId);
    if (!cycling) {
      return res.status(404).json({ error: "Không tìm thấy xe này" });
    }
    if (cycling.status !== CYCLING_STATUS.READY) {
      if (cycling.status === CYCLING_STATUS.MAINTENANCE) {
        return res.status(400).json({ error: "Xe đang được bảo dưỡng" });
      }
      return res.status(400).json({ error: "Xe đang được sử dụng" });
    }
    cycling.status = CYCLING_STATUS.MAINTENANCE;
    await cycling.save();
    res.json({ message: "Xe đã đưa vào bảo dưỡng" });
  } catch (error) {
    console.error("Error finding cycling:", error);
    res.status(500).json({ error: "Failed to find cycling" });
  }
};

const finishMaintenance = async (req, res, next) => {
  try {
    const { cyclingId } = req.body;
    const cycling = await CyclingModel.findById(cyclingId);
    if (!cycling) {
      return res.status(404).json({ error: "Không tìm thấy xe này" });
    }
    cycling.status = CYCLING_STATUS.READY;
    await cycling.save();
    res.json({ message: "Bảo dưỡng hoàn thành" });
  } catch (error) {
    console.error("Error finding cycling:", error);
    res.status(500).json({ error: "Failed to find cycling" });
  }
};

const disableCycling = async (req, res, next) => {
  try {
    const { cyclingId } = req.body;
    console.log("cyclingId", cyclingId);
    const cycling = await CyclingModel.findById(cyclingId);
    if (!cycling) {
      return res.status(404).json({ error: "Không tìm thấy xe này" });
    }
    if (cycling.status !== CYCLING_STATUS.READY) {
      return res.status(400).json({ error: "Xe đang được sử dụng" });
    }
    cycling.status = CYCLING_STATUS.DISABLE;
    await cycling.save();
    res.json({ message: "Vô hiệu hóa xe thành công" });
  } catch (error) {
    console.error("Error finding cycling:", error);
    res.status(500).json({ error: "Failed to find cycling" });
  }
};

const updateCycling = async (req, res, next) => {
  try {
    const { code, name } = req.body;
    const cycling = await CyclingModel.findOne({ code });
    if (!cycling) {
      return res.status(404).json({ error: "Không tìm thấy xe này" });
    }
    if (cycling.status !== CYCLING_STATUS.READY) {
      return res.status(400).json({ error: "Xe đang được sử dụng" });
    }
    cycling.name = name;
    await cycling.save();
    res.json({ message: "Cập nhật thông tin xe thành công" });
  } catch (error) {
    console.error("Error finding cycling:", error);
    res.status(500).json({ error: "Failed to find cycling" });
  }
};
module.exports = {
  getAllCycling,
  createCycling,
  findCycling,
  getCycling,
  sendCoordinate,
  updateAllCycling,
  updateCoordinate,
  updateQrCode,
  startMaintenance,
  finishMaintenance,
  disableCycling,
  updateCycling,
};
