-- Database Migration: Representations of Rational Functions Topic
-- This migration adds the new topic and its lessons to the database

-- Insert the new topic
INSERT INTO topics (name, description, difficulty_level, order_index) VALUES
('Representations of Rational Functions', 'Master the different ways to represent rational functions through algebraic, graphical, and tabular forms. Learn to analyze asymptotes, intercepts, and domain restrictions.', 'intermediate', 7);

-- Get the ID of the newly inserted topic
SET @topic_id = LAST_INSERT_ID();

-- Insert lessons for the new topic
INSERT INTO lessons (topic_id, title, content, duration_minutes, order_index) VALUES
(@topic_id, 'Understanding Rational Functions', 'Learn the fundamental concepts of rational functions, their definitions, and how to identify them in various forms. Understand domain and range restrictions.', 60, 1),
(@topic_id, 'Graphical Representation of Rational Functions', 'Learn to graph rational functions and understand their visual characteristics including asymptotes, intercepts, and behavior patterns.', 75, 2),
(@topic_id, 'Analyzing Asymptotes and Intercepts', 'Deep dive into the analysis of asymptotes and intercepts, understanding their mathematical significance and graphical implications.', 90, 3),
(@topic_id, 'Real-World Applications of Rational Functions', 'Explore how rational functions model real-world phenomena in physics, economics, engineering, and everyday life applications.', 75, 4);

-- Insert a comprehensive quiz for the topic
INSERT INTO quizzes (topic_id, title, description, time_limit_minutes, total_questions, passing_score) VALUES
(@topic_id, 'Representations of Rational Functions Quiz', 'Test your understanding of rational function representations, asymptotes, intercepts, and real-world applications.', 30, 10, 70);

-- Get the quiz ID
SET @quiz_id = LAST_INSERT_ID();

-- Insert quiz questions
INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, order_index) VALUES
(@quiz_id, 'What is a rational function?', 'multiple_choice', 1, 1),
(@quiz_id, 'Which of the following is NOT a rational function?', 'multiple_choice', 1, 2),
(@quiz_id, 'What is the domain of f(x) = 1/(x-2)?', 'multiple_choice', 1, 3),
(@quiz_id, 'How do you find vertical asymptotes of a rational function?', 'multiple_choice', 1, 4),
(@quiz_id, 'What is the horizontal asymptote of f(x) = (2x+1)/(3x-2)?', 'multiple_choice', 1, 5),
(@quiz_id, 'Find the x-intercept of f(x) = (x²-1)/(x+2)', 'multiple_choice', 1, 6),
(@quiz_id, 'Which rational function has a vertical asymptote at x = 3?', 'multiple_choice', 1, 7),
(@quiz_id, 'What is the y-intercept of f(x) = (x+1)/(x-1)?', 'multiple_choice', 1, 8),
(@quiz_id, 'In the lens equation 1/f = 1/d₀ + 1/dᵢ, if f = 10 and d₀ = 15, what is dᵢ?', 'multiple_choice', 1, 9),
(@quiz_id, 'For resistors in parallel, if R₁ = 4Ω, R₂ = 6Ω, and R₃ = 12Ω, what is the total resistance?', 'multiple_choice', 1, 10);

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
(@q1_id, 'A function that can be expressed as the ratio of two polynomial functions', 1),
(@q1_id, 'A function that contains only rational numbers', 0),
(@q1_id, 'A function that is always continuous', 0),
(@q1_id, 'A function that has no asymptotes', 0);

-- Insert options for question 2
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q2_id, 'f(x) = (x+1)/(x-2)', 0),
(@q2_id, 'f(x) = √x', 1),
(@q2_id, 'f(x) = (x²-1)/(x+3)', 0),
(@q2_id, 'f(x) = 1/x', 0);

-- Insert options for question 3
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q3_id, 'All real numbers except x = 2', 1),
(@q3_id, 'All real numbers', 0),
(@q3_id, 'All real numbers except x = -2', 0),
(@q3_id, 'All real numbers except x = 0', 0);

-- Insert options for question 4
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q4_id, 'Set the denominator equal to zero and solve for x', 1),
(@q4_id, 'Set the numerator equal to zero and solve for x', 0),
(@q4_id, 'Find where the function equals zero', 0),
(@q4_id, 'Calculate the derivative and set it equal to zero', 0);

-- Insert options for question 5
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q5_id, 'y = 2/3', 1),
(@q5_id, 'y = 0', 0),
(@q5_id, 'y = 3/2', 0),
(@q5_id, 'No horizontal asymptote', 0);

-- Insert options for question 6
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q6_id, 'x = 1 and x = -1', 1),
(@q6_id, 'x = 0', 0),
(@q6_id, 'x = -2', 0),
(@q6_id, 'No x-intercepts', 0);

-- Insert options for question 7
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q7_id, 'f(x) = 1/(x-3)', 1),
(@q7_id, 'f(x) = 1/(x+3)', 0),
(@q7_id, 'f(x) = (x+3)/(x-1)', 0),
(@q7_id, 'f(x) = (x-3)/(x+1)', 0);

-- Insert options for question 8
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q8_id, 'y = -1', 1),
(@q8_id, 'y = 1', 0),
(@q8_id, 'y = 0', 0),
(@q8_id, 'No y-intercept', 0);

-- Insert options for question 9
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q9_id, 'dᵢ = 30 cm', 1),
(@q9_id, 'dᵢ = 25 cm', 0),
(@q9_id, 'dᵢ = 5 cm', 0),
(@q9_id, 'dᵢ = 6 cm', 0);

-- Insert options for question 10
INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES
(@q10_id, 'R_total = 2Ω', 1),
(@q10_id, 'R_total = 22Ω', 0),
(@q10_id, 'R_total = 7.33Ω', 0),
(@q10_id, 'R_total = 4Ω', 0);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_topics_order ON topics(order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_topic_order ON lessons(topic_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quizzes_topic ON quizzes(topic_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question ON quiz_question_options(question_id);

-- Insert sample badges for this topic
INSERT INTO badges (name, description, icon, criteria) VALUES
('Rational Function Master', 'Complete all lessons in Representations of Rational Functions', 'fas fa-chart-line', 'complete_topic'),
('Asymptote Analyzer', 'Score 90% or higher on the Representations of Rational Functions quiz', 'fas fa-search', 'quiz_score'),
('Real-World Solver', 'Complete all real-world application problems', 'fas fa-globe', 'complete_applications');

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
SELECT 'Representations of Rational Functions topic and lessons have been successfully added to the database!' as message;
