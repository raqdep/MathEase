-- Database Migration: Add Real-Life Problems Quiz Badges
-- This migration adds badges for the Solving Real-Life Problems quiz

-- Insert badges for Real-Life Problems quiz
INSERT INTO badges (name, description, icon_url, criteria_type, criteria_value, is_active) VALUES
('Real-Life Problems Solver', 'Score 50% or higher on the Solving Real-Life Problems quiz', 'fas fa-globe', 'score', 50, 1),
('Real-Life Problems Master', 'Master real-life problem solving with 80%+ score', 'fas fa-target', 'score', 80, 1),
('Real-Life Problems Champion', 'Excel in real-life problem solving with 90%+ score', 'fas fa-trophy', 'score', 90, 1);

-- Display success message
SELECT 'Real-Life Problems quiz badges have been successfully added to the database!' as message;
