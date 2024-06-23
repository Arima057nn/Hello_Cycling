const BookingModel = require("../models/bookingModel");

const getCountBookingOnDay = async (req, res) => {
  try {
    const { date } = req.query;
    console.log("date", date);
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
      yearInt > 2025
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

const getTop5PeakBookingHours = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp tháng và năm hợp lệ." });
    }

    const startDate = new Date(`${year}-${month}-01T00:00:00Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + 1);

    // Thực hiện aggregation
    const peakHours = await BookingModel.aggregate([
      {
        // Lọc bản ghi theo khoảng thời gian của tháng và năm
        $match: {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
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
        $limit: 5,
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

    // Trả về kết quả dưới dạng JSON
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
    if (isNaN(yearInt) || yearInt < 1000 || yearInt > 9999) {
      return res.status(400).json({ message: "Năm không hợp lệ." });
    }

    // Tạo các ngày bắt đầu và kết thúc cho từng tháng trong năm
    const startOfYear = new Date(yearInt, 0, 1); // 01-Jan-yyyy
    const endOfYear = new Date(yearInt + 1, 0, 1); // 01-Jan-next year

    // Truy vấn cơ sở dữ liệu để tính toán số lượng chuyến đi theo tháng
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

    // Chuyển đổi dữ liệu từ MongoDB về định dạng dễ xử lý
    let bookingData = bookings.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Tạo mảng kết quả bao gồm số lượng chuyến đi cho từng tháng trong năm
    let result = [];
    for (let i = 1; i <= 12; i++) {
      result.push({
        date: `${i}/${year}`,
        count: bookingData[i] || 0, // Đặt số lượng là 0 nếu tháng đó không có booking
      });
    }

    // Trả về kết quả dưới dạng JSON
    res.json(result);
  } catch (error) {
    // Xử lý lỗi và trả về phản hồi lỗi
    res.status(500).json({ message: error.message });
  }
};

const getCountBookingInMonthAndYear = async (req, res) => {
  try {
    const { month, year } = req.query;

    // Kiểm tra nếu `month` hoặc `year` không được cung cấp
    if (!month || !year) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp tháng và năm hợp lệ." });
    }

    const monthInt = parseInt(month, 10);
    const yearInt = parseInt(year, 10);

    // Kiểm tra nếu `monthInt` hoặc `yearInt` không hợp lệ
    if (
      isNaN(monthInt) ||
      isNaN(yearInt) ||
      monthInt < 1 ||
      monthInt > 12 ||
      yearInt < 2023 ||
      yearInt > 2025
    ) {
      return res.status(400).json({ error: "Tháng hoặc năm không hợp lệ." });
    }

    // Tạo ngày đầu tiên của tháng (00:00:00 của ngày 1)
    const startOfMonth = new Date(Date.UTC(yearInt, monthInt - 1, 1));

    // Tạo ngày đầu tiên của tháng tiếp theo (00:00:00 của ngày 1 của tháng sau)
    const endOfMonth = new Date(Date.UTC(yearInt, monthInt, 1));

    // Truy vấn cơ sở dữ liệu
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

    // Chuyển đổi dữ liệu từ MongoDB về định dạng dễ xử lý
    let bookingData = bookings.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Tạo mảng kết quả bao gồm tất cả các ngày trong tháng, kể cả những ngày không có booking nào
    let result = [];
    const daysInMonth = new Date(yearInt, monthInt, 0).getDate(); // Số ngày trong tháng

    for (let day = 1; day <= daysInMonth; day++) {
      // Tạo chuỗi ngày với định dạng 'YYYY-MM-DD'
      const date = new Date(Date.UTC(yearInt, monthInt - 1, day))
        .toISOString()
        .split("T")[0];
      result.push({
        date,
        count: bookingData[date] || 0, // Đặt số lượng là 0 nếu ngày đó không có booking
      });
    }

    // Trả về kết quả dưới dạng JSON
    res.json(result);
  } catch (error) {
    // Xử lý lỗi và trả về phản hồi lỗi
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCountBookingOnDay,
  getCountBookingInMonth,
  getPeakBookingHour,
  getTop5PeakBookingHours,
  getCountBookingLast10Days,
  getCountBookingInYear,
  getCountBookingInMonthAndYear,
};
