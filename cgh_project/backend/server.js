import express from "express";
import mysql2 from "mysql2";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// -------------------------------------------------------------------------------------------------------------//
// IMPORTS
// -------------------------------------------------------------------------------------------------------------//
// express: A framework for building web servers in Node.js --> simplifies routing and middleware setup
// mysql2: A module for interacting with MySQL databases in Node.js
// cors: A middleware module for handling Cross-Origin Resource Sharing (CORS) requests
// bcrypt: A module for hashing and salting passwords
// jsonwebtoken: This library is used to create and verify JSON Web Tokens (JWT),
//  which are used for user authentication and authorization.

const app = express(); // Create an instance of the express app

// -------------------------------------------------------------------------------------------------------------//
// MIDDLEWARE SETUP
// -------------------------------------------------------------------------------------------------------------//
app.use(express.json()); // Parse incoming JSON requests, so you can access req.body in POST requests when the data is sent in JSON format.
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data
app.use(cors()); //Enables CORS, allowing cross-origin requests from browsers e.g. 3000 for frontend, 3001 for backend

// -------------------------------------------------------------------------------------------------------------//
// DATABASE CONNECTION SETUP
// -------------------------------------------------------------------------------------------------------------//
const db = mysql2.createConnection({
  user: "root",
  host: "localhost",
  password: "Password", // Password of the database you created
  database: "main_db", // Name of the database you created
});
// Check mySql workbench if you forgot

// -------------------------------------------------------------------------------------------------------------//
// TOKEN VERIFICATION MIDDLEWARE //
// -------------------------------------------------------------------------------------------------------------//
// Secret Key for JWT-->
const JWT_SECRET =
  "eae2a5f39b5de58a924b22b97e62030f29885b776d301a04af5d16f92143db17";

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
// LOGIN ROUTE
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
          expiresIn: "12h",
        }
      );

      // When a user logs in, a token is created that contains information like
      // the user's MCR number, role, and expiration time.
      // This token is then SIGNED with the JWT_SECRET
      // This signing ensures that if the user presents this token later,
      // the server can decrypt and verify that it hasn’t been tampered with.

      return res.status(200).json({
        message: "Authentication successful",
        token,
        role: user.role,
      });
    });
  });
});

// -------------------------------------------------------------------------------------------------------------//
// REGISTRATION ROUTE (For Development Purposes Only)
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
// BACKEND TESTING ROUTE
// -------------------------------------------------------------------------------------------------------------//
app.get("/", (req, res) => {
  res.send(
    "This site is for Development purposes only.<br>This is the backend development site.<br>You may be trying to access this instead : http://localhost:3000/"
  );
});

// -------------------------------------------------------------------------------------------------------------//
// GET REQUEST FOR DATABASE
// -------------------------------------------------------------------------------------------------------------//

// app.get("/database", verifyToken, (req, res) => {
//   // Added token verification
//   const q = "SELECT * FROM main_data";
//   db.query(q, (err, data) => {
//     if (err) return res.json(err);
//     return res.json(data);
//   });
// });

// -------------------------------------------------------------------------------------------------------------//
// GET REQUEST FOR COMBINED DOCTORS DETAILS (FROM ALL 3 TABLES)
// -------------------------------------------------------------------------------------------------------------//
app.get("/database", verifyToken, (req, res) => {
  const includeDeleted = req.query.includeDeleted === "true";
  const query = includeDeleted
    ? "SELECT * FROM combined_doctor_data"
    : "SELECT * FROM combined_doctor_data WHERE deleted = 0";
  db.query(query, (err, data) => {
    if (err) {
      console.error("Error retrieving data:", err);
      return res.status(500).json({ error: "Failed to retrieve data" });
    }
    res.json(data);
  });
});

// -------------------------------------------------------------------------------------------------------------//
// GET REQUEST FOR STAFF DETAILS BY 'mcr_number' FROM MAIN_DATA TABLE
// -------------------------------------------------------------------------------------------------------------//
app.get("/staff/:mcr_number", verifyToken, (req, res) => {
  const { mcr_number } = req.params;

  // Remove the deleted = 0 condition to include deleted entries
  const q = "SELECT * FROM main_data WHERE mcr_number = ?";

  db.query(q, [mcr_number], (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error retrieving staff details" });
    }
    if (data.length === 0) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.json(data[0]); // Send the FIRST staff entry found in the response
  });
});

// -------------------------------------------------------------------------------------------------------------//
// PUT REQUEST FOR UPDATING EXISTING STAFF DETAILS TO MAIN_DATA TABLE
// -------------------------------------------------------------------------------------------------------------//
// Why PUT instead of POST?
// PUT Requests is idempotent --> i.e. if you make the same PUT request multiple times,
// the result will be equivalent to making just one request
// for example, making a PUT request will just overwrite the exisiting user data regardless
// of how many times you sent, it wont create multiple entries

app.put("/staff/:mcr_number", verifyToken, (req, res) => {
  const mcr_number = req.params.mcr_number;
  const {
    first_name,
    last_name,
    department,
    appointment,
    teaching_training_hours,
    start_date,
    end_date,
    renewal_start_date,
    renewal_end_date,
    email,
  } = req.body;

  // To ensure accountability, we track who updated the record
  const userMcrNumber = req.user.id; // Get the MCR number of the logged-in user from the token

  const q = `
    UPDATE main_data 
    SET first_name = ?, last_name = ?, department = ?, appointment = ?, 
        teaching_training_hours = ?, email = ?, updated_by = ?
    WHERE mcr_number = ?
  `;

  const values = [
    first_name,
    last_name,
    department,
    appointment,
    teaching_training_hours,
    email,
    userMcrNumber, // Log who updated the record (the currently logged-in user)
    mcr_number,
  ];

  // The updated_by column in main_data table will be the MCR number of the user who updated
  // it every time a put request is made

  db.query(q, values, (err, data) => {
    if (err) {
      console.error("Error during the query execution:", err);
      return res.status(500).json({ error: "Failed to update staff details" });
    }
    return res.json({ message: "Staff details updated successfully" });
  });
});

// -------------------------------------------------------------------------------------------------------------//
// POST REQUEST FOR ADDING NEW STAFF DETAILS TO MAIN_DATA TABLE
// -------------------------------------------------------------------------------------------------------------//
app.post("/entry", verifyToken, (req, res) => {
  const {
    mcr_number,
    first_name,
    last_name,
    department,
    appointment,
    teaching_training_hours,
    start_date,
    end_date,
    renewal_start_date,
    renewal_end_date,
    email,
  } = req.body;

  const userMcrNumber = req.user.id;

  // Validate required fields
  if (
    !mcr_number ||
    !first_name ||
    !last_name ||
    !department ||
    !appointment ||
    !email
  ) {
    return res
      .status(400)
      .json({ error: "Please provide all required fields" });
  }

  const q = `
    INSERT INTO main_data 
    (mcr_number, first_name, last_name, department, appointment, teaching_training_hours, start_date, end_date, renewal_start_date, renewal_end_date, email, created_by) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    mcr_number,
    first_name,
    last_name,
    department,
    appointment,
    teaching_training_hours,
    start_date,
    end_date,
    renewal_start_date,
    renewal_end_date,
    email,
    userMcrNumber, // Log who created the record (the currently logged-in user)
  ];

  db.query(q, values, (err, data) => {
    if (err) {
      console.error("Error inserting new staff details:", err);
      return res.status(500).json({ error: "Failed to add new staff details" });
    }
    return res
      .status(201)
      .json({ message: "New staff details added successfully", data });
  });
});

// -------------------------------------------------------------------------------------------------------------//
// DELETE REQUEST FOR DELETING STAFF DETAILS FROM MAIN_DATA TABLE
// -------------------------------------------------------------------------------------------------------------//
app.delete("/staff/:mcr_number", verifyToken, (req, res) => {
  const { mcr_number } = req.params;
  const userMcrNumber = req.user.id; // Get the MCR number of the logged-in user from the token
  const deleteTime = new Date();

  // Instead of DELETE, use UPDATE to mark the entry as deleted
  const q = `
    UPDATE main_data 
    SET deleted = 1, deleted_by = ?, deleted_at = ?
    WHERE mcr_number = ?
  `;

  db.query(q, [userMcrNumber, deleteTime, mcr_number], (err, data) => {
    if (err) {
      console.error("Error marking staff as deleted:", err); // Log any error
      return res.status(500).json({ error: "Failed to mark staff as deleted" });
    }

    // If no rows were affected, the mcr_number does not exist
    if (data.affectedRows === 0) {
      return res.status(404).json({ message: "Staff not found" });
    }

    return res.json({
      message: `Staff with MCR Number ${mcr_number} marked as deleted successfully`,
    });
  });
});

// -------------------------------------------------------------------------------------------------------------//
// RESTORE REQUEST FOR RESTORING DELETED STAFF DETAILS IN MAIN_DATA TABLE
// -------------------------------------------------------------------------------------------------------------//
app.put("/restore/:mcr_number", verifyToken, (req, res) => {
  const { mcr_number } = req.params;
  const userMcrNumber = req.user.id; // Get the MCR number of the logged-in user from the token

  const q = `
    UPDATE main_data 
    SET deleted = 0, deleted_by = NULL, deleted_at = NULL
    WHERE mcr_number = ? AND deleted = 1
  `; // Only update entries marked as deleted (deleted = 1)

  db.query(q, [mcr_number], (err, data) => {
    if (err) {
      console.error("Error restoring staff details:", err); // Log any error
      return res.status(500).json({ error: "Failed to restore staff details" });
    }

    // If no rows were affected, it means either the MCR number does not exist or the entry is not marked as deleted
    if (data.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Staff not found or already active" });
    }

    return res.json({
      message: `Staff with MCR Number ${mcr_number} has been successfully restored`,
    });
  });
});

// -------------------------------------------------------------------------------------------------------------//
// GET REQUEST FOR CONTRACTS DETAILS BY 'mcr_number' FROM MAIN_DATA TABLE
// -------------------------------------------------------------------------------------------------------------//
app.get("/contracts/:mcr_number", verifyToken, (req, res) => {
  const { mcr_number } = req.params;

  // Query to get all contracts for the given doctor MCR number
  const q = `
    SELECT * FROM contracts
    WHERE mcr_number = ?
    ORDER BY start_date ASC;
  `;

  db.query(q, [mcr_number], (err, data) => {
    if (err) {
      console.error("Error retrieving contracts data:", err);
      d;
      return res
        .status(500)
        .json({ message: "Error retrieving contracts data" });
    }

    if (data.length === 0) {
      return res
        .status(404)
        .json({ message: "No contracts found for this doctor" });
    }

    res.json(data);
  });
});

// -------------------------------------------------------------------------------------------------------------//
// POST REQUEST FOR ADDING NEW CONTRACT DETAILS TO CONTRACTS TABLE
// -------------------------------------------------------------------------------------------------------------//

app.post("/new-contracts/:mcr_number", verifyToken, (req, res) => {
  const { mcr_number } = req.params; // Get the MCR number from the URL
  const { school_name, start_date, end_date, status } = req.body;

  // Validate required fields
  if (!school_name || !start_date || !end_date || !status) {
    return res
      .status(400)
      .json({ error: "Please provide all required fields" });
  }

  const q = `
    INSERT INTO contracts 
    (mcr_number, school_name, start_date, end_date, status) 
    VALUES (?, ?, ?, ?, ?)
  `;

  const values = [mcr_number, school_name, start_date, end_date, status];

  db.query(q, values, (err, data) => {
    if (err) {
      console.error("Error inserting new contract details:", err);
      return res
        .status(500)
        .json({ error: "Failed to add new contract details" });
    }
    return res
      .status(201)
      .json({ message: "New contract details added successfully", data });
  });
});

// -------------------------------------------------------------------------------------------------------------//
// GET REQUEST FOR PROMOTIONS DETAILS BY 'mcr_number' FROM MAIN_DATA TABLE
// -------------------------------------------------------------------------------------------------------------//
app.get("/promotions/:mcr_number", verifyToken, (req, res) => {
  const { mcr_number } = req.params;

  const q = `
    SELECT mcr_number, previous_title, new_title, promotion_date
    FROM promotions
    WHERE mcr_number = ?
    ORDER BY promotion_date ASC;
  `;

  db.query(q, [mcr_number], (err, data) => {
    if (err) {
      console.error("Error retrieving promotion data:", err);
      return res
        .status(500)
        .json({ message: "Error retrieving promotion data" });
    }

    // Log the data being returned
    console.log("Promotion data fetched: ", data);

    if (data.length === 0) {
      return res
        .status(404)
        .json({ message: "No promotions found for this doctor" });
    }

    res.json(data);
  });
});

// -------------------------------------------------------------------------------------------------------------//
// Database connection and Server Start
// -------------------------------------------------------------------------------------------------------------//
db.connect((err) => {
  if (err) {
    console.log("Error connecting to the database:", err);
  } else {
    console.log("Connection Successful. Backend server is running!");

    // Create indexes on the necessary columns
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_mcr_number_main_data ON main_data(mcr_number);
      CREATE INDEX IF NOT EXISTS idx_mcr_number_contracts ON contracts(mcr_number);
    `;

    db.query(createIndexes, (err, result) => {
      if (err) {
        console.error("Error creating indexes:", err);
      } else {
        console.log("Indexes created successfully.");
      }
    });
  }
});

app.listen(3001, () => {
  console.log("Connection Successful. Backend server is running!");
});
