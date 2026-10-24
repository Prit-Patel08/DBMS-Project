-- ============================================================================
-- HackArena: Hackathon Management and Project Evaluation System
-- File: sql/05_dcl_examples.sql
-- Description: Practical demonstration of Data Control Language (DCL)
-- Concepts Covered:
--  1. Creating a dedicated least-privilege user (`hackarena_readonly`)
--  2. GRANT statement (Assigning SELECT privileges on views/tables)
--  3. Verifying effective privileges via SHOW GRANTS
--  4. Granting INSERT privilege for a specific reporting table
--  5. REVOKE statement (Revoking specific privileges)
--  6. Final privilege verification and cleanup
-- Privilege Notice: Running DCL commands (CREATE USER, GRANT, REVOKE) requires
-- administrative privileges (e.g., MySQL root or a user with GRANT OPTION).
-- ============================================================================

USE `hackarena_db`;

-- ----------------------------------------------------------------------------
-- 1. Create a Dedicated Demonstration User
-- ----------------------------------------------------------------------------
-- Create user if not exists with a local authentication boundary
CREATE USER IF NOT EXISTS 'hackarena_readonly'@'localhost' 
    IDENTIFIED BY 'ReadOnly#Pass2026';

-- Verify initial privileges (Defaults to USAGE on *.* - no table rights)
SELECT 'Initial Privileges:' AS phase;
SHOW GRANTS FOR 'hackarena_readonly'@'localhost';

-- ----------------------------------------------------------------------------
-- 2. GRANT: Provide Read-Only (SELECT) Privileges
-- Granting SELECT on all tables within the hackarena_db database.
-- ----------------------------------------------------------------------------
GRANT SELECT ON `hackarena_db`.* TO 'hackarena_readonly'@'localhost';
FLUSH PRIVILEGES;

-- Verify granted SELECT privileges
SELECT 'After GRANT SELECT on hackarena_db.*:' AS phase;
SHOW GRANTS FOR 'hackarena_readonly'@'localhost';

-- ----------------------------------------------------------------------------
-- 3. GRANT: Grant Specific Column/Table Modification Privilege
-- Demonstrates fine-grained privilege control: allow the user to execute INSERT
-- on a disposable demo audit table.
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `demo_dcl_audit_log`;
CREATE TABLE `demo_dcl_audit_log` (
    `log_id` INT AUTO_INCREMENT PRIMARY KEY,
    `action` VARCHAR(100) NOT NULL,
    `logged_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

GRANT INSERT ON `hackarena_db`.`demo_dcl_audit_log` TO 'hackarena_readonly'@'localhost';
FLUSH PRIVILEGES;

-- Verify combined SELECT and specific INSERT privileges
SELECT 'After Granting INSERT on demo_dcl_audit_log:' AS phase;
SHOW GRANTS FOR 'hackarena_readonly'@'localhost';

-- ----------------------------------------------------------------------------
-- 4. REVOKE: Remove Specific and Broad Privileges
-- Demonstrates principle of least privilege enforcement by revoking INSERT.
-- ----------------------------------------------------------------------------
REVOKE INSERT ON `hackarena_db`.`demo_dcl_audit_log` FROM 'hackarena_readonly'@'localhost';
FLUSH PRIVILEGES;

SELECT 'After REVOKE INSERT on demo_dcl_audit_log:' AS phase;
SHOW GRANTS FOR 'hackarena_readonly'@'localhost';

-- Next, revoke broad SELECT privilege on the database
REVOKE SELECT ON `hackarena_db`.* FROM 'hackarena_readonly'@'localhost';
FLUSH PRIVILEGES;

-- ----------------------------------------------------------------------------
-- 5. Verification and Cleanup
-- ----------------------------------------------------------------------------
SELECT 'Final Privileges (Back to USAGE):' AS phase;
SHOW GRANTS FOR 'hackarena_readonly'@'localhost';

-- Cleanup demo objects and demo user
DROP TABLE IF EXISTS `demo_dcl_audit_log`;
DROP USER IF EXISTS 'hackarena_readonly'@'localhost';
FLUSH PRIVILEGES;

SELECT 'DCL Demonstration Successfully Completed.' AS status;
