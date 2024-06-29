const BookingModel = require("../models/bookingModel");
const TransactionModel = require("../models/transactionModel");
const UserModel = require("../models/userModel");

const getCountBookingOnDay = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp ngày hợp lệ." });
    }

    const startOfDay = new Date(date);
    if (isNaN(startOfDay)) {
      return res.status(400).json({ message: "Ngày không hợp lệ." });
    }

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);

    const count = await BookingModel.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCountBookingInMonth = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp tháng và năm hợp lệ." });
    }

    const monthInt = parseInt(month, 10);
    const yearInt = parseInt(year, 10);
    if (
      isNaN(monthInt) ||
      isNaN(yearInt) ||
      monthInt < 1 ||
      monthInt > 12 ||
      yearInt < 2023 ||
      yearInt > new Date().getFullYear()
    ) {
      return res.status(400).json({ message: "Tháng hoặc năm không hợp lệ." });
    }

    const startOfMonth = new Date(yearInt, monthInt - 1, 1);
    const endOfMonth = new Date(yearInt, monthInt, 1);

    const count = await BookingModel.countDocuments({
      createdAt: {
        $gte: startOfMonth,
        $lt: endOfMonth,
      },
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPeakBookingHour = async (req, res) => {
  try {
    // Sử dụng aggregation framework để nhóm các bản ghi theo giờ trong ngày
    const peakHour = await BookingModel.aggregate([
      {
        // Thêm trường "hour" để nhóm theo giờ trong ngày
        $addFields: {
          hour: { $hour: "$createdAt" },
        },
      },
      {
        // Nhóm theo trường "hour" và đếm số lượng bản ghi trong mỗi nhóm
        $group: {
          _id: "$hour",
          count: { $sum: 1 },
        },
      },
      {
        // Sắp xếp các nhóm theo số lượng đặt chỗ (count) giảm dần
        $sort: { count: -1 },
      },
      {
        // Giới hạn kết quả để lấy nhóm có số lượng đặt chỗ cao nhất
        $limit: 1,
      },
    ]);

    // Nếu không có kết quả nào, trả về thông báo thích hợp
    if (peakHour.length === 0) {
      return res.json({ message: "Không có dữ liệu đặt xe." });
    }

    // Trả về kết quả giờ đặt xe nhiều nhất
    res.json({ peakHour: peakHour[0]._id, count: peakHour[0].count });
  } catch (error) {
    // Xử lý lỗi và trả về phản hồi lỗi
    res.status(500).json({ message: error.message });
  }
};

const getTop5PeakBookingMonthYear = async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp năm và tháng hợp lệ." });
    }

    const yearInt = parseInt(year, 10);
    const monthInt = parseInt(month, 10);

    if (
      isNaN(yearInt) ||
      yearInt < 2023 ||
      yearInt > new Date().getFullYear() ||
      isNaN(monthInt) ||
      monthInt < 1 ||
      monthInt > 12
    ) {
      return res.status(400).json({ message: "Năm hoặc tháng không hợp lệ." });
    }

    const startOfMonth = new Date(yearInt, monthInt - 1, 1);
    const endOfMonth = new Date(yearInt, monthInt, 1);

    // Thực hiện aggregation
    const peakHours = await BookingModel.aggregate([
      {
        // Lọc bản ghi theo khoảng thời gian của tháng và năm
        $match: {
          createdAt: {
            $gte: startOfMonth,
            $lt: endOfMonth,
          },
        },
      },
      {
        // Thêm trường "hour" để nhóm theo giờ trong ngày
        $addFields: {
          hour: { $hour: "$createdAt" },
        },
      },
      {
        // Nhóm theo trường "hour" và đếm số lượng bản ghi trong mỗi nhóm
        $group: {
          _id: "$hour",
          count: { $sum: 1 },
        },
      },
      {
        // Sắp xếp các nhóm theo số lượng đặt chỗ (count) giảm dần
        $sort: { count: -1 },
      },
      {
        // Giới hạn kết quả để lấy 5 khung giờ có số lượng đặt chỗ cao nhất
        $limit: 10,
      },
    ]);

    // Trả về kết quả 5 khung giờ đặt xe nhiều nhất
    res.json(peakHours);
  } catch (error) {
    // Xử lý lỗi và trả về phản hồi lỗi
    res.status(500).json({ message: error.message });
  }
};

const getTop5PeakBookingYear = async (req, res) => {
  try {
    const { year } = req.query;

    // Kiểm tra tham số năm
    if (!year) {
      return res.status(400).json({ message: "Vui lòng cung cấp năm hợp lệ." });
    }

    const yearInt = parseInt(year, 10);
    if (
      isNaN(yearInt) ||
      yearInt < 2023 ||
      yearInt > new Date().getFullYear()
    ) {
      return res.status(400).json({ message: "Năm không hợp lệ." });
    }
    const startOfYear = new Date(yearInt, 0, 1);
    const endOfYear = new Date(yearInt + 1, 0, 1);
    const peakHours = await BookingModel.aggregate([
      {
        // Lọc bản ghi theo khoảng thời gian của tháng và năm
        $match: {
          createdAt: {
            $gte: startOfYear,
            $lt: endOfYear,
          },
        },
      },
      {
        // Thêm trường "hour" để nhóm theo giờ trong ngày
        $addFields: {
          hour: { $hour: "$createdAt" },
        },
      },
      {
        // Nhóm theo trường "hour" và đếm số lượng bản ghi trong mỗi nhóm
        $group: {
          _id: "$hour",
          count: { $sum: 1 },
        },
      },
      {
        // Sắp xếp các nhóm theo số lượng đặt chỗ (count) giảm dần
        $sort: { count: -1 },
      },
      {
        // Giới hạn kết quả để lấy 5 khung giờ có số lượng đặt chỗ cao nhất
        $limit: 10,
      },
    ]);

    // Trả về kết quả 5 khung giờ đặt xe nhiều nhất
    res.json(peakHours);
  } catch (error) {
    // Xử lý lỗi và trả về phản hồi lỗi
    res.status(500).json({ message: error.message });
  }
};

const getCountBookingLast10Days = async (req, res) => {
  try {
    // Lấy ngày hiện tại
    const { day } = req.query;
    const today = new Date();
    // Lấy ngày cách đây 10 ngày
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(today.getDate() - day + 1); // Chỉ lấy 10 ngày, bao gồm cả ngày hiện tại

    // Tạo mảng chứa tất cả các ngày trong khoảng thời gian 10 ngày qua
    let dates = [];
    for (let i = 0; i < day; i++) {
      let date = new Date(tenDaysAgo);
      date.setDate(tenDaysAgo.getDate() + i);
      dates.push(date.toISOString().split("T")[0]); // Lấy phần ngày ở định dạng 'YYYY-MM-DD'
    }

    // Truy vấn cơ sở dữ liệu
    const bookings = await BookingModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(dates[0]), // Ngày đầu tiên của khoảng thời gian
            $lt: new Date(today.setDate(today.getDate() + 1)), // Ngày sau ngày cuối cùng của khoảng thời gian
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 }, // Sắp xếp theo ngày tăng dần
      },
    ]);

    // Chuyển đổi dữ liệu từ MongoDB về định dạng dễ xử lý
    let bookingData = bookings.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Tạo mảng kết quả bao gồm tất cả các ngày, kể cả những ngày không có booking nào
    let result = dates.map((date) => ({
      date,
      count: bookingData[date] || 0, // Đặt số lượng là 0 nếu ngày đó không có booking
    }));

    res.json(result);
  } catch (error) {
    // Xử lý lỗi và trả về phản hồi lỗi
    res.status(500).json({ message: error.message });
  }
};

const getCountBookingInYear = async (req, res) => {
  try {
    const { year } = req.query;

    // Kiểm tra tham số năm
    if (!year) {
      return res.status(400).json({ message: "Vui lòng cung cấp năm hợp lệ." });
    }

    const yearInt = parseInt(year, 10);
    if (
      isNaN(yearInt) ||
      yearInt < 2023 ||
      yearInt > new Date().getFullYear()
    ) {
      return res.status(400).json({ message: "Năm không hợp lệ." });
    }

    const startOfYear = new Date(yearInt, 0, 1); // 01-Jan-yyyy
    const endOfYear = new Date(yearInt + 1, 0, 1); // 01-Jan-next year

    const bookings = await BookingModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfYear,
            $lt: endOfYear,
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 }, // Sắp xếp theo tháng tăng dần
      },
    ]);

    let bookingData = bookings.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    let result = [];
    for (let i = 1; i <= 12; i++) {
      result.push({
        data: i,
        count: bookingData[i] || 0, // Đặt số lượng là 0 nếu tháng đó không có booking
      });
    }

    res.json({ year: yearInt, bookings: result });
  } catch (error) {
    // Xử lý lỗi và trả về phản hồi lỗi
    res.status(500).json({ message: error.message });
  }
};

const getCountBookingInMonthAndYear = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp tháng và năm hợp lệ." });
    }

    const monthInt = parseInt(month, 10);
    const yearInt = parseInt(year, 10);

    if (
      isNaN(monthInt) ||
      isNaN(yearInt) ||
      monthInt < 1 ||
      monthInt > 12 ||
      yearInt < 2023 ||
      yearInt > new Date().getFullYear()
    ) {
      return res.status(400).json({ error: "Tháng hoặc năm không hợp lệ." });
    }
    const startOfMonth = new Date(Date.UTC(yearInt, monthInt - 1, 1));
    const endOfMonth = new Date(Date.UTC(yearInt, monthInt, 1));
    const bookings = await BookingModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth, // Ngày đầu tiên của tháng
            $lt: endOfMonth, // Ngày đầu tiên của tháng sau
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 }, // Sắp xếp theo ngày tăng dần
      },
    ]);

    let bookingData = bookings.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    let result = [];
    const daysInMonth = new Date(yearInt, monthInt, 0).getDate(); // Số ngày trong tháng

    for (let day = 1; day <= daysInMonth; day++) {
      // Tạo chuỗi ngày với định dạng 'YYYY-MM-DD'
      const date = new Date(Date.UTC(yearInt, monthInt - 1, day))
        .toISOString()
        .split("T")[0];
      result.push({
        data: day,
        count: bookingData[date] || 0, // Đặt số lượng là 0 nếu ngày đó không có booking
      });
    }

    res.json({ year: yearInt, month: monthInt, bookings: result });
  } catch (error) {
    // Xử lý lỗi và trả về phản hồi lỗi
    res.status(500).json({ message: error.message });
  }
};

// ! //////////////////////////////

const getRevenueInYear = async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ message: "Vui lòng cung cấp năm hợp lệ." });
    }

    const yearInt = parseInt(year, 10);
    if (
      isNaN(yearInt) ||
      yearInt < 2023 ||
      yearInt > new Date().getFullYear()
    ) {
      return res.status(400).json({ message: "Năm không hợp lệ." });
    }

    const startOfYear = new Date(yearInt, 0, 1);
    const endOfYear = new Date(yearInt + 1, 0, 1);
    const revenue = await TransactionModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfYear, // Ngày đầu tiên của năm
            $lt: endOfYear, // Ngày đầu tiên của năm sau
          },
          type: 1, // Chỉ tính các giao dịch với type = 1 (nếu `type` là một trường có trong mô hình của bạn)
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } }, // Nhóm theo tháng của trường createdAt
          totalRevenue: { $sum: "$payment" }, // Tính tổng số tiền trong mỗi nhóm
        },
      },
      {
        $sort: { "_id.month": 1 }, // Sắp xếp kết quả theo tháng
      },
    ]);

    // Tạo danh sách mặc định với doanh thu bằng 0 cho mỗi tháng
    const allMonths = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      totalRevenue: 0,
    }));

    // Kết hợp doanh thu từ cơ sở dữ liệu với danh sách tất cả các tháng
    const monthlyRevenue = allMonths.map((month) => {
      const foundMonth = revenue.find((r) => r._id.month === month.month);
      return foundMonth
        ? {
            data: foundMonth._id.month,
            count: foundMonth.totalRevenue,
          }
        : { data: month.month, count: 0 };
    });

    res.json({ year: yearInt, monthlyRevenue });
  } catch (error) {
    // Xử lý lỗi và trả về phản hồi lỗi
    res.status(500).json({ message: error.message });
  }
};

const getRevenueInMonthAndYear = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp tháng và năm hợp lệ." });
    }

    const monthInt = parseInt(month, 10);
    const yearInt = parseInt(year, 10);

    if (
      isNaN(monthInt) ||
      isNaN(yearInt) ||
      monthInt < 1 ||
      monthInt > 12 ||
      yearInt < 2023 || // Đảmnew Date().getFullYear() năm trong khoảng hợp lý
      yearInt > new Date().getFullYear()
    ) {
      return res.status(400).json({ error: "Tháng hoặc năm không hợp lệ." });
    }

    const startOfMonth = new Date(yearInt, monthInt - 1, 1);

    const endOfMonth = new Date(yearInt, monthInt, 1);

    // Truy vấn cơ sở dữ liệu để tính tổng doanh thu theo ngày
    const revenue = await TransactionModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth, // Ngày đầu tiên của tháng
            $lt: endOfMonth, // Ngày đầu tiên của tháng sau
          },
          type: 1, // Chỉ tính các giao dịch với type = 1 (nạp tiền vào)
        },
      },
      {
        $group: {
          _id: { day: { $dayOfMonth: "$createdAt" } }, // Nhóm theo ngày
          totalRevenue: { $sum: "$payment" }, // Tính tổng số tiền
        },
      },
      {
        $sort: { "_id.day": 1 }, // Sắp xếp kết quả theo ngày
      },
    ]);

    // Tạo một mảng chứa tất cả các ngày trong tháng
    const daysInMonth = new Date(yearInt, monthInt, 0).getDate(); // Số ngày trong tháng
    const allDays = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      totalRevenue: 0,
    }));

    // Kết hợp doanh thu từ cơ sở dữ liệu với danh sách tất cả các ngày
    const dailyRevenue = allDays.map((day) => {
      const foundDay = revenue.find((r) => r._id.day === day.day);
      return foundDay
        ? {
            data: foundDay._id.day,
            count: foundDay.totalRevenue,
          }
        : { data: day.day, count: 0 };
    });

    res.json({ year: yearInt, month: monthInt, dailyRevenue });
  } catch (error) {
    // Xử lý lỗi và trả về phản hồi lỗi
    res.status(500).json({ message: error.message });
  }
};

// ! //////////////////////////////

const getNewUsersInYear = async (req, res) => {
  try {
    const { year } = req.query;
    if (!year) {
      return res.status(400).json({ message: "Vui lòng cung cấp năm hợp lệ." });
    }
    const yearInt = parseInt(year, 10);
    if (
      isNaN(yearInt) ||
      yearInt < 2023 ||
      yearInt > new Date().getFullYear()
    ) {
      return res.status(400).json({ message: "Năm không hợp lệ." });
    }

    const startOfYear = new Date(yearInt, 0, 1);

    const endOfYear = new Date(yearInt + 1, 0, 1);

    // Truy vấn cơ sở dữ liệu để tính số lượng người dùng đăng ký mới trong năm
    const newUsersCount = await UserModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfYear, // Ngày đầu tiên của năm
            $lt: endOfYear, // Ngày đầu tiên của năm sau
          },
        },
      },
      {
        $group: {
          _id: null, // Không cần nhóm theo bất kỳ field nào
          totalNewUsers: { $sum: 1 }, // Đếm tổng số người dùng mới
        },
      },
    ]);

    // Nếu `newUsersCount` là undefined hoặc không có phần tử nào, đặt `totalNewUsers` là 0
    const totalNewUsers = newUsersCount?.[0]?.totalNewUsers || 0;

    // Trả về kết quả
    res.json({ year: yearInt, totalNewUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNewUserInMonthAndYear = async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp năm và tháng hợp lệ." });
    }

    const yearInt = parseInt(year, 10);
    const monthInt = parseInt(month, 10);

    if (
      isNaN(yearInt) ||
      yearInt < 2023 ||
      yearInt > new Date().getFullYear() ||
      isNaN(monthInt) ||
      monthInt < 1 ||
      monthInt > 12
    ) {
      return res.status(400).json({ message: "Năm hoặc tháng không hợp lệ." });
    }

    const startOfMonth = new Date(yearInt, monthInt - 1, 1);
    const endOfMonth = new Date(yearInt, monthInt, 1);

    // Truy vấn cơ sở dữ liệu để tính số lượng người dùng đăng ký mới trong tháng và năm
    const newUsersCount = await UserModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth, // Ngày đầu tiên của tháng
            $lt: endOfMonth, // Ngày đầu tiên của tháng sau
          },
        },
      },
      {
        $group: {
          _id: null, // Không cần nhóm theo bất kỳ field nào
          totalNewUsers: { $sum: 1 }, // Đếm tổng số người dùng mới
        },
      },
    ]);

    // Nếu `newUsersCount` là undefined hoặc không có phần tử nào, đặt `totalNewUsers` là 0
    const totalNewUsers = newUsersCount?.[0]?.totalNewUsers || 0;

    // Trả về kết quả
    res.json({ year: yearInt, month: monthInt, totalNewUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ! //////////////////////////////

const getTopStationsInYear = async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ message: "Vui lòng cung cấp năm hợp lệ." });
    }

    const yearInt = parseInt(year, 10);
    if (
      isNaN(yearInt) ||
      yearInt < 2023 ||
      yearInt > new Date().getFullYear()
    ) {
      return res.status(400).json({ message: "Năm không hợp lệ." });
    }

    const startOfYear = new Date(yearInt, 0, 1);
    const endOfYear = new Date(yearInt + 1, 0, 1);

    // Sử dụng aggregation framework để nhóm các bản ghi theo trạm xe (startStation)
    const topStations = await BookingModel.aggregate([
      {
        // Lọc các bản ghi theo khoảng thời gian của năm cụ thể
        $match: {
          createdAt: {
            $gte: startOfYear,
            $lt: endOfYear,
          },
        },
      },
      {
        // Nhóm theo trường "startStation" và đếm số lượng bản ghi trong mỗi nhóm
        $group: {
          _id: "$startStation",
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
        // Giới hạn chỉ lấy các trường code, _id, và name từ bảng Stations
        $project: {
          _id: 1,
          count: 1,
          "station.code": 1,
          "station.name": 1,
        },
      },
      {
        // Sắp xếp các nhóm theo số lượng đặt chỗ (count) giảm dần
        $sort: { count: -1 },
      },
      {
        // Giới hạn kết quả để lấy 10 nhóm có số lượng đặt chỗ cao nhất
        $limit: 10,
      },
    ]);

    // Nếu không có kết quả nào, trả về thông báo thích hợp
    if (topStations.length === 0) {
      return res.json([]);
    }

    // Trả về kết quả 10 trạm xe có số lượng đặt xe nhiều nhất
    res.json(topStations);
  } catch (error) {
    // Xử lý lỗi và trả về phản hồi lỗi
    res.status(500).json({ message: error.message });
  }
};

const getTopStationsInMonthYear = async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp năm và tháng hợp lệ." });
    }

    const yearInt = parseInt(year, 10);
    const monthInt = parseInt(month, 10);

    if (
      isNaN(yearInt) ||
      yearInt < 2023 ||
      yearInt > new Date().getFullYear() ||
      isNaN(monthInt) ||
      monthInt < 1 ||
      monthInt > 12
    ) {
      return res.status(400).json({ message: "Năm hoặc tháng không hợp lệ." });
    }

    const startOfMonth = new Date(yearInt, monthInt - 1, 1);
    const endOfMonth = new Date(yearInt, monthInt, 1);

    // Sử dụng aggregation framework để nhóm các bản ghi theo trạm xe (startStation)
    const topStations = await BookingModel.aggregate([
      {
        // Lọc các bản ghi theo khoảng thời gian của năm cụ thể
        $match: {
          createdAt: {
            $gte: startOfMonth,
            $lt: endOfMonth,
          },
        },
      },
      {
        // Nhóm theo trường "startStation" và đếm số lượng bản ghi trong mỗi nhóm
        $group: {
          _id: "$startStation",
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
        // Giới hạn chỉ lấy các trường code, _id, và name từ bảng Stations
        $project: {
          _id: 1,
          count: 1,
          "station.code": 1,
          "station.name": 1,
        },
      },
      {
        // Sắp xếp các nhóm theo số lượng đặt chỗ (count) giảm dần
        $sort: { count: -1 },
      },
      {
        // Giới hạn kết quả để lấy 10 nhóm có số lượng đặt chỗ cao nhất
        $limit: 10,
      },
    ]);

    // Nếu không có kết quả nào, trả về thông báo thích hợp
    if (topStations.length === 0) {
      return res.json([]);
    }

    // Trả về kết quả 10 trạm xe có số lượng đặt xe nhiều nhất
    res.json(topStations);
  } catch (error) {
    // Xử lý lỗi và trả về phản hồi lỗi
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCountBookingOnDay,
  getCountBookingInMonth,
  getPeakBookingHour,
  getTop5PeakBookingMonthYear,
  getTop5PeakBookingYear,
  getCountBookingLast10Days,
  getCountBookingInYear,
  getCountBookingInMonthAndYear,
  getRevenueInYear,
  getRevenueInMonthAndYear,
  getNewUsersInYear,
  getNewUserInMonthAndYear,
  getTopStationsInYear,
  getTopStationsInMonthYear,
};
