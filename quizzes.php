<?php
// Wrapper page: renders quizzes.html but uses shared nav partial.
$activePage = 'quizzes';
$html = @file_get_contents(__DIR__ . '/quizzes.html');
if ($html === false) {
    http_response_code(500);
    echo 'Missing quizzes.html';
    exit;
}

ob_start();
include __DIR__ . '/php/partials/student-nav.php';
$nav = ob_get_clean();

$html = preg_replace('/<!--\s*Navigation\s*-->[\s\S]*?<\/nav>/i', $nav, $html, 1);

$html = str_replace(
    ['dashboard.html#', 'dashboard.html', 'quizzes.html', 'flashcards.html', 'achievements.html', 'profile.html'],
    ['dashboard.php#', 'dashboard.php', 'quizzes.php', 'flashcards.php', 'achievements.php', 'profile.php'],
    $html
);
echo $html;
?>

