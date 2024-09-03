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
        input_text: `Analyze the uploaded invoice PDF and extract all the data into a unified table format. The table should include the following columns:

PO NO
Date
ItemNo
Type
Variety
Size
Color
Article
UOM
Qty
Rate
Total
Mother PO
Make sure to remove any commas from numeric values. Provide the output in a single, continuous table format without breaking the data, even if the PDF is long. The output should follow this example:


PO NO          | Date       | ItemNo | Type            | Variety        | Size         | Color       | Article | UOM | Qty | Rate  | Total   | Mother PO
-------------- | ---------- | -------| ----------------| ---------------| ------------ | ----------- | ------- | --- | --- | ------| --------| -----------
POSG24000197   | 02 JUL 2024| 1      | Fitted Sheet Set| Affinity Rimini| Single       | Pure White  | Akemi   | SET | 80  | 10.57 | 845.60  | -
POSG24000197   | 02 JUL 2024| 2      | Fitted Sheet Set| Affinity Rimini| Super Single | Pure White  | Akemi   | SET | 96  | 11.08 | 1063.68 |
Ensure the entire table is presented in one piece without splitting across different responses.`,
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
                doc_id || !selectedFiles?.length || loading || messages?.length ? true : false
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
