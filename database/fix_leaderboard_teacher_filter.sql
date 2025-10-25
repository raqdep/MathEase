-- Fix Leaderboard Teacher Filter Migration
-- This migration updates the quiz_leaderboard view to include teacher/class information
-- so that leaderboards can be filtered by teacher

USE mathease_database;

-- Drop the existing quiz_leaderboard view
DROP VIEW IF EXISTS quiz_leaderboard;

-- Create the updated quiz_leaderboard view with teacher/class information
CREATE OR REPLACE VIEW quiz_leaderboard AS
SELECT 
    qa.id as attempt_id,
    u.id as student_id,
    CONCAT(u.first_name, ' ', u.last_name) as student_name,
    qa.score,
    qa.total_questions,
    ROUND((qa.score / qa.total_questions) * 100, 1) as percentage,
    qa.completion_time,
    TIME_FORMAT(SEC_TO_TIME(qa.completion_time), '%i:%s') as formatted_time,
    qa.completed_at,
    DATE(qa.completed_at) as quiz_date,
    qa.quiz_type,
    -- Add teacher and class information
    ce.class_id,
    c.class_name,
    c.class_code,
    c.teacher_id,
    CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
    -- Calculate rank within the same teacher's class
    ROW_NUMBER() OVER (
        PARTITION BY qa.quiz_type, c.teacher_id 
        ORDER BY qa.score DESC, qa.completion_time ASC
    ) as rank_position
FROM quiz_attempts qa
JOIN users u ON qa.student_id = u.id
LEFT JOIN class_enrollments ce ON u.id = ce.student_id AND ce.enrollment_status = 'approved'
LEFT JOIN classes c ON ce.class_id = c.id AND c.is_active = TRUE
LEFT JOIN teachers t ON c.teacher_id = t.id
WHERE qa.status = 'completed' 
    AND qa.completed_at IS NOT NULL
    AND ce.id IS NOT NULL  -- Only include students who are enrolled in a class
ORDER BY qa.quiz_type, c.teacher_id, qa.score DESC, qa.completion_time ASC;

-- Also update the quiz_statistics view to include teacher filtering
DROP VIEW IF EXISTS quiz_statistics;

CREATE OR REPLACE VIEW quiz_statistics AS
SELECT 
    qa.quiz_type,
    c.teacher_id,
    CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
    COUNT(*) as total_attempts,
    COUNT(DISTINCT qa.student_id) as unique_students,
    AVG(qa.score) as average_score,
    AVG(qa.completion_time) as average_time,
    MAX(qa.score) as highest_score,
    MIN(qa.completion_time) as fastest_time,
    ROUND(AVG((qa.score / qa.total_questions) * 100), 1) as average_percentage
FROM quiz_attempts qa
JOIN users u ON qa.student_id = u.id
LEFT JOIN class_enrollments ce ON u.id = ce.student_id AND ce.enrollment_status = 'approved'
LEFT JOIN classes c ON ce.class_id = c.id AND c.is_active = TRUE
LEFT JOIN teachers t ON c.teacher_id = t.id
WHERE qa.status = 'completed' 
    AND qa.completed_at IS NOT NULL
    AND ce.id IS NOT NULL  -- Only include students who are enrolled in a class
GROUP BY qa.quiz_type, c.teacher_id, t.first_name, t.last_name;
