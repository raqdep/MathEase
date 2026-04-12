<?php

declare(strict_types=1);

/**
 * Load before config so PHP notices/warnings cannot be echoed ahead of JSON.
 * Errors still go to the server log per php.ini.
 */
if (!ob_get_level()) {
    ob_start();
}
ini_set('display_errors', '0');

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/common.php';
require_once __DIR__ . '/schema.php';
