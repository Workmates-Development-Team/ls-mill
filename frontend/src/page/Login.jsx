import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { axiosInstance } from "@/utils/axios";
import { AuthContext } from "@/context/AuthContext";
import GuestGaurd from "@/gaurd/GuestGaurd";
import ReCAPTCHA from "react-google-recaptcha";

const Login = () => {
  const { getProfile } = useContext(AuthContext);
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
    }),
    onSubmit: async (values) => {
      // if (!recaptchaToken) {
      //   alert("Please complete the reCAPTCHA");
      //   return;
      // }

      try {
        const { data } = await axiosInstance.post("/user/login", {
          ...values,
          recaptchaToken,
        });
        console.log(data);
        window.localStorage.setItem("token", data?.token);
        getProfile();
      } catch (error) {
        console.log(error);
        alert(error?.response?.data?.message || "Something Went Wrong");
      }
    },
  });

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  return (
    <GuestGaurd>
      <div className="bg-gray-100 flex flex-col items-center justify-center min-h-screen">
        <div className="bg-[#36246C] pr-4 mb-10">
          <img className="w-[240px]" src="/images/ls-mills-logo.png" alt="" />
        </div>
        <div className="bg-white p-8 rounded-lg shadow-lg w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
          <form onSubmit={formik.handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Email:
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  formik.touched.email && formik.errors.email
                    ? "border-red-500"
                    : ""
                }`}
                {...formik.getFieldProps("email")}
              />
              {formik.touched.email && formik.errors.email ? (
                <p className="text-red-500 text-xs italic">
                  {formik.errors.email}
                </p>
              ) : null}
            </div>
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Password:
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  formik.touched.password && formik.errors.password
                    ? "border-red-500"
                    : ""
                }`}
                {...formik.getFieldProps("password")}
              />
              {formik.touched.password && formik.errors.password ? (
                <p className="text-red-500 text-xs italic">
                  {formik.errors.password}
                </p>
              ) : null}
            </div>
            {/* <div className="mb-4">
              <ReCAPTCHA
                sitekey="6Le_TNApAAAAAC4XftjW9BKlkEGjHC6IDV3C-VmB"
                onChange={handleRecaptchaChange}
              />
            </div> */}
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Login
              </button>
              <Link
                to="/register"
                className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
              >
                Don't have an account? Register
              </Link>
            </div>
          </form>
        </div>
      </div>
    </GuestGaurd>
  );
};

export default Login;
