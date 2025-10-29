-- Add password reset token columns to users table
-- This migration adds password reset functionality

-- Add password reset token column
ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255) NULL;

-- Add password reset expiration column
ALTER TABLE users ADD COLUMN password_reset_expires DATETIME NULL;

-- Add index for faster token lookups
CREATE INDEX idx_password_reset_token ON users(password_reset_token);

-- Add index for expiration cleanup
CREATE INDEX idx_password_reset_expires ON users(password_reset_expires);
