import { axiosInstance } from "@/utils/axios";
import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance("/user/me");
      console.log(data);
      setUser(data)
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };
  

  const handleLogout = () => {
    window.localStorage.removeItem('token')
    setUser(null)
  }

  useEffect(() => {
    getProfile();
  }, []);
  return (
    <AuthContext.Provider value={{ user, setUser, loading, getProfile, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}
