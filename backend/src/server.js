import express from "express";
import mongoose from "mongoose";

import Task from "./models/Task.js";

const app = express();

// Middleware
app.use(express.json());

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

// Update / PUT
// Route e.g. localhost:3000/tasks/1
// app.put("/tasks/:id", (req, res) => {
//   const { id } = req.params;
//   const { title, completed } = req.body;

//   const task = tasks.find((t) => t.id === parseInt(id));

//   if (task) {
//     task.title = title;
//     task.completed = completed;
//     res.status(200).json({ task: task });
//   } else {
//     res.status(404).json({ message: "Task not found" });
//   }
// });

// Delete / DELETE

app.listen(3000, () => {
  mongoose
    .connect(
      "mongodb://admin:12345@127.0.0.1:27017/taskmanager?authSource=admin",
    )
    .then(() => console.log("Database Connected Successfully"))
    .catch((err) => console.log("Database Connection Failed", err));
  console.log("Server is running on port 3000");
});
