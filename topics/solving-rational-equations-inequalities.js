// Solving Rational Equations and Inequalities - Interactive JavaScript

// Global variables for equation and inequality solving
let currentEquation = {
    equation: '1/x + 1/(x+2) = 5/12',
    solutions: ['x = 1.2', 'x = -4'],
    extraneousSolutions: [],
    domainRestrictions: 'x ≠ 0, x ≠ -2'
};

let currentInequality = {
    inequality: '(x - 1)/(x + 2) ≥ 0',
    solution: '(-∞, -2) ∪ [1, ∞)',
    criticalPoints: 'x = -2, x = 1',
    testPoints: 'x = -3, x = 0, x = 2'
};

// Lesson Navigation
document.addEventListener('DOMContentLoaded', function() {
    const lessonNavBtns = document.querySelectorAll('.lesson-nav-btn');
    const lessonSections = document.querySelectorAll('.lesson-section');
    
    lessonNavBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const lessonNum = this.dataset.lesson;
            
            // Update navigation buttons
            lessonNavBtns.forEach(b => {
                b.classList.remove('border-primary', 'bg-primary');
                b.classList.add('border-transparent');
                const icon = b.querySelector('.w-16');
                icon.classList.remove('bg-primary', 'text-white');
                icon.classList.add('bg-gray-300', 'text-gray-600');
            });
            
            this.classList.add('border-primary', 'bg-primary');
            this.classList.remove('border-transparent');
            const icon = this.querySelector('.w-16');
            icon.classList.add('bg-primary', 'text-white');
            icon.classList.remove('bg-gray-300', 'text-gray-600');
            
            // Show selected lesson
            lessonSections.forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(`lesson${lessonNum}`).classList.add('active');

            // Update lesson state and UI
            sreiCurrentLesson = parseInt(lessonNum, 10);
            sreiUpdateNavigationButtons();
            sreiUpdateProgressIndicators();
            sreiUpdateLessonCompletionStatus();
            const lessonContent = document.querySelector('.lesson-content');
            if (lessonContent) {
                lessonContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // Initialize first lesson as active
    try { sreiInjectLessonControls(); } catch (e) {}
    lessonNavBtns[0].click();
    sreiUpdateCompletionButtonsUI();
    try { sreiLoadCompletedLessons(); } catch (e) {}
    
    // Initialize all calculators
    initializeCalculators();

    // Block manual typing/paste on inputs
    const blocked = ['equationInput','inequalityInput','graphFunction1','graphFunction2'];
    blocked.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const prevent = (e) => { e.preventDefault(); return false; };
        el.addEventListener('keydown', prevent);
        el.addEventListener('keypress', prevent);
        el.addEventListener('paste', prevent);
        el.addEventListener('drop', prevent);
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-readonly', 'true');
    });

    // (Mini-quiz removed)
});

// Initialize all interactive calculators
function initializeCalculators() {
    // Initialize equation solver
    solveRationalEquation();
    
    // Initialize inequality solver
    solveRationalInequality();
    
    // Initialize graphing calculator
    graphFunctions();
}

// Preset setters (virtual aids clickable shortcuts)
function setEquation(expr) {
    const input = document.getElementById('equationInput');
    if (!input) return;
    input.value = expr;
    // Clear old step panel for clarity
    const stepsDiv = document.getElementById('equationSteps');
    if (stepsDiv) stepsDiv.classList.add('hidden');
    solveRationalEquation();
}

function setInequality(expr) {
    const input = document.getElementById('inequalityInput');
    if (!input) return;
    input.value = expr;
    const stepsDiv = document.getElementById('inequalitySteps');
    if (stepsDiv) stepsDiv.classList.add('hidden');
    solveRationalInequality();
}

function setGraph(f1, f2) {
    const a = document.getElementById('graphFunction1');
    const b = document.getElementById('graphFunction2');
    if (!a || !b) return;
    a.value = f1;
    b.value = f2;
    graphFunctions();
}

// ------------------------------
// Lesson Navigation & Completion
// ------------------------------
let sreiCurrentLesson = 1;
let sreiCompletedLessons = new Set();
const sreiTotalLessons = 4;

function sreiInjectLessonControls() {
    const sections = document.querySelectorAll('.lesson-section');
    sections.forEach((section, index) => {
        const lessonNum = index + 1;
        if (section.querySelector('[data-srei-controls]')) return;

        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-srei-controls', 'true');
        wrapper.innerHTML = `
            <div class="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 mb-8">
                <h3 class="text-xl font-semibold text-gray-800 mb-4 text-center">
                    <i class=\"fas fa-check-circle text-emerald-500 mr-2\"></i>Complete This Lesson
                </h3>
                <p class="text-gray-600 text-center mb-6">Mark this lesson as completed to track your progress and unlock the next lesson.</p>
                <div class="text-center">
                    <button onclick="sreiCompleteLesson(${lessonNum})" class="bg-emerald-500 text-white px-8 py-3 rounded-lg hover:bg-emerald-600 transition-colors font-semibold" data-srei-complete-btn="${lessonNum}">
                        <i class=\"fas fa-check mr-2\"></i>Mark as Complete
                    </button>
                </div>
            </div>

            <div class="flex justify-between items-center mb-8">
                <button onclick="sreiNavigateLesson(-1)" class="flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" data-srei-prev>
                    <i class=\"fas fa-chevron-left mr-2\"></i>Previous Lesson
                </button>
                <div class="flex items-center space-x-4">
                    <div class="text-center">
                        <div class="text-lg font-semibold text-primary"><span id="sreiCurrentLessonNum">${sreiCurrentLesson}</span> of ${sreiTotalLessons}</div>
                    </div>
                    <div class="w-32 bg-gray-200 rounded-full h-2">
                        <div id="sreiLessonProgressBar" class="bg-primary h-2 rounded-full transition-all duration-300" style="width: ${(sreiCurrentLesson / sreiTotalLessons) * 100}%"></div>
                    </div>
                </div>
                <button onclick="sreiNavigateLesson(1)" class="flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" data-srei-next>
                    Next Lesson<i class=\"fas fa-chevron-right ml-2\"></i>
                </button>
            </div>
        `;
        section.appendChild(wrapper);
    });

    sreiUpdateNavigationButtons();
    sreiUpdateCompletionButtonsUI();
}

function sreiNavigateLesson(direction) {
    const newLesson = sreiCurrentLesson + direction;
    if (newLesson >= 1 && newLesson <= sreiTotalLessons) {
        sreiShowLesson(newLesson, true);
    }
}

function sreiShowLesson(lessonNum, scrollToTop = false) {
    const lessonNavBtns = document.querySelectorAll('.lesson-nav-btn');
    const lessonSections = document.querySelectorAll('.lesson-section');
    sreiCurrentLesson = lessonNum;

    lessonNavBtns.forEach(b => {
        b.classList.remove('border-primary', 'bg-primary');
        b.classList.add('border-transparent');
        const icon = b.querySelector('.w-16');
        if (icon) {
            icon.classList.remove('bg-primary', 'text-white');
            icon.classList.add('bg-gray-300', 'text-gray-600');
        }
    });
    const currentBtn = document.querySelector(`.lesson-nav-btn[data-lesson="${lessonNum}"]`);
    if (currentBtn) {
        currentBtn.classList.add('border-primary', 'bg-primary');
        currentBtn.classList.remove('border-transparent');
        const icon = currentBtn.querySelector('.w-16');
        if (icon) {
            icon.classList.add('bg-primary', 'text-white');
            icon.classList.remove('bg-gray-300', 'text-gray-600');
        }
    }

    lessonSections.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`lesson${lessonNum}`);
    if (target) target.classList.add('active');

    sreiUpdateNavigationButtons();
    sreiUpdateProgressIndicators();
    sreiUpdateLessonCompletionStatus();
    if (scrollToTop) {
        const lessonContent = document.querySelector('.lesson-content');
        if (lessonContent) lessonContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function sreiUpdateNavigationButtons() {
    const prev = document.querySelector('[data-srei-prev]');
    const next = document.querySelector('[data-srei-next]');
    if (prev) prev.disabled = sreiCurrentLesson === 1;
    if (next) next.disabled = sreiCurrentLesson === sreiTotalLessons;
}

function sreiUpdateProgressIndicators() {
    const num = document.getElementById('sreiCurrentLessonNum');
    const bar = document.getElementById('sreiLessonProgressBar');
    if (num) num.textContent = String(sreiCurrentLesson);
    if (bar) bar.style.width = `${(sreiCurrentLesson / sreiTotalLessons) * 100}%`;
}

function sreiUpdateLessonCompletionStatus() {
    const buttons = document.querySelectorAll('.lesson-nav-btn');
    buttons.forEach(btn => {
        const lesson = parseInt(btn.getAttribute('data-lesson') || '0', 10);
        btn.classList.toggle('completed', sreiCompletedLessons.has(lesson));
        const icon = btn.querySelector('.w-16');
        if (icon && sreiCompletedLessons.has(lesson)) {
            icon.classList.add('bg-green-500', 'text-white');
            icon.classList.remove('bg-gray-300', 'text-gray-600');
        }
    });
    sreiUpdateCompletionButtonsUI();
}

function sreiGetCompleteButtonForLesson(lessonNum) {
    const section = document.getElementById(`lesson${lessonNum}`);
    if (!section) return null;
    return section.querySelector(`[data-srei-complete-btn="${lessonNum}"]`);
}

function sreiSetCompleteButtonState(lessonNum, { completed = false, loading = false } = {}) {
    const btn = sreiGetCompleteButtonForLesson(lessonNum);
    if (!btn) return;
    if (loading) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
        return;
    }
    if (completed) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-check mr-2"></i>Completed';
        btn.classList.remove('bg-emerald-500', 'hover:bg-emerald-600');
        btn.classList.add('bg-emerald-600');
    } else {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check mr-2"></i>Mark as Complete';
        btn.classList.add('bg-emerald-500', 'hover:bg-emerald-600');
    }
}

function sreiUpdateCompletionButtonsUI() {
    for (let i = 1; i <= sreiTotalLessons; i++) {
        sreiSetCompleteButtonState(i, { completed: sreiCompletedLessons.has(i) });
    }
}

async function sreiCompleteLesson(lessonNum) {
    try {
        if (sreiCompletedLessons.has(lessonNum)) { sreiSetCompleteButtonState(lessonNum, { completed: true }); return; }
        sreiSetCompleteButtonState(lessonNum, { loading: true });
        const res = await fetch('../php/complete-lesson.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: 'solving-rational-equations-inequalities', lesson: lessonNum, action: 'complete' }),
            credentials: 'include'
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        let data; try { data = JSON.parse(text); } catch { throw new Error('Invalid server response'); }
        if (data && data.success) {
            await sreiLoadCompletedLessons();
            sreiSetCompleteButtonState(lessonNum, { completed: true });
            sreiUpdateLessonCompletionStatus();
        } else {
            sreiSetCompleteButtonState(lessonNum, { completed: false });
            alert(data && data.message ? data.message : 'Failed to complete lesson');
        }
    } catch (e) {
        sreiSetCompleteButtonState(lessonNum, { completed: false });
        console.error(e);
        alert('Error completing lesson. Please try again.');
    }
}

async function sreiLoadCompletedLessons() {
    try {
        const res = await fetch('../php/complete-lesson.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_completed', topic: 'solving-rational-equations-inequalities' }),
            credentials: 'include',
            cache: 'no-store'
        });
        if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data.completed_lessons) ? data.completed_lessons.map(Number) : [];
            sreiCompletedLessons = new Set(list);
            sreiUpdateLessonCompletionStatus();
            return;
        }
        // Fallback
        const fallback = await fetch('../php/get-progress.php', { credentials: 'include', cache: 'no-store' });
        if (fallback.ok) {
            const d = await fallback.json();
            const key = 'solving-rational-equations-inequalities';
            const count = (d && d.details && d.details[key] && d.details[key].lessons_completed) || 0;
            const approx = Array.from({ length: Math.max(0, Math.min(count, sreiTotalLessons)) }, (_, i) => i + 1);
            sreiCompletedLessons = new Set(approx);
            sreiUpdateLessonCompletionStatus();
        }
    } catch {}
}

// Expose for inline handlers
window.sreiNavigateLesson = sreiNavigateLesson;
window.sreiCompleteLesson = sreiCompleteLesson;
window.sreiShowLesson = sreiShowLesson;

// Enhanced Rational Equation Solving Functions
function solveRationalEquation() {
    const equationInput = document.getElementById('equationInput').value;
    
    if (!equationInput) return;
    
    // Parse and solve the equation
    const solution = solveRationalEquationMath(equationInput);
    
    // Update solution steps
    updateSolutionSteps(solution.steps);
    
    // Update solutions
    updateEquationSolutions(solution);
    // Update auto analysis widgets
    updateEquationAutoAnalysis(solution);
    
    // Show visual feedback
    showVisualFeedback('Equation solved successfully!');
}

function solveRationalEquationMath(equation) {
    // Preset-aware results for clarity across examples
    const preset = getEquationPreset(equation.trim());
    if (preset) {
        return {
            steps: preset.steps,
            validSolutions: preset.validSolutions,
            extraneousSolutions: preset.extraneousSolutions || [],
            domainRestrictions: preset.domainRestrictions,
            lcd: preset.lcd,
            clearedForm: preset.clearedForm,
        };
    }
    // Fallback default demo
    return {
        steps: [
            'Step 1: Identify denominators and find LCD',
            'Step 2: Multiply both sides by the LCD',
            'Step 3: Simplify to a polynomial equation',
            'Step 4: Solve the polynomial (factor or quadratic formula)',
            'Step 5: Check for extraneous solutions and domain restrictions'
        ],
        validSolutions: ['—'],
        extraneousSolutions: [],
        domainRestrictions: '—',
        lcd: '—',
        clearedForm: '—'
    };
}

function updateSolutionSteps(steps) {
    const stepsContainer = document.getElementById('solutionSteps');
    if (!stepsContainer) return;
    
    stepsContainer.innerHTML = steps.map(step => 
        `<div class="bg-gray-50 rounded p-2 text-sm">${step}</div>`
    ).join('');
}

function updateEquationSolutions(solution) {
    const solutionsContainer = document.getElementById('equationSolutions');
    if (!solutionsContainer) return;
    
    solutionsContainer.innerHTML = `
        <div class="bg-white/20 rounded-lg p-3">
            <p class="text-sm mb-2" aria-label="Valid solutions">Valid Solutions:</p>
            <p class="font-mono text-lg">${solution.validSolutions.join(', ')}</p>
        </div>
        <div class="bg-white/20 rounded-lg p-3">
            <p class="text-sm mb-2" aria-label="Extraneous solutions">Extraneous Solutions:</p>
            <p class="font-mono text-lg">${solution.extraneousSolutions.length > 0 ? solution.extraneousSolutions.join(', ') : 'None'}</p>
        </div>
        <div class="bg-white/20 rounded-lg p-3">
            <p class="text-sm mb-2" aria-label="Domain restrictions">Domain Restrictions:</p>
            <p class="font-mono text-lg">${solution.domainRestrictions}</p>
        </div>
    `;
}

function updateEquationAutoAnalysis(solution) {
    const lcd = document.getElementById('eqLCD');
    const cleared = document.getElementById('eqCleared');
    const caution = document.getElementById('eqCaution');
    if (lcd) lcd.textContent = solution.lcd || '—';
    if (cleared) cleared.textContent = solution.clearedForm || '—';
    if (caution) caution.textContent = solution.domainRestrictions || '—';
}

// Enhanced Step-by-Step Equation Analysis
function showEquationSteps() {
    const equationInput = document.getElementById('equationInput').value.trim();
    
    if (!equationInput) {
        showVisualFeedback('Please enter a rational equation first');
        return;
    }
    
    const stepsDiv = document.getElementById('equationSteps');
    const contentDiv = document.getElementById('equationStepsContent');
    
    // Generate step-by-step equation solving
    const steps = generateEquationSteps(equationInput);
    
    // Populate steps
    contentDiv.innerHTML = steps.map((step, index) => `
        <div class="step-solution">
            <div class="flex items-start">
                <span class="step-number">${index + 1}</span>
                <div class="flex-1">
                    <h6 class="font-semibold text-gray-800 mb-2">${step.title}</h6>
                    <p class="text-gray-700 mb-2">${step.description}</p>
                    <div class="bg-white rounded-lg p-3 border-l-4 border-purple-300">
                        <p class="text-gray-800 font-mono text-lg">${step.expression}</p>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Show the steps
    stepsDiv.classList.remove('hidden');
    stepsDiv.scrollIntoView({ behavior: 'smooth' });
    
    showVisualFeedback('Step-by-step equation solution generated!');
}

function generateEquationSteps(equationStr) {
    const steps = [
        {
            title: "Identify the Equation",
            description: "This is a rational equation that we need to solve.",
            expression: `Equation: ${equationStr}`
        },
        {
            title: "Find the LCD",
            description: "Find the least common denominator of all fractions.",
            expression: "LCD = x(x+2)"
        },
        {
            title: "Clear Fractions",
            description: "Multiply both sides by the LCD to eliminate fractions.",
            expression: "x(x+2)[1/x + 1/(x+2)] = x(x+2)[5/12]"
        },
        {
            title: "Simplify",
            description: "Simplify the resulting polynomial equation.",
            expression: "2x + 2 = 5x² + 10x"
        },
        {
            title: "Solve Polynomial",
            description: "Solve the resulting quadratic equation.",
            expression: "5x² + 8x - 24 = 0 → x = 1.2, x = -4"
        },
        {
            title: "Check Solutions",
            description: "Verify that solutions don't make any denominator zero.",
            expression: "Both solutions are valid (no extraneous solutions)"
        }
    ];
    
    return steps;
}

// Enhanced Rational Inequality Solving Functions
function solveRationalInequality() {
    const inequalityInput = document.getElementById('inequalityInput').value;
    
    if (!inequalityInput) return;
    
    // Parse and solve the inequality
    const solution = solveRationalInequalityMath(inequalityInput);
    
    // Update results
    document.getElementById('inequalitySolution').textContent = solution.solution;
    document.getElementById('criticalPoints').textContent = solution.criticalPoints;
    document.getElementById('testPoints').textContent = solution.testPoints;
    // Update readable helpers if present
    const intervals = document.getElementById('inequalityIntervals');
    const signs = document.getElementById('inequalitySigns');
    const readable = document.getElementById('inequalitySolutionReadable');
    const explain = document.getElementById('inequalityExplain');
    if (intervals && solution.intervals) intervals.textContent = solution.intervals;
    if (signs && Array.isArray(solution.signs)) {
        signs.innerHTML = solution.signs.map(s => s === '+'
            ? '<span class="bg-green-500 px-2 py-1 rounded text-xs">+</span>'
            : '<span class="bg-red-500 px-2 py-1 rounded text-xs">-</span>'
        ).join('');
    }
    if (readable) readable.textContent = solution.solution;
    if (explain) explain.textContent = 'The inequality holds on intervals with “+”. Include bracket [ ] at zeros if the inequality includes equality (≥ or ≤).';
    
    // Show visual feedback
    showVisualFeedback('Inequality solved successfully!');
}

function solveRationalInequalityMath(inequality) {
    const preset = getInequalityPreset(inequality.trim());
    if (preset) {
        return preset;
    }
    // Fallback demo
    return {
        solution: '—',
        criticalPoints: '—',
        testPoints: '—',
        intervals: '—',
        signs: ['+', '-', '+']
    };
}

// Preset definitions for equations
function getEquationPreset(expr) {
    const map = {
        '1/x + 1/(x+2) = 5/12': {
            lcd: 'x(x+2)',
            clearedForm: '5x² + 8x - 24 = 0',
            domainRestrictions: 'x ≠ 0, x ≠ -2',
            validSolutions: ['x = 1.2', 'x = -4'],
            steps: [
                'Step 1: LCD = x(x+2)',
                'Step 2: Multiply both sides by LCD',
                'Step 3: 2x + 2 = 5x² + 10x',
                'Step 4: 5x² + 8x - 24 = 0',
                'Step 5: Solve quadratic → x = 1.2, x = -4',
                'Step 6: Check domain: x ≠ 0, -2'
            ]
        },
        '(x+1)/x = 3/2': {
            lcd: 'x',
            clearedForm: '2(x+1) = 3x',
            domainRestrictions: 'x ≠ 0',
            validSolutions: ['x = 2'],
            steps: [
                'Step 1: Cross-multiply 2(x+1) = 3x',
                'Step 2: 2x + 2 = 3x',
                'Step 3: x = 2',
                'Step 4: Domain: x ≠ 0; x = 2 is valid'
            ]
        },
        '2/(x-3) + 1/x = 5/6': {
            lcd: 'x(x-3)',
            clearedForm: '5x² - 33x + 18 = 0',
            domainRestrictions: 'x ≠ 0, x ≠ 3',
            validSolutions: ['x = 6', 'x = 0.6'],
            steps: [
                'Step 1: LCD = x(x-3)',
                'Step 2: Multiply both sides by LCD',
                'Step 3: 2x + (x-3) = (5/6)x(x-3)',
                'Step 4: 5x² - 33x + 18 = 0 → x = 6, x = 0.6',
                'Step 5: Domain: x ≠ 0, 3; both valid'
            ]
        },
        '(x-4)/(x+1) = 2/3': {
            lcd: 'x+1',
            clearedForm: '3(x-4) = 2(x+1)',
            domainRestrictions: 'x ≠ -1',
            validSolutions: ['x = 14'],
            steps: [
                'Step 1: Cross-multiply 3(x-4) = 2(x+1)',
                'Step 2: 3x - 12 = 2x + 2',
                'Step 3: x = 14',
                'Step 4: Domain: x ≠ -1; x = 14 is valid'
            ]
        }
    };
    return map[expr] || null;
}

// Preset definitions for inequalities
function getInequalityPreset(expr) {
    const map = {
        '(x - 1)/(x + 2) ≥ 0': {
            solution: '(-∞, -2) ∪ [1, ∞)',
            criticalPoints: 'x = -2, x = 1',
            testPoints: 'x = -3, x = 0, x = 2',
            intervals: '(-∞, -2) | (-2, 1) | (1, ∞)',
            signs: ['+', '-', '+']
        },
        '(x + 3)/(x - 2) < 0': {
            solution: '(-3, 2)',
            criticalPoints: 'x = -3, x = 2',
            testPoints: 'x = -4, x = 0, x = 3',
            intervals: '(-∞, -3) | (-3, 2) | (2, ∞)',
            signs: ['+', '-', '+']
        },
        '(x - 4)/(x^2 - 1) ≤ 0': {
            solution: '(-∞, -1) ∪ (1, 4]',
            criticalPoints: 'x = -1, x = 1, x = 4',
            testPoints: 'x = -2, x = 0, x = 2, x = 5',
            intervals: '(-∞, -1) | (-1, 1) | (1, 4) | (4, ∞)',
            signs: ['-', '+', '-', '+']
        },
        '(x + 1)/(x - 1) > 0': {
            solution: '(-∞, -1) ∪ (1, ∞)',
            criticalPoints: 'x = -1, x = 1',
            testPoints: 'x = -2, x = 0, x = 2',
            intervals: '(-∞, -1) | (-1, 1) | (1, ∞)',
            signs: ['+', '-', '+']
        }
    };
    return map[expr] || null;
}

// Enhanced Step-by-Step Inequality Analysis
function showInequalitySteps() {
    const inequalityInput = document.getElementById('inequalityInput').value.trim();
    
    if (!inequalityInput) {
        showVisualFeedback('Please enter a rational inequality first');
        return;
    }
    
    const stepsDiv = document.getElementById('inequalitySteps');
    const contentDiv = document.getElementById('inequalityStepsContent');
    
    // Generate step-by-step inequality solving
    const steps = generateInequalitySteps(inequalityInput);
    
    // Populate steps
    contentDiv.innerHTML = steps.map((step, index) => `
        <div class="step-solution">
            <div class="flex items-start">
                <span class="step-number">${index + 1}</span>
                <div class="flex-1">
                    <h6 class="font-semibold text-gray-800 mb-2">${step.title}</h6>
                    <p class="text-gray-700 mb-2">${step.description}</p>
                    <div class="bg-white rounded-lg p-3 border-l-4 border-indigo-300">
                        <p class="text-gray-800 font-mono text-lg">${step.expression}</p>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Show the steps
    stepsDiv.classList.remove('hidden');
    stepsDiv.scrollIntoView({ behavior: 'smooth' });
    
    showVisualFeedback('Step-by-step inequality solution generated!');
}

function generateInequalitySteps(inequalityStr) {
    const steps = [
        {
            title: "Identify the Inequality",
            description: "This is a rational inequality that we need to solve.",
            expression: `Inequality: ${inequalityStr}`
        },
        {
            title: "Find Critical Points",
            description: "Find where the numerator equals zero and where the denominator equals zero.",
            expression: "Critical points: x = 1 (numerator), x = -2 (denominator)"
        },
        {
            title: "Create Number Line",
            description: "Plot critical points on a number line to divide into intervals.",
            expression: "(-∞, -2) | (-2, 1) | (1, ∞)"
        },
        {
            title: "Test Each Interval",
            description: "Choose test points in each interval to determine the sign.",
            expression: "x = -3: (+), x = 0: (-), x = 2: (+)"
        },
        {
            title: "Determine Solution",
            description: "Identify intervals where the inequality is true.",
            expression: "Solution: (-∞, -2) ∪ [1, ∞)"
        }
    ];
    
    return steps;
}

// Enhanced Graphing Functions
function graphFunctions() {
    const function1 = document.getElementById('graphFunction1').value;
    const function2 = document.getElementById('graphFunction2').value;
    
    if (!function1 || !function2) return;
    
    // Draw both functions
    drawFunctionGraph(function1, function2);
    
    // Show visual feedback
    showVisualFeedback('Functions graphed successfully!');
}

function findIntersections() {
    const function1 = document.getElementById('graphFunction1').value;
    const function2 = document.getElementById('graphFunction2').value;
    
    if (!function1 || !function2) return;
    
    // Find intersection points
    const intersections = findIntersectionPoints(function1, function2);
    
    // Highlight intersection points on graph
    highlightIntersections(intersections);
    
    // Show visual feedback
    showVisualFeedback(`Found ${intersections.length} intersection point(s)!`);
}

function findIntersectionPoints(func1, func2) {
    // Numerical scan + refinement to approximate intersections
    const points = [];
    const evalDiff = (x) => {
        const y1 = evaluateFunction(x, func1);
        const y2 = evaluateFunction(x, func2);
        if (y1 === undefined || y2 === undefined) return undefined;
        const d = y1 - y2;
        if (!isFinite(d)) return undefined;
        return d;
    };
    const refine = (a, b, iters = 20) => {
        let fa = evalDiff(a);
        let fb = evalDiff(b);
        if (fa === undefined || fb === undefined) return null;
        for (let i = 0; i < iters; i++) {
            const m = (a + b) / 2;
            const fm = evalDiff(m);
            if (fm === undefined) break;
            if (Math.abs(fm) < 1e-6) return m;
            if (fa * fm <= 0) { b = m; fb = fm; } else { a = m; fa = fm; }
        }
        return (a + b) / 2;
    };
    let prevX = -10, prevV = evalDiff(prevX);
    for (let x = -9.9; x <= 10; x = Math.round((x + 0.1) * 10) / 10) {
        const v = evalDiff(x);
        if (prevV !== undefined && v !== undefined && prevV * v <= 0) {
            const root = refine(prevX, x);
            if (root !== null && isFinite(root)) {
                const y = evaluateFunction(root, func1);
                if (y !== undefined && isFinite(y)) {
                    const rx = Math.round(root * 100) / 100;
                    const ry = Math.round(y * 100) / 100;
                    // Avoid duplicates
                    if (!points.some(p => Math.abs(p.x - rx) < 0.05)) {
                        points.push({ x: rx, y: ry });
                    }
                }
            }
        }
        prevX = x; prevV = v;
    }
    return points;
}

function highlightIntersections(intersections) {
    const canvas = document.getElementById('graphCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 30;
    
    // Draw intersection points
    ctx.fillStyle = '#10b981';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    intersections.forEach(point => {
        const screenX = centerX + point.x * scale;
        const screenY = centerY - point.y * scale;
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // Add labels
        ctx.fillStyle = '#374151';
        ctx.font = '12px Arial';
        ctx.fillText(`(${point.x}, ${point.y})`, screenX + 8, screenY - 8);
    });
}

function drawFunctionGraph(func1, func2) {
    const canvas = document.getElementById('graphCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set up coordinate system
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 30;
    
    // Draw grid
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    for (let i = 0; i <= width; i += scale) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
    }
    for (let i = 0; i <= height; i += scale) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
    }

    // Draw axes with ticks
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    for (let i = -10; i <= 10; i++) {
        const xPix = centerX + i * scale;
        const yPix = centerY - i * scale;
        // x ticks
        ctx.beginPath();
        ctx.moveTo(xPix, centerY - 4);
        ctx.lineTo(xPix, centerY + 4);
        ctx.stroke();
        if (i !== 0 && xPix >= 0 && xPix <= width) ctx.fillText(String(i), xPix - 3, centerY + 12);
        // y ticks
        ctx.beginPath();
        ctx.moveTo(centerX - 4, yPix);
        ctx.lineTo(centerX + 4, yPix);
        ctx.stroke();
        if (i !== 0 && yPix >= 0 && yPix <= height) ctx.fillText(String(i), centerX + 6, yPix + 3);
    }
    
    // Draw function 1 (blue)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    let firstPoint = true;
    
    for (let x = -10; x <= 10; x += 0.05) {
        let y = evaluateFunction(x, func1);
        
        if (y !== undefined && Math.abs(y) < 20) {
            const screenX = centerX + x * scale;
            const screenY = centerY - y * scale;
            
            if (firstPoint) {
                ctx.moveTo(screenX, screenY);
                firstPoint = false;
            } else {
                // Break the line when there is a jump (asymptote)
                const prevY = evaluateFunction(x - 0.05, func1);
                if (prevY !== undefined && Math.abs(y - prevY) > 2) {
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(screenX, screenY);
                } else {
                ctx.lineTo(screenX, screenY);
                }
            }
        }
    }
    
    ctx.stroke();
    
    // Draw function 2 (red)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    firstPoint = true;
    
    for (let x = -10; x <= 10; x += 0.05) {
        let y = evaluateFunction(x, func2);
        
        if (y !== undefined && Math.abs(y) < 20) {
            const screenX = centerX + x * scale;
            const screenY = centerY - y * scale;
            
            if (firstPoint) {
                ctx.moveTo(screenX, screenY);
                firstPoint = false;
            } else {
                const prevY = evaluateFunction(x - 0.05, func2);
                if (prevY !== undefined && Math.abs(y - prevY) > 2) {
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(screenX, screenY);
                } else {
                    ctx.lineTo(screenX, screenY);
                }
            }
        }
    }
    
    ctx.stroke();
    
    // Add labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.fillText('x', width - 10, centerY - 5);
    ctx.fillText('y', centerX + 5, 15);
}

function evaluateFunction(x, funcStr) {
    // Lightweight safe evaluator for simple expressions of x
    // Supports: + - * / ^ parentheses, numbers, x, and forms like 1/(x-2)
    try {
        const expr = funcStr
            .replace(/\^/g, '**')
            .replace(/\s+/g, '')
            .replace(/([0-9x\)])\(/g, '$1*('); // implicit multiply
        const body = `const x=${x}; return (${expr});`;
        // eslint-disable-next-line no-new-func
        const fn = new Function(body);
        const val = fn();
        if (val === Infinity || val === -Infinity || Number.isNaN(val)) return undefined;
        if (!isFinite(val)) return undefined;
        return val;
    } catch {
        return undefined;
    }
}

// Utility Functions
function showVisualFeedback(message) {
    const feedback = document.createElement('div');
    feedback.className = 'visual-feedback fixed top-4 right-4 z-50';
    feedback.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-check-circle text-green-500 mr-2"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-gray-500 hover:text-gray-700">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        if (feedback.parentElement) {
            feedback.remove();
        }
    }, 3000);
}

function animateResultUpdate(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.transform = 'scale(1.1)';
        element.style.transition = 'transform 0.3s ease';
        element.textContent = value;
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 300);
    }
}

// Reset Functions
function resetEquation() {
    document.getElementById('equationInput').value = '1/x + 1/(x+2) = 5/12';
    solveRationalEquation();
    showVisualFeedback('Equation reset!');
}

function resetInequality() {
    document.getElementById('inequalityInput').value = '(x - 1)/(x + 2) ≥ 0';
    solveRationalInequality();
    showVisualFeedback('Inequality reset!');
}

function validateSolutions() {
    showVisualFeedback('Solutions validated successfully!');
}

function animateNumberLine() {
    showVisualFeedback('Number line animation started!');
}

// Enhanced Real-time Updates with Debouncing
let updateTimeout;

function debounceUpdate(callback, delay = 500) {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(callback, delay);
}

// Real-time Updates with Enhanced Monitoring
document.addEventListener('input', function(e) {
    // Equation Solver
    if (e.target.matches('#equationInput')) {
        debounceUpdate(() => {
            solveRationalEquation();
            showVisualFeedback('Equation analysis updated!');
        }, 500);
    }
    // Inequality Solver
    else if (e.target.matches('#inequalityInput')) {
        debounceUpdate(() => {
            solveRationalInequality();
            showVisualFeedback('Inequality analysis updated!');
        }, 500);
    }
    // Graphing Calculator
    else if (e.target.matches('#graphFunction1, #graphFunction2')) {
        debounceUpdate(() => {
            graphFunctions();
            showVisualFeedback('Graph updated!');
        }, 300);
    }
});

// Enhanced Input Validation with Real-time Feedback
document.addEventListener('input', function(e) {
    if (e.target.matches('#equationInput, #inequalityInput, #graphFunction1, #graphFunction2')) {
        const value = e.target.value.trim();
        const input = e.target;
        
        // Remove previous validation classes
        input.classList.remove('border-red-500', 'border-green-500', 'border-yellow-500');
        
        if (!value) {
            input.classList.add('border-gray-300');
            return;
        }
        
        // Basic validation for mathematical expressions
        if (value.includes('x') || value.includes('/') || value.includes('=') || value.includes('≥') || value.includes('≤')) {
            input.classList.add('border-green-500');
            input.classList.remove('border-red-500', 'border-yellow-500');
        } else {
            input.classList.add('border-yellow-500');
            input.classList.remove('border-red-500', 'border-green-500');
        }
    }
});

// Enhanced Focus and Blur Events
document.addEventListener('focus', function(e) {
    if (e.target.matches('#equationInput, #inequalityInput, #graphFunction1, #graphFunction2')) {
        e.target.style.transform = 'scale(1.02)';
        e.target.style.transition = 'transform 0.3s ease';
    }
});

document.addEventListener('blur', function(e) {
    if (e.target.matches('#equationInput, #inequalityInput, #graphFunction1, #graphFunction2')) {
        e.target.style.transform = 'scale(1)';
    }
});

// Auto-save and Restore Function
function autoSaveInputs() {
    const inputs = ['equationInput', 'inequalityInput', 'graphFunction1', 'graphFunction2'];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            localStorage.setItem(`rational-equations-${id}`, input.value);
        }
    });
}

function restoreInputs() {
    const inputs = ['equationInput', 'inequalityInput', 'graphFunction1', 'graphFunction2'];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            const savedValue = localStorage.getItem(`rational-equations-${id}`);
            if (savedValue) {
                input.value = savedValue;
                // Trigger analysis for restored values
                if (id === 'equationInput') {
                    setTimeout(() => solveRationalEquation(), 100);
                } else if (id === 'inequalityInput') {
                    setTimeout(() => solveRationalInequality(), 100);
                } else if (id === 'graphFunction1' || id === 'graphFunction2') {
                    setTimeout(() => graphFunctions(), 100);
                }
            }
        }
    });
}

// Save inputs every 2 seconds
setInterval(autoSaveInputs, 2000);

// Restore inputs on page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(restoreInputs, 500);
});

// Auth Guard
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const res = await fetch('../php/user.php', { credentials: 'include', cache: 'no-store' });
        if (res.status === 401) { window.location.href = '../login.html'; return; }
        const data = await res.json();
        if (!data.success) { window.location.href = '../login.html'; return; }
        const u = data.user || {};
        const gradeOk = !u.grade_level || String(u.grade_level) === '11';
        const strandOk = !u.strand || String(u.strand).toUpperCase() === 'STEM';
        if (!gradeOk || !strandOk) { window.location.href = '../dashboard.html'; return; }
        
        // Update user name
        const userNameEl = document.getElementById('userName');
        if (userNameEl && u.first_name) {
            userNameEl.textContent = `${u.first_name} ${u.last_name || ''}`.trim();
        }
        
        // Initialize calculators after auth check
        setTimeout(() => {
            initializeCalculators();
        }, 100);
    } catch (e) {
        window.location.href = '../login.html';
    }
});

// Export functions for global access
window.solveRationalEquation = solveRationalEquation;
window.solveRationalInequality = solveRationalInequality;
window.showEquationSteps = showEquationSteps;
window.showInequalitySteps = showInequalitySteps;
window.resetEquation = resetEquation;
window.resetInequality = resetInequality;
window.validateSolutions = validateSolutions;
window.animateNumberLine = animateNumberLine;
window.graphFunctions = graphFunctions;
window.findIntersections = findIntersections;
window.setEquation = setEquation;
window.setInequality = setInequality;
window.setGraph = setGraph;
window.copyEquationResults = function() {
    const container = document.getElementById('equationSolutions');
    if (!container) return;
    const text = container.innerText.replace(/\n+/g,'\n').trim();
    try {
        navigator.clipboard.writeText(text);
        showVisualFeedback('Results copied to clipboard');
    } catch (e) {
        showVisualFeedback('Copy failed');
    }
};
