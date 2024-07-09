import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 5555;

import userRoute from "./routes/user.routes.js";
import chatRoute from "./routes/chat.routes.js";
import mongoose from "mongoose";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => res.send("Test"));
app.use("/api/v1/user", userRoute);
app.use("/api/v1/chat", chatRoute);


mongoose.connect('mongodb://localhost:27017/data_quest')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));
app.listen(port, () => console.log(`Server is running on port = ${port}`));
