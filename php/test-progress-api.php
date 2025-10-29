<?php
// Simple test to verify the get-progress.php API works
echo "<h2>Progress API Test</h2>\n";

// Test the API endpoint
$apiUrl = 'http://localhost/MathEase/php/get-progress.php';

echo "<p>Testing API endpoint: <a href='{$apiUrl}' target='_blank'>{$apiUrl}</a></p>\n";

// Try to make a request to the API
$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => 'Content-Type: application/json',
        'timeout' => 10
    ]
]);

echo "<h3>API Response:</h3>\n";
echo "<div style='background: #f5f5f5; padding: 10px; border-radius: 5px; font-family: monospace;'>\n";

try {
    $response = file_get_contents($apiUrl, false, $context);
    if ($response === false) {
        echo "❌ Failed to get response from API\n";
    } else {
        echo htmlspecialchars($response);
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "</div>\n";

echo "<h3>Instructions:</h3>\n";
echo "<ol>\n";
echo "<li>Make sure you're logged in to the MathEase system</li>\n";
echo "<li>Complete some lessons in the Functions topic</li>\n";
echo "<li>Go to the dashboard to see if progress is updated</li>\n";
echo "<li>If progress still doesn't show, check the browser console for errors</li>\n";
echo "</ol>\n";

echo "<hr>";
echo "<p><a href='../dashboard.html'>← Back to Dashboard</a></p>";
echo "<p><a href='../topics/functions.html'>📚 Go to Functions Topic</a></p>";
?>
