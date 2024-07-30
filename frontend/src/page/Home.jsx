import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AuthContext } from "@/context/AuthContext";
import AuthGaurd from "@/gaurd/AuthGaurd";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Loader2, Plus, Upload } from "lucide-react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MarkdownRenderer from "@/components/MarkdownReader";
import { axiosInstance } from "@/utils/axios";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import TableSkeleton from "@/components/TableSkeleton";
import { generateRandomString } from "@/utils/helper";
import { PYTHON_API } from "@/constant/path";

const Home = () => {
  const { id } = useParams();
  const [session_number, setSession_number] = useState(null);
  const [start_new, setStart_new] = useState(true);
  const [messages, setMessages] = useState([]);
  const [doc_id, setDoc_id] = useState(null);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState("");

  const { user } = useContext(AuthContext);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const chatEndRef = useRef(null);

  const handleFileChange = (e) => {
    const filesArray = Array.from(e.target.files);
    if (filesArray.length + selectedFiles.length > 3) {
      alert("You can only select up to 3 PDFs at a time in Demo version.");
      return;
    }
    setSelectedFiles((prevFiles) => [...prevFiles, ...filesArray]);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUpload = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("user_id", user._id);
      formData.append("chat_id", id);
      selectedFiles.forEach((file) => {
        formData.append("pdfs", file);
      });

      const response = await axios.post(PYTHON_API + "/upload_pdfs", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const updoadData = await response.data;
      console.log(updoadData);

      setDoc_id(updoadData?._id);

      const { data } = await axios.post(PYTHON_API + "/ask", {
        doc_id: updoadData?._id,
        input_text: `Analyze each uploaded invoice PDF, sequentially numbering their contents. Consolidate the data into a unified table format with columns for Item, Color, Size, Quantity (Qty), Unit of Measurement (UOM), Rate, and Amount.`,
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
      setLoading(false);
    } catch (error) {
      console.error("Error uploading files:", error);
      setLoading(false);
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
    setSelectedFiles([]);

    // Navigate to the new path
    navigate(path, { replace: true });
  };

  
  return (
    <AuthGaurd>
      <div className="mx-auto max-w-7xl px-2 md:px-0 h-screen pt-16 pb-28 overflow-y-auto relative chat">
        <div className="mt-3 flex flex-wrap items-center gap-4">
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

          <div className="flex gap-2 flex-wrap">
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
              disabled={
                doc_id || !selectedFiles?.length || loading ? true : false
              }
              onClick={handleUpload}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing{" "}
                </>
              ) : (
                "Analyze"
              )}
            </Button>
          </div>
        </div>

        <div className="flex justify-center mt-10">
          {loading && <Loader2 className="h-16 w-16 animate-spin" />}
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {messages?.map((message, i) =>
            message?.by === "ai" ? (
              <div key={i}>
                {/* <div>
                    <img width={40} src="/images/bot.png" alt="" />
                  </div> */}
                <MarkdownRenderer text={message.text} />
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

          <div ref={chatEndRef} />
        </div>
      </div>
    </AuthGaurd>
  );
};

export default Home;
