<?php
declare(strict_types=1);

/**
 * Post-process Groq lesson HTML: strip fences, wrap minimal semantic HTML for display/PDF.
 */

function finalize_teacher_lesson_html(string $html, string $lessonTitle): string
{
    $html = trim($html);
    if ($html === '') {
        return $html;
    }

    if (preg_match('/^```(?:html)?\s*\R(.*)\R```$/is', $html, $m)) {
        $html = trim($m[1]);
    }

    // Legacy: full built-in–style Tailwind blocks from older prompts
    if (stripos($html, 'lesson-content') !== false) {
        return $html;
    }

    // Minimal semantic HTML (h2 sections) — PDF-oriented module; no duplicate hero title
    if (preg_match('/<h2[\s>]/i', $html)) {
        return '<div class="teacher-lesson-pdf-module text-gray-800 leading-relaxed max-w-none space-y-6">'
            . $html
            . '</div>';
    }

    $safeTitle = htmlspecialchars($lessonTitle !== '' ? $lessonTitle : 'Lesson', ENT_QUOTES | ENT_HTML5, 'UTF-8');

    return <<<HTML
<div class="lesson-content">
  <section class="lesson-section active">
    <div class="bg-white rounded-2xl shadow-xl p-8 mb-8">
      <div class="flex justify-between items-start mb-8">
        <div class="flex-1">
          <div class="w-20 h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center mb-4">
            <i class="fas fa-book-open text-3xl"></i>
          </div>
          <h2 class="text-3xl font-bold text-gray-800 mb-4">{$safeTitle}</h2>
        </div>
      </div>
      <div class="text-gray-700 leading-relaxed space-y-4">
        {$html}
      </div>
    </div>
  </section>
</div>
HTML;
}
