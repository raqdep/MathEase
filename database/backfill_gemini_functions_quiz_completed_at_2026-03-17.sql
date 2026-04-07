-- =============================================================================
-- Backfill completion timestamps for Functions quiz (quiz_type = 'functions')
-- for students enrolled in a class whose name or code contains GEMINI.
--
-- Target date/time for completed_at (and aligned fields): 2026-03-17 12:00:00
--
-- BEFORE RUNNING:
--   1. Review the PREVIEW queries below (uncomment and run in your SQL client).
--   2. If your section is not matched by '%GEMINI%', edit the class filter
--      in each UPDATE to match class_name / class_code (or join users by email).
--
-- Run on: MySQL / MariaDB (MathEase production or local)
-- =============================================================================

SET @gemini_completed := '2026-03-17 12:00:00';

-- -----------------------------------------------------------------------------
-- PREVIEW (run manually; do not execute as part of batch if you use a GUI
-- that runs the whole file — comment these out before UPDATEs or split runs)
-- -----------------------------------------------------------------------------

-- Classes that match GEMINI:
-- SELECT id, class_name, class_code, teacher_id FROM classes
-- WHERE UPPER(class_name) LIKE '%GEMINI%' OR UPPER(IFNULL(class_code, '')) LIKE '%GEMINI%';

-- Students (approved) in those classes:
-- SELECT DISTINCT u.id, u.first_name, u.last_name, u.email, c.class_name
-- FROM class_enrollments ce
-- JOIN users u ON u.id = ce.student_id
-- JOIN classes c ON c.id = ce.class_id
-- WHERE ce.enrollment_status = 'approved'
--   AND (UPPER(c.class_name) LIKE '%GEMINI%' OR UPPER(IFNULL(c.class_code, '')) LIKE '%GEMINI%');

-- quiz_attempts rows that WILL be updated:
-- SELECT qa.id, qa.student_id, qa.quiz_type, qa.status, qa.completed_at AS old_completed_at
-- FROM quiz_attempts qa
-- INNER JOIN (
--     SELECT DISTINCT ce.student_id
--     FROM class_enrollments ce
--     INNER JOIN classes c ON c.id = ce.class_id
--     WHERE ce.enrollment_status = 'approved'
--       AND (UPPER(c.class_name) LIKE '%GEMINI%' OR UPPER(IFNULL(c.class_code, '')) LIKE '%GEMINI%')
-- ) gem ON gem.student_id = qa.student_id
-- WHERE qa.quiz_type = 'functions'
--   AND qa.status = 'completed';

START TRANSACTION;

-- 1) Main: quiz attempt completion time (Functions quiz only, completed attempts)
UPDATE quiz_attempts qa
INNER JOIN (
    SELECT DISTINCT ce.student_id
    FROM class_enrollments ce
    INNER JOIN classes c ON c.id = ce.class_id
    WHERE ce.enrollment_status = 'approved'
      AND (UPPER(c.class_name) LIKE '%GEMINI%' OR UPPER(IFNULL(c.class_code, '')) LIKE '%GEMINI%')
) gem ON gem.student_id = qa.student_id
SET qa.completed_at = @gemini_completed,
    qa.updated_at   = @gemini_completed
WHERE qa.quiz_type = 'functions'
  AND qa.status = 'completed';

-- 2) Per-question rows: keep answers aligned with the attempt date (optional but consistent)
UPDATE quiz_answers ans
INNER JOIN quiz_attempts qa ON qa.id = ans.attempt_id
INNER JOIN (
    SELECT DISTINCT ce.student_id
    FROM class_enrollments ce
    INNER JOIN classes c ON c.id = ce.class_id
    WHERE ce.enrollment_status = 'approved'
      AND (UPPER(c.class_name) LIKE '%GEMINI%' OR UPPER(IFNULL(c.class_code, '')) LIKE '%GEMINI%')
) gem ON gem.student_id = qa.student_id
SET ans.answered_at = @gemini_completed
WHERE qa.quiz_type = 'functions'
  AND qa.status = 'completed';

-- 3) Independent performance tracking: last attempt column for Functions quiz (GEMINI class rows only)
UPDATE student_performance_tracking spt
INNER JOIN classes c ON c.id = spt.class_id
SET spt.functions_quiz_last_attempt = @gemini_completed,
    spt.updated_at = @gemini_completed
WHERE (UPPER(c.class_name) LIKE '%GEMINI%' OR UPPER(IFNULL(c.class_code, '')) LIKE '%GEMINI%')
  AND (COALESCE(spt.functions_quiz_attempts, 0) > 0 OR COALESCE(spt.functions_quiz_best_score, 0) > 0);

COMMIT;

-- =============================================================================
-- If anything looks wrong after preview, use ROLLBACK instead of COMMIT
-- (comment out COMMIT above and run: ROLLBACK;)
-- =============================================================================
