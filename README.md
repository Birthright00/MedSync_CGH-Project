# Introduction

---

Welcome to the installation and set up guide for _CGH's Data Management Web Application._

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

Assuming you have no issues with the above step,

In the same terminal, copy and paste or type the following code (this may take awhile) :

```shell
npm install
```

In the event of errors there are 2 things you can do :

```shell
npm audit fix
```

```shell
npm audit fix --force
```

Else, contact developers if you still run into issuess

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

# Features

---

### Role-Based Access

- **Management Role:** Full access to view and edit all data.
- **Staff Role:** View-only access limited to their own data.
- **HR Role:** Read-only access to all data without editing privileges.

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

## Frequently Used Things

### mySQL

```sql
set global sql_safe_updates = 0;
set session sql_safe_updates = 0;
use main_db;
select * from user_data;
select * from main_data;
```

### Deleting row/ data

```sql
DELETE FROM table_name
WHERE column_name = 'row_name';

```

### Inserting new row/ data

```sql
INSERT INTO main_db (mcr_number, first_name, last_name, department, appointment, teaching_training_hours)
VALUES ('M12345A', 'John', 'Doe', 'Cardiology', 'Consultant', 120);
```

### Adding new Column

```sql
ALTER TABLE name_of_table
ADD column_name datatype;
```

### Renaming Column Name

```sql
ALTER TABLE name_of_table
RENAME COLUMN column_name to column_name_2;
```

---
