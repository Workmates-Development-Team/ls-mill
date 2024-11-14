import Navbar from "@/components/Navbar";
import { AuthContext } from "@/context/AuthContext";
import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthGaurd = ({ children }) => {
  const { loading, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

export default AuthGaurd;
