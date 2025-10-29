-- Independent Class Performance System Migration
-- This migration creates a comprehensive performance tracking system
-- that is independent of quiz management

-- Create comprehensive student performance tracking table
CREATE TABLE student_performance_tracking (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    
    -- Overall Performance Metrics
    total_score DECIMAL(5,2) DEFAULT 0.00,
    total_lessons_completed INT DEFAULT 0,
    current_topic VARCHAR(100),
    last_activity DATETIME,
    
    -- Topic-specific Performance
    functions_score DECIMAL(5,2) DEFAULT 0.00,
    functions_lessons_completed INT DEFAULT 0,
    functions_quiz_score DECIMAL(5,2) DEFAULT 0.00,
    functions_quiz_attempts INT DEFAULT 0,
    functions_quiz_best_score DECIMAL(5,2) DEFAULT 0.00,
    functions_quiz_status ENUM('NOT_ATTEMPTED', 'FAILED', 'PASSED') DEFAULT 'NOT_ATTEMPTED',
    functions_quiz_last_attempt DATETIME NULL,
    
    evaluating_functions_score DECIMAL(5,2) DEFAULT 0.00,
    evaluating_functions_lessons_completed INT DEFAULT 0,
    evaluating_functions_quiz_score DECIMAL(5,2) DEFAULT 0.00,
    evaluating_functions_quiz_attempts INT DEFAULT 0,
    evaluating_functions_quiz_best_score DECIMAL(5,2) DEFAULT 0.00,
    evaluating_functions_quiz_status ENUM('NOT_ATTEMPTED', 'FAILED', 'PASSED') DEFAULT 'NOT_ATTEMPTED',
    evaluating_functions_quiz_last_attempt DATETIME NULL,
    
    operations_on_functions_score DECIMAL(5,2) DEFAULT 0.00,
    operations_on_functions_lessons_completed INT DEFAULT 0,
    operations_on_functions_quiz_score DECIMAL(5,2) DEFAULT 0.00,
    operations_on_functions_quiz_attempts INT DEFAULT 0,
    operations_on_functions_quiz_best_score DECIMAL(5,2) DEFAULT 0.00,
    operations_on_functions_quiz_status ENUM('NOT_ATTEMPTED', 'FAILED', 'PASSED') DEFAULT 'NOT_ATTEMPTED',
    operations_on_functions_quiz_last_attempt DATETIME NULL,
    
    rational_functions_score DECIMAL(5,2) DEFAULT 0.00,
    rational_functions_lessons_completed INT DEFAULT 0,
    rational_functions_quiz_score DECIMAL(5,2) DEFAULT 0.00,
    rational_functions_quiz_attempts INT DEFAULT 0,
    rational_functions_quiz_best_score DECIMAL(5,2) DEFAULT 0.00,
    rational_functions_quiz_status ENUM('NOT_ATTEMPTED', 'FAILED', 'PASSED') DEFAULT 'NOT_ATTEMPTED',
    rational_functions_quiz_last_attempt DATETIME NULL,
    
    solving_real_life_problems_score DECIMAL(5,2) DEFAULT 0.00,
    solving_real_life_problems_lessons_completed INT DEFAULT 0,
    solving_real_life_problems_quiz_score DECIMAL(5,2) DEFAULT 0.00,
    solving_real_life_problems_quiz_attempts INT DEFAULT 0,
    solving_real_life_problems_quiz_best_score DECIMAL(5,2) DEFAULT 0.00,
    solving_real_life_problems_quiz_status ENUM('NOT_ATTEMPTED', 'FAILED', 'PASSED') DEFAULT 'NOT_ATTEMPTED',
    solving_real_life_problems_quiz_last_attempt DATETIME NULL,
    
    -- Overall Quiz Statistics
    total_quiz_attempts INT DEFAULT 0,
    overall_quiz_average DECIMAL(5,2) DEFAULT 0.00,
    passed_quizzes_count INT DEFAULT 0,
    failed_quizzes_count INT DEFAULT 0,
    quiz_pass_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Performance Status
    overall_performance_status ENUM('EXCELLENT', 'GOOD', 'AVERAGE', 'NEEDS_IMPROVEMENT', 'POOR') DEFAULT 'NEEDS_IMPROVEMENT',
    engagement_level ENUM('HIGH', 'MEDIUM', 'LOW') DEFAULT 'LOW',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    
    -- Indexes
    UNIQUE KEY unique_student_class (student_id, class_id),
    INDEX idx_student_id (student_id),
    INDEX idx_class_id (class_id),
    INDEX idx_total_score (total_score),
    INDEX idx_overall_performance_status (overall_performance_status),
    INDEX idx_last_activity (last_activity),
    INDEX idx_updated_at (updated_at)
);

-- Create class performance summary table
CREATE TABLE class_performance_summary (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    
    -- Class Statistics
    total_students INT DEFAULT 0,
    active_students INT DEFAULT 0,
    approved_students INT DEFAULT 0,
    pending_students INT DEFAULT 0,
    rejected_students INT DEFAULT 0,
    
    -- Performance Averages
    average_total_score DECIMAL(5,2) DEFAULT 0.00,
    average_lessons_completed DECIMAL(5,2) DEFAULT 0.00,
    average_quiz_score DECIMAL(5,2) DEFAULT 0.00,
    
    -- Quiz Statistics
    total_quiz_attempts INT DEFAULT 0,
    total_passed_quizzes INT DEFAULT 0,
    total_failed_quizzes INT DEFAULT 0,
    overall_quiz_pass_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Topic Completion Rates
    functions_completion_rate DECIMAL(5,2) DEFAULT 0.00,
    evaluating_functions_completion_rate DECIMAL(5,2) DEFAULT 0.00,
    operations_on_functions_completion_rate DECIMAL(5,2) DEFAULT 0.00,
    rational_functions_completion_rate DECIMAL(5,2) DEFAULT 0.00,
    solving_real_life_problems_completion_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Performance Distribution
    excellent_students INT DEFAULT 0,
    good_students INT DEFAULT 0,
    average_students INT DEFAULT 0,
    needs_improvement_students INT DEFAULT 0,
    poor_students INT DEFAULT 0,
    
    -- Engagement Distribution
    high_engagement_students INT DEFAULT 0,
    medium_engagement_students INT DEFAULT 0,
    low_engagement_students INT DEFAULT 0,
    
    -- Class Performance Status
    class_performance_status ENUM('EXCELLENT', 'GOOD', 'AVERAGE', 'NEEDS_IMPROVEMENT', 'POOR') DEFAULT 'NEEDS_IMPROVEMENT',
    
    -- Timestamps
    last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    
    -- Indexes
    UNIQUE KEY unique_class_summary (class_id),
    INDEX idx_class_id (class_id),
    INDEX idx_class_performance_status (class_performance_status),
    INDEX idx_last_calculated_at (last_calculated_at)
);

-- Create performance history table for tracking changes over time
CREATE TABLE performance_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    
    -- Performance Snapshot
    total_score DECIMAL(5,2) DEFAULT 0.00,
    total_lessons_completed INT DEFAULT 0,
    overall_quiz_average DECIMAL(5,2) DEFAULT 0.00,
    overall_performance_status ENUM('EXCELLENT', 'GOOD', 'AVERAGE', 'NEEDS_IMPROVEMENT', 'POOR') DEFAULT 'NEEDS_IMPROVEMENT',
    
    -- Change Tracking
    score_change DECIMAL(5,2) DEFAULT 0.00,
    lessons_change INT DEFAULT 0,
    quiz_average_change DECIMAL(5,2) DEFAULT 0.00,
    status_change VARCHAR(50),
    
    -- Metadata
    change_reason VARCHAR(255),
    recorded_by INT, -- teacher_id who recorded this change
    
    -- Timestamps
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES teachers(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_student_id (student_id),
    INDEX idx_class_id (class_id),
    INDEX idx_recorded_at (recorded_at),
    INDEX idx_performance_status (overall_performance_status)
);

-- Create performance analytics table for advanced reporting
CREATE TABLE performance_analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    teacher_id INT NOT NULL,
    
    -- Analytics Period
    analytics_period_start DATE NOT NULL,
    analytics_period_end DATE NOT NULL,
    
    -- Performance Trends
    average_score_trend ENUM('IMPROVING', 'STABLE', 'DECLINING') DEFAULT 'STABLE',
    engagement_trend ENUM('INCREASING', 'STABLE', 'DECREASING') DEFAULT 'STABLE',
    completion_rate_trend ENUM('IMPROVING', 'STABLE', 'DECLINING') DEFAULT 'STABLE',
    
    -- Key Metrics
    top_performing_topic VARCHAR(100),
    struggling_topic VARCHAR(100),
    most_engaged_topic VARCHAR(100),
    least_engaged_topic VARCHAR(100),
    
    -- Recommendations
    improvement_recommendations TEXT,
    intervention_needed BOOLEAN DEFAULT FALSE,
    intervention_priority ENUM('HIGH', 'MEDIUM', 'LOW') DEFAULT 'LOW',
    
    -- Timestamps
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_class_id (class_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_analytics_period (analytics_period_start, analytics_period_end),
    INDEX idx_calculated_at (calculated_at)
);

-- Create triggers to automatically update performance data
DELIMITER //

-- Trigger to update student performance when quiz is completed
CREATE TRIGGER update_student_performance_after_quiz
AFTER INSERT ON quiz_attempts
FOR EACH ROW
BEGIN
    DECLARE student_class_id INT;
    DECLARE quiz_score DECIMAL(5,2);
    DECLARE quiz_percentage DECIMAL(5,2);
    DECLARE current_attempts INT;
    DECLARE current_best_score DECIMAL(5,2);
    
    -- Get student's class
    SELECT class_id INTO student_class_id
    FROM class_enrollments 
    WHERE student_id = NEW.student_id AND enrollment_status = 'approved'
    LIMIT 1;
    
    -- Calculate quiz percentage
    SET quiz_percentage = (NEW.score / NEW.total_questions) * 100;
    
    -- Update or insert performance tracking
    INSERT INTO student_performance_tracking (
        student_id, class_id, last_activity,
        functions_quiz_score, functions_quiz_attempts, functions_quiz_best_score, 
        functions_quiz_status, functions_quiz_last_attempt
    )
    VALUES (
        NEW.student_id, student_class_id, NOW(),
        quiz_percentage, 1, quiz_percentage,
        CASE WHEN quiz_percentage >= 70 THEN 'PASSED' ELSE 'FAILED' END, NOW()
    )
    ON DUPLICATE KEY UPDATE
        last_activity = NOW(),
        functions_quiz_score = quiz_percentage,
        functions_quiz_attempts = functions_quiz_attempts + 1,
        functions_quiz_best_score = GREATEST(functions_quiz_best_score, quiz_percentage),
        functions_quiz_status = CASE WHEN GREATEST(functions_quiz_best_score, quiz_percentage) >= 70 THEN 'PASSED' ELSE 'FAILED' END,
        functions_quiz_last_attempt = NOW(),
        updated_at = NOW();
END//

-- Trigger to update performance when lesson is completed
CREATE TRIGGER update_student_performance_after_lesson
AFTER INSERT ON lesson_completion
FOR EACH ROW
BEGIN
    DECLARE student_class_id INT;
    DECLARE topic_column VARCHAR(50);
    DECLARE lessons_column VARCHAR(50);
    
    -- Get student's class
    SELECT class_id INTO student_class_id
    FROM class_enrollments 
    WHERE user_id = NEW.user_id AND enrollment_status = 'approved'
    LIMIT 1;
    
    -- Map topic name to column names
    SET topic_column = CONCAT(REPLACE(NEW.topic_name, '-', '_'), '_score');
    SET lessons_column = CONCAT(REPLACE(NEW.topic_name, '-', '_'), '_lessons_completed');
    
    -- Update performance tracking
    INSERT INTO student_performance_tracking (
        student_id, class_id, last_activity,
        total_lessons_completed
    )
    VALUES (
        NEW.user_id, student_class_id, NOW(), 1
    )
    ON DUPLICATE KEY UPDATE
        last_activity = NOW(),
        total_lessons_completed = total_lessons_completed + 1,
        updated_at = NOW();
END//

DELIMITER ;

-- Create stored procedures for performance calculations
DELIMITER //

-- Procedure to calculate class performance summary
CREATE PROCEDURE CalculateClassPerformanceSummary(IN p_class_id INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_total_students INT DEFAULT 0;
    DECLARE v_active_students INT DEFAULT 0;
    DECLARE v_approved_students INT DEFAULT 0;
    DECLARE v_pending_students INT DEFAULT 0;
    DECLARE v_rejected_students INT DEFAULT 0;
    DECLARE v_average_total_score DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_average_lessons_completed DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_average_quiz_score DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_total_quiz_attempts INT DEFAULT 0;
    DECLARE v_total_passed_quizzes INT DEFAULT 0;
    DECLARE v_total_failed_quizzes INT DEFAULT 0;
    DECLARE v_overall_quiz_pass_rate DECIMAL(5,2) DEFAULT 0.00;
    
    -- Calculate basic statistics
    SELECT 
        COUNT(*) as total_students,
        COUNT(CASE WHEN enrollment_status = 'approved' THEN 1 END) as approved_students,
        COUNT(CASE WHEN enrollment_status = 'pending' THEN 1 END) as pending_students,
        COUNT(CASE WHEN enrollment_status = 'rejected' THEN 1 END) as rejected_students,
        COUNT(CASE WHEN spt.total_lessons_completed > 0 THEN 1 END) as active_students
    INTO v_total_students, v_approved_students, v_pending_students, v_rejected_students, v_active_students
    FROM class_enrollments ce
    LEFT JOIN student_performance_tracking spt ON ce.student_id = spt.student_id AND ce.class_id = spt.class_id
    WHERE ce.class_id = p_class_id;
    
    -- Calculate averages
    SELECT 
        COALESCE(AVG(spt.total_score), 0) as avg_score,
        COALESCE(AVG(spt.total_lessons_completed), 0) as avg_lessons,
        COALESCE(AVG(spt.overall_quiz_average), 0) as avg_quiz_score,
        COALESCE(SUM(spt.total_quiz_attempts), 0) as total_attempts,
        COALESCE(SUM(spt.passed_quizzes_count), 0) as total_passed,
        COALESCE(SUM(spt.failed_quizzes_count), 0) as total_failed
    INTO v_average_total_score, v_average_lessons_completed, v_average_quiz_score, 
         v_total_quiz_attempts, v_total_passed_quizzes, v_total_failed_quizzes
    FROM student_performance_tracking spt
    WHERE spt.class_id = p_class_id;
    
    -- Calculate pass rate
    IF v_total_quiz_attempts > 0 THEN
        SET v_overall_quiz_pass_rate = (v_total_passed_quizzes / v_total_quiz_attempts) * 100;
    END IF;
    
    -- Insert or update class performance summary
    INSERT INTO class_performance_summary (
        class_id, total_students, active_students, approved_students, pending_students, rejected_students,
        average_total_score, average_lessons_completed, average_quiz_score,
        total_quiz_attempts, total_passed_quizzes, total_failed_quizzes, overall_quiz_pass_rate,
        last_calculated_at
    )
    VALUES (
        p_class_id, v_total_students, v_active_students, v_approved_students, v_pending_students, v_rejected_students,
        v_average_total_score, v_average_lessons_completed, v_average_quiz_score,
        v_total_quiz_attempts, v_total_passed_quizzes, v_total_failed_quizzes, v_overall_quiz_pass_rate,
        NOW()
    )
    ON DUPLICATE KEY UPDATE
        total_students = v_total_students,
        active_students = v_active_students,
        approved_students = v_approved_students,
        pending_students = v_pending_students,
        rejected_students = v_rejected_students,
        average_total_score = v_average_total_score,
        average_lessons_completed = v_average_lessons_completed,
        average_quiz_score = v_average_quiz_score,
        total_quiz_attempts = v_total_quiz_attempts,
        total_passed_quizzes = v_total_passed_quizzes,
        total_failed_quizzes = v_total_failed_quizzes,
        overall_quiz_pass_rate = v_overall_quiz_pass_rate,
        last_calculated_at = NOW(),
        updated_at = NOW();
END//

-- Procedure to update overall performance status for a student
CREATE PROCEDURE UpdateStudentPerformanceStatus(IN p_student_id INT, IN p_class_id INT)
BEGIN
    DECLARE v_total_score DECIMAL(5,2);
    DECLARE v_quiz_average DECIMAL(5,2);
    DECLARE v_lessons_completed INT;
    DECLARE v_performance_status VARCHAR(20);
    DECLARE v_engagement_level VARCHAR(10);
    
    -- Get current performance data
    SELECT 
        total_score, overall_quiz_average, total_lessons_completed
    INTO v_total_score, v_quiz_average, v_lessons_completed
    FROM student_performance_tracking
    WHERE student_id = p_student_id AND class_id = p_class_id;
    
    -- Calculate performance status based on multiple factors
    IF v_total_score >= 90 AND v_quiz_average >= 85 AND v_lessons_completed >= 15 THEN
        SET v_performance_status = 'EXCELLENT';
        SET v_engagement_level = 'HIGH';
    ELSEIF v_total_score >= 80 AND v_quiz_average >= 75 AND v_lessons_completed >= 12 THEN
        SET v_performance_status = 'GOOD';
        SET v_engagement_level = 'HIGH';
    ELSEIF v_total_score >= 70 AND v_quiz_average >= 65 AND v_lessons_completed >= 8 THEN
        SET v_performance_status = 'AVERAGE';
        SET v_engagement_level = 'MEDIUM';
    ELSEIF v_total_score >= 60 AND v_quiz_average >= 55 AND v_lessons_completed >= 5 THEN
        SET v_performance_status = 'NEEDS_IMPROVEMENT';
        SET v_engagement_level = 'MEDIUM';
    ELSE
        SET v_performance_status = 'POOR';
        SET v_engagement_level = 'LOW';
    END IF;
    
    -- Update performance status
    UPDATE student_performance_tracking
    SET 
        overall_performance_status = v_performance_status,
        engagement_level = v_engagement_level,
        updated_at = NOW()
    WHERE student_id = p_student_id AND class_id = p_class_id;
END//

DELIMITER ;

-- Create views for easy data access
CREATE VIEW student_performance_view AS
SELECT 
    spt.*,
    u.first_name,
    u.last_name,
    u.student_id as student_number,
    u.email,
    c.class_name,
    c.class_code,
    ce.enrollment_status,
    ce.enrolled_at,
    ce.approved_at
FROM student_performance_tracking spt
JOIN users u ON spt.student_id = u.id
JOIN classes c ON spt.class_id = c.id
JOIN class_enrollments ce ON spt.student_id = ce.student_id AND spt.class_id = ce.class_id;

CREATE VIEW class_performance_overview AS
SELECT 
    cps.*,
    c.class_name,
    c.class_code,
    c.grade_level,
    c.strand,
    t.first_name as teacher_first_name,
    t.last_name as teacher_last_name
FROM class_performance_summary cps
JOIN classes c ON cps.class_id = c.id
JOIN teachers t ON c.teacher_id = t.id;

-- Insert initial performance data for existing students
INSERT INTO student_performance_tracking (student_id, class_id, last_activity)
SELECT 
    ce.student_id,
    ce.class_id,
    COALESCE(up.updated_at, ce.enrolled_at) as last_activity
FROM class_enrollments ce
LEFT JOIN user_progress up ON ce.student_id = up.user_id
WHERE ce.enrollment_status = 'approved'
ON DUPLICATE KEY UPDATE last_activity = VALUES(last_activity);

-- Calculate initial class performance summaries
CALL CalculateClassPerformanceSummary(1);
CALL CalculateClassPerformanceSummary(2);
CALL CalculateClassPerformanceSummary(3);

-- Add comments for documentation
ALTER TABLE student_performance_tracking COMMENT = 'Comprehensive student performance tracking independent of quiz management';
ALTER TABLE class_performance_summary COMMENT = 'Class-level performance summaries and statistics';
ALTER TABLE performance_history COMMENT = 'Historical performance data for trend analysis';
ALTER TABLE performance_analytics COMMENT = 'Advanced analytics and insights for class performance';

-- Create indexes for better performance
CREATE INDEX idx_performance_tracking_composite ON student_performance_tracking (class_id, overall_performance_status, last_activity);
CREATE INDEX idx_performance_summary_composite ON class_performance_summary (class_performance_status, last_calculated_at);
CREATE INDEX idx_performance_history_composite ON performance_history (student_id, recorded_at, overall_performance_status);
