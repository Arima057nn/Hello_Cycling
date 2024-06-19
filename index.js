const express = require("express");
const app = express();
const port = 3030;
const cors = require("cors");
const db = require("./configs/db");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const userRouter = require("./routers/userRouter");
const stationRouter = require("./routers/stationRouter");
const cyclingRouter = require("./routers/cyclingRouter");
const bookingRouter = require("./routers/bookingRouter");
const ticketRouter = require("./routers/ticketRouter");
const promotionRouter = require("./routers/promotionRouter");
const transactionRouter = require("./routers/transactionRouter");
const paymentRouter = require("./routers/paymentRouter");
const reportRouter = require("./routers/reportRouter");
const { USER_ROLE } = require("./constants/user");
const UserModel = require("./models/userModel");
var cron = require("node-cron");

const serviceAccount = require("./serviceAccountKey.json");
const { GetAllKeepBooking } = require("./controllers/bookingController");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

db.connectDB();

app.use(cors());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

require("dotenv").config();

app.get("/", (req, res) => {
  res.send("Hello World!!");
});

app.use("/api/user", userRouter);
app.use("/api/station", stationRouter);
app.use("/api/cycling", cyclingRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/ticket", ticketRouter);
app.use("/api/promotion", promotionRouter);
app.use("/api/transaction", transactionRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/report", reportRouter);

app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await admin.auth().createUser({
      email,
      password,
    });
    const adminFound = await UserModel.findOne({
      uid: user.uid,
      role: USER_ROLE.ADMIN,
    });
    if (adminFound) {
      return res.status(422).json({ message: "Admin already exists" });
    } else {
      const newAdmin = new UserModel({
        name: "ADMIN",
        email: user.email,
        uid: user.uid,
        role: USER_ROLE.ADMIN,
      });
      await newAdmin.save();
      console.log("admin", newAdmin);
      res.status(201).json({ message: "Admin created successfully" }, user);
    }
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/booking/auto", (req, res) => {
  GetAllKeepBooking(req, res);
});
cron.schedule("* * * * *", () => {
  try {
    GetAllKeepBooking();
  } catch (error) {
    console.error("Lỗi khi xử lý auto booking trong cron job:", error);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
