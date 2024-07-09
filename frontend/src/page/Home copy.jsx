import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AuthContext } from "@/context/AuthContext";
import AuthGaurd from "@/gaurd/AuthGaurd";
import { cn } from "@/lib/utils";
import axios from "axios";
import { CircleStop, Plus, SendHorizonal, Speaker, Upload, Volume2 } from "lucide-react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MarkdownRenderer from "@/components/MarkdownReader";
import { axiosInstance } from "@/utils/axios";
import { generateRandomString } from "@/utils/helper";

const Home = () => {
  const { id } = useParams();
  const [session_number, setSession_number] = useState(null);
  const [start_new, setStart_new] = useState(true);
  const [messages, setMessages] = useState([]);
  const [doc_id, setDoc_id] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useContext(AuthContext);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const chatEndRef = useRef(null);

  const handleFileChange = (e) => {
    const filesArray = Array.from(e.target.files);
    setSelectedFiles(filesArray);
  };

  const getChat = async () => {
    try {
      const { data } = await axiosInstance("/chat/" + id);
      console.log(data);
      setSelectedFiles(data?.pdf_text);
      setDoc_id(data?._id);
      setMessages(data?.chat);
      setSession_number(data?.session_number);
      setStart_new(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (id) {
      getChat();
    }
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUpload = async () => {
    try {
      const formData = new FormData();
      formData.append("user_id", user._id);
      formData.append("chat_id", id);
      selectedFiles.forEach((file) => {
        formData.append("pdfs", file);
      });

      const response = await axios.post(
        "http://127.0.0.1:6001/upload_pdfs",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updoadData = await response.data;
      console.log(updoadData);

      setDoc_id(updoadData?._id);

      const { data } = await axios.post("http://127.0.0.1:6001/ask", {
        doc_id: updoadData?._id,
        input_text: "summarize",
        start_new,
        session_number,
      });

      await axiosInstance.post(`/chat/${id}/message`, {
        text: data?.response,
        by: "ai",
      });
      await axiosInstance.post(`/chat/${id}/session_number`, {
        session_number: data?.session_number,
      });
      setMessages((prev) => [
        ...prev,
        {
          text: data?.response,
          by: "ai",
        },
      ]);

      setSession_number(data?.session_number);
      setStart_new(false);
      console.log("Files uploaded successfully:", data);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const handleChat = async () => {
    try {
      setIsLoading(true);
      setPrompt("");
      await axiosInstance.post(`/chat/${id}/message`, {
        text: prompt,
        by: "user",
      });
      setMessages((prev) => [
        ...prev,
        {
          text: prompt,
          by: "user",
        },
      ]);

      const { data } = await axios.post("http://127.0.0.1:6001/ask", {
        doc_id,
        input_text: prompt,
        start_new,
        session_number,
      });

      await axiosInstance.post(`/chat/${id}/message`, {
        text: data?.response,
        by: "ai",
      });

      setMessages((prev) => [
        ...prev,
        {
          text: data?.response,
          by: "ai",
        },
      ]);

      setSession_number(data?.session_number);
      setStart_new(false);
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChat();
    }
  };

  const navigate = useNavigate();

  const handleNew = () => {
    const newId = generateRandomString();
    const path = `/chat/${newId}`;
    setSession_number(null);
    setStart_new(true);
    setMessages([]);
    setDoc_id(null);
    setPrompt("");
    setSelectedFiles([]);
    navigate(path, { replace: true });
  };

  const handleSpeak = () => {
    try {
      
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <AuthGaurd>
      <div className="mx-auto max-w-7xl px-2 md:px-0 h-screen pt-16 pb-28 overflow-y-auto relative chat">
        <div className="mt-3 flex items-center gap-4">
          <Button onClick={handleNew} variant="outline">
            <Plus className="w-4 h-4 mr-2" /> New Window
          </Button>

          <div className="flex flex-col items-center">
            <label
              htmlFor="file-upload"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload PDF
            </label>
            <input
              id="file-upload"
              accept="application/pdf"
              type="file"
              className="hidden"
              multiple
              onChange={handleFileChange}
            />
          </div>

          <div className="flex gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                {file.name || file?.filename}
              </div>
            ))}
          </div>

          <div>
            <Button
              disabled={doc_id || !selectedFiles?.length ? true : false}
              onClick={handleUpload}
            >
              Upload
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {messages?.map((message, i) =>
            message?.by === "ai" ? (
              <div key={i}>
                <div>
                  <img width={40} src="/images/bot.png" alt="" />
                </div>
                <MarkdownRenderer text={message.text} />

                <div className="pl-2 pt-2">
                  <Button
                    className="rounded-full"
                    size="icon"
                    variant="outline"
                  >
                    {/* <CircleStop className="w-4 h-4 text-red-500" /> */}
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-end">
                <div className="text-right px-5 py-2 rounded-lg dark:bg-gray-800 z-20 bg-gray-100 ">
                  <small>You</small>
                  <p>{message?.text}</p>
                </div>
              </div>
            )
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="text-left px-5 py-2 rounded-lg dark:bg-gray-800 z-20 bg-gray-100">
                <div>
                  <img width={40} src="/images/bot.png" alt="" />
                </div>
                <p>Typing...</p>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* <div className="max-w-7xl z-20 px-2 md:p-3 w-full dark:bg-gray-800 bg-gray-100 rounded-xl fixed bottom-0 shadow-sm">
          <div>
            <Textarea
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              value={prompt}
              placeholder="Type your query here..."
              className="resize-none"
            />
          </div>

          <Button
            onClick={handleChat}
            className="absolute top-1/2 transform -translate-y-1/2 right-8"
            size="icon"
          >
            <SendHorizonal className="w-4 h-4" />
          </Button>
        </div> */}
      </div>
    </AuthGaurd>
  );
};

export default Home;
