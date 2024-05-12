const admin = require("firebase-admin");
const { USER_ROLE } = require("../constants/user");

const authenTokenUser = async (req, res, next) => {
  const authorizationHeader = req.headers["authorization"];
  const token = authorizationHeader && authorizationHeader.split(" ")[1];

  if (!token) return res.status(401).send("Access denied. No token provided.");

  admin
    .auth()
    .verifyIdToken(token)
    .then((decodedToken) => {
      req.user = decodedToken;
      next();
    });
};

const authenTokenAdmin = (req, res, next) => {
  const authorizationHeader = req.headers["authorization"];
  const token = authorizationHeader && authorizationHeader.split(" ")[1];

  if (!token) return res.status(401).send("Access denied. No token provided.");

  admin
    .auth()
    .verifyIdToken(token)
    .then((decodedToken) => {
      const uid = decodedToken.uid;
      req.user = decodedToken;
      if (decodedToken.role && decodedToken.role === USER_ROLE.ADMIN) next();
      return res.status(403).send("Access denied. No role provided.");
    });
};

module.exports = {
  authenTokenUser,
  authenTokenAdmin,
};
