# Database Design Document: HackArena

**System Name:** HackArena: Hackathon Management and Project Evaluation System  
**RDBMS Engine:** MySQL 8.4 LTS (InnoDB Storage Engine, UTF8mb4 Character Set)  
**Academic Level:** Third-Year Computer Engineering DBMS Project  

---

## 1. System Overview & Conceptual Architecture

HackArena is a purpose-built relational database management system designed to coordinate hackathon competitions, team formations, project deliverables, and academic evaluations. The database architecture prioritizes **referential integrity, transactional consistency, and non-redundant normalization up to 3NF**.

The architecture intentionally consists of **exactly six core relational tables**:
1. `admins`
2. `participants`
3. `hackathons`
4. `teams`
5. `team_members`
6. `submissions`

---

## 2. Comprehensive Data Dictionary

### Table 1: `admins`
System administrators who configure hackathon timelines, evaluate student deliverables, and certify leaderboard results. Seeded via environment variables and administrative scripts; has no public self-registration.

| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `admin_id` | INT | NO | **PK**, AUTO_INCREMENT | Unique identifier for each administrator |
| `name` | VARCHAR(100) | NO | — | Full legal or professional name |
| `email` | VARCHAR(100) | NO | **UNIQUE** | Official administrative contact email |
| `password_hash`| VARCHAR(255) | NO | — | Bcrypt cryptographic hash (salt rounds: 10) |
| `created_at` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |

---

### Table 2: `participants`
Undergraduate and graduate engineering students who register on HackArena to participate in hackathon competitions.

| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `participant_id` | INT | NO | **PK**, AUTO_INCREMENT | Unique surrogate identifier for student |
| `name` | VARCHAR(100) | NO | — | Student's full name |
| `email` | VARCHAR(100) | NO | **UNIQUE** | Student university email (login identifier) |
| `password_hash`| VARCHAR(255) | NO | — | Bcrypt password hash |
| `college` | VARCHAR(100) | YES | — | Enrolled university or engineering college |
| `phone` | VARCHAR(15) | YES | — | Contact telephone number (max 15 chars) |
| `created_at` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | Registration timestamp |

---

### Table 3: `hackathons`
Events managed by administrators with strict temporal lifecycle constraints.

| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `hackathon_id` | INT | NO | **PK**, AUTO_INCREMENT | Unique event identifier |
| `title` | VARCHAR(100) | NO | — | Official title of the hackathon |
| `description` | TEXT | YES | — | Event scope, track specifications, and guidelines |
| `start_date` | DATE | NO | CHECK (`start_date <= end_date`) | Date competition begins |
| `end_date` | DATE | NO | — | Date competition concludes |
| `registration_deadline` | DATE | NO | CHECK (`registration_deadline <= start_date`) | Last date for team formation |
| `status` | ENUM | NO | DEFAULT 'Upcoming' | Lifecycle state: 'Upcoming', 'Ongoing', 'Completed' |
| `created_at` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |

*Table-Level Constraints:*
- `CONSTRAINT chk_hackathon_dates CHECK (registration_deadline <= start_date AND start_date <= end_date)`

---

### Table 4: `teams`
Collaborative teams formed for a specific hackathon competition.

| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `team_id` | INT | NO | **PK**, AUTO_INCREMENT | Unique surrogate identifier for the team |
| `team_name` | VARCHAR(100) | NO | — | Display name of the team |
| `hackathon_id` | INT | NO | **FK** &rarr; `hackathons.hackathon_id` | Referenced hackathon event |
| `created_at` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | Timestamp team was created |

*Table-Level Constraints & Referential Actions:*
- `CONSTRAINT uq_hackathon_team_name UNIQUE (hackathon_id, team_name)`: Enforces unique team names within each hackathon event.
- `FOREIGN KEY (hackathon_id) REFERENCES hackathons(hackathon_id) ON DELETE RESTRICT ON UPDATE CASCADE`: Prevents accidental deletion of a hackathon if registered teams exist.

---

### Table 5: `team_members`
Associative relational entity resolving the Many-to-Many ($M:N$) relationship between `participants` and `teams`.

| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `team_id` | INT | NO | **PK**, **FK** &rarr; `teams.team_id` | Part of composite primary key |
| `participant_id`| INT | NO | **PK**, **FK** &rarr; `participants.participant_id`| Part of composite primary key |
| `role` | ENUM | NO | DEFAULT 'Member' | Participant's role: 'Leader' or 'Member' |
| `joined_at` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | Timestamp participant joined team |

*Composite Primary Key:*
- `PRIMARY KEY (team_id, participant_id)`: Mathematically guarantees that a student cannot be added to the exact same team more than once.

*Referential Actions:*
- `FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE ON UPDATE CASCADE`: Legitimate team deletions clean up member assignments.
- `FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE RESTRICT ON UPDATE CASCADE`: Prevents deleting a student account if they belong to active teams.

---

### Table 6: `submissions`
Final software project deliverables submitted by teams for evaluation.

| Column Name | Data Type | Nullable | Key / Constraint | Description |
|---|---|---|---|---|
| `submission_id`| INT | NO | **PK**, AUTO_INCREMENT | Unique deliverable identifier |
| `team_id` | INT | NO | **FK** &rarr; `teams.team_id`, **UNIQUE** | Exactly one submission permitted per team |
| `project_title`| VARCHAR(100) | NO | — | Name of the project/application |
| `description` | TEXT | YES | — | Architecture, features, and tech stack notes |
| `github_link` | VARCHAR(255) | YES | — | Source code repository URL |
| `submitted_at` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | Submission timestamp |
| `score` | DECIMAL(5,2)| YES | CHECK (`0.00 <= score <= 100.00`) | Evaluation mark assigned by administrator |
| `feedback` | TEXT | YES | — | Qualitative critique and feedback |
| `evaluated_by` | INT | YES | **FK** &rarr; `admins.admin_id` | Administrator who evaluated the project |
| `status` | ENUM | NO | DEFAULT 'Pending' | 'Pending' or 'Evaluated' |

*Integrity Constraints:*
- `CONSTRAINT uq_submissions_team UNIQUE (team_id)`: Guarantees a 1-to-1 relationship between teams and submissions.
- `CONSTRAINT chk_submission_score CHECK (score IS NULL OR (score >= 0.00 AND score <= 100.00))`
- `CONSTRAINT chk_submission_status_consistency CHECK ((status = 'Pending' AND score IS NULL AND evaluated_by IS NULL) OR (status = 'Evaluated' AND score IS NOT NULL AND evaluated_by IS NOT NULL))`
- `FOREIGN KEY (evaluated_by) REFERENCES admins(admin_id) ON DELETE RESTRICT ON UPDATE RESTRICT`: Preserves audit trails of evaluations.

---

## 3. Relational Cardinalities & Participation Constraints

```text
+----------------+          1 : N (0..*)          +------------+
|   hackathons   | -----------------------------> |   teams    |
+----------------+                                +------------+
       |                                                 |
       |                                    1 : N (1..*) |
       |                                                 v
       |                                      +--------------------+
       |                                      |    team_members    |
       |                                      +--------------------+
       |                                                 ^
       |                                    1 : N (0..*) |
       |                                                 |
       |                                          +----------------+
       |                                          |  participants  |
       |                                          +----------------+
       |                                                 
       |         1 : 1 (0..1)             1 : N (0..*)
+------------+ <------------ +-------------+ <------------ +------------+
|   teams    |               | submissions |               |   admins   |
+------------+               +-------------+               +------------+
```

1. **`hackathons` &rarr; `teams` ($1 : N$):**
   - *Cardinality:* One hackathon can have zero, one, or many registered teams ($0..N$). A team must belong to exactly one hackathon ($1..1$).
   - *Participation:* Total for `teams` (`hackathon_id NOT NULL`), partial for `hackathons` (a newly scheduled hackathon initially has 0 teams).

2. **`participants` &rarr; `teams` via `team_members` ($M : N$):**
   - *Cardinality:* A participant can belong to multiple teams (across different hackathons). A team consists of multiple participants (1 Leader + 0..N Members).
   - *Resolution:* Resolved by associative table `team_members` with composite key `(team_id, participant_id)`.

3. **`teams` &rarr; `submissions` ($1 : 1$):**
   - *Cardinality:* A team submits at most one project ($0..1$). A submission belongs to exactly one team ($1..1$).
   - *Enforcement:* `team_id` in `submissions` is constrained with `UNIQUE`.

4. **`admins` &rarr; `submissions` ($1 : N$):**
   - *Cardinality:* An administrator may evaluate zero, one, or multiple submissions ($0..N$). An evaluated submission is evaluated by exactly one admin ($1..1$ when Evaluated; null when Pending).

---

## 4. Specialization and Generalization Analysis

In conceptual DBMS design, **Generalization** (bottom-up synthesis) and **Specialization** (top-down breakdown) model superclass/subclass inheritance hierarchies (e.g., a generalized `Users` superclass with specialized `Admin` and `Participant` subclasses).

### Academic Evaluation of Generalization for HackArena:
1. **Divergent Lifecycles:**
   - `participants` register freely through public self-service portals, join teams, and submit code deliverables.
   - `admins` are system staff seeded directly by administrative provisioning with heightened database privileges; no public registration endpoint exists.
2. **Disjoint Attributes:**
   - Participants have academic attributes (`college`, `phone`, team memberships).
   - Admins have no college or team affiliations; they possess administrative privileges and evaluation authority.
3. **Prevention of Null Sparseness & Table Bloat:**
   - Unifying Admin and Participant into a single `users` table with a `role` discriminator would leave role-specific foreign keys (`evaluated_by`) and attributes (`college`, `phone`) null-sparse across user records.
4. **Relational Conclusion:**
   - HackArena deliberately models `admins` and `participants` as **independent first-class entities**. This avoids artificial subtype joins, simplifies authorization checks, and strictly reflects real-world separation of responsibilities.
