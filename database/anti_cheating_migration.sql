-- Anti-cheating system migration
-- Adds columns and tables to support cheating detection in quiz attempts

-- Add columns to quiz_attempts table for anti-cheating
ALTER TABLE quiz_attempts 
ADD COLUMN last_heartbeat TIMESTAMP NULL,
ADD COLUMN cheating_reason VARCHAR(255) NULL;

-- Create table to log cheating incidents
CREATE TABLE IF NOT EXISTS cheating_incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE
);

-- Add index for better performance
CREATE INDEX idx_cheating_attempt_id ON cheating_incidents(attempt_id);
CREATE INDEX idx_cheating_detected_at ON cheating_incidents(detected_at);

-- Update existing quiz_attempts to handle cheating status
-- This will be handled by the application logic, but we ensure the status column can handle 'cheating'
-- The status column should already support 'cheating' as a value

-- Add comment to document the anti-cheating system
ALTER TABLE quiz_attempts COMMENT = 'Quiz attempts with anti-cheating monitoring support';
