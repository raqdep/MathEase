-- Migration to create class_topic_locks table
-- This table stores the lock status of topics for specific classes

CREATE TABLE IF NOT EXISTS class_topic_locks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic_id INT NOT NULL,
    class_id INT NOT NULL,
    is_locked TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_class_topic (topic_id, class_id),
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Add index for better performance
CREATE INDEX idx_class_topic_locks_class_id ON class_topic_locks(class_id);
CREATE INDEX idx_class_topic_locks_topic_id ON class_topic_locks(topic_id);
CREATE INDEX idx_class_topic_locks_is_locked ON class_topic_locks(is_locked);
