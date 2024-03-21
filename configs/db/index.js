const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB running ...");
  } catch (error) {
    console.log(error);
    console.log("Connect failure");
  }
};
module.exports = { connectDB };
