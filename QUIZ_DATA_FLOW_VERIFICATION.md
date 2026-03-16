# Quiz Data Flow Verification

## ✅ Verified: Data Flow is Consistent

### 1. Quiz Data Saving (topics/functions.html)

**Location:** `topics/functions.html` → `storeQuizData()` function (line ~3901)

**How it saves:**
```javascript
fetch('../php/store-quiz-data.php', {
    method: 'POST',
    credentials: 'include', // ✅ Sends session cookie
    body: JSON.stringify({
        topic: 'functions',
        lesson: lessonNum,
        quiz_type: `functions_topic_${lessonNum}`, // ✅ Format: functions_topic_1, functions_topic_2, etc.
        score: score,
        total_questions: totalQuestions,
        answers: cleanedAnswers,
        time_taken_seconds: timeTaken
    })
})
```

**ID Used:** 
- ✅ Uses `credentials: 'include'` which sends PHP session cookie
- ✅ PHP gets `$_SESSION['user_id']` from session
- ✅ Saved as `student_id = $_SESSION['user_id']` in database

---

### 2. Quiz Data Storage (php/store-quiz-data.php)

**Location:** `php/store-quiz-data.php` (line ~72-77)

**How it stores:**
```php
$user_id = $_SESSION['user_id']; // ✅ Gets from session
$student_id = $user_id; // ✅ Uses user_id as student_id
$quiz_type = $input['quiz_type'] ?? ''; // ✅ Gets from request: functions_topic_N

// Saves to quiz_attempts table:
INSERT INTO quiz_attempts (
    student_id,      // ✅ $_SESSION['user_id']
    quiz_type,       // ✅ functions_topic_1, functions_topic_2, etc.
    score,
    total_questions,
    answers_data,    // ✅ JSON array of answers
    ...
)
```

**ID Used:**
- ✅ `student_id = $_SESSION['user_id']` (same as groq-ai-performance.php)

**Quiz Type Format:**
- ✅ `functions_topic_1`, `functions_topic_2`, `functions_topic_3`, `functions_topic_4`

---

### 3. Quiz Data Retrieval (php/groq-ai-performance.php)

**Location:** `php/groq-ai-performance.php` (line ~80-82, ~240-250)

**How it retrieves:**
```php
$user_id = $_SESSION['user_id']; // ✅ Gets from session
$student_id = $user_id; // ✅ Uses user_id as student_id

// Queries quiz_attempts table:
SELECT * FROM quiz_attempts
WHERE student_id = ?                    // ✅ $_SESSION['user_id']
  AND quiz_type LIKE 'functions_topic_%' // ✅ Matches functions_topic_1, functions_topic_2, etc.
```

**ID Used:**
- ✅ `student_id = $_SESSION['user_id']` (same as store-quiz-data.php)

**Quiz Type Query:**
- ✅ `quiz_type LIKE 'functions_topic_%'` (matches all functions_topic_N)

---

## ✅ Verification Checklist

- [x] **Same ID Used:** Both use `$_SESSION['user_id']` as `student_id`
- [x] **Same Quiz Type Format:** `functions_topic_N` format matches
- [x] **Same Table:** Both use `quiz_attempts` table
- [x] **Session Authentication:** Both use PHP session (`credentials: 'include'`)
- [x] **Answers Data:** Both handle `answers_data` column correctly

---

## Data Flow Diagram

```
┌─────────────────────────────────┐
│  topics/functions.html         │
│  storeQuizData() function      │
│                                │
│  quiz_type: functions_topic_N  │
│  credentials: 'include'        │
└────────────┬──────────────────┘
             │ POST /php/store-quiz-data.php
             │ (sends session cookie)
             ▼
┌─────────────────────────────────┐
│  php/store-quiz-data.php        │
│                                │
│  student_id = $_SESSION['user_id']│
│  quiz_type = functions_topic_N │
│                                │
│  INSERT INTO quiz_attempts     │
└────────────┬──────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  Database: quiz_attempts        │
│                                │
│  student_id: [user_id]          │
│  quiz_type: functions_topic_N  │
│  answers_data: [JSON]           │
└────────────┬──────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  php/groq-ai-performance.php    │
│                                │
│  student_id = $_SESSION['user_id']│
│  WHERE quiz_type LIKE           │
│    'functions_topic_%'           │
│                                │
│  SELECT FROM quiz_attempts     │
└─────────────────────────────────┘
```

---

## Important Notes

1. **Session-Based Authentication:**
   - Both endpoints use PHP session (`$_SESSION['user_id']`)
   - JavaScript uses `credentials: 'include'` to send session cookie
   - No manual ID passing needed - automatically uses logged-in user's ID

2. **Quiz Type Format:**
   - Must be exactly: `functions_topic_1`, `functions_topic_2`, `functions_topic_3`, `functions_topic_4`
   - Query uses `LIKE 'functions_topic_%'` to match all of them

3. **Answers Data:**
   - Stored as JSON in `answers_data` column
   - Contains: question, options, selected, correct, isCorrect, etc.
   - Used by AI for detailed analysis

4. **Consistency:**
   - ✅ Same ID used for saving and querying
   - ✅ Same quiz_type format used
   - ✅ Same table used
   - ✅ Same session authentication used

---

## Testing

To verify everything works:

1. **Take a quiz** in `topics/functions.html`
2. **Check browser console** - should see `[AI DATA] ✅ Quiz data stored successfully`
3. **Check PHP error logs** - should see quiz data stored with correct student_id and quiz_type
4. **Run AI analysis** - should find the quiz attempts
5. **Run diagnostic:** `php/test-quiz-save.php` - should show quiz attempts

---

## Summary

✅ **Everything is aligned!** The same ID (`$_SESSION['user_id']`) and quiz_type format (`functions_topic_N`) are used consistently throughout the entire flow from saving to retrieving quiz data for AI analysis.
