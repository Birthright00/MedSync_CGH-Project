import express from "express";
import mysql2 from "mysql2";

const app = express();

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
  res.send("For Development only. This is the backend.");
});

app.get("/database", (req, res) => {
  const q = "SELECT * FROM main_data";
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.listen(3001, () => {
  console.log("Connection Successful. Backend server is running!");
});
