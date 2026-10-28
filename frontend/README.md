# Task Manager: Simple Authentication Lesson

## 1. What Are We Building?

Students will learn how to let only logged-in users open the task page.

```text
Register -> Login -> Save token -> Open tasks -> Logout
```

Before these changes, anyone could open the task page and call the task APIs.
Now the frontend checks the user's session before showing tasks, and the backend
checks the token before returning or creating tasks.

**Teaching point:** Hiding a page is not enough. The backend must protect its
data too.

## 2. Run the Project

You need Node.js, npm, and a running MongoDB database. Make sure the connection
string in [server.js](../backend/src/server.js) matches your MongoDB setup.

From the project root, open two terminals.

**Terminal 1: Backend**

```powershell
cd backend
npm install
npm run dev
```

**Terminal 2: Frontend**

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Use the frontend's `localhost` address because the backend allows that origin.
- No `.env` file is needed for this lesson.

On Windows, if PowerShell blocks `npm.ps1`, use `npm.cmd` instead of `npm`.

## 3. Files to Teach

| File | What students learn |
|---|---|
| [Register.jsx](src/pages/Register.jsx) | Create an account and go to login |
| [Login.jsx](src/pages/Login.jsx) | Log in, save a token, and go to tasks |
| [api.js](src/api.js) | Share the backend URL and attach the token |
| [App.jsx](src/App.jsx) | Check login before showing the task page |
| [Task.jsx](src/pages/Task.jsx) | Fetch tasks, add a task, and log out |
| [server.js](../backend/src/server.js) | Hash passwords, issue tokens, and protect APIs |

## 4. A Few Important Words

| Word | Simple meaning |
|---|---|
| Authentication | Checking who the user is |
| Hash | A one-way representation of a password, not the original password |
| JWT | A signed token the server gives the user after login |
| Local storage | Browser storage that remains after a page refresh |
| Bearer token | A token sent in the request's `Authorization` header |
| Middleware | A function that runs before an API's main handler |
| Loader | A React Router function that runs before rendering a route |

**Teaching analogy:** A token is like an entry pass. The server issues the pass
after login and checks it when the user requests protected data.

## 5. Registration: Create an Account

Start with [Register.jsx](src/pages/Register.jsx).

The form stores three values using `useState`:

- `name`
- `email`
- `password`

When the form is submitted:

```jsx
async function handleSubmit(e) {
  e.preventDefault();
  await api.post("/register", { name, email, password });
  navigate("/login");
}
```

Explain each step:

1. `e.preventDefault()` stops the browser from reloading the page.
2. `api.post()` sends the form values to the backend.
3. `await` waits for registration to succeed.
4. `navigate("/login")` opens the login page.

On the backend, [server.js](../backend/src/server.js) checks for an existing
account, hashes the password with `bcrypt.hash(password, 10)`, and saves the user.

**Teaching point:** Registration creates an account. It does not log the user in.

## 6. Login: Get and Save a Token

Next, open [Login.jsx](src/pages/Login.jsx).

```jsx
async function handleSubmit(e) {
  e.preventDefault();
  const response = await api.post("/login", { email, password });
  localStorage.setItem("token", response.data.token);
  navigate("/");
}
```

Explain each step:

1. Send the email and password to `/login`.
2. The backend finds the user and checks the password with `bcrypt.compare()`.
3. If the password is correct, the backend sends back a token.
4. Save the token in local storage using the key `"token"`.
5. Navigate to `/`, the task page.

The backend creates the token like this:

```js
const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "1h" });
```

- `id` identifies the user.
- `SECRET` signs the token and is also used to verify it.
- `expiresIn: "1h"` makes the token expire after one hour.

**Teaching point:** A JWT is signed, not encrypted. Never put passwords in it.

## 7. Send the Token with API Requests

Open [api.js](src/api.js).

We create one Axios instance with a shared backend address:

```js
const api = axios.create({
  baseURL: "http://localhost:3000",
});
```

Now `api.get("/tasks")` sends a request to
`http://localhost:3000/tasks`.

The request interceptor runs before each request. It reads the saved token and,
if one exists, adds this header:

```text
Authorization: Bearer <saved-token>
```

This means the pages do not need to repeat the token header for every request.

**Teaching point:** Local storage does not send tokens automatically. Our
interceptor reads the token and attaches it.

## 8. Protect the Task Page

Open [App.jsx](src/App.jsx).

The task route has a loader:

```jsx
{
  path: "/",
  loader: requireLogin,
  hydrateFallbackElement: <p>Loading...</p>,
  element: <Task />,
}
```

The `requireLogin` loader runs before the task page is shown:

1. If no token is saved, redirect to `/login`.
2. If a token exists, call `GET /me` to verify the session with the backend.
3. If verification succeeds, return `null` and show the task page.
4. If the backend returns `401`, remove the rejected token and go to login.
5. Other failures are passed to React Router rather than treated as success.

The short loading message is shown while the initial loader runs.

**Teaching point:** Checking whether a token exists is not enough. A made-up or
expired token must not unlock the page.

## 9. Protect the Backend APIs

Open the `requireLogin` middleware in
[server.js](../backend/src/server.js).

It:

1. Reads `req.headers.authorization`.
2. Checks that the header starts with `"Bearer "`.
3. Uses `slice(7)` to remove `"Bearer "` and get the token.
4. Calls `jwt.verify()` to check its signature and expiry.
5. Saves the decoded token data in `req.user`.
6. Calls `next()` only when verification succeeds.

The middleware is placed before the protected handlers:

```js
app.get("/tasks", requireLogin, async (req, res) => {
  const tasks = await Task.find();
  res.status(200).json({ tasks: tasks });
});
```

`GET /me` also checks that the user still exists and returns their name and email,
not their password.

| Method | API | Login required? | Purpose |
|---|---|---|---|
| POST | `/register` | No | Create an account |
| POST | `/login` | No | Check credentials and return a token |
| GET | `/me` | Yes | Verify the session and return user details |
| GET | `/tasks` | Yes | Read tasks |
| POST | `/tasks` | Yes | Create a task |

**Teaching point:** The frontend controls navigation. The backend protects data.

## 10. Fetch and Add Tasks

Open [Task.jsx](src/pages/Task.jsx).

The page fetches tasks inside `useEffect`:

```js
const response = await api.get("/tasks");
setTasks(response.data.tasks);
```

When the task form is submitted:

```jsx
async function createTask(e) {
  e.preventDefault();
  const response = await api.post("/tasks", { title: newTaskTitle });
  setTasks((tasks) => [...tasks, response.data.task]);
  setNewTaskTitle("");
}
```

Explain that:

- The backend saves the task.
- The frontend adds the returned task to the displayed list.
- The input is cleared after the request succeeds.
- Both requests get their token header from the shared Axios instance.

Tasks are still shared between all logged-in users. Per-user task ownership is
not part of this lesson.

## 11. Logout

The logout button in [Task.jsx](src/pages/Task.jsx) runs:

```js
localStorage.removeItem("token");
navigate("/login", { replace: true });
```

1. Remove the saved token.
2. Return to login.
3. `replace: true` replaces the current browser history entry.
4. Opening `/` again runs the loader and redirects to login.

**Teaching point:** This logs out the current browser. It does not revoke a
previously copied token on the server; that token expires after one hour.

## 12. Classroom Demonstration

| Step | Action | Expected result |
|---|---|---|
| 1 | Clear the saved token and visit `/` | Redirect to login |
| 2 | Click Register and create an account | Redirect to login |
| 3 | Log in with that account | Task page opens |
| 4 | Open DevTools -> Application -> Local Storage | A `token` entry exists |
| 5 | Add a task | Task appears in the list |
| 6 | Refresh the page | Login remains active and tasks load again |
| 7 | Click Logout | Token is removed and login opens |
| 8 | Visit `/` again | Redirect to login |
| 9 | Save a fake token in DevTools and visit `/` | Token is rejected; login opens |

Optional: inspect a task request in DevTools -> Network to see its
`Authorization` header. Do not copy or share real tokens.

## 13. Checks for the Teacher

From the project root:

```powershell
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix backend test
```

The [backend tests](../backend/test/auth.test.js) check registration, login,
session verification, protected task requests, and rejected credentials/tokens.
They use an isolated in-memory model stub, not a real MongoDB database.
Use the classroom demonstration to check the full app with your database.

The backend exports `app` for these tests. Its startup condition starts the
listener and database connection only when the server is run directly.
This is test setup, not a core authentication concept.

## 14. Keep the Lesson Simple

This example intentionally has no custom form error messages, loading buttons,
password reset, email verification, refresh tokens, or per-user task lists.
Failed form/task requests appear in the browser console. The route loader and
backend still keep essential authentication checks.

An expired token is checked when the route loader or a protected API runs;
there is no background timer that automatically logs the user out.

The original hardcoded secret and local-storage token are kept for teaching.
This is not a production-ready authentication system. In production, keep the
secret out of source code, use HTTPS, consider secure HttpOnly cookies, and add
appropriate validation and user-facing error handling.

## 15. Quick Recap Questions

1. Why do we call `e.preventDefault()`?
2. What is the difference between registering and logging in?
3. Where is the token saved?
4. How does the token reach the backend?
5. Why does the task route call `/me`?
6. Why must the backend check tokens even though the frontend has a loader?
7. What changes in the browser when the user logs out?
