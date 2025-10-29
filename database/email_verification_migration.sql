-- Email Verification Migration
-- Add OTP and verification fields to users table

USE mathease_database;

-- Add OTP fields for email verification
-- Check if columns exist before adding them
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'mathease_database' 
     AND TABLE_NAME = 'users' 
     AND COLUMN_NAME = 'otp') = 0,
    'ALTER TABLE users ADD COLUMN otp VARCHAR(10) NULL',
    'SELECT "Column otp already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'mathease_database' 
     AND TABLE_NAME = 'users' 
     AND COLUMN_NAME = 'expiration_otp') = 0,
    'ALTER TABLE users ADD COLUMN expiration_otp DATETIME NULL',
    'SELECT "Column expiration_otp already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'mathease_database' 
     AND TABLE_NAME = 'users' 
     AND COLUMN_NAME = 'verification_link_token') = 0,
    'ALTER TABLE users ADD COLUMN verification_link_token VARCHAR(255) NULL',
    'SELECT "Column verification_link_token already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'mathease_database' 
     AND TABLE_NAME = 'users' 
     AND COLUMN_NAME = 'verification_link_expires') = 0,
    'ALTER TABLE users ADD COLUMN verification_link_expires DATETIME NULL',
    'SELECT "Column verification_link_expires already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_otp ON users(otp);
CREATE INDEX IF NOT EXISTS idx_verification_token ON users(verification_link_token);
CREATE INDEX IF NOT EXISTS idx_email_verified ON users(email_verified);

-- Update existing users to have email_verified = false if not set
UPDATE users SET email_verified = 0 WHERE email_verified IS NULL;
