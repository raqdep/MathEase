# MathEase - Gemini AI Learning Assistant

## 🎯 Overview
This feature integrates **Google Gemini AI** to provide personalized learning recommendations for students after completing lessons. The AI analyzes:
- Lesson completion times
- Quiz performance (scores, attempts, time taken)
- Study patterns and time distribution
- Learning behavior patterns

Based on this data, Gemini provides:
- **Weak Areas**: Topics that need improvement
- **Strengths**: Areas where the student excels
- **Personalized Recommendations**: Specific action steps to improve
- **Learning Pattern Analysis**: Insights on study habits
- **Next Steps**: What to focus on next

---

## 📋 Setup Instructions

### **Step 1: Get Your Gemini API Key (FREE)**

1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the API key (starts with `AIzaSy...`)

**FREE Tier Limits** (More than enough for educational use):
- **Gemini 1.5 Flash**: 15 requests/minute, 1 million requests/day
- **Gemini 1.5 Pro**: 2 requests/minute, 50 requests/day
- **No credit card required!**

---

### **Step 2: Configure the API Key**

Open `php/gemini-ai-assistant.php` and replace the placeholder:

```php
// Line 9: Replace with your actual API key
$GEMINI_API_KEY = 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX'; // Paste your key here
```

**Security Note**: In production, store the API key in an environment variable or config file outside the web root.

---

### **Step 3: Create Database Tables**

Run the database setup script to create necessary tables:

**Option A: Via Browser**
```
http://localhost/MathEase/php/setup-ai-tables.php
```

**Option B: Via Command Line**
```bash
cd C:\xampp\htdocs\MathEase\php
php setup-ai-tables.php
```

**Tables Created:**
- `lesson_completions` - Tracks lesson completion and time spent
- `study_sessions` - Records study time per topic
- `quiz_attempts` - Stores quiz scores and performance
- `ai_performance_analysis` - Saves AI analysis results

---

### **Step 4: Test the Integration**

1. **Log in as a student**
2. **Complete at least one lesson** in Functions topic
3. **Take at least one quiz**
4. **Scroll to the bottom** of `topics/functions.html`
5. **Click "Analyze My Performance"**

The AI will analyze your data and display:
- ✅ Weak areas
- ✅ Strengths
- ✅ Personalized recommendations
- ✅ Learning patterns
- ✅ Next steps

---

## 🎨 Features Breakdown

### **1. Intelligent Analysis**
- Gemini AI processes student performance data
- Identifies patterns in quiz scores (low scores = weak areas)
- Analyzes time spent (long time = struggling topic)
- Compares against typical learning patterns

### **2. Personalized Recommendations**
Examples of recommendations:
- "Review Function Composition - your quiz score was 60%"
- "Practice more Domain and Range problems"
- "You excel at basic functions - try advanced problems"
- "Spend 15 more minutes daily on Rational Functions"

### **3. Beautiful UI**
- Modern gradient design with purple/indigo theme
- Animated loading states
- Collapsible sections
- Mobile-responsive layout

### **4. Privacy & Security**
- Analysis only uses student's own data
- No data shared with external services except Gemini API
- API calls are encrypted (HTTPS)
- Results stored securely in database

---

## 📊 Database Schema

### `lesson_completions`
```sql
student_id INT
topic_name VARCHAR(100)
lesson_number INT
completed_at TIMESTAMP
time_spent_seconds INT
```

### `quiz_attempts`
```sql
student_id INT
quiz_type VARCHAR(100)
score INT
total_questions INT
time_taken_seconds INT
attempt_number INT
completed_at TIMESTAMP
answers_data TEXT
```

### `ai_performance_analysis`
```sql
student_id INT
analysis_text TEXT
weak_areas JSON
recommendations JSON
created_at TIMESTAMP
```

---

## 🔧 Customization Options

### **Change AI Model**
In `gemini-ai-assistant.php`, you can switch models:

```php
// Line 8: Change endpoint
private $apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'; // Pro version
```

### **Adjust AI Creativity**
In `gemini-ai-assistant.php`, modify generation config:

```php
'generationConfig' => [
    'temperature' => 0.9,  // Higher = more creative (0.0-1.0)
    'topK' => 40,          // Higher = more diverse
    'topP' => 0.95,        // Higher = more varied
    'maxOutputTokens' => 2048, // Response length
]
```

### **Add More Analysis Types**
Extend the `buildAnalysisContext()` function:

```php
$context .= "\n\nADDITIONAL ANALYSIS:\n";
$context .= "6. STUDY SCHEDULE: Recommend optimal study times\n";
$context .= "7. PEER COMPARISON: Compare with class average\n";
```

---

## 🚨 Troubleshooting

### **Error: "Failed to analyze performance"**
**Cause**: Missing or invalid API key

**Solution**:
1. Check API key is correctly pasted in `gemini-ai-assistant.php`
2. Verify key works: https://aistudio.google.com/app/apikey
3. Check API key hasn't expired

---

### **Error: "No data available"**
**Cause**: Student hasn't completed lessons/quizzes

**Solution**:
1. Complete at least 1 lesson
2. Take at least 1 quiz
3. Wait for data to sync
4. Try again

---

### **Error: "Gemini API returned status code: 429"**
**Cause**: Rate limit exceeded (too many requests)

**Solution**:
1. Wait 1 minute before trying again
2. Free tier limits: 15 requests/minute
3. Consider upgrading to paid tier if needed

---

### **Error: "Database connection failed"**
**Cause**: Tables not created

**Solution**:
1. Run `php/setup-ai-tables.php`
2. Check database credentials in `php/db_connection.php`
3. Verify XAMPP MySQL is running

---

## 📈 API Usage Monitoring

**Free Tier Quotas:**
- Gemini 1.5 Flash: 15 RPM (requests per minute)
- Gemini 1.5 Pro: 2 RPM

**Monitor your usage:**
1. Visit: https://aistudio.google.com/app/apikey
2. Click on your API key
3. View "Usage" tab

**Estimated Usage:**
- 1 analysis = 1 API request
- Average: ~1,500 tokens per request
- 1 class (30 students) analyzing 1x/day = 30 requests/day
- **Well within free limits!**

---

## 🎯 Best Practices

### **When to Analyze**
- After completing a full topic (all 4 lessons)
- After taking 3+ quizzes
- Weekly progress check
- Before exams (comprehensive review)

### **How to Use Recommendations**
1. Read weak areas carefully
2. Focus on top 2-3 weak topics first
3. Follow AI's specific action steps
4. Re-analyze after 1-2 weeks to track progress

### **For Teachers**
- Encourage students to use AI assistant after each topic
- Use aggregate data to identify class-wide weak areas
- Compare AI recommendations with your observations
- Adjust lesson plans based on common weaknesses

---

## 🔐 Security Notes

### **API Key Protection**
**Current (Development):**
```php
$GEMINI_API_KEY = 'AIzaSy...'; // In PHP file
```

**Production (Recommended):**
```php
// Store in .env file
$GEMINI_API_KEY = getenv('GEMINI_API_KEY');
```

### **Rate Limiting**
Consider adding rate limiting to prevent abuse:

```php
// Check if student analyzed < 5 times today
$stmt = $pdo->prepare("
    SELECT COUNT(*) FROM ai_performance_analysis
    WHERE student_id = ? AND DATE(created_at) = CURDATE()
");
$stmt->execute([$studentId]);
$count = $stmt->fetchColumn();

if ($count >= 5) {
    throw new Exception("Daily analysis limit reached. Try again tomorrow.");
}
```

---

## 📝 License & Credits

**Gemini AI**: Google's generative AI model
**API Docs**: https://ai.google.dev/gemini-api/docs
**Pricing**: https://ai.google.dev/gemini-api/docs/pricing

**Developer**: MathEase Team
**Version**: 1.0.0
**Last Updated**: January 2026

---

## 🚀 Future Enhancements

- [ ] **Visual charts** showing performance over time
- [ ] **Email reports** with weekly AI summaries
- [ ] **Study schedule generator** based on weak areas
- [ ] **Peer comparison** (anonymous) with class average
- [ ] **Gamification** - badges for following recommendations
- [ ] **Teacher dashboard** showing aggregate AI insights
- [ ] **Mobile app integration**
- [ ] **Voice-based AI tutor** using Gemini + TTS

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review API documentation: https://ai.google.dev/gemini-api/docs
3. Contact: support@mathease.edu (fictional)

---

**Enjoy personalized AI-powered learning! 🎓✨**
