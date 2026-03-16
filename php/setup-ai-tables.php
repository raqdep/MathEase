<?php
/**
 * Database schema setup for AI Learning Assistant
 * Run this file once to create necessary tables
 * 
 * NOTE: This file ensures AI-related tables exist and are compatible with:
 * - groq-ai-performance.php (which uses these tables)
 * - mathease_db_complete.sql (main database schema)
 */

require_once 'db_connection.php';

try {
    // Table 1: Lesson Completion (matches groq-ai-performance.php and mathease_db_complete.sql)
    // Note: lesson_completion already exists in main schema, but we ensure it has correct structure
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS lesson_completion (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            topic_name VARCHAR(255) NOT NULL,
            lesson_number INT NOT NULL,
            completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_lesson_completion (user_id, topic_name, lesson_number),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_topic (user_id, topic_name),
            INDEX idx_topic_lesson (topic_name, lesson_number),
            INDEX idx_completed_at (completed_at)
        )
    ");
    
    // Table 2: Study Time (matches groq-ai-performance.php)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS study_time (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            topic VARCHAR(100) NOT NULL,
            lesson_number INT NOT NULL,
            time_spent_seconds INT DEFAULT 0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_student_topic_lesson (student_id, topic, lesson_number),
            INDEX idx_student_topic (student_id, topic),
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");
    
    // Table 3: Quiz Attempts - Ensure answers_data column exists
    // Note: quiz_attempts already exists in main schema, but we need to ensure answers_data column exists
    // Check if answers_data column exists, if not add it
    try {
        $checkColumn = $pdo->query("SHOW COLUMNS FROM quiz_attempts LIKE 'answers_data'");
        if ($checkColumn->rowCount() == 0) {
            // Column doesn't exist, add it
            $pdo->exec("
                ALTER TABLE quiz_attempts 
                ADD COLUMN answers_data TEXT NULL AFTER completed_at
            ");
            echo "✅ Added answers_data column to quiz_attempts table\n";
        }
    } catch (PDOException $e) {
        // Table might not exist yet, create a minimal version
        // But this should rarely happen as quiz_attempts is in main schema
        error_log("Note: Could not check/add answers_data column: " . $e->getMessage());
    }
    
    // Also check for time_taken_seconds column (used by groq-ai-performance.php)
    try {
        $checkTimeColumn = $pdo->query("SHOW COLUMNS FROM quiz_attempts LIKE 'time_taken_seconds'");
        if ($checkTimeColumn->rowCount() == 0) {
            // Check if completion_time exists (from main schema)
            $checkCompletionTime = $pdo->query("SHOW COLUMNS FROM quiz_attempts LIKE 'completion_time'");
            if ($checkCompletionTime->rowCount() == 0) {
                // Neither exists, add time_taken_seconds
                $pdo->exec("
                    ALTER TABLE quiz_attempts 
                    ADD COLUMN time_taken_seconds INT DEFAULT 0 AFTER total_questions
                ");
                echo "✅ Added time_taken_seconds column to quiz_attempts table\n";
            }
        }
    } catch (PDOException $e) {
        error_log("Note: Could not check/add time_taken_seconds column: " . $e->getMessage());
    }
    
    // Table 4: AI Performance Analysis (matches groq-ai-performance.php)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ai_performance_analysis (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            topic VARCHAR(100) NOT NULL,
            analysis_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_student_topic (student_id, topic),
            INDEX idx_student_created (student_id, created_at),
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");
    
    echo "✅ All AI tables verified/created successfully!\n";
    echo "Tables verified/created:\n";
    echo "- lesson_completion (matches main schema)\n";
    echo "- study_time (for AI time tracking)\n";
    echo "- quiz_attempts (verified answers_data column exists)\n";
    echo "- ai_performance_analysis (with topic column)\n";
    
} catch (PDOException $e) {
    echo "❌ Error creating/verifying tables: " . $e->getMessage() . "\n";
    error_log("Setup AI Tables Error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
}
