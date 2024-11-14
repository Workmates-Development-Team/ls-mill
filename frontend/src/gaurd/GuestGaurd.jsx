import { AuthContext } from "@/context/AuthContext";
import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const GuestGaurd = ({children }) => {
  const { loading, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  return <>{children}</>;
};

export default GuestGaurd;
