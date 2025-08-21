# CGH Project 2.0 - Education Office Scheduling Automation

---

Welcome to the **CGH Education Office Scheduling System** - an advanced automation platform designed specifically for streamlining educational session management at Changi General Hospital.

**CGH Project 2.0** focuses primarily on **scheduling system automation**, featuring AI-powered email parsing, intelligent session management, and comprehensive educational workflow automation for the CGH Education Office.

The instructions for the installation may get rather complicated but please read through the setup guide and/or reach out to the repo's owner for help.

First of all :

- **_NO_**, the intranet laptops issued by CGH will **_NOT_** be able to run this and
- **_NO_** your phones will not be able to run this (for now).

If you do not have a laptop **_WITH INTERNET ACCESS_**, this is the end of the installation guide for you, thank you for reading.

# Table of Contents

---

1. [Introduction](#introduction)
2. [Technical Requirements](#requirements)
   1. [Basic Command Line Navigation](#basiccommandline)
3. [Getting Started](#gettingstarted)
   1. [Downloading the IDE](#downloadide)
   2. [Cloning the Repository](#clonefrontend)
   3. [Installing Dependencies](#installdep)
4. [Running the Web Application](#running)
5. [What to Expect](#outcome)

<a id="requirements"></a>

# Getting Started:

---

### This webapp will require the following:

- A "Can Do" Attitude!
- Not afraid of new challenges!
- A laptop with Internet access
- Experience with a mouse and keyboard
- Entry level knowledge of command lines (will be taught to you in the next portion don't worry!)

### Basic Command Line Navigation

_Skip this portion if you are familiar with changing directories using powershell, bash etc_

If you’re new to using the command line, here are a couple of essential commands to help you navigate through folders (directories) on your computer.

1. **Changing Directories: cd**
   The cd command stands for "change directory." It allows you to move into a different folder on your computer. Think of it as opening a folder in your file explorer.

_How to Use_:

To move into a folder:
Type cd followed by the name of the folder you want to move into. For example, if you want to move into a folder called "Documents," you would type:

```
cd Documents
```

After pressing Enter, you’ll now be "inside" the Documents folder.

2. **Moving Up a Level/ Moving back out: cd ..**
   The cd .. command allows you to move up one level in your folder hierarchy. If you’re inside a folder and want to go back to the folder that contains it, this is the command to use.

_How to Use_:

To go back one level:
Simply type cd .. and press Enter. This will move you out of your current folder and into the folder that contains it.

For example, if you were inside the "Documents" folder and you typed:

```
cd ..
```

You would move out of "Documents" and back to the folder where "Documents" is located (often your main user folder).

<a id="gettingstarted"></a>

# Installation Guide

---

### Downloading an IDE

Recommended : **Visual Studio Code** or any preferred IDEs of your choice

[Download Visual Studio Code](https://code.visualstudio.com/download)

If you are on a windows laptop, download the windows version

Launch it when download is completed!
<a id="clonefrontend"></a>

### Cloning the repository

Don't worry about the terminologies, just follow the instructions below!

Launch VSC once you downloaded it and press **_Ctrl_** followed by **_`_** (this is the ~ button below your ESC button)

**_A terminal should open up._**

Change Directory (using **_cd_**) into your preferred location to download the project.

For example, if I am at C drive and I want to install the web application in "CGH_Project", I will :

```
cd SUTD/Internship/CGH_Project
```

and then copy and paste or type the code below :

```shell
git clone https://github.com/CoderJae777/CGH_Project.git
```

Before you press enter, it should look like this :

```
PS C:\SUTD\Internship\CGH_Project git clone https://github.com/CoderJae777/CGH_Project.git
```

Once done, press enter and let it download! You are 80% done!
<a id="installdep"></a>

### Installing NodeJS

---

Node.js is essential for running the Doctor Data Management Web Application. Follow the steps below to install Node.js on your system.

1. Visit the official [Node.js download page](https://nodejs.org/).
2. Choose the **LTS (Long Term Support)** version for a stable release, or the **Current** version for the latest features.
3. Download the installer for your operating system (Windows, macOS, or Linux).

### On Windows

1. Run the downloaded `.msi` installer.
2. Follow the installation wizard:
   - Accept the license agreement.
   - Select the default settings unless customization is required.
   - Ensure the option to install Node.js and `npm` is selected.
3. Click **Install** to begin the process.
4. Once completed, click **Finish** to exit the installer.

### On macOS

1. Open the downloaded `.pkg` file.
2. Follow the installation wizard:
   - Agree to the license terms.
   - Select the installation location and click **Install**.
3. Enter your macOS password when prompted.
4. Once the installation is complete, click **Close**.

### Installing dependencies

---

**Quick Setup (Recommended):**

```shell
# Install all dependencies (frontend + backend)
npm run setup

# Verify installation
npm run verify
```

**Manual Installation:**

Assuming you have no issues with the above step,

In the same terminal, copy and paste or type the following code (this may take awhile) :

```shell
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

**Troubleshooting Dependencies:**

In the event of errors there are several things you can do:

```shell
# Quick fixes
npm audit fix
npm audit fix --force

# Clean installation (if npm install fails)
npm run clean-install

# Check what's wrong with your setup
npm run verify
```

**Common Issues:**
- `missing: msal@^1.4.18` error - Run `npm install` to fix
- Backend won't start - Run `cd backend && npm install`
- JavaScript errors - Run `npm run verify` for diagnosis

For detailed setup instructions, see: [SETUP.md](./SETUP.md)
For dependency information, see: [DEPENDENCIES.md](./DEPENDENCIES.md)

Else, contact developers if you still run into issues

<a id="running"></a>

### Running the web application

---

In the same terminal, copy and paste or type the following code:

```shell
npm start
```

<a id="outcome"></a>

### What to expect

---

Your chrome will automatically launch and the web application will start.

If your web browser did not start automatically, click this link :
[http://localhost:3000](http://localhost:3000)

# Core Features - CGH Project 2.0

---

## 🎯 **Primary Focus: Educational Scheduling Automation**

### **AI-Powered Email Processing**
- **Intelligent Email Parsing:** Automatically processes scheduling emails using advanced LLM models
- **Smart Session Extraction:** Identifies session details, doctor names, dates, times, and student lists
- **Automated Workflow:** Converts emails directly into scheduled sessions with minimal manual intervention

### **Advanced Scheduling Management**
- **Real-time Session Coordination:** Live updates and conflict detection
- **Drag-and-Drop Interface:** Intuitive session rescheduling and management
- **Change Request System:** Automated approval workflows for session modifications
- **QR Code Integration:** Automatic QR generation for session access and tracking

### **Role-Based Access Control**

- **Education Office Management:** Full scheduling control, email monitoring, and system administration
- **Medical Staff (Doctors/Nurses):** Session availability submission, change requests, and personal timetable access
- **Students:** Timetable viewing, session information access, and notification reception
- **HR Personnel:** Read-only access to staff scheduling information

### Login Features

- **Validation:** Ensures MCR numbers follow the correct format (starts with 'M' or 'm', followed by 5 digits and an alphabet).
- **Role-Based Redirect:** Navigates users to the appropriate dashboard based on their role.
- **Error Messages:** Provides detailed feedback for login issues like incorrect username/password or unauthorized access.

### **Development Credentials**

The following credentials are for development purposes only. _Note: These are case-sensitive._

| **Role**       | **Username** | **Password** |
| -------------- | ------------ | ------------ |
| **Management** | `abcde`      | `test`       |
| **Staff**      | `m12345a`    | `test`       |
| **HR**         | `bcdef`      | `test`       |

### **Important Notes:**

---

- Ensure that all credentials are kept secure and only shared with authorized personnel.
- Passwords for all roles are set to `test` by default for development purposes and must be updated in a production environment.

### Home Page

---

- **Filter:** Search and filter through data based on specific fields like name, department, or MCR number.
- **Sorting:** Sort data by columns such as start date, end date, or department.
- **Quick Summary:** Provides an overview of critical data metrics like active contracts, total postings, or training hours.

### Data Entry and Management

---

- **Edit Doctor Data:** Modify existing doctor details, including personal and professional information.
- **Add New Doctor Data:** Add new doctors to the database with fields like MCR number, department, and appointment details.
- **Download Button:** Export data to an Excel file for offline use or reporting.

### Contract Management

---

- **View Contracts:** Display all contracts associated with a doctor, including school names and contract dates.
- **Add Contracts:** Create new contracts for doctors with start and end dates, ensuring no overlaps.
- **Edit Contracts:** Update existing contract details such as duration and associated schools.
- **Delete Contracts:** Remove outdated or invalid contracts.
- **Auto-check Contract Validity:** Prevents overlapping contracts or invalid dates during data entry.

### Posting Management

---

- **View Postings:** List all postings related to a doctor and their corresponding contracts.
- **Add Postings:** Insert postings within valid academic years aligned with contract periods.
- **Edit Postings:** Modify details like training hours or ratings.
- **Delete Postings:** Remove invalid or outdated postings.

## User Manual and Demonstration

---

As it is quite straight forward to use this webapp, there will no be written documentation for this, however, please refer to the demonstration video for a better idea and visualisation of the webapplication

## Potential Errors/FAQs

---

Note if you are a mac user, good luck, whatever problems you have is beyond me.

If you are a windows user, good job, stay relevant.

Here are some potential errors you may encounter during installation, along with solutions based on user feedback:

1. **Error:** Not sure which destination to save the web application into.

   **Solution:** By default, if you’re unsure where to save the web application, navigate (`cd`) all the way out to the C drive, then `cd` into the "Downloads" folder.

2. **Error:** Installation issues with VSC

## All about Backend

---

### How it works?

#### The API and request

1. API Endpoint

- The request is sent to the backend's login route : "http://localhost:3001/login"
- This URL corresponds to a server running locally on your machine (in development). In production, this URL would point to your live server.

2. Post Request

- Why POST instead of GET?

  - POST is typically used for sending sensitive information like login credentials (username and password)
  - GET requests are used for retrieving data, but they append parameters to the URL. In the case of login, this would be insecure because the credentials would be visible in the URL (e.g., http://localhost:3001/login?username=123&password=abc).
  - With POST, the data is sent in the body of the request, keeping the credentials hidden from the URL and browser history, providing a layer of security.

3. Headers

- The request includes a header that specifies the content type, in this case :

  `"Content-type" : "application/json"` means that the data being sent is in JSON format

4. Request Body

- The data sent in the body includes the username, password, and the selected role (management or staff)
- `JSON.stringify({mcr_number: username, password: password, selectedRole: selectedRole})` converts the data to a JSON string, which is required for sending the data in the request body.

#### Verification

When backend server receives the login request it wil :

1. The backend's /login route receives the request, reading the MCR number, password and selectedRole from the request body.
2. Querying the database

   - The backend queries the database for a user with the provided MCR number like :
     `sql SELECT * FROM user_database WHERE mcr_number = ?`
   - The "?" is a placeholder that will be replaced with the actual value entered by user

3. Password Verification

   - When user is found, the backend compares the password provided by the user with the password stored in the database
   - Note : it is not simply string comparison. The passwords in the database are hashed, so it is a **HASH comparison**

     - The password the user enters is hashed using the same algo that was used when storing the password (bcrypt in our case)
     - The backend then compares the newly hashed password to the hashed password stored in the database.
     - Below consists of all the potential errors
     - Role selected + As long as one is blank = 400 (Bad Request)
     - Role + Wrong Username + Wrong PW = 404 (Not Found) (Toast : User not found)
     - Role + Correct Username + Wrong PW = 401 (Unauthorised)
     - Role + Wrong Username + Correct PW = 404 (Not Found)
     - Wrong Role + Correct Username + Correct PW = 403 (Forbidden)

---

## Session Scheduling System

---

### How Session Scheduling Works

The application includes a comprehensive session scheduling system that integrates email parsing, AI processing, and automated booking management.

#### Email Integration & AI Processing

1. **Email Monitoring Pipeline**
   - Python-based email parsing system located in `src/scheduling/hospital_email_pipeline/`
   - Monitors Microsoft Graph API for incoming scheduling emails
   - Uses AI/LLM models to parse and extract session information
   - Automatically creates session requests based on email content

2. **Starting AI Email Parser - Two Methods**

   **Method 1: Terminal/Command Line (Advanced Users)**
   ```bash
   npm run ai-parser
   ```
   
   **Method 2: Web Application Interface (Recommended)**
   - Login as Management user
   - Navigate to "Email Monitoring" section in the scheduling module
   - Select admin email profile from dropdown
   - Click "Start Authentication" → Complete OAuth flow
   - Click "Start Monitoring" button
   - Monitor real-time logs and parsing status directly in the web interface
   - View parsed email results in the "Parsed Emails" section

3. **Configuration Files**
   - `config.cfg` - Azure/Microsoft Graph API credentials
   - `admin-emails.json` - Admin email profiles for sending notifications
   - `llm_config.yaml` - AI model configuration for email parsing

#### Session Management Features

### For Management Users

1. **Session Creation**
   - Navigate to Scheduling → Create New Session
   - Fill in session details (date, time, doctor, students)
   - System generates QR codes automatically
   - Email notifications sent to relevant parties

2. **Session Approval Workflow**
   - Review parsed email requests in the notification panel
   - Accept or reject session requests
   - Automatically adds approved sessions to timetables
   - Links students to sessions via session_students table

3. **Email Session Management**
   - View incoming session requests from email parsing
   - Match sessions with existing timetable entries
   - Handle session changes and cancellations
   - Monitor email authentication status

### For Staff/Doctors

1. **Availability Submission**
   - Access Doctor Scheduling page
   - Submit available time slots
   - View assigned sessions and students
   - Receive email notifications for session updates

2. **Session Booking**
   - Book sessions during available time slots
   - View student assignments for each session
   - Access blocked dates and unavailable periods

### For Students

1. **Timetable Access**
   - View personal session schedule
   - See assigned doctors and session details
   - Access session-specific information
   - Receive notifications for schedule changes

#### Scheduling Database Structure

The system uses several key database tables:

- `scheduled_sessions` - Main session data
- `session_students` - Links students to sessions
- `student_database` - Student information
- `blocked_dates` - Unavailable scheduling periods
- `parsed_emails` - AI-processed email data
- `availability_notifications` - Doctor availability requests
- `change_request_notifications` - Session modification requests

#### API Endpoints for Scheduling

```javascript
// Session Management
GET /api/scheduling/timetable - Retrieve session timetables
POST /api/scheduling/add-to-timetable - Add new session
PUT /api/scheduling/update-session/:id - Update session details
DELETE /api/scheduling/delete-session/:id - Remove session

// Email Processing
POST /api/scheduling/parsed-email - Store parsed email data
GET /api/scheduling/parsed-emails - Retrieve parsed emails
DELETE /api/scheduling/parsed-email/:id - Delete processed email

// Notifications
GET /api/scheduling/availability-notifications - Get availability requests
POST /api/scheduling/change-request - Submit session change request
GET /api/scheduling/change-requests - View change requests

// Student Management
GET /api/scheduling/student-timetable/:userId - Student-specific schedule
POST /api/scheduling/blocked-dates - Add blocked dates
GET /api/scheduling/get-blocked-dates - Retrieve blocked periods
```

#### Email Authentication Setup

1. **Microsoft Graph API Configuration**
   - Register application in Azure AD
   - Configure client ID and tenant ID in `config.cfg`
   - Set up required permissions: `User.Read Mail.ReadWrite Mail.Send`

2. **Authentication Flow**
   - Navigate to Email Monitoring section
   - Select admin profile for authentication
   - Complete OAuth flow for email access
   - Monitor authentication status in real-time

#### AI Email Parser - Detailed Usage Guide

**Overview:**
The AI email parser is the core automation feature that monitors email inboxes, extracts scheduling information using LLM models, and creates session requests automatically.

**Method 1: Web Application Interface (🔥 Recommended)**

*Advantages:*
- User-friendly graphical interface
- Real-time status monitoring and logs
- Easy start/stop controls
- Visual feedback and error handling
- No technical command-line knowledge required

*Step-by-Step Process:*
1. **Access Email Monitoring:**
   - Login with Management role credentials
   - Navigate to "Scheduling" → "Email Monitoring"

2. **Profile Selection & Authentication:**
   - Select admin email profile from dropdown menu
   - Click "Start Authentication" button
   - Complete Microsoft Graph OAuth in popup window
   - Verify authentication status shows "✅ Authenticated"

3. **Start AI Monitoring:**
   - Click "▶️ Start Monitoring" button
   - Monitor live status: "🟢 Running (Profile: selected_profile)"
   - View real-time activity logs in the dashboard
   - Watch for "📡 Live Updates" indicator

4. **Monitor Results:**
   - Parsed emails appear in "Parsed Emails" section
   - Review session details extracted by AI
   - Approve/reject requests directly from interface

5. **Stop When Needed:**
   - Click "⏹️ Stop Monitoring" to halt the process
   - Status changes to "🔴 Stopped"

**Method 2: Terminal/Command Line (Advanced Users)**

*Advantages:*
- Direct system access
- Detailed console output
- Suitable for debugging and development
- Can be automated with scripts

*Usage:*
```bash
# Navigate to project directory
cd CGH_Project

# Start the AI email parser
npm run ai-parser

# The parser will:
# 1. Load configuration from src/scheduling/hospital_email_pipeline/config.cfg
# 2. Connect to Microsoft Graph API
# 3. Monitor configured email inbox
# 4. Process emails using LLM models
# 5. Store results in parsed_emails database table
```

*Terminal Output:*
```
🤖 Starting AI Email Parser...
📧 Connecting to Microsoft Graph API...
✅ Authentication successful
🔍 Monitoring inbox: admin@hospital.com
📨 Processing new email: "Tutorial Session Request"
🧠 AI Analysis: Extracted session details
💾 Stored in database: Session ID #456
🔄 Continuing to monitor...
```

**Configuration Requirements for Both Methods:**

1. **Microsoft Graph API Setup:**
   - Azure AD application registration
   - Client ID and tenant ID configured
   - Required permissions: `User.Read`, `Mail.ReadWrite`, `Mail.Send`

2. **Configuration Files:**
   - `src/scheduling/hospital_email_pipeline/config/config.cfg` - API credentials
   - `src/config/admin-emails.json` - Email profile mappings
   - `src/scheduling/hospital_email_pipeline/config/llm_config.yaml` - AI model settings

3. **Dependencies:**
   - Python 3.7+ environment
   - Required Python packages (installed via npm run ai-parser)
   - Valid LLM API access (OpenAI, Azure OpenAI, etc.)

**Monitoring & Troubleshooting:**

*Web Interface Indicators:*
- 🟢 Green status = Parser running successfully
- 🔴 Red status = Parser stopped or error
- ❌ Authentication failed = Re-authenticate required
- 📡 Live Updates = Real-time data streaming

*Common Issues:*
- **Authentication Expired:** Re-authenticate via web interface
- **No Emails Processed:** Check email keywords and inbox permissions
- **AI Parsing Errors:** Verify LLM API configuration and quotas
- **Connection Issues:** Check network and Microsoft Graph service status

### Key Application Functions

#### 1. Doctor Availability Management

**For Doctors/Staff:**
- Navigate to "Doctor Scheduling" from the staff dashboard
- Click "Submit Availability" button
- Select available dates and time slots using the calendar interface
- Add any special notes or preferences
- Submit availability form - this creates entries in `availability_notifications` table
- System sends automatic email notifications to management

**For Management:**
- Access "Scheduling Dashboard" from management portal
- View all pending availability notifications in the notifications panel
- Review doctor availability requests with dates, times, and preferences
- Accept or reject availability submissions
- Accepted availability becomes available for session booking
- Rejected requests trigger email notifications back to the doctor

#### 2. AI Email Parser Integration

**Starting the AI Parser via Web Application:**
- Login as Management user
- Navigate to "Email Monitoring" section in the scheduling module
- Select admin email profile from the dropdown (configured in `admin-emails.json`)
- Click "Start Authentication" to begin Microsoft Graph OAuth flow
- Complete authentication in the popup window
- Once authenticated, click "Start Monitoring" button
- Monitor real-time logs and parsing status in the web interface
- View parsed email results in the "Parsed Emails" section

**AI Parser Functions:**
- Monitors specified email inboxes for scheduling-related emails
- Uses LLM models (configured in `llm_config.yaml`) to extract:
  - Session names and descriptions
  - Doctor names and contact information
  - Dates and time slots
  - Student lists and requirements
  - Location details
- Creates entries in `parsed_emails` table with extracted data
- Triggers notifications for management review

**Manual Parser Control:**
- Start/Stop monitoring from the web interface
- View real-time parsing logs and status
- Download parsing results as CSV/Excel
- Clear processed emails from the queue

#### 3. Session Request Approval Workflow

**Email-to-Session Pipeline:**
1. **Email Received**: Scheduling emails arrive in monitored inbox
2. **AI Processing**: Parser extracts session details using LLM
3. **Request Creation**: System creates entry in `parsed_emails` table
4. **Management Review**: Appears in notifications panel for review
5. **Approval Process**:
   - Click "Accept" to approve the session request
   - System automatically creates entry in `scheduled_sessions` table
   - Links students via `session_students` table
   - Sends confirmation emails to all parties
6. **Rejection Process**:
   - Click "Reject" with optional reason
   - System sends rejection email to requester
   - Entry marked as processed but not scheduled

#### 4. Student-Session Assignment

**Automatic Assignment (via Email Parser):**
- AI extracts student names from email content
- System matches names against `student_database` table
- Creates linkage in `session_students` table
- Students automatically see sessions in their timetables

**Manual Assignment (via Management Interface):**
- Navigate to "Session Management" 
- Select existing session or create new one
- Use student search/selection interface
- Add/remove students from session
- Save changes - updates `session_students` mappings
- System sends notification emails to affected students

#### 5. Session Change Request System

**For Doctors/Students:**
- Access current session from timetable view
- Click "Request Change" button
- Fill out change request form:
  - Original session details (pre-populated)
  - Requested new date/time
  - Reason for change
  - Priority level
- Submit request - creates entry in `change_request_notifications`

**For Management:**
- View all change requests in notifications dashboard
- Review original vs. requested session details
- Check doctor/student availability for new time
- Approve/reject with comments
- Approved changes automatically update `scheduled_sessions`
- System handles student re-assignment and notifications

#### 6. Blocked Dates Management

**Adding Blocked Dates:**
- Management users access "Blocked Dates" section
- Upload Excel file with blocked periods or add manually
- Specify date ranges, reasons, and affected areas
- System prevents scheduling during blocked periods
- Students and staff see blocked dates in their calendar views

**Blocked Date Functions:**
- Hospital holidays and maintenance periods
- Doctor leave and unavailability
- Room/facility closures
- Emergency schedule modifications

#### 7. Real-time Notifications System

**Notification Types:**
- **Availability Requests**: When doctors submit availability
- **Session Changes**: When sessions are modified or cancelled  
- **Email Parse Results**: When AI processes new emails
- **Student Assignments**: When students are added/removed from sessions
- **System Alerts**: Authentication failures, parsing errors

**Notification Management:**
- View all notifications in dashboard widget
- Mark as read/unread
- Filter by type, date, or priority
- Auto-refresh for real-time updates
- Email integration for important alerts

#### 8. QR Code Generation and Session Access

**Automatic QR Generation:**
- Every created session gets unique QR code
- QR contains session ID, date, location, and access token
- Generated using the `generate-qr.js` utility
- Embedded in email notifications and printable session sheets

**QR Code Usage:**
- Students scan QR codes for quick session access
- Contains deep links to session details
- Works with mobile devices for easy check-in
- Can be printed for physical distribution

#### 9. Data Import/Export Functions

**Student Data Import:**
- Navigate to "Student Management" → "Upload Students"
- Select Excel/CSV file with student data
- System validates data format and required fields
- Preview import results before confirmation
- Bulk insert into `student_database` table
- Handle duplicates and data conflicts

**Session Data Export:**
- Access "Reports" section from management dashboard
- Select date ranges and export criteria
- Generate Excel/CSV reports with:
  - Session attendance records
  - Doctor utilization statistics
  - Student participation summaries
  - Email parsing analytics

#### 10. Email Authentication Management

**Profile-Based Authentication:**
- Multiple admin email profiles supported
- Each profile has separate authentication tokens
- Switch between profiles for different email accounts
- Monitor authentication status per profile

**Token Management:**
- Automatic token refresh handling
- Manual re-authentication when needed
- Token expiry notifications
- Secure token storage in `token/access_token.json`

#### 11. Admin User and Email Management

**Adding New Admin Users:**
1. **Database Method:**
   ```sql
   -- Add new admin user to user_data table
   INSERT INTO user_data (user_id, email, user_password, role) 
   VALUES ('new_admin_id', 'admin@hospital.com', 'hashed_password', 'management');
   ```

2. **Registration Method:**
   - Use the `/register` endpoint via the signup page
   - Set role as "management" for admin privileges
   - Ensure strong password and valid email

**Managing Admin Email Profiles:**

**File Location:** `src/config/admin-emails.json`

**Adding New Email Profile:**
```json
{
  "admins": {
    "ExistingAdmin": {
      "email": "existing@hospital.com",
      "name": "Existing Admin"
    },
    "NewAdminName": {
      "email": "newadmin@hospital.com", 
      "name": "New Admin Display Name"
    }
  }
}
```

**Modifying Existing Email Profiles:**
1. Open `src/config/admin-emails.json`
2. Edit the email address or display name for any profile
3. Save the file - changes take effect immediately
4. Restart the backend server if needed: `npm run backend`

**Removing Email Profiles:**
1. Delete the profile entry from `admin-emails.json`
2. Ensure the profile is not currently authenticated
3. Clear any stored tokens for that profile

**Email Profile Best Practices:**
- Use descriptive profile names (e.g., "Dr_Smith", "Admin_Scheduling")
- Ensure email addresses have proper Microsoft Graph API permissions
- Test authentication after adding new profiles
- Keep backup of working configurations

**Profile Name Requirements:**
- No spaces in profile keys (use underscores: "New_Admin")
- Profile names are case-sensitive
- Avoid special characters except underscores
- Keep names descriptive but concise

#### Troubleshooting Scheduling Issues

1. **Email Not Being Parsed**
   - Check Python dependencies are installed
   - Verify Microsoft Graph authentication status in web interface
   - Review email monitoring logs in the dashboard
   - Ensure AI model configuration is correct in `llm_config.yaml`
   - Check if email monitoring is actually running (green status indicator)

2. **Sessions Not Appearing**
   - Verify database connections in backend logs
   - Check session approval status in parsed emails section
   - Review student-session mappings in database
   - Confirm timetable API responses in browser developer tools
   - Ensure user has correct role permissions

3. **Authentication Problems**
   - Re-authenticate Microsoft Graph API via web interface
   - Check admin email configuration in `admin-emails.json`
   - Verify Azure AD app permissions in Azure portal
   - Review access token validity in token management section
   - Clear browser cache and retry authentication

4. **AI Parser Not Working**
   - Check Python environment and dependencies
   - Verify LLM model configuration and API keys
   - Review email content format - parser expects specific structures
   - Check parsing logs for error messages
   - Ensure sufficient API quotas for LLM service

## Frequently Used Things

### mySQL

```sql
set global sql_safe_updates = 0;
set session sql_safe_updates = 0;
use main_db;
select * from user_data;
select * from main_data;
select * from scheduled_sessions;
select * from session_students;
select * from student_database;
```

### Session-Related Database Queries

```sql
-- View all sessions with student assignments
SELECT ss.*, st.name as student_name 
FROM scheduled_sessions ss 
LEFT JOIN session_students sstud ON ss.id = sstud.scheduled_session_id
LEFT JOIN student_database st ON sstud.user_id = st.user_id;

-- View sessions for specific doctor
SELECT * FROM scheduled_sessions WHERE doctor_name = 'Dr. Smith';

-- View student timetable
SELECT ss.* FROM scheduled_sessions ss
JOIN session_students sstud ON ss.id = sstud.scheduled_session_id
WHERE sstud.user_id = 'STUDENT_ID';
```

### Deleting row/ data

```sql
DELETE FROM table_name
WHERE column_name = 'row_name';

-- Delete specific session
DELETE FROM scheduled_sessions WHERE id = 123;

-- Delete student-session mapping
DELETE FROM session_students WHERE scheduled_session_id = 123;
```

### Inserting new row/ data

```sql
INSERT INTO main_db (mcr_number, first_name, last_name, department, appointment, teaching_training_hours)
VALUES ('M12345A', 'John', 'Doe', 'Cardiology', 'Consultant', 120);

-- Insert new session
INSERT INTO scheduled_sessions (session_name, doctor_name, date, start_time, end_time, location)
VALUES ('Clinical Skills', 'Dr. Smith', '2024-01-15', '09:00:00', '11:00:00', 'Room 101');

-- Link student to session
INSERT INTO session_students (scheduled_session_id, user_id)
VALUES (1, 'STUDENT123');
```

### Adding new Column

```sql
ALTER TABLE name_of_table
ADD column_name datatype;

-- Add email field to sessions
ALTER TABLE scheduled_sessions
ADD doctor_email VARCHAR(255);
```

### Renaming Column Name

```sql
ALTER TABLE name_of_table
RENAME COLUMN column_name to column_name_2;
```

---
