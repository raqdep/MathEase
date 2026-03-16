<?php
// Start output buffering to prevent any output before JSON
ob_start();

session_start();
require_once 'config.php';

// Clean any output that might have been generated
ob_clean();

header('Content-Type: application/json');

// Check if user is logged in as teacher
if (!isset($_SESSION['teacher_id']) || !isset($_SESSION['user_type']) || $_SESSION['user_type'] !== 'teacher') {
    ob_clean();
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Teacher access required.']);
    ob_end_flush();
    exit;
}

// Load environment variables
require_once __DIR__ . '/load-env.php';

// Gemini API Key - loaded from .env file
$gemini_api_key = getenv('GEMINI_API_KEY');
$gemini_model = getenv('GEMINI_MODEL') ?: 'gemini-1.5-flash';

if (empty($gemini_api_key)) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'GEMINI_API_KEY is not configured. Please set it in your .env file.',
        'error_type' => 'CONFIGURATION_ERROR'
    ]);
    ob_end_flush();
    exit;
}

// Handle file upload
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Check if file was uploaded
        if (!isset($_FILES['pdf_file']) || $_FILES['pdf_file']['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('No file uploaded or upload error occurred.');
        }

        $file = $_FILES['pdf_file'];
        $lesson_title = $_POST['lesson_title'] ?? 'Untitled Lesson';
        $topic_category = $_POST['topic_category'] ?? 'custom';

        // Validate file type
        $file_ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($file_ext !== 'pdf') {
            throw new Exception('Invalid file type. Only PDF files are allowed.');
        }

        // Validate file size (10MB max)
        if ($file['size'] > 10 * 1024 * 1024) {
            throw new Exception('File size exceeds 10MB limit.');
        }

        // Read PDF content (keep full text; long PDFs will be summarized in chunks)
        $pdf_content = extractPDFText($file['tmp_name']);
        
        if (empty($pdf_content)) {
            throw new Exception('Could not extract text from PDF. Please ensure the PDF contains readable text.');
        }

        // Validate that we have content
        if (empty(trim($pdf_content))) {
            throw new Exception('PDF content is empty after extraction. Please ensure the PDF contains readable text.');
        }

        // Light-weight math validation: keyword-based only (no external API call to save tokens)
        error_log("Starting keyword-based General Mathematics validation for PDF content (length: " . strlen($pdf_content) . " characters)");
        $math_keywords = [
            'function', 'mathematics', 'math', 'equation', 'formula', 'graph', 'domain', 'range',
            'rational', 'polynomial', 'algebra', 'interest', 'percentage', 'rate', 'principal'
        ];
        $content_lower = strtolower($pdf_content);
        $keyword_count = 0;
        foreach ($math_keywords as $kw) {
            if (strpos($content_lower, $kw) !== false) {
                $keyword_count++;
            }
        }
        $isGeneralMath = $keyword_count >= 1;
        error_log("Keyword math validation result: " . ($isGeneralMath ? 'PASSED' : 'FAILED') . " (found {$keyword_count} keywords)");

        if (!$isGeneralMath) {
            ob_clean();
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'The uploaded PDF does not appear to contain General Mathematics content. Please ensure your PDF contains mathematical concepts, formulas, equations, or problem-solving related to General Mathematics.',
                'error_type' => 'INVALID_CONTENT',
                'debug_info' => 'Validation failed using keyword-based check - PDF content may not contain sufficient mathematics-related keywords or concepts.'
            ]);
            ob_end_flush();
            exit;
        }
        
        error_log("PDF validation passed - proceeding with Gemini lesson generation");

        // Cap content size so Gemini request stays safe
        $max_direct_chars = 12000;
        $content_for_lesson = strlen($pdf_content) > $max_direct_chars
            ? substr($pdf_content, 0, $max_direct_chars) . "\n\n[Content truncated for processing. Lesson is based on the first part of your PDF.]"
            : $pdf_content;

        // Generate lesson using Gemini AI
        $lesson_html = generateLessonWithGemini($content_for_lesson, $lesson_title, $topic_category, $gemini_api_key, $gemini_model);
        
        // Validate generated lesson
        if (empty(trim($lesson_html))) {
            throw new Exception('AI generated empty lesson content. Please try again.');
        }

        // Save lesson to database
        $teacher_id = $_SESSION['teacher_id'];
        $lesson_id = saveLessonToDatabase($pdo, $teacher_id, $lesson_title, $topic_category, $lesson_html);

        // Clean output buffer before sending JSON
        ob_clean();
        echo json_encode([
            'success' => true,
            'message' => 'Lesson generated successfully!',
            'lesson_id' => $lesson_id,
            'lesson_html' => $lesson_html,
            'lesson_title' => $lesson_title
        ]);
        ob_end_flush();
        exit;

    } catch (Exception $e) {
        // Log detailed error information
        $errorDetails = [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ];
        error_log("Create Lesson Error: " . json_encode($errorDetails));
        error_log("Stack trace: " . $e->getTraceAsString());
        
        ob_clean();
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage(),
            'error_type' => 'LESSON_GENERATION_ERROR'
        ]);
        ob_end_flush();
        exit;
    } catch (Error $e) {
        // PHP 7+ fatal errors
        error_log("Create Lesson Fatal Error: " . $e->getMessage());
        error_log("File: " . $e->getFile() . " Line: " . $e->getLine());
        
        ob_clean();
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Fatal error: ' . $e->getMessage(),
            'error_type' => 'FATAL_ERROR'
        ]);
        ob_end_flush();
        exit;
    }
} else {
    ob_clean();
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    ob_end_flush();
    exit;
}

/**
 * Extract text from PDF file
 */
function extractPDFText($file_path) {
    // Method 1: Try using pdftotext command-line tool (Linux/Mac/Windows with poppler)
    if (function_exists('shell_exec')) {
        // Check if pdftotext is available
        $pdftotext_check = @shell_exec('which pdftotext 2>&1');
        if ($pdftotext_check && strpos($pdftotext_check, 'pdftotext') !== false) {
            $text = @shell_exec('pdftotext ' . escapeshellarg($file_path) . ' - 2>&1');
            if ($text && strlen(trim($text)) > 50) {
                return trim($text);
            }
        }
        
        // Try Windows path
        $text = @shell_exec('pdftotext.exe ' . escapeshellarg($file_path) . ' - 2>&1');
        if ($text && strlen(trim($text)) > 50) {
            return trim($text);
        }
    }
    
    // Method 2: Try using smalot/pdfparser if installed via Composer
    if (class_exists('Smalot\PdfParser\Parser')) {
        try {
            $parser = new \Smalot\PdfParser\Parser();
            $pdf = $parser->parseFile($file_path);
            $text = $pdf->getText();
            if ($text && strlen(trim($text)) > 50) {
                return trim($text);
            }
        } catch (Exception $e) {
            error_log("PDF Parser Error: " . $e->getMessage());
        }
    }
    
    // Method 3: Basic text extraction from PDF content
    // This is a fallback method - works for some PDFs but not all
    $content = @file_get_contents($file_path);
    if (!$content) {
        throw new Exception('Could not read PDF file.');
    }
    
    // Extract text between stream objects (basic PDF text extraction)
    $text = '';
    
    // Look for text objects in PDF
    preg_match_all('/\((.*?)\)/s', $content, $matches);
    if (!empty($matches[1])) {
        $text = implode(' ', $matches[1]);
        // Clean up the text
        $text = preg_replace('/[^\x20-\x7E\n\r]/', '', $text);
        $text = preg_replace('/\s+/', ' ', $text);
    }
    
    // If still no text, try extracting from BT/ET blocks
    if (empty(trim($text))) {
        preg_match_all('/BT\s*(.*?)\s*ET/s', $content, $btMatches);
        if (!empty($btMatches[1])) {
            foreach ($btMatches[1] as $block) {
                preg_match_all('/\((.*?)\)/s', $block, $blockMatches);
                if (!empty($blockMatches[1])) {
                    $text .= implode(' ', $blockMatches[1]) . ' ';
                }
            }
            $text = trim($text);
        }
    }
    
    // If no text found, throw an error
    if (empty(trim($text)) || strlen(trim($text)) < 50) {
        throw new Exception('Could not extract readable text from PDF. Please ensure the PDF contains text (not just images). For better results, install pdftotext or use a PDF parsing library like smalot/pdfparser.');
    }
    
    return trim($text);
}

/**
 * Validate if PDF content is about General Mathematics
 */
function validateGeneralMathematics($pdf_content, $api_key, $api_url) {
    // Use a small sample to stay under Groq 6000-token request limit
    $sample_content = strlen($pdf_content) > 3500 ? substr($pdf_content, 0, 3500) : $pdf_content;
    
    $prompt = "Analyze the following PDF content and determine if it is about General Mathematics (Grade 11 level) or any mathematics-related topic.

General Mathematics topics include but are not limited to:
- Functions (introduction, evaluation, operations, composition)
- Rational Functions
- Domain and Range
- Function composition and inverse functions
- Real-life problems involving functions
- Mathematical modeling
- Business mathematics
- Logic and reasoning
- Statistics and probability (basic)
- Financial mathematics
- Algebra
- Equations and inequalities
- Graphs and graphing
- Polynomials
- Any mathematical concepts, formulas, or problem-solving

IMPORTANT: Be LENIENT - if the content contains ANY mathematical concepts, formulas, equations, or mathematical problem-solving, respond 'YES'. Only respond 'NO' if the content is clearly NOT mathematics (like pure literature, history without math, pure science experiments, etc.).

PDF Content Sample:
" . $sample_content . "

Respond with ONLY 'YES' if the content contains mathematics or General Mathematics topics, or 'NO' if it is clearly NOT mathematics (like pure literature, history, English grammar, etc.).";

    // Check if cURL is available
    if (!function_exists('curl_init')) {
        error_log("cURL not available, using keyword fallback");
        // If cURL is not available, do a basic keyword check as fallback
        $math_keywords = [
            'function', 'mathematics', 'math', 'equation', 'formula', 'graph', 'domain', 'range', 
            'rational', 'polynomial', 'algebra', 'calculus', 'trigonometry', 'statistics', 
            'probability', 'solve', 'solution', 'variable', 'coefficient', 'exponent'
        ];
        $content_lower = strtolower($sample_content);
        $keyword_count = 0;
        foreach ($math_keywords as $keyword) {
            if (strpos($content_lower, $keyword) !== false) {
                $keyword_count++;
            }
        }
        // More lenient: if at least 1 math keyword found, assume it's math-related
        $is_math = $keyword_count >= 1;
        error_log("cURL fallback keyword check: Found $keyword_count keywords. Is Math: " . ($is_math ? 'YES' : 'NO'));
        return $is_math;
    }

    $data = [
        'model' => 'llama-3.1-8b-instant',
        'messages' => [
            [
                'role' => 'system',
                'content' => 'You are an expert in educational content analysis. Your task is to determine if content is about General Mathematics or any mathematics topic. Be LENIENT - if the content contains ANY mathematical concepts, formulas, equations, or problem-solving, respond "YES". Only respond "NO" if the content is clearly NOT mathematics (like pure literature, history without math, etc.). Respond with "YES" or "NO" only.'
            ],
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ],
        'temperature' => 0.1, // Low temperature for more consistent results
        'max_tokens' => 20 // Allow for brief response
    ];

    $ch = curl_init($api_url);
    
    if ($ch === false) {
        error_log("cURL initialization failed, using keyword fallback");
        // Fallback to keyword check
        $math_keywords = [
            'function', 'mathematics', 'math', 'equation', 'formula', 'graph', 'domain', 'range', 
            'rational', 'polynomial', 'algebra', 'solve', 'solution', 'variable'
        ];
        $content_lower = strtolower($sample_content);
        $keyword_count = 0;
        foreach ($math_keywords as $keyword) {
            if (strpos($content_lower, $keyword) !== false) {
                $keyword_count++;
            }
        }
        $is_math = $keyword_count >= 1;
        error_log("cURL init fallback: Found $keyword_count keywords. Is Math: " . ($is_math ? 'YES' : 'NO'));
        return $is_math;
    }

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $api_key
        ],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);

    // If API call fails, fallback to keyword check
    if ($curl_error || $http_code !== 200 || empty($response)) {
        error_log("API validation failed, using keyword fallback. HTTP: $http_code, Error: $curl_error");
        $math_keywords = [
            'function', 'mathematics', 'math', 'equation', 'formula', 'graph', 'domain', 'range', 
            'rational', 'polynomial', 'algebra', 'calculus', 'trigonometry', 'statistics', 
            'probability', 'solve', 'solution', 'variable', 'coefficient', 'exponent', 'derivative',
            'integral', 'matrix', 'vector', 'slope', 'intercept', 'quadratic', 'linear', 'exponential',
            'logarithm', 'inequality', 'fraction', 'decimal', 'percentage', 'ratio', 'proportion',
            'geometry', 'angle', 'triangle', 'circle', 'square', 'rectangle', 'area', 'perimeter',
            'volume', 'surface', 'coordinate', 'axis', 'plot', 'graph', 'chart', 'data', 'mean',
            'median', 'mode', 'standard deviation', 'correlation', 'regression', 'model', 'theorem',
            'proof', 'axiom', 'postulate', 'conjecture', 'hypothesis', 'mathematical', 'numerical',
            'computation', 'calculation', 'arithmetic', 'algebraic', 'geometric', 'trigonometric'
        ];
        $content_lower = strtolower($sample_content);
        $keyword_count = 0;
        foreach ($math_keywords as $keyword) {
            if (strpos($content_lower, $keyword) !== false) {
                $keyword_count++;
            }
        }
        // More lenient: if at least 1 math keyword found, assume it's math-related
        $is_math = $keyword_count >= 1;
        error_log("Keyword check result: Found $keyword_count math keywords. Is Math: " . ($is_math ? 'YES' : 'NO'));
        return $is_math;
    }

    // Parse response
    $result = json_decode($response, true);
    
    if (json_last_error() !== JSON_ERROR_NONE || !isset($result['choices'][0]['message']['content'])) {
        error_log("JSON parse error in validation response. Error: " . json_last_error_msg());
        // Fallback to keyword check
        $math_keywords = [
            'function', 'mathematics', 'math', 'equation', 'formula', 'graph', 'domain', 'range', 
            'rational', 'polynomial', 'algebra', 'solve', 'solution', 'variable', 'coefficient'
        ];
        $content_lower = strtolower($sample_content);
        $keyword_count = 0;
        foreach ($math_keywords as $keyword) {
            if (strpos($content_lower, $keyword) !== false) {
                $keyword_count++;
            }
        }
        $is_math = $keyword_count >= 1;
        error_log("Fallback keyword check: Found $keyword_count keywords. Is Math: " . ($is_math ? 'YES' : 'NO'));
        return $is_math;
    }

    $ai_response = trim(strtoupper($result['choices'][0]['message']['content']));
    error_log("AI validation response: " . $ai_response);
    
    // Check if response contains YES (more lenient check)
    // Also check for variations like "YES,", "YES.", "YES!", etc.
    $is_valid = (strpos($ai_response, 'YES') !== false) || 
                (strpos($ai_response, 'MATHEMATICS') !== false) ||
                (strpos($ai_response, 'MATH') !== false && strpos($ai_response, 'NO') === false);
    
    error_log("Final validation result: " . ($is_valid ? 'YES' : 'NO'));
    return $is_valid;
}

/**
 * Call Gemini API with a single text prompt. Returns generated text or throws on error.
 */
function callGemini($api_key, $model, $prompt, $max_output_tokens = 4096) {
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . urlencode($api_key);
    $payload = [
        'contents' => [
            [
                'role' => 'user',
                'parts' => [
                    ['text' => $prompt]
                ]
            ]
        ],
        'generationConfig' => [
            'maxOutputTokens' => $max_output_tokens,
            'temperature' => 0.6,
        ],
    ];
    
    // Use file_get_contents with stream context instead of cURL to avoid \"No URL set\" issues
    $context = stream_context_create([
        'http' => [
            'method'  => 'POST',
            'header'  => "Content-Type: application/json\r\n",
            'content' => json_encode($payload),
            'timeout' => 90,
        ],
    ]);
    
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        $error = error_get_last();
        $message = $error && isset($error['message']) ? $error['message'] : 'Unknown HTTP error';
        error_log('[Gemini] file_get_contents failed: ' . $message . ' | URL=' . $url);
        throw new Exception('Gemini API request failed: ' . $message);
    }
    
    // Try to get HTTP status code from response headers if available
    $http_code = 200;
    if (isset($http_response_header) && is_array($http_response_header) && count($http_response_header) > 0) {
        // Example: HTTP/1.1 200 OK
        if (preg_match('#HTTP/\S+\s+(\d{3})#', $http_response_header[0], $matches)) {
            $http_code = (int)$matches[1];
        }
    }
    
    if ($http_code !== 200) {
        $data = json_decode($response, true);
        $message = isset($data['error']['message']) ? $data['error']['message'] : 'HTTP ' . $http_code;
        throw new Exception('Gemini API error: ' . $message);
    }

    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Failed to parse Gemini response: ' . json_last_error_msg());
    }
    if (!isset($data['candidates'][0]['content']['parts'][0]['text'])) {
        throw new Exception('Invalid Gemini response: missing text content.');
    }
    return $data['candidates'][0]['content']['parts'][0]['text'];
}

/**
 * Generate lesson HTML using Gemini AI
 */
function generateLessonWithGemini($pdf_content, $lesson_title, $topic_category, $api_key, $model) {
    // Map topic categories to their full descriptions
    $topic_descriptions = [
        'functions' => 'Functions - Introduction to functions, function notation, domain and range',
        'evaluating-functions' => 'Evaluating Functions - How to evaluate functions for given inputs',
        'operations-on-functions' => 'Operations on Functions - Addition, subtraction, multiplication, and division of functions',
        'rational-functions' => 'Rational Functions - Functions expressed as ratios of polynomials',
        'solving-real-life-problems' => 'Solving Real Life Problems - Applying functions to solve real-world problems',
        'custom' => 'Custom Topic - General mathematics topic'
    ];
    
    $topic_description = $topic_descriptions[$topic_category] ?? 'General Mathematics Topic';
    
    // Cap content size so total request stays under Groq 6000-token limit (input + prompt + system)
    $max_content_chars = 10000;
    $pdf_content_trimmed = strlen($pdf_content) > $max_content_chars
        ? substr($pdf_content, 0, $max_content_chars) . "\n\n[Additional content omitted for length.]"
        : $pdf_content;
    
    $prompt = "You are an expert educational content creator specializing in mathematics education for Grade 11 students. Your goal is to create CLEAR, DETAILED, and EASY-TO-UNDERSTAND lessons that students can easily comprehend.

CRITICAL INSTRUCTION: You MUST base your lesson ENTIRELY on the content provided below. The content may be the full PDF text OR a summarized version of the entire PDF (so it may cover multiple sections). It is your PRIMARY and ONLY source material. Do NOT generate generic content - use ONLY what is in the content. However, you MUST EXPAND and ENHANCE the explanations to make them clearer and more understandable.

The content below contains the actual lesson material. Your task is to:
1. Read and understand ALL the content from the PDF below
2. Extract the key concepts, examples, explanations, and information from the PDF
3. EXPAND and ENHANCE explanations to make them clearer and more detailed
4. Add step-by-step breakdowns for every concept and example
5. Transform the PDF content into a well-structured HTML lesson format with COMPREHENSIVE explanations
6. Use the EXACT information, examples, and explanations from the PDF as the foundation
7. ADD DETAILED EXPLANATIONS, step-by-step processes, and \"why\" explanations to help students understand
8. If the PDF content relates to the topic category (" . $topic_category . "), organize it accordingly
9. PRESERVE the actual content from the PDF but EXPAND it with clearer explanations

PDF CONTENT (THIS IS YOUR SOURCE MATERIAL - USE THIS CONTENT AND EXPAND IT):
" . $pdf_content_trimmed . "

Topic Category Selected: " . $topic_category . " (" . $topic_description . ")
Lesson Title: " . $lesson_title . "

MANDATORY REQUIREMENTS FOR CLEAR EXPLANATIONS:
1. USE THE PDF CONTENT ABOVE as your foundation - Extract and organize the information from the PDF
2. EXPAND EVERY EXPLANATION: For each concept in the PDF, add:
   - A clear, simple definition in student-friendly language
   - Step-by-step breakdown of how it works
   - \"Why\" explanations (why do we use this? why is it important?)
   - Real-world context or examples when possible
   - Common mistakes to avoid
3. For EVERY EXAMPLE in the PDF, provide:
   - Step-by-step solution with detailed explanations for EACH step
   - Explanation of WHY each step is taken
   - What to look for or identify in each step
   - Alternative approaches if applicable
   - Visual breakdown if helpful
4. For EVERY FORMULA or CONCEPT, include:
   - What each part means
   - When to use it
   - How to apply it step-by-step
   - Common pitfalls or mistakes
5. Transform the PDF content into HTML format with PROPER STRUCTURE LIKE POWERPOINT SLIDES
6. Format the lesson like a PowerPoint presentation with slide-like sections:
   - Each major topic/concept should be a separate \"slide\" section
   - Use card-like containers with rounded corners, shadows, and clear spacing
   - Each slide section should have a clear title/heading
   - Use visual hierarchy with different background colors for different slide types
   - Add slide numbers or visual indicators
   - Make each section visually distinct like PowerPoint slides
7. Create a complete HTML lesson page with the same structure as the student lessons in MathEase
8. Include these sections based on what's in the PDF (each as a separate slide-like section):
   - Title slide: Lesson title and description (use title from PDF or the provided lesson title)
   - Introduction slide: Brief overview explaining what students will learn and why it's important
   - Objectives slide: Learning objectives section (extract from PDF or create based on PDF content)
   - Concept Explanation slides: DETAILED explanation sections - break concepts into multiple slides with:
     * Clear definitions
     * Step-by-step explanations
     * \"Why\" and \"how\" explanations
     * Visual representations when helpful
   - Example slides: Practice examples with COMPREHENSIVE step-by-step solutions:
     * Each example should have detailed explanations for every step
     * Show the reasoning behind each step
     * Explain what to look for
     * Include tips and common mistakes
   - Practice/Application slides: Additional examples or practice problems with solutions
   - Summary slide: Key points summary with clear takeaways
   - References slide: References section (if mentioned in PDF)
9. Use slide-like styling with Tailwind CSS:
    - Each slide should use: bg-white rounded-xl shadow-lg p-8 mb-6
    - Title slides: bg-gradient-to-r from-indigo-600 to-purple-600 text-white
    - Content slides: bg-white with border-l-4 border-indigo-500
    - Example slides: bg-blue-50 or bg-green-50 with detailed step-by-step breakdowns
    - Explanation slides: bg-yellow-50 or bg-purple-50 for important concepts
    - Use clear visual separation between slides
10. WRITING STYLE FOR EXPLANATIONS:
    - Use simple, clear language that Grade 11 students can understand
    - Avoid overly technical jargon - if you must use it, explain it first
    - Break down complex ideas into smaller, digestible parts
    - Use analogies or real-world examples when helpful
    - Write in a friendly, encouraging tone
    - Use bullet points or numbered lists for step-by-step processes
    - Highlight important points or formulas
11. Make it engaging and educational for Grade 11 students
12. Include proper HTML structure with sections, headings, and formatted content
13. Use icons from Font Awesome (fas classes) to make it visually appealing
14. Follow the same color scheme and design patterns
15. DO NOT include \"Topic Category:\" in the generated content - it's metadata only
16. PRESERVE the actual mathematical content, formulas, and examples from the PDF
17. EXPAND explanations to ensure students understand not just \"what\" but also \"why\" and \"how\"
18. Format like PowerPoint: Clear sections, visual breaks, slide-like containers

SLIDE FORMAT EXAMPLE FOR EXPLANATIONS:
<div class=\"bg-white rounded-xl shadow-lg p-8 mb-6 border-l-4 border-indigo-500\">
    <h3 class=\"text-2xl font-bold text-gray-800 mb-4\"><i class=\"fas fa-lightbulb text-yellow-500 mr-2\"></i>Concept Title</h3>
    <div class=\"bg-blue-50 p-4 rounded-lg mb-4\">
        <p class=\"text-gray-700 font-semibold mb-2\">What is it?</p>
        <p class=\"text-gray-700 mb-4\">Clear, simple definition here...</p>
    </div>
    <div class=\"bg-green-50 p-4 rounded-lg mb-4\">
        <p class=\"text-gray-700 font-semibold mb-2\">How does it work?</p>
        <ol class=\"list-decimal list-inside space-y-2 text-gray-700\">
            <li>Step 1 with detailed explanation</li>
            <li>Step 2 with detailed explanation</li>
        </ol>
    </div>
    <div class=\"bg-yellow-50 p-4 rounded-lg\">
        <p class=\"text-gray-700 font-semibold mb-2\">Why is this important?</p>
        <p class=\"text-gray-700\">Explanation of why students need to know this...</p>
    </div>
</div>

SLIDE FORMAT EXAMPLE FOR EXAMPLES:
<div class=\"bg-blue-50 rounded-xl shadow-lg p-8 mb-6 border-l-4 border-blue-500\">
    <h3 class=\"text-2xl font-bold text-gray-800 mb-4\"><i class=\"fas fa-calculator text-blue-600 mr-2\"></i>Example: [Title]</h3>
    <div class=\"bg-white p-4 rounded-lg mb-4\">
        <p class=\"text-gray-700 font-semibold mb-2\">Problem:</p>
        <p class=\"text-gray-700\">[Problem statement]</p>
    </div>
    <div class=\"bg-green-50 p-4 rounded-lg\">
        <p class=\"text-gray-700 font-semibold mb-3\">Solution:</p>
        <div class=\"space-y-3\">
            <div class=\"flex items-start\">
                <span class=\"bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1\">1</span>
                <div>
                    <p class=\"text-gray-700 font-medium\">Step 1: [What we do]</p>
                    <p class=\"text-gray-600 text-sm ml-9\">[Detailed explanation of why and how]</p>
                </div>
            </div>
            <div class=\"flex items-start\">
                <span class=\"bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1\">2</span>
                <div>
                    <p class=\"text-gray-700 font-medium\">Step 2: [What we do]</p>
                    <p class=\"text-gray-600 text-sm ml-9\">[Detailed explanation of why and how]</p>
                </div>
            </div>
        </div>
    </div>
</div>

REMEMBER: 
- The PDF content above is your source. Extract and organize it into slide-like sections.
- EXPAND and ENHANCE every explanation to make it clearer and more detailed.
- Add step-by-step breakdowns for every concept and example.
- Explain not just \"what\" but also \"why\" and \"how\".
- Make sure students can easily understand and follow along.
- Format it like a PowerPoint presentation with clear visual slides.

Generate ONLY the lesson content HTML (the main content section, not the full HTML document with <html>, <head>, <body> tags). Start directly with the lesson content divs and sections formatted like PowerPoint slides.";

    // Check if cURL is available
    if (!function_exists('curl_init')) {
        throw new Exception('cURL extension is not enabled on this server');
    }

    $data = [
        'model' => 'llama-3.1-8b-instant',
        'messages' => [
            [
                'role' => 'system',
                'content' => 'You are an expert educational content creator specializing in creating interactive HTML lessons for mathematics education. Your primary task is to extract and transform PDF content into well-structured HTML lesson pages with COMPREHENSIVE, DETAILED, and EASY-TO-UNDERSTAND explanations. You MUST use ONLY the content provided in the PDF as your foundation - do not generate generic or made-up content. However, you MUST EXPAND every explanation, add step-by-step breakdowns, explain the \"why\" behind concepts, and ensure students can easily understand the material. Extract the actual information, examples, explanations, and problems from the PDF and enhance them with detailed, clear explanations that help students truly understand the concepts.'
            ],
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ],
        'temperature' => 0.6, // Slightly higher for more creative explanations
        'max_tokens' => 10000 // Increased to allow for more detailed explanations
    ];

    $ch = curl_init($api_url);
    
    if ($ch === false) {
        throw new Exception('Failed to initialize cURL');
    }

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $api_key
        ],
        CURLOPT_TIMEOUT => 60, // 60 seconds timeout for AI generation
        CURLOPT_CONNECTTIMEOUT => 10
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);

    // Check for cURL errors
    if ($curl_error) {
        error_log("Groq API cURL Error: " . $curl_error);
        throw new Exception('API request failed: ' . $curl_error);
    }

    // Check for empty response
    if (empty($response)) {
        error_log("Groq API Error: Empty response from API");
        throw new Exception('Empty response from AI service. Please try again.');
    }

    // Check HTTP status code
    if ($http_code !== 200) {
        error_log("Groq API Error: HTTP $http_code");
        error_log("Response: " . substr($response, 0, 500));
        $errorData = json_decode($response, true);
        $errorMessage = isset($errorData['error']['message']) ? $errorData['error']['message'] : 'HTTP ' . $http_code;
        if (strpos($errorMessage, 'Request too large') !== false || strpos($errorMessage, 'tokens per minute') !== false || strpos($errorMessage, 'TPM') !== false) {
            throw new Exception('Your PDF is too long for one lesson. The system has limited the content to the first part of your PDF. If you still see this, try a shorter PDF (e.g. one chapter) or split your module into multiple smaller PDFs and create one lesson per file.');
        }
        throw new Exception('Groq API error: ' . $errorMessage);
    }

    // Decode JSON response
    $result = json_decode($response, true);
    
    // Check for JSON decode errors
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("Groq API JSON Decode Error: " . json_last_error_msg());
        error_log("Response: " . substr($response, 0, 500));
        throw new Exception('Failed to parse API response: ' . json_last_error_msg());
    }
    
    // Check if response has expected structure
    if (!isset($result['choices'][0]['message']['content'])) {
        error_log("Groq API Invalid Response Structure: " . json_encode($result));
        throw new Exception('Invalid response from AI service. Missing content.');
    }

    return $result['choices'][0]['message']['content'];
}

/**
 * Save lesson to database
 */
function saveLessonToDatabase($pdo, $teacher_id, $title, $topic, $html_content) {
    try {
        // Create table if it doesn't exist
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS teacher_lessons (
                id INT AUTO_INCREMENT PRIMARY KEY,
                teacher_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                topic VARCHAR(100) NOT NULL,
                html_content LONGTEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_teacher (teacher_id),
                INDEX idx_topic (topic)
            )
        ");

        $stmt = $pdo->prepare("
            INSERT INTO teacher_lessons (teacher_id, title, topic, html_content)
            VALUES (?, ?, ?, ?)
        ");

        $stmt->execute([$teacher_id, $title, $topic, $html_content]);
        
        return $pdo->lastInsertId();
    } catch (PDOException $e) {
        error_log("Database Error: " . $e->getMessage());
        throw new Exception('Failed to save lesson to database.');
    }
}
?>
