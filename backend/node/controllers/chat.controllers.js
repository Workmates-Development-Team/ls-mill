import ChatModel from "../models/chat.model.js";

export const AddChat = async (req, res) => {
  const { chatId } = req.params;
  const { text, by } = req.body;

  if (!text || !by) {
    return res.status(400).json({ error: "Text and by are required" });
  }

  if (!["ai", "user"].includes(by)) {
    return res.status(400).json({ error: "Invalid value for by" });
  }

  try {
    const chat = await ChatModel.findOne({ chatId });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    chat.chat.push({ text, by });
    await chat.save();

    res.status(200).json(chat);
  } catch (error) {
    console.error("Error adding message to chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const AddSession_number = async (req, res) => {
  const { chatId } = req.params;
  const { session_number } = req.body;

  if (!session_number) {
    return res.status(400).json({ error: "session_number is required" });
  }

  try {
    const chat = await ChatModel.findOne({ chatId });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    chat.session_number = session_number;
    await chat.save();

    res.status(200).json(chat);
  } catch (error) {
    console.error("Error adding message to chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllChat = async (req, res) => {
  try {
    const chats = await ChatModel.find({ user: req.user._id }).sort({ createdAt: -1 });

    if (!chats) {
      return res.status(404).json({ error: "Chat not found" });
    }
    res.status(200).json(chats);
  } catch (error) {
    console.error("Error adding message to chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChat = async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await ChatModel.findOne({ chatId });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }
    res.status(200).json(chat);
  } catch (error) {
    console.error("Error adding message to chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
