const express = require("express");
const { authentication } = require("../middleware/authentication");
const { sendMessage, allMessages } = require("../controllers/messageController");

const messageRouter = express.Router();


messageRouter.route('/').post(authentication, sendMessage)
messageRouter.route('/:chatId').get(authentication, allMessages)


module.exports = {messageRouter}