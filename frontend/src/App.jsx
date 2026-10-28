import Login from "./pages/Login";
import Register from "./pages/Register";
import Task from "./pages/Task";

import { createBrowserRouter, redirect } from "react-router";
import { RouterProvider } from "react-router/dom";
import api from "./api";

async function requireLogin() {
  if (!localStorage.getItem("token")) {
    return redirect("/login");
  }

  try {
    await api.get("/me");
    return null;
  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      return redirect("/login");
    }
    throw error;
  }
}

const router = createBrowserRouter([
  {
    path: "/",
    loader: requireLogin,
    hydrateFallbackElement: <p>Loading...</p>,
    element: <Task />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/login",
    element: <Login />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
