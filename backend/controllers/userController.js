const asyncHandler = require("express-async-handler");
const { User } = require("../Models/user.model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../config/generateToken");
const { Chat } = require("../Models/chat.model");
const { Message } = require("../Models/message.model");

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
      throw new Error({ message: err.message });
    }
    const newUser = await User.create({
      name,
      email,
      password: hash,
      pic,
    });

    if (newUser) {
      const adminEmail = "admin@admin.com";
      const findAdmin = await User.find({ email: adminEmail });
      var chatData = {
        chatName: `Admin - ${newUser.name}`,
        isGroupChat: false,
        users: [newUser._id, findAdmin[0]._id],
      };

      try {
        const chatCreate = await Chat.create(chatData);

        var welcomeMsg1 = {
          sender: findAdmin[0]._id,
          content: `Hello ${newUser.name}, this is a welcome message from Team - Commu-Cate. We hope you'll enjoy your experience with us.`,
          chat: chatCreate._id,
        };
        var welcomeMsg2 = {
          sender: findAdmin[0]._id,
          content: `This is an auto generated message you don't need to respond to it.`,
          chat: chatCreate._id,
        };

        await Message.create(welcomeMsg1);
        var messageCreate = await Message.create(welcomeMsg2);
        await Chat.findByIdAndUpdate(chatCreate._id, {
          latestMessage: messageCreate,
        });

        return res.status(201).json({
          message: "Successfully Registered",
          newUser,
          token: generateToken(newUser._id),
        });
      } catch (error) {
        res.status(400);
        throw new Error({
          msg: "Catch block of creating and getting chat while register a new User",
        });
      }
    } else {
      res.status(400);
      throw new Error("Unable to register");
    }
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const userExist = await User.findOne({ email });

  if (!userExist) return res.status(404).json({ message: `User not found` });

  if (userExist && (await userExist.matchPass(password))) {
    userExist.password = "";
    res.status(201).json({
      message: "Login Successful",
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

const deleteAccount = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    // Find the user by their ID
    const user = await User.find({ _id: userId });

    if (!user) {
      return res
        .status(404)
        .json({ message: `User not found with this ID - ${userId}` });
    }

    // Find all chats where the user is a participant and isGroupChat is false

    // const chatsToDelete = await Chat.find({
    //   users: userId,
    //   isGroupChat: false,
    // });

    const chatsToDelete = await Chat.find({
      isGroupChat: false,
      users: { $elemMatch: { $eq: userId } },
    });

    // Loop through the chats and delete associated messages
    for (const chat of chatsToDelete) {
      await Message.deleteMany({ chat: chat._id });
    }

    // Delete the chats
    await Chat.deleteMany({
      _id: { $in: chatsToDelete.map((chat) => chat._id) },
    });

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({
      message: "User and associated chats/messages deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = { registerUser, loginUser, allUser, deleteAccount };
