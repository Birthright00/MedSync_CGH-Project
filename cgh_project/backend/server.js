import express from "express";
import mysql2 from "mysql2";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import * as XLSX from "xlsx";
import csv from "csv-parser"; // Library for handling CSV files

// -------------------------------------------------------------------------------------------------------------//
// IMPORTS
// -------------------------------------------------------------------------------------------------------------//
// express: A framework for building web servers in Node.js --> simplifies routing and middleware setup
// mysql2: A module for interacting with MySQL databases in Node.js
// cors: A middleware module for handling Cross-Origin Resource Sharing (CORS) requests
// bcrypt: A module for hashing and salting passwords
// jsonwebtoken: This library is used to create and verify JSON Web Tokens (JWT),
//  which are used for user authentication and authorization.
// multer: A middleware module for handling file uploads
// xlsx: A library for parsing Excel files
// csv: A library for parsing CSV files

const app = express(); // Create an instance of the express app
const upload = multer({ storage: multer.memoryStorage() });

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
// GET REQUEST FOR COMBINED DOCTORS DETAILS (FROM ALL 3 TABLES AS A VIEW)
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
// POST REQUEST FOR ADDING NEW STAFF DETAILS TO MAIN_DATA TABLE
app.post("/entry", verifyToken, (req, res) => {
  const {
    mcr_number,
    first_name,
    last_name,
    department,
    appointment,
    teaching_training_hours,
    email,
  } = req.body;

  const userMcrNumber = req.user.id; // Get the user ID from the JWT token

  console.log("Received new staff details request:", req.body); // Log the incoming request

  // Check for missing required fields
  if (
    !mcr_number ||
    !first_name ||
    !last_name ||
    !department ||
    !appointment ||
    !email
  ) {
    return res.status(400).json({
      error:
        "Please provide all required fields: mcr_number, first_name, last_name, department, appointment, and email.",
    });
  }

  // Ensure that the `mcr_number` field follows the correct format
  const mcrRegex = /^[Mm]\d{5}[A-Za-z]$/;
  if (!mcrRegex.test(mcr_number)) {
    return res.status(400).json({
      error:
        "MCR Number must start with 'M' or 'm', followed by 5 digits and end with a single alphabet.",
    });
  }

  // Set current timestamp for created_at and updated_at fields
  const currentTimestamp = new Date();

  // Prepare the SQL query for inserting new staff details
  const q = `
    INSERT INTO main_data 
    (mcr_number, first_name, last_name, department, appointment, teaching_training_hours, email, created_at, updated_at, created_by, fte, deleted) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    mcr_number,
    first_name,
    last_name,
    department,
    appointment,
    teaching_training_hours || 0, // Default teaching hours to 0 if not provided
    email,
    currentTimestamp, // Set created_at to current timestamp
    currentTimestamp, // Set updated_at to current timestamp
    userMcrNumber, // Log the ID of the user creating the record (from JWT)
    1.0, // Default value for Full-Time Equivalent (fte)
    0, // Default value for deleted (0 means not deleted, 1 means deleted)
  ];

  console.log("Executing SQL query with values:", values); // Log the SQL values being used

  // Execute the query to insert new staff details into the main_data table
  db.query(q, values, (err, data) => {
    if (err) {
      // Log the detailed error for server-side debugging
      console.error("Error inserting new staff details:", err);
      if (err.sqlMessage) {
        console.error("SQL Error Message:", err.sqlMessage); // Log SQL-specific error message
      }

      // Respond with a more informative message
      return res.status(500).json({
        error:
          "Failed to add new staff details. Please check the server logs for more information.",
      });
    }

    console.log("New staff details added successfully!", data); // Log successful insertion
    return res.status(201).json({
      message: "New staff details added successfully",
      data: {
        mcr_number,
        first_name,
        last_name,
        department,
        appointment,
        teaching_training_hours,
        email,
        created_at: currentTimestamp,
        updated_at: currentTimestamp,
        created_by: userMcrNumber,
        fte: 1.0,
        deleted: 0,
      },
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
// CONTRACTS ROUTES
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
// DELETE REQUEST FOR DELETING A SPECIFIC CONTRACT BASED ON MCR NUMBER, STATUS, START DATE, AND SCHOOL NAME
// -------------------------------------------------------------------------------------------------------------//

app.delete(
  "/contracts/:mcr_number/:status/:start_date/:school_name",
  verifyToken,
  (req, res) => {
    const { mcr_number, status, start_date, school_name } = req.params;

    // SQL query now targets specific rows based on multiple fields
    const q = `
    DELETE FROM contracts 
    WHERE mcr_number = ? AND status = ? AND start_date = ? AND school_name = ?
  `;

    const values = [mcr_number, status, start_date, school_name];

    db.query(q, values, (err, data) => {
      if (err) {
        console.error("Error deleting contract:", err);
        return res.status(500).json({ error: "Failed to delete contract" });
      }

      if (data.affectedRows === 0) {
        return res.status(404).json({ message: "Contract not found" });
      }

      return res.status(200).json({ message: "Contract deleted successfully" });
    });
  }
);

// -------------------------------------------------------------------------------------------------------------//
// PROMOTIONS ROUTES
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
// POST REQUEST FOR ADDING NEW PROMOTION DETAILS TO PROMOTIONS TABLE
// -------------------------------------------------------------------------------------------------------------//

app.post("/new-promotions/:mcr_number", verifyToken, (req, res) => {
  const { mcr_number } = req.params; // Get the MCR number from the URL
  const { new_title, previous_title, promotion_date } = req.body;

  // Validate required fields
  if (!new_title || !previous_title || !promotion_date) {
    return res
      .status(400)
      .json({ error: "Please provide all required fields" });
  }

  // Corrected table name and columns
  const q = `
    INSERT INTO promotions 
    (mcr_number, new_title, previous_title, promotion_date) 
    VALUES (?, ?, ?, ?)
  `;

  const values = [mcr_number, new_title, previous_title, promotion_date];

  db.query(q, values, (err, data) => {
    if (err) {
      console.error("Error inserting new promotion details:", err);
      return res
        .status(500)
        .json({ error: "Failed to add new promotion details" });
    }
    return res
      .status(201)
      .json({ message: "New promotion details added successfully", data });
  });
});

// -------------------------------------------------------------------------------------------------------------//
// DELETE REQUEST FOR DELETING A PROMOTION BASED ON NEW TITLE FROM PROMOTIONS TABLE
// -------------------------------------------------------------------------------------------------------------//

app.delete("/promotions/:mcr_number/:new_title", verifyToken, (req, res) => {
  const { mcr_number, new_title } = req.params;

  const q = `DELETE FROM promotions WHERE mcr_number = ? AND new_title = ?`;

  const values = [mcr_number, new_title];

  db.query(q, values, (err, data) => {
    if (err) {
      console.error("Error deleting promotion:", err);
      return res.status(500).json({ error: "Failed to delete promotion" });
    }

    if (data.affectedRows === 0) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    return res.status(200).json({ message: "Promotion deleted successfully" });
  });
});

// -------------------------------------------------------------------------------------------------------------//
// PUT REQUEST FOR UPDATING PROMOTION DETAILS BASED ON MCR NUMBER AND NEW TITLE
// -------------------------------------------------------------------------------------------------------------//

app.put("/promotions/:mcr_number/:new_title", verifyToken, (req, res) => {
  const { mcr_number, new_title } = req.params; // Get the MCR number and new title from the URL
  const { previous_title, promotion_date } = req.body; // Get the updated fields from the request body

  // Validate the input fields
  if (!previous_title || !promotion_date) {
    return res
      .status(400)
      .json({ error: "Please provide all required fields" });
  }

  const q = `
    UPDATE promotions 
    SET previous_title = ?, promotion_date = ? 
    WHERE mcr_number = ? AND new_title = ?
  `;

  const values = [previous_title, promotion_date, mcr_number, new_title];

  db.query(q, values, (err, data) => {
    if (err) {
      console.error("Error updating promotion details:", err);
      return res
        .status(500)
        .json({ error: "Failed to update promotion details" });
    }

    if (data.affectedRows === 0) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    return res.status(200).json({ message: "Promotion updated successfully" });
  });
});

// -------------------------------------------------------------------------------------------------------------//
// EXCEL FILE UPLOAD ROUTES
// -------------------------------------------------------------------------------------------------------------//
// POST REQUEST TO HANDLE SINGLE SHEET EXCEL FILE UPLOAD //
// -------------------------------------------------------------------------------------------------------------//
app.post(
  "/upload-excel-single-sheet",
  verifyToken,
  upload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Check the file type to determine how to process it
    const fileType = req.file.mimetype;

    try {
      let sheetData = [];

      // Handle Excel files (`.xlsx` and `.xls`)
      if (fileType.includes("sheet") || fileType.includes("excel")) {
        console.log("Processing Excel file...");
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        sheetData = XLSX.utils.sheet_to_json(
          workbook.Sheets[workbook.SheetNames[0]]
        ); // Read the first sheet
        validateAndInsertData(sheetData, res); // Call validation and insertion directly for Excel
      }
      // Handle CSV files
      else if (
        fileType === "text/csv" ||
        fileType === "application/vnd.ms-excel"
      ) {
        console.log("Processing CSV file...");
        // Parse the CSV file content
        const csvData = req.file.buffer.toString(); // Convert buffer to string for CSV parsing
        const csvRows = [];

        // Use a string reader to parse the CSV content line-by-line
        require("stream")
          .Readable.from(csvData)
          .pipe(csv())
          .on("data", (row) => csvRows.push(row))
          .on("end", () => {
            sheetData = csvRows; // Assign the parsed CSV rows to sheetData
            validateAndInsertData(sheetData, res); // Call the validation and insertion function
          });
        return; // Early return for CSV because it is parsed asynchronously
      } else {
        return res.status(400).json({ error: "Unsupported file format" });
      }
    } catch (error) {
      console.error("Error processing uploaded file: ", error);
      return res
        .status(500)
        .json({ error: "Failed to process the uploaded file" });
    }
  }
);

// Function to handle validation and data insertion for both CSV and Excel data
function validateAndInsertData(sheetData, res) {
  console.log("Parsed Data: ", sheetData); // Log parsed data for debugging

  // Define expected columns for each table
  const tableColumns = {
    main_data: [
      "mcr_number",
      "first_name",
      "last_name",
      "department",
      "appointment",
      "teaching_training_hours",
      "email",
      "created_at",
      "updated_at",
      "created_by",
      "updated_by",
      "deleted_by",
      "deleted_at",
      "fte",
      "deleted",
    ],
    contracts: [
      "mcr_number",
      "start_date",
      "end_date",
      "status",
      "school_name",
    ],
    promotion: ["mcr_number", "new_title", "previous_title", "promotion_date"],
  };

  const requiredColumns = ["mcr_number"]; // List of required columns (common for all tables)
  const allExpectedColumns = [
    ...new Set([
      ...tableColumns.main_data,
      ...tableColumns.contracts,
      ...tableColumns.promotion,
    ]),
  ];

  // Validate columns in the uploaded sheet
  const uploadedColumns = Object.keys(sheetData[0] || {});
  if (
    !uploadedColumns.includes("mcr_number") ||
    uploadedColumns.some((col) => !allExpectedColumns.includes(col))
  ) {
    console.error("Missing or unrecognized columns in the uploaded file");
    return res
      .status(400)
      .json({ error: "Missing or unrecognized columns in the uploaded file" });
  }

  console.log("All columns validated successfully");

  // Further processing and data insertion logic...
  res.status(200).json({ message: "File uploaded and validated successfully" });
}

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
