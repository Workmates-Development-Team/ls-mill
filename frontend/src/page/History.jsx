import { useState, useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import AuthGaurd from "@/gaurd/AuthGaurd";
import { axiosInstance } from "@/utils/axios";
import { Plus } from "lucide-react";
import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { generateRandomString } from "@/utils/helper";

const invoices = [
  {
    invoice: "INV001",
    paymentStatus: "Paid",
    totalAmount: "$250.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV002",
    paymentStatus: "Pending",
    totalAmount: "$150.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV003",
    paymentStatus: "Unpaid",
    totalAmount: "$350.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV004",
    paymentStatus: "Paid",
    totalAmount: "$450.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV005",
    paymentStatus: "Paid",
    totalAmount: "$550.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV006",
    paymentStatus: "Pending",
    totalAmount: "$200.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV007",
    paymentStatus: "Unpaid",
    totalAmount: "$300.00",
    paymentMethod: "Credit Card",
  },
];

const History = () => {
  const [chatHistory, setChatHistory] = useState([]);

  const getChatHistory = async () => {
    try {
      const { data } = await axiosInstance.get("/chat/get-all-chats");
      setChatHistory(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getChatHistory();
  }, []);

  const navigate = useNavigate()

  const handleNew = () => {
    const path = `/chat/${generateRandomString()}`;
    navigate(path, { replace: true });
  }

  return (
    <AuthGaurd>
      <div className="mx-auto max-w-7xl px-2 md:px-0 h-screen pt-16 pb-28 overflow-y-auto relative chat">
        <div className="mt-3 flex items-center gap-4">
          <Button onClick={handleNew} variant="outline">
            <Plus className="w-4 h-4 mr-2" /> New Window
          </Button>
        </div>

        <div className="mt-6">
          <Table>
           
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Chat Id</TableHead>
                <TableHead>Chat Name</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chatHistory?.map((chat) => (
                <TableRow key={chat._id}>
                  <TableCell className="font-medium">
                    {chat?.chatId}
                  </TableCell>
                  <TableCell>{chat?.chat[0]?.text?.slice(0, 20)}...</TableCell>
                  <TableCell className="text-right">
                    <Link to={'/chat/'+chat?.chatId} className={cn(buttonVariants({}))}>Go to Chat</Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            
          </Table>
        </div>
      </div>
    </AuthGaurd>
  );
};

export default History;
