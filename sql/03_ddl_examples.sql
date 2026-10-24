-- ============================================================================
-- HackArena: Hackathon Management and Project Evaluation System
-- File: sql/03_ddl_examples.sql
-- Description: Practical demonstration of Data Definition Language (DDL)
-- Concepts Covered:
--  1. CREATE TABLE with integrity constraints (PK, FK, UNIQUE, CHECK, DEFAULT)
--  2. ALTER TABLE (ADD COLUMN, MODIFY COLUMN, DROP COLUMN, ADD CONSTRAINT)
--  3. RENAME TABLE
--  4. TRUNCATE TABLE
--  5. DROP TABLE
-- Safety Notice: Executed strictly on isolated demo tables (`demo_*`). Core
-- application tables and project records remain untouched and protected.
-- ============================================================================

USE `hackarena_db`;

-- Cleanup any previous demo artifacts
DROP TABLE IF EXISTS `demo_hackathon_tracks`;
DROP TABLE IF EXISTS `demo_tracks_renamed`;
DROP TABLE IF EXISTS `demo_categories`;

-- ----------------------------------------------------------------------------
-- 1. CREATE TABLE with Column & Table Integrity Constraints
-- Demonstrates PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK, and DEFAULT constraints.
-- ----------------------------------------------------------------------------
-- Expected Result: Table demo_categories is created with utf8mb4 and InnoDB.
CREATE TABLE `demo_categories` (
    `category_id` INT AUTO_INCREMENT,
    `category_name` VARCHAR(50) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT `pk_demo_categories` PRIMARY KEY (`category_id`),
    CONSTRAINT `uq_demo_cat_code` UNIQUE (`code`),
    CONSTRAINT `chk_demo_cat_name` CHECK (CHAR_LENGTH(`category_name`) >= 3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expected Result: Table demo_hackathon_tracks is created with an explicit FK referencing demo_categories.
CREATE TABLE `demo_hackathon_tracks` (
    `track_id` INT AUTO_INCREMENT,
    `category_id` INT NOT NULL,
    `track_title` VARCHAR(80) NOT NULL,
    `prize_pool` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT `pk_demo_tracks` PRIMARY KEY (`track_id`),
    CONSTRAINT `fk_demo_tracks_cat` FOREIGN KEY (`category_id`)
        REFERENCES `demo_categories` (`category_id`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT `chk_demo_prize_positive` CHECK (`prize_pool` >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DESCRIBE `demo_categories`;
DESCRIBE `demo_hackathon_tracks`;

-- ----------------------------------------------------------------------------
-- 2. ALTER TABLE Operations
-- Demonstrates ADD COLUMN, MODIFY COLUMN, DROP COLUMN, and ADD CONSTRAINT.
-- ----------------------------------------------------------------------------

-- A. ADD COLUMN: Add an optional description column
-- Expected Result: Column 'description' added after 'track_title'.
ALTER TABLE `demo_hackathon_tracks`
ADD COLUMN `description` TEXT NULL AFTER `track_title`;

-- B. MODIFY COLUMN: Increase length of track_title and enforce NOT NULL
-- Expected Result: Column 'track_title' altered to VARCHAR(120).
ALTER TABLE `demo_hackathon_tracks`
MODIFY COLUMN `track_title` VARCHAR(120) NOT NULL;

-- C. ADD CONSTRAINT: Add a check constraint on prize_pool cap
-- Expected Result: New CHECK constraint added ensuring prize_pool <= 1,000,000.00.
ALTER TABLE `demo_hackathon_tracks`
ADD CONSTRAINT `chk_demo_prize_cap` CHECK (`prize_pool` <= 1000000.00);

-- D. DROP COLUMN: Remove the temporary description column
-- Expected Result: Column 'description' is removed from table schema.
ALTER TABLE `demo_hackathon_tracks`
DROP COLUMN `description`;

-- ----------------------------------------------------------------------------
-- 3. RENAME TABLE
-- Demonstrates renaming a table entity while preserving structure and constraints.
-- Expected Result: demo_hackathon_tracks renamed to demo_tracks_renamed.
-- ----------------------------------------------------------------------------
RENAME TABLE `demo_hackathon_tracks` TO `demo_tracks_renamed`;

SHOW TABLES LIKE 'demo_%';

-- ----------------------------------------------------------------------------
-- 4. TRUNCATE TABLE
-- Demonstrates rapid data purging and resetting auto-increment counters.
-- (We insert sample records into child and parent, then truncate child).
-- ----------------------------------------------------------------------------
INSERT INTO `demo_categories` (`category_name`, `code`) VALUES ('Artificial Intelligence', 'AI-TRACK');
INSERT INTO `demo_tracks_renamed` (`category_id`, `track_title`, `prize_pool`) 
VALUES (LAST_INSERT_ID(), 'Computer Vision Sprint', 5000.00);

SELECT * FROM `demo_tracks_renamed`;

-- Expected Result: demo_tracks_renamed is cleared of all rows; AUTO_INCREMENT reset to 1.
TRUNCATE TABLE `demo_tracks_renamed`;

SELECT COUNT(*) AS remaining_rows_after_truncate FROM `demo_tracks_renamed`;

-- ----------------------------------------------------------------------------
-- 5. DROP TABLE
-- Demonstrates dropping tables in correct dependency order (child before parent).
-- Expected Result: demo_tracks_renamed and demo_categories are safely dropped.
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `demo_tracks_renamed`;
DROP TABLE IF EXISTS `demo_categories`;

-- Verify all demo tables are cleaned up
SHOW TABLES LIKE 'demo_%';
