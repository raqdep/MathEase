<?php
/**
 * PDF text extraction (shared logic with create-lesson-from-pdf.php).
 * Kept separate so quiz endpoints do not execute lesson POST handler.
 */

declare(strict_types=1);

function quiz_gen_extractPdfTextViaPdftotext(string $path): ?string
{
    if (!function_exists('shell_exec')) {
        return null;
    }
    $disabled = (string) ini_get('disable_functions');
    if ($disabled !== '' && strpos($disabled, 'shell_exec') !== false) {
        return null;
    }

    $pathArg = escapeshellarg($path);
    $candidates = [];
    $isWin = stripos(PHP_OS_FAMILY, 'Windows') === 0 || stripos(PHP_OS, 'WIN') === 0;

    if ($isWin) {
        $envExe = getenv('PDFTOTEXT_PATH');
        if (is_string($envExe) && $envExe !== '') {
            $envExe = trim($envExe, " \t\"'");
            if (is_file($envExe)) {
                $candidates[] = $envExe;
            }
        }
        $popplerBin = getenv('POPPLER_BIN');
        if (is_string($popplerBin) && $popplerBin !== '') {
            $popplerBin = rtrim(trim($popplerBin, " \t\"'"), '/\\');
            foreach (['pdftotext.exe', 'pdftotext'] as $name) {
                $try = $popplerBin . DIRECTORY_SEPARATOR . $name;
                if (is_file($try)) {
                    $candidates[] = $try;
                    break;
                }
            }
        }

        foreach (['pdftotext.exe', 'pdftotext'] as $alias) {
            $where = shell_exec('where ' . $alias . ' 2>nul');
            if (is_string($where)) {
                foreach (preg_split('/\R/', trim($where)) as $line) {
                    $line = trim($line);
                    if ($line !== '' && strpos(strtolower($line), 'info:') !== 0) {
                        $candidates[] = $line;
                    }
                }
            }
        }
        $candidates[] = 'pdftotext.exe';
        $candidates[] = 'pdftotext';
    } else {
        $cmdv = trim((string) shell_exec('command -v pdftotext 2>/dev/null'));
        if ($cmdv !== '') {
            $candidates[] = $cmdv;
        }
        $candidates[] = 'pdftotext';
    }

    $candidates = array_values(array_unique($candidates));
    foreach ($candidates as $bin) {
        if ($isWin) {
            $bare = ($bin === 'pdftotext' || $bin === 'pdftotext.exe');
            $binArg = $bare ? $bin : escapeshellarg($bin);
            $cmd = $binArg . ' ' . $pathArg . ' - 2>nul';
        } else {
            $cmd = escapeshellarg($bin) . ' ' . $pathArg . ' - 2>/dev/null';
        }
        $out = shell_exec($cmd);
        if (is_string($out) && strlen(trim($out)) > 80) {
            return trim($out);
        }
    }

    return null;
}

function quiz_gen_extractPdfTextFromRawPdf(string $raw): string
{
    $chunks = [];
    $len = strlen($raw);
    for ($i = 0; $i < $len; $i++) {
        if ($raw[$i] !== '(') {
            continue;
        }
        $i++;
        $depth = 1;
        $buf = '';
        while ($i < $len && $depth > 0) {
            $c = $raw[$i];
            if ($c === '\\' && $i + 1 < $len) {
                $buf .= $raw[$i + 1];
                $i += 2;
                continue;
            }
            if ($c === '(') {
                $depth++;
                $buf .= $c;
                $i++;
                continue;
            }
            if ($c === ')') {
                $depth--;
                if ($depth === 0) {
                    $i++;
                    break;
                }
                $buf .= $c;
                $i++;
                continue;
            }
            $buf .= $c;
            $i++;
        }
        $t = trim($buf);
        if (strlen($t) >= 2 && preg_match('/[a-zA-Z0-9]/', $t)) {
            $chunks[] = $t;
        }
    }

    if (preg_match_all('/<([0-9A-Fa-f\s\r\n]+)>/', $raw, $hexMatches)) {
        foreach ($hexMatches[1] as $hex) {
            $hex = preg_replace('/\s+/', '', $hex);
            if (strlen($hex) < 4 || (strlen($hex) % 2) !== 0) {
                continue;
            }
            $bin = @hex2bin($hex);
            if ($bin === false) {
                continue;
            }
            $txt = preg_replace('/[^\x09\x0a\x0d\x20-\x7E]/', ' ', $bin);
            $txt = trim(preg_replace('/\s+/', ' ', $txt));
            if (strlen($txt) >= 2 && preg_match('/[a-zA-Z0-9]/', $txt)) {
                $chunks[] = $txt;
            }
        }
    }

    $text = implode("\n", $chunks);
    $text = preg_replace('/[ \t]+/', ' ', $text);
    $text = preg_replace('/\n{3,}/', "\n\n", $text);
    return trim($text);
}

/**
 * @throws Exception when extraction fails
 */
function quiz_gen_extractPdfText(string $path): string
{
    $viaPoppler = quiz_gen_extractPdfTextViaPdftotext($path);
    if ($viaPoppler !== null) {
        return $viaPoppler;
    }

    if (class_exists('Smalot\\PdfParser\\Parser')) {
        try {
            $parser = new \Smalot\PdfParser\Parser();
            $pdf = $parser->parseFile($path);
            $txt = $pdf->getText();
            if ($txt !== null && strlen(trim($txt)) > 80) {
                return trim($txt);
            }
        } catch (Throwable $e) {
            error_log('[QuizGen PDF] Smalot: ' . $e->getMessage());
        }
    }

    $raw = @file_get_contents($path);
    if ($raw === false) {
        throw new Exception('Unable to read the uploaded PDF file.');
    }

    $candidate = quiz_gen_extractPdfTextFromRawPdf($raw);

    if (strlen($candidate) < 120) {
        throw new Exception(
            'Could not extract enough readable text from this PDF (it may be image-only or encrypted). '
            . 'Install Poppler (PDFTOTEXT_PATH in .env) or run composer install (smalot/pdfparser).'
        );
    }

    return $candidate;
}

/**
 * Strip invalid UTF-8 bytes before PCRE /u (avoids fatal errors on some Windows/PHP builds).
 */
function quiz_gen_utf8_safe(string $s): string
{
    if ($s === '') {
        return '';
    }
    if (function_exists('iconv')) {
        $t = @iconv('UTF-8', 'UTF-8//IGNORE', $s);
        if ($t !== false) {
            return $t;
        }
    }

    return $s;
}

/**
 * Remove XMP/XML junk and PDF property lines so Groq sees lesson text, not "en-PH" metadata.
 */
function quiz_gen_lineLooksLikePdfStructuralNoise(string $line): bool
{
    $t = trim($line);
    if ($t === '') {
        return true;
    }
    if (strlen($t) <= 120 && preg_match('/^<\?xml\b/i', $t)) {
        return true;
    }
    if (preg_match('/^<\/?[a-z0-9:_-]+/i', $t) && preg_match('/xmlns|xmpmeta|rdf:|xpacket|dc:/i', $t)) {
        return true;
    }
    if (preg_match('/^\s*(\/Producer|\/Creator|\/Author|\/Title|\/Subject|\/Keywords|\/ModDate|\/CreationDate)\b/i', $t)) {
        return true;
    }
    if (preg_match('/^(creator|producer|author|title|subject|keywords)\s*:/i', $t)) {
        return true;
    }
    if (preg_match('/^\s*Language\s*:/i', $t)) {
        return true;
    }
    if (preg_match('/^\s*en-(?:PH|US|GB)\s*$/i', $t)) {
        return true;
    }
    if (strlen($t) < 80 && preg_match('/\b(xmp|metadata|pdf\/a|adobe)\b/i', $t)) {
        return true;
    }

    return false;
}

function quiz_gen_chunkHasLessonSignal(string $chunk): bool
{
    $chunk = quiz_gen_utf8_safe($chunk);
    if (preg_match('/[0-9]\s*[\+\-\*\/]\s*[0-9]/', $chunk)) {
        return true;
    }
    if (preg_match('/[+\-*\/=^]/', $chunk) && preg_match('/[0-9]/', $chunk)) {
        return true;
    }
    if (preg_match('/\b(equation|function|solve|graph|domain|range|formula|problem|example|activity|lesson|chapter|'
        . 'exercise|quadratic|linear|rational|fraction|percent|interest|matrix|probability|statistics|geometry)\b/i', $chunk)) {
        return true;
    }
    if (preg_match('/\b(what is|find the|compute|evaluate|determine|calculate|simplify|prove)\b/i', $chunk)) {
        return true;
    }
    foreach (preg_split("/\n/", $chunk) ?: [] as $ln) {
        $ln = trim($ln);
        if (strlen($ln) > 55 && preg_match('/[a-zA-Z]{8,}/', $ln) && preg_match('/[0-9]/', $ln)) {
            return true;
        }
    }

    return false;
}

/**
 * Skip leading lines that are mostly XML/metadata so "Start of PDF" is not only en-PH noise.
 */
function quiz_gen_trimLeadingLowSignalExcerpt(string $text): string
{
    $text = trim($text);
    if ($text === '') {
        return '';
    }
    $lines = preg_split("/\n/", $text) ?: [];
    $n = count($lines);
    if ($n < 8) {
        return $text;
    }
    $startIdx = 0;
    for ($i = 0; $i < min($n, 140); $i++) {
        $slice = implode("\n", array_slice($lines, $i, min(8, $n - $i)));
        if (quiz_gen_chunkHasLessonSignal($slice)) {
            $startIdx = $i;
            break;
        }
    }

    return trim(implode("\n", array_slice($lines, $startIdx)));
}

/**
 * Call after quiz_gen_extractPdfText / DB load and before segmentation + Groq.
 */
function quiz_gen_prepareLessonTextForQuizGeneration(string $text): string
{
    if ($text === '') {
        return '';
    }
    $text = quiz_gen_utf8_safe($text);
    $text = preg_replace('/\r\n?/', "\n", $text);
    $text = preg_replace('/<\?xpacket[^?]*\?>/i', "\n", $text);
    $text = preg_replace('/<x:xmpmeta\b[\s\S]*?<\/x:xmpmeta>/iu', "\n", $text);
    $text = preg_replace('/<rdf:RDF\b[\s\S]*?<\/rdf:RDF>/iu', "\n", $text);
    $text = preg_replace('/<metadata\b[\s\S]*?<\/metadata>/iu', "\n", $text);

    $lines = preg_split("/\n/", $text) ?: [];
    $kept = [];
    foreach ($lines as $line) {
        if (quiz_gen_lineLooksLikePdfStructuralNoise($line)) {
            continue;
        }
        $kept[] = $line;
    }
    $text = trim(implode("\n", $kept));
    $text = preg_replace("/\n{3,}/", "\n\n", $text);
    $text = quiz_gen_trimLeadingLowSignalExcerpt($text);

    return trim($text);
}
