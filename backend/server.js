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
app.use(cors()); //Enables CORS, allowing cross-origin requests from browsers e.g. 3000 for frontend, 3001 for backend

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

    db.query(query, [validatedData], (err, result) => {
      if (err) {
        console.error("Database insertion error:", err);
        return res.status(500).json({ error: "Failed to insert data into main_data." });
      }

      res.status(201).json({ message: "Data uploaded and processed successfully!", result });
    });
  } catch (error) {
    console.error("Error processing file upload:", error);
    res.status(500).json({ error: error.message });
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

app.listen(process.env.PORT || 3001, () => {
  console.log("Connection Successful. Backend server is running!");
});