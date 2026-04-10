<?php
declare(strict_types=1);

/**
 * Groq instructions so teacher PDF lessons match built-in topic pages (e.g. topics/functions.html):
 * Tailwind utility classes + Font Awesome icons, white rounded cards, indigo accents.
 */

function get_teacher_lesson_html_template_instructions(string $lessonTitle): string
{
    $lessonTitle = trim($lessonTitle);
    if ($lessonTitle === '') {
        $lessonTitle = 'Lesson';
    }

    return <<<TEMPLATE

OUTPUT FORMAT (required — must match MathEase built-in topic lessons):

Return ONE HTML fragment only. Do NOT include <!DOCTYPE>, <html>, <head>, or <body>. Do NOT wrap the output in markdown code fences.

Use Tailwind CSS utility classes and Font Awesome 6 icons (class "fas fa-...") exactly like the built-in Grade 11 lessons.

Outer wrapper (always use this structure):
<div class="lesson-content">
  <section class="lesson-section active">
    <div class="bg-white rounded-2xl shadow-xl p-8 mb-8">
      <!-- Opening hero (same pattern as Topic 1 in built-in lessons) -->
      <div class="flex justify-between items-start mb-8">
        <div class="flex-1">
          <div class="w-20 h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center mb-4">
            <i class="fas fa-book-open text-3xl"></i>
          </div>
          <h2 class="text-3xl font-bold text-gray-800 mb-4">{$lessonTitle}</h2>
          <p class="text-lg text-gray-600 max-w-3xl mb-4">Brief one- or two-sentence overview of what students will learn (aligned to the topic and PDF).</p>
        </div>
      </div>

      <!-- For each major part (Introduction, Concept explanation, Step-by-step examples, Practice problems, Activities, Summary), use clear subheadings: -->
      <!-- h3 pattern: -->
      <h3 class="text-2xl font-bold text-gray-800 mb-4">
        <i class="fas fa-lightbulb text-amber-500 mr-2"></i>Section title here
      </h3>

      <!-- Prefer these content shells (pick what fits each section): -->
      <!-- Explanatory / narrative block: -->
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-8">
        <p class="text-gray-700 mb-4 leading-relaxed">...</p>
      </div>

      <!-- “Objectives / key ideas” style (matches Learning Objectives boxes): -->
      <div class="bg-blue-50 border-l-4 border-indigo-500 p-6 mb-8">
        <h4 class="text-xl font-semibold text-gray-800 mb-3">
          <i class="fas fa-target mr-2"></i>Optional subheading
        </h4>
        <ul class="space-y-2 text-gray-700">
          <li class="flex items-start"><i class="fas fa-check-circle text-green-500 mr-3 mt-1 flex-shrink-0"></i><span>...</span></li>
        </ul>
      </div>

      <!-- Concept cards / examples (matches nested white cards in built-in lessons): -->
      <div class="space-y-6 mb-8">
        <div class="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
          <h4 class="text-xl font-semibold text-gray-800 mb-3">
            <i class="fas fa-cogs text-indigo-500 mr-2"></i>Subtopic title
          </h4>
          <p class="text-gray-700 mb-4 leading-relaxed">...</p>
          <div class="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-500">
            <p class="text-sm text-gray-600 mb-1">Formula or definition label</p>
            <p class="text-lg font-mono text-indigo-700">...</p>
          </div>
        </div>
      </div>

      <!-- Step-by-step worked example (matches numbered orange steps in built-in lessons): -->
      <div class="bg-white rounded-lg p-6 shadow-lg mb-8">
        <h4 class="text-xl font-semibold text-gray-800 mb-4">
          <i class="fas fa-calculator text-orange-500 mr-2"></i>Worked example title
        </h4>
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <p class="text-lg font-semibold text-gray-800 mb-3">Problem statement</p>
          <div class="space-y-3">
            <div class="flex items-start">
              <span class="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm mr-3 flex-shrink-0">1</span>
              <span class="text-gray-700">Step explanation</span>
            </div>
            <div class="ml-11 text-gray-600 font-mono text-sm">equation or intermediate work</div>
          </div>
        </div>
        <div class="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
          <p class="text-sm text-gray-800"><strong>Answer:</strong> ...</p>
        </div>
      </div>

      <!-- Practice / Activities: group each item in a light card -->
      <div class="bg-white rounded-lg p-6 shadow-lg mb-8">
        <h4 class="text-xl font-semibold text-gray-800 mb-4">
          <i class="fas fa-pencil-alt text-purple-500 mr-2"></i>Practice problems or Activities
        </h4>
        <ol class="list-decimal list-inside space-y-6 text-gray-700">
          <li>
            <span class="font-medium">Problem text</span>
            <div class="mt-2 ml-4 pl-4 border-l-2 border-indigo-200 text-sm space-y-2">
              <p><strong>Solution:</strong> step-by-step</p>
              <p><strong>Answer:</strong> final result</p>
            </div>
          </li>
        </ol>
      </div>

      <!-- Summary (closing gradient panel): -->
      <div class="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-8 border border-indigo-100">
        <h3 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-flag-checkered text-indigo-600 mr-2"></i>Summary
        </h3>
        <ul class="space-y-2 text-gray-700">
          <li class="flex items-start"><i class="fas fa-check text-green-600 mr-2 mt-1"></i><span>...</span></li>
        </ul>
      </div>

    </div>
  </section>
</div>

Rules for the HTML:
- Use semantic sections inside the main white card so Introduction → Summary are visually distinct (headings + spacing mb-8).
- Put mathematical expressions in <span class="font-mono text-indigo-800 bg-gray-50 px-1 rounded">...</span> or in <pre class="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 overflow-x-auto"> for multi-line work.
- Do not include iframes, scripts, or external links unless essential; no video embeds unless the PDF clearly references one URL you repeat as a plain link.
- Keep all pedagogical content from your lesson inside this structure; do not omit sections for brevity.

TEMPLATE;
}

/**
 * Strip markdown fences; ensure lesson-content wrapper exists when the model returns partial HTML.
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

    if (stripos($html, 'lesson-content') !== false) {
        return $html;
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
