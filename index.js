const express = require("express");
const app = express();
const port = 3030;
const db = require("./configs/db");

db.connectDB();

require("dotenv").config();

app.get("/", (req, res) => {
  res.send("Hello World!!");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
