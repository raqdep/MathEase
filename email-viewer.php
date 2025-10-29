<?php
require_once 'php/config.php';

// Email viewer tool
$emailsDir = __DIR__ . '/emails/';
$emailFiles = [];

if (is_dir($emailsDir)) {
    $files = scandir($emailsDir);
    foreach ($files as $file) {
        if (pathinfo($file, PATHINFO_EXTENSION) === 'txt') {
            $filePath = $emailsDir . $file;
            $emailFiles[] = [
                'filename' => $file,
                'path' => $filePath,
                'modified' => filemtime($filePath),
                'size' => filesize($filePath)
            ];
        }
    }
    
    // Sort by modification time (newest first)
    usort($emailFiles, function($a, $b) {
        return $b['modified'] - $a['modified'];
    });
}

// Handle email viewing
if (isset($_GET['view']) && isset($_GET['file'])) {
    $filename = sanitize_input($_GET['file']);
    $filePath = $emailsDir . $filename;
    
    if (file_exists($filePath) && pathinfo($filename, PATHINFO_EXTENSION) === 'txt') {
        $content = file_get_contents($filePath);
        
        // Extract email parts
        $lines = explode("\n", $content);
        $to = '';
        $subject = '';
        $body = '';
        $inBody = false;
        
        foreach ($lines as $line) {
            if (strpos($line, 'To: ') === 0) {
                $to = substr($line, 4);
            } elseif (strpos($line, 'Subject: ') === 0) {
                $subject = substr($line, 9);
            } elseif (strpos($line, 'Content-Type: text/html') !== false) {
                $inBody = true;
                continue;
            } elseif ($inBody && $line !== '---') {
                $body .= $line . "\n";
            }
        }
        
        // Display the email
        echo '<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Viewer - MathEase</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .email-header { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                .email-body { border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
                .back-btn { background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="email-viewer.php" class="back-btn">← Back to Email List</a>
                <div class="email-header">
                    <h3>Email Details</h3>
                    <p><strong>To:</strong> ' . htmlspecialchars($to) . '</p>
                    <p><strong>Subject:</strong> ' . htmlspecialchars($subject) . '</p>
                    <p><strong>File:</strong> ' . htmlspecialchars($filename) . '</p>
                    <p><strong>Generated:</strong> ' . date('Y-m-d H:i:s', filemtime($filePath)) . '</p>
                </div>
                <div class="email-body">
                    ' . $body . '
                </div>
            </div>
        </body>
        </html>';
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Viewer - MathEase</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .email-list { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .email-item { padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .email-item:hover { background-color: #f8f9fa; }
        .email-item:last-child { border-bottom: none; }
        .email-info h4 { margin: 0 0 5px 0; color: #333; }
        .email-info p { margin: 0; color: #666; font-size: 14px; }
        .email-actions { display: flex; gap: 10px; }
        .btn { padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px; }
        .btn-primary { background: #667eea; color: white; }
        .btn-danger { background: #e74c3c; color: white; }
        .no-emails { padding: 40px; text-align: center; color: #666; }
        .status { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 MathEase Email Viewer</h1>
            <p>View verification emails that were generated but not sent via SMTP</p>
        </div>

        <div class="status">
            <h3>⚠️ Email Delivery Status</h3>
            <p><strong>SMTP Status:</strong> Not working (emails saved to files)</p>
            <p><strong>Fallback:</strong> Emails are being saved to the <code>emails/</code> directory</p>
            <p><strong>Action:</strong> You can view and manually send these emails, or fix the SMTP configuration</p>
        </div>

        <?php if (empty($emailFiles)): ?>
            <div class="email-list">
                <div class="no-emails">
                    <h3>No emails found</h3>
                    <p>No verification emails have been generated yet.</p>
                    <p><a href="register.html">Try registering a new account</a></p>
                </div>
            </div>
        <?php else: ?>
            <div class="email-list">
                <?php foreach ($emailFiles as $email): ?>
                    <div class="email-item">
                        <div class="email-info">
                            <h4><?php echo htmlspecialchars($email['filename']); ?></h4>
                            <p>Generated: <?php echo date('Y-m-d H:i:s', $email['modified']); ?> | Size: <?php echo number_format($email['size']); ?> bytes</p>
                        </div>
                        <div class="email-actions">
                            <a href="?view=1&file=<?php echo urlencode($email['filename']); ?>" class="btn btn-primary">View Email</a>
                            <a href="?delete=1&file=<?php echo urlencode($email['filename']); ?>" class="btn btn-danger" onclick="return confirm('Delete this email?')">Delete</a>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <div style="margin-top: 20px; text-align: center;">
            <a href="test-email.php" class="btn btn-primary">Test Email System</a>
            <a href="register.html" class="btn btn-primary">Register New Account</a>
        </div>
    </div>
</body>
</html>
