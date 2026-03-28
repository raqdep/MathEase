<?php
/**
 * Load Environment Variables from .env file
 * This file should be included at the top of config.php
 */

function loadEnv($path) {
    if (!file_exists($path)) {
        return false;
    }
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        // Parse KEY=VALUE
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            
            // Remove quotes if present
            if ((substr($value, 0, 1) === '"' && substr($value, -1) === '"') ||
                (substr($value, 0, 1) === "'" && substr($value, -1) === "'")) {
                $value = substr($value, 1, -1);
            }
            
            // Set from file when missing OR empty (system may define GROQ_* as blank and block real keys)
            $existing = getenv($key);
            $isEmpty = ($existing === false || $existing === null || (is_string($existing) && trim($existing) === ''));
            if ($isEmpty && $value !== '') {
                putenv("{$key}={$value}");
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
            }
        }
    }
    
    return true;
}

// Load .env file from project root
$envPath = __DIR__ . '/../.env';
loadEnv($envPath);
