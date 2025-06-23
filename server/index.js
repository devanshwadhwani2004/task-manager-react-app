import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mysql from "mysql2/promise";

const app = express();
const PORT = 9000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set("view engine", "ejs");

// MySQL connection pool
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "Dev@n$h2004",
    database: "taskdb",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Routes

// Test route
app.get("/", (req, res) => {
    res.send("Hello from Node.js server!");
});

// Get tasks for a user
app.get("/users", async (req, res) => {
    const { username } = req.query;
    try {
        const [rows] = await pool.query("SELECT task FROM tasks WHERE username = ?", [username]);
        const tasks = rows.map((row, index) => `${index + 1}. ${row.task}`).join("\n");
        res.send(tasks);
    } catch (err) {
        console.error("DB error:", err);
        res.status(500).send("Database error");
    }
});

// Login route
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.query("SELECT password FROM user WHERE username = ?", [username]);
        if (rows.length > 0 && rows[0].password === password) {
            res.redirect(`http://localhost:3000/users?username=${username}`);
        } else {
            res.redirect("http://localhost:3000/invalid");
        }
    } catch (err) {
        console.error("DB error:", err);
        res.status(500).send("Database error");
    }
});

// Create task
app.post("/createtask", async (req, res) => {
    const { newtask, username } = req.body;
    try {
        await pool.query("INSERT INTO tasks (username, task) VALUES (?, ?)", [username, newtask]);
        res.redirect(`http://localhost:3000/users?username=${username}`);
    } catch (err) {
        console.error("DB error:", err);
        res.status(500).send("Failed to create task");
    }
});

// Create account
app.post("/createacc", async (req, res) => {
    const { username, password, confirmpassword } = req.body;
    if (password !== confirmpassword) {
        return res.redirect("http://localhost:3000/password-mismatch");
    }
    try {
        await pool.query("INSERT INTO user (username, password) VALUES (?, ?)", [username, password]);
        res.redirect("http://localhost:3000/acccreated");
    } catch (err) {
        console.error("DB error:", err);
        res.status(500).send("Failed to create account");
    }
});

// Delete task
app.post("/deletetask", async (req, res) => {
    const { task, username } = req.body;
    const actualTask = task.replace(/^\d+\.\s*/, "").trim(); // Remove numbering

    try {
        const [result] = await pool.query("DELETE FROM tasks WHERE task = ? AND username = ?", [
            actualTask,
            username,
        ]);
        if (result.affectedRows === 0) {
            console.warn("No task deleted. Check values:", { actualTask, username });
        }
        res.redirect(`http://localhost:3000/users?username=${username}`);
    } catch (err) {
        console.error("DB error:", err);
        res.status(500).send("Failed to delete task");
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});