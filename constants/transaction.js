const TRANSACTION_TYPE = {
  ADD: 0,
  MINUS: 1,
};

const TRANSACTION_STATUS = {
  PENDING: 0,
  SUCCESS: 1,
  FAILED: 2,
};

const TRANSACTION_ACTION = [
  (OVERDUE_PAY = {
    title: "Thanh toán sử dụng",
    type: TRANSACTION_TYPE.MINUS,
  }),
  (BUY_TICKET = {
    title: "Mua vé",
    type: TRANSACTION_TYPE.MINUS,
  }),
  (DEPOSIT = {
    title: "Nạp tiền",
    type: TRANSACTION_TYPE.ADD,
  }),
  (CANCAL_KEEPING = {
    title: "Hủy giữ xe",
    type: TRANSACTION_TYPE.MINUS,
  }),
];

module.exports = { TRANSACTION_TYPE, TRANSACTION_STATUS, TRANSACTION_ACTION };
