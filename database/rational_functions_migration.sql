-- Database Migration: Rational Functions Topic
-- This migration adds the Rational Functions topic and its lessons to the database

USE mathease_db;

-- Insert the Rational Functions topic
INSERT INTO topics (name, description, difficulty_level, order_index) VALUES
('Rational Functions', 'Master the fundamentals of rational functions including domain analysis, graphing, equation solving, and inequality solving. Learn to identify asymptotes, intercepts, and behavior patterns.', 'intermediate', 6);

-- Get the ID of the newly inserted topic
SET @topic_id = LAST_INSERT_ID();

-- Insert lessons for the Rational Functions topic
INSERT INTO lessons (topic_id, title, content, duration_minutes, order_index) VALUES
(@topic_id, 'Understanding Rational Functions', 'Learn the fundamental concepts of rational functions, their definitions, domain restrictions, and basic properties. Understand how to identify rational functions and their key characteristics.', 60, 1),
(@topic_id, 'Graphing Rational Functions', 'Master the art of graphing rational functions including finding asymptotes, intercepts, and plotting key points. Learn to analyze behavior around asymptotes and identify domain restrictions.', 75, 2),
(@topic_id, 'Solving Rational Equations', 'Learn systematic methods for solving rational equations including finding common denominators, clearing fractions, and checking for extraneous solutions.', 90, 3),
(@topic_id, 'Solving Rational Inequalities', 'Master techniques for solving rational inequalities using number lines, test points, and interval notation. Learn to identify critical points and determine solution sets.', 75, 4);

-- Insert a comprehensive quiz for the topic
INSERT INTO quizzes (topic_id, title, description, time_limit_minutes, total_questions, passing_score) VALUES
(@topic_id, 'Rational Functions Quiz', 'Test your understanding of rational functions including domain analysis, graphing, equation solving, and inequality solving.', 30, 10, 70);

-- Get the quiz ID
SET @quiz_id = LAST_INSERT_ID();

-- Insert quiz questions
INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, order_index) VALUES
(@quiz_id, 'What is the domain of f(x) = (x+1)/(x-2)?', 'multiple_choice', 1, 1),
(@quiz_id, 'What is the vertical asymptote of f(x) = 1/(x+3)?', 'multiple_choice', 1, 2),
(@quiz_id, 'What is the horizontal asymptote of f(x) = (2x+1)/(3x-1)?', 'multiple_choice', 1, 3),
(@quiz_id, 'Solve the equation: 1/x + 1/(x+2) = 5/12', 'multiple_choice', 1, 4),
(@quiz_id, 'What is the x-intercept of f(x) = (x-1)/(x+2)?', 'multiple_choice', 1, 5),
(@quiz_id, 'What is the y-intercept of f(x) = (x+1)/(x-3)?', 'multiple_choice', 1, 6),
(@quiz_id, 'Solve the inequality: (x-1)/(x+2) ≥ 0', 'multiple_choice', 1, 7),
(@quiz_id, 'What is the domain of f(x) = (x²-1)/(x²-4)?', 'multiple_choice', 1, 8),
(@quiz_id, 'Which function has a horizontal asymptote at y = 0?', 'multiple_choice', 1, 9),
(@quiz_id, 'What is the solution to 2/(x-1) = 3/(x+1)?', 'multiple_choice', 1, 10);

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
(@q1_id, 'All real numbers except x = 2', 1),
(@q1_id, 'All real numbers except x = -1', 0),
(@q1_id, 'All real numbers', 0),
(@q1_id, 'x > 2 only', 0);

-- Insert options for question 2
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q2_id, 'x = -3', 1),
(@q2_id, 'x = 3', 0),
(@q2_id, 'x = 0', 0),
(@q2_id, 'No vertical asymptote', 0);

-- Insert options for question 3
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q3_id, 'y = 2/3', 1),
(@q3_id, 'y = 0', 0),
(@q3_id, 'y = 3/2', 0),
(@q3_id, 'No horizontal asymptote', 0);

-- Insert options for question 4
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q4_id, 'x = 1.2 and x = -4', 1),
(@q4_id, 'x = 2 and x = -2', 0),
(@q4_id, 'x = 0 and x = -2', 0),
(@q4_id, 'No solution', 0);

-- Insert options for question 5
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q5_id, 'x = 1', 1),
(@q5_id, 'x = -2', 0),
(@q5_id, 'x = 0', 0),
(@q5_id, 'No x-intercept', 0);

-- Insert options for question 6
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q6_id, 'y = -1/3', 1),
(@q6_id, 'y = 1/3', 0),
(@q6_id, 'y = 0', 0),
(@q6_id, 'No y-intercept', 0);

-- Insert options for question 7
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q7_id, '(-∞, -2) ∪ [1, ∞)', 1),
(@q7_id, '(-∞, -2) ∪ (1, ∞)', 0),
(@q7_id, '(-2, 1)', 0),
(@q7_id, 'No solution', 0);

-- Insert options for question 8
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q8_id, 'All real numbers except x = 2 and x = -2', 1),
(@q8_id, 'All real numbers except x = 1 and x = -1', 0),
(@q8_id, 'All real numbers', 0),
(@q8_id, 'x > 2 only', 0);

-- Insert options for question 9
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q9_id, 'f(x) = 1/(x+1)', 1),
(@q9_id, 'f(x) = (x+1)/(x-1)', 0),
(@q9_id, 'f(x) = (2x+1)/(x-1)', 0),
(@q9_id, 'f(x) = x/(x+1)', 0);

-- Insert options for question 10
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q10_id, 'x = 5', 1),
(@q10_id, 'x = -5', 0),
(@q10_id, 'x = 1', 0),
(@q10_id, 'No solution', 0);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_topics_order ON topics(order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_topic_order ON lessons(topic_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quizzes_topic ON quizzes(topic_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question ON quiz_question_options(question_id);

-- Insert sample badges for this topic
INSERT INTO badges (name, description, icon, criteria) VALUES
('Rational Function Master', 'Complete all lessons in Rational Functions', 'fas fa-chart-line', 'complete_topic'),
('Asymptote Expert', 'Score 90% or higher on the Rational Functions quiz', 'fas fa-search', 'quiz_score'),
('Inequality Solver', 'Master solving rational inequalities', 'fas fa-calculator', 'complete_applications');

-- Display success message
SELECT 'Rational Functions topic and lessons have been successfully added to the database!' as message;
