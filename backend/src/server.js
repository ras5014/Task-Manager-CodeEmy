import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import Task from "./models/Task.js";
import User from "./models/User.js";

const app = express();

const SECRET = "nieff6f566^^*&njksaka";

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);
// Read / GET
app.get("/tasks", async (req, res) => {
  const tasks = await Task.find();
  res.status(200).json({ tasks: tasks });
});

// Create / POST
app.post("/tasks", async (req, res) => {
  const { title, completed } = req.body;

  const newTask = {
    title: title,
    completed: completed || false,
  };

  await Task.create(newTask);

  res.status(201).json({ task: newTask });
});

// Add Update and Delete APIs

// Authentication / User APIs

// Register
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email: email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    name: name,
    email: email,
    password: hashedPassword,
  };

  await User.create(newUser);

  res.status(201).json({ user: newUser });
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  // Find if the User exists with the email
  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Compare the passwords
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid password" });
  }

  // Generate a token or session for the user (optional)
  const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "1h" });

  res.status(200).json({ user: user, token: token });
});

app.listen(3000, () => {
  mongoose
    .connect(
      "mongodb://admin:12345@127.0.0.1:27017/taskmanager?authSource=admin",
    )
    .then(() => console.log("Database Connected Successfully"))
    .catch((err) => console.log("Database Connection Failed", err));
  console.log("Server is running on port 3000");
});
