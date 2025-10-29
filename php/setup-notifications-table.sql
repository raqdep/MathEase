-- Create teacher_notifications table
CREATE TABLE IF NOT EXISTS `teacher_notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `class_id` (`class_id`),
  KEY `is_read` (`is_read`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample notifications for testing
INSERT INTO `teacher_notifications` (`teacher_id`, `class_id`, `type`, `title`, `message`, `is_read`, `created_at`)
SELECT 
    t.id,
    c.id,
    'enrollment',
    'New Student Enrollment',
    CONCAT('A new student has requested to join your class "', c.class_name, '"'),
    0,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY)
FROM teachers t
CROSS JOIN classes c
WHERE c.teacher_id = t.id
LIMIT 3;

INSERT INTO `teacher_notifications` (`teacher_id`, `class_id`, `type`, `title`, `message`, `is_read`, `created_at`)
SELECT 
    t.id,
    c.id,
    'quiz_submitted',
    'Quiz Submission',
    CONCAT('Students have submitted quizzes in "', c.class_name, '"'),
    0,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 3) DAY)
FROM teachers t
CROSS JOIN classes c
WHERE c.teacher_id = t.id
LIMIT 2;

INSERT INTO `teacher_notifications` (`teacher_id`, `class_id`, `type`, `title`, `message`, `is_read`, `created_at`)
SELECT 
    t.id,
    c.id,
    'class_update',
    'Class Progress Update',
    CONCAT('Your class "', c.class_name, '" has reached 75% lesson completion'),
    1,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY)
FROM teachers t
CROSS JOIN classes c
WHERE c.teacher_id = t.id
LIMIT 2;

INSERT INTO `teacher_notifications` (`teacher_id`, `type`, `title`, `message`, `is_read`, `created_at`)
SELECT 
    t.id,
    'system',
    'Welcome to MathEase',
    'Thank you for using MathEase! Your notification system is now active.',
    1,
    DATE_SUB(NOW(), INTERVAL 10 DAY)
FROM teachers t
LIMIT 1;
