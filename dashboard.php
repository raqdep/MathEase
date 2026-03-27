<?php
// Wrapper page: renders dashboard.html but uses shared nav partial.
$activePage = 'dashboard';
$html = @file_get_contents(__DIR__ . '/dashboard.html');
if ($html === false) {
    http_response_code(500);
    echo 'Missing dashboard.html';
    exit;
}

ob_start();
include __DIR__ . '/php/partials/student-nav.php';
$nav = ob_get_clean();

// Replace everything from "<!-- Navigation -->" through the next "</nav>"
$html = preg_replace('/<!--\s*Navigation\s*-->[\s\S]*?<\/nav>/i', $nav, $html, 1);

// Prefer PHP routes for shared navigation
$html = str_replace(
    ['dashboard.html#', 'dashboard.html', 'quizzes.html', 'flashcards.html', 'achievements.html', 'profile.html'],
    ['dashboard.php#', 'dashboard.php', 'quizzes.php', 'flashcards.php', 'achievements.php', 'profile.php'],
    $html
);

echo $html;
?>

