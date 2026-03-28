<?php
/**
 * Canonical list of topics that have pages in topics/ folder.
 * Shared by topic-management.php and export-topic-ppt.php.
 */
function getCanonicalTopicsList() {
    return [
        ['slug' => 'functions', 'name' => 'Functions', 'order_index' => 1, 'description' => 'Introduction to functions, domain & range, operations, composition and inverses'],
        ['slug' => 'evaluating-functions', 'name' => 'Evaluating Functions', 'order_index' => 2, 'description' => 'Evaluate functions at given values and interpret notation'],
        ['slug' => 'operations-on-functions', 'name' => 'Operations on Functions', 'order_index' => 3, 'description' => 'Add, subtract, multiply, and divide functions'],
        ['slug' => 'solving-real-life-problems', 'name' => 'Solving Real-Life Problems', 'order_index' => 4, 'description' => 'Apply functions to real-world situations'],
        ['slug' => 'rational-functions', 'name' => 'Rational Functions', 'order_index' => 5, 'description' => 'Rational functions, graphing, and applications'],
        ['slug' => 'solving-rational-equations-inequalities', 'name' => 'Solving Rational Equations and Inequalities', 'order_index' => 6, 'description' => 'Solve rational equations and inequalities'],
        ['slug' => 'representations-of-rational-functions', 'name' => 'Representations of Rational Functions', 'order_index' => 7, 'description' => 'Represent rational functions in various forms'],
        ['slug' => 'domain-range-rational-functions', 'name' => 'Domain and Range of Rational Functions', 'order_index' => 8, 'description' => 'Domain and range of rational functions'],
        ['slug' => 'one-to-one-functions', 'name' => 'One-to-One Functions', 'order_index' => 9, 'description' => 'One-to-one functions and horizontal line test'],
        ['slug' => 'domain-range-inverse-functions', 'name' => 'Domain and Range of Inverse Functions', 'order_index' => 10, 'description' => 'Domain and range of inverse functions'],
        ['slug' => 'simple-interest', 'name' => 'Simple Interest', 'order_index' => 11, 'description' => 'Simple interest calculations'],
        ['slug' => 'compound-interest', 'name' => 'Compound Interest', 'order_index' => 12, 'description' => 'Compound interest and growth'],
        ['slug' => 'simple-and-compound-values', 'name' => 'Simple and Compound Values', 'order_index' => 13, 'description' => 'Future and present values for simple and compound interest'],
        ['slug' => 'solving-interest-problems', 'name' => 'Solving Interest Problems', 'order_index' => 14, 'description' => 'Solve real-life problems involving interest'],
    ];
}
