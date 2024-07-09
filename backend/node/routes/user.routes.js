import express from "express";
import { getProfile, login, register } from "../controllers/user.controllers.js";
import authenticateToken from "../middlewares/authenticate.js";
const router = express.Router()

router.get('/me', authenticateToken, getProfile)
router.post('/login', login)
router.post('/register', register)

export default router