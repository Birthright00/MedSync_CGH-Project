// -----------------------------------------------------------------------------------------------------------------------------//
//Frequently used sql
// Deleting all "TEST" data
// -------------------------------------------------------------------------------------------------------------//
// DELETE c
// FROM contracts c
// JOIN main_data m ON c.mcr_number = m.mcr_number
// WHERE m.first_name = 'test';
// DELETE FROM main_data
// WHERE first_name = 'test';

import express from "express";
import mysql2 from "mysql2";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import * as XLSX from "xlsx";
import csv from "csv-parser";

// -------------------------------------------------------------------------------------------------------------//
// IMPORTS EXPLANATION
// -------------------------------------------------------------------------------------------------------------//
// express: A framework for building web servers in Node.js --> simplifies routing and middleware setup
// mysql2: A module for interacting with MySQL databases in Node.js
// cors: A middleware module for handling Cross-Origin Resource Sharing (CORS) requests
// bcrypt: A module for hashing and salting passwords
// jsonwebtoken: This library is used to create and verify JSON Web Tokens (JWT),
// which are used for user authentication and authorization.
// multer: A middleware module for handling file uploads
// XLSX / csv-parser: For reading Excel or CSV files for uploads.

const app = express(); // Create an instance of the express app
const upload = multer({ storage: multer.memoryStorage() }); // Multer configuration

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
// "?." is the optional chaining operator in JS
// Used to safely access properties of an object without throwing an error if they don't exist
// If any part of the chain is undefined or null, it returns undefined instead of an error
// In this case, req.headers.authorization might be undefined if the Authorization header is not included in the request
// Using ?. ensures there is no error that will break everything
// So the split will remove the token from the header

// If (!token) checks if the token variable is FALSY
// falsy values include null, undefined, 0, "", NaN, and false
// basically this just makes sure the token is not null or undefined
// Secret Key for JWT
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
// ACCESSIBLE ROUTES //
// localhost:3001 --> Backend Server
// localhost:3001/main_data --> GET Request for main_data
// localhost:3001/database --> GET Request for combined_doctor_data views
// -------------------------------------------------------------------------------------------------------------//

// -------------------------------------------------------------------------------------------------------------//
// BACKEND SERVER
// -------------------------------------------------------------------------------------------------------------//
app.get("/", (req, res) => {
  res.send(
    "This site is for Development purposes only.<br>This is the backend development site.<br>You may be trying to access this instead : http://localhost:3000/"
  );
});

// -------------------------------------------------------------------------------------------------------------//
// LOGIN ROUTE
// -------------------------------------------------------------------------------------------------------------//
app.post("/login", (req, res) => {
  // req.body is the data sent by the client, commonly used when a user submits a form
  // This line then extracts the mcr_number, password, and selectedRole from the request body.
  // These are required fields for login.
  const { user_id, password, selectedRole } = req.body;

  // Check if all required fields are present
  if (!user_id || !password || !selectedRole) {
    return res
      .status(400)
      .json({ error: "User ID, password, and role are required" });
  }

  // Check if the user exists in the database
  const q = "SELECT * FROM user_data WHERE user_id = ?";

  // Execute and handles the query
  db.query(q, [user_id], (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Database error occurred" });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = data[0];

    // bcrypt.compare() and how it works (NOT SIMPLY STRING COMPARISON)
    // For e.g. password = "password123"
    // bcrypt will hash the password with salt and cost factor
    // salt is a random string e.g. KkT48OvTzVQjTTvYbRLmQG
    // cost factor is represented as a number that determines how many times the password will be hashed
    // cost factor basically prevents brute force attacks, each increment of 1 doubles the time taken to hash the password

    // salt is embedded into the final hash along with the cost factor resulting in :
    // $2b$10$KkT48OvTzVQjTTvYbRLmQG1XsYfdGQFtBddtvImR5XM4vFElxuRm
    //        |--------------------|
    //               |salt|

    // hackers who manage to access the database will see this, even if they are aware of the salt and cost factor,
    // they would not be able to guess the password

    // Verifying the password
    // Backend retrieves the hashed password, bcrypts extracts salt and cost factor fro the storeed hash
    // rehash the INPUTTED password with the extracted salt and cost factor
    // Compares this new hash with the stored hash via string comparison

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
        { id: user.user_id, role: user.role },
        JWT_SECRET,
        {
          expiresIn: "12h", // Edit this for token expiration
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
    "INSERT INTO user_data (user_id, email, user_password, role) VALUES (?, ?, ?, ?)";

  bcrypt.hash(req.body.password.toString(), 10, (err, hash) => {
    if (err)
      return res.status(500).json({ error: "Error hashing your password" });

    const values = [req.body.user_id, req.body.email, hash, req.body.role];

    db.query(q, values, (err, data) => {
      if (err) return res.status(500).json({ error: err });

      return res.status(201).json({ message: "User has been created" });
    });
  });
});

// -------------------------------------------------------------------------------------------------------------//
// GET REQUEST FOR main_data table
// -------------------------------------------------------------------------------------------------------------//

// No Need Token Verification
app.get("/main_data", (req, res) => {
  // Added token verification
  const q = "SELECT * FROM main_data";
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

// ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
// ⚠️MANAGEMENT HOME PAGE⚠️
// -------------------------------------------------------------------------------------------------------------//
// GET REQUEST FOR MANAGEMENT HOME PAGE TABLE DISPLAY
// -------------------------------------------------------------------------------------------------------------//

app.get("/database", verifyToken, (req, res) => {
  const includeDeleted = req.query.includeDeleted === "true";
  const query = includeDeleted
    ? "SELECT * FROM doctor_data_contracts"
    : "SELECT * FROM doctor_data_contracts WHERE deleted = 0";
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

// ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
// ⚠️STAFF DETAILS PAGE⚠️
// -------------------------------------------------------------------------------------------------------------//
// GET REQUEST FOR STAFF DETAILS BY 'mcr_number' FROM CONTRACTS
// -------------------------------------------------------------------------------------------------------------//
app.get("/contracts/:mcr_number", verifyToken, (req, res) => {
  const { mcr_number } = req.params;

  // Remove the deleted = 0 condition to include deleted entries
  const q = "SELECT * FROM contracts WHERE mcr_number = ?";

  db.query(q, [mcr_number], (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error retrieving staff details" });
    }
    if (data.length === 0) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.json(data); // Return all contracts for the given mcr_number
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
  const { mcr_number } = req.params;
  const { first_name, last_name, department, designation, email, fte } =
    req.body;
  const userMcrNumber = req.user.id; // Assuming this is the logged-in user

  console.log("Updating staff details for MCR:", mcr_number); // Debug
  console.log("Request body:", req.body); // Debug

  const q = `
    UPDATE main_data 
    SET first_name = ?, last_name = ?, department = ?, designation = ?, 
        email = ?, fte = ?, updated_by = ?, updated_at = NOW()
    WHERE mcr_number = ?
  `;

  const values = [
    first_name,
    last_name,
    department,
    designation,
    email,
    fte,
    userMcrNumber, // Log who updated the record
    mcr_number, // For the WHERE clause
  ];

  db.query(q, values, (err, data) => {
    if (err) {
      console.error("Error updating staff details:", err);
      return res.status(500).json({ error: "Failed to update staff details" });
    }

    if (data.affectedRows === 0) {
      // No rows affected means the mcr_number might not exist
      console.log("No rows updated, check if MCR number exists");
      return res.status(404).json({ error: "Staff not found" });
    }

    console.log("Staff details updated successfully"); // Success message
    return res
      .status(200)
      .json({ message: "Staff details updated successfully" });
  });
});

// -------------------------------------------------------------------------------------------------------------//
// POST REQUEST FOR ADDING NEW CONTRACTS TO CONTRACTS TABLE
// -------------------------------------------------------------------------------------------------------------//

app.post("/contracts/:mcr_number", verifyToken, (req, res) => {
  const { mcr_number } = req.params;
  const {
    school_name,
    contract_start_date,
    contract_end_date,
    status,
    prev_title,
    new_title,
  } = req.body;

  // First, delete the existing contract for the same school_name
  const deleteQuery = `
    DELETE FROM contracts 
    WHERE mcr_number = ? AND school_name = ?`;

  db.query(deleteQuery, [mcr_number, school_name], (deleteErr, deleteData) => {
    if (deleteErr) {
      console.error("Error deleting existing contract:", deleteErr.message);
      return res.status(500).json({
        error: "Failed to delete existing contract",
        details: deleteErr.message,
      });
    }

    // Then insert the new contract
    const insertQuery = `
        INSERT INTO contracts 
        (mcr_number, school_name, contract_start_date, contract_end_date, status, prev_title, new_title)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const insertValues = [
      mcr_number,
      school_name,
      contract_start_date,
      contract_end_date,
      status,
      prev_title,
      new_title,
    ];

    db.query(insertQuery, insertValues, (insertErr, insertData) => {
      if (insertErr) {
        console.error("Error inserting new contract:", insertErr.message);
        return res.status(500).json({
          error: "Failed to add new contract",
          details: insertErr.message,
        });
      }

      return res
        .status(201)
        .json({ message: "Contract replaced successfully" });
    });
  });
});

// -------------------------------------------------------------------------------------------------------------//
// GET REQUEST FOR CONTRACT DETAILS BY 'mcr_number' AND 'school_name'
// -------------------------------------------------------------------------------------------------------------//
app.get("/contracts/:mcr_number/:school_name", verifyToken, (req, res) => {
  const { mcr_number, school_name } = req.params;

  const query = `
    SELECT contract_start_date, contract_end_date, prev_title, status, 
           training_hours_2022, training_hours_2023, training_hours_2024
    FROM contracts
    WHERE mcr_number = ? AND school_name = ?`;

  db.query(query, [mcr_number, school_name], (err, results) => {
    if (err) {
      console.error("Error fetching contract details:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch contract details" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Contract not found" });
    }
    return res.status(200).json(results[0]); // Return the contract details
  });
});

// -------------------------------------------------------------------------------------------------------------//
// POST REQUEST FOR ADDING NEW STAFF DETAILS TO MAIN_DATA TABLE
// -------------------------------------------------------------------------------------------------------------//
app.post("/entry", verifyToken, (req, res) => {
  const { mcr_number, first_name, last_name, department, designation, email } = req.body;
  const userMcrNumber = req.user.id;

  // Check for required fields
  if (!mcr_number || !first_name || !last_name || !department || !designation || !email) {
    return res.status(400).json({ error: "Please provide all required fields" });
  }

  // Insert new doctor into main_data
  const insertDoctorQuery = `
    INSERT INTO main_data 
    (mcr_number, first_name, last_name, department, designation, email, created_by) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const doctorValues = [
    mcr_number,
    first_name,
    last_name,
    department,
    designation,
    email,
    userMcrNumber, // Log who created the record
  ];

  db.query(insertDoctorQuery, doctorValues, (doctorErr, doctorData) => {
    if (doctorErr) {
      console.error("Error inserting new staff details:", doctorErr.message);
      return res.status(500).json({ error: "Failed to add new staff details", details: doctorErr.message });
    }

    // Insert a dummy contract for the new doctor
    const insertContractQuery = `
      INSERT INTO contracts 
      (mcr_number, school_name, contract_start_date, contract_end_date, status, prev_title, new_title) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const contractValues = [
      mcr_number,
      "Default School", // Default school name
      null, // Null start date
      null, // Null end date
      "inactive", // Default status
      null, // Null previous title
      null, // Null new title
    ];

    db.query(insertContractQuery, contractValues, (contractErr, contractData) => {
      if (contractErr) {
        console.error("Error inserting dummy contract:", contractErr.message);
        return res.status(500).json({ error: "Failed to add dummy contract", details: contractErr.message });
      }

      // Insert a dummy posting for the new doctor
      const insertPostingQuery = `
        INSERT INTO postings 
        (mcr_number, academic_year, school_name, posting_number, total_training_hour, rating) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const postingValues = [
        mcr_number,
        1990, // Default academic year outside standard range
        "Default School", // Default school name
        1, // Default posting number
        0, // Default training hours
        null, // Null rating
      ];

      db.query(insertPostingQuery, postingValues, (postingErr, postingData) => {
        if (postingErr) {
          console.error("Error inserting dummy posting:", postingErr.message);
          return res.status(500).json({ error: "Failed to add dummy posting", details: postingErr.message });
        }

        // Successfully added all entries
        return res.status(201).json({
          message: "New staff details, dummy contract, and dummy posting added successfully",
          doctorData,
          contractData,
          postingData,
        });
      });
    });
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
// POST REQUEST FOR POSTINGS --> will automatically update the total training hours
// -------------------------------------------------------------------------------------------------------------//
app.post("/postings", verifyToken, async (req, res) => {
  const {
    mcr_number,
    academic_year,
    school_name,
    posting_number,
    total_training_hour,
    rating,
  } = req.body;

  // Input validation
  if (
    !mcr_number ||
    !academic_year ||
    !school_name ||
    !posting_number ||
    !total_training_hour ||
    rating === undefined
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const query = `
      INSERT INTO postings 
      (mcr_number, academic_year, school_name, posting_number, total_training_hour, rating) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [
      mcr_number,
      academic_year,
      school_name,
      posting_number,
      total_training_hour,
      rating,
    ];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error("Database insertion error:", err);
        return res.status(500).json({ error: "Failed to add new posting" });
      }

      res.status(201).json({ message: "New posting added successfully" });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "An error occurred while adding posting" });
  }
});

// -------------------------------------------------------------------------------------------------------------//
// GET REQUEST FOR POSTINGS
// -------------------------------------------------------------------------------------------------------------//
// Get all postings for a specific doctor, academic year, or school
// GET REQUEST FOR POSTINGS
// Get all postings for a specific doctor, academic year, or school
// GET REQUEST FOR POSTINGS
// Get all postings for a specific doctor, academic year, or school
app.get("/postings", async (req, res) => {
  const { mcr_number, academic_year, school_name } = req.query;

  try {
    // Build the base query
    let query = `SELECT mcr_number, academic_year, school_name, posting_number, total_training_hour, rating FROM postings WHERE 1=1`;
    const params = [];

    // Add filtering conditions based on query parameters
    if (mcr_number) {
      query += ` AND mcr_number = ?`;
      params.push(mcr_number);
    }
    if (academic_year) {
      query += ` AND academic_year = ?`;
      params.push(academic_year);
    }
    if (school_name) {
      query += ` AND school_name = ?`;
      params.push(school_name);
    }

    // Execute the query
    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res
          .status(500)
          .json({ error: "Database query error", details: err.message });
      }

      // Return the postings, even if empty
      res.status(200).json(results);
    });
  } catch (error) {
    console.error("Unexpected error in /postings route:", error);
    res.status(500).json({ error: "Unexpected error", details: error.message });
  }
});

// -------------------------------------------------------------------------------------------------------------//
// Database connection and Server Start
// -------------------------------------------------------------------------------------------------------------//
db.connect((err) => {
  if (err) {
    console.log("Error connecting to the database:", err);
  } else {
    console.log("Connection Successful. Backend server is running!");
  }
});

app.listen(3001, () => {
  console.log("Connection Successful. Backend server is running!");
});
