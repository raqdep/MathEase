-- Retired badge rows: were awarded on any quiz via generic score% >= criteria_value.
-- App now awards only Real-Life Problems Expert (60%+) and Champion (100%) on real-life-problems quiz.
UPDATE badges SET is_active = 0
WHERE name IN ('Real-Life Problems Solver', 'Real-Life Problems Master');

-- Optional: ensure Expert tier exists (badges.name has no UNIQUE constraint — use conditional insert)
INSERT INTO badges (name, description, icon_url, criteria_type, criteria_value, is_active)
SELECT 'Real-Life Problems Expert', 'Score 60% or higher on the Solving Real-Life Problems quiz', 'fas fa-globe', 'score', 60, 1
FROM (SELECT 1 AS _) AS dummy
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'Real-Life Problems Expert' LIMIT 1);
