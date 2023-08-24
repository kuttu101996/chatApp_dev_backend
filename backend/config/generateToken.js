const jwt = require("jsonwebtoken");
require("dotenv").config();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.secret_key, {
    expiresIn: "1d",
  });
};

module.exports = { generateToken };
