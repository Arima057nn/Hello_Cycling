const express = require("express");
const app = express();
const port = 3030;
const cors = require("cors");
const db = require("./configs/db");
const bodyParser = require("body-parser");
const userRouter = require("./routers/userRouter");
const stationRouter = require("./routers/stationRouter");
const cyclingRouter = require("./routers/cyclingRouter");

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
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
