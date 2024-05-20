function overduePriceToPay(overdue, overduePrice, duration) {
  // Tính phần nguyên của phép chia overdue / duration và cộng thêm 1
  let wholePart = Math.floor(overdue / duration) + 1;

  let totalToPay = wholePart * overduePrice;

  return totalToPay;
}

module.exports = { overduePriceToPay };
