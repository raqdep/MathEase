-- Make student_id and teacher_id optional (nullable)
-- Run this on existing databases after deployment to fix registration.

USE mathease_database3;

-- Allow student_id to be NULL (student/LRN no longer required)
ALTER TABLE users MODIFY COLUMN student_id VARCHAR(20) NULL;
-- Keep UNIQUE so duplicate non-null values are still rejected (MySQL allows multiple NULLs in UNIQUE)

-- Allow teacher_id to be NULL (teacher ID no longer required)
ALTER TABLE teachers MODIFY COLUMN teacher_id VARCHAR(20) NULL;
