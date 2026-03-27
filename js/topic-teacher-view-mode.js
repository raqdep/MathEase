// Teacher view-only mode for topic pages.
// Enables lesson/quiz content preview while blocking quiz-taking actions.
(function () {
  'use strict';

  async function isTeacherSession() {
    try {
      const response = await fetch('../php/check-user-type.php', {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!response.ok) return false;
      const data = await response.json();
      return !!(data && data.success && data.user_type === 'teacher');
    } catch (_) {
      return false;
    }
  }

  function teacherViewRequested() {
    const params = new URLSearchParams(window.location.search);
    return params.get('teacher_view') === '1';
  }

  function isQuizQuestionArray(value) {
    return Array.isArray(value) && value.length > 0 && value.every((item) =>
      item && typeof item === 'object' && 'question' in item && 'options' in item && 'correct' in item
    );
  }

  function collectQuizArraysFromWindow() {
    const found = [];
    for (const key of Object.keys(window)) {
      try {
        const value = window[key];
        if (isQuizQuestionArray(value)) {
          found.push(...value);
        }
      } catch (_) {
        // Ignore cross-origin/window property access issues.
      }
    }
    return found;
  }

  function collectQuizArraysFromScripts() {
    const found = [];
    const scriptNodes = Array.from(document.querySelectorAll('script'));
    const quizDeclRegex = /(?:const|let|var)\s+([a-zA-Z0-9_]*quiz[a-zA-Z0-9_]*)\s*=\s*(\[[\s\S]*?\]);/gi;

    scriptNodes.forEach((node) => {
      const text = node.textContent || '';
      if (!text || !/quiz/i.test(text)) return;

      let match;
      while ((match = quizDeclRegex.exec(text)) !== null) {
        const arrayLiteral = match[2];
        try {
          const parsed = Function('"use strict"; return (' + arrayLiteral + ');')();
          if (isQuizQuestionArray(parsed)) {
            found.push(...parsed);
          }
        } catch (_) {
          // Ignore parse issues per declaration.
        }
      }
    });

    return found;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function normalizeCorrectLabel(question) {
    const options = Array.isArray(question.options) ? question.options : [];
    const correct = question.correct;
    if (typeof correct === 'number' && options[correct] != null) {
      return `${String.fromCharCode(65 + correct)}. ${escapeHtml(options[correct])}`;
    }
    if (typeof correct === 'string') {
      const trimmed = correct.trim();
      if (/^[a-d]$/i.test(trimmed)) {
        const idx = trimmed.toLowerCase().charCodeAt(0) - 97;
        if (options[idx] != null) {
          return `${trimmed.toUpperCase()}. ${escapeHtml(options[idx])}`;
        }
      }
      return escapeHtml(trimmed);
    }
    return 'N/A';
  }

  function renderAnswerKey(quizArray, lessonNum) {
    const questions = Array.isArray(quizArray) ? quizArray : [];
    if (!questions.length) {
      return `
        <div class="text-center py-6 text-slate-500">
          <i class="fas fa-book-open text-2xl mb-2"></i>
          <p>No quiz questions found for this lesson.</p>
        </div>
      `;
    }

    return `
      <div class="space-y-3 max-h-[62vh] overflow-y-auto pr-1 text-left">
        ${questions.map((q, idx) => `
          <div class="border border-slate-200 rounded-lg p-3 bg-white">
            <p class="text-sm font-semibold text-slate-900">
              ${idx + 1}. ${escapeHtml(q.question || 'Question')}
            </p>
            <div class="mt-2 space-y-1">
              ${(Array.isArray(q.options) ? q.options : []).map((opt, oIdx) => {
                const isCorrect = (typeof q.correct === 'number' && q.correct === oIdx) ||
                  (typeof q.correct === 'string' && q.correct.toLowerCase() === String.fromCharCode(97 + oIdx));
                return `
                  <div class="text-xs px-2 py-1 rounded border ${isCorrect ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200'}">
                    <span class="font-semibold">${String.fromCharCode(65 + oIdx)}.</span> ${escapeHtml(opt)}
                    ${isCorrect ? '<span class="ml-2 font-semibold">Correct</span>' : ''}
                  </div>
                `;
              }).join('')}
            </div>
            <p class="mt-2 text-xs font-semibold text-emerald-700">Answer: ${normalizeCorrectLabel(q)}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  function showTeacherPreview(quizArray, lessonNum) {
    const fallbackQuestions = [
      ...collectQuizArraysFromWindow(),
      ...collectQuizArraysFromScripts()
    ];
    const questions = Array.isArray(quizArray) && quizArray.length ? quizArray : fallbackQuestions;
    if (typeof Swal === 'undefined') {
      alert('Teacher preview mode: quiz taking is disabled.');
      return;
    }

    Swal.fire({
      title: `Topic ${lessonNum || ''} Quiz Preview`,
      html: `
        <div class="text-left mb-3 text-xs text-slate-600">
          Teacher view-only mode is active. Quiz attempts are disabled.
        </div>
        ${renderAnswerKey(questions, lessonNum)}
      `,
      width: '900px',
      showCloseButton: true,
      confirmButtonText: 'Close',
      confirmButtonColor: '#6366f1'
    });
  }

  function addTeacherViewBadge() {
    if (document.getElementById('teacher-view-mode-badge')) return;
    const badge = document.createElement('div');
    badge.id = 'teacher-view-mode-badge';
    badge.className = 'fixed top-3 right-3 z-[9999] px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow-lg';
    badge.textContent = 'Teacher View Mode';
    document.body.appendChild(badge);
  }

  function blockDirectQuizButtons() {
    const selectors = [
      "button[onclick*='runLessonQuiz']",
      "button[onclick*='startQuiz']",
      "button[onclick*='submitQuiz']",
      "button[onclick*='checkAnswer']",
      "button[onclick*='nextQuestion']",
      "button[onclick*='takeQuiz']",
      "a[onclick*='runLessonQuiz']",
      "a[onclick*='takeQuiz']"
    ];
    document.querySelectorAll(selectors.join(',')).forEach((el) => {
      el.setAttribute('data-teacher-quiz-blocked', '1');
      el.classList.add('opacity-60', 'cursor-not-allowed');
    });
  }

  function patchQuizRunners() {
    const patch = (name) => {
      const original = window[name];
      if (typeof original !== 'function') return;
      if (original.__teacherPatched) return;

      const wrapped = function (quizArray, lessonNum, onPassed) {
        showTeacherPreview(quizArray, lessonNum);
        return false;
      };
      wrapped.__teacherPatched = true;
      wrapped.__original = original;
      window[name] = wrapped;
    };

    ['runLessonQuiz', 'startQuiz', 'submitQuiz', 'openQuiz', 'takeQuiz', 'checkAnswer', 'nextQuestion'].forEach(patch);
  }

  function patchTopicAccessControls() {
    const simplePatch = (name, replacement) => {
      const original = window[name];
      if (typeof original !== 'function') return;
      if (original.__teacherPatched) return;
      const wrapped = replacement(original);
      wrapped.__teacherPatched = true;
      wrapped.__original = original;
      window[name] = wrapped;
    };

    simplePatch('canAccessTopic', () => function () {
      return true;
    });

    simplePatch('showTopicLockedMessage', () => function () {
      // In teacher mode, lock warnings are bypassed completely.
      return false;
    });
  }

  function directShowLesson(lessonNum) {
    const nextLesson = document.getElementById('lesson' + lessonNum);
    if (!nextLesson) return;

    document.querySelectorAll('.lesson-content.active').forEach((el) => el.classList.remove('active'));
    nextLesson.classList.add('active');

    document.querySelectorAll('.lesson-topic').forEach((topic) => {
      const n = parseInt(topic.getAttribute('data-lesson') || '0', 10);
      if (n === lessonNum) {
        topic.classList.add('active', 'expanded');
      } else {
        topic.classList.remove('active');
      }
      topic.classList.remove('locked');
    });
  }

  function unlockTeacherSidebarNavigation() {
    document.querySelectorAll('.lesson-topic.locked').forEach((node) => node.classList.remove('locked'));

    // Force teacher navigation to open lessons directly, bypassing local lock checks.
    document.querySelectorAll('.lesson-topic[data-lesson]').forEach((topic) => {
      topic.addEventListener('click', function (e) {
        if (!window.__teacherViewMode) return;
        if (e.target && e.target.closest && e.target.closest('.lesson-subitem')) return;
        const lessonNum = parseInt(topic.getAttribute('data-lesson') || '0', 10);
        if (!Number.isFinite(lessonNum) || lessonNum <= 0) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if (typeof window.showLesson === 'function') {
          window.showLesson(lessonNum);
          if (typeof window.setSidebarActive === 'function') {
            window.setSidebarActive(lessonNum, 'objective');
          }
        } else {
          directShowLesson(lessonNum);
        }
      }, true);
    });

    document.querySelectorAll('.lesson-subitem[data-lesson]').forEach((sub) => {
      sub.addEventListener('click', function (e) {
        if (!window.__teacherViewMode) return;
        const lessonNum = parseInt(sub.getAttribute('data-lesson') || '0', 10);
        const section = sub.getAttribute('data-section') || 'objective';
        if (!Number.isFinite(lessonNum) || lessonNum <= 0) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if (typeof window.showLesson === 'function') {
          window.showLesson(lessonNum);
          if (typeof window.setSidebarActive === 'function') {
            window.setSidebarActive(lessonNum, section);
          }
          const sectionId = sub.getAttribute('data-section-id');
          if (sectionId) {
            const target = document.getElementById(sectionId);
            if (target) {
              setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
            }
          }
        } else {
          directShowLesson(lessonNum);
        }
      }, true);
    });
  }

  function patchSwalQuizFlow() {
    if (!window.Swal || typeof window.Swal.fire !== 'function') return;
    if (window.Swal.fire.__teacherPatched) return;
    const originalFire = window.Swal.fire.bind(window.Swal);

    const wrappedFire = function (config) {
      if (!window.__teacherViewMode) {
        return originalFire(config);
      }

      const cfg = config && typeof config === 'object' ? config : {};
      const title = String(cfg.title || '').toLowerCase();
      const confirm = String(cfg.confirmButtonText || '').toLowerCase();
      const html = String(cfg.html || '').toLowerCase();

      const looksLikeInteractiveQuizModal =
        title.includes('question ') ||
        confirm.includes('start quiz') ||
        confirm.includes('submit') ||
        html.includes('cancel quiz') ||
        html.includes('next question');

      const looksLikeTopicLockModal =
        html.includes('pass the 5 questions') ||
        html.includes('unlock topic');

      if (looksLikeTopicLockModal) {
        return Promise.resolve({ isConfirmed: false, isDismissed: true, isDenied: false });
      }

      if (looksLikeInteractiveQuizModal) {
        const allQuestions = [
          ...collectQuizArraysFromWindow(),
          ...collectQuizArraysFromScripts()
        ];
        showTeacherPreview(allQuestions, '');
        return Promise.resolve({ isConfirmed: false, isDismissed: true, isDenied: false });
      }

      return originalFire(config);
    };

    wrappedFire.__teacherPatched = true;
    wrappedFire.__original = originalFire;
    window.Swal.fire = wrappedFire;
  }

  function attachCaptureGuard() {
    document.addEventListener('click', function (e) {
      const target = e.target && e.target.closest ? e.target.closest('button,a') : null;
      if (!target) return;
      const text = (target.textContent || '').toLowerCase();
      const onclick = (target.getAttribute('onclick') || '').toLowerCase();
      const looksLikeQuizAction =
        text.includes('start quiz') ||
        text.includes('take quiz') ||
        text.includes('submit quiz') ||
        text.includes('next question') ||
        text.includes('check answer') ||
        text.includes('start assessment') ||
        text.includes('submit assessment') ||
        text.includes('quiz') ||
        text.includes('assessment') ||
        onclick.includes('runlessonquiz') ||
        onclick.includes('startquiz') ||
        onclick.includes('submitquiz') ||
        onclick.includes('takequiz') ||
        onclick.includes('checkanswer') ||
        onclick.includes('nextquestion');

      if (looksLikeQuizAction) {
        e.preventDefault();
        e.stopImmediatePropagation();
        showTeacherPreview([], '');
      }
    }, true);
  }

  async function init() {
    const teacher = await isTeacherSession();
    if (!teacher) return;
    if (!teacherViewRequested()) {
      // Fallback: teachers in topic pages are always read-only even without query params.
      // This prevents accidental quiz attempts from old links.
    }

    window.__teacherViewMode = true;
    addTeacherViewBadge();
    blockDirectQuizButtons();
    patchQuizRunners();
    patchTopicAccessControls();
    unlockTeacherSidebarNavigation();
    patchSwalQuizFlow();
    attachCaptureGuard();

    // Re-run patches for scripts that attach functions later.
    setTimeout(() => {
      blockDirectQuizButtons();
      patchQuizRunners();
      patchTopicAccessControls();
      unlockTeacherSidebarNavigation();
      patchSwalQuizFlow();
    }, 500);
    setTimeout(() => {
      blockDirectQuizButtons();
      patchQuizRunners();
      patchTopicAccessControls();
      unlockTeacherSidebarNavigation();
      patchSwalQuizFlow();
    }, 1500);
    setInterval(() => {
      blockDirectQuizButtons();
      patchQuizRunners();
      patchTopicAccessControls();
      unlockTeacherSidebarNavigation();
      patchSwalQuizFlow();
    }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

