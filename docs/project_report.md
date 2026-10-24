# Project Report: HackArena — Hackathon Management & Project Evaluation System

**Course:** Database Management Systems Laboratory (CS-302)  
**Academic Year:** 2025–2026  
**Department:** Computer Science & Engineering  
**Institution:** Faculty of Engineering & Technology  

---

## 1. Title and Project Statement

**Project Title:** HackArena: Hackathon Management and Project Evaluation System  
**Project Statement:**  
To design, normalize, implement, and verify a real-time, relational database-driven web application for managing technical hackathons. The system empowers administrators to schedule competition tracks and evaluate project submissions, while allowing student participants to form teams, invite peers, submit deliverables, and track transparent evaluation leaderboards.

---

## 2. Problem Overview

Higher education institutions and developer communities frequently host hackathons to encourage rapid software prototyping and collaborative problem-solving. However, organizing these events poses persistent data management challenges:
- **Disorganized Team Management:** Spreadsheets and chat channels lead to duplicate student registrations, teams with multiple or missing leaders, and members joining competing teams within the same event.
- **Untracked Deliverables:** Teams submit repositories across disparate channels, leading to missing evaluation links, untracked submission timestamps, and out-of-order reviews.
- **Data Redundancy & Anomalies:** Naive tabular tracking introduces insertion, update, and deletion anomalies, where editing a student's contact details or deleting a disqualified team corrupts event history.
- **Subjective or Inconsistent Evaluation:** Lack of centralized scoring rubrics, lack of audit trails, and untracked evaluator identities undermine the transparency and credibility of hackathon rankings.

---

## 3. Objectives

1. **Normalized Relational Architecture:** Model exactly six core entities up to Third Normal Form (3NF), eliminating redundancy and anomalies.
2. **Strict Integrity Enforcement:** Enforce domain integrity, entity integrity, and referential integrity using primary keys, composite keys, check constraints, foreign keys with appropriate referential actions (`RESTRICT`, `CASCADE`), and database triggers.
3. **End-to-End Functional Stack:** Deliver a full-stack system utilizing React.js (Vite), Node.js, Express.js, and MySQL 8.4 LTS connected via `mysql2/promise`.
4. **Comprehensive SQL Practicals:** Demonstrate all required DBMS academic topics: DDL, DML, DCL, TCL, DQL (joins, aggregates, subqueries, set operations), views, stored routines, and triggers.
5. **Real-time Leaderboard Ranking:** Provide deterministic ranking using MySQL window functions (`DENSE_RANK() OVER (ORDER BY score DESC, submitted_at ASC)`) with tie-breaking.

---

## 4. Use Cases and Real-World Applications

### Primary Actors:
1. **Administrator:**
   - Configure hackathons, specifying start/end dates and registration deadlines.
   - Monitor aggregate platform metrics (total teams, submissions, pending reviews).
   - Review submitted project repositories and assign scores (0.00–100.00) and qualitative feedback.
   - Publish real-time certified leaderboards.
2. **Participant:**
   - Register a personal profile and log in securely.
   - Browse upcoming and ongoing hackathon challenges.
   - Form a team (creator automatically becomes designated Team Leader).
   - Add registered peers to the team via email (Leader only).
   - Submit project title, description, and GitHub repository URL.
   - View evaluation status, numerical score, and administrator feedback.

### Real-World Applications:
- University inter-collegiate coding competitions.
- Corporate internal hackathons and open-innovation sprints.
- Research accelerator program evaluations.

---

## 5. Scope and Limitations

### System Scope:
- Core operations: hackathon lifecycle management, team formation, project deliverable submission, and administrator evaluation.
- Clean two-role security boundary (Admin vs. Participant) using HTTP-only JWT cookies.
- Six core relational tables: `admins`, `participants`, `hackathons`, `teams`, `team_members`, `submissions`.

### System Limitations:
- Single-tier evaluation: All project scores are directly evaluated by administrators; separate judge scoring rubrics, external mentors, and sponsor booths are excluded.
- Single deliverable per team: Exactly one final code repository is submitted per team.
- Payment gateways, certificates generation, chat systems, and automated email dispatch are intentionally outside the DBMS laboratory scope.

---

## 6. Hardware and Software Requirements

### Hardware Requirements:
- **Processor:** Dual-Core x86_64 or Apple Silicon ARM64 (M-Series) processor.
- **Memory (RAM):** 4 GB minimum (8 GB recommended).
- **Storage:** 1 GB free disk space for MySQL data directories and Node dependencies.

### Software Requirements:
- **Operating System:** Windows 10/11, macOS 12+, or Ubuntu Linux 22.04+.
- **Database Engine:** MySQL 8.0.31+ / MySQL 8.4 LTS.
- **Backend Runtime:** Node.js v18.0+ / v22.x LTS.
- **Package Manager:** npm v9.0+.
- **Web Browser:** Google Chrome, Mozilla Firefox, or Microsoft Edge.
- **Client Tools:** MySQL Workbench / mysql CLI.

---

## 7. System Architecture

```text
[ React.js + Vite Client ]
          |
    HTTP / JSON (Credentials Included)
          v
[ Express.js REST API Server ]
    ├── authMiddleware (JWT Verification via HTTP-only Cookies)
    ├── Controllers (Input Validation, Business Logic)
    └── Centralized errorHandler (MySQL Error Code Mapping)
          |
    mysql2/promise Connection Pool
          v
[ MySQL 8.4 LTS Database Engine ]
    ├── Six Normalized Tables (InnoDB, utf8mb4)
    ├── Triggers & Check Constraints (Domain & Business Integrity)
    ├── Stored Procedures & Functions (ACID Evaluations & Metrics)
    └── Views (Dynamic Window Rankings & Snapshot Simulations)
```

---

## 8. ER Diagram and Relational Schema

### Entity-Relationship Diagram:
The complete ER diagram is documented in [docs/er_diagram.svg](file:///Users/pritpatel/Desktop/dbms-project/docs/er_diagram.svg) and editable via [docs/er_diagram.dbml](file:///Users/pritpatel/Desktop/dbms-project/docs/er_diagram.dbml).

**Entities & Keys:**
- `admins` (`admin_id` [PK], `email` [UQ])
- `participants` (`participant_id` [PK], `email` [UQ])
- `hackathons` (`hackathon_id` [PK])
- `teams` (`team_id` [PK], `(hackathon_id, team_name)` [UQ])
- `team_members` (`(team_id, participant_id)` [Composite PK])
- `submissions` (`submission_id` [PK], `team_id` [UQ])

### Relational Schema Diagram:
Refer to [docs/relational_schema.svg](file:///Users/pritpatel/Desktop/dbms-project/docs/relational_schema.svg) for exact relational mappings:
- `teams.hackathon_id` &rarr; `hackathons.hackathon_id` (`ON DELETE RESTRICT`)
- `team_members.team_id` &rarr; `teams.team_id` (`ON DELETE CASCADE`)
- `team_members.participant_id` &rarr; `participants.participant_id` (`ON DELETE RESTRICT`)
- `submissions.team_id` &rarr; `teams.team_id` (`ON DELETE CASCADE`)
- `submissions.evaluated_by` &rarr; `admins.admin_id` (`ON DELETE RESTRICT`)

---

## 9. Normalization up to 3NF

The complete formal normalization proof is presented in [docs/normalization.md](file:///Users/pritpatel/Desktop/dbms-project/docs/normalization.md).

- **1NF:** Flattened repeating multivalued participant arrays into individual atomic rows; composite key `(hackathon_id, team_name, participant_id)`.
- **2NF:** Removed partial functional dependencies by decomposing into `hackathons`, `participants`, `teams`, `team_members`, and `submissions`.
- **3NF:** Removed transitive functional dependencies ($\text{submission\_id} \rightarrow \text{evaluated\_by} \rightarrow \text{admin\_name}$) by isolating `admins`.
- **BCNF:** Satisfied because every functional dependency determinant $X$ across all six relations is a superkey.

---

## 10. SQL Implementation and Sample Queries

The application features 9 standalone, reproducible SQL scripts in `sql/`:

1. `sql/01_schema.sql`: Table definitions, PKs, FKs, CHECKs, and indexes.
2. `sql/02_seed_data.sql`: 121 verified records across all six tables.
3. `sql/03_ddl_examples.sql`: CREATE, ALTER, RENAME, TRUNCATE, DROP demonstrations.
4. `sql/04_dml_examples.sql`: INSERT, UPDATE CASCADE, DELETE CASCADE, and RESTRICT rejection.
5. `sql/05_dcl_examples.sql`: GRANT, REVOKE, and `SHOW GRANTS` on `hackarena_readonly`.
6. `sql/06_tcl_examples.sql`: START TRANSACTION, COMMIT, SAVEPOINT, ROLLBACK TO SAVEPOINT, ROLLBACK.
7. `sql/07_select_queries.sql`: Joins (INNER, LEFT, RIGHT, CROSS, Full Outer emulation), set operators (`UNION`, `INTERSECT`, `EXCEPT`), subqueries, and window functions.
8. `sql/08_views_reporting.sql`: Views `v_submission_details`, `v_leaderboard`, and `leaderboard_snapshot` procedure.
9. `sql/09_routines_triggers.sql`: `sp_evaluate_submission`, `fn_hackathon_avg_score`, triggers for single leader, unique hackathon participation, and evaluated lock.

### Key Query Highlight: Deterministic Leaderboard Ranking
```sql
SELECT 
    DENSE_RANK() OVER (ORDER BY s.score DESC, s.submitted_at ASC) AS `rank_position`,
    t.team_name,
    s.project_title,
    s.score,
    s.submitted_at,
    a.name AS evaluated_by
FROM submissions s
JOIN teams t ON s.team_id = t.team_id
JOIN admins a ON s.evaluated_by = a.admin_id
WHERE t.hackathon_id = 1 AND s.status = 'Evaluated'
ORDER BY `rank_position` ASC;
```

---

## 11. Testing Results

Comprehensive test logs are available in [docs/testing_report.md](file:///Users/pritpatel/Desktop/dbms-project/docs/testing_report.md).
- **Core Database Constraints:** 8/8 verified (duplicate email, check constraints, foreign key restrictions).
- **Seed Record Volume:** Verified 121 core records (&ge; 100 required).
- **Automated Backend Integration Tests:** 20/20 test cases passed with zero errors.
- **Frontend Production Build:** Vite build passed in 606ms.

---

## 12. Conclusion and Future Scope

### Conclusion:
HackArena successfully demonstrates the integration of rigorous relational database design with modern full-stack web engineering. All academic goals—normalization up to 3NF, data integrity constraints, ACID transactions, stored routines, triggers, and realistic seed data—have been practically achieved and verified against MySQL 8.4.

### Future Scope:
- Multi-criteria judging rubrics (e.g., separate marks for Innovation, UI/UX, and Code Architecture).
- Automated plagiarism and code similarity detection using AST comparisons.
- WebSocket integration for live leaderboard ranking ticker updates.

---

## 13. Team Contribution Section

This project was designed and built by a collaborative lab group of three computer engineering students:

### Student 1:
- **Name:** Prit Patel (Lead Developer & Database Architect)
- **Roll Number / Student ID:** CE-2026-001
- **Contributions:**
  - Relational schema design and 3NF normalization proof.
  - Core DDL, constraints, triggers, and stored routines implementation.
  - Express backend architecture, transaction handling, and API integration.

### Student 2:
- **Name:** Student 2 (Full-Stack & Frontend Engineer)
- **Roll Number / Student ID:** CE-2026-002
- **Contributions:**
  - React.js frontend interface, routing, and design system.
  - Admin and participant dashboard pages, modals, and tables.
  - State management and API service client implementation.

### Student 3:
- **Name:** Student 3 (SQL Practicals & Quality Assurance)
- **Roll Number / Student ID:** CE-2026-003
- **Contributions:**
  - Seed dataset generation (121 records) and verification queries.
  - SQL practical scripts (DDL, DML, DCL, TCL, DQL, Views).
  - Integration testing suite execution and test documentation.
