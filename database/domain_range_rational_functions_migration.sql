-- Database Migration: The Domain and Range of a Rational Functions Topic
-- This migration adds the new topic and its lessons to the database

-- Insert the new topic
INSERT INTO topics (name, description, difficulty_level, order_index) VALUES
('The Domain and Range of a Rational Functions', 'Master the concepts of domain and range for rational functions. Learn to identify restrictions, analyze behavior, and determine the complete set of possible input and output values.', 'intermediate', 8);

-- Get the ID of the newly inserted topic
SET @topic_id = LAST_INSERT_ID();

-- Insert lessons for the new topic
INSERT INTO lessons (topic_id, title, content, duration_minutes, order_index) VALUES
(@topic_id, 'Understanding Domain', 'Learn what domain means for rational functions, how to identify restrictions, and why certain values are excluded from the domain. Express domain in interval notation.', 60, 1),
(@topic_id, 'Understanding Range', 'Learn what range means for rational functions, how to determine the set of possible output values, and the relationship between range and horizontal asymptotes.', 75, 2),
(@topic_id, 'Finding Domain & Range', 'Learn systematic methods for finding both domain and range of rational functions, including step-by-step procedures and common techniques.', 90, 3),
(@topic_id, 'Applications & Problem Solving', 'Apply domain and range concepts to solve real-world problems in physics, economics, engineering, and other fields.', 75, 4);

-- Insert a comprehensive quiz for the topic
INSERT INTO quizzes (topic_id, title, description, time_limit_minutes, total_questions, passing_score) VALUES
(@topic_id, 'Domain and Range of Rational Functions Quiz', 'Test your understanding of domain and range concepts, restrictions, interval notation, and real-world applications.', 30, 10, 70);

-- Get the quiz ID
SET @quiz_id = LAST_INSERT_ID();

-- Insert quiz questions
INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, order_index) VALUES
(@quiz_id, 'What is the domain of f(x) = 1/(x-3)?', 'multiple_choice', 1, 1),
(@quiz_id, 'What is the range of f(x) = 1/x?', 'multiple_choice', 1, 2),
(@quiz_id, 'Which of the following represents the domain of f(x) = (x+1)/(x²-4) in interval notation?', 'multiple_choice', 1, 3),
(@quiz_id, 'What is the horizontal asymptote of f(x) = (2x+1)/(3x-2)?', 'multiple_choice', 1, 4),
(@quiz_id, 'For the function f(x) = (x²-1)/(x+2), what is the domain?', 'multiple_choice', 1, 5),
(@quiz_id, 'What values are excluded from the domain of f(x) = 1/(x²-9)?', 'multiple_choice', 1, 6),
(@quiz_id, 'In the lens equation 1/f = 1/d₀ + 1/dᵢ, what is the domain restriction for d₀?', 'multiple_choice', 1, 7),
(@quiz_id, 'For the average cost function AC(x) = C(x)/x, what is the domain?', 'multiple_choice', 1, 8),
(@quiz_id, 'What is the range of f(x) = (2x+1)/(3x-2)?', 'multiple_choice', 1, 9),
(@quiz_id, 'In the market share function S(a) = ka/(a + b), what is the range?', 'multiple_choice', 1, 10);

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
(@q1_id, 'All real numbers except x = 3', 1),
(@q1_id, 'All real numbers except x = -3', 0),
(@q1_id, 'All real numbers', 0),
(@q1_id, 'x > 3 only', 0);

-- Insert options for question 2
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q2_id, 'All real numbers except y = 0', 1),
(@q2_id, 'All real numbers', 0),
(@q2_id, 'y > 0 only', 0),
(@q2_id, 'y < 0 only', 0);

-- Insert options for question 3
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q3_id, '(-∞, -2) ∪ (-2, 2) ∪ (2, ∞)', 1),
(@q3_id, '(-∞, -2) ∪ (2, ∞)', 0),
(@q3_id, '(-∞, -1) ∪ (-1, ∞)', 0),
(@q3_id, 'All real numbers', 0);

-- Insert options for question 4
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q4_id, 'y = 2/3', 1),
(@q4_id, 'y = 0', 0),
(@q4_id, 'y = 3/2', 0),
(@q4_id, 'No horizontal asymptote', 0);

-- Insert options for question 5
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q5_id, 'All real numbers except x = -2', 1),
(@q5_id, 'All real numbers except x = 2', 0),
(@q5_id, 'All real numbers except x = ±1', 0),
(@q5_id, 'All real numbers', 0);

-- Insert options for question 6
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q6_id, 'x = 3 and x = -3', 1),
(@q6_id, 'x = 9 and x = -9', 0),
(@q6_id, 'x = 0 only', 0),
(@q6_id, 'No exclusions', 0);

-- Insert options for question 7
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q7_id, 'd₀ > 0 and d₀ ≠ f', 1),
(@q7_id, 'd₀ > 0 only', 0),
(@q7_id, 'd₀ ≥ 0', 0),
(@q7_id, 'd₀ ≠ 0 only', 0);

-- Insert options for question 8
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q8_id, 'x > 0', 1),
(@q8_id, 'x ≥ 0', 0),
(@q8_id, 'x ≠ 0', 0),
(@q8_id, 'All real numbers', 0);

-- Insert options for question 9
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q9_id, 'All real numbers except y = 2/3', 1),
(@q9_id, 'All real numbers except y = 0', 0),
(@q9_id, 'All real numbers', 0),
(@q9_id, 'y > 2/3 only', 0);

-- Insert options for question 10
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q10_id, '0 ≤ S(a) < k', 1),
(@q10_id, 'S(a) > 0', 0),
(@q10_id, 'S(a) ≥ k', 0),
(@q10_id, 'All real numbers', 0);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_topics_order ON topics(order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_topic_order ON lessons(topic_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quizzes_topic ON quizzes(topic_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question ON quiz_question_options(question_id);

-- Insert sample badges for this topic
INSERT INTO badges (name, description, icon, criteria) VALUES
('Domain Master', 'Complete all lessons in Domain and Range of Rational Functions', 'fas fa-expand-arrows-alt', 'complete_topic'),
('Range Analyzer', 'Score 90% or higher on the Domain and Range quiz', 'fas fa-chart-bar', 'quiz_score'),
('Interval Notation Expert', 'Master interval notation for domain and range', 'fas fa-calculator', 'complete_applications');

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
SELECT 'The Domain and Range of a Rational Functions topic and lessons have been successfully added to the database!' as message;
