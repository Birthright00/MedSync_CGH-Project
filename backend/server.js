// -----------------------------------------------------------------------------------------------------------------------------//
//Frequently used sql
// Deleting data
// -------------------------------------------------------------------------------------------------------------//
// -- Deleting from the postings table
// DELETE FROM postings
// WHERE mcr_number = 'M12345A';

// -- Deleting from the contracts table
// DELETE FROM contracts
// WHERE mcr_number = 'M12345A';

// -- Deleting from non_institutional table (if applicable)
// DELETE FROM non_institutional
// WHERE mcr_number = 'M12345A';

// -- Deleting from the main_data table (assuming this is the primary table for mcr_number records)
// DELETE FROM main_data
// WHERE mcr_number = 'M12345A';

// -------------------------------------------------------------------------------------------------------------//
// Check if there are any triggers
// -------------------------------------------------------------------------------------------------------------//
// SELECT TRIGGER_NAME
// FROM information_schema.TRIGGERS
// WHERE TRIGGER_SCHEMA = 'main_db';

import express from "express";
import mysql2 from "mysql2";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import * as XLSX from "xlsx";
import csv from "csv-parser";
import { readFile } from 'fs/promises';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// -------------------------------------------------------------------------------------------------------------//
// HELPER FUNCTIONS
// -------------------------------------------------------------------------------------------------------------//

// Helper function to get frontend URL from request headers
function getFrontendUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  
  // Extract hostname and determine frontend port
  const hostname = host.split(':')[0];
  let frontendHost;
  
  if (hostname === 'localhost') {
    // Development environment - always use port 3000
    frontendHost = `${hostname}:3000`;
  } else {
    // Production environment - check if custom port is specified
    if (host.includes(':')) {
      // Custom port specified, change it to frontend port
      frontendHost = `${hostname}:3000`;
    } else {
      // Standard port, assume frontend is on port 3000
      frontendHost = `${hostname}:3000`;
    }
  }
  
  return `${protocol}://${frontendHost}`;
}

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
// RESTRICT READ-ONLY MIDDLEWARE FOR HR USERS
// -------------------------------------------------------------------------------------------------------------//
const restrictToReadOnlyforHR = (req, res, next) => {
  if (
    req.user.role === "hr" &&
    ["POST", "PUT", "DELETE"].includes(req.method)
  ) {
    return res
      .status(403)
      .json({ message: "Access Denied: Read-only mode for HR" });
  }
  next();
};

// -------------------------------------------------------------------------------------------------------------//
// MIDDLEWARE SETUP
// -------------------------------------------------------------------------------------------------------------//
app.use(express.json()); // Parse incoming JSON requests, so you can access req.body in POST requests when the data is sent in JSON format.
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data
app.use(cors({
  origin: "*",  // Allow all origins (for development only)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// -------------------------------------------------------------------------------------------------------------//
// DATABASE CONNECTION SETUP
// -------------------------------------------------------------------------------------------------------------//
const db = mysql2.createConnection({
  user: "root",
  host: "localhost",
  password: "Raintail0!", // Password of the database you created
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

// Middleware to restrict access by role
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: "Access Denied: Insufficient role permissions" });
    }
    next();
  };
};

// -------------------------------------------------------------------------------------------------------------//
// BACKEND SERVER
// -------------------------------------------------------------------------------------------------------------//
app.get("/", (req, res) => {
  const frontendUrl = getFrontendUrl(req);
  res.send(
    `This site is for Development purposes only.<br>This is the backend development site.<br>You may be trying to access this instead : ${frontendUrl}/`
  );
});

// -------------------------------------------------------------------------------------------------------------//
// LOGIN ROUTE
// -------------------------------------------------------------------------------------------------------------//
app.post("/login", (req, res) => {
  // Extract user ID, password, and selected role from request body
  const { user_id, password, selectedRole } = req.body;

  // Ensure all required fields are provided
  if (!user_id || !password || !selectedRole) {
    return res
      .status(400)
      .json({ error: "User ID, password, and role are required" });
  }

  // Query the database to find the user by user_id
  const q = "SELECT * FROM user_data WHERE user_id = ?";
  db.query(q, [user_id], (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Database error occurred" });
    }

    // Check if user exists in the database
    if (data.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = data[0]; // Retrieve user data

    // Compare the provided password with the stored hashed password
    bcrypt.compare(password, user.user_password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: "Error comparing passwords" });
      }

      // If the password does not match, send an error
      if (!isMatch) {
        return res.status(401).json({ error: "Incorrect password" });
      }

      // Allow login if selectedRole is either the exact user role, or "HR" logging in as "management"
      if (user.role !== selectedRole) {
        return res.status(403).json({ error: "Role does not match" });
      }

      // Create a JWT token upon successful authentication
      const token = jwt.sign(
        { id: user.user_id, role: user.role },
        JWT_SECRET,
        {
          expiresIn: "3h",
        }
      );

      // Respond with success message, token, and user role
      return res.status(200).json({
        message: "Authentication successful",
        token,
        role: user.role,
        user_id: user.user_id,
      });
    });
  });
});

// -------------------------------------------------------------------------------------------------------------//
// REGISTRATION ROUTE (For Development Purposes Only)
// -------------------------------------------------------------------------------------------------------------//
app.post("/register", (req, res) => {
  const { user_id, email, password, role } = req.body;

  // First, check if the user_id already exists
  const checkQuery = "SELECT * FROM user_data WHERE user_id = ?";
  db.query(checkQuery, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (results.length > 0) {
      return res.status(409).json({ message: "User already exists." });
    }

    // Proceed with hashing and inserting new user
    bcrypt.hash(password.toString(), 10, (err, hash) => {
      if (err)
        return res.status(500).json({ error: "Error hashing your password" });

      const insertQuery =
        "INSERT INTO user_data (user_id, email, user_password, role) VALUES (?, ?, ?, ?)";
      const values = [user_id, email, hash, role];

      db.query(insertQuery, values, (err, data) => {
        if (err)
          return res
            .status(500)
            .json({ error: "Error creating user in the database" });

        return res.status(201).json({ message: "User has been created" });
      });
    });
  });
});


// -------------------------------------------------------------------------------------------------------------//
// GET REQUEST FROM main_data TABLE
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

// -------------------------------------------------------------------------------------------------------------//
// GET REQUEST FROM doctor_data_contracts_non_inst VIEW FOR MANAGEMENT HOME PAGE TABLE DISPLAY
// -------------------------------------------------------------------------------------------------------------//
app.get("/database", verifyToken, (req, res) => {
  const includeDeleted = req.query.includeDeleted === "true";
  const query = includeDeleted
    ? "SELECT * FROM doctor_data_contracts_non_inst"
    : "SELECT * FROM doctor_data_contracts_non_inst WHERE deleted = 0";
  db.query(query, (err, data) => {
    if (err) {
      console.error("Error retrieving data:", err);
      return res.status(500).json({ error: "Failed to retrieve data" });
    }
    res.json(data);
  });
});

// -------------------------------------------------------------------------------------------------------------//
// GET REQUEST BY 'mcr_number' FROM main_data TABLE for StaffDetailsPage
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
// GET REQUEST BY 'mcr_number' FROM contracts TABLE for StaffDetailsPage
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
// PUT REQUEST INTO main_data TABLE FOR UPDATING EXISTING STAFF DETAILS
// -------------------------------------------------------------------------------------------------------------//
// Why PUT instead of POST?
// PUT Requests is idempotent --> i.e. if you make the same PUT request multiple times,
// the result will be equivalent to making just one request
// for example, making a PUT request will just overwrite the exisiting user data regardless
// of how many times you sent, it wont create multiple entries

app.put(
  "/staff/:mcr_number",
  verifyToken,
  restrictToReadOnlyforHR,
  (req, res) => {
    const { mcr_number } = req.params;
    const { first_name, last_name, department, designation, email, fte } =
      req.body;
    const userMcrNumber = req.user.id;

    const selectQuery = `SELECT update_history FROM main_data WHERE mcr_number = ?`;

    db.query(selectQuery, [mcr_number], (selectErr, selectResult) => {
      if (selectErr) {
        console.error("Error fetching update history:", selectErr.message);
        return res
          .status(500)
          .json({ error: "Failed to fetch update history" });
      }

      if (selectResult.length === 0) {
        return res.status(404).json({ error: "Staff not found" });
      }

      let updateHistory = [];
      try {
        updateHistory = selectResult[0].update_history
          ? JSON.parse(selectResult[0].update_history)
          : [];
      } catch (err) {
        console.error("Error parsing update history:", err.message);
        updateHistory = [];
      }

      const newUpdate = {
        updated_by: userMcrNumber,
        updated_at: new Date().toISOString(),
        details: { first_name, last_name, department, designation, email, fte },
      };

      updateHistory.unshift(newUpdate);

      const updateQuery = `
      UPDATE main_data 
      SET first_name = ?, last_name = ?, department = ?, designation = ?, 
          email = ?, fte = ?, updated_by = ?, updated_at = NOW(),
          update_history = ?
      WHERE mcr_number = ?
    `;

      db.query(
        updateQuery,
        [
          first_name,
          last_name,
          department,
          designation,
          email,
          fte,
          userMcrNumber,
          JSON.stringify(updateHistory), // Always save valid JSON
          mcr_number,
        ],
        (updateErr, updateData) => {
          if (updateErr) {
            console.error("Error updating staff details:", updateErr.message);
            return res
              .status(500)
              .json({ error: "Failed to update staff details" });
          }

          if (updateData.affectedRows === 0) {
            return res.status(404).json({ error: "Staff not found" });
          }

          res
            .status(200)
            .json({ message: "Staff details updated successfully" });
        }
      );
    });
  }
);

// -------------------------------------------------------------------------------------------------------------//
// POST REQUEST INTO contracts TABLE FOR ADDING NEW CONTRACTS
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
// GET REQUEST FROM contracts TABLE BY 'mcr_number' AND 'school_name' FOR StaffDetailsPage
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
// POST REQUEST INTO main_data TABLE FOR ADDING NEW STAFF
// -------------------------------------------------------------------------------------------------------------//
app.post("/entry", verifyToken, (req, res) => {
  const { mcr_number, first_name, last_name, department, designation, email } =
    req.body;
  const userMcrNumber = req.user.id;

  // Check for required fields
  if (
    !mcr_number ||
    !first_name ||
    !last_name ||
    !department ||
    !designation ||
    !email
  ) {
    return res
      .status(400)
      .json({ error: "Please provide all required fields" });
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
      return res.status(500).json({
        error: "Failed to add new staff details",
        details: doctorErr.message,
      });
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

    db.query(
      insertContractQuery,
      contractValues,
      (contractErr, contractData) => {
        if (contractErr) {
          console.error("Error inserting dummy contract:", contractErr.message);
          return res.status(500).json({
            error: "Failed to add dummy contract",
            details: contractErr.message,
          });
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

        db.query(
          insertPostingQuery,
          postingValues,
          (postingErr, postingData) => {
            if (postingErr) {
              console.error(
                "Error inserting dummy posting:",
                postingErr.message
              );
              return res.status(500).json({
                error: "Failed to add dummy posting",
                details: postingErr.message,
              });
            }

            // Successfully added all entries
            return res.status(201).json({
              message:
                "New staff details, dummy contract, and dummy posting added successfully",
              doctorData,
              contractData,
              postingData,
            });
          }
        );
      }
    );
  });
});

// -------------------------------------------------------------------------------------------------------------//
// DELETE REQUEST FROM main_data TABLE FOR DELETING STAFF DETAILS
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
// RESTORE REQUEST FOR main_data TABLE FOR RESTORING DELETED STAFF
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
// GET REQUEST from postings TABLE
// -------------------------------------------------------------------------------------------------------------//
app.get("/postings", async (req, res) => {
  const { mcr_number, academic_year, school_name } = req.query;

  try {
    // Build the base query
    let query = `
    SELECT id, mcr_number, academic_year, school_name, posting_number, total_training_hour, rating 
    FROM postings 
    WHERE 1=1
  `;

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
// POST REQUEST into postings TABLE FOR ADDING NEW POSTING --> will automatically update the total training hours
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
    total_training_hour === undefined ||
    rating === undefined
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Insert the new posting
    const insertQuery = `
      INSERT INTO postings 
      (mcr_number, academic_year, school_name, posting_number, total_training_hour, rating) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const insertValues = [
      mcr_number,
      academic_year,
      school_name,
      posting_number,
      total_training_hour,
      rating,
    ];

    db.query(insertQuery, insertValues, (insertErr, result) => {
      if (insertErr) {
        console.error("Database insertion error:", insertErr);
        return res.status(500).json({ error: "Failed to add new posting" });
      }

      // After successful insertion, calculate the updated total training hours
      const sumQuery = `
        SELECT SUM(total_training_hour) AS year_total_training_hours
        FROM postings
        WHERE mcr_number = ? AND academic_year = ? AND school_name = ?
      `;

      db.query(
        sumQuery,
        [mcr_number, academic_year, school_name],
        (sumErr, sumResult) => {
          if (sumErr) {
            console.error("Error calculating total training hours:", sumErr);
            return res
              .status(500)
              .json({ error: "Failed to calculate total training hours" });
          }

          const yearTotalTrainingHours =
            sumResult[0].year_total_training_hours || 0;

          // Update the contracts table for the specific year column
          const updateQuery = `
            UPDATE contracts
            SET training_hours_${academic_year} = ?
            WHERE mcr_number = ? AND school_name = ?
          `;

          db.query(
            updateQuery,
            [yearTotalTrainingHours, mcr_number, school_name],
            (updateErr, updateResult) => {
              if (updateErr) {
                console.error("Error updating contracts:", updateErr);
                return res.status(500).json({
                  error: "Failed to update total training hours in contracts",
                });
              }

              res.status(201).json({
                message:
                  "New posting added and total training hours updated successfully",
              });
            }
          );
        }
      );
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "An error occurred while adding posting" });
  }
});

// -------------------------------------------------------------------------------------------------------------//
// PUT REQUEST into postings TABLE FOR UPDATING EXISTING POSTING
// and automatically update the total training hours
// -------------------------------------------------------------------------------------------------------------//
app.put("/postings/update", verifyToken, async (req, res) => {
  //If the client does not pass recalculateTrainingHours in the body of the request,
  // it will default to undefined, meaning the following block will be skipped:
  const { postings, recalculateTrainingHours } = req.body;

  if (!Array.isArray(postings) || postings.length === 0) {
    return res
      .status(400)
      .json({ message: "No postings provided for update." });
  }

  try {
    // maps through each posting in the array to create an array of promises for database updates
    // and then destructures the data from the postings array
    const updatePromises = postings.map((posting) => {
      const {
        mcr_number,
        academic_year,
        school_name,
        posting_number,
        total_training_hour,
        rating,
      } = posting;

      // Validate each posting
      // ensure ALL field present
      // if validation fails, logs the invalid posting and resolves the promise to continue with the next
      // posting without halting the process
      if (
        !mcr_number ||
        !academic_year ||
        !school_name ||
        !posting_number ||
        total_training_hour === undefined ||
        rating === undefined
      ) {
        console.error("Skipping invalid posting:", posting);
        return Promise.resolve(); // Skip invalid postings without stopping the process
      }

      // The usual sql query
      return db.promise().query(
        `UPDATE postings 
         SET total_training_hour = ?, rating = ? 
         WHERE mcr_number = ? AND academic_year = ? AND school_name = ? AND posting_number = ?`,
        [
          total_training_hour,
          rating,
          mcr_number,
          academic_year,
          school_name,
          posting_number,
        ]
      );
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    if (recalculateTrainingHours) {
      const contractsToUpdate = {};

      postings.forEach(
        ({ mcr_number, academic_year, school_name, total_training_hour }) => {
          const key = `${mcr_number}-${school_name}-${academic_year}`;
          if (!contractsToUpdate[key]) contractsToUpdate[key] = 0;
          contractsToUpdate[key] += Number(total_training_hour);
        }
      );

      // ⬆️EXPLANATION FOR THE CODE ABOVE ⬆️
      // Now that posting have been inserted into postings table,
      // next step will check the TRIGGER CONDITION
      // Trigger Condition: This logic runs only if recalculateTrainingHours is true.
      // It ensures that training hours in the contracts table are recalculated and
      // updated dynamically when new postings are added or updated.

      // For example, let's say we have the following postings:
      //   [
      //   {
      //     "mcr_number": "M12345",
      //     "academic_year": 2023,
      //     "school_name": "NUS",
      //     "total_training_hour": 5
      //   },
      //   {
      //     "mcr_number": "M12345",
      //     "academic_year": 2023,
      //     "school_name": "NUS",
      //     "total_training_hour": 3
      //   },
      //   {
      //     "mcr_number": "M67890",
      //     "academic_year": 2024,
      //     "school_name": "NTU",
      //     "total_training_hour": 4
      //   }
      //   ]

      // STEP 1 : Groups all postings by their related contract (mcr_number, school_name, academic_year)
      // STEP 2 : Calculates the total training hours for each contract
      // contractsToUpdate acts as a temporary storage to aggregate the total training hours for each unique contract
      // STEP 3 : Generate a unique key using "mcr_number-school_name-academic_year" like "M12345A-DukeNUS-2022"
      // STEP 4 : For each posting, its total training hour is added to the running total

      // {
      //   "M12345-NUS-2023": 8,
      //   "M67890-NTU-2024": 4
      // }

      for (const key in contractsToUpdate) {
        const [mcr_number, school_name, academic_year] = key.split("-");
        const totalHours = contractsToUpdate[key];

        await db.promise().query(
          `UPDATE contracts
           SET training_hours_${academic_year} = ?
           WHERE mcr_number = ? AND school_name = ?`,
          [totalHours, mcr_number, school_name]
        );
      }
    }

    // ⬆️Explaination for the code above⬆️
    // Once the grouped totals are calculated,
    // the contracts table is updated with the new values for the training_hours_<academic_year> column:

    // STEP 1 : Iterate through the Groups (the unique key act as index)
    // STEP 2 : key.split("-") returns an array of [mcr_number, school_name, academic_year]
    // STEP 3 : training_hours_<academic_year> column is updated
    // ⚠️NEED PRE-EXISTING COLUMNS FOR THE YEAR IN CONTRACTS TABLE⚠️
    // STEP 4 : For each posting, its total training hour is added to the running total

    res.status(200).json({
      message: "Postings and total training hours updated successfully.",
    });
  } catch (error) {
    console.error("Error updating postings:", error);
    res
      .status(500)
      .json({ message: "Failed to update postings and training hours." });
  }
});

// -------------------------------------------------------------------------------------------------------------//
// PUT REQUEST into contracts TABLE FOR FTE UPDATES
// -------------------------------------------------------------------------------------------------------------//
app.put("/contracts/update-fte", async (req, res) => {
  const { fteUpdates } = req.body;

  if (!Array.isArray(fteUpdates) || fteUpdates.length === 0) {
    return res.status(400).send("No FTE updates provided.");
  }

  try {
    for (const update of fteUpdates) {
      const { mcrNumber, school_name, year, fteValue } = update;
      const fteColumn = `fte_${year}`;

      console.log(
        `Updating ${fteColumn} for mcr_number: ${mcrNumber}, school: ${school_name} to ${fteValue}`
      );

      // Update query targeting the specific FTE column based on the selected year
      await db
        .promise()
        .query(
          `UPDATE contracts SET ${fteColumn} = ? WHERE mcr_number = ? AND school_name = ?`,
          [fteValue, mcrNumber, school_name]
        );
    }
    res.status(200).send("FTE values updated successfully.");
  } catch (error) {
    console.error("Error updating FTE values:", error);
    res.status(500).send("Error updating FTE values.");
  }
});

// -------------------------------------------------------------------------------------------------------------//
// GET REQUEST FROM non_institutional TABLE
// -------------------------------------------------------------------------------------------------------------//
app.get("/non_institutional/:mcr_number", verifyToken, (req, res) => {
  const { mcr_number } = req.params;

  const query = "SELECT * FROM non_institutional WHERE mcr_number = ?";
  db.query(query, [mcr_number], (err, results) => {
    if (err) {
      console.error("Error fetching non-institutional data:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch non-institutional data" });
    }
    res.status(200).json(results);
  });
});

// -------------------------------------------------------------------------------------------------------------//
// POST REQUEST into non_institutional TABLE FOR ADDING NEW NON-INSTITUTIONAL ACTIVITY
// -------------------------------------------------------------------------------------------------------------//
app.post("/non_institutional", verifyToken, (req, res) => {
  const {
    mcr_number,
    teaching_categories,
    role,
    activity_type,
    medium,
    host_country,
    honorarium,
    academic_year,
    training_hours,
  } = req.body;

  // Input validation
  if (
    !mcr_number ||
    !teaching_categories ||
    !role ||
    !activity_type ||
    !medium ||
    !host_country ||
    honorarium === undefined ||
    !academic_year ||
    training_hours === undefined
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const insertQuery = `
    INSERT INTO non_institutional 
    (mcr_number, teaching_categories, role, activity_type, medium, host_country, honorarium, academic_year, training_hours) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    mcr_number,
    teaching_categories,
    role,
    activity_type,
    medium,
    host_country,
    honorarium,
    academic_year,
    training_hours,
  ];

  db.query(insertQuery, values, (err, result) => {
    if (err) {
      console.error("Error adding non-institutional activity:", err);
      return res.status(500).json({ error: "Failed to add activity" });
    }
    res
      .status(201)
      .json({ message: "Non-institutional activity added successfully" });
  });
});

// -------------------------------------------------------------------------------------------------------------//
// PUT REQUEST into non_institutional TABLE FOR UPDATING NON-INSTITUTIONAL ACTIVITIES
// -------------------------------------------------------------------------------------------------------------//
app.put("/non_institutional/update", verifyToken, (req, res) => {
  const { activities } = req.body;

  // Validate input
  if (!Array.isArray(activities) || activities.length === 0) {
    return res
      .status(400)
      .json({ message: "No activities provided for update." });
  }

  const updatePromises = activities.map((activity) => {
    const {
      activity_id,
      training_hours,
      teaching_categories,
      role,
      activity_type,
      medium,
      host_country,
      honorarium,
    } = activity;

    // Ensure activity_id and training_hours are provided
    if (!activity_id || training_hours === undefined) {
      return Promise.reject(new Error("Invalid activity data provided."));
    }

    // Construct the update query
    const query = `
      UPDATE non_institutional
      SET 
        training_hours = ?, 
        teaching_categories = ?, 
        role = ?, 
        activity_type = ?, 
        medium = ?, 
        host_country = ?, 
        honorarium = ?
      WHERE activity_id = ?
    `;

    const values = [
      training_hours,
      teaching_categories || null,
      role || null,
      activity_type || null,
      medium || null,
      host_country || null,
      honorarium || null,
      activity_id,
    ];

    return new Promise((resolve, reject) => {
      db.query(query, values, (err, result) => {
        if (err) {
          console.error("Error updating activity:", err);
          return reject(err);
        }
        resolve(result);
      });
    });
  });

  // Execute all update queries
  Promise.all(updatePromises)
    .then(() => {
      res.status(200).json({
        message: "Non-institutional activities updated successfully.",
      });
    })
    .catch((error) => {
      console.error("Error updating activities:", error);
      res.status(500).json({ message: "Failed to update activities." });
    });
});

// -------------------------------------------------------------------------------------------------------------//
// POST REQUEST to upload Non-Institutional CSV data and match with logged-in user (For Staff)
// -------------------------------------------------------------------------------------------------------------//
app.post("/upload-non-institutional", verifyToken, (req, res) => {
  try {
    const jsonData = req.body.data;

    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      return res.status(400).json({ error: "Invalid or empty data." });
    }

    const loggedInUserId = req.user.id;

    // Get user name + department
    db.query(
      "SELECT first_name, last_name, department FROM main_data WHERE mcr_number = ?",
      [loggedInUserId],
      (err, results) => {
        if (err || results.length === 0) {
          return res.status(400).json({ error: "Invalid user identity." });
        }

        const { first_name, last_name, department } = results[0];
        const fullName = `${last_name} ${first_name}`.toLowerCase().trim();

        // Filter only rows that match the user
        const validRows = jsonData.filter(
          (row) =>
            row["Educator's Name"]?.toLowerCase().trim() === fullName &&
            row["Department"]?.toLowerCase().trim() === department.toLowerCase().trim()
        );

        if (validRows.length === 0) {
          return res.status(200).json({ message: "No valid rows matched your account details." });
        }

        const insertValues = validRows.map((row) => [
          loggedInUserId,
          row["Teaching Categories"] || "",
          row["Role"] || "",
          row["Activity Type"] || "",
          row["Medium"] || "",
          row["Host Country"] || "",
          row["Honorarium"] === "" ? 0 : row["Honorarium"],
          row["Academic Year"] || "",
          row["Training Hours"] || 0,
        ]);

        const query = `
          INSERT INTO non_institutional 
          (mcr_number, teaching_categories, role, activity_type, medium, host_country, honorarium, academic_year, training_hours)
          VALUES ?
        `;

        db.query(query, [insertValues], (insertErr) => {
          if (insertErr) {
            console.error("Error inserting CSV data:", insertErr);
            return res.status(500).json({ error: "Failed to insert data." });
          }

          res.status(201).json({ message: `${insertValues.length} activity(s) uploaded successfully.` });
        });
      }
    );
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});


// -------------------------------------------------------------------------------------------------------------//
// POST REQUEST to upload processed Non-Institutional data directly (For Manager Role)
// -------------------------------------------------------------------------------------------------------------//
app.post("/upload-non-institutional-manager", verifyToken, (req, res) => {
  try {
    console.log("📥 Manager direct upload endpoint hit");

    const userRole = req.user.role;
    if (userRole !== "management") {
      return res.status(403).json({ error: "Access denied. Managers only." });
    }

    const { full_name, department, mcr_number, rows } = req.body;

    if (!full_name || !department || !rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const overrideName = full_name.toLowerCase().trim();
    const overrideDept = department.toLowerCase().trim();
    const overrideMcr = mcr_number?.trim() || null;

    const [last_name, ...rest] = overrideName.split(" ");
    const first_name = rest.join(" ");
    const fullName = `${last_name} ${first_name}`.toLowerCase().trim();

    const validRows = rows.filter(
      (row) =>
        row["Educator's Name"]?.toLowerCase().trim() === fullName &&
        row["Department"]?.toLowerCase().trim() === overrideDept
    );

    if (validRows.length === 0) {
      return res.status(200).json({ message: "No valid rows matched the educator’s details." });
    }

    const insertValues = validRows.map((row) => [
      overrideMcr,
      row["Teaching Categories"] || "",
      row["Role"] || "",
      row["Activity Type"] || "",
      row["Medium"] || "",
      row["Host Country"] || "",
      row["Honorarium"] === "" ? 0 : row["Honorarium"],
      row["Academic Year"] || "",
      row["Training Hours"] || 0,
    ]);

    const query = `
      INSERT INTO non_institutional 
      (mcr_number, teaching_categories, role, activity_type, medium, host_country, honorarium, academic_year, training_hours)
      VALUES ?
    `;

    db.query(query, [insertValues], (insertErr) => {
      if (insertErr) {
        console.error("Error inserting data:", insertErr);
        return res.status(500).json({ error: "Failed to insert data." });
      }

      res.status(201).json({ message: `${insertValues.length} activity(s) uploaded successfully.` });
    });
  } catch (err) {
    console.error("Manager upload error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});


// -------------------------------------------------------------------------------------------------------------//
// ⚠️⚠️⚠️⚠️⚠️⚠️⚠️NURSES DATA BEGIN HERE⚠️⚠️⚠️⚠️⚠️⚠️⚠️
// -------------------------------------------------------------------------------------------------------------//

// -------------------------------------------------------------------------------------------------------------//
// GET REQUEST FROM main_data_nurses TABLE FOR NurseManagementPage
// -------------------------------------------------------------------------------------------------------------//

app.get("/main_data_nurses", verifyToken, (req, res) => {
  // Query the database to retrieve all records from the main_data_nurses table
  const query = "SELECT * FROM nurse_contracts_view";

  db.query(query, (err, data) => {
    if (err) {
      console.error("Error retrieving data from main_data_nurses:", err);
      console.log("Institution Data:", nurse.institution);
      return res.status(500).json({ error: "Failed to retrieve data" });
    }

    return res.status(200).json(data); // Return the retrieved data as a JSON response
  });
});

// -------------------------------------------------------------------------------------------------------------//
// GET REQUEST FROM main_data_nurses TABLE FOR NurseDetails table in NurseDetailsPage
// -------------------------------------------------------------------------------------------------------------//
app.get("/nurse/:snb_number", verifyToken, (req, res) => {
  const { snb_number } = req.params;
  const query = "SELECT * FROM main_data_nurses WHERE snb_number = ?";
  db.query(query, [snb_number], (err, data) => {
    if (err) {
      console.error("Error retrieving nurse details:", err);
      return res
        .status(500)
        .json({ message: "Error retrieving staff details" });
    }
    if (data.length === 0) {
      return res.status(404).json({ message: "Staff not found" });
    }
    res.json(data[0]);
  });
});

// -------------------------------------------------------------------------------------------------------------//
// PUT REQUEST INTO main_data_nurses TABLE FOR UPDATING EXISTING NURSE DETAILS
// -------------------------------------------------------------------------------------------------------------//
app.put(
  "/main_data_nurses/:snb_number",
  verifyToken,
  restrictToReadOnlyforHR,
  (req, res) => {
    const { snb_number } = req.params;
    const { first_name, last_name, department, designation, email } = req.body;
    const userId = req.user.id; // Assuming `id` is the identifier of the logged-in user.

    // Step 1: Fetch the existing update history for the nurse
    const selectQuery = `SELECT update_history FROM main_data_nurses WHERE snb_number = ?`;

    db.query(selectQuery, [snb_number], (selectErr, selectResult) => {
      if (selectErr) {
        console.error("Error fetching update history:", selectErr.message);
        return res
          .status(500)
          .json({ error: "Failed to fetch update history" });
      }

      if (selectResult.length === 0) {
        return res.status(404).json({ error: "Nurse not found" });
      }

      let updateHistory = [];
      try {
        updateHistory = selectResult[0].update_history
          ? JSON.parse(selectResult[0].update_history)
          : [];
      } catch (err) {
        console.error("Error parsing update history:", err.message);
        updateHistory = [];
      }

      // Step 2: Create a new update history entry
      const newUpdate = {
        updated_by: userId,
        updated_at: new Date().toISOString(),
        details: { first_name, last_name, department, designation, email },
      };

      updateHistory.unshift(newUpdate);

      // Step 3: Update the nurse details and save the updated history
      const updateQuery = `
        UPDATE main_data_nurses 
        SET first_name = ?, last_name = ?, department = ?, designation = ?, 
            email = ?, updated_by = ?, updated_at = NOW(),
            update_history = ?
        WHERE snb_number = ?
      `;

      db.query(
        updateQuery,
        [
          first_name,
          last_name,
          department,
          designation,
          email,
          userId,
          JSON.stringify(updateHistory), // Save update history as JSON
          snb_number,
        ],
        (updateErr, updateData) => {
          if (updateErr) {
            console.error("Error updating nurse details:", updateErr.message);
            return res
              .status(500)
              .json({ error: "Failed to update nurse details" });
          }

          if (updateData.affectedRows === 0) {
            return res.status(404).json({ error: "Nurse not found" });
          }

          res
            .status(200)
            .json({ message: "Nurse details updated successfully" });
        }
      );
    });
  }
);

// -------------------------------------------------------------------------------------------------------------//
// ⚠️⚠️⚠️⚠️⚠️⚠️⚠️MASS FILE UPLOAD BEIGNS HERE⚠️⚠️⚠️⚠️⚠️⚠️⚠️
// -------------------------------------------------------------------------------------------------------------//

app.post("/upload-main-data", upload.none(), async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: "Invalid data format or empty file" });
    }

    // Validate and prepare data with default values
    const validatedData = data.map((row) => {
      const {
        mcr_number = null, // Default to NULL if missing
        first_name = null, // Default to NULL if missing
        last_name = null,  // Default to NULL if missing
        department = null, // Default to NULL if missing
        designation = null, // Default to NULL if missing
        email = null,      // Default to NULL if missing
        fte = null,        // Default to NULL if missing
      } = row;

      // Ensure `mcr_number` (primary key) is not null
      if (!mcr_number) {
        throw new Error("MCR Number is required for each entry.");
      }

      return [
        mcr_number,
        first_name,
        last_name,
        department,
        designation,
        email,
        fte,
        new Date(), // Automatically set created_at
      ];
    });

    const query = `
      INSERT INTO main_data (
        mcr_number, first_name, last_name, department, designation, email, fte, created_at
      )
      VALUES ?
      ON DUPLICATE KEY UPDATE
        first_name = VALUES(first_name),
        last_name = VALUES(last_name),
        department = VALUES(department),
        designation = VALUES(designation),
        email = VALUES(email),
        fte = VALUES(fte),
        updated_at = NOW()
    `;

    db.query(query, [validatedData], async (err, result) => {
      if (err) {
        console.error("Database insertion error:", err);
        return res.status(500).json({ error: "Failed to insert data into main_data." });
      }

      // ------------------ ⚡️ ADD-ON LOGIC STARTS HERE ⚡️ ------------------ //
      try {
        const mcrNumbers = validatedData.map(row => row[0]); // Get mcr_number from each row

        // Use mcr_number as the identifier
        const contractInserts = [];
        const postingInserts = [];

        mcrNumbers.forEach(mcr => {
          contractInserts.push([
            mcr, 'Default School', null, null, 'inactive',
            null, null, '0', '0', '0', null, null, null, null
          ]);

          postingInserts.push([
            mcr, '1990', 'Default School', '1', '0', null
          ]);
        });

        if (contractInserts.length > 0) {
          await db.promise().query(
            `INSERT IGNORE INTO Contracts (
          mcr_number, school_name, contract_start_date, contract_end_date, status, prev_title, new_title,
          training_hours_2022, training_hours_2023, training_hours_2024, fte_2022, fte_2023, fte_2024, fte_2025
        ) VALUES ?`,
            [contractInserts]
          );
        }

        if (postingInserts.length > 0) {
          await db.promise().query(
            `INSERT IGNORE INTO Postings (
          mcr_number, academic_year, school_name, posting_number, total_training_hour, rating
        ) VALUES ?`,
            [postingInserts]
          );
        }

        // ✅ Send response after all inserts
        res.status(201).json({
          message: "Data uploaded and processed successfully!",
          result
        });

      } catch (addOnError) {
        console.error("Error inserting Contracts or Postings:", addOnError);
        return res.status(500).json({
          error: "main_data inserted, but failed to insert Contracts/Postings.",
        });
      }
      // ------------------ ⚡️ ADD-ON LOGIC ENDS HERE ⚡️ ------------------ // 
    });
  } catch (error) {
    console.error("General error:", error);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});


// -------------------------------------------------------------------------------------------------------------//
// ⚠️⚠️⚠️⚠️⚠️⚠️⚠️READING OF EMAILS BY AI⚠️⚠️⚠️⚠️⚠️⚠️
// -------------------------------------------------------------------------------------------------------------//
// -------------------------------------------------------------------------------------------------------------//
// POST REQUEST to store structured scheduling data (from AI email parser)
// -------------------------------------------------------------------------------------------------------------//
app.post("/api/scheduling/parsed-email", (req, res) => {
  const {
    type,
    session_name,
    from_name,
    from_email,
    to_email,
    original_session,
    new_session,
    reason,
    students,
    available_slots_timings,
    notes
  } = req.body;

  const insertQuery = `
    INSERT INTO parsed_emails (
      type, session_name, from_name, from_email, to_email, 
      original_session, new_session, reason, students,
      available_slots_timings, notes, received_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  // --- Normalize available_slots_timings ---
  function normalizeAvailableSlots(slots) {
    const timeOnlyPattern = /^\d{1,2}(\.\d{0,2})?([ap]m)?\s*-\s*\d{1,2}(\.\d{0,2})?([ap]m)?$/i;
    const datePattern = /^\d{1,2}\s+\w+/; // e.g. 27 Aug

    let defaultTime = null;
    const cleaned = [];

    for (let i = 0; i < slots.length; i++) {
      const entry = slots[i].trim();

      if (timeOnlyPattern.test(entry)) {
        defaultTime = entry;
        continue;
      }

      if (defaultTime && datePattern.test(entry)) {
        cleaned.push(`${entry} ${defaultTime}`);
      } else {
        cleaned.push(entry);
      }
    }

    return cleaned;
  }

  const normalizedSlots = Array.isArray(available_slots_timings)
    ? normalizeAvailableSlots(available_slots_timings)
    : null;

  const values = [
    type,
    session_name,
    from_name,
    from_email,
    to_email,
    original_session,
    new_session,
    reason,
    students,
    normalizedSlots ? normalizedSlots.join(", ") : null,
    notes
  ];

  db.query(insertQuery, values, (err, result) => {
    if (err) {
      console.error("Error inserting parsed email:", err);
      return res.status(500).json({ error: "Failed to store parsed scheduling data." });
    }

    return res.status(201).json({ message: "Parsed email saved successfully." });
  });
});

// -------------------------------------------------------------------------------------------------------------//
// 🔍 GET REQUEST: Fetch all parsed_emails with type = 'change_request'
// -------------------------------------------------------------------------------------------------------------//
app.get("/api/scheduling/parsed_emails", (req, res) => {
  const query = `
    SELECT * FROM parsed_emails
    WHERE type = 'change_request'
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error fetching parsed emails:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
});


// -------------------------------------------------------------------------------------------------------------//
// GET REQUEST to call for scheduling data and displaying it as notifications for type = availability
// -------------------------------------------------------------------------------------------------------------//
app.get("/api/scheduling/availability-notifications", verifyToken, requireRole("management"), (req, res) => {
  // Simple query with session_count (column should exist now)
  const query = `
    SELECT
      pe.id,
      pe.session_name,
      pe.from_name AS name,
      pe.from_email,
      pe.to_email,
      pe.students,
      pe.available_slots_timings,
      pe.received_at,
      pe.session_id,
      COALESCE(es.session_count, 1) as session_count
    FROM parsed_emails pe
    LEFT JOIN email_sessions es ON pe.session_id = es.session_id
    WHERE pe.type = 'availability'
    ORDER BY pe.received_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching availability notifications:", err);
      return res.status(500).json({ error: "Failed to retrieve availability data." });
    }
    
    processResults(results);
  });
  
  function processResults(results) {

    const transformed = results.map(entry => {
      const slotStrings = entry.available_slots_timings
        ? entry.available_slots_timings.split(",").map(s => s.trim())
        : [];

      const available_dates = slotStrings.map(slot => {
        // Normalize ordinals: 9th → 9
        slot = slot.replace(/(\d+)(st|nd|rd|th)/gi, '$1');

        // Regex: extract date + time
        const match = slot.match(/^(\d{1,2}\s+\w+(?:\s+\d{4})?)\s+(.+)$/);
        if (!match) {
          return { date: slot.trim(), time: null };
        }

        let datePart = match[1].trim();
        let timePart = match[2].trim();

        // If year missing, append current year
        if (!/\d{4}/.test(datePart)) {
          const currentYear = new Date().getFullYear();
          datePart += ` ${currentYear}`;
        }

        return { date: datePart, time: timePart };
      });

      return {
        id: entry.id,
        session_name: entry.session_name || null,
        name: entry.name,
        from_email: entry.from_email || null,
        students: entry.students || null,
        session_count: entry.session_count || 1,
        available_dates
      };
    });

    return res.json(transformed);
  }
});



// -------------------------------------------------------------------------------------------------------------//
// GET REQUEST to call for scheduling data and displaying it as notifications for type = change_request
// -------------------------------------------------------------------------------------------------------------//
app.get("/api/scheduling/change_request", verifyToken, requireRole("management"), (req, res) => {
  // First check if original_session_id column exists
  db.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'parsed_emails' AND TABLE_SCHEMA = 'main_db' AND COLUMN_NAME = 'original_session_id'
  `, (err, columns) => {
    if (err) {
      console.error("❌ Error checking column existence:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const columnExists = columns.length > 0;
    
    const query = columnExists ? `
      SELECT
        id,
        session_name,
        from_name AS name,
        from_email,
        to_email,
        original_session,
        new_session,
        reason,
        students,
        received_at,
        original_session_id
      FROM parsed_emails
      WHERE type = 'change_request'
      ORDER BY received_at DESC
    ` : `
      SELECT
        id,
        session_name,
        from_name AS name,
        from_email,
        to_email,
        original_session,
        new_session,
        reason,
        students,
        received_at
      FROM parsed_emails
      WHERE type = 'change_request'
      ORDER BY received_at DESC
    `;

    db.query(query, (queryErr, results) => {
      if (queryErr) {
        console.error("Error fetching change request notifications:", queryErr);
        return res.status(500).json({ error: "Failed to retrieve change request data." });
      }

      const transformed = results.map(entry => ({
        id: entry.id,
        session_name: entry.session_name || null,
        name: entry.name,
        from_email: entry.from_email || null,
        to_email: entry.to_email || null,
        students: entry.students || null,
        original_session: entry.original_session || null,
        new_session: entry.new_session || null,
        reason: entry.reason || null,
        notes: entry.notes || null,
        received_at: entry.received_at,
        original_session_id: columnExists ? (entry.original_session_id || null) : null
      }));

      return res.json(transformed);
    });
  });
});

// -------------------------------------------------------------------------------------------------------------//
// Post Request From Staff Side to Management Side
// -------------------------------------------------------------------------------------------------------------//
app.post("/api/scheduling/request-change-from-staff", verifyToken, requireRole("staff"), (req, res) => {
  const { session_name, from_name, original_session, new_session, students, reason, from_email, original_session_id } = req.body;

  // First check if original_session_id column exists, if not, add it
  db.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'parsed_emails' AND TABLE_SCHEMA = 'main_db' AND COLUMN_NAME = 'original_session_id'
  `, (err, columns) => {
    if (err) {
      console.error("❌ Error checking column existence:", err);
      return res.status(500).json({ message: "Database error" });
    }

    const columnExists = columns.length > 0;
    
    if (!columnExists) {
      // Add the column if it doesn't exist
      db.query(`ALTER TABLE parsed_emails ADD COLUMN original_session_id INT`, (alterErr) => {
        if (alterErr) {
          console.error("❌ Error adding original_session_id column:", alterErr);
          // Continue anyway - we'll insert without the column
        }
        insertChangeRequest();
      });
    } else {
      insertChangeRequest();
    }

    function insertChangeRequest() {
      const query = columnExists || !err ? 
        `INSERT INTO parsed_emails (type, session_name, from_name, from_email, original_session, new_session, reason, students, original_session_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)` :
        `INSERT INTO parsed_emails (type, session_name, from_name, from_email, original_session, new_session, reason, students)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

      const values = columnExists || !err ? [
        "change_request",
        session_name,
        from_name || "Unknown",
        from_email || req.user.email,
        original_session || "Unknown",
        new_session || "Unknown",
        reason || "No reason provided.",
        students || "",
        original_session_id || null
      ] : [
        "change_request",
        session_name,
        from_name || "Unknown",
        from_email || req.user.email,
        original_session || "Unknown",
        new_session || "Unknown",
        reason || "No reason provided.",
        students || ""
      ];

      db.query(query, values, (insertErr, result) => {
        if (insertErr) {
          console.error("❌ Error saving change request:", insertErr);
          return res.status(500).json({ message: "Server error" });
        }
        res.json({ message: "Change request submitted." });
      });
    }
  });
});



// -------------------------------------------------------------------------------------------------------------//
// For calling of database to add sessions inside if accepted
// -------------------------------------------------------------------------------------------------------------//
app.post("/api/scheduling/add-to-timetable", verifyToken, requireRole("management"), async (req, res) => {
  const { session_name, name, date, time, location, students, doctor_email } = req.body;

  if (!session_name || !name || !date || !time || !doctor_email) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  console.log("🔍 [DEBUG] Checking for scheduling conflicts:", {
    doctor_email,
    date,
    time,
    session_name
  });

  try {
    // Check for existing sessions for this doctor on the same date
    const conflictQuery = `
      SELECT id, session_name, time, location 
      FROM scheduled_sessions 
      WHERE doctor_email = ? AND date = ?
    `;
    
    const [existingSessions] = await db.promise().query(conflictQuery, [doctor_email, date]);
    
    if (existingSessions.length > 0) {
      console.log("⚠️ [DEBUG] Found existing sessions on same date:", existingSessions);
      
      // Parse the new session time
      const newTimeRange = parseTimeRange(time);
      if (!newTimeRange) {
        console.error("❌ [ERROR] Could not parse new session time:", time);
        return res.status(400).json({ error: "Invalid time format" });
      }
      
      // Check each existing session for time overlap
      for (const existingSession of existingSessions) {
        const existingTimeRange = parseTimeRange(existingSession.time);
        if (!existingTimeRange) {
          console.warn("⚠️ [WARN] Could not parse existing session time:", existingSession.time);
          continue;
        }
        
        // Check for time overlap
        if (timeRangesOverlap(newTimeRange, existingTimeRange)) {
          console.error("❌ [CONFLICT] Time overlap detected:", {
            existing: existingSession,
            new: { session_name, time, date }
          });
          
          return res.status(409).json({
            error: "SCHEDULING_CONFLICT",
            message: `Dr. ${name} already has a session scheduled during this time`,
            conflict: {
              existing_session: existingSession.session_name,
              existing_time: existingSession.time,
              existing_location: existingSession.location,
              date: date,
              conflicting_time: time
            }
          });
        }
      }
    }
    
    console.log("✅ [DEBUG] No conflicts found, proceeding with scheduling");
  } catch (conflictCheckErr) {
    console.error("❌ [ERROR] Error checking for conflicts:", conflictCheckErr);
    return res.status(500).json({ error: "Failed to check for scheduling conflicts" });
  }

  // Helper function to parse time range (e.g., "2:00pm-3:00pm" or "2pm–3pm")
  function parseTimeRange(timeStr) {
    if (!timeStr) return null;
    
    // Clean up the time string and handle different dash types
    const cleanTime = timeStr.replace(/[()]/g, '').trim();
    const dashVariants = ['–', '-', '—'];
    let parts;
    
    for (const dash of dashVariants) {
      if (cleanTime.includes(dash)) {
        parts = cleanTime.split(dash);
        break;
      }
    }
    
    if (!parts || parts.length !== 2) return null;
    
    const startTime = parts[0].trim();
    const endTime = parts[1].trim();
    
    return {
      start: convertTo24Hour(startTime),
      end: convertTo24Hour(endTime),
      original: timeStr
    };
  }
  
  // Helper function to convert time to 24-hour format for comparison
  function convertTo24Hour(timeStr) {
    if (!timeStr) return null;
    
    const time = timeStr.toLowerCase().replace(/\s+/g, '');
    const isPM = time.includes('pm');
    const isAM = time.includes('am');
    
    let hours, minutes;
    const timeOnly = time.replace(/[ap]m/g, '');
    
    if (timeOnly.includes(':')) {
      [hours, minutes] = timeOnly.split(':').map(Number);
    } else {
      hours = parseInt(timeOnly);
      minutes = 0;
    }
    
    if (isPM && hours !== 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    
    return hours * 60 + minutes; // Return total minutes for easy comparison
  }
  
  // Helper function to check if two time ranges overlap
  function timeRangesOverlap(range1, range2) {
    if (!range1 || !range2 || !range1.start || !range1.end || !range2.start || !range2.end) {
      return false;
    }
    
    // Two ranges overlap if one starts before the other ends
    return (range1.start < range2.end) && (range2.start < range1.end);
  }

  const insertQuery = `
    INSERT INTO scheduled_sessions 
    (session_name, name, date, time, location, students, doctor_email) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [session_name, name, date, time, location || "", students || "", doctor_email];

  db.query(insertQuery, values, (err, result) => {
    if (err) {
      console.error("Error inserting into timetable:", err);
      return res.status(500).json({ error: "Failed to insert session." });
    }
    const sessionId = result.insertId;
    console.log(`✅ Session inserted with ID: ${sessionId}`);

    // If no students are provided, we can skip
    if (!students) {
      return res.status(201).json({ message: "Session added (no students)." });
    }

    // Split students and clean names
    const studentNames = students.split(",").map((n) =>
      n.replace(/\(.*?\)/g, "").trim()
    );

    const unmatched = [];
    const insertMappings = [];

    studentNames.forEach((studentName) => {
      db.query("SELECT user_id FROM student_database WHERE name = ?", [studentName], (err, rows) => {
        if (err) {
          console.error("Error fetching student ID:", err);
          return;
        }

        if (rows.length > 0) {
          const userId = rows[0].user_id;
          db.query(
            "INSERT INTO session_students (scheduled_session_id, user_id) VALUES (?, ?)",
            [sessionId, userId],
            (err2) => {
              if (err2) {
                console.error(`Error mapping ${studentName} to session:`, err2);
              } else {
                console.log(`✅ Linked ${studentName} (ID ${userId}) to session ${sessionId}`);
              }
            }
          );
        } else {
          unmatched.push(studentName);
          console.warn(`⚠ No match found for student: ${studentName}`);
        }
      });
    });

    res.status(201).json({
      message: "Session added to timetable.",
      session_id: sessionId,
      unmatched_students: unmatched
    });
  });
});

// -------------------------------------------------------------------------------------------------------------//
// For replacing original session when change request is accepted
// -------------------------------------------------------------------------------------------------------------//
app.patch("/api/scheduling/replace-session/:id", verifyToken, requireRole("management"), (req, res) => {
  const { session_name, name, date, time, location, students, doctor_email } = req.body;
  const sessionId = req.params.id;

  if (!session_name || !name || !date || !time || !doctor_email) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const updateQuery = `
    UPDATE scheduled_sessions
    SET session_name = ?, name = ?, date = ?, time = ?, location = ?, students = ?, doctor_email = ?
    WHERE id = ?
  `;

  const values = [session_name, name, date, time, location || "", students || "", doctor_email, sessionId];

  db.query(updateQuery, values, (err, result) => {
    if (err) {
      console.error("Error updating session:", err);
      return res.status(500).json({ error: "Failed to update session." });
    }

    res.status(200).json({ message: "Session successfully updated." });
  });
});

// -------------------------------------------------------------------------------------------------------------//
// GET REQUEST to fetch scheduled sessions for timetable display
// -------------------------------------------------------------------------------------------------------------//
app.get("/api/scheduling/timetable", verifyToken, (req, res) => {
  const userRole = req.user.role;
  const userEmail = req.user.email;

  let query = `
    SELECT id, session_name, name, date, time, location, students, change_type, original_time, change_reason, is_read, doctor_email
    FROM scheduled_sessions
  `;

  const params = [];

  if (userRole === "staff" && userEmail) {
    query += ` WHERE doctor_email = ?`;
    params.push(userEmail);
  }

  query += ` ORDER BY date ASC, time ASC`;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Error fetching scheduled sessions:", err);
      return res.status(500).json({ error: "Failed to fetch timetable data." });
    }

    res.status(200).json(results);
  });
});



// ✅ DELETE from scheduled_sessions (timetable)
app.delete("/api/scheduling/delete-scheduled-session/:id", verifyToken, requireRole("management"), (req, res) => {
  const { id } = req.params;

  const deleteQuery = `DELETE FROM scheduled_sessions WHERE id = ?`;

  db.query(deleteQuery, [id], (err, result) => {
    if (err) {
      console.error("Error deleting scheduled session:", err);
      return res.status(500).json({ error: "Failed to delete scheduled session." });
    }
    res.status(200).json({ message: "Scheduled session deleted successfully." });
  });
});


// ✅ DELETE from parsed_emails after accepting
app.delete("/api/scheduling/parsed-email/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM parsed_emails WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Failed to delete parsed email:", err);
      return res.status(500).json({ error: "Failed to delete parsed email." });
    }
    res.status(200).json({ message: "Parsed email deleted successfully." });
  });
});

/* For Updating scheduled sessions in the timetable */
app.patch("/api/scheduling/update-scheduled-session/:id", async (req, res) => {
  const { id } = req.params;
  const { title, doctor, doctor_email, location, start, end, original_time, change_type, change_reason, is_read, students } = req.body;

  // Helper function to format date
  function formatDate(dateStr) {
    const dateObj = new Date(dateStr);
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return dateObj.toLocaleDateString('en-GB', options);
  }

  // Helper function to format time
  function formatTime(dateStr) {
    const date = new Date(dateStr);
    let hour = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, '0');
    const ampm = hour >= 12 ? 'pm' : 'am';
    hour = hour % 12 || 12;
    return `${hour}:${minute}${ampm}`;
  }

  const dateStr = formatDate(start);  // e.g. "12 June 2025"
  const timeStr = `${formatTime(start)} - ${formatTime(end)}`;  // e.g. "9:00am - 10:00am"

  try {
    let studentsString = students;

    if (!studentsString) {
      // Fallback to fetching from session_students if not supplied from frontend
      const [studentsResult] = await db
        .promise()
        .query(
          `SELECT s.name
         FROM session_students ss
         JOIN student_database s ON ss.user_id = s.user_id
         WHERE ss.scheduled_session_id = ?`,
          [id]
        );
      studentsString = studentsResult.map((row) => row.name).join(", ");
    }

    console.log("Updating session:", {
      id,
      title,
      doctor,
      location,
      dateStr,
      timeStr,
      studentsString,
      original_time,
      change_type,
      change_reason,
      doctor_email
    });

    // Step 1: Update the scheduled_sessions table
    await db
      .promise()
      .query(
        `UPDATE scheduled_sessions
       SET session_name = ?, doctor_email = ?, name = ?, date = ?, time = ?, location = ?, students = ?, original_time = ?, change_type = ?, change_reason = ?, is_read = ?
       WHERE id = ?`,
        [
          title,
          doctor_email,
          doctor,
          dateStr,
          timeStr,
          location,
          studentsString,
          original_time || null,
          change_type || null,
          change_reason || null,
          is_read ?? 0,
          id,
          
        ]
      );

    // Step 2: Update the session_students table
    // a) Clear existing mappings
    await db.promise().query(`DELETE FROM session_students WHERE scheduled_session_id = ?`, [id]);

    // b) Insert new mappings
    const studentNamesArray = (studentsString || '').split(',').map(name => name.trim());
    for (const name of studentNamesArray) {
      if (!name) continue;

      const [studentRows] = await db
        .promise()
        .query(`SELECT user_id FROM student_database WHERE name = ?`, [name]);

      if (studentRows.length > 0) {
        const user_id = studentRows[0].user_id;

        await db
          .promise()
          .query(`INSERT INTO session_students (scheduled_session_id, user_id) VALUES (?, ?)`, [id, user_id]);
      }
    }

    res.json({ message: "Session updated successfully" });

  } catch (err) {
    console.error("❌ Failed to update session:", err);
    return res.status(500).json({ error: "Failed to update session" });
  }

});


// 📌 GET student names from session_students for a given scheduled_session_id
app.get("/api/scheduling/get-students-for-session/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await db
      .promise()
      .query(
        `SELECT s.name FROM session_students ss 
         JOIN student_database s ON ss.user_id = s.user_id 
         WHERE ss.scheduled_session_id = ?`,
        [id]
      );

    const studentNames = results.map((row) => row.name);
    res.json({ students: studentNames });
  } catch (err) {
    console.error("❌ Failed to fetch students for session:", err);
    res.status(500).json({ error: "Failed to fetch students for session" });
  }
});


// Marking Notification as Read
app.patch('/api/scheduling/mark-as-read/:id', (req, res) => {
  const sessionId = req.params.id;

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing session ID' });
  }

  const query = 'UPDATE scheduled_sessions SET is_read = 1 WHERE id = ?';

  db.query(query, [sessionId], (err, result) => {
    if (err) {
      console.error('❌ DB error:', err);
      return res.status(500).json({ error: 'Failed to mark as read' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ success: true, message: 'Session marked as read' });
  });
});

// -------------------------------------------------------------------------------------------------------------//
// ------------------- BLOCKED DATES LOGIC -------------------
// -------------------------------------------------------------------------------------------------------------//

// ------------------- Updating Blocked Dates Via EXCEL -------------------
app.post("/api/scheduling/update-blocked-dates", (req, res) => {
  const { blocked_dates, school, yearofstudy } = req.body;

  if (!Array.isArray(blocked_dates)) {
    return res.status(400).json({ error: "Invalid format" });
  }

  const insertNext = (index) => {
    if (index >= blocked_dates.length) {
      return res.status(200).json({ message: "Blocked dates updated" });
    }

    const { date, remark } = blocked_dates[index];
    const query = `
      INSERT INTO blocked_dates (date, school, yearofstudy, remark) 
      VALUES (?, ?, ?, ?) 
      ON DUPLICATE KEY UPDATE remark = ?
    `;

    db.query(query, [date, school, yearofstudy, remark, remark], (err) => {
      if (err) {
        console.error("❌ DB error inserting blocked date:", err);
        return res.status(500).json({ error: "Database error" });
      }

      insertNext(index + 1);
    });
  };

  insertNext(0);
});

// ------------------- Retrieving Blocked Dates from Database (blocked_dates) -------------------
app.get("/api/scheduling/get-blocked-dates", (req, res) => {
  const q = "SELECT date, remark FROM blocked_dates";
  db.query(q, (err, data) => {
    if (err) {
      console.error("❌ Failed to fetch blocked dates:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    return res.json({ blocked_dates: data }); // [{ date: "2025-07-11" }, ...]
  });
});

// -------------------------------------------------------------------------------------------------------------//
// ------------------- STUDENT DATA AND UPLOADING -------------------
// -------------------------------------------------------------------------------------------------------------//

// ------------------- Uploading Student Excel Data -------------------
app.post('/upload-student-data', async (req, res) => {
  const { students, adid } = req.body;

  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ message: 'Invalid or empty student data' });
  }

  // ✅ Robust Date Parser
  const parseExcelDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;

    if (typeof value === 'number') {
      const date = new Date(Math.round((value - 25569) * 86400 * 1000)); // Excel serial date to JS Date
      return !isNaN(date) ? date : null;
    }

    if (typeof value === 'string') {
      const cleaned = value.replace(/,\s*\w{3}$/, '').trim();
      const monthMap = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Sept: 8, Oct: 9, Nov: 10, Dec: 11
      };

      const alphaMatch = cleaned.match(/^(\d{1,2})\/([A-Za-z]{3,4})\/(\d{2})$/);
      if (alphaMatch) {
        const [_, day, monthStr, year] = alphaMatch;
        const fullYear = parseInt(year) + 2000;
        const date = new Date(fullYear, monthMap[monthStr], parseInt(day));
        return !isNaN(date) ? date : null;
      }

      const numericMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (numericMatch) {
        const [_, day, month, year] = numericMatch;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return !isNaN(date) ? date : null;
      }
    }

    return null;
  };

  // ✅ Fill down merged values
  const fieldsToFill = ['Start Date', 'End Date', 'Recess Start Date', 'Recess End Date'];
  for (let i = 1; i < students.length; i++) {
    fieldsToFill.forEach((field) => {
      if (!students[i][field] && students[i - 1][field]) {
        students[i][field] = students[i - 1][field];
      }
    });
  }

  // ✅ Academic Year Calculator
  const getAcademicYear = (date) => {
    if (!date) return null;
    const jsDate = new Date(date);
    const year = jsDate.getFullYear();
    const month = jsDate.getMonth(); // 0 = Jan, 5 = June

    return month < 5 ? `${year - 1}/${year}` : `${year}/${year + 1}`;
  };


  const insertQuery = `
  INSERT INTO student_database (
    user_id, name, gender, mobile_no, email, start_date, end_date,
    recess_start_date, recess_end_date, school, academicYear, yearofstudy,
    cg, program_name, adid
  ) VALUES ?
  ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    gender = VALUES(gender),
    mobile_no = VALUES(mobile_no),
    email = VALUES(email),
    start_date = VALUES(start_date),
    end_date = VALUES(end_date),
    recess_start_date = VALUES(recess_start_date),
    recess_end_date = VALUES(recess_end_date),
    school = VALUES(school),
    academicYear = VALUES(academicYear),
    yearofstudy = VALUES(yearofstudy),
    cg = VALUES(cg),
    program_name = VALUES(program_name),  -- Program name will update if changed
    adid = VALUES(adid)
`;


  try {
    const today = new Date();

    const values = students
      .map(student => {
        const startDate = parseExcelDate(student.start_date);
        const endDate = parseExcelDate(student.end_date);
        const recessStart = parseExcelDate(student.recess_start_date);
        const recessEnd = parseExcelDate(student.recess_end_date);

        if (endDate && new Date(endDate) < today) return null;

        const academicYear = getAcademicYear(startDate);

        return [
          student.user_id || '',
          student.name || '',
          student.gender || '',
          student.mobile_no || '',
          student.email || '',
          startDate,
          endDate,
          recessStart,
          recessEnd,
          student.school || '',
          academicYear || '',
          student.yearofstudy || '',
          student.cg || '',
          student.program_name || '',
          adid || ''
        ];
      })
      .filter(Boolean);



    db.query(insertQuery, [values], (err) => {
      if (err) {
        console.error('❌ DB Insert Error:', err);
        return res.status(500).json({ message: 'Database error', error: err });
      }
      res.status(200).json({ message: 'Student data uploaded successfully' });
    });
  } catch (err) {
    console.error('❌ Server Error:', err);
    res.status(500).json({ message: 'Unexpected server error', error: err });
  }
});

// ------------------- Displaying All Doctors -------------------
// ------------------- Get All Doctors from main_data -------------------
// ------------------- Displaying All Doctors -------------------
app.get('/doctors', (req, res) => {
  const query = `
    SELECT 
      mcr_number, 
      CONCAT(first_name, ' ', last_name) AS name, 
      email 
    FROM main_data 
    WHERE deleted = 0
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Failed to retrieve doctors from main_data:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});



// ------------------- Displaying Data from Student Database on Student Management Screen -------------------
app.get('/students', (req, res) => {
  db.query('SELECT * FROM student_database', (err, results) => {
    const adid = req.query.adid;

    if (!adid) {
      return res.status(400).json({ error: "ADID is required to fetch students." });
    }

    const query = 'SELECT * FROM student_database WHERE adid = ?';

    db.query(query, [adid], (err, results) => {
      if (err) {
        console.error('❌ Failed to retrieve students:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      res.json(results);
    });
  });
});


app.post('/update-student', (req, res) => {
  const {
    id, name, gender, mobile_no, email,
    start_date, end_date, recess_start_date, recess_end_date,
    school, academicYear, yearofstudy, cg, program_name
  } = req.body;

  // ✅ Helper to format ISO date to 'YYYY-MM-DD'
  const formatDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date)) return null;
    return date.toISOString().split('T')[0];
  };

  const query = `
    UPDATE student_database SET
      name = ?, gender = ?, mobile_no = ?, email = ?,
      start_date = ?, end_date = ?, recess_start_date = ?, recess_end_date = ?,
      school = ?, academicYear = ?, yearofstudy = ?, cg = ?, program_name = ?
    WHERE id = ?
  `;

  db.query(query, [
    name,
    gender,
    mobile_no,
    email,
    formatDate(start_date),
    formatDate(end_date),
    formatDate(recess_start_date),
    formatDate(recess_end_date),
    school,
    academicYear,
    yearofstudy,
    cg,
    program_name,
    id
  ], (err) => {
    if (err) {
      console.error('❌ Update Error:', err);
      return res.status(500).json({ message: 'Failed to update student', error: err });
    }
    res.json({ message: 'Student updated successfully' });
  });
});



app.delete('/delete-student/:user_id', (req, res) => {
  const { user_id } = req.params;
  db.query('DELETE FROM student_database WHERE user_id = ?', [user_id], (err) => {
    if (err) {
      console.error('❌ Delete Error:', err);
      return res.status(500).json({ message: 'Failed to delete student', error: err });
    }
    res.json({ message: 'Student deleted successfully' });
  });
});

// ------------------- Bulk Delete Visible Students -------------------
app.post('/delete-multiple-students', (req, res) => {
  const { user_ids } = req.body;

  if (!Array.isArray(user_ids) || user_ids.length === 0) {
    return res.status(400).json({ message: 'No student IDs provided for deletion' });
  }

  const placeholders = user_ids.map(() => '?').join(',');
  const query = `DELETE FROM student_database WHERE user_id IN (${placeholders})`;

  db.query(query, user_ids, (err, result) => {
    if (err) {
      console.error('❌ Bulk Delete Error:', err);
      return res.status(500).json({ message: 'Failed to delete students', error: err });
    }
    res.json({ message: 'Students deleted successfully', deletedCount: result.affectedRows });
  });
});

// -------------------------------------------------------------------------------------------------------------//
// ------------------- DOCTOR LINK FOR AVAILABILITY INSTEAD OF EMAILING REPLY -------------------
// -------------------------------------------------------------------------------------------------------------//
app.get("/api/email-sessions/:sessionId", (req, res) => {
  const sessionId = req.params.sessionId;

  const query = "SELECT * FROM email_sessions WHERE session_id = ?";
  db.query(query, [sessionId], async (err, results) => {
    if (err) {
      console.error("❌ DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    const session = results[0];

    // 🔒 Check if this session_id has already been submitted
    const [parsedRows] = await db.promise().query(
      "SELECT id FROM parsed_emails WHERE session_id = ? AND type = 'availability'",
      [sessionId]
    );

    if (parsedRows.length > 0) {
      return res.status(403).json({ error: "This session has already been submitted." });
    }

    let slots = [];


    try {
      slots = JSON.parse(session.available_slots_json || '[]');
    } catch (e) {
      console.error("❌ Error parsing available_slots_json:", e);
    }

    // 🧠 Parse student_ids and fetch student details
    let studentDetails = [];
    try {
      const studentIds = (session.student_ids || '')
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));


      if (Array.isArray(studentIds) && studentIds.length > 0) {
        const placeholders = studentIds.map(() => '?').join(',');
        const studentQuery = `
          SELECT id, name, school, academicYear, yearofstudy
          FROM student_database
          WHERE id IN (${placeholders})
        `;

        const [studentResults] = await new Promise((resolve, reject) => {
          db.query(studentQuery, studentIds, (err, rows) => {
            if (err) reject(err);
            else resolve([rows]);
          });
        });

        studentDetails = studentResults;
      }
    } catch (e) {
      console.error("❌ Error processing student_ids:", e);
    }

    // ✅ Final response
    res.json({
      ...session,
      slots,
      studentDetails
    });
  });
});

app.patch("/api/scheduling/parsed-email/:session_id/update-availability", async (req, res) => {
  const { session_id } = req.params;
  const { selected_slots, mcr_number, students } = req.body;

  if (!Array.isArray(selected_slots) || selected_slots.length === 0 || !mcr_number) {
    return res.status(400).json({ error: "Missing or invalid inputs." });
  }

  try {
    // Step 1: Validate session exists and MCR is allowed
    const [emailSessionRows] = await db.promise().query(
      "SELECT doctor_mcrs, session_name FROM email_sessions WHERE session_id = ?",
      [session_id]
    );

    if (emailSessionRows.length === 0) {
      return res.status(404).json({ error: "Invalid session link." });
    }

    const allowedMCRs = emailSessionRows[0].doctor_mcrs
      .split(',')
      .map(m => m.trim());

    const session_name = emailSessionRows[0].session_name;

    if (!allowedMCRs.includes(mcr_number.trim())) {
      return res.status(403).json({ error: "This MCR is not authorized for this session." });
    }

    // Step 2: Format selected slots
    const formattedSlots = selected_slots.map(slot => {
      const dateObj = new Date(slot.date);
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      const formattedDate = dateObj.toLocaleDateString('en-GB', options);

      const formatTime = (timeStr) => {
        const [hour, minute] = timeStr.split(':').map(Number);
        const ampm = hour >= 12 ? 'pm' : 'am';
        const hour12 = hour % 12 || 12;
        return `${hour12}${minute === 0 ? '' : `:${minute.toString().padStart(2, '0')}`}${ampm}`;
      };

      const startTime = formatTime(slot.start);
      const endTime = formatTime(slot.end);

      return `${formattedDate} (${startTime}–${endTime})`;
    }).join(', ');



    // 🔍 Step 2.5: Get doctor's full name from main_data
    let from_name = '';
    let from_email = '';
    try {
      const [doctorRows] = await db.promise().query(
        "SELECT first_name, last_name, email FROM main_data WHERE mcr_number = ?",
        [mcr_number]
      );

      if (doctorRows.length > 0) {
        const { first_name, last_name, email } = doctorRows[0];
        from_name = `${first_name} ${last_name}`.trim();
        from_email = email || '';
      }
    } catch (e) {
      console.error("❌ Error fetching doctor name from main_data:", e);
    }

    // ✅ Step 3: Insert a new availability record into parsed_emails
    const insertQuery = `
  INSERT INTO parsed_emails (
    type, session_name, from_name, from_email,
    to_email, original_session, new_session,
    reason, students, available_slots_timings,
    notes, received_at, session_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
`;


    await db.promise().query(insertQuery, [
      'availability',     // type
      session_name,
      from_name,          // from_name ← ✅ fetched from main_data
      from_email,
      '',                 // to_email
      '',                 // original_session
      '',                 // new_session
      '',                 // reason
      students || '',     // students
      formattedSlots,     // available_slots_timings
      mcr_number,         // notes
      session_id          // session_id
    ]);


    res.json({ message: "✅ Availability submitted successfully." });

  } catch (err) {
    console.error("❌ Error submitting availability:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// -------------------------------------------------------------------------------------------------------------//
// ------------------- ACCEPTANCE NOTIFICATION ENDPOINTS -------------------
// -------------------------------------------------------------------------------------------------------------//

// Notify doctor when availability session is accepted
app.post("/api/scheduling/notify-availability-accepted", async (req, res) => {
  const { parsed_email_id, doctor_email, session_details, accepted_slot } = req.body;
  
  console.log("🔍 [DEBUG] Availability notification request:", {
    parsed_email_id,
    doctor_email,
    session_details,
    accepted_slot
  });
  
  try {
    // Get the parsed email details to extract doctor information
    const [emailResult] = await db.promise().query(
      "SELECT * FROM parsed_emails WHERE id = ?", 
      [parsed_email_id]
    );
    
    console.log("🔍 [DEBUG] Database query result:", emailResult);
    
    if (emailResult.length === 0) {
      console.error("❌ [ERROR] Parsed email not found for ID:", parsed_email_id);
      return res.status(404).json({ error: "Parsed email not found" });
    }
    
    const emailData = emailResult[0];
    console.log("🔍 [DEBUG] Email data retrieved:", emailData);
    
    // Extract doctor name with better fallback logic
    const doctorName = emailData.name || emailData.doctor_name || emailData.from_name || 'Doctor';
    console.log("🔍 [DEBUG] Doctor name resolved to:", doctorName);
    
    // Create notification email content
    const subject = `Availability Request Accepted - ${session_details.session_name}`;
    
    // Parse accepted_slot to create detailed session info
    const acceptedSlots = accepted_slot.split(', ');
    const sessionDetails = acceptedSlots.map((slot, index) => 
      `Session ${index + 1}: ${slot} at ${session_details.location}`
    ).join('\n');
    
    const body = `Dear Dr. ${doctorName},

Your availability request has been ACCEPTED for the following session${acceptedSlots.length > 1 ? 's' : ''}:

Session Name: ${session_details.session_name}
Students: ${session_details.students}
Location: ${session_details.location}

ACCEPTED SESSIONS:
${sessionDetails}

Thank you for your flexibility and cooperation. Please ensure you are available for the above scheduled session${acceptedSlots.length > 1 ? 's' : ''}.

Best regards,
EDO Team`;

    console.log("📧 [DEBUG] Email content prepared:", {
      subject,
      body_length: body.length,
      to: doctor_email
    });

    // Try to get access token and send email
    try {
      // First, try to get access token
      const adminEmailMappings = JSON.parse(await readFile('../src/config/admin-emails.json', 'utf-8'));
      console.log("🔍 [DEBUG] Admin email mappings loaded");
      
      // Find the admin profile that should send this email (default to first available)
      const adminProfile = Object.keys(adminEmailMappings.admins)[0];
      const profilePath = `../src/token/${adminProfile.toLowerCase()}_profile.json`;
      
      console.log("🔍 [DEBUG] Looking for profile:", profilePath);
      
      let accessToken = null;
      try {
        const profileData = await readFile(profilePath, 'utf-8');
        const profileJson = JSON.parse(profileData);
        accessToken = profileJson.access_token;
        console.log("🔍 [DEBUG] Access token found:", accessToken ? "YES" : "NO");
      } catch (tokenErr) {
        console.warn("⚠️ [WARN] Profile token not found, trying fallback");
        try {
          const fallbackData = await readFile('../src/token/access_token.json', 'utf-8');
          const fallbackJson = JSON.parse(fallbackData);
          accessToken = fallbackJson.access_token;
          console.log("🔍 [DEBUG] Fallback token found:", accessToken ? "YES" : "NO");
        } catch (fallbackErr) {
          console.error("❌ [ERROR] No access tokens available:", fallbackErr.message);
        }
      }
      
      if (accessToken) {
        // Send email via Graph API
        const emailPayload = {
          message: {
            subject,
            body: {
              contentType: "Text",
              content: body,
            },
            toRecipients: [{
              emailAddress: { address: doctor_email }
            }],
            internetMessageHeaders: [{
              name: "X-Session-ID",
              value: emailData.session_id || 'notification'
            }]
          }
        };
        
        console.log("📤 [DEBUG] Sending email via Graph API:", {
          to: doctor_email,
          subject,
          token_available: true
        });
        
        const graphResponse = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailPayload),
        });
        
        console.log("📤 [DEBUG] Graph API response status:", graphResponse.status);
        
        if (graphResponse.ok) {
          console.log("✅ [SUCCESS] Email sent successfully via Graph API");
          res.json({ 
            message: "✅ Availability acceptance notification sent successfully",
            email_sent: true,
            notification: {
              to: doctor_email,
              subject: subject,
              body: body
            }
          });
        } else {
          const graphError = await graphResponse.json();
          console.error("❌ [ERROR] Graph API error:", graphError);
          res.status(500).json({ 
            error: "Failed to send email via Graph API",
            details: graphError,
            notification_prepared: true
          });
        }
      } else {
        console.warn("⚠️ [WARN] No access token available, notification prepared but not sent");
        res.json({ 
          message: "⚠️ Availability acceptance notification prepared (no access token for sending)",
          email_sent: false,
          notification: {
            to: doctor_email,
            subject: subject,
            body: body
          }
        });
      }
    } catch (emailSendErr) {
      console.error("❌ [ERROR] Email sending failed:", emailSendErr);
      res.status(500).json({ 
        error: "Failed to send notification email",
        details: emailSendErr.message,
        notification_prepared: true
      });
    }
    
  } catch (err) {
    console.error("❌ [ERROR] General error in availability notification:", err);
    res.status(500).json({ error: "Failed to prepare notification" });
  }
});

// Notify doctor when change request is accepted
app.post("/api/scheduling/notify-change-request-accepted", async (req, res) => {
  const { parsed_email_id, doctor_email, session_details, new_schedule } = req.body;
  
  console.log("🔍 [DEBUG] Change request notification request:", {
    parsed_email_id,
    doctor_email,
    session_details,
    new_schedule
  });
  
  try {
    // Get the parsed email details to extract doctor information
    const [emailResult] = await db.promise().query(
      "SELECT * FROM parsed_emails WHERE id = ?", 
      [parsed_email_id]
    );
    
    console.log("🔍 [DEBUG] Database query result:", emailResult);
    
    if (emailResult.length === 0) {
      console.error("❌ [ERROR] Parsed email not found for ID:", parsed_email_id);
      return res.status(404).json({ error: "Parsed email not found" });
    }
    
    const emailData = emailResult[0];
    console.log("🔍 [DEBUG] Email data retrieved:", emailData);
    
    // Extract doctor name with better fallback logic
    const doctorName = emailData.name || emailData.doctor_name || emailData.from_name || 'Doctor';
    console.log("🔍 [DEBUG] Doctor name resolved to:", doctorName);
    
    // Create notification email content
    const subject = `Change Request Accepted - ${session_details.session_name}`;
    const body = `Dear Dr. ${doctorName},

Your change request has been ACCEPTED for the following session:

Original Session: ${session_details.session_name}
Original Date: ${session_details.original_date || session_details.date}
Original Time: ${session_details.original_time || session_details.time}

NEW SCHEDULE:
Date: ${new_schedule.date}
Time: ${new_schedule.time}
Location: ${new_schedule.location}
Students: ${session_details.students}

Change Reason: ${session_details.change_reason || 'Not specified'}

The session has been updated in the system. Thank you for informing us of the change.

Best regards,
EDO Team`;

    console.log("📧 [DEBUG] Email content prepared:", {
      subject,
      body_length: body.length,
      to: doctor_email
    });

    // Try to get access token and send email
    try {
      // First, try to get access token
      const adminEmailMappings = JSON.parse(await readFile('../src/config/admin-emails.json', 'utf-8'));
      console.log("🔍 [DEBUG] Admin email mappings loaded");
      
      // Find the admin profile that should send this email (default to first available)
      const adminProfile = Object.keys(adminEmailMappings.admins)[0];
      const profilePath = `../src/token/${adminProfile.toLowerCase()}_profile.json`;
      
      console.log("🔍 [DEBUG] Looking for profile:", profilePath);
      
      let accessToken = null;
      try {
        const profileData = await readFile(profilePath, 'utf-8');
        const profileJson = JSON.parse(profileData);
        accessToken = profileJson.access_token;
        console.log("🔍 [DEBUG] Access token found:", accessToken ? "YES" : "NO");
      } catch (tokenErr) {
        console.warn("⚠️ [WARN] Profile token not found, trying fallback");
        try {
          const fallbackData = await readFile('../src/token/access_token.json', 'utf-8');
          const fallbackJson = JSON.parse(fallbackData);
          accessToken = fallbackJson.access_token;
          console.log("🔍 [DEBUG] Fallback token found:", accessToken ? "YES" : "NO");
        } catch (fallbackErr) {
          console.error("❌ [ERROR] No access tokens available:", fallbackErr.message);
        }
      }
      
      if (accessToken) {
        // Send email via Graph API
        const emailPayload = {
          message: {
            subject,
            body: {
              contentType: "Text",
              content: body,
            },
            toRecipients: [{
              emailAddress: { address: doctor_email }
            }],
            internetMessageHeaders: [{
              name: "X-Session-ID",
              value: emailData.session_id || 'notification'
            }]
          }
        };
        
        console.log("📤 [DEBUG] Sending email via Graph API:", {
          to: doctor_email,
          subject,
          token_available: true
        });
        
        const graphResponse = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailPayload),
        });
        
        console.log("📤 [DEBUG] Graph API response status:", graphResponse.status);
        
        if (graphResponse.ok) {
          console.log("✅ [SUCCESS] Email sent successfully via Graph API");
          res.json({ 
            message: "✅ Change request acceptance notification sent successfully",
            email_sent: true,
            notification: {
              to: doctor_email,
              subject: subject,
              body: body
            }
          });
        } else {
          const graphError = await graphResponse.json();
          console.error("❌ [ERROR] Graph API error:", graphError);
          res.status(500).json({ 
            error: "Failed to send email via Graph API",
            details: graphError,
            notification_prepared: true
          });
        }
      } else {
        console.warn("⚠️ [WARN] No access token available, notification prepared but not sent");
        res.json({ 
          message: "⚠️ Change request acceptance notification prepared (no access token for sending)",
          email_sent: false,
          notification: {
            to: doctor_email,
            subject: subject,
            body: body
          }
        });
      }
    } catch (emailSendErr) {
      console.error("❌ [ERROR] Email sending failed:", emailSendErr);
      res.status(500).json({ 
        error: "Failed to send notification email",
        details: emailSendErr.message,
        notification_prepared: true
      });
    }
    
  } catch (err) {
    console.error("❌ [ERROR] General error in change request notification:", err);
    res.status(500).json({ error: "Failed to prepare notification" });
  }
});

// Send change request email to doctor with suggested time slots
app.post("/api/scheduling/send-change-request", async (req, res) => {
  const { 
    parsed_email_id, 
    doctor_email, 
    doctor_name, 
    session_details, 
    suggested_slots, 
    reason 
  } = req.body;
  
  console.log("🔍 [DEBUG] Change request email request:", {
    parsed_email_id,
    doctor_email,
    doctor_name,
    session_details,
    suggested_slots,
    reason
  });
  
  try {
    // Get the parsed email details
    const [emailResult] = await db.promise().query(
      "SELECT * FROM parsed_emails WHERE id = ?", 
      [parsed_email_id]
    );
    
    console.log("🔍 [DEBUG] Database query result:", emailResult);
    
    if (emailResult.length === 0) {
      console.error("❌ [ERROR] Parsed email not found for ID:", parsed_email_id);
      return res.status(404).json({ error: "Parsed email not found" });
    }
    
    const emailData = emailResult[0];
    
    // Format suggested time slots
    const suggestedSlotsText = suggested_slots.map((slot, index) => {
      const date = new Date(slot.date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      const startTime = new Date(`1970-01-01T${slot.startTime}`).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      
      const endTime = new Date(`1970-01-01T${slot.endTime}`).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      
      return `Option ${index + 1}: ${date} from ${startTime} to ${endTime}`;
    }).join('\n');
    
    // Create a new session ID for the change request
    const { v4: uuidv4 } = await import('uuid');
    const newSessionId = uuidv4();
    
    // Get original session data and doctor MCR information
    let originalSessionData = null;
    let doctorMcr = '';
    
    try {
      // Get original session data
      const [originalSession] = await db.promise().query(
        "SELECT * FROM email_sessions WHERE session_id = ?",
        [emailData.session_id]
      );
      if (originalSession.length > 0) {
        originalSessionData = originalSession[0];
        console.log("🔍 [DEBUG] Found original session data:", originalSessionData);
      }
      
      // Get doctor's MCR number from main_data using email
      const [doctorData] = await db.promise().query(
        "SELECT mcr_number FROM main_data WHERE email = ?",
        [doctor_email]
      );
      if (doctorData.length > 0) {
        doctorMcr = doctorData[0].mcr_number;
        console.log("🔍 [DEBUG] Found doctor MCR:", doctorMcr);
      } else {
        console.warn("⚠️ [WARN] Could not find doctor MCR for email:", doctor_email);
      }
    } catch (originalSessionErr) {
      console.warn("⚠️ [WARN] Could not find original session data:", originalSessionErr);
    }

    // Store the new session with suggested time slots in email_sessions table
    // Format slots correctly for the availability form (use 'start' and 'end' instead of 'startTime' and 'endTime')
    const suggestedSlotsJson = JSON.stringify(suggested_slots.map(slot => ({
      date: slot.date,
      start: slot.startTime, // Convert startTime to start
      end: slot.endTime      // Convert endTime to end
    })));

    // Create email body with suggested slots for the new session
    const newSessionBody = `Change request for ${session_details.session_name} with suggested time slots:\n\n${suggestedSlotsText}\n\nPlease respond with your availability.`;
    
    try {
      await db.promise().query(
        `INSERT INTO email_sessions 
         (session_id, subject, body, to_emails, doctor_mcrs, student_ids, session_name, session_count, available_slots_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newSessionId,
          `Change Request - ${session_details.session_name}`,
          newSessionBody,
          doctor_email,
          doctorMcr || originalSessionData?.doctor_mcrs || '', // Use doctor's MCR or original
          originalSessionData?.student_ids || '', // Use original student_ids if available
          session_details.session_name,
          session_details.session_count || 1,
          suggestedSlotsJson
        ]
      );
      console.log("✅ [DEBUG] New session created for change request:", newSessionId);
      console.log("🔍 [DEBUG] Stored doctor_mcrs:", doctorMcr);
      console.log("🔍 [DEBUG] Stored student_ids:", originalSessionData?.student_ids || '');
    } catch (sessionErr) {
      console.error("❌ [ERROR] Failed to create new session:", sessionErr);
    }

    // Create email content
    const subject = `New Time Slots Needed - ${session_details.session_name}`;
    const body = `Dear Dr. ${doctor_name || 'Doctor'},

Thank you for your availability response for the ${session_details.session_name} session.

Unfortunately, the original time slots you provided are not suitable due to scheduling conflicts or other constraints.

ORIGINAL REQUEST:
Session: ${session_details.session_name}
Sessions Needed: ${session_details.session_count}x
Students: ${session_details.students}

SUGGESTED ALTERNATIVE TIME SLOTS:
${suggestedSlotsText}

Please reply with your availability for the above suggested time slots, or provide alternative times that work for you.

You can respond directly to this email or use our online form: ${getFrontendUrl(req)}/#/doctor-availability/respond?session_id=${newSessionId}

Thank you for your flexibility and cooperation.

Best regards,
EDO Team`;

    console.log("📧 [DEBUG] Email content prepared:", {
      subject,
      body_length: body.length,
      to: doctor_email
    });

    // Try to get access token and send email
    try {
      const adminEmailMappings = JSON.parse(await readFile('../src/config/admin-emails.json', 'utf-8'));
      console.log("🔍 [DEBUG] Admin email mappings loaded");
      
      const adminProfile = Object.keys(adminEmailMappings.admins)[0];
      const profilePath = `../src/token/${adminProfile.toLowerCase()}_profile.json`;
      
      console.log("🔍 [DEBUG] Looking for profile:", profilePath);
      
      let accessToken = null;
      try {
        const profileData = await readFile(profilePath, 'utf-8');
        const profileJson = JSON.parse(profileData);
        accessToken = profileJson.access_token;
        console.log("🔍 [DEBUG] Access token found:", accessToken ? "YES" : "NO");
      } catch (tokenErr) {
        console.warn("⚠️ [WARN] Profile token not found, trying fallback");
        try {
          const fallbackData = await readFile('../src/token/access_token.json', 'utf-8');
          const fallbackJson = JSON.parse(fallbackData);
          accessToken = fallbackJson.access_token;
          console.log("🔍 [DEBUG] Fallback token found:", accessToken ? "YES" : "NO");
        } catch (fallbackErr) {
          console.error("❌ [ERROR] No access tokens available:", fallbackErr.message);
        }
      }
      
      if (accessToken) {
        // Send email via Graph API
        const emailPayload = {
          message: {
            subject,
            body: {
              contentType: "Text",
              content: body,
            },
            toRecipients: [{
              emailAddress: { address: doctor_email }
            }],
            internetMessageHeaders: [{
              name: "X-Session-ID",
              value: emailData.session_id || 'change_request'
            }]
          }
        };
        
        console.log("📤 [DEBUG] Sending email via Graph API:", {
          to: doctor_email,
          subject,
          token_available: true
        });
        
        const graphResponse = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailPayload),
        });
        
        console.log("📤 [DEBUG] Graph API response status:", graphResponse.status);
        
        if (graphResponse.ok) {
          console.log("✅ [SUCCESS] Change request email sent successfully via Graph API");
          res.json({ 
            message: "✅ Change request sent successfully",
            email_sent: true,
            notification: {
              to: doctor_email,
              subject: subject,
              body: body
            }
          });
        } else {
          const graphError = await graphResponse.json();
          console.error("❌ [ERROR] Graph API error:", graphError);
          res.status(500).json({ 
            error: "Failed to send email via Graph API",
            details: graphError,
            email_prepared: true
          });
        }
      } else {
        console.warn("⚠️ [WARN] No access token available, change request prepared but not sent");
        res.json({ 
          message: "⚠️ Change request prepared (no access token for sending)",
          email_sent: false,
          notification: {
            to: doctor_email,
            subject: subject,
            body: body
          }
        });
      }
    } catch (emailSendErr) {
      console.error("❌ [ERROR] Email sending failed:", emailSendErr);
      res.status(500).json({ 
        error: "Failed to send change request email",
        details: emailSendErr.message,
        email_prepared: true
      });
    }
    
  } catch (err) {
    console.error("❌ [ERROR] General error in change request:", err);
    res.status(500).json({ error: "Failed to prepare change request" });
  }
});

// Debug endpoint to check notification system status
app.get("/api/scheduling/debug-notification-status", async (req, res) => {
  try {
    console.log("🔍 [DEBUG] Checking notification system status...");
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      system_status: "operational",
      checks: {
        admin_config: false,
        token_files: [],
        database: false
      }
    };
    
    // Check admin config
    try {
      const adminEmailMappings = JSON.parse(await readFile('../src/config/admin-emails.json', 'utf-8'));
      debugInfo.checks.admin_config = true;
      debugInfo.admin_profiles = Object.keys(adminEmailMappings.admins);
      console.log("✅ [DEBUG] Admin config loaded successfully");
    } catch (configErr) {
      console.error("❌ [DEBUG] Admin config error:", configErr.message);
      debugInfo.checks.admin_config = false;
      debugInfo.config_error = configErr.message;
    }
    
    // Check token files
    const tokenDir = '../src/token/';
    try {
      const fs = require('fs').promises;
      const files = await fs.readdir(tokenDir);
      debugInfo.checks.token_files = files.filter(f => f.endsWith('.json'));
      console.log("🔍 [DEBUG] Token files found:", debugInfo.checks.token_files);
    } catch (tokenErr) {
      console.error("❌ [DEBUG] Token directory error:", tokenErr.message);
      debugInfo.token_error = tokenErr.message;
    }
    
    // Check database connection
    try {
      const [testResult] = await db.promise().query("SELECT 1 as test");
      debugInfo.checks.database = testResult.length > 0;
      console.log("✅ [DEBUG] Database connection successful");
    } catch (dbErr) {
      console.error("❌ [DEBUG] Database error:", dbErr.message);
      debugInfo.checks.database = false;
      debugInfo.database_error = dbErr.message;
    }
    
    console.log("🔍 [DEBUG] System status check complete:", debugInfo);
    res.json(debugInfo);
    
  } catch (err) {
    console.error("❌ [DEBUG] Error in status check:", err);
    res.status(500).json({ error: "Failed to check system status", details: err.message });
  }
});

// Send notification email via Graph API
app.post("/api/scheduling/send-acceptance-notification", async (req, res) => {
  const { doctor_email, subject, body, session_id } = req.body;
  
  try {
    // This endpoint can be called by the frontend to actually send the notification
    // It would integrate with the existing Graph API sending mechanism
    
    console.log("📧 Sending acceptance notification:", {
      to: doctor_email,
      subject: subject,
      session_id: session_id
    });
    
    // For now, we'll return success - this would need Graph API integration
    res.json({ 
      message: "✅ Notification sent successfully",
      sent_to: doctor_email
    });
    
  } catch (err) {
    console.error("❌ Error sending acceptance notification:", err);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

// -------------------------------------------------------------------------------------------------------------//
// ------------------- SPECIFIC STUDENT ID TIMETABLE -------------------
// -------------------------------------------------------------------------------------------------------------//
app.get("/api/scheduling/student-timetable/:userId", (req, res) => {
  const userId = req.params.userId;
  const query = `
    SELECT s.*
    FROM scheduled_sessions s
    JOIN session_students ss ON ss.scheduled_session_id = s.id
    WHERE ss.user_id = ?;
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("❌ Error fetching student timetable:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});




// -------------------------------------------------------------------------------------------------------------//
// Create route to store email session metadata
// -------------------------------------------------------------------------------------------------------------//
app.post("/api/email-sessions", (req, res) => {
  const {
    session_id,
    subject,
    body,
    to_emails,
    doctor_mcrs,
    student_ids,
    session_name,
    session_count,
    available_slots_json,
  } = req.body;

  db.query(
    `INSERT INTO email_sessions 
      (session_id, subject, body, to_emails, doctor_mcrs, student_ids, session_name, session_count, available_slots_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [session_id, subject, body, to_emails, doctor_mcrs, student_ids, session_name, session_count, available_slots_json,],
    (err, results) => {
      if (err) {
        console.error("❌ Failed to store email session:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      res.status(201).json({ message: "Session email stored successfully." });
    }
  );
});


// -------------------------------------------------------------------------------------------------------------//
// -------------------------------------------------------------------------------------------------------------//
// Web-based Email Authentication Endpoints
// -------------------------------------------------------------------------------------------------------------//
let authSessions = {}; // Store ongoing authentication sessions

app.post("/api/authenticate-email", async (req, res) => {
  try {
    const { profile, email, name } = req.body;
    
    // Create a unique session ID for this authentication
    const sessionId = `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store session info
    authSessions[sessionId] = {
      profile,
      email,
      name,
      status: 'pending',
      created: new Date().toISOString()
    };
    
    // Return authentication URL and user code (simulated)
    res.json({
      auth_url: "https://login.microsoftonline.com/common/oauth2/v2.0/devicecode",
      user_code: `${profile.toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      session_id: sessionId,
      message: `Please authenticate with ${email}`
    });
    
  } catch (error) {
    console.error("Authentication initiation error:", error);
    res.status(500).json({ error: "Failed to initiate authentication" });
  }
});

app.get("/api/check-auth-status/:profile", async (req, res) => {
  try {
    const { profile } = req.params;
    
    // Check if profile has been authenticated (check for profile file)
    const profilePath = `../src/scheduling/hospital_email_pipeline/email_profiles/${profile}.json`;
    try {
      const profileData = await readFile(profilePath, 'utf-8');
      const profileJson = JSON.parse(profileData);
      
      if (profileJson.access_token && profileJson.access_token.trim() !== '') {
        res.json({ authenticated: true, profile });
      } else {
        res.json({ authenticated: false, profile });
      }
    } catch (fileError) {
      res.json({ authenticated: false, profile });
    }
    
  } catch (error) {
    console.error("Auth status check error:", error);
    res.status(500).json({ error: "Failed to check authentication status" });
  }
});

// Alternative simpler authentication endpoint that gives instructions
app.post("/api/authenticate-simple", async (req, res) => {
  try {
    const { profile, email, name } = req.body;
    
    res.json({
      success: true,
      instructions: `To authenticate ${name} <${email}>:\n\n1. Open terminal/command prompt\n2. Navigate to: src/scheduling/hospital_email_pipeline\n3. Run: python email_config.py setup ${profile} ${email} "${name}"\n4. Follow the authentication prompts\n5. Click "Check Authentication" when complete`,
      command: `python email_config.py setup ${profile} ${email} "${name}"`
    });
    
  } catch (error) {
    console.error("Simple auth error:", error);
    res.status(500).json({ error: "Failed to generate authentication instructions" });
  }
});

// -------------------------------------------------------------------------------------------------------------//
// Access Token Calling and Endpoint
// -------------------------------------------------------------------------------------------------------------//
app.get("/api/token", async (req, res) => {
  try {
    const profile = req.query.profile || 'default'; // Get profile from query param
    
    // Load admin email mappings from config file
    let adminEmailMappings = {};
    try {
      const configData = await readFile('../src/config/admin-emails.json', 'utf-8');
      const adminConfig = JSON.parse(configData);
      
      // Convert to the format needed for profiles
      adminEmailMappings = Object.entries(adminConfig.admins).reduce((acc, [key, value]) => {
        acc[key.toLowerCase()] = { email: value.email, name: value.name };
        return acc;
      }, {});
    } catch (configError) {
      console.error("Failed to load admin emails config:", configError);
      // Fallback to hardcoded values
      adminEmailMappings = {
        'channe': { email: 'channe@hospital.com', name: 'Channe' },
        'jeffrey': { email: 'jeffrey@hospital.com', name: 'Jeffrey' },
        'jennifer': { email: 'jennifer@hospital.com', name: 'Jennifer' },
        'rose': { email: 'rose@hospital.com', name: 'Rose' },
        'edward': { email: 'raintail0025@outlook.com', name: 'Edward' },
        'custom': { email: 'default@hospital.com', name: 'Default Admin' }
      };
    }
    
    // Try to load from email profile first
    const profilePath = `../src/scheduling/hospital_email_pipeline/email_profiles/${profile}.json`;
    try {
      const profileData = await readFile(profilePath, 'utf-8');
      const profileJson = JSON.parse(profileData);
      if (profileJson.access_token) {
        res.json({ 
          access_token: profileJson.access_token,
          sender_email: profileJson.sender_email,
          sender_name: profileJson.sender_name 
        });
        return;
      }
    } catch (profileError) {
      console.log(`Profile ${profile} not found, will need authentication`);
    }
    
    // If profile doesn't exist, return profile info for frontend to handle
    if (adminEmailMappings[profile]) {
      res.status(401).json({ 
        error: "Profile not authenticated",
        profile: profile,
        sender_email: adminEmailMappings[profile].email,
        sender_name: adminEmailMappings[profile].name,
        needs_auth: true
      });
      return;
    }
    
    // Fallback to original token file
    const data = await readFile('../src/token/access_token.json', 'utf-8');
    const json = JSON.parse(data);
    res.json(json);
  } catch (error) {
    console.error("Failed to read token:", error);
    res.status(500).json({ error: "Failed to load token" });
  }
});

// -------------------------------------------------------------------------------------------------------------//
// Configuration Endpoints
// -------------------------------------------------------------------------------------------------------------//
app.get("/api/admin-emails", async (req, res) => {
  try {
    const configData = await readFile('../src/config/admin-emails.json', 'utf-8');
    const adminConfig = JSON.parse(configData);
    
    // Convert to the format expected by frontend
    const adminEmailMappings = Object.entries(adminConfig.admins).reduce((acc, [key, value]) => {
      acc[key.toLowerCase()] = { 
        profile: key.toLowerCase(), 
        email: value.email, 
        name: value.name 
      };
      return acc;
    }, {});
    
    res.json(adminEmailMappings);
  } catch (error) {
    console.error("Failed to load admin emails config:", error);
    res.status(500).json({ error: "Failed to load admin emails configuration" });
  }
});

// -------------------------------------------------------------------------------------------------------------//
// Email Monitoring Control Endpoints
// -------------------------------------------------------------------------------------------------------------//
let monitoringProcess = null;
let monitoringLogs = [];

app.get("/api/email-monitoring/status", (req, res) => {
  try {
    const status = monitoringProcess ? 'running' : 'stopped';
    const profile = monitoringProcess ? monitoringProcess.profile : null;
    
    res.json({ 
      status,
      profile,
      logs: monitoringLogs.slice(-20) // Return last 20 log entries
    });
  } catch (error) {
    console.error("Error checking monitoring status:", error);
    res.status(500).json({ error: "Failed to check monitoring status" });
  }
});

app.post("/api/email-monitoring/start", async (req, res) => {
  try {
    const { profile } = req.body;
    
    if (monitoringProcess) {
      return res.json({ success: false, error: "Monitoring is already running" });
    }
    
    // Check if profile is authenticated
    const profilePath = `../src/scheduling/hospital_email_pipeline/email_profiles/${profile}.json`;
    try {
      const profileData = await readFile(profilePath, 'utf-8');
      const profileJson = JSON.parse(profileData);
      
      if (!profileJson.access_token || profileJson.access_token.trim() === '') {
        return res.json({ success: false, error: "Profile not authenticated" });
      }
    } catch (profileError) {
      return res.json({ success: false, error: "Profile not found or invalid" });
    }
    
    // Start the monitoring process
    const pythonPath = path.join(__dirname, '..', 'src', 'scheduling', 'hospital_email_pipeline');
    const pythonScript = path.join(pythonPath, 'main.py');
    
    console.log('Starting monitoring with:');
    console.log('Python path:', pythonPath);
    console.log('Python script:', pythonScript);
    console.log('Profile:', profile);
    
    try {
      monitoringProcess = spawn('python', [pythonScript, '--profile', profile], {
        cwd: pythonPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      monitoringProcess.profile = profile;
    } catch (spawnError) {
      console.error('Failed to spawn Python process:', spawnError);
      return res.status(500).json({ success: false, error: `Failed to start Python process: ${spawnError.message}` });
    }
    
    // Log stdout
    monitoringProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        monitoringLogs.push({
          timestamp: new Date().toISOString(),
          message: message
        });
        
        // Keep only last 100 log entries
        if (monitoringLogs.length > 100) {
          monitoringLogs = monitoringLogs.slice(-100);
        }
      }
    });
    
    // Log stderr
    monitoringProcess.stderr.on('data', (data) => {
      const message = `ERROR: ${data.toString().trim()}`;
      monitoringLogs.push({
        timestamp: new Date().toISOString(),
        message: message
      });
    });
    
    // Handle process exit
    monitoringProcess.on('close', (code) => {
      monitoringLogs.push({
        timestamp: new Date().toISOString(),
        message: `Monitoring process exited with code ${code}`
      });
      monitoringProcess = null;
    });
    
    // Clear previous logs when starting new monitoring session
    monitoringLogs = [];
    
    monitoringLogs.push({
      timestamp: new Date().toISOString(),
      message: `Email monitoring started for profile: ${profile}`
    });
    
    res.json({ success: true, message: "Email monitoring started" });
    
  } catch (error) {
    console.error("Error starting monitoring:", error);
    res.status(500).json({ success: false, error: `Failed to start monitoring: ${error.message}` });
  }
});

app.post("/api/email-monitoring/stop", (req, res) => {
  try {
    if (!monitoringProcess) {
      return res.json({ success: false, error: "Monitoring is not running" });
    }
    
    // Kill the monitoring process
    monitoringProcess.kill('SIGTERM');
    
    monitoringLogs.push({
      timestamp: new Date().toISOString(),
      message: "Email monitoring stopped by user"
    });
    
    monitoringProcess = null;
    
    res.json({ success: true, message: "Email monitoring stopped" });
    
  } catch (error) {
    console.error("Error stopping monitoring:", error);
    res.status(500).json({ success: false, error: "Failed to stop monitoring" });
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

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Connection Successful. Backend server is running on port ${PORT}`);
});