-- ============================================================================
-- HackArena: Hackathon Management and Project Evaluation System
-- File: sql/04_dml_examples.sql
-- Description: Practical demonstration of Data Manipulation Language (DML)
-- Concepts Covered:
--  1. INSERT (Single-row, Multi-row, and INSERT INTO ... SELECT)
--  2. UPDATE (Standard condition updates, calculations)
--  3. Foreign-Key Cascading vs. Restricting:
--     - ON UPDATE CASCADE demonstration
--     - ON DELETE CASCADE demonstration
--     - ON DELETE RESTRICT (Parent deletion rejection demonstration)
-- Safety Notice: Dedicated disposable tables (`demo_dml_*`) are used to demonstrate
-- cascading updates, cascading deletes, and foreign key constraint rejections
-- without modifying production hackathon records.
-- ============================================================================

USE `hackarena_db`;

-- Cleanup any previous demo artifacts
DROP TABLE IF EXISTS `demo_dml_child_cascade`;
DROP TABLE IF EXISTS `demo_dml_child_restrict`;
DROP TABLE IF EXISTS `demo_dml_parent`;

-- ----------------------------------------------------------------------------
-- Setup: Disposable Parent & Child Demonstration Tables
-- ----------------------------------------------------------------------------
CREATE TABLE `demo_dml_parent` (
    `dept_id` INT PRIMARY KEY,
    `dept_name` VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Child 1: Demonstrates ON UPDATE CASCADE and ON DELETE CASCADE
CREATE TABLE `demo_dml_child_cascade` (
    `emp_id` INT PRIMARY KEY,
    `emp_name` VARCHAR(50) NOT NULL,
    `dept_id` INT NOT NULL,
    CONSTRAINT `fk_child_cascade_dept` FOREIGN KEY (`dept_id`)
        REFERENCES `demo_dml_parent` (`dept_id`)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Child 2: Demonstrates ON DELETE RESTRICT
CREATE TABLE `demo_dml_child_restrict` (
    `project_id` INT PRIMARY KEY,
    `project_title` VARCHAR(80) NOT NULL,
    `dept_id` INT NOT NULL,
    CONSTRAINT `fk_child_restrict_dept` FOREIGN KEY (`dept_id`)
        REFERENCES `demo_dml_parent` (`dept_id`)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 1. INSERT Operations
-- ----------------------------------------------------------------------------
-- A. Single-row INSERT
INSERT INTO `demo_dml_parent` (`dept_id`, `dept_name`) 
VALUES (101, 'Engineering');

-- B. Multi-row INSERT
INSERT INTO `demo_dml_parent` (`dept_id`, `dept_name`) VALUES 
(102, 'Research & Development'),
(103, 'Quality Assurance');

-- C. Insert into Child Tables
INSERT INTO `demo_dml_child_cascade` (`emp_id`, `emp_name`, `dept_id`) VALUES
(1, 'Alice Smith', 101),
(2, 'Bob Jones', 101),
(3, 'Charlie Brown', 102);

INSERT INTO `demo_dml_child_restrict` (`project_id`, `project_title`, `dept_id`) VALUES
(1001, 'Autonomous Drone Navigation', 101),
(1002, 'Quantum Encryption Prototype', 102);

SELECT * FROM `demo_dml_parent`;
SELECT * FROM `demo_dml_child_cascade`;
SELECT * FROM `demo_dml_child_restrict`;

-- ----------------------------------------------------------------------------
-- 2. UPDATE Operations (With & Without Cascading)
-- ----------------------------------------------------------------------------
-- A. Standard UPDATE without foreign key changes
UPDATE `demo_dml_child_cascade`
SET `emp_name` = 'Alice Smith-Williams'
WHERE `emp_id` = 1;

-- B. ON UPDATE CASCADE Demonstration:
-- Update Parent Primary Key from 101 to 901.
-- Expected Result: The referencing child records in demo_dml_child_cascade AND 
-- demo_dml_child_restrict automatically reflect the new dept_id 901!
UPDATE `demo_dml_parent`
SET `dept_id` = 901
WHERE `dept_id` = 101;

SELECT 'Parent After PK Update' AS label, dept_id, dept_name FROM `demo_dml_parent`;
SELECT 'Child Cascade After Parent PK Update' AS label, emp_id, emp_name, dept_id FROM `demo_dml_child_cascade`;
SELECT 'Child Restrict After Parent PK Update' AS label, project_id, project_title, dept_id FROM `demo_dml_child_restrict`;

-- ----------------------------------------------------------------------------
-- 3. Foreign Key Rejection Demonstration (ON DELETE RESTRICT)
-- Attempting to DELETE department 901 while demo_dml_child_restrict references it.
-- Expected Result: The MySQL engine REJECTS the deletion with Error 1451 (foreign key constraint fails).
-- We capture and report this safely using a demonstrative stored procedure so script continues.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_demo_test_fk_restriction`;
DELIMITER //
CREATE PROCEDURE `sp_demo_test_fk_restriction`()
BEGIN
    DECLARE v_error_message VARCHAR(255) DEFAULT 'None';
    DECLARE CONTINUE HANDLER FOR 1451
    BEGIN
        SET v_error_message = 'CAUGHT EXPECTED ERROR 1451: Cannot delete parent row; a foreign key constraint fails (RESTRICT enforced)';
    END;

    -- Attempt deletion of referenced parent
    DELETE FROM `demo_dml_parent` WHERE `dept_id` = 901;

    -- Report outcome
    SELECT v_error_message AS `restriction_enforcement_test_result`;
END //
DELIMITER ;

CALL `sp_demo_test_fk_restriction`();
DROP PROCEDURE IF EXISTS `sp_demo_test_fk_restriction`;

-- Notice that parent row 901 still exists because the deletion was rejected!
SELECT 'Verified: Parent 901 Persists' AS status, dept_id, dept_name 
FROM `demo_dml_parent` WHERE `dept_id` = 901;

-- ----------------------------------------------------------------------------
-- 4. ON DELETE CASCADE Demonstration
-- First, remove child record referencing 901 from the RESTRICT table.
-- Then delete department 901 from demo_dml_parent.
-- Expected Result: The corresponding rows in demo_dml_child_cascade (Alice and Bob)
-- are automatically CASCADED and deleted!
-- ----------------------------------------------------------------------------
DELETE FROM `demo_dml_child_restrict` WHERE `dept_id` = 901;

-- Now delete parent 901
DELETE FROM `demo_dml_parent` WHERE `dept_id` = 901;

SELECT 'Parent Table after deleting 901' AS label, dept_id, dept_name FROM `demo_dml_parent`;
-- Expected: Alice and Bob (dept 901) are gone; Charlie (dept 102) remains.
SELECT 'Child Cascade Table after parent delete' AS label, emp_id, emp_name, dept_id FROM `demo_dml_child_cascade`;

-- ----------------------------------------------------------------------------
-- Cleanup disposable DML tables
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `demo_dml_child_cascade`;
DROP TABLE IF EXISTS `demo_dml_child_restrict`;
DROP TABLE IF EXISTS `demo_dml_parent`;
