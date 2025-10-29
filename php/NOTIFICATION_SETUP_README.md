# MathEase Notification System Setup

## 🔔 Overview
The notification system provides real-time class-related alerts for teachers including:
- New student enrollment requests
- Quiz submissions
- Class performance updates
- Upcoming quiz deadlines
- System notifications

## 📋 Setup Instructions

### Step 1: Create Database Table
Run the SQL script to create the notifications table:

```sql
-- Open phpMyAdmin or MySQL console
-- Select the 'mathease' database
-- Execute the following file:
php/setup-notifications-table.sql
```

Or manually run this command:
```bash
mysql -u root -p mathease < php/setup-notifications-table.sql
```

### Step 2: Test the Notification System
1. Login to the teacher dashboard
2. Visit this URL to test notifications:
   ```
   http://localhost/MathEase/php/test-notifications.php
   ```
3. This will create sample notifications for your account

### Step 3: Verify It's Working
1. Look at the bell icon in the top right of the dashboard
2. You should see a red badge with a number
3. Click the bell to open the notification dropdown
4. You should see your test notifications

## 🎯 Features

### Notification Types
- **enrollment** - New student enrollment requests (Green)
- **quiz_submitted** - Students completed quizzes (Purple)
- **class_update** - General class updates (Blue)
- **deadline** - Quiz deadline reminders (Orange)
- **performance** - Class performance alerts (Indigo)
- **system** - System messages (Gray)

### Notification Functions
- ✅ Real-time badge counter
- ✅ Auto-refresh every 30 seconds
- ✅ Mark individual notifications as read
- ✅ Mark all notifications as read
- ✅ Relative time display (e.g., "5m ago", "2h ago")
- ✅ Class name tags for class-specific notifications
- ✅ Color-coded notification icons
- ✅ Dropdown panel with scrolling
- ✅ Click outside to close

## 🔧 Integration with Other Features

To automatically create notifications from other parts of the application, include the helper file:

```php
require_once 'php/create-notification.php';

// Example: When a student requests to join a class
notifyNewEnrollment($teacher_id, $class_id, $student_name, $class_name);

// Example: When a student submits a quiz
notifyQuizSubmission($teacher_id, $class_id, $student_name, $quiz_name, $class_name);

// Example: Custom notification
createTeacherNotification(
    $teacher_id,
    'class_update',
    'Your Custom Title',
    'Your custom message here',
    $class_id // optional
);
```

## 📊 Database Schema

```sql
teacher_notifications (
    id              INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id      INT NOT NULL,
    class_id        INT NULL,
    type            VARCHAR(50),
    title           VARCHAR(255),
    message         TEXT,
    is_read         TINYINT(1) DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at         TIMESTAMP NULL
)
```

## 🔍 Troubleshooting

### No notifications appearing?
1. Check if the table exists:
   ```sql
   SHOW TABLES LIKE 'teacher_notifications';
   ```
2. Run the test script: `php/test-notifications.php`
3. Check browser console for JavaScript errors (F12)

### Badge not showing?
- The badge only appears when there are unread notifications
- Check database: `SELECT * FROM teacher_notifications WHERE teacher_id = YOUR_ID AND is_read = 0`

### Notifications not auto-refreshing?
- Check if the interval is set (line 2894 in teacher-dashboard.html)
- Verify the fetch request is working in browser Network tab

## 🎨 Customization

### Change refresh interval
Edit line 2894 in `teacher-dashboard.html`:
```javascript
// Change from 30 seconds to 60 seconds
notificationCheckInterval = setInterval(loadNotifications, 60000);
```

### Add new notification type
1. Add icon in `getNotificationIcon()` function
2. Add background color in `getNotificationIconBg()` function
3. Create helper function in `create-notification.php`

## ✨ Usage Tips

1. **For Students Joining Classes**: Automatically create notification in enrollment approval script
2. **For Quiz Submissions**: Trigger notification after quiz is submitted
3. **For Performance Updates**: Schedule a cron job to check performance weekly
4. **For Deadlines**: Create a script that checks upcoming deadlines daily

## 🚀 Next Steps

- Integrate with enrollment approval system
- Add email notifications for critical alerts
- Create notification preferences page
- Add push notifications for mobile
- Create notification history page
