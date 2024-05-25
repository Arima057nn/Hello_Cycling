const axios = require("axios");
const crypto = require("crypto");
const UserModel = require("../models/userModel");
const TransactionModel = require("../models/transactionModel");
const { TRANSACTION_ACTION } = require("../constants/transaction");

const Momo = async (req, res) => {
  try {
    const { amountOfMoney } = req.body;
    const { user_id } = req.user;
    const user = await UserModel.findOne({ uid: user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    var partnerCode = process.env.MOMO_PARTNER_CODE;
    var accessKey = process.env.MOMO_ACCESS_KEY;
    var secretkey = process.env.MOMO_SECRET_KEY;
    var requestId = partnerCode + new Date().getTime();
    var orderId = requestId;
    var orderInfo = "pay with MoMo";
    var redirectUrl = `${process.env.MOMO_REDIRECT_URL}?orderId=${orderId}`;
    var ipnUrl = `${process.env.MOMO_IPN_URL}/api/payment/callback`;
    var amount = amountOfMoney;
    var requestType = "captureWallet";
    var extraData = ""; //pass empty value if your merchant does not have stores

    //before sign HMAC SHA256 with format
    //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
    var rawSignature =
      "accessKey=" +
      accessKey +
      "&amount=" +
      amount +
      "&extraData=" +
      extraData +
      "&ipnUrl=" +
      ipnUrl +
      "&orderId=" +
      orderId +
      "&orderInfo=" +
      orderInfo +
      "&partnerCode=" +
      partnerCode +
      "&redirectUrl=" +
      redirectUrl +
      "&requestId=" +
      requestId +
      "&requestType=" +
      requestType;
    //puts raw signature
    console.log("--------------------RAW SIGNATURE----------------");
    console.log(rawSignature);
    //signature

    var signature = crypto
      .createHmac("sha256", secretkey)
      .update(rawSignature)
      .digest("hex");
    console.log("--------------------SIGNATURE----------------");
    console.log(signature);

    //json object send to MoMo endpoint
    const requestBody = JSON.stringify({
      partnerCode: partnerCode,
      accessKey: accessKey,
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: redirectUrl,
      ipnUrl: ipnUrl,
      extraData: extraData,
      requestType: requestType,
      signature: signature,
      lang: "en",
    });
    const options = {
      method: "POST",
      url: `${process.env.MOMO_URL}/v2/gateway/api/create`,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody),
      },
      data: requestBody,
    };

    //send request
    let result;
    try {
      result = await axios(options);
      return res.status(200).json(result.data);
    } catch (errror) {
      return res.status(400).json({
        error:
          result.data.error || "Hiện tại đang có lỗi, vui lòng thử lại sau",
      });
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const Callback = async (req, res) => {
  console.log("callback", req.body);
  return res.status(200).json({ message: "success", data: req.body });
};

const TransactionStatus = async (req, res) => {
  try {
    const { orderId } = req.body;
    const { user_id } = req.user;
    const user = await UserModel.findOne({ uid: user_id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&orderId=${orderId}&partnerCode=${process.env.MOMO_PARTNER_CODE}&requestId=${orderId}`;

    const signature = crypto
      .createHmac("sha256", process.env.MOMO_SECRET_KEY)
      .update(rawSignature)
      .digest("hex");

    const requestBody = JSON.stringify({
      partnerCode: process.env.MOMO_PARTNER_CODE,
      requestId: orderId,
      orderId,
      signature,
      lang: "vi",
    });

    const options = {
      method: "POST",
      url: `${process.env.MOMO_URL}/v2/gateway/api/query`,
      headers: {
        "Content-Type": "application/json",
      },
      data: requestBody,
    };
    let result = await axios(options);
    if (result.data.resultCode === 0) {
      const transaction = await TransactionModel.findOne({
        userId: user._id,
        payment: orderId,
      });
      if (!transaction)
        await TransactionModel.create({
          title: TRANSACTION_ACTION[2].title,
          userId: user._id,
          type: TRANSACTION_ACTION[2].type,
          payment: result.data.amount,
          status: 1,
        });
      user.balance += result.data.amount;
      await user.save();
    }
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
module.exports = {
  Momo,
  Callback,
  TransactionStatus,
};
