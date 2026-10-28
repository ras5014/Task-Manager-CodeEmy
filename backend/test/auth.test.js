import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import jwt from "jsonwebtoken";
import { app } from "../src/server.js";
import User from "../src/models/User.js";
import Task from "../src/models/Task.js";

let server;
let baseURL;
const users = [];
const tasks = [];
const originals = {
  findOne: User.findOne,
  createUser: User.create,
  findById: User.findById,
  findTasks: Task.find,
  createTask: Task.create,
};

before(async () => {
  // Keep the HTTP and password/token logic real; isolate MongoDB for these tests.
  User.findOne = async ({ email }) => users.find((user) => user.email === email);
  User.create = async (user) => {
    const saved = { ...user, _id: String(users.length + 1) };
    users.push(saved);
    return saved;
  };
  User.findById = (id) => ({
    select: async () => {
      const user = users.find((user) => user._id === id);
      return user ? { _id: user._id, name: user.name, email: user.email } : null;
    },
  });
  Task.find = async () => tasks;
  Task.create = async (task) => {
    tasks.push(task);
    return task;
  };
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  baseURL = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  User.findOne = originals.findOne;
  User.create = originals.createUser;
  User.findById = originals.findById;
  Task.find = originals.findTasks;
  Task.create = originals.createTask;
  if (server) await new Promise((resolve) => server.close(resolve));
});

async function request(path, { method = "GET", body, token } = {}) {
  const response = await fetch(`${baseURL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, data: await response.json() };
}

test("register, log in, verify session, and create/read a protected task", async () => {
  const credentials = { email: "learner@example.com", password: "example-password" };
  const registration = await request("/register", {
    method: "POST",
    body: { name: "Learner", ...credentials },
  });
  assert.equal(registration.status, 201);
  assert.equal(registration.data.user, undefined);
  assert.notEqual(users[0].password, credentials.password);

  const login = await request("/login", { method: "POST", body: credentials });
  assert.equal(login.status, 200);
  assert.ok(login.data.token);
  assert.equal(login.data.user.password, undefined);
  const token = login.data.token;

  const session = await request("/me", { token });
  assert.equal(session.status, 200);
  assert.equal(session.data.user.email, credentials.email);
  assert.equal(session.data.user.password, undefined);

  const created = await request("/tasks", {
    method: "POST",
    token,
    body: { title: "Test authentication" },
  });
  assert.equal(created.status, 201);
  const listed = await request("/tasks", { token });
  assert.equal(listed.status, 200);
  assert.ok(listed.data.tasks.some((task) => task.title === "Test authentication"));

  assert.equal((await request("/tasks")).status, 401);
});

test("missing, fake, and forged tokens cannot verify sessions or access tasks", async () => {
  const forged = jwt.sign({ id: "1" }, "test-only-key");
  for (const token of [undefined, "fake-token", forged]) {
    for (const path of ["/me", "/tasks"]) {
      const response = await request(path, { token });
      assert.equal(response.status, 401);
      assert.ok(response.data.message);
    }
    const response = await request("/tasks", {
      method: "POST",
      token,
      body: { title: "Must not be saved" },
    });
    assert.equal(response.status, 401);
  }
  assert.ok(!tasks.some((task) => task.title === "Must not be saved"));
});

test("duplicate registration, wrong passwords, and missing fields show errors", async () => {
  const credentials = { email: "second@example.com", password: "another-password" };
  const body = { name: "Second learner", ...credentials };
  assert.equal((await request("/register", { method: "POST", body })).status, 201);
  assert.equal((await request("/register", { method: "POST", body })).status, 400);
  const badLogin = await request("/login", {
    method: "POST",
    body: { ...credentials, password: "wrong-password" },
  });
  assert.equal(badLogin.status, 401);
  assert.equal(badLogin.data.token, undefined);
  assert.ok(badLogin.data.message);
  for (const path of ["/register", "/login"]) {
    assert.equal((await request(path, { method: "POST", body: {} })).status, 400);
  }
});
