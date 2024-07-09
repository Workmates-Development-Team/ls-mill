import UserModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const getProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id).select("-password");
    if (!user) return res.status(404).send("User not found");

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
    console.log(err);
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if(!email ||!password) return res.status(400).json({message: 'Email and Password is required'})

  try {
    const user = await UserModel.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRECT, {
      expiresIn: "7d",
    });

    res.json({ message: "Logged in successfully", token });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
    console.log(err);
  }
};

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new UserModel({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRECT, {
      expiresIn: "7d",
    });

    res.status(201).json({ message: "User registered successfully", token });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
    console.log(err);
  }
};
