import { useState } from "react";
import { Link, useNavigate } from "react-router";
import api from "../api";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const response = await api.post("/login", { email, password });
    localStorage.setItem("token", response.data.token);
    navigate("/");
  }

  return (
    <div>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <input
          aria-label="Email"
          type="email"
          autoComplete="email"
          required
          placeholder="Enter your email"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />
        <br />
        <input
          aria-label="Password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Enter your password"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
        />
        <br />
        <button type="submit">Login</button>
      </form>
      <p>New here? <Link to="/register">Register</Link></p>
    </div>
  );
}

export default Login;
