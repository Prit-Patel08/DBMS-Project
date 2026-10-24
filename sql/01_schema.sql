-- ============================================================================
-- HackArena: Hackathon Management and Project Evaluation System
-- File: sql/01_schema.sql
-- Description: Core relational database schema (6 normalized tables)
-- Storage Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- Target Database: MySQL 8.0+ / 8.4 LTS
-- ============================================================================

-- Ensure target database exists and is selected
CREATE DATABASE IF NOT EXISTS `hackarena_db` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `hackarena_db`;

-- ----------------------------------------------------------------------------
-- Drop tables in reverse dependency order to respect foreign key constraints
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `submissions`;
DROP TABLE IF EXISTS `team_members`;
DROP TABLE IF EXISTS `teams`;
DROP TABLE IF EXISTS `hackathons`;
DROP TABLE IF EXISTS `participants`;
DROP TABLE IF EXISTS `admins`;

-- ============================================================================
-- Table 1: admins
-- System administrators who create hackathons, review submissions, and publish results.
-- No public registration endpoint exists; seeded through secure admin scripts.
-- ============================================================================
CREATE TABLE `admins` (
    `admin_id` INT AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `pk_admins` PRIMARY KEY (`admin_id`),
    CONSTRAINT `uq_admins_email` UNIQUE (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Table 2: participants
-- Students who register on HackArena to participate in hackathons and form teams.
-- ============================================================================
CREATE TABLE `participants` (
    `participant_id` INT AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `college` VARCHAR(100) NULL,
    `phone` VARCHAR(15) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `pk_participants` PRIMARY KEY (`participant_id`),
    CONSTRAINT `uq_participants_email` UNIQUE (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Table 3: hackathons
-- Hackathon events managed by administrators with strict lifecycle date constraints.
-- Constraints:
--  - registration_deadline <= start_date (must register before or on start date)
--  - start_date <= end_date (start must precede or equal end date)
-- ============================================================================
CREATE TABLE `hackathons` (
    `hackathon_id` INT AUTO_INCREMENT,
    `title` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `registration_deadline` DATE NOT NULL,
    `status` ENUM('Upcoming', 'Ongoing', 'Completed') NOT NULL DEFAULT 'Upcoming',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `pk_hackathons` PRIMARY KEY (`hackathon_id`),
    CONSTRAINT `chk_hackathon_dates` CHECK (
        `registration_deadline` <= `start_date` AND 
        `start_date` <= `end_date`
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for frequent queries and filtering
CREATE INDEX `idx_hackathons_status` ON `hackathons` (`status`);
CREATE INDEX `idx_hackathons_dates` ON `hackathons` (`start_date`, `end_date`);

-- ============================================================================
-- Table 4: teams
-- Teams formed by participants for a specific hackathon.
-- Referential Action: ON DELETE RESTRICT (Prevents accidental cascade deletion 
-- of hackathons if teams are attached to maintain historical integrity).
-- Unique constraint prevents duplicate team names within the same hackathon.
-- ============================================================================
CREATE TABLE `teams` (
    `team_id` INT AUTO_INCREMENT,
    `team_name` VARCHAR(100) NOT NULL,
    `hackathon_id` INT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `pk_teams` PRIMARY KEY (`team_id`),
    CONSTRAINT `fk_teams_hackathon` FOREIGN KEY (`hackathon_id`) 
        REFERENCES `hackathons` (`hackathon_id`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT `uq_hackathon_team_name` UNIQUE (`hackathon_id`, `team_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_teams_hackathon` ON `teams` (`hackathon_id`);

-- ============================================================================
-- Table 5: team_members
-- Associative entity resolving Many-to-Many relationship between participants and teams.
-- Composite Primary Key: (team_id, participant_id) guarantees no duplicate team membership.
-- Rules:
--  - ON DELETE CASCADE for team_id (if a team is legitimately deleted, memberships clear)
--  - ON DELETE RESTRICT for participant_id (participants with active memberships cannot be silently wiped)
-- ============================================================================
CREATE TABLE `team_members` (
    `team_id` INT NOT NULL,
    `participant_id` INT NOT NULL,
    `role` ENUM('Leader', 'Member') NOT NULL DEFAULT 'Member',
    `joined_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `pk_team_members` PRIMARY KEY (`team_id`, `participant_id`),
    CONSTRAINT `fk_tm_team` FOREIGN KEY (`team_id`) 
        REFERENCES `teams` (`team_id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_tm_participant` FOREIGN KEY (`participant_id`) 
        REFERENCES `participants` (`participant_id`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_tm_participant` ON `team_members` (`participant_id`);
CREATE INDEX `idx_tm_role` ON `team_members` (`role`);

-- ============================================================================
-- Table 6: submissions
-- Project submissions made by teams. Exactly one submission per team (team_id is UNIQUE).
-- Status & Evaluation Integrity:
--  - Score must be between 0.00 and 100.00 when present
--  - Pending submission must have score IS NULL AND evaluated_by IS NULL
--  - Evaluated submission must have score IS NOT NULL AND evaluated_by IS NOT NULL
-- ============================================================================
CREATE TABLE `submissions` (
    `submission_id` INT AUTO_INCREMENT,
    `team_id` INT NOT NULL,
    `project_title` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `github_link` VARCHAR(255) NULL,
    `submitted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `score` DECIMAL(5,2) NULL,
    `feedback` TEXT NULL,
    `evaluated_by` INT NULL,
    `status` ENUM('Pending', 'Evaluated') NOT NULL DEFAULT 'Pending',
    CONSTRAINT `pk_submissions` PRIMARY KEY (`submission_id`),
    CONSTRAINT `uq_submissions_team` UNIQUE (`team_id`),
    CONSTRAINT `fk_submissions_team` FOREIGN KEY (`team_id`) 
        REFERENCES `teams` (`team_id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_submissions_evaluator` FOREIGN KEY (`evaluated_by`) 
        REFERENCES `admins` (`admin_id`) 
        ON DELETE RESTRICT 
        ON UPDATE RESTRICT,
    CONSTRAINT `chk_submission_score` CHECK (
        `score` IS NULL OR (`score` >= 0.00 AND `score` <= 100.00)
    ),
    CONSTRAINT `chk_submission_status_consistency` CHECK (
        (`status` = 'Pending' AND `score` IS NULL AND `evaluated_by` IS NULL) OR
        (`status` = 'Evaluated' AND `score` IS NOT NULL AND `evaluated_by` IS NOT NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_submissions_status` ON `submissions` (`status`);
CREATE INDEX `idx_submissions_score` ON `submissions` (`score`);
