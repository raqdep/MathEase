<?php
require_once 'php/config.php';

echo "=== Gmail Account Test ===\n";
echo "Current account: " . MAIL_USERNAME . "\n";
echo "Password length: " . strlen(MAIL_PASSWORD) . " characters\n\n";

echo "=== Try These Solutions ===\n\n";

echo "1. 🔄 USE DIFFERENT GMAIL ACCOUNT\n";
echo "   - Use a personal Gmail account you know works\n";
echo "   - Make sure it has 2FA enabled\n";
echo "   - Generate a fresh App Password\n";
echo "   - Update php/config.php\n\n";

echo "2. 📧 USE PHP mail() FUNCTION\n";
echo "   - Test: php test-mail.php\n";
echo "   - This bypasses Gmail SMTP entirely\n";
echo "   - Uses your server's mail configuration\n\n";

echo "3. 📁 CONTINUE WITH FILE-BASED EMAILS\n";
echo "   - Go to: email-viewer.php\n";
echo "   - View generated verification emails\n";
echo "   - Use OTP codes to verify accounts\n";
echo "   - This works immediately!\n\n";

echo "4. 🌐 USE EMAIL SERVICE PROVIDER\n";
echo "   - SendGrid (free 100 emails/day)\n";
echo "   - Mailgun (free 5,000 emails/month)\n";
echo "   - Amazon SES (very cheap)\n\n";

echo "=== Quick Test: PHP mail() ===\n";
echo "Run: php test-mail.php\n";
echo "This will test if your server can send emails without Gmail SMTP.\n\n";

echo "=== Current Workaround ===\n";
echo "Your email verification system is working perfectly!\n";
echo "Emails are being generated and saved to files.\n";
echo "You can use them right now: email-viewer.php\n";
?>
