-- Migration: Add Solving Rational Equations and Inequalities Topic
-- File: solving_rational_equations_inequalities_migration.sql
-- Description: Adds the new topic "Solving Rational Equations and Inequalities" to the MathEase database
-- Date: 2024

USE mathease_db;

-- Insert the new topic: Solving Rational Equations and Inequalities
INSERT INTO topics (name, description, difficulty_level, order_index) VALUES
('Solving Rational Equations and Inequalities', 'Master the art of solving rational equations and inequalities through comprehensive lessons designed for Grade 11 students. Learn systematic methods, identify extraneous solutions, use sign analysis, and apply to real-world problems.', 'intermediate', 7);

-- Get the topic ID for the newly inserted topic
SET @topic_id = LAST_INSERT_ID();

-- Insert lessons for the new topic
INSERT INTO lessons (topic_id, title, content, duration_minutes, order_index) VALUES
(@topic_id, 'Solving Rational Equations', 'Learn systematic methods to solve rational equations and identify extraneous solutions. Master the process of finding LCD, clearing fractions, solving polynomial equations, and checking solutions.', 60, 1),
(@topic_id, 'Solving Rational Inequalities', 'Master the art of solving rational inequalities using sign analysis and number line methods. Learn to find critical points, test intervals, and express solutions in interval notation.', 60, 2),
(@topic_id, 'Graphical Solutions', 'Visualize solutions to rational equations and inequalities using graphical methods. Learn to graph rational functions, find intersections, and interpret graphical solutions.', 45, 3),
(@topic_id, 'Real-World Applications', 'Apply rational equations and inequalities to solve practical problems in various fields including physics, chemistry, economics, engineering, medicine, and biology.', 50, 4);

-- Insert quiz for the new topic
INSERT INTO quizzes (topic_id, title, description, difficulty_level, time_limit_minutes, passing_score) VALUES
(@topic_id, 'Rational Equations and Inequalities Quiz', 'Test your understanding of solving rational equations and inequalities, including extraneous solutions, sign analysis, and real-world applications', 'intermediate', 30, 75);

-- Get the quiz ID for the newly inserted quiz
SET @quiz_id = LAST_INSERT_ID();

-- Insert quiz questions for the new topic
INSERT INTO quiz_questions (quiz_id, question_text, question_type, correct_answer, explanation, points, order_index) VALUES
(@quiz_id, 'What is the first step in solving a rational equation?', 'multiple_choice', 'Find the LCD (Least Common Denominator)', 'The first step in solving rational equations is to find the LCD of all fractions in the equation.', 1, 1),
(@quiz_id, 'What are extraneous solutions?', 'multiple_choice', 'Solutions that appear to work but don\'t satisfy the original equation', 'Extraneous solutions are solutions that result from the solving process but don\'t actually satisfy the original equation.', 1, 2),
(@quiz_id, 'In solving rational inequalities, what are critical points?', 'multiple_choice', 'Points where the numerator equals zero or the denominator equals zero', 'Critical points divide the number line into intervals and are found by setting the numerator and denominator equal to zero.', 1, 3),
(@quiz_id, 'What method is used to solve rational inequalities?', 'multiple_choice', 'Sign analysis', 'Sign analysis involves testing intervals between critical points to determine where the inequality is true.', 1, 4),
(@quiz_id, 'When solving 1/x + 1/(x+2) = 5/12, what is the LCD?', 'multiple_choice', 'x(x+2)', 'The LCD is the product of all distinct factors in the denominators: x and (x+2).', 1, 5),
(@quiz_id, 'For the inequality (x-1)/(x+2) ≥ 0, what are the critical points?', 'multiple_choice', 'x = 1 and x = -2', 'Critical points are where numerator = 0 (x = 1) and denominator = 0 (x = -2).', 1, 6),
(@quiz_id, 'What does the solution (-∞, -2) ∪ [1, ∞) represent?', 'multiple_choice', 'All real numbers less than -2 or greater than or equal to 1', 'This interval notation represents the union of two intervals: all numbers less than -2 and all numbers greater than or equal to 1.', 1, 7),
(@quiz_id, 'In a work rate problem, if Pipe A fills a tank in 6 hours and Pipe B fills it in 4 hours, how long do they take together?', 'multiple_choice', '2.4 hours', 'Using the formula 1/t = 1/6 + 1/4, we get t = 2.4 hours.', 1, 8);

-- Insert options for multiple choice questions
INSERT INTO quiz_question_options (question_id, option_text, is_correct, order_index) VALUES
-- Question 1 options
(LAST_INSERT_ID() - 7, 'Find the LCD (Least Common Denominator)', TRUE, 1),
(LAST_INSERT_ID() - 7, 'Multiply both sides by x', FALSE, 2),
(LAST_INSERT_ID() - 7, 'Add the fractions', FALSE, 3),
(LAST_INSERT_ID() - 7, 'Factor the denominators', FALSE, 4),

-- Question 2 options
(LAST_INSERT_ID() - 6, 'Solutions that appear to work but don\'t satisfy the original equation', TRUE, 1),
(LAST_INSERT_ID() - 6, 'Solutions that are always correct', FALSE, 2),
(LAST_INSERT_ID() - 6, 'Solutions that are complex numbers', FALSE, 3),
(LAST_INSERT_ID() - 6, 'Solutions that are fractions', FALSE, 4),

-- Question 3 options
(LAST_INSERT_ID() - 5, 'Points where the numerator equals zero or the denominator equals zero', TRUE, 1),
(LAST_INSERT_ID() - 5, 'Points where the function is undefined', FALSE, 2),
(LAST_INSERT_ID() - 5, 'Points where the function equals one', FALSE, 3),
(LAST_INSERT_ID() - 5, 'Points where the function is positive', FALSE, 4),

-- Question 4 options
(LAST_INSERT_ID() - 4, 'Sign analysis', TRUE, 1),
(LAST_INSERT_ID() - 4, 'Graphing', FALSE, 2),
(LAST_INSERT_ID() - 4, 'Substitution', FALSE, 3),
(LAST_INSERT_ID() - 4, 'Factoring', FALSE, 4),

-- Question 5 options
(LAST_INSERT_ID() - 3, 'x(x+2)', TRUE, 1),
(LAST_INSERT_ID() - 3, 'x + 2', FALSE, 2),
(LAST_INSERT_ID() - 3, 'x² + 2x', FALSE, 3),
(LAST_INSERT_ID() - 3, '12', FALSE, 4),

-- Question 6 options
(LAST_INSERT_ID() - 2, 'x = 1 and x = -2', TRUE, 1),
(LAST_INSERT_ID() - 2, 'x = -1 and x = 2', FALSE, 2),
(LAST_INSERT_ID() - 2, 'x = 0 and x = -2', FALSE, 3),
(LAST_INSERT_ID() - 2, 'x = 1 and x = 2', FALSE, 4),

-- Question 7 options
(LAST_INSERT_ID() - 1, 'All real numbers less than -2 or greater than or equal to 1', TRUE, 1),
(LAST_INSERT_ID() - 1, 'All real numbers between -2 and 1', FALSE, 2),
(LAST_INSERT_ID() - 1, 'Only the numbers -2 and 1', FALSE, 3),
(LAST_INSERT_ID() - 1, 'All real numbers greater than -2', FALSE, 4),

-- Question 8 options
(LAST_INSERT_ID(), '2.4 hours', TRUE, 1),
(LAST_INSERT_ID(), '5 hours', FALSE, 2),
(LAST_INSERT_ID(), '10 hours', FALSE, 3),
(LAST_INSERT_ID(), '1.5 hours', FALSE, 4);

-- Create indexes for better performance on the new topic
CREATE INDEX idx_topics_solving_rational ON topics(name);
CREATE INDEX idx_lessons_solving_rational ON lessons(topic_id, order_index);
CREATE INDEX idx_quizzes_solving_rational ON quizzes(topic_id, difficulty_level);

-- Update the topic statistics view to include the new topic
-- (The view will automatically include the new topic due to the LEFT JOIN)

-- Verify the migration
SELECT 'Migration completed successfully' as status;
SELECT COUNT(*) as topics_count FROM topics WHERE name = 'Solving Rational Equations and Inequalities';
SELECT COUNT(*) as lessons_count FROM lessons WHERE topic_id = @topic_id;
SELECT COUNT(*) as quiz_questions_count FROM quiz_questions WHERE quiz_id = @quiz_id;
