const asyncHandler = require("express-async-handler");
const { Chat } = require("../Models/chat.model");
const { User } = require("../Models/user.model");

const accessChat = asyncHandler(async function (req, res) {
  const { userId } = req.body;
  if (!userId) {
    res.status(400);
    throw new Error("Unable to get id");
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    try {
      const chatCreate = await Chat.create(chatData);

      const fullChat = await Chat.findOne({ _id: chatCreate._id }).populate(
        "users",
        "-password"
      );

      res.status(200).send(fullChat);
    } catch (error) {
      res.status(400);
      throw new Error(error);
    }
  }
});

const fetchChats = asyncHandler(async function (req, res) {
  try {
    Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name email pic",
        });
        return res.status(200).send(results);
      });
  } catch (error) {
    res.status(400);
    throw new Error(error);
  }
});

const createGroupChat = asyncHandler(async function (req, res) {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ msg: "please fill all fields" });
  }

  var users = JSON.parse(req.body.users);

  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to create a group chat");
  }
  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
      chatPic:
        req.body.pic !== ""
          ? req.body.pic
          : "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    return res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error);
  }
});

const renameGroup = asyncHandler(async function (req, res) {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { chatName },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(400);
    throw new Error("Chat Not Found!");
  } else {
    return res.json(updatedChat);
  }
});

const addToGroup = asyncHandler(async function (req, res) {
  const { chatId, userId } = req.body;

  const added = await Chat.findByIdAndUpdate(
    chatId,
    { $push: { users: userId } },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (added) {
    return res.json(added);
  } else {
    res.status(400);
    throw new Error("Something went wrong");
  }
});

const removeFromGroup = asyncHandler(async function (req, res) {
  const { chatId, userId } = req.body;

  const remove = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: userId } },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (remove) {
    return res.json(remove);
  } else {
    res.status(400);
    throw new Error("Something went wrong");
  }
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
