-- Add 'reset' to quiz_attempts.status ENUM so teacher reset works
-- Error was: Data truncated for column 'status' at row 1

ALTER TABLE quiz_attempts
MODIFY COLUMN status ENUM('in_progress', 'completed', 'abandoned', 'cheating', 'reset') DEFAULT 'in_progress';
