import express from "express";

const app = express();

// Middleware
app.use(express.json());

let tasks = [
  { id: 1, title: "Task 1", completed: false },
  { id: 2, title: "Task 2", completed: true },
  { id: 3, title: "Task 3", completed: false },
];

// Read / GET
app.get("/tasks", (req, res) => {
  res.status(200).json({ tasks: tasks });
});

// Create / POST
app.post("/tasks", (req, res) => {
  const { id, title, completed } = req.body;
  const newTask = {
    id: id,
    title: title,
    completed: completed || false,
  };

  tasks.push(newTask);
  res.status(201).json({ task: newTask });
});

// Update / PUT
// Route e.g. localhost:3000/tasks/1
app.put("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  const task = tasks.find((t) => t.id === parseInt(id));

  if (task) {
    task.title = title;
    task.completed = completed;
    res.status(200).json({ task: task });
  } else {
    res.status(404).json({ message: "Task not found" });
  }
});

// Delete / DELETE

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
