# HackArena: Hackathon Management & Project Evaluation System

A complete, production-grade, highly normalized college Database Management Systems (DBMS) project. Built with **React.js (Vite)**, **Node.js (Express.js)**, and **MySQL 8.4 LTS / 8.0+** using the `mysql2/promise` driver.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Database Schema (6 Core Tables)](#database-schema-6-core-tables)
3. [Prerequisites](#prerequisites)
4. [Step-by-Step Setup Guide](#step-by-step-setup-guide)
   - [A. Windows Setup Guide](#a-windows-setup-guide)
   - [B. macOS / Linux Setup Guide](#b-macos--linux-setup-guide)
5. [MySQL Workbench Instructions](#mysql-workbench-instructions)
6. [Environment Configuration (.env)](#environment-configuration-env)
7. [Running SQL Practical Demonstrations](#running-sql-practical-demonstrations)
8. [Starting Backend & Frontend](#starting-backend--frontend)
9. [Running Automated Tests](#running-automated-tests)
10. [Troubleshooting Common Issues](#troubleshooting-common-issues)
11. [Project Structure](#project-structure)
12. [Documentation Directory](#documentation-directory)

---

## 1. Project Overview

HackArena is a real-time web application where:
- **Administrators** create hackathons, monitor registrations, evaluate code submissions, assign scores (0–100) and qualitative feedback, and publish certified leaderboards.
- **Participants** register, browse hackathons, create teams (becoming Team Leader), invite teammates via email, submit project repositories, and track evaluation feedback.

---

## 2. Database Schema (6 Core Tables)

The database strictly consists of **exactly six normalized tables in 3NF**:
1. `admins`: Administrator accounts with bcrypt password hashes.
2. `participants`: Student profiles with university affiliation and contact info.
3. `hackathons`: Competition tracks with strict lifecycle date check constraints (`registration_deadline <= start_date <= end_date`).
4. `teams`: Teams formed per hackathon (`UNIQUE(hackathon_id, team_name)`).
5. `team_members`: Associative table resolving M:N relationship between participants and teams (`PRIMARY KEY (team_id, participant_id)`).
6. `submissions`: Exactly one final code submission per team (`UNIQUE(team_id)`), with score check constraint and evaluation status consistency.

---

## 3. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js:** v18.0.0 or later (v22.x LTS recommended). Check with: `node -v`
- **npm:** v9.0.0 or later. Check with: `npm -v`
- **MySQL Server:** MySQL 8.0.31+ or MySQL 8.4 LTS. Check with: `mysql --version`
- **MySQL Workbench** (Optional, recommended for visual inspection).

---

## 4. Step-by-Step Setup Guide

### A. Windows Setup Guide

#### 1. Open PowerShell or Command Prompt as Administrator
```powershell
# Verify installation
node -v
npm -v
mysql -u root -p -e "SELECT VERSION();"
```

#### 2. Create MySQL Database and Dedicated User
Run the following in the MySQL shell (`mysql -u root -p`):
```sql
CREATE DATABASE IF NOT EXISTS hackarena_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'hackarena_app'@'localhost' IDENTIFIED BY 'HackArena@2026';
GRANT ALL PRIVILEGES ON hackarena_db.* TO 'hackarena_app'@'localhost';
SET GLOBAL log_bin_trust_function_creators = 1;
FLUSH PRIVILEGES;
EXIT;
```

#### 3. Initialize Schema and Seed Data
Navigate to the project root directory:
```powershell
cd C:\path\to\dbms-project

# Load schema
Get-Content sql\01_schema.sql | mysql -u hackarena_app -pHackArena@2026 hackarena_db

# Load seed data (121 records)
Get-Content sql\02_seed_data.sql | mysql -u hackarena_app -pHackArena@2026 hackarena_db

# Load stored routines & triggers
Get-Content sql\09_routines_triggers.sql | mysql -u hackarena_app -pHackArena@2026 hackarena_db
```

#### 4. Configure Backend Environment & Seed Admin
```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run seed:admin
```

#### 5. Install Frontend Dependencies
```powershell
cd ..\frontend
Copy-Item .env.example .env
npm install
```

---

### B. macOS / Linux Setup Guide

#### 1. Create MySQL Database & Grant Privileges
```bash
mysql -u root -p -e "
CREATE DATABASE IF NOT EXISTS hackarena_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'hackarena_app'@'localhost' IDENTIFIED BY 'HackArena@2026';
GRANT ALL PRIVILEGES ON hackarena_db.* TO 'hackarena_app'@'localhost';
SET GLOBAL log_bin_trust_function_creators = 1;
FLUSH PRIVILEGES;
"
```

#### 2. Execute Database Schema and Seed Scripts
```bash
# Load schema, seeds, and routines
mysql -u hackarena_app -pHackArena@2026 hackarena_db < sql/01_schema.sql
mysql -u hackarena_app -pHackArena@2026 hackarena_db < sql/02_seed_data.sql
mysql -u hackarena_app -pHackArena@2026 hackarena_db < sql/09_routines_triggers.sql
```

#### 3. Install Backend & Frontend
```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run seed:admin

# Frontend
cd ../frontend
cp .env.example .env
npm install
cd ..
```

---

## 5. MySQL Workbench Instructions

1. Open **MySQL Workbench** and connect to your local MySQL instance.
2. In the top menu, click **File &rarr; Open SQL Script...**
3. Select `sql/01_schema.sql` and click the **Lightning Bolt (Execute)** icon.
4. Open `sql/02_seed_data.sql` and execute it.
5. In the left **Navigator** pane, expand **Schemas &rarr; hackarena_db &rarr; Tables**.
6. Right-click on `submissions` and choose **Select Rows - Limit 1000** to verify the populated data.
7. Open `sql/08_views_reporting.sql` and `sql/09_routines_triggers.sql` and execute them to verify Views, Stored Procedures, and Triggers.

---

## 6. Environment Configuration (.env)

### Backend (`backend/.env`):
```dotenv
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MySQL Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=hackarena_app
DB_PASSWORD=HackArena@2026
DB_NAME=hackarena_db

# JWT Authentication
JWT_SECRET=hackarena_jwt_secure_key_2026_super_secret_hash_change_in_production
JWT_EXPIRES_IN=7d

# Initial Admin Credentials
ADMIN_NAME=Project Admin
ADMIN_EMAIL=admin@hackarena.com
ADMIN_PASSWORD=Admin@123
```

### Frontend (`frontend/.env`):
```dotenv
VITE_API_URL=/api
```

---

## 7. Running SQL Practical Demonstrations

Run each practical script directly in the terminal or inside MySQL Workbench:

```bash
# 1. DDL: CREATE, ALTER, RENAME, TRUNCATE, DROP on disposable demo tables
mysql -u hackarena_app -pHackArena@2026 hackarena_db < sql/03_ddl_examples.sql

# 2. DML: INSERT, UPDATE CASCADE, DELETE CASCADE, and RESTRICT rejection
mysql -u hackarena_app -pHackArena@2026 hackarena_db < sql/04_dml_examples.sql

# 3. DCL: GRANT, REVOKE, and SHOW GRANTS (Run as root)
mysql -u root -p hackarena_db < sql/05_dcl_examples.sql

# 4. TCL: START TRANSACTION, COMMIT, SAVEPOINT, ROLLBACK TO SAVEPOINT, ROLLBACK
mysql -u hackarena_app -pHackArena@2026 hackarena_db < sql/06_tcl_examples.sql

# 5. DQL: Joins, Aggregates, GROUP BY HAVING, Set Operations, Subqueries, Leaderboard
mysql -u hackarena_app -pHackArena@2026 hackarena_db < sql/07_select_queries.sql

# 6. Views & Materialized Reporting Simulation:
mysql -u hackarena_app -pHackArena@2026 hackarena_db < sql/08_views_reporting.sql

# 7. Stored Procedures, Functions, & Triggers:
mysql -u hackarena_app -pHackArena@2026 hackarena_db < sql/09_routines_triggers.sql
```

---

## 8. Starting Backend & Frontend

### 1. Start the Backend API (Terminal 1)
```bash
cd backend
npm start
# Server listens on http://localhost:5000
```

### 2. Start the Frontend Dev Server (Terminal 2)
```bash
cd frontend
npm run dev
# Vite runs on http://localhost:5173
```

Open your browser and navigate to: **`http://localhost:5173`**

### Pre-Seeded Login Credentials:
- **Administrator:**
  - Email: `admin@hackarena.com`
  - Password: `Admin@123`
- **Participant:**
  - Email: `aarav.sharma@mit.edu`
  - Password: `Password@123`

---

## 9. Running Automated Tests

Run the full end-to-end integration test suite against the live MySQL database:
```bash
cd backend
npm test
```
**Expected Output:** `20 PASSED, 0 FAILED`.

---

## 10. Troubleshooting Common Issues

### 1. Error: `ER_ACCESS_DENIED_ERROR` for user 'hackarena_app'
- Ensure you created the user and granted privileges:
  ```sql
  GRANT ALL PRIVILEGES ON hackarena_db.* TO 'hackarena_app'@'localhost';
  FLUSH PRIVILEGES;
  ```

### 2. Error: `ERROR 1419 (HY000): You do not have the SUPER privilege and binary logging is enabled`
- Run this command in MySQL as root:
  ```sql
  SET GLOBAL log_bin_trust_function_creators = 1;
  ```

### 3. Error: `Port 5000 or 5173 already in use`
- Change `PORT=5001` in `backend/.env`, and adjust the Vite proxy in `frontend/vite.config.js`.

---

## 11. Project Structure

```text
dbms-project/
├── backend/
│   ├── src/
│   │   ├── config/          # MySQL connection pool (mysql2/promise)
│   │   ├── controllers/     # Business logic & parameter validation
│   │   ├── middleware/      # JWT cookie authentication & MySQL error mapping
│   │   ├── routes/          # Express API route endpoints
│   │   ├── app.js           # Express app setup and middleware
│   │   └── server.js        # Server entry point
│   ├── scripts/             # seedAdmin.js script
│   ├── tests/               # api.test.js automated integration test suite
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # Badges, Modals, StatCards, Navbar, ProtectedRoute
│   │   ├── context/         # AuthContext.jsx session state
│   │   ├── pages/           # Public, Admin, and Participant dashboard pages
│   │   ├── services/        # api.js fetch client with credentials
│   │   ├── index.css        # Clean responsive light design system
│   │   └── App.jsx          # React Router DOM configuration
│   ├── package.json
│   └── .env.example
├── sql/
│   ├── 01_schema.sql
│   ├── 02_seed_data.sql
│   ├── 03_ddl_examples.sql
│   ├── 04_dml_examples.sql
│   ├── 05_dcl_examples.sql
│   ├── 06_tcl_examples.sql
│   ├── 07_select_queries.sql
│   ├── 08_views_reporting.sql
│   ├── 09_routines_triggers.sql
│   └── README.md
├── docs/
│   ├── project_report.md    # 13-section comprehensive college DBMS report
│   ├── normalization.md     # Step-by-step 1NF, 2NF, 3NF mathematical proof
│   ├── database_design.md   # Data dictionary, cardinalities & ERD discussion
│   ├── testing_report.md    # 48 verified test cases and logs
│   ├── er_diagram.dbml      # DBML source for ER diagram
│   ├── er_diagram.svg       # Vector ER diagram export
│   └── relational_schema.svg# Vector relational schema diagram export
├── .gitignore
└── README.md
```

---

## 12. Documentation Directory

For complete academic project submission, refer to the files in `docs/`:
- [docs/project_report.md](file:///Users/pritpatel/Desktop/dbms-project/docs/project_report.md)
- [docs/normalization.md](file:///Users/pritpatel/Desktop/dbms-project/docs/normalization.md)
- [docs/database_design.md](file:///Users/pritpatel/Desktop/dbms-project/docs/database_design.md)
- [docs/testing_report.md](file:///Users/pritpatel/Desktop/dbms-project/docs/testing_report.md)
- [docs/er_diagram.svg](file:///Users/pritpatel/Desktop/dbms-project/docs/er_diagram.svg)
- [docs/relational_schema.svg](file:///Users/pritpatel/Desktop/dbms-project/docs/relational_schema.svg)
