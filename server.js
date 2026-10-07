const express = require("express");
const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "students.db");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let db;

function saveDatabase() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function validateStudent(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const department = typeof body.department === "string" ? body.department.trim() : "";

  if (name.length < 2 || name.length > 60) {
    return { error: "Name must contain 2 to 60 characters." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (department.length < 2 || department.length > 50) {
    return { error: "Department must contain 2 to 50 characters." };
  }
  return { student: { name, email, department } };
}

function getStudents() {
  const result = db.exec("SELECT id, name, email, department, created_at FROM students ORDER BY id DESC");
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map(row => Object.fromEntries(columns.map((column, index) => [column, row[index]])));
}

app.get("/api/students", (req, res) => {
  res.json(getStudents());
});

app.get("/api/students/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Student ID must be a positive integer." });
  }
  const stmt = db.prepare("SELECT id, name, email, department, created_at FROM students WHERE id = ?");
  stmt.bind([id]);
  const found = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  if (!found) return res.status(404).json({ error: "Student not found." });
  res.json(found);
});

app.post("/api/students", (req, res) => {
  const checked = validateStudent(req.body || {});
  if (checked.error) return res.status(400).json({ error: checked.error });

  const { name, email, department } = checked.student;
  try {
    db.run(
      "INSERT INTO students (name, email, department, created_at) VALUES (?, ?, ?, ?)",
      [name, email, department, new Date().toISOString()]
    );
    saveDatabase();
    const id = db.exec("SELECT last_insert_rowid() AS id")[0].values[0][0];
    res.status(201).json({ message: "Student added successfully.", student: getStudents().find(s => s.id === id) });
  } catch (error) {
    if (String(error.message).toLowerCase().includes("unique")) {
      return res.status(409).json({ error: "This email address is already registered." });
    }
    res.status(500).json({ error: "Could not save student." });
  }
});

app.put("/api/students/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Student ID must be a positive integer." });
  }
  const checked = validateStudent(req.body || {});
  if (checked.error) return res.status(400).json({ error: checked.error });

  const exists = db.exec("SELECT id FROM students WHERE id = " + id);
  if (!exists.length || !exists[0].values.length) {
    return res.status(404).json({ error: "Student not found." });
  }

  const { name, email, department } = checked.student;
  try {
    db.run("UPDATE students SET name = ?, email = ?, department = ? WHERE id = ?", [name, email, department, id]);
    saveDatabase();
    res.json({ message: "Student updated successfully.", student: getStudents().find(s => s.id === id) });
  } catch (error) {
    if (String(error.message).toLowerCase().includes("unique")) {
      return res.status(409).json({ error: "This email address is already registered." });
    }
    res.status(500).json({ error: "Could not update student." });
  }
});

app.delete("/api/students/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Student ID must be a positive integer." });
  }
  const exists = db.exec("SELECT id FROM students WHERE id = " + id);
  if (!exists.length || !exists[0].values.length) {
    return res.status(404).json({ error: "Student not found." });
  }
  db.run("DELETE FROM students WHERE id = ?", [id]);
  saveDatabase();
  res.json({ message: "Student deleted successfully." });
});

initSqlJs().then(SQL => {
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(new Uint8Array(fileBuffer));
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 60),
      email TEXT NOT NULL UNIQUE,
      department TEXT NOT NULL CHECK(length(department) BETWEEN 2 AND 50),
      created_at TEXT NOT NULL
    )
  `);
  saveDatabase();

  app.listen(PORT, () => {
    console.log(`Student Management App is running at http://localhost:${PORT}`);
    console.log(`Database file: ${DB_PATH}`);
  });
}).catch(error => {
  console.error("Could not initialize SQLite database:", error);
  process.exit(1);
});
