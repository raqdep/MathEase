-- MathEase: cleanup duplicate notifications
-- Keeps the newest row (highest id) for identical payloads per user.
-- Safe to run multiple times.

USE mathease_database3;

START TRANSACTION;

-- Optional visibility before cleanup
SELECT COUNT(*) AS total_notifications_before
FROM notifications;

SELECT COUNT(*) AS duplicate_rows_before
FROM notifications n
WHERE EXISTS (
    SELECT 1
    FROM notifications nx
    WHERE nx.user_id = n.user_id
      AND nx.type = n.type
      AND nx.title = n.title
      AND nx.message = n.message
      AND nx.id > n.id
);

-- Delete duplicates, keep only latest id in each identical group
DELETE n
FROM notifications n
JOIN notifications nx
  ON nx.user_id = n.user_id
 AND nx.type = n.type
 AND nx.title = n.title
 AND nx.message = n.message
 AND nx.id > n.id;

-- Optional visibility after cleanup
SELECT COUNT(*) AS total_notifications_after
FROM notifications;

SELECT COUNT(*) AS duplicate_rows_after
FROM notifications n
WHERE EXISTS (
    SELECT 1
    FROM notifications nx
    WHERE nx.user_id = n.user_id
      AND nx.type = n.type
      AND nx.title = n.title
      AND nx.message = n.message
      AND nx.id > n.id
);

COMMIT;

