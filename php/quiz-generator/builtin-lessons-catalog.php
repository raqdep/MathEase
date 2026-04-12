<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/builtin-lesson-catalog-data.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    quiz_gen_json(['success' => false, 'message' => 'Method not allowed'], 405);
}

quiz_gen_require_teacher();

$out = [];
foreach (quiz_gen_builtin_modules() as $slug => $cfg) {
    $out[] = [
        'slug' => $slug,
        'lessonTitle' => $cfg['lessonTitle'],
        'topics' => $cfg['topics'],
    ];
}

quiz_gen_json(['success' => true, 'modules' => $out]);
