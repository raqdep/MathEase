-- Topic Locks Migration
-- This table stores which topics are locked/unlocked by teachers

CREATE TABLE IF NOT EXISTS topic_locks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    topic_id VARCHAR(50) NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_by INT NOT NULL,
    locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (locked_by) REFERENCES teachers(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_teacher_topic (teacher_id, topic_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_topic_id (topic_id),
    INDEX idx_is_locked (is_locked)
);

-- Insert sample data (optional)
-- INSERT INTO topic_locks (teacher_id, topic_id, is_locked, locked_by, notes) VALUES
-- (1, 'functions', FALSE, 1, 'Functions topic is available for students'),
-- (1, 'evaluating-functions', TRUE, 1, 'Locked until students complete Functions topic'),
-- (1, 'operations-on-functions', TRUE, 1, 'Locked until students complete Evaluating Functions topic'),
-- (1, 'solving-real-life-problems', TRUE, 1, 'Locked until students complete Operations on Functions topic'),
-- (1, 'rational-functions', TRUE, 1, 'Locked until students complete Solving Real-Life Problems topic');
