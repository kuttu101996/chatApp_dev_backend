const jwt = require("jsonwebtoken");
require("dotenv").config();

const asyncHandler = require("express-async-handler");
const { User } = require("../Models/user.model");

const authentication = asyncHandler(async function (req, res, next) {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.secret_key);

      req.user = await User.findById(decoded.id).select("-password"); // get details without the password
      next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

module.exports = { authentication };
