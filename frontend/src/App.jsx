// src/App.js
import { Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Home from "./page/Home";
import { generateRandomString } from "./utils/helper";
import Login from "./page/Login";
import Register from "./page/Register";
import History from "./page/History";

function RedirectToChat() {
  const navigate = useNavigate();

  useEffect(() => {
    const path = `/chat/${generateRandomString()}`;
    navigate(path, { replace: true });
  }, [navigate]);

  return null;
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<RedirectToChat />} />
        <Route path="/chat/:id" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </>
  );
}

export default App;
