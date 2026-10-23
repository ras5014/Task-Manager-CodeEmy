import { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Call the API populate tasks
  useEffect(() => {
    const getTasks = async () => {
      const response = await axios.get("http://localhost:3000/tasks");
      setTasks(response.data.tasks);
    };

    getTasks();
  }, []);

  const createTask = async (title) => {
    const response = await axios.post("http://localhost:3000/tasks", {
      title: title,
    });

    setTasks([...tasks, response.data.task]);
  };

  console.log(tasks);
  return (
    <>
      <h1>Task Manager</h1>
      <p>Manage your tasks efficiently.</p>
      {/* Add Task Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createTask(newTaskTitle);
          setNewTaskTitle("");
        }}
      >
        <input
          type="text"
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

export default App;
