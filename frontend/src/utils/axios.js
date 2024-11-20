import axios from "axios";

// Create an Axios instance with the base URL
export const axiosInstance = axios.create({
  // baseURL: "http://localhost:5555/api/v1",
  baseURL: "https://lsmillnodebackend.cwmgenai.com/api/v1",
});

// Set up an interceptor to dynamically add the Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = window.localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
