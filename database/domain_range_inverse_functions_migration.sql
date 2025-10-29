-- Database Migration: Domain and Range of Inverse Functions Topic
-- This migration adds the new topic and its lessons to the database

-- Insert the new topic
INSERT INTO topics (name, description, difficulty_level, order_index) VALUES
('Domain and Range of Inverse Functions', 'Master the concepts of domain and range for inverse functions. Learn to find inverse functions, understand the domain-range relationship, and apply these concepts to real-world problems.', 'intermediate', 9);

-- Get the ID of the newly inserted topic
SET @topic_id = LAST_INSERT_ID();

-- Insert lessons for the new topic
INSERT INTO lessons (topic_id, title, content, duration_minutes, order_index) VALUES
(@topic_id, 'Understanding Inverse Functions', 'Learn what inverse functions are, how they relate to original functions, and the fundamental relationship between their domains and ranges.', 60, 1),
(@topic_id, 'Finding Domain of Inverse Functions', 'Learn systematic methods for determining the domain of inverse functions and understand the relationship with the original function''s range.', 75, 2),
(@topic_id, 'Finding Range of Inverse Functions', 'Learn how to determine the range of inverse functions and understand how it relates to the original function''s domain.', 75, 3),
(@topic_id, 'Applications & Problem Solving', 'Apply domain and range concepts of inverse functions to solve real-world problems in various fields including physics, economics, and engineering.', 90, 4);

-- Insert a comprehensive quiz for the topic
INSERT INTO quizzes (topic_id, title, description, time_limit_minutes, total_questions, passing_score) VALUES
(@topic_id, 'Domain and Range of Inverse Functions Quiz', 'Test your understanding of inverse functions, domain-range relationships, and real-world applications.', 30, 10, 70);

-- Get the quiz ID
SET @quiz_id = LAST_INSERT_ID();

-- Insert quiz questions
INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, order_index) VALUES
(@quiz_id, 'What is the inverse function of f(x) = 2x + 3?', 'multiple_choice', 1, 1),
(@quiz_id, 'If f(x) = x² for x ≥ 0, what is the domain of f⁻¹(x)?', 'multiple_choice', 1, 2),
(@quiz_id, 'What is the fundamental relationship between the domain of f⁻¹ and the range of f?', 'multiple_choice', 1, 3),
(@quiz_id, 'For f(x) = 1/x, what is the range of f⁻¹(x)?', 'multiple_choice', 1, 4),
(@quiz_id, 'Which function has an inverse: f(x) = x² or g(x) = x³?', 'multiple_choice', 1, 5),
(@quiz_id, 'What is the inverse of the temperature conversion F = (9/5)C + 32?', 'multiple_choice', 1, 6),
(@quiz_id, 'For the kinetic energy function KE = (1/2)mv², what is the domain of the inverse function v(KE)?', 'multiple_choice', 1, 7),
(@quiz_id, 'In the supply function P = 2Q, what is the range of the inverse function Q(P)?', 'multiple_choice', 1, 8),
(@quiz_id, 'What is the range of f⁻¹(x) if f(x) has domain x ≥ 0?', 'multiple_choice', 1, 9),
(@quiz_id, 'For the compound interest A = P(1 + r)ᵗ, what is the domain restriction for the inverse function r(A)?', 'multiple_choice', 1, 10);

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
(@q1_id, 'f⁻¹(x) = (x-3)/2', 1),
(@q1_id, 'f⁻¹(x) = (x+3)/2', 0),
(@q1_id, 'f⁻¹(x) = 2x-3', 0),
(@q1_id, 'f⁻¹(x) = x/2-3', 0);

-- Insert options for question 2
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q2_id, 'x ≥ 0', 1),
(@q2_id, 'x > 0', 0),
(@q2_id, 'All real numbers', 0),
(@q2_id, 'x ≤ 0', 0);

-- Insert options for question 3
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q3_id, 'Domain of f⁻¹ = Range of f', 1),
(@q3_id, 'Domain of f⁻¹ = Domain of f', 0),
(@q3_id, 'Domain of f⁻¹ = Range of f⁻¹', 0),
(@q3_id, 'No relationship exists', 0);

-- Insert options for question 4
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q4_id, 'y ≠ 0', 1),
(@q4_id, 'y > 0', 0),
(@q4_id, 'y < 0', 0),
(@q4_id, 'All real numbers', 0);

-- Insert options for question 5
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q5_id, 'g(x) = x³ only', 1),
(@q5_id, 'f(x) = x² only', 0),
(@q5_id, 'Both functions', 0),
(@q5_id, 'Neither function', 0);

-- Insert options for question 6
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q6_id, 'C = (5/9)(F - 32)', 1),
(@q6_id, 'C = (9/5)(F - 32)', 0),
(@q6_id, 'C = (5/9)F + 32', 0),
(@q6_id, 'C = (9/5)F + 32', 0);

-- Insert options for question 7
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q7_id, 'KE ≥ 0', 1),
(@q7_id, 'KE > 0', 0),
(@q7_id, 'KE ≤ 0', 0),
(@q7_id, 'All real numbers', 0);

-- Insert options for question 8
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q8_id, 'Q ≥ 0', 1),
(@q8_id, 'Q > 0', 0),
(@q8_id, 'Q ≤ 0', 0),
(@q8_id, 'All real numbers', 0);

-- Insert options for question 9
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q9_id, 'y ≥ 0', 1),
(@q9_id, 'y > 0', 0),
(@q9_id, 'y ≤ 0', 0),
(@q9_id, 'All real numbers', 0);

-- Insert options for question 10
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q10_id, 'A > P and t > 0', 1),
(@q10_id, 'A > 0 and P > 0', 0),
(@q10_id, 'A ≥ P and t ≥ 0', 0),
(@q10_id, 'A > 0 only', 0);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_topics_order ON topics(order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_topic_order ON lessons(topic_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quizzes_topic ON quizzes(topic_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question ON quiz_question_options(question_id);

-- Insert sample badges for this topic
INSERT INTO badges (name, description, icon, criteria) VALUES
('Inverse Function Master', 'Complete all lessons in Domain and Range of Inverse Functions', 'fas fa-exchange-alt', 'complete_topic'),
('Domain-Range Expert', 'Score 90% or higher on the Inverse Functions quiz', 'fas fa-search', 'quiz_score'),
('Application Solver', 'Master real-world applications of inverse functions', 'fas fa-globe', 'complete_applications');

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
SELECT 'Domain and Range of Inverse Functions topic and lessons have been successfully added to the database!' as message;
