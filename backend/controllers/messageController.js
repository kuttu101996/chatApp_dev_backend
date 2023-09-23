const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
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

const sendMessageFromElseWhere = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const userToSend = await User.findOne({ _id: userId });
  const { name, email, mobile, message } = req.body;
  const userExist = await User.findOne({ email });
  if (!userExist) {
    bcrypt.hash(mobile, 4, async function (err, hash) {
      if (err) {
        res.status(400).send(err.message);
      }
      const newUser = await User.create({
        name,
        email,
        password: hash,
        mobile,
      });

      if (newUser) {
        var chatData = {
          chatName: `${newUser.name} - ${userToSend.name}`,
          isGroupChat: false,
          users: [newUser._id, userId],
        };

        try {
          const chatCreate = await Chat.create(chatData);
          if (chatCreate) {
            var messageData = {
              sender: newUser._id,
              content: message,
              chat: chatCreate._id,
            };

            try {
              const messageCreate = await Message.create(messageData);
              if (messageCreate) {
                await Chat.findByIdAndUpdate(chatCreate._id, {
                  latestMessage: messageCreate._id,
                });
                return res.status(201).json({
                  password:
                    "Your mobile number is your Password you can change it anytime.",
                  message: "Successfully Registered",
                  newUser,
                  chatCreate,
                  messageCreate,
                });
              }
            } catch (error) {
              res.status(400).send({
                msg: "Catch block of creating and getting message while register a new User",
              });
            }
          }
        } catch (error) {
          res.status(400).send({
            msg: "Catch block of creating and getting chat while register a new User",
          });
        }
      } else {
        res.status(400);
        throw new Error("Unable to register");
      }
    });
  } else {
    try {
      var isChat = await Chat.find({
        isGroupChat: false,
        $and: [
          { users: { $elemMatch: { $eq: userExist._id } } },
          { users: { $elemMatch: { $eq: userToSend._id } } },
        ],
      });

      if (isChat.length > 0) {
        var messageContent = {
          sender: userExist._id,
          content: message,
          chat: isChat[0]._id,
        };
        var messageCreate = await Message.create(messageContent);
        await Chat.findByIdAndUpdate(isChat[0]._id, {
          latestMessage: messageCreate,
        });
      } else {
        var chatData = {
          chatName: `${name} - ${userToSend.name}`,
          isGroupChat: false,
          users: [userExist._id, userToSend._id],
        };
        const chatCreate = await Chat.create(chatData);
        var messageContent = {
          sender: userExist._id,
          content: message,
          chat: chatCreate._id,
        };

        var messageCreate = await Message.create(messageContent);
        await Chat.findByIdAndUpdate(chatCreate._id, {
          latestMessage: messageCreate,
        });
      }
      return res.status(201).json({
        message: "Message successfully send.",
      });
    } catch (error) {
      res.status(400);
      throw new Error({
        msg: "Catch block of creating and getting chat while register a new User",
      });
    }
  }
});

module.exports = { sendMessage, allMessages, sendMessageFromElseWhere };
