-- Database Migration: Add Functions 50% Badge
-- This migration adds a new badge for scoring 50% or higher on the functions quiz

-- Insert the new badge for Functions 50% score
INSERT INTO badges (name, description, icon_url, criteria_type, criteria_value, is_active) VALUES
('Functions Achiever', 'Score 50% or higher on the Functions quiz', 'fas fa-star', 'score', 50, 1);

-- Display success message
SELECT 'Functions 50% badge has been successfully added to the database!' as message;
