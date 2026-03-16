# AI Data Flow Explanation - Functions Topic Quiz

## Paano Kumukuha ng Data ang AI

Ang AI (`groq-ai-performance.php`) ay kumukuha ng data mula sa **`quiz_attempts`** table sa database.

### Data Flow:

1. **Student answers quiz** sa `topics/functions.html`
   - Kapag nag-click ang student sa quiz option, na-save sa `userAnswers` array
   - Location: Line 3782-3790 sa functions.html

2. **Quiz completion** - tinatawag ang `storeQuizData()` function
   - Location: Lines 3864, 3888, 4211, 4227
   - Function: Line 3901-4000

3. **Data sent to PHP** - `store-quiz-data.php`
   - Nagse-send ng JSON data kasama:
     - `quiz_type`: `functions_topic_1`, `functions_topic_2`, etc.
     - `answers`: Array ng lahat ng sagot (question, options, selected, correct, etc.)
     - `score`, `total_questions`, `time_taken_seconds`

4. **PHP saves to database** - `store-quiz-data.php`
   - Nagse-save sa `quiz_attempts` table
   - **CRITICAL**: Nagse-save sa `answers_data` column bilang JSON
   - Location: Lines 240-266 sa store-quiz-data.php

5. **AI reads data** - `groq-ai-performance.php`
   - Query: `SELECT ... FROM quiz_attempts WHERE student_id = ? AND quiz_type LIKE 'functions_topic_%'`
   - Location: Line 214-230
   - Binabasa ang `answers_data` column para sa detailed analysis

## Bakit Hindi Na-re-record ng AI ang Data?

### Possible Issues:

#### 1. **`answers_data` column ay wala sa database**
   - **Solution**: Run `php/setup-ai-tables.php` para i-ensure na may `answers_data` column
   - O kaya `store-quiz-data.php` ay automatic na nag-a-add ng column (lines 138-157)

#### 2. **`answers_data` ay empty o null**
   - Check kung ang `userAnswers` array ay properly populated bago i-send
   - Check browser console para sa errors
   - Check PHP error logs

#### 3. **`student_id` mismatch**
   - AI uses `$_SESSION['user_id']` as `student_id`
   - `store-quiz-data.php` uses `$_SESSION['user_id']` as `student_id`
   - Parehong dapat `users.id` value

#### 4. **Quiz type format mismatch**
   - Dapat: `functions_topic_1`, `functions_topic_2`, etc.
   - AI query: `quiz_type LIKE 'functions_topic_%'`
   - Check kung tama ang format

#### 5. **Data hindi na-save properly**
   - Check PHP error logs
   - Check kung successful ang response mula sa `store-quiz-data.php`
   - Browser console: Check kung may error sa fetch request

## How to Debug:

### Step 1: Check kung may data sa database
```sql
SELECT 
    id, 
    quiz_type, 
    score, 
    total_questions,
    LENGTH(answers_data) as answers_length,
    completed_at
FROM quiz_attempts 
WHERE quiz_type LIKE 'functions_topic_%'
ORDER BY completed_at DESC;
```

### Step 2: Check kung may `answers_data` column
```sql
SHOW COLUMNS FROM quiz_attempts LIKE 'answers_data';
```

### Step 3: Check specific quiz attempt
```sql
SELECT 
    id,
    quiz_type,
    answers_data,
    LENGTH(answers_data) as data_length
FROM quiz_attempts 
WHERE id = [ATTEMPT_ID];
```

### Step 4: Run diagnostic script
Access: `php/check-quiz-data.php` sa browser
- Makikita mo lahat ng quiz attempts
- Makikita mo kung may `answers_data` o wala
- Makikita mo kung properly formatted ang data

## Important Notes:

1. **`answers_data` column ay CRITICAL** - Kung wala ito, hindi makakakuha ng detailed analysis ang AI
2. **Data format** - Dapat JSON array na may structure:
   ```json
   [
     {
       "question": "Question text",
       "options": ["Option 1", "Option 2", ...],
       "selected": 0,
       "selectedText": "Option 1",
       "correct": 1,
       "correctText": "Option 2",
       "isCorrect": false
     },
     ...
   ]
   ```
3. **Quiz type naming** - Dapat `functions_topic_1`, `functions_topic_2`, etc. (hindi `functions_topic_01`)

## Quick Fix:

1. Run `php/setup-ai-tables.php` para i-ensure na may lahat ng columns
2. Check browser console kapag nag-quiz - dapat walang errors
3. Check PHP error logs (`error_log` function output)
4. Test ulit ang quiz at check kung na-save ang `answers_data`
