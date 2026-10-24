-- ============================================================================
-- HackArena: Hackathon Management and Project Evaluation System
-- File: sql/08_views_reporting.sql
-- Description: Standard Relational Views and Materialized-View Simulation
-- Concepts Covered:
--  1. View 1: `v_submission_details` (Multi-table join presenting comprehensive project status)
--  2. View 2: `v_leaderboard` (Deterministic window ranking per hackathon)
--  3. Materialized View Academic Simulation:
--     - Explanation of native MySQL limitations (no native CREATE MATERIALIZED VIEW)
--     - Derived summary table: `leaderboard_snapshot`
--     - Stored Procedure `sp_refresh_leaderboard_snapshot` to refresh snapshot
--     - Demonstration: Initial load -> Data update -> Out-of-sync demonstration -> Refresh -> Synchronized state
-- ============================================================================

USE `hackarena_db`;

-- Cleanup previously created views and reporting artifacts
DROP VIEW IF EXISTS `v_leaderboard`;
DROP VIEW IF EXISTS `v_submission_details`;
DROP PROCEDURE IF EXISTS `sp_refresh_leaderboard_snapshot`;
DROP TABLE IF EXISTS `leaderboard_snapshot`;

-- ----------------------------------------------------------------------------
-- 1. Standard View 1: `v_submission_details`
-- Combines project submissions, team names, hackathon context, leader name, and evaluator
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_submission_details` AS
SELECT 
    s.submission_id,
    s.project_title,
    s.description AS project_description,
    s.github_link,
    s.submitted_at,
    s.score,
    s.feedback,
    s.status AS evaluation_status,
    t.team_id,
    t.team_name,
    h.hackathon_id,
    h.title AS hackathon_title,
    h.status AS hackathon_status,
    (
        SELECT p.name 
        FROM `team_members` tm 
        JOIN `participants` p ON tm.participant_id = p.participant_id 
        WHERE tm.team_id = t.team_id AND tm.role = 'Leader' 
        LIMIT 1
    ) AS team_leader_name,
    (
        SELECT p.email 
        FROM `team_members` tm 
        JOIN `participants` p ON tm.participant_id = p.participant_id 
        WHERE tm.team_id = t.team_id AND tm.role = 'Leader' 
        LIMIT 1
    ) AS team_leader_email,
    a.admin_id AS evaluator_id,
    a.name AS evaluator_name
FROM `submissions` s
JOIN `teams` t ON s.team_id = t.team_id
JOIN `hackathons` h ON t.hackathon_id = h.hackathon_id
LEFT JOIN `admins` a ON s.evaluated_by = a.admin_id;

-- Verify View 1
SELECT submission_id, project_title, team_name, hackathon_title, team_leader_name, evaluation_status, score
FROM `v_submission_details`
LIMIT 5;

-- ----------------------------------------------------------------------------
-- 2. Standard View 2: `v_leaderboard`
-- Windowed deterministic ranking per hackathon based on evaluated scores
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_leaderboard` AS
SELECT 
    DENSE_RANK() OVER (
        PARTITION BY t.hackathon_id 
        ORDER BY s.score DESC, s.submitted_at ASC
    ) AS `rank_position`,
    h.hackathon_id,
    h.title AS hackathon_title,
    t.team_id,
    t.team_name,
    s.submission_id,
    s.project_title,
    s.score,
    s.submitted_at,
    a.name AS evaluated_by
FROM `submissions` s
JOIN `teams` t ON s.team_id = t.team_id
JOIN `hackathons` h ON t.hackathon_id = h.hackathon_id
JOIN `admins` a ON s.evaluated_by = a.admin_id
WHERE s.status = 'Evaluated';

-- Verify View 2 for Hackathon 1
SELECT rank_position, team_name, project_title, score 
FROM `v_leaderboard` 
WHERE hackathon_id = 1
ORDER BY rank_position ASC;

-- ============================================================================
-- 3. Academic Demonstration: Materialized View Simulation
-- ============================================================================
-- Academic Note for College Evaluation:
-- MySQL 8.x evaluates views dynamically (either via MERGE or TEMPTABLE algorithm)
-- and does not provide native 'CREATE MATERIALIZED VIEW ... REFRESH' syntax.
-- To achieve query speedup for complex analytical reporting, enterprise systems
-- maintain physical snapshot tables populated via scheduled stored procedures.

-- Step A: Create the physical snapshot reporting table
CREATE TABLE `leaderboard_snapshot` (
    `snapshot_id` INT AUTO_INCREMENT PRIMARY KEY,
    `hackathon_id` INT NOT NULL,
    `rank_position` INT NOT NULL,
    `team_name` VARCHAR(100) NOT NULL,
    `project_title` VARCHAR(100) NOT NULL,
    `score` DECIMAL(5,2) NOT NULL,
    `last_refreshed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_snapshot_hackathon` (`hackathon_id`, `rank_position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step B: Create the Stored Procedure to Refresh the Materialized Table
DELIMITER //
CREATE PROCEDURE `sp_refresh_leaderboard_snapshot`()
BEGIN
    -- Atomic refresh of the snapshot table
    TRUNCATE TABLE `leaderboard_snapshot`;
    
    INSERT INTO `leaderboard_snapshot` (
        `hackathon_id`,
        `rank_position`,
        `team_name`,
        `project_title`,
        `score`,
        `last_refreshed_at`
    )
    SELECT 
        `hackathon_id`,
        `rank_position`,
        `team_name`,
        `project_title`,
        `score`,
        NOW()
    FROM `v_leaderboard`;
END //
DELIMITER ;

-- Step C: Perform the Initial Snapshot Refresh
CALL `sp_refresh_leaderboard_snapshot`();

SELECT 'Initial Materialized Snapshot State:' AS demonstration_phase;
SELECT hackathon_id, rank_position, team_name, project_title, score, last_refreshed_at 
FROM `leaderboard_snapshot`
WHERE hackathon_id = 1;

-- Step D: Modify underlying data (Admin updates score of Team Alpha)
-- Update score from 95.50 to 99.00
UPDATE `submissions` 
SET `score` = 99.00, `feedback` = 'Updated score after revised presentation.' 
WHERE `submission_id` = 1;

-- Step E: Demonstrate that standard Dynamic View reflects change immediately,
-- whereas the Materialized Snapshot still holds the cached state!
SELECT 'Dynamic View (Immediately Updated to 99.00):' AS demonstration_phase;
SELECT team_name, score FROM `v_leaderboard` WHERE team_id = 1;

SELECT 'Materialized Snapshot (Still displays stale cached 95.50):' AS demonstration_phase;
SELECT team_name, score, last_refreshed_at FROM `leaderboard_snapshot` WHERE team_name = 'Team Alpha';

-- Step F: Call Refresh Procedure to re-synchronize the snapshot
CALL `sp_refresh_leaderboard_snapshot`();

SELECT 'Materialized Snapshot (Now Synchronized to 99.00):' AS demonstration_phase;
SELECT team_name, score, last_refreshed_at FROM `leaderboard_snapshot` WHERE team_name = 'Team Alpha';

-- Revert demo update to maintain original seed consistency
UPDATE `submissions` 
SET `score` = 95.50, `feedback` = 'Exceptional modular architecture and benchmarks. Production-grade execution.' 
WHERE `submission_id` = 1;
CALL `sp_refresh_leaderboard_snapshot`();
