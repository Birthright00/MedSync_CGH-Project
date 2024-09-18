import express from "express";
import mysql2 from "mysql2";
import cors from "cors";

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const db = mysql2.createConnection({
  user: "root",
  host: "localhost",
  password: "Password",
  database: "main_db",
});

db.connect((err) => {
  if (err) {
    console.log(err);
  }
});

app.get("/", (req, res) => {
  console.log("Backend received a request!");
  res.send(
    "This site is for Development purposes only.<br>This is the backend development site.<br>You may be trying to access this instead : http://localhost:3000/"
  );
});

app.get("/database", (req, res) => {
  const q = "SELECT * FROM main_data";
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.post("/database", (req, res) => {
  const q =
    "INSERT INTO main_data (mcr_number, first_name, last_name, department, appointment, teaching_training_hours) VALUES (?, ?, ?, ?, ?, ?)";
  const values = [
    req.body.mcr_number,
    req.body.first_name,
    req.body.last_name,
    req.body.department,
    req.body.appointment,
    req.body.teaching_training_hours,
  ];

  db.query(q, values, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.json(data);
  });
});

app.listen(3001, () => {
  console.log("Connection Successful. Backend server is running!");
});
