# Groq AI – “Cassy” quiz feedback (optional)

## What is GROQ_API_KEY?

After a quiz, **Cassy** gives AI feedback on your performance. That uses **Groq’s API** (fast LLM in the cloud).  
`GROQ_API_KEY` is the secret key that lets your app call Groq. It is **optional**: if it’s not set, quiz results are still saved; only the “AI Performance Analysis / Cassy” section won’t work.

## Why you see “GROQ_API_KEY is not configured”

- The key is read from a **`.env`** file in the project root.
- `.env` is **not** in the repo (for security), so:
  - **Locally:** you have to create `.env` and add the key.
  - **On EC2:** the server also needs a `.env` with the key if you want AI feedback there.

If you don’t set it, the app now shows a short message like:  
*“AI feedback is not configured. Your quiz results are saved; detailed AI analysis (Cassy) is optional and can be enabled by your teacher.”*

## How to enable AI feedback (optional)

### 1. Get a free Groq API key

1. Go to **https://console.groq.com/**
2. Sign up / log in.
3. Open **API Keys** and create a key.
4. Copy the key (it’s secret; don’t commit it to Git).

### 2. Configure it

**On your PC (e.g. XAMPP):**

1. In the project root (same folder as `index.html`), create or edit **`.env`**.
2. Add a line (use your real key):

   ```env
   GROQ_API_KEY=gsk_your_actual_key_here
   ```

3. Save. Restart Apache if needed and reload the quiz results page.

**On EC2:**

1. SSH in, then:

   ```bash
   sudo nano /var/www/MathEase/.env
   ```

2. Add (or edit) the line:

   ```env
   GROQ_API_KEY=gsk_your_actual_key_here
   ```

3. Save (Ctrl+O, Enter, Ctrl+X).
4. Ensure the file is readable by the web server, e.g.:

   ```bash
   sudo chown www-data:www-data /var/www/MathEase/.env
   sudo chmod 640 /var/www/MathEase/.env
   ```

After that, the “AI Performance Analysis / Cassy” section should work when you open quiz results again.

## Optional .env options

You can also set (optional):

- `GROQ_MODEL=llama-3.1-8b-instant` (default)
- `GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions` (default)

Only `GROQ_API_KEY` is required for Cassy to work.
