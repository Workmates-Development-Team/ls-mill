import { Schema, model } from "mongoose";

const chatSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  chatId: {
    type: String,
    required: true,
    unique: true,
  },
  session_number: {
    type: String,
  },
  pdf_text: [
    {
      filename: {
        type: String,
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
    },
  ],
  chat: [
    {
      text: {
        type: String,
        required: true,
      },
      by: {
        type: String,
        enum: ["ai", "user"],
        required: true,
      },
    },
  ],
});

const ChatModel = model("Chat", chatSchema);

export default ChatModel;
