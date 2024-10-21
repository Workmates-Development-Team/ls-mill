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

import { generateRandomString } from "@/utils/helper";
import { GEMINI_API, PYTHON_API } from "@/constant/path";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const Home = () => {
  const { id } = useParams();
  const [session_number, setSession_number] = useState(null);
  const [start_new, setStart_new] = useState(true);
  const [messages, setMessages] = useState([]);
  const [doc_id, setDoc_id] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeServer, setActiveServer] = useState("server-1");

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

  const getChat = async () => {
    try {
      const { data } = await axiosInstance("/chat/" + id);
      console.log(data);
      setSelectedFiles(data?.pdf_text);
      setDoc_id(data?._id);
      setMessages(data?.chat);
      setSession_number(data?.session_number);
      setStart_new(true);
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
      setLoading(true);
      const formData = new FormData();
      formData.append("user_id", user._id);
      formData.append("chat_id", id);
  
      const isServer1 = activeServer === "server-1";
  
      if (isServer1) {
        formData.append("file", selectedFiles[0]);
      } else {
        selectedFiles.forEach((file) => formData.append("pdfs", file));
      }
  
      const uploadUrl = isServer1 ? GEMINI_API +"/upload" : PYTHON_API + "/upload_pdfs";
      const response = await axios.post(uploadUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      const uploadData = response.data;
      console.log(uploadData);
  
      setDoc_id(uploadData?._id);
  
      if (isServer1) {
        await handleMessageSend(uploadData?.response, uploadData?.session_number);
      } else {
        const { data } = await axios.post(PYTHON_API + "/ask", {
          doc_id: uploadData?._id,
          input_text: getInvoiceExtractionPrompt(),
          start_new,
          session_number,
        });
  
        await handleMessageSend(data?.response, data?.session_number);
      }
  
      setStart_new(true);
      console.log("Files uploaded successfully.");
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMessageSend = async (responseText, sessionNumber) => {
    await axiosInstance.post(`/chat/${id}/message`, {
      text: responseText,
      by: "ai",
    });
    await axiosInstance.post(`/chat/${id}/session_number`, {
      session_number: sessionNumber,
    });
  
    setMessages((prev) => [
      ...prev,
      { text: responseText, by: "ai" },
    ]);
    setSession_number(sessionNumber);
  };
  
  const getInvoiceExtractionPrompt = () => `
    Extract Data: Parse the uploaded invoice PDF and extract data specifically from the following columns:
    PO NO, Date, ItemNo, Type, Variety, Size, Color, Article, UOM, Qty, Rate, Total, Mother PO
    Data Processing: Remove commas in numeric fields like Qty, Rate, Total. Ignore rows like Subtotal, Total, Grand Total.
    Table Formatting: Output all extracted data in a continuous table format without breaks.
    Example:
    PO NO        | Date     | ItemNo | Type   | Variety | Size | Qty | Rate | Total  | Mother PO
    -------------|----------|--------|--------|---------|------|-----|------|--------|---------
    POSG24000197 | 02 JUL 24| 1      | Fitted | Rimini  | White| 80  | 10.57| 845.60 | -
  `;
  
  const navigate = useNavigate();
  const handleNew = () => {
    const newId = generateRandomString();
    const path = `/`;

    setSession_number(null);
    setStart_new(true);
    setMessages([]);
    setDoc_id(null);
    setSelectedFiles([]);
    navigate(path, { replace: true });
  };

  return (
    <AuthGaurd>
      <div className="mx-auto max-w-7xl px-2 md:px-0 h-screen pt-16 pb-28 overflow-y-auto relative chat">
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <Button onClick={handleNew} variant="outline">
            <Plus className="w-4 h-4 mr-2" /> New Window
          </Button>

          <RadioGroup
            onValueChange={(value) => setActiveServer(value)}
            defaultValue={activeServer}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="server-1" id="r2" />
              <Label htmlFor="r2">Server-1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="server-2" id="r3" />
              <Label htmlFor="r3">Server-2</Label>
            </div>
          </RadioGroup>

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
              disabled={messages.length}
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
                doc_id || !selectedFiles?.length || loading || messages?.length
                  ? true
                  : false
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
                <MarkdownRenderer text={message.text} />
                {/* <div>
                  {message.text}
                </div> */}
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
