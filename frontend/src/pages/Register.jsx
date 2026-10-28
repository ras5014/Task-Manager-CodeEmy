import { useState } from "react";
import { Link, useNavigate } from "react-router";
import api from "../api";

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    await api.post("/register", { name, email, password });
    navigate("/login");
  }

  return (
    <div>
      <h1>Register</h1>

      <form onSubmit={handleSubmit}>
        <input
          aria-label="Name"
          type="text"
          autoComplete="name"
          required
          placeholder="Enter your name"
          onChange={(e) => setName(e.target.value)}
          value={name}
        />
        <br />
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
          autoComplete="new-password"
          required
          placeholder="Enter your password"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
        />
        <br />
        <button type="submit">Register</button>
      </form>
      <p>Already registered? <Link to="/login">Login</Link></p>
    </div>
  );
}

export default Register;
