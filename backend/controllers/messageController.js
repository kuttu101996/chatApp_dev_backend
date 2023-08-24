const asyncHandler = require("express-async-handler");
const { Message } = require("../Models/message.model");
const { User } = require("../Models/user.model");
const { Chat } = require("../Models/chat.model");

const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    console.log("Invalid Data passed");
    return res.status(400);
  }

  var newMessage = {
    sender: req.user.id,
    content: content,
    chat: chatId,
  };
  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, {
      latestMessage: message,
    });

    return res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error);
  }
});

const allMessages = asyncHandler(async (req, res) => {
  try {
    const message = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");

    return res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error);
  }
});

module.exports = { sendMessage, allMessages };
