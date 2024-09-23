import express from "express";
import mysql2 from "mysql2";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// -------------------------------------------------------------------------------------------------------------//
// IMPORTS//
// -------------------------------------------------------------------------------------------------------------//
// express: A framework for building web servers in Node.js --> simplifies routing and middleware setup
// mysql2: A module for interacting with MySQL databases in Node.js
// cors: A middleware module for handling Cross-Origin Resource Sharing (CORS) requests
// bcrypt: A module for hashing and salting passwords
// jsonwebtoken: This library is used to create and verify JSON Web Tokens (JWT),
//  which are used for user authentication and authorization.

const app = express(); // Create an instance of the express app

// -------------------------------------------------------------------------------------------------------------//
// MIDDLEWARE SETUP //
// -------------------------------------------------------------------------------------------------------------//
app.use(express.json()); // Parse incoming JSON requests, so you can access req.body in POST requests when the data is sent in JSON format.
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data
app.use(cors()); //Enables CORS, allowing cross-origin requests from browsers e.g. 3000 for frontend, 3001 for backend

const JWT_SECRET =
  "eae2a5f39b5de58a924b22b97e62030f29885b776d301a04af5d16f92143db17";

// -------------------------------------------------------------------------------------------------------------//
// DATABASE CONNECTION //
// -------------------------------------------------------------------------------------------------------------//
const db = mysql2.createConnection({
  user: "root",
  host: "localhost",
  password: "Password",
  database: "main_db",
});

// -------------------------------------------------------------------------------------------------------------//
// TOKEN VERIFICATION MIDDLEWARE //
// -------------------------------------------------------------------------------------------------------------//
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from Authorization header

  if (!token) {
    return res.status(403).json({ message: "Token is required" });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET); // Verify the token using the secret
    req.user = verified; // Attach the user information from the token to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// -------------------------------------------------------------------------------------------------------------//
// ROUTES //
// -------------------------------------------------------------------------------------------------------------//
// Login Route
// -------------------------------------------------------------------------------------------------------------//
app.post("/login", (req, res) => {
  // req.body is the data sent by the client, commonly used when a user submits a form
  // This line then extracts the mcr_number, password, and selectedRole from the request body.
  // These are required fields for login.
  const { mcr_number, password, selectedRole } = req.body;

  // Check if all required fields are present
  if (!mcr_number || !password || !selectedRole) {
    return res
      .status(400)
      .json({ error: "MCR Number, password, and role are required" });
  }

  // Check if the user exists in the database
  const q = "SELECT * FROM user_data WHERE mcr_number = ?";

  // Execute and handles the query
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

      // IF all checks pass, Create a JWT token
      const token = jwt.sign(
        { id: user.mcr_number, role: user.role },
        JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );

      // When a user logs in, a token is created that contains information like
      // the user's MCR number, role, and expiration time.
      // This token is then SIGNED with the JWT_SECRET
      // This signing ensures that if the user presents this token later, the server can verify that it hasn’t been tampered with.

      return res.status(200).json({
        message: "Authentication successful",
        token,
        role: user.role,
      });
    });
  });
});

// -------------------------------------------------------------------------------------------------------------//
// Registration Route
// -------------------------------------------------------------------------------------------------------------//
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

// -------------------------------------------------------------------------------------------------------------//
// Testing Route
// -------------------------------------------------------------------------------------------------------------//
app.get("/", (req, res) => {
  res.send(
    "This site is for Development purposes only.<br>This is the backend development site.<br>You may be trying to access this instead : http://localhost:3000/"
  );
});

// -------------------------------------------------------------------------------------------------------------//
// PROTECTED Database GET //
// -------------------------------------------------------------------------------------------------------------//
app.get("/database", verifyToken, (req, res) => {
  // Added token verification
  const q = "SELECT * FROM main_data";
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

// -------------------------------------------------------------------------------------------------------------//
// PROTECTED Database POST - For Postman (Development purposes only)
// -------------------------------------------------------------------------------------------------------------//
app.post("/database", verifyToken, (req, res) => {
  // Added token verification
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

// -------------------------------------------------------------------------------------------------------------//
// Database GET - Staff by mcr_number
// -------------------------------------------------------------------------------------------------------------//
app.get("/staff/:mcr_number", verifyToken, (req, res) => {
  const { mcr_number } = req.params;

  const q = "SELECT * FROM main_data WHERE mcr_number = ?"; // Adjust table/column names as necessary

  db.query(q, [mcr_number], (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error retrieving staff details" });
    }
    if (data.length === 0) {
      return res.status(404).json({ message: "Staff not found" });
    }
    res.json(data[0]); // Send the first staff entry found in the response
  });
});

// -------------------------------------------------------------------------------------------------------------//
// Database connection and Server Start
// -------------------------------------------------------------------------------------------------------------//
db.connect((err) => {
  if (err) {
    console.log(err);
  }
});

app.listen(3001, () => {
  console.log("Connection Successful. Backend server is running!");
});
