-- Database Migration: One-to-One Functions Topic
-- This migration adds the new topic and its lessons to the database

-- Insert the new topic
INSERT INTO topics (name, description, difficulty_level, order_index) VALUES
('One-to-One Functions', 'Master the concept of one-to-one functions. Learn to identify injective functions, understand their properties, and explore their relationship with inverse functions.', 'intermediate', 9);

-- Get the ID of the newly inserted topic
SET @topic_id = LAST_INSERT_ID();

-- Insert lessons for the new topic
INSERT INTO lessons (topic_id, title, content, duration_minutes, order_index) VALUES
(@topic_id, 'Understanding One-to-One Functions', 'Learn what makes a function one-to-one, understand the horizontal line test, and explore the fundamental properties of injective functions.', 60, 1),
(@topic_id, 'Testing for One-to-One', 'Learn systematic methods to test whether a function is one-to-one, including algebraic tests, graphical analysis, and practical techniques.', 75, 2),
(@topic_id, 'Inverse Functions', 'Explore the relationship between one-to-one functions and their inverses. Learn to find inverse functions and understand their properties.', 90, 3),
(@topic_id, 'Applications & Problem Solving', 'Apply one-to-one function concepts to solve real-world problems in cryptography, data encryption, and various mathematical applications.', 75, 4);

-- Insert a comprehensive quiz for the topic
INSERT INTO quizzes (topic_id, title, description, time_limit_minutes, total_questions, passing_score) VALUES
(@topic_id, 'One-to-One Functions Quiz', 'Test your understanding of one-to-one functions, horizontal line test, inverse functions, and real-world applications.', 30, 10, 70);

-- Get the quiz ID
SET @quiz_id = LAST_INSERT_ID();

-- Insert quiz questions
INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, order_index) VALUES
(@quiz_id, 'What is the definition of a one-to-one function?', 'multiple_choice', 1, 1),
(@quiz_id, 'Which test is used to determine if a function is one-to-one?', 'multiple_choice', 1, 2),
(@quiz_id, 'Is the function f(x) = x² one-to-one?', 'multiple_choice', 1, 3),
(@quiz_id, 'Is the function f(x) = x³ one-to-one?', 'multiple_choice', 1, 4),
(@quiz_id, 'What is the inverse of f(x) = 2x + 3?', 'multiple_choice', 1, 5),
(@quiz_id, 'Which of the following functions is one-to-one?', 'multiple_choice', 1, 6),
(@quiz_id, 'What property must a function have to have an inverse?', 'multiple_choice', 1, 7),
(@quiz_id, 'In cryptography, why must encryption functions be one-to-one?', 'multiple_choice', 1, 8),
(@quiz_id, 'What is the horizontal line test used for?', 'multiple_choice', 1, 9),
(@quiz_id, 'Which function fails the horizontal line test?', 'multiple_choice', 1, 10);

-- Get question IDs for inserting options
SET @q1_id = (SELECT id FROM quiz_questions WHERE quiz_id = @quiz_id AND order_index = 1);
SET @q2_id = (SELECT id FROM quiz_questions WHERE quiz_id = @quiz_id AND order_index = 2);
SET @q3_id = (SELECT id FROM quiz_questions WHERE quiz_id = @quiz_id AND order_index = 3);
SET @q4_id = (SELECT id FROM quiz_questions WHERE quiz_id = @quiz_id AND order_index = 4);
SET @q5_id = (SELECT id FROM quiz_questions WHERE quiz_id = @quiz_id AND order_index = 5);
SET @q6_id = (SELECT id FROM quiz_questions WHERE quiz_id = @quiz_id AND order_index = 6);
SET @q7_id = (SELECT id FROM quiz_questions WHERE quiz_id = @quiz_id AND order_index = 7);
SET @q8_id = (SELECT id FROM quiz_questions WHERE quiz_id = @quiz_id AND order_index = 8);
SET @q9_id = (SELECT id FROM quiz_questions WHERE quiz_id = @quiz_id AND order_index = 9);
SET @q10_id = (SELECT id FROM quiz_questions WHERE quiz_id = @quiz_id AND order_index = 10);

-- Insert options for question 1
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q1_id, 'A function where each input has exactly one output', 0),
(@q1_id, 'A function where each output corresponds to exactly one input', 1),
(@q1_id, 'A function that is continuous everywhere', 0),
(@q1_id, 'A function that is differentiable everywhere', 0);

-- Insert options for question 2
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q2_id, 'Vertical line test', 0),
(@q2_id, 'Horizontal line test', 1),
(@q2_id, 'Slope test', 0),
(@q2_id, 'Derivative test', 0);

-- Insert options for question 3
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q3_id, 'Yes, it is one-to-one', 0),
(@q3_id, 'No, it is not one-to-one', 1),
(@q3_id, 'It depends on the domain', 0),
(@q3_id, 'Cannot be determined', 0);

-- Insert options for question 4
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q4_id, 'Yes, it is one-to-one', 1),
(@q4_id, 'No, it is not one-to-one', 0),
(@q4_id, 'It depends on the domain', 0),
(@q4_id, 'Cannot be determined', 0);

-- Insert options for question 5
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q5_id, 'f⁻¹(x) = (x - 3) / 2', 1),
(@q5_id, 'f⁻¹(x) = (x + 3) / 2', 0),
(@q5_id, 'f⁻¹(x) = 2x - 3', 0),
(@q5_id, 'f⁻¹(x) = x / 2 - 3', 0);

-- Insert options for question 6
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q6_id, 'f(x) = x²', 0),
(@q6_id, 'f(x) = |x|', 0),
(@q6_id, 'f(x) = x + 5', 1),
(@q6_id, 'f(x) = x² - 4', 0);

-- Insert options for question 7
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q7_id, 'It must be continuous', 0),
(@q7_id, 'It must be differentiable', 0),
(@q7_id, 'It must be one-to-one', 1),
(@q7_id, 'It must be onto', 0);

-- Insert options for question 8
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q8_id, 'To ensure fast encryption', 0),
(@q8_id, 'To ensure unique decryption', 1),
(@q8_id, 'To prevent hacking', 0),
(@q8_id, 'To reduce memory usage', 0);

-- Insert options for question 9
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q9_id, 'To find vertical asymptotes', 0),
(@q9_id, 'To determine if a function is one-to-one', 1),
(@q9_id, 'To find horizontal asymptotes', 0),
(@q9_id, 'To calculate derivatives', 0);

-- Insert options for question 10
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q10_id, 'f(x) = x + 3', 0),
(@q10_id, 'f(x) = x³', 0),
(@q10_id, 'f(x) = x²', 1),
(@q10_id, 'f(x) = 2x - 1', 0);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_topics_order ON topics(order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_topic_order ON lessons(topic_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quizzes_topic ON quizzes(topic_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question ON quiz_question_options(question_id);

-- Insert sample badges for this topic
INSERT INTO badges (name, description, icon, criteria) VALUES
('One-to-One Master', 'Complete all lessons in One-to-One Functions', 'fas fa-exchange-alt', 'complete_topic'),
('Inverse Function Expert', 'Score 90% or higher on the One-to-One Functions quiz', 'fas fa-undo', 'quiz_score'),
('Horizontal Line Test Pro', 'Master the horizontal line test for one-to-one functions', 'fas fa-check-double', 'complete_applications');

-- Update the topics view to include the new topic
CREATE OR REPLACE VIEW topic_progress_view AS
SELECT 
    t.id,
    t.name,
    t.description,
    t.difficulty_level,
    t.order_index,
    COUNT(l.id) as total_lessons,
    COUNT(q.id) as total_quizzes
FROM topics t
LEFT JOIN lessons l ON t.id = l.topic_id
LEFT JOIN quizzes q ON t.id = q.topic_id
WHERE t.is_active = TRUE
GROUP BY t.id, t.name, t.description, t.difficulty_level, t.order_index
ORDER BY t.order_index;

-- Create a view for lesson progress
CREATE OR REPLACE VIEW lesson_progress_view AS
SELECT 
    l.id,
    l.topic_id,
    l.title,
    l.duration_minutes,
    l.order_index,
    t.name as topic_name
FROM lessons l
JOIN topics t ON l.topic_id = t.id
WHERE t.is_active = TRUE
ORDER BY t.order_index, l.order_index;

-- Insert sample data for testing (optional)
-- This can be removed in production
INSERT INTO user_topic_progress (user_id, topic_id, is_completed, completion_date) VALUES
(1, @topic_id, FALSE, NULL);

-- Display success message
SELECT 'One-to-One Functions topic and lessons have been successfully added to the database!' as message;
