-- ============================================================================
-- HackArena: Hackathon Management and Project Evaluation System
-- File: sql/07_select_queries.sql
-- Description: Comprehensive Data Query Language (DQL) Practicals
-- Covers:
--  1. Basic & Aggregate Queries (WHERE, COUNT, SUM, AVG, MIN, MAX, IN, LIKE, DISTINCT, ORDER BY, LIMIT/OFFSET)
--  2. Grouping (GROUP BY, GROUP BY with HAVING)
--  3. Joins (INNER, LEFT, RIGHT, CROSS, Emulated FULL OUTER JOIN)
--  4. Set Operations (UNION, UNION ALL, INTERSECT, EXCEPT)
--  5. Subqueries (Scalar, Correlated, IN, EXISTS, ANY, ALL)
--  6. Academic Application Queries (Leaderboards, Above-average scores, Pending evaluations, etc.)
-- ============================================================================

USE `hackarena_db`;

-- ============================================================================
-- PART 1: Basic and Aggregate Queries
-- ============================================================================

-- 1.1 WHERE with Comparison and Boolean Operators
-- Objective: Filter all hackathons that are either 'Ongoing' or 'Upcoming'
-- Expected: Hackathons 2, 3, 4, 5 returned.
SELECT hackathon_id, title, status, start_date, end_date
FROM `hackathons`
WHERE status IN ('Ongoing', 'Upcoming')
ORDER BY start_date ASC;

-- 1.2 Aggregates: COUNT, AVG, MIN, MAX, SUM
-- Objective: Calculate overall statistics for evaluated project submissions
-- Expected: Total evaluated submissions, avg score, lowest and highest scores.
SELECT 
    COUNT(*) AS total_evaluated_submissions,
    ROUND(AVG(score), 2) AS average_score,
    MIN(score) AS minimum_score,
    MAX(score) AS maximum_score,
    ROUND(SUM(score), 2) AS cumulative_points
FROM `submissions`
WHERE status = 'Evaluated';

-- 1.3 IN and NOT IN Operator
-- Objective: Retrieve participants who attend either MIT, Stanford, or UC Berkeley
SELECT participant_id, name, email, college
FROM `participants`
WHERE college IN ('MIT', 'Stanford University', 'UC Berkeley')
ORDER BY college, name;

-- 1.4 LIKE Pattern Matching
-- Objective: Find participants whose email ends with '.edu' or '.ac.in'
SELECT participant_id, name, email, college
FROM `participants`
WHERE email LIKE '%.edu' OR email LIKE '%.ac.in'
ORDER BY name ASC
LIMIT 10;

-- 1.5 DISTINCT Keyword
-- Objective: List all unique colleges represented by registered participants
SELECT DISTINCT college
FROM `participants`
WHERE college IS NOT NULL
ORDER BY college ASC;

-- 1.6 ORDER BY with LIMIT and OFFSET (Pagination)
-- Objective: Retrieve page 2 of participants (10 records per page, offset 10)
SELECT participant_id, name, email, college
FROM `participants`
ORDER BY participant_id ASC
LIMIT 10 OFFSET 10;

-- ============================================================================
-- PART 2: Grouping (GROUP BY and HAVING)
-- ============================================================================

-- 2.1 GROUP BY: Count teams per hackathon
-- Objective: Determine team registration volume per hackathon event
SELECT 
    h.hackathon_id,
    h.title AS hackathon_title,
    h.status,
    COUNT(t.team_id) AS total_teams
FROM `hackathons` h
LEFT JOIN `teams` t ON h.hackathon_id = t.hackathon_id
GROUP BY h.hackathon_id, h.title, h.status
ORDER BY total_teams DESC;

-- 2.2 GROUP BY with HAVING: Filter hackathons with more than 2 teams
-- Objective: Identify high-participation hackathons
SELECT 
    h.hackathon_id,
    h.title AS hackathon_title,
    COUNT(t.team_id) AS team_count
FROM `hackathons` h
INNER JOIN `teams` t ON h.hackathon_id = t.hackathon_id
GROUP BY h.hackathon_id, h.title
HAVING COUNT(t.team_id) >= 3
ORDER BY team_count DESC;

-- 2.3 GROUP BY with HAVING: Hackathons with average evaluated score > 85.00
SELECT 
    h.title AS hackathon_title,
    COUNT(s.submission_id) AS evaluated_projects,
    ROUND(AVG(s.score), 2) AS average_score
FROM `hackathons` h
JOIN `teams` t ON h.hackathon_id = t.hackathon_id
JOIN `submissions` s ON t.team_id = s.team_id
WHERE s.status = 'Evaluated'
GROUP BY h.hackathon_id, h.title
HAVING AVG(s.score) >= 88.00
ORDER BY average_score DESC;

-- ============================================================================
-- PART 3: Joins (INNER, LEFT, RIGHT, CROSS, and Emulated FULL OUTER JOIN)
-- ============================================================================

-- 3.1 INNER JOIN: Active project submissions with team and hackathon details
SELECT 
    s.submission_id,
    s.project_title,
    t.team_name,
    h.title AS hackathon_title,
    s.status,
    s.score
FROM `submissions` s
INNER JOIN `teams` t ON s.team_id = t.team_id
INNER JOIN `hackathons` h ON t.hackathon_id = h.hackathon_id
ORDER BY s.submission_id ASC;

-- 3.2 LEFT JOIN: All hackathons and their project submissions (including hackathons with zero submissions)
SELECT 
    h.hackathon_id,
    h.title AS hackathon_title,
    h.status AS hackathon_status,
    t.team_name,
    s.project_title,
    s.status AS submission_status
FROM `hackathons` h
LEFT JOIN `teams` t ON h.hackathon_id = t.hackathon_id
LEFT JOIN `submissions` s ON t.team_id = s.team_id
ORDER BY h.hackathon_id, t.team_name;

-- 3.3 RIGHT JOIN: All admins and any submissions they evaluated
SELECT 
    a.admin_id,
    a.name AS evaluator_name,
    s.submission_id,
    s.project_title,
    s.score
FROM `submissions` s
RIGHT JOIN `admins` a ON s.evaluated_by = a.admin_id
ORDER BY a.admin_id, s.submission_id;

-- 3.4 CROSS JOIN: Cartesian product of Hackathons and Admins
-- Objective: Review potential evaluation assignment matrix across active hackathons and admins
SELECT 
    h.hackathon_id,
    h.title AS hackathon_title,
    a.admin_id,
    a.name AS admin_name
FROM `hackathons` h
CROSS JOIN `admins` a
WHERE h.status IN ('Ongoing', 'Upcoming')
ORDER BY h.hackathon_id, a.admin_id;

-- 3.5 FULL OUTER JOIN Emulation:
-- In standard ANSI SQL: FULL OUTER JOIN returns all rows from both tables, filling NULLs
-- where no match exists. Because MySQL does not support the FULL OUTER JOIN keyword,
-- the canonical DBMS pattern is a LEFT JOIN combined with a RIGHT JOIN (filtering duplicates)
-- using UNION ALL.
SELECT 
    t.team_id,
    t.team_name,
    s.submission_id,
    s.project_title,
    s.status AS submission_status
FROM `teams` t
LEFT JOIN `submissions` s ON t.team_id = s.team_id
UNION ALL
SELECT 
    t.team_id,
    t.team_name,
    s.submission_id,
    s.project_title,
    s.status AS submission_status
FROM `teams` t
RIGHT JOIN `submissions` s ON t.team_id = s.team_id
WHERE t.team_id IS NULL;

-- ============================================================================
-- PART 4: Set Operations (UNION, UNION ALL, INTERSECT, EXCEPT)
-- Supported natively in MySQL 8.0.31+ / MySQL 8.4 LTS
-- ============================================================================

-- 4.1 UNION: Combined distinct list of colleges from both participants and college leaders
SELECT college AS institution FROM `participants` WHERE college IS NOT NULL
UNION
SELECT 'Global Innovation Institute' AS institution
ORDER BY institution ASC;

-- 4.2 UNION ALL: Shows all participant and admin email addresses (retaining any duplicates)
SELECT email, 'Admin' AS account_type FROM `admins`
UNION ALL
SELECT email, 'Participant' AS account_type FROM `participants`
ORDER BY email ASC
LIMIT 12;

-- 4.3 INTERSECT: Participants who are BOTH a Team Leader AND have an Evaluated Submission
-- (Finds participant_ids common to both query results)
SELECT tm.participant_id
FROM `team_members` tm
WHERE tm.role = 'Leader'
INTERSECT
SELECT tm.participant_id
FROM `team_members` tm
JOIN `submissions` s ON tm.team_id = s.team_id
WHERE s.status = 'Evaluated';

-- 4.4 EXCEPT (MINUS): Participants who have registered but have NOT joined any team
-- (Subtracts participant_ids present in team_members from all participants)
SELECT p.participant_id, p.name, p.college
FROM `participants` p
WHERE p.participant_id IN (
    SELECT participant_id FROM `participants`
    EXCEPT
    SELECT participant_id FROM `team_members`
);

-- ============================================================================
-- PART 5: Subqueries (Scalar, Correlated, IN, EXISTS, ANY, ALL)
-- ============================================================================

-- 5.1 Scalar Subquery: Find all submissions that scored above the global average score
SELECT 
    s.submission_id,
    s.project_title,
    t.team_name,
    s.score,
    ROUND((SELECT AVG(score) FROM `submissions` WHERE status = 'Evaluated'), 2) AS overall_avg
FROM `submissions` s
JOIN `teams` t ON s.team_id = t.team_id
WHERE s.score > (SELECT AVG(score) FROM `submissions` WHERE status = 'Evaluated')
ORDER BY s.score DESC;

-- 5.2 Correlated Subquery: Find teams that have more members than the average team size
-- in their respective hackathon
SELECT 
    t.team_id,
    t.team_name,
    t.hackathon_id,
    (SELECT COUNT(*) FROM `team_members` tm WHERE tm.team_id = t.team_id) AS member_count
FROM `teams` t
WHERE (SELECT COUNT(*) FROM `team_members` tm WHERE tm.team_id = t.team_id) >= (
    SELECT AVG(team_size) FROM (
        SELECT COUNT(*) AS team_size 
        FROM `team_members` tm2 
        JOIN `teams` t2 ON tm2.team_id = t2.team_id 
        WHERE t2.hackathon_id = t.hackathon_id 
        GROUP BY t2.team_id
    ) AS hackathon_team_sizes
);

-- 5.3 Subquery with IN: Participants attending hackathons that are currently 'Ongoing'
SELECT p.participant_id, p.name, p.college
FROM `participants` p
WHERE p.participant_id IN (
    SELECT tm.participant_id
    FROM `team_members` tm
    JOIN `teams` t ON tm.team_id = t.team_id
    JOIN `hackathons` h ON t.hackathon_id = h.hackathon_id
    WHERE h.status = 'Ongoing'
)
ORDER BY p.name ASC;

-- 5.4 Subquery with EXISTS: Hackathons that have at least one evaluated submission
SELECT h.hackathon_id, h.title, h.status
FROM `hackathons` h
WHERE EXISTS (
    SELECT 1 
    FROM `teams` t 
    JOIN `submissions` s ON t.team_id = s.team_id
    WHERE t.hackathon_id = h.hackathon_id AND s.status = 'Evaluated'
);

-- 5.5 Subquery with NOT EXISTS: Hackathons with NO project submissions yet
SELECT h.hackathon_id, h.title, h.status, h.start_date
FROM `hackathons` h
WHERE NOT EXISTS (
    SELECT 1 
    FROM `teams` t 
    JOIN `submissions` s ON t.team_id = s.team_id 
    WHERE t.hackathon_id = h.hackathon_id
);

-- 5.6 Subquery with ANY: Submissions scoring higher than ANY project evaluated by Admin 2
SELECT s.submission_id, s.project_title, s.score, s.evaluated_by
FROM `submissions` s
WHERE s.score > ANY (
    SELECT score FROM `submissions` WHERE evaluated_by = 2 AND score IS NOT NULL
)
ORDER BY s.score DESC;

-- 5.7 Subquery with ALL: Submissions scoring higher than ALL projects evaluated by Admin 2
SELECT s.submission_id, s.project_title, s.score, s.evaluated_by
FROM `submissions` s
WHERE s.score > ALL (
    SELECT score FROM `submissions` WHERE evaluated_by = 2 AND score IS NOT NULL
)
ORDER BY s.score DESC;

-- ============================================================================
-- PART 6: Academic Application Queries
-- ============================================================================

-- 6.1 Leaderboard Ranking Query with Deterministic Tie-Breaking
-- For Hackathon 1: Sort by score DESC, then by earlier submission timestamp ASC
SELECT 
    DENSE_RANK() OVER (ORDER BY s.score DESC, s.submitted_at ASC) AS `rank`,
    t.team_name,
    s.project_title,
    s.score,
    s.submitted_at,
    a.name AS evaluated_by_admin
FROM `submissions` s
JOIN `teams` t ON s.team_id = t.team_id
JOIN `admins` a ON s.evaluated_by = a.admin_id
WHERE t.hackathon_id = 1 AND s.status = 'Evaluated'
ORDER BY `rank` ASC;

-- 6.2 Pending Evaluations Alert
-- Lists all submissions waiting for evaluation by an administrator
SELECT 
    s.submission_id,
    s.project_title,
    t.team_name,
    h.title AS hackathon_title,
    s.github_link,
    s.submitted_at
FROM `submissions` s
JOIN `teams` t ON s.team_id = t.team_id
JOIN `hackathons` h ON t.hackathon_id = h.hackathon_id
WHERE s.status = 'Pending'
ORDER BY s.submitted_at ASC;

-- 6.3 Hackathon Overview Metrics
-- Summary dashboard reporting per hackathon
SELECT 
    h.hackathon_id,
    h.title,
    h.status,
    COUNT(DISTINCT t.team_id) AS total_teams,
    COUNT(DISTINCT tm.participant_id) AS total_participants,
    COUNT(DISTINCT s.submission_id) AS total_submissions,
    COUNT(DISTINCT CASE WHEN s.status = 'Evaluated' THEN s.submission_id END) AS evaluated_submissions,
    ROUND(AVG(s.score), 2) AS average_score
FROM `hackathons` h
LEFT JOIN `teams` t ON h.hackathon_id = t.hackathon_id
LEFT JOIN `team_members` tm ON t.team_id = tm.team_id
LEFT JOIN `submissions` s ON t.team_id = s.team_id
GROUP BY h.hackathon_id, h.title, h.status
ORDER BY h.hackathon_id ASC;
