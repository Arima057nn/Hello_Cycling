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

const serviceAccount = require("./serviceAccountKey.json");

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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
