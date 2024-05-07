var jwt = require("jsonwebtoken");
const { USER_ROLE } = require("../constants/user");
const UserModel = require("../models/userModel");

const authenTokenUser = async (req, res, next) => {
  const authorizationHeader = req.headers["authorization"];
  const token = authorizationHeader && authorizationHeader.split(" ")[1];

  if (!token) return res.status(401).send("Access denied. No token provided.");

  jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, data) => {
    if (err) return res.status(403).send("Invalid token.");

    req.user = data;

    if (req.user.role !== USER_ROLE.USER)
      return res.status(403).send("Unauthorized access. Not User");

    const user = await UserModel.findById(data.userId);

    if (user.token !== token) return res.status(403).send("Invalid token.");
    next();
  });
};

const authenTokenAdmin = (req, res, next) => {
  const authorizationHeader = req.headers["authorization"];
  const token = authorizationHeader && authorizationHeader.split(" ")[1];

  if (!token) return res.status(401).send("Access denied. No token provided.");

  jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, data) => {
    if (err) return res.status(403).send("Invalid token.");

    req.user = data;

    if (req.user.role !== USER_ROLE.ADMIN)
      return res.status(403).send("Unauthorized access. Not User");

    const user = await UserModel.findById(data.userId);

    if (user.token !== token) return res.status(403).send("Invalid token.");
    next();
  });
};

module.exports = {
  authenTokenUser,
  authenTokenAdmin,
};
