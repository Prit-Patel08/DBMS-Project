# HackArena Database SQL Scripts Reference

This directory contains the comprehensive, normalized MySQL 8.4+ database schema, seed data, and practical scripts covering every topic required in an advanced college Database Management Systems (DBMS) project.

---

## Script Execution Order

Execute the SQL scripts in numerical order for complete schema initialization, data population, and academic verification:

```bash
# 1. Connect to MySQL and create database & tables
mysql -u hackarena_app -pHackArena@2026 hackarena_db < sql/01_schema.sql

# 2. Populate 120+ consistent records across all 6 core tables
mysql -u hackarena_app -pHackArena@2026 hackarena_db < sql/02_seed_data.sql

# 3. Demonstrate Data Definition Language (DDL) on disposable tables
mysql -u hackarena_app -pHackArena@2026 hackarena_db < sql/03_ddl_examples.sql

# 4. Demonstrate Data Manipulation Language (DML), CASCADE & RESTRICT
mysql -u hackarena_app -pHackArena@2026 hackarena_db < sql/04_dml_examples.sql

# 5. Demonstrate Data Control Language (DCL - GRANT & REVOKE) *Requires Admin/Root*
mysql -u root -p hackarena_db < sql/05_dcl_examples.sql

# 6. Demonstrate Transaction Control Language (TCL - ACID, COMMIT, SAVEPOINT, ROLLBACK)
mysql -u hackarena_app -pHackArena@2026 hackarena_db < sql/06_tcl_examples.sql

# 7. Execute DQL queries (Joins, Aggregates, Subqueries, Set Operations, Leaderboard)
mysql -u hackarena_app -pHackArena@2026 hackarena_db < sql/07_select_queries.sql

# 8. Create Views and demonstrate Materialized View snapshot simulation
mysql -u hackarena_app -pHackArena@2026 hackarena_db < sql/08_views_reporting.sql

# 9. Create Stored Procedures, Functions, and Triggers with test cases
mysql -u hackarena_app -pHackArena@2026 hackarena_db < sql/09_routines_triggers.sql
```

---

## Detailed File Breakdown

| File | Category | Description | Primary SQL Features Used |
|---|---|---|---|
| `01_schema.sql` | DDL / Schema | Defines the 6 core normalized tables (`admins`, `participants`, `hackathons`, `teams`, `team_members`, `submissions`). | `ENGINE=InnoDB`, `utf8mb4`, `PRIMARY KEY`, `FOREIGN KEY`, `CHECK`, `UNIQUE`, `ON DELETE RESTRICT/CASCADE` |
| `02_seed_data.sql` | DML / Seed | Inserts 121 realistic records across all 6 core tables, with bcrypt password hashes and verification count query. | Multi-row `INSERT`, `SET FOREIGN_KEY_CHECKS`, aggregate verification union |
| `03_ddl_examples.sql` | DDL Practicals | Demonstrates non-destructive table lifecycle on disposable demo tables. | `CREATE TABLE`, `ALTER TABLE (ADD, MODIFY, DROP, CONSTRAINT)`, `RENAME TABLE`, `TRUNCATE TABLE`, `DROP TABLE` |
| `04_dml_examples.sql` | DML Practicals | Demonstrates data insertion, cascading primary key updates, cascading deletes, and foreign key RESTRICT rejection. | `INSERT`, `UPDATE`, `ON UPDATE CASCADE`, `ON DELETE CASCADE`, `ON DELETE RESTRICT` (Error 1451 handled) |
| `05_dcl_examples.sql` | DCL Practicals | Demonstrates user privilege management using a dedicated least-privilege account (`hackarena_readonly`). | `CREATE USER`, `GRANT SELECT`, `GRANT INSERT`, `REVOKE`, `SHOW GRANTS` |
| `06_tcl_examples.sql` | TCL Practicals | Demonstrates ACID transaction management on InnoDB engine. | `START TRANSACTION`, `COMMIT`, `SAVEPOINT`, `ROLLBACK TO SAVEPOINT`, `ROLLBACK` |
| `07_select_queries.sql` | DQL Practicals | Demonstrates exhaustive data retrieval techniques with HackArena records. | `WHERE`, `COUNT/AVG/MIN/MAX`, `GROUP BY ... HAVING`, `INNER/LEFT/RIGHT/CROSS JOIN`, Full Outer Join emulation, `UNION`, `INTERSECT`, `EXCEPT`, Scalar & Correlated Subqueries, `EXISTS`, `ANY`, `ALL` |
| `08_views_reporting.sql` | Views & Materialized Reporting | Creates dynamic multi-table views and demonstrates the Materialized View pattern using a physical snapshot table. | `CREATE OR REPLACE VIEW`, Window Functions (`DENSE_RANK() OVER`), derived table `leaderboard_snapshot`, refresh procedure |
| `09_routines_triggers.sql` | Stored Routines & Triggers | Production business rules and evaluation automation. | `CREATE PROCEDURE`, `CREATE FUNCTION`, `BEFORE INSERT/UPDATE TRIGGERS`, `SIGNAL SQLSTATE '45000'` |

---

## Important Configuration Notes

### 1. Binary Logging & Stored Function Creation
In MySQL 8.x, if binary logging is enabled, creating stored functions requires the `log_bin_trust_function_creators` variable to be enabled by an administrator:
```sql
SET GLOBAL log_bin_trust_function_creators = 1;
```

### 2. MySQL Full Outer Join Support
MySQL does not provide a native `FULL OUTER JOIN` keyword. In `07_select_queries.sql`, the relational equivalence is achieved via:
```sql
SELECT ... FROM A LEFT JOIN B ON ...
UNION ALL
SELECT ... FROM A RIGHT JOIN B ON ... WHERE A.key IS NULL;
```

### 3. Materialized Views in MySQL
MySQL evaluates regular views dynamically upon access. In `08_views_reporting.sql`, the academic concept of materialized views is demonstrated via a physical table `leaderboard_snapshot` and a maintenance procedure `sp_refresh_leaderboard_snapshot()`.
