const asyncHandler = require("express-async-handler");
const { User } = require("../Models/user.model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../config/generateToken");

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please enter all Details");
  }

  const userExist = await User.findOne({ email });

  if (userExist) {
    res.status(400);
    throw new Error("User Exist");
  }

  bcrypt.hash(password, 4, async function (err, hash) {
    if (err) {
      res.status(400);
      throw new Error({ msg: err.message });
    }
    const newUser = await User.create({
      name,
      email,
      password: hash,
      pic,
    });

    if (newUser) {
      return res.status(201).json({
        msg: "Successfully Registered",
        newUser,
        token: generateToken(newUser._id),
      });
    } else {
      res.status(400);
      throw new Error("Unable to register");
    }
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const userExist = await User.findOne({ email });

  if (userExist && (await userExist.matchPass(password))) {
    userExist.password = "";
    res.status(201).json({
      msg: "Login Successful",
      userExist,
      token: generateToken(userExist._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid Email or Password");
  }
});

const allUser = asyncHandler(async function (req, res) {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });

  return res.send(users);
});

module.exports = { registerUser, loginUser, allUser };
