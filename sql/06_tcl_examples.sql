-- ============================================================================
-- HackArena: Hackathon Management and Project Evaluation System
-- File: sql/06_tcl_examples.sql
-- Description: Practical demonstration of Transaction Control Language (TCL)
-- Concepts Covered:
--  1. START TRANSACTION (Beginning an ACID transaction)
--  2. COMMIT (Permanently saving state changes)
--  3. SAVEPOINT (Setting intermediate rollback checkpoints)
--  4. ROLLBACK TO SAVEPOINT (Undoing partial transaction work)
--  5. ROLLBACK (Complete rollback of all uncommitted transaction steps)
--  6. Academic Note: MySQL Implicit Commits on DDL
-- Storage Engine: InnoDB (required for ACID transaction support)
-- ============================================================================

USE `hackarena_db`;

-- Cleanup disposable demo table
DROP TABLE IF EXISTS `demo_tcl_accounts`;
CREATE TABLE `demo_tcl_accounts` (
    `account_id` INT PRIMARY KEY,
    `holder_name` VARCHAR(50) NOT NULL,
    `balance` DECIMAL(10,2) NOT NULL,
    CONSTRAINT `chk_positive_balance` CHECK (`balance` >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Populate baseline records
INSERT INTO `demo_tcl_accounts` VALUES 
(1, 'Alice Ledger', 1000.00),
(2, 'Bob Escrow', 500.00);

SELECT 'Initial State' AS state, account_id, holder_name, balance FROM `demo_tcl_accounts`;

-- ----------------------------------------------------------------------------
-- 1. START TRANSACTION and COMMIT
-- Demonstrates successful atomic transfer of funds between accounts.
-- ----------------------------------------------------------------------------
START TRANSACTION;

-- Deduct 200 from Alice
UPDATE `demo_tcl_accounts` SET `balance` = `balance` - 200.00 WHERE `account_id` = 1;

-- Credit 200 to Bob
UPDATE `demo_tcl_accounts` SET `balance` = `balance` + 200.00 WHERE `account_id` = 2;

-- Commit the transaction to persist changes permanently
COMMIT;

SELECT 'After COMMIT (Funds Transferred)' AS state, account_id, holder_name, balance 
FROM `demo_tcl_accounts`;

-- ----------------------------------------------------------------------------
-- 2. START TRANSACTION, SAVEPOINT, and ROLLBACK TO SAVEPOINT
-- Demonstrates multi-step workflow where step 1 is preserved, but step 2 is undone.
-- ----------------------------------------------------------------------------
START TRANSACTION;

-- Step A: Add a bonus 100 to Alice
UPDATE `demo_tcl_accounts` SET `balance` = `balance` + 100.00 WHERE `account_id` = 1;

-- Create an intermediate checkpoint (SAVEPOINT)
SAVEPOINT sp_after_alice_bonus;

-- Step B: Attempt to add an invalid/unwanted deduction or bonus
UPDATE `demo_tcl_accounts` SET `balance` = `balance` + 500.00 WHERE `account_id` = 2;

SELECT 'Mid-Transaction (Before partial rollback)' AS state, account_id, holder_name, balance 
FROM `demo_tcl_accounts`;

-- Rollback ONLY back to the savepoint (undoes Bob's +500, preserves Alice's +100)
ROLLBACK TO SAVEPOINT sp_after_alice_bonus;

-- Commit the surviving partial transaction
COMMIT;

SELECT 'After ROLLBACK TO SAVEPOINT and COMMIT' AS state, account_id, holder_name, balance 
FROM `demo_tcl_accounts`;

-- ----------------------------------------------------------------------------
-- 3. START TRANSACTION and Full ROLLBACK
-- Demonstrates complete cancellation of changes when an error or cancellation occurs.
-- ----------------------------------------------------------------------------
START TRANSACTION;

-- Modify balances inside uncommitted transaction
UPDATE `demo_tcl_accounts` SET `balance` = 0.00 WHERE `account_id` = 1;
DELETE FROM `demo_tcl_accounts` WHERE `account_id` = 2;

SELECT 'Uncommitted Changes (Visible within session only)' AS state, account_id, holder_name, balance 
FROM `demo_tcl_accounts`;

-- Rollback the entire transaction
ROLLBACK;

-- Verify that the state was completely restored to the pre-transaction values
SELECT 'After Full ROLLBACK (State Restored)' AS state, account_id, holder_name, balance 
FROM `demo_tcl_accounts`;

-- ----------------------------------------------------------------------------
-- 4. Academic Demonstration: Application to Core HackArena Logic
-- Demonstrates team creation transaction where team creation and team leader
-- assignment occur atomically; if leader assignment fails, team creation rolls back.
-- ----------------------------------------------------------------------------
START TRANSACTION;

-- Step 1: Create a temporary test team for Hackathon 1
INSERT INTO `teams` (`team_id`, `team_name`, `hackathon_id`) 
VALUES (999, 'Temporary Atomic Team', 1);

-- Step 2: Assign leader (participant 1)
-- Suppose this fails or needs cancellation:
-- We simulate rollback to show no orphan team is left behind!
ROLLBACK;

-- Verify no orphan team 999 exists in the core teams table
SELECT COUNT(*) AS orphan_team_count FROM `teams` WHERE `team_id` = 999;

-- Cleanup demo table
DROP TABLE IF EXISTS `demo_tcl_accounts`;
