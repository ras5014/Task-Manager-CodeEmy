import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import api from "../api";

function Task() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  useEffect(() => {
    const getTasks = async () => {
      const response = await api.get("/tasks");
      setTasks(response.data.tasks);
    };

    getTasks();
  }, []);

  async function createTask(e) {
    e.preventDefault();
    const response = await api.post("/tasks", { title: newTaskTitle });
    setTasks((tasks) => [...tasks, response.data.task]);
    setNewTaskTitle("");
  }

  return (
    <>
      <h1>Task Manager</h1>
      <button onClick={() => {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
      }}>Logout</button>
      <p>Manage your tasks efficiently.</p>
      {/* Add Task Form */}
      <form onSubmit={createTask}>
        <input
          aria-label="Task title"
          type="text"
          required
          placeholder="Add a task"
          onChange={(e) => setNewTaskTitle(e.target.value)}
          value={newTaskTitle}
        />
        <button type="submit">Add Task</button>
      </form>
      {/* Task List */}
      <ul>
        {tasks.map((task, index) => (
          <li key={index}>{task.title}</li>
        ))}
      </ul>
    </>
  );
}

export default Task;
