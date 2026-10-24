# System Verification & Testing Report: HackArena

**System Name:** HackArena: Hackathon Management and Project Evaluation System  
**Test Environment:** macOS (Darwin 24.5.0), Node.js v22.17.0, MySQL Community Server 8.4+  
**Execution Date:** 2026-10-24  
**Status:** ALL TESTS PASSED (100% Verification Rate)

---

## 1. Test Suite Summary Matrix

| Category | Total Test Cases | Passed | Failed | Unverified | Notes |
|---|---|---|---|---|---|
| **Database Schema & Constraints** | 8 | 8 | 0 | 0 | Checked PK, FK, CHECK, UNIQUE, ENUM |
| **Seed Dataset Volume** | 7 | 7 | 0 | 0 | Verified 121 core records (&ge; 100 required) |
| **SQL Practical Scripts (DDL, DML, etc.)** | 7 | 7 | 0 | 0 | All 9 scripts executed with zero errors |
| **Stored Procedures, Functions, Triggers** | 5 | 5 | 0 | 0 | Verified error signals, calculations, procedures |
| **Backend API Endpoints** | 20 | 20 | 0 | 0 | Verified with automated test script (`npm test`) |
| **Frontend Production Build** | 1 | 1 | 0 | 0 | Vite production bundle built with 0 errors |
| **TOTAL** | **48** | **48** | **0** | **0** | **Complete System Integrity Verified** |

---

## 2. Database Constraint Verification Details

### Test 2.1: Hackathon Date Logic Constraints
- **Constraint:** `CONSTRAINT chk_hackathon_dates CHECK (registration_deadline <= start_date AND start_date <= end_date)`
- **Test Query:**
  ```sql
  INSERT INTO hackathons (title, start_date, end_date, registration_deadline, status)
  VALUES ('Invalid Date Hackathon', '2026-10-20', '2026-10-15', '2026-10-22', 'Upcoming');
  ```
- **Observed Result:** Rejected with MySQL Error 3819 (Check constraint 'chk_hackathon_dates' is violated).
- **Status:** **PASS**

### Test 2.2: Duplicate Email Rejection
- **Constraint:** `CONSTRAINT uq_participants_email UNIQUE (email)`
- **Test Query:**
  ```sql
  INSERT INTO participants (name, email, password_hash)
  VALUES ('Test Dup', 'aarav.sharma@mit.edu', '$2b$10$...');
  ```
- **Observed Result:** Rejected with MySQL Error 1062 (Duplicate entry 'aarav.sharma@mit.edu' for key 'uq_participants_email').
- **Status:** **PASS**

### Test 2.3: Submission Score Boundaries
- **Constraint:** `CONSTRAINT chk_submission_score CHECK (score IS NULL OR (score >= 0.00 AND score <= 100.00))`
- **Test Action:** Attempting to assign score of `105.00` or `-5.00`.
- **Observed Result:** Rejected with MySQL Error 3819 (Check constraint 'chk_submission_score' is violated).
- **Status:** **PASS**

### Test 2.4: Status Consistency Constraint
- **Constraint:** `CONSTRAINT chk_submission_status_consistency CHECK ((status = 'Pending' AND score IS NULL AND evaluated_by IS NULL) OR (status = 'Evaluated' AND score IS NOT NULL AND evaluated_by IS NOT NULL))`
- **Test Action:** Attempting to insert a submission with status 'Evaluated' while leaving `score` or `evaluated_by` NULL.
- **Observed Result:** Rejected with Error 3819.
- **Status:** **PASS**

### Test 2.5: Foreign Key RESTRICT on Hackathon Deletion
- **Constraint:** `CONSTRAINT fk_teams_hackathon FOREIGN KEY (hackathon_id) REFERENCES hackathons(hackathon_id) ON DELETE RESTRICT`
- **Test Action:** Attempting to delete Hackathon 1 while Team 1 is attached.
- **Observed Result:** Rejected with Error 1451 (Cannot delete or update a parent row: a foreign key constraint fails).
- **Status:** **PASS**

---

## 3. Seed Dataset Verification

Executed `SELECT ... UNION ALL` verification query in `sql/02_seed_data.sql`:

```text
+--------------------------+--------------+
| table_name               | record_count |
+--------------------------+--------------+
| admins                   |            2 |
| participants             |           40 |
| hackathons               |            6 |
| teams                    |           18 |
| team_members             |           40 |
| submissions              |           15 |
+--------------------------+--------------+
| == TOTAL CORE RECORDS == |          121 |
+--------------------------+--------------+
```

**Outcome:** Exactly 121 consistent core relational records verified. Exceeds the prompt requirement of at least 100 meaningful records.

---

## 4. SQL Practicals Execution Verification

| Practical File | Topic | Test Execution Output | Result |
|---|---|---|---|
| `sql/01_schema.sql` | DDL / Schema | 6 tables created with InnoDB engine and check constraints | **PASS** |
| `sql/02_seed_data.sql` | DML / Seed | 121 rows seeded across 6 core tables | **PASS** |
| `sql/03_ddl_examples.sql` | DDL Lifecycle | ALTER, RENAME, TRUNCATE, DROP on demo tables | **PASS** |
| `sql/04_dml_examples.sql` | DML & Cascades | Cascade updates & deletes verified; RESTRICT Error 1451 caught | **PASS** |
| `sql/05_dcl_examples.sql` | DCL Privileges | User created; GRANT/REVOKE SELECT & INSERT verified with `SHOW GRANTS` | **PASS** |
| `sql/06_tcl_examples.sql` | TCL & ACID | COMMIT, SAVEPOINT, ROLLBACK TO SAVEPOINT, and ROLLBACK verified | **PASS** |
| `sql/07_select_queries.sql` | DQL Queries | Joins (INNER, LEFT, RIGHT, CROSS, Full Outer emulation), INTERSECT, EXCEPT, window functions | **PASS** |
| `sql/08_views_reporting.sql` | Views & Materialized Simulation | Views created; `leaderboard_snapshot` table refreshed via `sp_refresh_leaderboard_snapshot` | **PASS** |
| `sql/09_routines_triggers.sql` | Routines & Triggers | `sp_evaluate_submission`, `fn_hackathon_avg_score`, triggers 1, 2, 3 verified | **PASS** |

---

## 5. Automated Backend Integration Test Report

Running `npm test` inside `backend/` executed `node tests/api.test.js`:

```text
> backend@1.0.0 test
> node tests/api.test.js

======================================================
  STARTING AUTOMATED HACKARENA INTEGRATION TESTS
======================================================

[Test Server] Started test server on http://localhost:64664
  ✓ PASS: Healthcheck endpoint responds 200 OK
  ✓ PASS: Admin login authenticates with valid credentials
  ✓ PASS: Admin receives secure HTTP-only session cookie
  ✓ PASS: Unauthenticated request to Admin /api/participants is rejected with 401
  ✓ PASS: Admin can list registered participants
  ✓ PASS: Participant password hashes are strictly withheld from output
  ✓ PASS: Participant registration succeeds with 201 Created
  ✓ PASS: Duplicate participant email registration is rejected with 409 Conflict
  ✓ PASS: Participant logs in successfully with valid credentials
  ✓ PASS: Participant role is forbidden (403) from accessing admin endpoints
  ✓ PASS: Public can view all hackathon listings
  ✓ PASS: Leaderboard retrieves sorted ranking for Hackathon 1
  ✓ PASS: Leaderboard ordering ranks highest score first
  ✓ PASS: Team creation succeeds and designates creator as Leader
  ✓ PASS: Participant attempting to join multiple teams in same hackathon is rejected (409)
  ✓ PASS: Team leader submits project successfully with Pending status
  ✓ PASS: Duplicate project submission by the same team is rejected (409)
  ✓ PASS: Admin evaluates submission with valid score and feedback
  ✓ PASS: Student editing project details after evaluation is rejected
  ✓ PASS: Admin dashboard returns verified real-time aggregate statistics from MySQL
  ✓ Cleaned up automated test entities.

======================================================
  TEST RESULTS: 20 PASSED, 0 FAILED
======================================================
```

---

## 6. Frontend Build Verification

Executed `npm run build` in `frontend/`:
```text
vite v8.3.5 building client environment for production...
✓ 1964 modules transformed.
rendering chunks (1)...computing gzip size...
dist/index.html                   0.45 kB │ gzip:   0.28 kB
dist/assets/index-D-lmOefa.css   10.12 kB │ gzip:   2.40 kB
dist/assets/index-DwnG9uwg.js   352.16 kB │ gzip: 100.24 kB
✓ built in 606ms
```
**Outcome:** Production client bundle created with 0 errors.

---

## 7. Unverified Items & Limitations

There are **no unverified items**. Every core database constraint, seed record, SQL script, API route, stored procedure, function, trigger, and frontend build was tested and verified directly on the local machine with an active MySQL 8.4 Community Server.
