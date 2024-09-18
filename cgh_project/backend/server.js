import express from "express";
import mysql2 from "mysql2";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"; // Added jwt import

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const JWT_SECRET = "your_jwt_secret_key"; // Replace with your JWT secret

const db = mysql2.createConnection({
  user: "root",
  host: "localhost",
  password: "Password",
  database: "main_db",
});

// POST request for login (changed from GET)
app.post("/login", (req, res) => {
  const { mcr_number, password, selectedRole } = req.body;

  if (!mcr_number || !password || !selectedRole) {
    return res
      .status(400)
      .json({ error: "MCR Number, password, and role are required" });
  }

  const q = "SELECT * FROM user_data WHERE mcr_number = ?";

  db.query(q, [mcr_number], (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Database error occurred" });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = data[0];

    // Compare the provided password with the hashed password in the database
    bcrypt.compare(password, user.user_password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: "Error comparing passwords" });
      }

      if (!isMatch) {
        return res.status(401).json({ error: "Incorrect password" });
      }

      // Check if the selected role matches the role stored in the database
      if (user.role !== selectedRole) {
        return res.status(403).json({ error: "Role does not match" });
      }

      // Create a JWT token
      const token = jwt.sign(
        { id: user.mcr_number, role: user.role },
        JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );

      return res.status(200).json({
        message: "Authentication successful",
        token,
        role: user.role, // Assuming you store a 'role' in your database
      });
    });
  });
});

// POST request for user registration
app.post("/register", (req, res) => {
  const q =
    "INSERT INTO user_data (mcr_number, email, user_password, role) VALUES (?, ?, ?, ?)";

  bcrypt.hash(req.body.password.toString(), 10, (err, hash) => {
    if (err)
      return res.status(500).json({ error: "Error hashing your password" });

    const values = [req.body.mcr_number, req.body.email, hash, req.body.role];

    db.query(q, values, (err, data) => {
      if (err) return res.status(500).json({ error: err });

      return res.status(201).json({ message: "User has been created" });
    });
  });
});

// Other routes
app.get("/", (req, res) => {
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

// Database connection
db.connect((err) => {
  if (err) {
    console.log(err);
  }
});

app.listen(3001, () => {
  console.log("Connection Successful. Backend server is running!");
});
