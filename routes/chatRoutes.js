const express = require("express");
const router = express.Router();
const { handleChatMessage } = require("../controllers/chat.Controller.js");

router.post("/chat", handleChatMessage);

module.exports = router;
