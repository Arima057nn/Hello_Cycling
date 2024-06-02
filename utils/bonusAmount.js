const { TRANSACTION_BONUS } = require("../constants/transaction");

function bonusAmount(amount) {
  const bonusInfo = TRANSACTION_BONUS.find(
    (bonus) => amount >= bonus.from && amount < bonus.to
  );
  if (!bonusInfo) {
    return amount;
  }
  const bonus = bonusInfo.bonus;
  const bonusedAmount = amount + (amount * bonus) / 100;
  return bonusedAmount;
}

module.exports = { bonusAmount };
