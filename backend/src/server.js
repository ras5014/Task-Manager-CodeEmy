import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pathToFileURL } from "node:url";

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
function requireLogin(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Please log in first" });
  }

  try {
    req.user = jwt.verify(authorization.slice(7), SECRET);
  } catch {
    return res.status(401).json({ message: "Your session expired. Please log in again." });
  }
  next();
}

app.get("/me", requireLogin, async (req, res) => {
  const user = await User.findById(req.user.id).select("name email");
  if (!user) {
    return res.status(401).json({ message: "Please log in again" });
  }
  res.json({ user });
});

// Read / GET
app.get("/tasks", requireLogin, async (req, res) => {
  const tasks = await Task.find();
  res.status(200).json({ tasks: tasks });
});

// Create / POST
app.post("/tasks", requireLogin, async (req, res) => {
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

  if (typeof name !== "string" || !name.trim() ||
      typeof email !== "string" || !email.trim() ||
      typeof password !== "string" || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }

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

  res.status(201).json({ message: "Registration successful" });
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== "string" || !email.trim() ||
      typeof password !== "string" || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

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

  // Tokens expire after one hour.
  const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "1h" });

  res.status(200).json({
    user: { id: user._id, name: user.name, email: user.email },
    token,
  });
});

export { app };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(3000, () => {
    mongoose
      .connect(
      "mongodb://admin:12345@127.0.0.1:27017/taskmanager?authSource=admin",
      )
      .then(() => console.log("Database Connected Successfully"))
      .catch((err) => console.log("Database Connection Failed", err));
    console.log("Server is running on port 3000");
  });
}
