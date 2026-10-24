# Database Normalization Report: HackArena

**System Name:** HackArena: Hackathon Management and Project Evaluation System  
**Engine:** MySQL 8.4 LTS / InnoDB  
**Target Normal Form:** Third Normal Form (3NF)  
**Author Group:** Computer Engineering Student Lab Group (Team of 3)

---

## 1. Executive Summary & Normalization Objectives

Database normalization is the formal mathematical process of decomposing complex, anomalous relations into smaller, well-structured relations. The primary objectives in designing the **HackArena** relational schema are:

1. **Elimination of Data Redundancy:** Preventing identical participant, team, and hackathon attributes from being stored repeatedly.
2. **Elimination of Update Anomalies:** Ensuring that updating an entity's attribute (e.g., a participant's phone number or a hackathon's deadline) occurs in exactly one tuple.
3. **Elimination of Insertion Anomalies:** Ensuring that a new hackathon or participant can be registered without being prematurely forced to create dummy teams or null submissions.
4. **Elimination of Deletion Anomalies:** Ensuring that removing a project submission or team does not unintentionally wipe out the existence of the hosting hackathon or registered participants.

The final decomposed schema contains **exactly six core normalized tables**:
1. `admins`
2. `participants`
3. `hackathons`
4. `teams`
5. `team_members`
6. `submissions`

---

## 2. Unnormalized Form (UNF)

In an unnormalized state, a naive monolithic spreadsheet or flat table is used to capture all operational data regarding hackathons, participants, teams, and project submissions in a single relation.

### Monolithic Relation: `UNF_HACKATHON_RECORDS`

```text
UNF_HACKATHON_RECORDS(
    hackathon_id, title, description, start_date, end_date, registration_deadline, status,
    team_name,
    { participant_id, participant_name, participant_email, college, phone, member_role },
    project_title, project_desc, github_link, score, feedback, evaluated_by_admin_id, admin_name, admin_email, submission_status
)
```

### Realistic Sample Row in UNF

| Field | UNF Data Row Example |
|---|---|
| `hackathon_id` | 1 |
| `title` | Cloud Innovators Summit 2026 |
| `description` | Build scalable distributed architectures... |
| `start_date` | 2026-01-10 |
| `end_date` | 2026-01-12 |
| `registration_deadline` | 2026-01-08 |
| `status` | Completed |
| `team_name` | Team Alpha |
| **Members (Repeating Group)** | `[(1, 'Aarav Sharma', 'aarav.sharma@mit.edu', 'MIT', '+1-617-555-0101', 'Leader'), (2, 'Priya Patel', 'priya.patel@stanford.edu', 'Stanford', '+1-650-555-0102', 'Member'), (3, 'Rohan Verma', 'rohan.verma@berkeley.edu', 'UC Berkeley', '+1-510-555-0103', 'Member')]` |
| `project_title` | ServerlessMesh |
| `project_desc` | Edge computing orchestration with Wasm |
| `github_link` | `https://github.com/hackarena/serverless-mesh` |
| `score` | 95.50 |
| `feedback` | Exceptional modular architecture and benchmarks. |
| `evaluated_by_admin_id`| 1 |
| `admin_name` | Alex Mercer |
| `admin_email` | `admin@hackarena.com` |
| `submission_status` | Evaluated |

### Critical Anomalies in UNF:
- **Repeating Groups:** Multiple participants and their roles exist as multivalued collections within a single team record.
- **Insertion Anomaly:** A newly published hackathon cannot be inserted until a team forms and submits.
- **Deletion Anomaly:** Deleting a disqualified team erases the entire hackathon event record if it was the only team.

---

## 3. First Normal Form (1NF)

### Formal Definition:
A relation $R$ is in **First Normal Form (1NF)** if and only if all underlying attribute domains contain only atomic (indivisible) values, and there are no repeating groups or multivalued arrays.

### 1NF Transformation:
1. Flatten multivalued collections: each team member receives a discrete, atomic tuple.
2. Select a composite identifier capable of uniquely identifying every row:
   $$\text{Candidate Key} = (\text{hackathon\_id}, \text{team\_name}, \text{participant\_id})$$

### Relation: `FLAT_1NF_SCHEMA`

```text
FLAT_1NF_SCHEMA(
    hackathon_id, title, description, start_date, end_date, registration_deadline, hackathon_status,
    team_name,
    participant_id, participant_name, participant_email, college, phone, member_role,
    project_title, project_desc, github_link, score, feedback, evaluated_by_admin_id, admin_name, admin_email, submission_status
)
```

### Realistic Sample Tuples in 1NF

| hackathon_id | title | team_name | participant_id | participant_name | member_role | project_title | score | admin_name |
|---|---|---|---|---|---|---|---|---|
| 1 | Cloud Innovators | Team Alpha | 1 | Aarav Sharma | Leader | ServerlessMesh | 95.50 | Alex Mercer |
| 1 | Cloud Innovators | Team Alpha | 2 | Priya Patel | Member | ServerlessMesh | 95.50 | Alex Mercer |
| 1 | Cloud Innovators | Team Alpha | 3 | Rohan Verma | Member | ServerlessMesh | 95.50 | Alex Mercer |
| 1 | Cloud Innovators | ByteForce | 4 | Ananya Iyer | Leader | CloudOptima | 88.00 | Alex Mercer |

### 1NF Assessment & Residual Anomalies:
Although all attributes are atomic, **FLAT_1NF_SCHEMA suffers from severe Partial Functional Dependencies**. Non-key attributes depend on only parts of the composite candidate key:
- `title`, `start_date`, `end_date` depend *only* on `hackathon_id`.
- `participant_name`, `college`, `phone` depend *only* on `participant_id`.
- `project_title`, `score` depend *only* on `(hackathon_id, team_name)`.

---

## 4. Second Normal Form (2NF)

### Formal Definition:
A relation $R$ is in **Second Normal Form (2NF)** if and only if:
1. It is already in 1NF.
2. Every non-prime attribute is **fully functionally dependent** on the primary key (i.e., there are **no partial dependencies** on any proper subset of a composite candidate key).

### Identification of Partial Dependencies in 1NF:
Given Primary Key: `(hackathon_id, team_name, participant_id)`:
1. $FD_1: \{\text{hackathon\_id}\} \rightarrow \{\text{title}, \text{description}, \text{start\_date}, \text{end\_date}, \text{registration\_deadline}, \text{hackathon\_status}\}$  
   *(Partial dependency on hackathon_id alone)*
2. $FD_2: \{\text{participant\_id}\} \rightarrow \{\text{participant\_name}, \text{participant\_email}, \text{college}, \text{phone}\}$  
   *(Partial dependency on participant_id alone)*
3. $FD_3: \{\text{hackathon\_id}, \text{team\_name}\} \rightarrow \{\text{project\_title}, \text{project\_desc}, \text{github\_link}, \text{score}, \text{feedback}, \text{evaluated\_by\_admin\_id}, \text{admin\_name}, \text{admin\_email}, \text{submission\_status}\}$  
   *(Partial dependency on {hackathon_id, team_name})*
4. $FD_4: \{\text{hackathon\_id}, \text{team\_name}, \text{participant\_id}\} \rightarrow \{\text{member\_role}, \text{joined\_at}\}$  
   *(Full dependency on complete composite key)*

### 2NF Decomposition:
To eliminate partial dependencies, we decompose into four relations and introduce surrogate keys (`team_id`, `submission_id`) for clean referential integrity:

1. `HACKATHONS_2NF` (Key: `hackathon_id`)
   - Attributes: `hackathon_id`, `title`, `description`, `start_date`, `end_date`, `registration_deadline`, `status`
2. `PARTICIPANTS_2NF` (Key: `participant_id`)
   - Attributes: `participant_id`, `name`, `email`, `password_hash`, `college`, `phone`
3. `TEAMS_2NF` (Key: `team_id`, Alternate Key: `{hackathon_id, team_name}`)
   - Attributes: `team_id`, `team_name`, `hackathon_id`
4. `TEAM_MEMBERS_2NF` (Key: `{team_id, participant_id}`)
   - Attributes: `team_id`, `participant_id`, `role`, `joined_at`
5. `SUBMISSIONS_2NF` (Key: `submission_id`, Alternate Key: `team_id`)
   - Attributes: `submission_id`, `team_id`, `project_title`, `description`, `github_link`, `score`, `feedback`, `evaluated_by_admin_id`, `admin_name`, `admin_email`, `status`

### 2NF Assessment & Residual Anomalies:
`SUBMISSIONS_2NF` is in 2NF because its primary key `submission_id` is a single attribute (no partial dependencies are possible with a single-attribute key).  
However, `SUBMISSIONS_2NF` contains a **Transitive Dependency**:
$$\text{submission\_id} \rightarrow \text{evaluated\_by\_admin\_id} \rightarrow \{\text{admin\_name}, \text{admin\_email}\}$$
If Admin Alex Mercer's email changes, multiple submission rows would have to be updated. If an admin has evaluated no projects yet, their account cannot be recorded without null submissions.

---

## 5. Third Normal Form (3NF)

### Formal Definition:
A relation $R$ is in **Third Normal Form (3NF)** if and only if:
1. It is already in 2NF.
2. There are **no transitive dependencies** of non-prime attributes on the primary key.  
   *(Formal criterion: For every non-trivial functional dependency $X \rightarrow Y$, either $X$ is a superkey, or $Y$ is a prime attribute).*

### Identification and Elimination of Transitive Dependencies:
In `SUBMISSIONS_2NF`:
- Dependency 1: $\text{submission\_id} \rightarrow \text{evaluated\_by}$ (where `evaluated_by` is `admin_id`).
- Dependency 2: $\text{evaluated\_by} \rightarrow \{\text{admin\_name}, \text{admin\_email}\}$.
- Transitive: $\text{submission\_id} \rightarrow \text{admin\_name}, \text{admin\_email}$ through `evaluated_by`.

We decompose `SUBMISSIONS_2NF` by extracting the `admins` relation:
1. `admins` (Key: `admin_id`)
   - Attributes: `admin_id`, `name`, `email`, `password_hash`, `created_at`
2. `submissions` (Key: `submission_id`, FK: `team_id`, FK: `evaluated_by`)
   - Attributes: `submission_id`, `team_id`, `project_title`, `description`, `github_link`, `submitted_at`, `score`, `feedback`, `evaluated_by`, `status`

---

## 6. Final 3NF Relational Schema & Functional Dependencies

### Relation 1: `admins`
- **Attributes:** `(admin_id, name, email, password_hash, created_at)`
- **Candidate Keys:** `{admin_id}`, `{email}`
- **Primary Key:** `admin_id`
- **Alternate Key:** `email`
- **Functional Dependencies:**
  - $admin\_id \rightarrow \{name, email, password\_hash, created\_at\}$
  - $email \rightarrow \{admin\_id, name, password\_hash, created\_at\}$
- **3NF Verification:** For every FD, the determinant is a superkey. No transitive dependencies.

### Relation 2: `participants`
- **Attributes:** `(participant_id, name, email, password_hash, college, phone, created_at)`
- **Candidate Keys:** `{participant_id}`, `{email}`
- **Primary Key:** `participant_id`
- **Alternate Key:** `email`
- **Functional Dependencies:**
  - $participant\_id \rightarrow \{name, email, password\_hash, college, phone, created\_at\}$
  - $email \rightarrow \{participant\_id, name, password\_hash, college, phone, created\_at\}$
- **3NF Verification:** Every determinant is a candidate key. No transitive dependencies.

### Relation 3: `hackathons`
- **Attributes:** `(hackathon_id, title, description, start_date, end_date, registration_deadline, status, created_at)`
- **Candidate Keys:** `{hackathon_id}`
- **Primary Key:** `hackathon_id`
- **Functional Dependencies:**
  - $hackathon\_id \rightarrow \{title, description, start\_date, end\_date, registration\_deadline, status, created\_at\}$
- **3NF Verification:** The determinant is the primary key. All non-key attributes depend directly and exclusively on `hackathon_id`.

### Relation 4: `teams`
- **Attributes:** `(team_id, team_name, hackathon_id, created_at)`
- **Candidate Keys:** `{team_id}`, `{hackathon_id, team_name}`
- **Primary Key:** `team_id`
- **Alternate Key:** `{hackathon_id, team_name}`
- **Foreign Key:** `hackathon_id REFERENCES hackathons(hackathon_id)`
- **Functional Dependencies:**
  - $team\_id \rightarrow \{team\_name, hackathon\_id, created\_at\}$
  - $\{hackathon\_id, team\_name\} \rightarrow \{team\_id, created\_at\}$
- **3NF Verification:** Every determinant is a candidate key.

### Relation 5: `team_members`
- **Attributes:** `(team_id, participant_id, role, joined_at)`
- **Candidate Keys:** `{team_id, participant_id}`
- **Primary Key:** `{team_id, participant_id}` (Composite)
- **Foreign Keys:**
  - `team_id REFERENCES teams(team_id)`
  - `participant_id REFERENCES participants(participant_id)`
- **Functional Dependencies:**
  - $\{team\_id, participant\_id\} \rightarrow \{role, joined\_at\}$
- **3NF Verification:** No partial dependencies (neither `role` nor `joined_at` is determined by `team_id` alone or `participant_id` alone). No transitive dependencies.

### Relation 6: `submissions`
- **Attributes:** `(submission_id, team_id, project_title, description, github_link, submitted_at, score, feedback, evaluated_by, status)`
- **Candidate Keys:** `{submission_id}`, `{team_id}`
- **Primary Key:** `submission_id`
- **Alternate Key:** `team_id` (enforces exactly 1 submission per team)
- **Foreign Keys:**
  - `team_id REFERENCES teams(team_id)`
  - `evaluated_by REFERENCES admins(admin_id)`
- **Functional Dependencies:**
  - $submission\_id \rightarrow \{team\_id, project\_title, description, github\_link, submitted\_at, score, feedback, evaluated\_by, status\}$
  - $team\_id \rightarrow \{submission\_id, project\_title, description, github\_link, submitted\_at, score, feedback, evaluated\_by, status\}$
- **3NF Verification:** Every determinant is a candidate key. Transitive attributes of the evaluator (`admin_name`, `admin_email`) have been decoupled into `admins`.

---

## 7. Comparative Summary Matrix

| Form | Condition Satisfied | Residual Problem Eliminated | Status in HackArena |
|---|---|---|---|
| **UNF** | Raw unorganized attributes | None | Initial state |
| **1NF** | Atomic attribute domains, no repeating groups | Multivalued participant arrays flattened | Satisfied |
| **2NF** | In 1NF + No partial functional dependencies on composite keys | Extracted `hackathons`, `participants`, and `teams` | Satisfied |
| **3NF** | In 2NF + No transitive dependencies on non-key attributes | Decoupled `admins` from `submissions` | **Fully Achieved** |

---

## 8. Conclusion

The relational model of **HackArena** strictly satisfies **Third Normal Form (3NF)** and also satisfies **Boyce-Codd Normal Form (BCNF)** because every determinant across all six relations is a superkey ($X$ is a superkey for every $X \rightarrow Y$).

Data redundancy is completely avoided:
- Admin profiles exist in 1 row.
- Participant profiles exist in 1 row.
- Hackathon event dates exist in 1 row.
- Team membership is cleanly normalized via associative entity `team_members`.
- Submissions are isolated with evaluation audit tracking.
