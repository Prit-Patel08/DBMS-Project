-- ============================================================================
-- HackArena: Hackathon Management and Project Evaluation System
-- File: sql/09_routines_triggers.sql
-- Description: Stored Procedures, Stored Functions, and Triggers
-- Concepts Covered:
--  1. Stored Procedure: `sp_evaluate_submission` (Transactional project evaluation)
--  2. Stored Function: `fn_hackathon_avg_score` (Calculates hackathon average score)
--  3. Trigger 1: `trg_prevent_duplicate_hackathon_participation` (Enforces 1 team/hackathon rule)
--  4. Trigger 2: `trg_enforce_single_leader` (Guarantees at most 1 leader per team)
--  5. Trigger 3: `trg_prevent_submission_edit_after_evaluated` (Protects evaluated projects)
--  6. Executable test cases demonstrating expected successes and constraint rejections
-- ============================================================================

USE `hackarena_db`;

-- Cleanup existing routines and triggers
DROP PROCEDURE IF EXISTS `sp_evaluate_submission`;
DROP FUNCTION IF EXISTS `fn_hackathon_avg_score`;
DROP TRIGGER IF EXISTS `trg_prevent_duplicate_hackathon_participation`;
DROP TRIGGER IF EXISTS `trg_enforce_single_leader_insert`;
DROP TRIGGER IF EXISTS `trg_enforce_single_leader_update`;
DROP TRIGGER IF EXISTS `trg_prevent_submission_edit_after_evaluated`;

-- ============================================================================
-- 1. STORED PROCEDURE: sp_evaluate_submission
-- Safely evaluates a pending or existing submission inside an atomic transaction.
-- Performs input validation, verifies evaluator existence, and updates status to Evaluated.
-- ============================================================================
DELIMITER //
CREATE PROCEDURE `sp_evaluate_submission`(
    IN p_submission_id INT,
    IN p_admin_id INT,
    IN p_score DECIMAL(5,2),
    IN p_feedback TEXT
)
proc_body: BEGIN
    DECLARE v_sub_exists INT DEFAULT 0;
    DECLARE v_admin_exists INT DEFAULT 0;

    -- Validate score range
    IF p_score < 0.00 OR p_score > 100.00 THEN
        SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Evaluation rejected: Score must be between 0.00 and 100.00';
    END IF;

    -- Verify submission existence
    SELECT COUNT(*) INTO v_sub_exists FROM `submissions` WHERE `submission_id` = p_submission_id;
    IF v_sub_exists = 0 THEN
        SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Evaluation rejected: Submission ID does not exist';
    END IF;

    -- Verify admin evaluator existence
    SELECT COUNT(*) INTO v_admin_exists FROM `admins` WHERE `admin_id` = p_admin_id;
    IF v_admin_exists = 0 THEN
        SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Evaluation rejected: Evaluator Admin ID does not exist';
    END IF;

    -- Execute evaluation update atomically
    START TRANSACTION;
    UPDATE `submissions`
    SET 
        `score` = p_score,
        `feedback` = p_feedback,
        `evaluated_by` = p_admin_id,
        `status` = 'Evaluated'
    WHERE `submission_id` = p_submission_id;
    COMMIT;

    -- Output confirmation
    SELECT 
        `submission_id`,
        `project_title`,
        `score`,
        `feedback`,
        `status`,
        `evaluated_by`
    FROM `submissions`
    WHERE `submission_id` = p_submission_id;
END //
DELIMITER ;

-- ============================================================================
-- 2. STORED FUNCTION: fn_hackathon_avg_score
-- Calculates and returns the mathematical average score for a given hackathon.
-- Returns NULL if no evaluated projects exist.
-- ============================================================================
DELIMITER //
CREATE FUNCTION `fn_hackathon_avg_score`(p_hackathon_id INT)
RETURNS DECIMAL(5,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_avg_score DECIMAL(5,2);

    SELECT ROUND(AVG(s.score), 2) INTO v_avg_score
    FROM `submissions` s
    JOIN `teams` t ON s.team_id = t.team_id
    WHERE t.hackathon_id = p_hackathon_id AND s.status = 'Evaluated';

    RETURN v_avg_score;
END //
DELIMITER ;

-- ============================================================================
-- 3. TRIGGER: trg_prevent_duplicate_hackathon_participation
-- Enforces the business rule that a participant can only belong to ONE team
-- within the same hackathon.
-- ============================================================================
DELIMITER //
CREATE TRIGGER `trg_prevent_duplicate_hackathon_participation`
BEFORE INSERT ON `team_members`
FOR EACH ROW
BEGIN
    DECLARE v_target_hackathon_id INT;
    DECLARE v_conflict_count INT DEFAULT 0;

    -- Determine the hackathon for the new team
    SELECT `hackathon_id` INTO v_target_hackathon_id 
    FROM `teams` 
    WHERE `team_id` = NEW.team_id;

    -- Check if participant is already enrolled in any team for this hackathon
    SELECT COUNT(*) INTO v_conflict_count
    FROM `team_members` tm
    JOIN `teams` t ON tm.team_id = t.team_id
    WHERE tm.participant_id = NEW.participant_id 
      AND t.hackathon_id = v_target_hackathon_id;

    IF v_conflict_count > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Integrity violation: Participant is already enrolled in a team for this hackathon';
    END IF;
END //
DELIMITER ;

-- ============================================================================
-- 4. TRIGGER: trg_enforce_single_leader (Insert & Update)
-- Guarantees that a team has at most ONE leader at any given time.
-- ============================================================================
DELIMITER //
CREATE TRIGGER `trg_enforce_single_leader_insert`
BEFORE INSERT ON `team_members`
FOR EACH ROW
BEGIN
    DECLARE v_leader_exists INT DEFAULT 0;

    IF NEW.role = 'Leader' THEN
        SELECT COUNT(*) INTO v_leader_exists
        FROM `team_members`
        WHERE `team_id` = NEW.team_id AND `role` = 'Leader';

        IF v_leader_exists > 0 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Integrity violation: Team already has a designated Leader';
        END IF;
    END IF;
END //

CREATE TRIGGER `trg_enforce_single_leader_update`
BEFORE UPDATE ON `team_members`
FOR EACH ROW
BEGIN
    DECLARE v_leader_exists INT DEFAULT 0;

    IF NEW.role = 'Leader' AND OLD.role <> 'Leader' THEN
        SELECT COUNT(*) INTO v_leader_exists
        FROM `team_members`
        WHERE `team_id` = NEW.team_id AND `role` = 'Leader' AND `participant_id` <> NEW.participant_id;

        IF v_leader_exists > 0 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Integrity violation: Team already has a designated Leader';
        END IF;
    END IF;
END //
DELIMITER ;

-- ============================================================================
-- 5. TRIGGER: trg_prevent_submission_edit_after_evaluated
-- Prevents participants from altering core project details (title, description, GitHub)
-- once an administrator has evaluated the project.
-- ============================================================================
DELIMITER //
CREATE TRIGGER `trg_prevent_submission_edit_after_evaluated`
BEFORE UPDATE ON `submissions`
FOR EACH ROW
BEGIN
    IF OLD.status = 'Evaluated' THEN
        -- Allow admin score/feedback adjustments, but block altering student project content
        IF (NEW.project_title <> OLD.project_title) OR 
           (NEW.description <> OLD.description) OR 
           (NEW.github_link <> OLD.github_link) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Integrity violation: Cannot alter project content after evaluation has been finalized';
        END IF;
    END IF;
END //
DELIMITER ;

-- ============================================================================
-- VERIFICATION TESTS FOR STORED ROUTINES & TRIGGERS
-- ============================================================================

-- Test 1: Stored Function Execution
SELECT 
    h.hackathon_id,
    h.title,
    `fn_hackathon_avg_score`(h.hackathon_id) AS computed_average_score
FROM `hackathons` h
WHERE h.hackathon_id IN (1, 2, 4);

-- Test 2: Stored Procedure Execution (Evaluate Pending Submission 7)
CALL `sp_evaluate_submission`(7, 1, 91.50, 'Well-structured conditional GAN model with convincing synthetic output.');

-- Verify submission 7 is now Evaluated
SELECT submission_id, project_title, score, status, evaluated_by 
FROM `submissions` WHERE submission_id = 7;

-- Revert submission 7 back to Pending to keep seed dataset clean
UPDATE `submissions` 
SET `score` = NULL, `feedback` = NULL, `evaluated_by` = NULL, `status` = 'Pending' 
WHERE `submission_id` = 7;

-- Test 3: Trigger Test - Attempt Duplicate Participation in Same Hackathon
-- Participant 1 is already in Team 1 (Hackathon 1). Attempting to join Team 2 (also Hackathon 1).
-- Expected Result: Trigger rejects with SQLSTATE 45000.
DROP PROCEDURE IF EXISTS `sp_test_trigger_duplicate_participation`;
DELIMITER //
CREATE PROCEDURE `sp_test_trigger_duplicate_participation`()
BEGIN
    DECLARE v_error_msg VARCHAR(255) DEFAULT 'None';
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        SET v_error_msg = 'CAUGHT TRIGGER ERROR: Participant already in a team for this hackathon';
    END;

    INSERT INTO `team_members` (`team_id`, `participant_id`, `role`) VALUES (2, 1, 'Member');
    SELECT v_error_msg AS `trigger_test_result`;
END //
DELIMITER ;

CALL `sp_test_trigger_duplicate_participation`();
DROP PROCEDURE IF EXISTS `sp_test_trigger_duplicate_participation`;

-- Test 4: Trigger Test - Attempt Multiple Leaders in One Team
-- Team 1 already has Leader (Participant 1). Attempting to insert Participant 40 as Leader in Team 1.
-- Expected Result: Trigger rejects with SQLSTATE 45000.
DROP PROCEDURE IF EXISTS `sp_test_trigger_duplicate_leader`;
DELIMITER //
CREATE PROCEDURE `sp_test_trigger_duplicate_leader`()
BEGIN
    DECLARE v_error_msg VARCHAR(255) DEFAULT 'None';
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        SET v_error_msg = 'CAUGHT TRIGGER ERROR: Team already has a designated Leader';
    END;

    INSERT INTO `team_members` (`team_id`, `participant_id`, `role`) VALUES (1, 40, 'Leader');
    SELECT v_error_msg AS `trigger_test_result`;
END //
DELIMITER ;

CALL `sp_test_trigger_duplicate_leader`();
DROP PROCEDURE IF EXISTS `sp_test_trigger_duplicate_leader`;

-- Test 5: Trigger Test - Attempt Project Modification After Evaluation
-- Submission 1 is Evaluated. Attempting to alter project_title.
-- Expected Result: Trigger rejects with SQLSTATE 45000.
DROP PROCEDURE IF EXISTS `sp_test_trigger_edit_after_evaluated`;
DELIMITER //
CREATE PROCEDURE `sp_test_trigger_edit_after_evaluated`()
BEGIN
    DECLARE v_error_msg VARCHAR(255) DEFAULT 'None';
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        SET v_error_msg = 'CAUGHT TRIGGER ERROR: Cannot alter project content after evaluation finalized';
    END;

    UPDATE `submissions` 
    SET `project_title` = 'Hacked Project Title' 
    WHERE `submission_id` = 1;
    
    SELECT v_error_msg AS `trigger_test_result`;
END //
DELIMITER ;

CALL `sp_test_trigger_edit_after_evaluated`();
DROP PROCEDURE IF EXISTS `sp_test_trigger_edit_after_evaluated`;
