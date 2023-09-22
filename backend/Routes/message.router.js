const express = require("express");
const { authentication } = require("../middleware/authentication");
const {
  sendMessage,
  allMessages,
  sendMessageFromElseWhere,
} = require("../controllers/messageController");

const messageRouter = express.Router();

messageRouter.route("/").post(authentication, sendMessage);
messageRouter.route("/:chatId").get(authentication, allMessages);
messageRouter.route("/:userId").post(sendMessageFromElseWhere);

module.exports = { messageRouter };
