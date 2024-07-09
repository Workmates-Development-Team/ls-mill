import express from "express";
import authenticateToken from "../middlewares/authenticate.js";
import { AddChat, AddSession_number, getAllChat, getChat } from "../controllers/chat.controllers.js";
const router = express.Router()

router.post('/:chatId/message', authenticateToken, AddChat)
router.post('/:chatId/session_number', authenticateToken, AddSession_number)
router.get('/get-all-chats', authenticateToken, getAllChat)
router.get('/:chatId', authenticateToken, getChat)

export default router