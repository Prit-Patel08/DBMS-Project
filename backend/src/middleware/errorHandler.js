/**
 * Centralized error handling middleware.
 * Maps MySQL error codes and custom business rule exceptions into clear JSON responses.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url}:`, err.message || err);

  // 1. MySQL Duplicate Key Error (ER_DUP_ENTRY)
  if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
    if (err.sqlMessage && err.sqlMessage.includes('uq_participants_email')) {
      return res.status(409).json({
        success: false,
        message: 'A participant with this email address already exists.'
      });
    }
    if (err.sqlMessage && err.sqlMessage.includes('uq_hackathon_team_name')) {
      return res.status(409).json({
        success: false,
        message: 'A team with this name already exists in this hackathon.'
      });
    }
    if (err.sqlMessage && err.sqlMessage.includes('uq_submissions_team')) {
      return res.status(409).json({
        success: false,
        message: 'This team has already submitted a project. Each team may submit only one project.'
      });
    }
    return res.status(409).json({
      success: false,
      message: 'A duplicate entry constraint was violated.'
    });
  }

  // 2. Foreign Key Constraint Failure (ER_ROW_IS_REFERENCED_2 / RESTRICT)
  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
    return res.status(409).json({
      success: false,
      message: 'Operation rejected: Record cannot be deleted because dependent child records exist.'
    });
  }

  // 3. Foreign Key Parent Missing (ER_NO_REFERENCED_ROW_2)
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference: The referenced parent entity does not exist.'
    });
  }

  // 4. CHECK Constraint Violated (ER_CHECK_CONSTRAINT_VIOLATED)
  if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED' || err.errno === 3819) {
    if (err.sqlMessage && err.sqlMessage.includes('chk_hackathon_dates')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid dates: Registration deadline must be <= start date, and start date must be <= end date.'
      });
    }
    if (err.sqlMessage && err.sqlMessage.includes('chk_submission_score')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid score: Score must be between 0.00 and 100.00.'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Database check constraint failed: Data violates validation rules.'
    });
  }

  // 5. User-defined Trigger Signals (SQLSTATE 45000)
  if (err.sqlState === '45000') {
    return res.status(400).json({
      success: false,
      message: err.sqlMessage || 'Integrity check failed.'
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'An internal server error occurred.'
  });
};

module.exports = errorHandler;
