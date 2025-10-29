<?php
require_once 'php/config.php';

echo "=== Gmail Account Verification ===\n";
echo "Current Configuration:\n";
echo "Username: " . MAIL_USERNAME . "\n";
echo "Password Length: " . strlen(MAIL_PASSWORD) . " characters\n";
echo "Password Preview: " . substr(MAIL_PASSWORD, 0, 4) . "..." . substr(MAIL_PASSWORD, -4) . "\n\n";

echo "=== Gmail Account Checklist ===\n";
echo "Please verify the following for matheasenc@gmail.com:\n\n";

echo "1. ✅ 2-Factor Authentication Enabled?\n";
echo "   Go to: https://myaccount.google.com/security\n";
echo "   Check: 2-Step Verification is ON\n\n";

echo "2. ✅ App Password Generated?\n";
echo "   Go to: https://myaccount.google.com/apppasswords\n";
echo "   Check: There's an App Password for 'Mail' or 'MathEase'\n\n";

echo "3. ✅ App Password Format?\n";
echo "   Should be: 16 characters, no spaces\n";
echo "   Example: abcd efgh ijkl mnop (but without spaces)\n\n";

echo "4. ✅ Account Security?\n";
echo "   Check: No security alerts or restrictions\n";
echo "   Check: Account is not suspended or restricted\n\n";

echo "=== Quick Fix Steps ===\n";
echo "1. Go to https://myaccount.google.com/apppasswords\n";
echo "2. Delete any existing 'MathEase' or 'Mail' app passwords\n";
echo "3. Generate a NEW App Password:\n";
echo "   - Select 'Mail'\n";
echo "   - Select 'Other (custom name)'\n";
echo "   - Enter 'MathEase'\n";
echo "   - Click 'Generate'\n";
echo "4. Copy the 16-character password (no spaces)\n";
echo "5. Update php/config.php with the new password\n\n";

echo "=== Test After Fix ===\n";
echo "Run: php test-ssl-smtp.php\n";
echo "Expected: AUTH LOGIN response should be '334' not '250-SIZE'\n\n";

echo "=== Alternative Solutions ===\n";
echo "If Gmail still doesn't work:\n";
echo "1. Try a different Gmail account\n";
echo "2. Use PHP mail() function: php test-mail.php\n";
echo "3. Use email service provider (SendGrid, Mailgun)\n";
echo "4. Continue using file-based emails: email-viewer.php\n";
?>
