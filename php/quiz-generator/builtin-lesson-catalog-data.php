<?php

declare(strict_types=1);

/**
 * Built-in MathEase lesson modules — mirrors js/flashcards-sequential.js topicLessonConfig
 * (Lesson dropdown + Topic dropdown). File names match php/flashcards.php getAllowedTopics.
 *
 * @return array<string, array{lessonTitle: string, file: string, topics: list<string>}>
 */
function quiz_gen_builtin_modules(): array
{
    return [
        'functions' => [
            'lessonTitle' => 'Functions',
            'file' => 'functions.html',
            'topics' => [
                'Introduction to Functions',
                'Domain and Range',
                'Function Operations',
                'Function Composition & Inverses',
            ],
        ],
        'evaluating-functions' => [
            'lessonTitle' => 'Evaluating Functions',
            'file' => 'evaluating-functions.html',
            'topics' => [
                'Introduction to Function Evaluation',
                'Types of Functions',
                'The Evaluation Process',
                'How to Solve Function Evaluation Problems',
            ],
        ],
        'operations-on-functions' => [
            'lessonTitle' => 'Operations on Functions',
            'file' => 'operations-on-functions.html',
            'topics' => [
                'Addition & Subtraction',
                'Multiplication',
                'Division',
                'Composition',
                'Applications',
            ],
        ],
        'solving-real-life-problems' => [
            'lessonTitle' => 'Solving Real-Life Problems',
            'file' => 'solving-real-life-problems.html',
            'topics' => [
                'Real-World Models',
                'Business & Econ',
                'Sci & Tech',
                'Complex Solving',
            ],
        ],
        'rational-functions' => [
            'lessonTitle' => 'Rational Functions',
            'file' => 'rational-functions.html',
            'topics' => [
                'Rational Functions',
                'Graphs & Asymptotes',
                'Rational Equations',
                'Rational Inequalities',
            ],
        ],
        'solving-rational-equations-inequalities' => [
            'lessonTitle' => 'Solving Rational Equations and Inequalities',
            'file' => 'solving-rational-equations-inequalities.html',
            'topics' => [
                'Solving Rational Equations',
                'Solving Rational Inequalities',
                'Graphical Solutions',
                'Real-World Applications',
            ],
        ],
        'representations-of-rational-functions' => [
            'lessonTitle' => 'Representations of Rational Functions',
            'file' => 'representations-of-rational-functions.html',
            'topics' => [
                'Understanding Rational Functions',
                'Graphical Representation of Rational Functions',
                'Analyzing Asymptotes and Intercepts',
                'Real-World Applications of Rational Functions',
            ],
        ],
        'domain-range-rational-functions' => [
            'lessonTitle' => 'Domain and Range of Rational Functions',
            'file' => 'domain-range-rational-functions.html',
            'topics' => [
                'Understanding Domain',
                'Understanding Range',
                'Finding Domain & Range',
                'Applications & Problem Solving',
            ],
        ],
        'one-to-one-functions' => [
            'lessonTitle' => 'One-to-One Functions',
            'file' => 'one-to-one-functions.html',
            'topics' => [
                'Understanding One-to-One Functions',
                'Testing for One-to-One',
                'Inverse Functions',
                'Applications & Problem Solving',
            ],
        ],
        'domain-range-inverse-functions' => [
            'lessonTitle' => 'Domain and Range of Inverse Functions',
            'file' => 'domain-range-inverse-functions.html',
            'topics' => [
                'Understanding Inverse Functions',
                'Finding Domain of Inverse Functions',
                'Finding Range of Inverse Functions',
                'Applications & Problem Solving',
            ],
        ],
        'simple-interest' => [
            'lessonTitle' => 'Simple Interest',
            'file' => 'simple-interest.html',
            'topics' => [
                'Introduction to Simple Interest',
                'Using I = P × R × T',
                'Solving for Unknowns',
                'Real-World Applications',
            ],
        ],
        'compound-interest' => [
            'lessonTitle' => 'Compound Interest',
            'file' => 'compound-interest.html',
            'topics' => [
                'Introduction to Compound Interest',
                'Compound Interest Formula',
                'Compounding Frequencies',
                'Present Value and Future Value',
                'Advanced Applications',
            ],
        ],
        'simple-and-compound-values' => [
            'lessonTitle' => 'Interest, Maturity, Future, and Present Values',
            'file' => 'simple-and-compound-values.html',
            'topics' => [
                'Context and Motivation',
                'Simple Interest (Is = Prt)',
                'Activities on Simple Interest',
                'Compound Interest & Time Value',
                'Activities & Decision-Making',
            ],
        ],
        'solving-interest-problems' => [
            'lessonTitle' => 'Solving Problems: Simple and Compound Interest',
            'file' => 'solving-interest-problems.html',
            'topics' => [
                'Introduction & DepEd MELCs',
                'Simple Interest Problem Solver',
                'Present and Maturity Value (Simple)',
                'Compound Interest Problem Solver',
                'Applications & Proposal',
            ],
        ],
    ];
}
