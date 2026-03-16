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

// Groq API Key - loaded from .env file
$groq_api_key = getenv('GROQ_API_KEY');
$groq_api_url = getenv('GROQ_API_URL') ?: 'https://api.groq.com/openai/v1/chat/completions';

if (empty($groq_api_key)) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'GROQ_API_KEY is not configured. Please set it in your .env file.',
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

        // Validate that PDF is about General Mathematics
        error_log("Starting General Mathematics validation for PDF content (length: " . strlen($pdf_content) . " characters)");
        $isGeneralMath = validateGeneralMathematics($pdf_content, $groq_api_key, $groq_api_url);
        error_log("General Mathematics validation result: " . ($isGeneralMath ? 'PASSED' : 'FAILED'));
        
        if (!$isGeneralMath) {
            ob_clean();
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'The uploaded PDF does not appear to contain General Mathematics content. Please ensure your PDF contains mathematical concepts, formulas, equations, or problem-solving related to General Mathematics.',
                'error_type' => 'INVALID_CONTENT',
                'debug_info' => 'Validation failed - PDF content may not contain sufficient mathematics-related keywords or concepts.'
            ]);
            ob_end_flush();
            exit;
        }
        
        error_log("PDF validation passed - proceeding with lesson generation");

        // For long PDFs: summarize entire content in chunks so Groq can "read" it all, then generate lesson from combined summary
        $max_direct_chars = 10000; // under Groq token limit for a single request
        if (strlen($pdf_content) > $max_direct_chars) {
            error_log("PDF is long (" . strlen($pdf_content) . " chars) - summarizing in chunks to cover full content");
            $content_for_lesson = summarizePdfInChunks($pdf_content, $groq_api_key, $groq_api_url);
            if (empty(trim($content_for_lesson))) {
                throw new Exception('Could not summarize PDF content. Please try a shorter PDF or try again.');
            }
            error_log("Chunked summary length: " . strlen($content_for_lesson) . " chars");
        } else {
            $content_for_lesson = $pdf_content;
        }

        // Generate lesson using Groq AI (from full PDF or from combined summary)
        $lesson_html = generateLessonWithAI($content_for_lesson, $lesson_title, $topic_category, $groq_api_key, $groq_api_url);
        
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
 * Call Groq API with given messages. Returns assistant content. Throws on error.
 */
function callGroq($api_url, $api_key, $messages, $max_tokens = 4000, $temperature = 0.3) {
    $data = [
        'model' => 'llama-3.1-8b-instant',
        'messages' => $messages,
        'temperature' => $temperature,
        'max_tokens' => $max_tokens
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
        CURLOPT_TIMEOUT => 90,
        CURLOPT_CONNECTTIMEOUT => 15
    ]);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);
    if ($curl_error) {
        throw new Exception('API request failed: ' . $curl_error);
    }
    if (empty($response)) {
        throw new Exception('Empty response from AI service.');
    }
    if ($http_code !== 200) {
        $errorData = json_decode($response, true);
        $errorMessage = isset($errorData['error']['message']) ? $errorData['error']['message'] : 'HTTP ' . $http_code;
        // Distinguish between size errors and rate-limit (tokens-per-minute) errors
        if (strpos($errorMessage, 'Request too large') !== false) {
            throw new Exception('This request is too large for the current Groq model. Please try a shorter PDF (for example, one topic or chapter).');
        }
        if (strpos($errorMessage, 'tokens per minute') !== false || strpos($errorMessage, 'TPM') !== false) {
            throw new Exception('The AI service is rate limited (too many tokens per minute). Please wait 30–60 seconds and try again, or avoid sending many PDFs in a short time.');
        }
        throw new Exception('Groq API error: ' . $errorMessage);
    }
    $result = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE || !isset($result['choices'][0]['message']['content'])) {
        throw new Exception('Invalid API response.');
    }
    return $result['choices'][0]['message']['content'];
}

/**
 * Summarize one chunk of PDF text for lesson creation. Preserves definitions, formulas, examples.
 */
function summarizeOneChunk($chunk_text, $chunk_index, $total_chunks, $api_key, $api_url) {
    $prompt = "You are summarizing a portion of a mathematics lesson (part " . ($chunk_index + 1) . " of " . $total_chunks . ") for General Mathematics.

Summarize the following content in a structured way. PRESERVE:
- Key definitions and concepts (use exact terms)
- Important formulas and equations (write them exactly)
- Step-by-step procedures
- At least one worked example with solution steps
- Section headings or topic names

Keep the summary concise but complete enough that a lesson can be built from it. Use clear headings. Output plain text (no HTML). Limit to about 1500-2000 characters.

Content to summarize:
" . $chunk_text;

    $messages = [
        ['role' => 'system', 'content' => 'You are an expert at summarizing mathematics lesson content. Preserve all key concepts, formulas, and one representative example per topic. Be concise but complete.'],
        ['role' => 'user', 'content' => $prompt]
    ];
    return callGroq($api_url, $api_key, $messages, 2500, 0.2);
}

/**
 * Read entire PDF by summarizing in chunks, then return combined summary for lesson generation.
 */
function summarizePdfInChunks($full_text, $api_key, $api_url) {
    $len = strlen($full_text);
    // Chunk size kept under Groq token limit per request (~9000 chars)
    $chunk_size = 9000;
    $chunks = [];
    for ($i = 0; $i < $len; $i += $chunk_size) {
        $chunks[] = substr($full_text, $i, $chunk_size);
    }
    $total = count($chunks);
    if ($total === 0) {
        return '';
    }
    if ($total === 1) {
        return summarizeOneChunk($chunks[0], 0, 1, $api_key, $api_url);
    }
    $summaries = [];
    foreach ($chunks as $idx => $chunk) {
        $summaries[] = summarizeOneChunk($chunk, $idx, $total, $api_key, $api_url);
        // Small delay to avoid rate limits (tokens per minute)
        if ($idx < $total - 1) {
            usleep(500000); // 0.5 second
        }
    }
    $combined = "## Full lesson summary (from entire PDF)\n\n" . implode("\n\n---\n\n", $summaries);
    // If combined summary is still too long for the final generation request, condense once more (keep condense request under token limit)
    $max_for_generation = 10000;
    if (strlen($combined) > $max_for_generation) {
        $input_for_condense = substr($combined, 0, 12000) . (strlen($combined) > 12000 ? "\n\n[Further sections omitted for length.]" : "");
        $condensePrompt = "Condense the following lesson summary into one coherent summary suitable for creating a single HTML lesson. Preserve all key concepts, definitions, formulas, and at least one example per topic. Use clear section headings. Keep under 9000 characters.\n\n" . $input_for_condense;
        $messages = [
            ['role' => 'system', 'content' => 'You condense lesson summaries while keeping all important math content and examples.'],
            ['role' => 'user', 'content' => $condensePrompt]
        ];
        $combined = callGroq($api_url, $api_key, $messages, 4000, 0.2);
    }
    return $combined;
}

/**
 * Generate lesson HTML using Groq AI
 */
function generateLessonWithAI($pdf_content, $lesson_title, $topic_category, $api_key, $api_url) {
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
