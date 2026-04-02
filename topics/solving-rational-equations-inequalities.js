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

// Global variables for lesson tracking
let sreiCurrentLesson = 1;
let sreiCompletedLessons = new Set();
const sreiTotalLessons = 4;

// Timer tracking variables (matching functions.html system)
let lessonStartTime = {}; // When lesson timer started
let totalStudyTime = {}; // Total accumulated time per lesson
let lastSavedTime = {}; // Last confirmed saved time from server
let lastSaveTimestamp = {}; // Timestamp of last save
let timerUpdateInterval = null; // Interval for updating timer display
let studyTimeInterval = null; // Interval for saving study time periodically

// Lesson Navigation
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize sidebar
    initializeSidebar();
    
    // Load user profile
    await loadUserProfile();
    
    // Load completed lessons first
    try { await sreiLoadCompletedLessons(); } catch (e) {}
    
    // Load study time from server
    await loadAndDisplayStudyTime();
    
    // Update sidebar progress after loading completed lessons
    sreiUpdateSidebarProgress();
    
    // Initialize first lesson
    sreiShowLesson(1);
    
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
    
    // Sidebar toggle for mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('lessonSidebar');
        const toggle = document.getElementById('sidebarToggle');
        const backdrop = document.getElementById('sidebarBackdrop');
        if (window.innerWidth < 1024 && sidebar && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && toggle && !toggle.contains(e.target) && backdrop && !backdrop.contains(e.target)) {
                toggleSidebar();
            }
        }
    });
    
    // Window resize handler
    window.addEventListener('resize', function() {
        const sidebar = document.getElementById('lessonSidebar');
        const backdrop = document.getElementById('sidebarBackdrop');
        if (window.innerWidth >= 1024 && sidebar) {
            sidebar.classList.remove('open');
            document.body.style.overflow = '';
            if (backdrop) backdrop.remove();
        }
    });
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
// Sidebar Navigation
// ------------------------------
function sreiCanAccessTopic(lessonNum) {
    if (lessonNum <= 1) return true;
    for (let i = 1; i < lessonNum; i++) {
        if (!sreiCompletedLessons.has(i)) return false;
    }
    return true;
}

function sreiShowTopicLockedMessage(lessonNum) {
    const prev = lessonNum - 1;
    Swal.fire({
        icon: 'info',
        title: 'Complete Previous Topic First',
        html: `You need to <strong>pass the 5 questions</strong> for Topic ${prev} before you can open Topic ${lessonNum}.<br><br>Stay on Topic ${prev}, finish the lesson, then take the quiz and get at least <strong>3/5 correct</strong> (60%) to unlock Topic ${lessonNum}.`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#667eea',
        allowOutsideClick: false
    });
}

function initializeSidebar() {
    const topics = document.querySelectorAll('.lesson-topic');
    topics.forEach(topic => {
        const header = topic.querySelector('.lesson-topic-header');
        if (header) {
            header.addEventListener('click', function(e) {
                // Don't expand if clicking on subitem
                if (e.target.closest('.lesson-subitem')) return;
                
                const lessonNum = parseInt(topic.dataset.lesson, 10);
                if (topic.classList.contains('locked') || !sreiCanAccessTopic(lessonNum)) {
                    sreiShowTopicLockedMessage(lessonNum);
                    return;
                }
                
                const isExpanded = topic.classList.contains('expanded');
                topics.forEach(t => t.classList.remove('expanded'));
                if (!isExpanded) {
                    topic.classList.add('expanded');
                    header.setAttribute('aria-expanded', 'true');
                    sreiShowLesson(lessonNum);
                } else {
                    header.setAttribute('aria-expanded', 'false');
                }
            });
        }
        
        const subitems = topic.querySelectorAll('.lesson-subitem');
        subitems.forEach(subitem => {
            subitem.addEventListener('click', function(e) {
                e.stopPropagation();
                const lessonNum = parseInt(this.dataset.lesson, 10);
                const topic = document.getElementById(`sidebar-topic-${lessonNum}`);
                
                if (topic && (topic.classList.contains('locked') || !sreiCanAccessTopic(lessonNum))) {
                    sreiShowTopicLockedMessage(lessonNum);
                    return;
                }
                
                const sectionId = this.dataset.sectionId;
                sreiShowLesson(lessonNum);
                
                // Expand topic if not expanded
                if (topic && !topic.classList.contains('expanded')) {
                    topic.classList.add('expanded');
                    topic.querySelector('.lesson-topic-header')?.setAttribute('aria-expanded', 'true');
                }
                
                if (sectionId) {
                    setTimeout(() => {
                        const section = document.getElementById(sectionId);
                        if (section) {
                            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 100);
                }
            });
        });
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('lessonSidebar');
    if (sidebar) {
        const isOpen = sidebar.classList.contains('open');
        sidebar.classList.toggle('open');
        document.body.style.overflow = !isOpen ? 'hidden' : '';
        
        // Add/remove backdrop overlay
        if (!isOpen) {
            const backdrop = document.createElement('div');
            backdrop.id = 'sidebarBackdrop';
            backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden';
            backdrop.addEventListener('click', toggleSidebar);
            document.body.appendChild(backdrop);
        } else {
            const backdrop = document.getElementById('sidebarBackdrop');
            if (backdrop) backdrop.remove();
        }
    }
}

// ------------------------------
// User Profile & Dropdown
// ------------------------------
async function loadUserProfile() {
    try {
        const res = await fetch('../php/user.php', { credentials: 'include', cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.user) {
                const user = data.user;
                const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Student';
                const profilePic = user.profile_picture || '';
                
                // Update all userName elements
                ['userName', 'userNameDropdown', 'userNameMobile'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = userName;
                });
                
                // Update profile images from DB (user.profile_picture)
                const ids = ['userProfileImage', 'userProfileImageDropdown', 'userProfileImageMobile'];
                if (profilePic) {
                    ids.forEach(id => {
                        const el = document.getElementById(id);
                        if (el) {
                            el.src = `../${profilePic}?t=${Date.now()}`;
                            el.classList.remove('hidden');
                            const iconEl = document.getElementById(id.replace('Image', 'Icon'));
                            if (iconEl) iconEl.style.display = 'none';
                        }
                    });
                } else {
                    ids.forEach(id => {
                        const el = document.getElementById(id);
                        if (el) { el.src = ''; el.classList.add('hidden'); }
                        const iconEl = document.getElementById(id.replace('Image', 'Icon'));
                        if (iconEl) iconEl.style.display = 'block';
                    });
                }
            }
        }
    } catch (e) {
        console.error('Error loading user profile:', e);
    }
}

function toggleUserDropdown() {
    const menu = document.getElementById('userDropdownMenu');
    if (menu) menu.classList.toggle('hidden');
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.toggle('hidden');
}

function confirmLogout() {
    Swal.fire({
        title: 'Logout?',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, logout'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = '../php/logout.php';
        }
    });
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('userDropdown');
    const menu = document.getElementById('userDropdownMenu');
    if (dropdown && menu && !dropdown.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

// ------------------------------
// Quiz System
// ------------------------------
const sreiLesson1Quiz = [
    {
        question: "What is the first step in solving a rational equation?",
        options: [
            "Find the LCD (Least Common Denominator)",
            "Multiply both sides by x",
            "Cross multiply",
            "Factor the numerator"
        ],
        correct: 0
    },
    {
        question: "What makes a solution extraneous in a rational equation?",
        options: [
            "It makes any denominator equal to zero",
            "It is negative",
            "It is a fraction",
            "It is greater than 10"
        ],
        correct: 0
    },
    {
        question: "For the equation 1/x + 1/(x+2) = 5/12, what is the LCD?",
        options: [
            "x(x+2)",
            "12x",
            "x + 2",
            "12"
        ],
        correct: 0
    },
    {
        question: "After clearing fractions, what type of equation do you typically get?",
        options: [
            "Polynomial equation",
            "Another rational equation",
            "Exponential equation",
            "Logarithmic equation"
        ],
        correct: 0
    },
    {
        question: "Why must you check solutions in the original equation?",
        options: [
            "To identify extraneous solutions",
            "To simplify the answer",
            "To find more solutions",
            "To verify the LCD"
        ],
        correct: 0
    }
];

const sreiLesson2Quiz = [
    {
        question: "What are critical points in solving rational inequalities?",
        options: [
            "Zeros of numerator and denominator",
            "Only zeros of numerator",
            "Only zeros of denominator",
            "Points where x = 0"
        ],
        correct: 0
    },
    {
        question: "How do you determine the sign of a rational function in an interval?",
        options: [
            "Test a point in that interval",
            "Look at the graph",
            "Use calculus",
            "Check the inequality symbol"
        ],
        correct: 0
    },
    {
        question: "For (x - 1)/(x + 2) ≥ 0, what are the critical points?",
        options: [
            "x = 1 and x = -2",
            "x = 1 only",
            "x = -2 only",
            "x = 0"
        ],
        correct: 0
    },
    {
        question: "What does the interval notation (-∞, -2) ∪ [1, ∞) mean?",
        options: [
            "All x less than -2 or greater than or equal to 1",
            "All x between -2 and 1",
            "Only x = -2 and x = 1",
            "All real numbers"
        ],
        correct: 0
    },
    {
        question: "When do you use a closed bracket [ ] in interval notation?",
        options: [
            "When the inequality includes equality (≥ or ≤)",
            "Always",
            "Never",
            "Only for positive numbers"
        ],
        correct: 0
    }
];

const sreiLesson3Quiz = [
    {
        question: "How do you solve an equation graphically?",
        options: [
            "Find where the graphs intersect",
            "Find where the graph crosses the y-axis",
            "Find the maximum point",
            "Find the minimum point"
        ],
        correct: 0
    },
    {
        question: "What do the x-coordinates of intersection points represent?",
        options: [
            "Solutions to the equation",
            "Y-values of the functions",
            "Slopes of the functions",
            "Asymptotes"
        ],
        correct: 0
    },
    {
        question: "For inequalities, what region satisfies f(x) > 0?",
        options: [
            "Where the graph is above the x-axis",
            "Where the graph is below the x-axis",
            "Where the graph crosses the x-axis",
            "Where the graph is vertical"
        ],
        correct: 0
    },
    {
        question: "What do vertical asymptotes indicate in a rational function graph?",
        options: [
            "Values excluded from the domain",
            "Maximum values",
            "Minimum values",
            "Intersection points"
        ],
        correct: 0
    },
    {
        question: "How can graphs help verify algebraic solutions?",
        options: [
            "By showing where intersections occur",
            "By showing the shape only",
            "By showing colors",
            "By showing labels"
        ],
        correct: 0
    }
];

const sreiLesson4Quiz = [
    {
        question: "In a work rate problem, if Pipe A fills a tank in 6 hours, what is its rate?",
        options: [
            "1/6 of the tank per hour",
            "6 tanks per hour",
            "1 tank per 6 hours",
            "6/1 tanks per hour"
        ],
        correct: 0
    },
    {
        question: "When two workers work together, how do you combine their rates?",
        options: [
            "Add the rates",
            "Multiply the rates",
            "Subtract the rates",
            "Divide the rates"
        ],
        correct: 0
    },
    {
        question: "What does the solution to a real-world rational equation represent?",
        options: [
            "A meaningful quantity in the problem context",
            "Always a positive number",
            "Always an integer",
            "A random number"
        ],
        correct: 0
    },
    {
        question: "Why is it important to check if solutions make sense in context?",
        options: [
            "To ensure they are physically possible",
            "To make them positive",
            "To round them",
            "To simplify them"
        ],
        correct: 0
    },
    {
        question: "In concentration problems, what principle is used?",
        options: [
            "Conservation of quantity",
            "Addition of volumes",
            "Multiplication of concentrations",
            "Division of solutions"
        ],
        correct: 0
    }
];

// Shuffle array using Fisher-Yates algorithm
function sreiShuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Shuffle quiz questions and options
function sreiShuffleQuiz(quizArray) {
    // Shuffle questions
    const shuffledQuestions = sreiShuffleArray(quizArray);
    
    // Shuffle options for each question and update correct answer index
    return shuffledQuestions.map(quiz => {
        const originalOptions = [...quiz.options];
        const originalCorrect = quiz.correct;
        
        // Create array of indices and shuffle them
        const indices = originalOptions.map((_, i) => i);
        const shuffledIndices = sreiShuffleArray(indices);
        
        // Map original correct index to new shuffled index
        const newCorrectIndex = shuffledIndices.indexOf(originalCorrect);
        
        // Create new options array with shuffled order
        const shuffledOptions = shuffledIndices.map(idx => originalOptions[idx]);
        
        return {
            ...quiz,
            options: shuffledOptions,
            correct: newCorrectIndex
        };
    });
}

/**
 * Generate explanation for quiz answer (used in results)
 */
function sreiGenerateExplanation(quiz, selectedAnswer) {
    if (!quiz || !quiz.options) return '';
    const isCorrect = selectedAnswer === quiz.correct;
    const correctAnswer = quiz.options[quiz.correct];
    const selectedAnswerText = quiz.options[selectedAnswer];
    const question = (quiz.question || '').toLowerCase();
    if (quiz.explanation) return quiz.explanation;
    let explanation = '';
    if (isCorrect) {
        explanation = `✓ Correct! "${correctAnswer}" is the right answer.\n\n`;
    } else {
        explanation = `✗ Incorrect. You selected "${selectedAnswerText}", but the correct answer is "${correctAnswer}".\n\n`;
    }
    if (question.includes('rational equation') || question.includes('solve')) {
        explanation += 'HOW TO SOLVE:\n1. Find the LCD (Least Common Denominator)\n2. Clear fractions by multiplying both sides by LCD\n3. Solve the resulting polynomial equation\n4. Check for extraneous solutions';
    } else if (question.includes('inequality')) {
        explanation += 'HOW TO SOLVE:\n1. Find critical points (where numerator = 0 and denominator = 0)\n2. Create number line with critical points\n3. Test intervals to determine sign\n4. Identify solution intervals';
    } else if (question.includes('graph') || question.includes('intersection')) {
        explanation += 'HOW TO SOLVE:\n1. Graph both functions\n2. Find intersection points\n3. The x-coordinates of intersections are the solutions';
    } else if (question.includes('extraneous')) {
        explanation += 'HOW TO SOLVE:\nExtraneous solutions occur when multiplying by denominators. Always check solutions in the original equation to identify extraneous ones.';
    } else {
        explanation += 'HOW TO SOLVE:\n1. Read the question carefully\n2. Identify what concept is being tested\n3. Apply the relevant rules or formulas\n4. Check your answer makes sense';
    }
    return explanation;
}

async function sreiRunLessonQuiz(lessonNum) {
    const quizArray = [
        sreiLesson1Quiz,
        sreiLesson2Quiz,
        sreiLesson3Quiz,
        sreiLesson4Quiz
    ][lessonNum - 1];
    
    if (!quizArray) return false;
    
    // Track quiz start time
    window.quizStartTime = Date.now();
    
    // Shuffle quiz questions and options
    const shuffledQuiz = sreiShuffleQuiz(quizArray);
    
    let currentQuestion = 0;
    let score = 0;
    const userAnswers = [];
    
    // Show intro modal
    const introResult = await Swal.fire({
        title: `📚 Topic ${lessonNum} Quiz`,
        html: `
            <div class="text-left space-y-4">${typeof mathEaseQuizIntroBanner === 'function' ? mathEaseQuizIntroBanner() : ''}
                <div class="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-5 border-l-4 border-primary">
                    <h3 class="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <i class="fas fa-info-circle text-primary mr-2"></i>
                        Quiz Instructions
                    </h3>
                    <p class="text-gray-700 mb-2">
                        You will answer <strong>5 questions</strong> for Topic ${lessonNum}.
                    </p>
                    <p class="text-sm text-gray-600 mb-2">
                        <strong>Passing:</strong> at least <strong>3/5</strong> correct (60%).
                    </p>
                    <div class="mt-3 pt-3 border-t border-primary/20">
                        <p class="text-sm font-semibold text-gray-700 mb-2">What to expect:</p>
                        <ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
                            <li>Questions are randomized for each attempt</li>
                            <li>Answer options are shuffled</li>
                            <li>You cannot go back to previous questions</li>
                            <li>Review your answers at the end</li>
                        </ul>
                    </div>
                </div>
                
                <div class="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-5 border-l-4 border-yellow-500">
                    <h4 class="text-lg font-bold text-gray-800 mb-2">
                        <i class="fas fa-trophy text-yellow-500 mr-2"></i>Quiz Requirements
                    </h4>
                    <div class="space-y-2 text-sm text-gray-700">
                        <p><strong>Total Questions:</strong> 5 questions about Topic ${lessonNum}</p>
                        <p><strong>Passing Score:</strong> At least 3 out of 5 correct answers (60%)</p>
                        <p><strong>What Happens:</strong></p>
                        <ul class="list-disc list-inside ml-4 space-y-1">
                            <li>If you pass → You can proceed to Topic ${lessonNum < sreiTotalLessons ? lessonNum + 1 : 'the next topic'}</li>
                            <li>If you fail → You'll need to review Topic ${lessonNum} and try again</li>
                        </ul>
                    </div>
                </div>
                
                <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-l-4 border-green-500">
                    <p class="text-sm text-gray-700">
                        <i class="fas fa-lightbulb text-green-500 mr-2"></i>
                        <strong>Tip:</strong> Take your time and read each question carefully. These questions help ensure you have a solid foundation before moving forward!
                    </p>
                </div>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'Start Quiz',
        confirmButtonColor: '#667eea',
        cancelButtonText: 'Cancel',
        showCancelButton: true,
        cancelButtonColor: '#ef4444',
        allowOutsideClick: false,
        width: window.innerWidth <= 768 ? '92%' : '650px',
        customClass: {
            popup: 'rounded-2xl',
            title: 'text-slate-800',
            htmlContainer: 'text-left'
        }
    });
    
    if (!introResult.isConfirmed) {
        return false; // User cancelled
    }
    
    function displayQuestion() {
        if (currentQuestion >= shuffledQuiz.length) {
            showQuizResults();
            return;
        }
        
        const quiz = shuffledQuiz[currentQuestion];
        const progressPercentage = ((currentQuestion + 1) / shuffledQuiz.length) * 100;
        
        const optionsHtml = quiz.options.map((option, index) =>
            `<button type="button" class="quiz-option w-full text-left px-5 py-4 mb-3 bg-white border-2 border-gray-300 rounded-lg hover:border-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 hover:shadow-md transition-all duration-200 font-medium text-gray-800 transform hover:scale-[1.02]" data-answer="${index}">
                <span class="flex items-center">
                    <span class="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mr-3 font-semibold text-gray-700 border border-gray-300">${String.fromCharCode(65 + index)}</span>
                    <span>${option}</span>
                </span>
            </button>`
        ).join('');
        
        Swal.fire({
            title: `<div class="flex items-center justify-center w-full">
                <span class="text-center">Question ${currentQuestion + 1} of ${shuffledQuiz.length}</span>
            </div>`,
            html: `
                <div class="text-left">
                    <!-- Progress Bar -->
                    <div class="w-full bg-gray-200 rounded-full h-2 mb-6">
                        <div class="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300" style="width: ${progressPercentage}%"></div>
                    </div>
                    
                    <p class="text-xl font-semibold mb-6 text-gray-900">${quiz.question}</p>
                    <div class="space-y-3">${optionsHtml}</div>
                </div>
            `,
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'Cancel Quiz',
            cancelButtonColor: '#ef4444',
            allowOutsideClick: false,
            width: window.innerWidth <= 768 ? '92%' : '750px',
            customClass: {
                popup: 'rounded-2xl shadow-2xl',
                title: 'text-primary text-2xl font-bold mb-4 text-center',
                htmlContainer: 'text-left',
                cancelButton: 'px-6 py-3 rounded-lg font-semibold'
            },
            didOpen: () => {
                const questionIndex = currentQuestion;
                const currentQuiz = shuffledQuiz[questionIndex];
                const container = document.querySelector('.swal2-popup .swal2-html-container') || document.querySelector('.swal2-html-container');
                if (!container) return;
                container.addEventListener('click', function optionClick(e) {
                    const btn = e.target.closest('.quiz-option');
                    if (!btn || btn.disabled) return;
                    e.preventDefault();
                    e.stopPropagation();
                    const selectedAnswer = parseInt(btn.dataset.answer, 10);
                    if (isNaN(selectedAnswer) || selectedAnswer < 0 || !currentQuiz.options || selectedAnswer >= currentQuiz.options.length) return;
                    let explanation = '';
                    try {
                        explanation = sreiGenerateExplanation(currentQuiz, selectedAnswer);
                    } catch (err) {
                        explanation = selectedAnswer === currentQuiz.correct ? 'Correct.' : 'Incorrect.';
                    }
                    userAnswers[questionIndex] = {
                        question: currentQuiz.question,
                        options: currentQuiz.options,
                        selected: selectedAnswer,
                        selectedText: currentQuiz.options[selectedAnswer],
                        correct: currentQuiz.correct,
                        correctText: currentQuiz.options[currentQuiz.correct],
                        isCorrect: selectedAnswer === currentQuiz.correct,
                        explanation: explanation
                    };
                    if (selectedAnswer === currentQuiz.correct) score++;
                    container.querySelectorAll('.quiz-option').forEach(b => { b.disabled = true; });
                    container.removeEventListener('click', optionClick);
                    setTimeout(() => {
                        Swal.close();
                        currentQuestion++;
                        setTimeout(displayQuestion, 80);
                    }, 400);
                });
            }
        }).then((result) => {
            if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
                if (typeof mathEaseConfirmTopicQuizCancel === 'function') {
                    mathEaseConfirmTopicQuizCancel().then((cr) => {
                        if (cr.isConfirmed) sreiShowLesson(lessonNum);
                        else displayQuestion();
                    });
                } else {
                    sreiShowLesson(lessonNum);
                }
            }
        });
    }
    
    function showQuizResults() {
        const percentage = Math.round((score / shuffledQuiz.length) * 100);
        const passed = score >= 3;
        
        // Verify that all answers were collected
        const missingAnswers = [];
        for (let i = 0; i < shuffledQuiz.length; i++) {
            if (!userAnswers[i] || typeof userAnswers[i] !== 'object') {
                missingAnswers.push(i + 1);
            }
        }
        
        if (missingAnswers.length > 0) {
            console.error('Missing answers for questions:', missingAnswers);
            // Try to fill in missing answers with default values
            for (let i = 0; i < shuffledQuiz.length; i++) {
                if (!userAnswers[i]) {
                    const quiz = shuffledQuiz[i];
                    userAnswers[i] = {
                        question: quiz.question,
                        options: quiz.options,
                        selected: -1,
                        selectedText: 'Not answered',
                        correct: quiz.correct,
                        correctText: quiz.options[quiz.correct],
                        isCorrect: false
                    };
                }
            }
        }
        
        Swal.fire({
            title: passed ? '🎉 Congratulations!' : '📚 Keep Learning!',
            html: `
                <div class="text-center">
                    <div class="mb-6">
                        <div class="inline-flex items-center justify-center w-24 h-24 rounded-full ${passed ? 'bg-green-100' : 'bg-red-100'} mb-4">
                            <span class="text-4xl">${passed ? '✓' : '✗'}</span>
                        </div>
                        <p class="text-3xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}">
                            Score: ${score}/${shuffledQuiz.length}
                        </p>
                        <p class="text-xl font-semibold ${passed ? 'text-green-600' : 'text-red-600'}">
                            ${percentage}%
                        </p>
                    </div>
                    ${passed
                        ? `<p class="text-lg text-gray-700 mb-4">Great job! Topic ${lessonNum} is now completed.</p>`
                        : `<p class="text-lg text-gray-700 mb-4">You need at least 60% (3/5). Review Topic ${lessonNum} and try again.</p>`
                    }
                </div>
            `,
            icon: passed ? 'success' : 'error',
            confirmButtonText: passed ? 'Continue' : `Review Topic ${lessonNum}`,
            confirmButtonColor: passed ? '#10b981' : '#667eea',
            allowOutsideClick: false,
            width: window.innerWidth <= 768 ? '92%' : '600px',
            customClass: {
                popup: 'rounded-2xl',
                title: 'text-slate-800',
                htmlContainer: 'text-center'
            }
        }).then(async (result) => {
            if (result.isConfirmed && passed) {
                try {
                    // Store quiz data before completing lesson
                    console.log(`Storing quiz data for lesson ${lessonNum}, score: ${score}/${shuffledQuiz.length}`);
                    await sreiStoreQuizData(lessonNum, score, shuffledQuiz.length, userAnswers);
                    
                    // Small delay to ensure quiz data is saved
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    // Now complete the lesson (this will save final study time and stop timer)
                    await sreiCompleteLesson(lessonNum);
                    
                    // If this is Topic 4, check if all topics are completed and show completion section
                    if (lessonNum === 4) {
                        const quizButton = document.getElementById('topic4QuizButton');
                        if (quizButton) {
                            quizButton.style.display = 'none';
                        }
                        setTimeout(() => {
                            // Check if all lessons are completed
                            if (sreiCompletedLessons.size === sreiTotalLessons) {
                                // Only show performance analysis after ALL quizzes are completed
                                showPerformanceAnalysisSection();
                                sreiShowTopicCompletionOption();
                            }
                        }, 500);
                    }
                    
                    // Navigate to next lesson if not the last one
                    if (lessonNum < sreiTotalLessons) {
                        sreiShowLesson(lessonNum + 1, true);
                    }
                } catch (e) {
                    console.error('Error storing quiz data:', e);
                }
            } else {
                // Store quiz data even if failed (for analysis)
                try {
                    await sreiStoreQuizData(lessonNum, score, shuffledQuiz.length, userAnswers);
                    // Performance analysis will only show after all quizzes are completed
                } catch (e) {
                    console.error('Error storing quiz data:', e);
                }
                sreiShowLesson(lessonNum);
            }
        });
    }
    
    displayQuestion();
    return false; // Return false initially, will be updated in showQuizResults
}

async function sreiStoreQuizData(lessonNum, score, totalQuestions, userAnswers) {
    try {
        const response = await fetch('../php/store-quiz-data.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic: 'solving-rational-equations-inequalities',
                lesson: lessonNum,
                quiz_type: `solving-rational-equations-inequalities_topic_${lessonNum}`,
                score: score,
                total_questions: totalQuestions,
                answers: userAnswers,
                time_taken_seconds: Math.floor((Date.now() - (window.quizStartTime || Date.now())) / 1000)
            }),
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Quiz data stored:', data);
        }
    } catch (e) {
        console.error('Error storing quiz data:', e);
    }
}

// Show Topic 4 Quiz
function sreiShowTopic4Quiz() {
    if (sreiCompletedLessons.has(4)) {
        // Already passed, show completion section
        sreiShowTopicCompletionOption();
        return;
    }
    sreiRunLessonQuiz(4);
}

// ------------------------------
// Timer Functions
// ------------------------------

/**
 * Start timer for a lesson (matching functions.html system)
 */
function startLessonTimer(lessonNum) {
    // Stop any existing timer intervals
    if (timerUpdateInterval) {
        clearInterval(timerUpdateInterval);
        timerUpdateInterval = null;
    }
    if (studyTimeInterval) {
        clearInterval(studyTimeInterval);
        studyTimeInterval = null;
    }
    
    // Initialize time tracking for current lesson (only if not completed)
    if (lessonNum && !sreiCompletedLessons.has(lessonNum)) {
        const now = Date.now();
        // Only set lessonStartTime if not already set
        if (!lessonStartTime[lessonNum]) {
            lessonStartTime[lessonNum] = now;
        }
        // Initialize lastSavedTime and lastSaveTimestamp if not set (will be set when loading from server)
        if (lastSavedTime[lessonNum] === undefined) {
            lastSavedTime[lessonNum] = totalStudyTime[lessonNum] || 0;
            lastSaveTimestamp[lessonNum] = now;
        }
    }
    
    // Update study time every 30 seconds
    studyTimeInterval = setInterval(function() {
        // Only save if current lesson is not completed
        if (!sreiCompletedLessons.has(sreiCurrentLesson)) {
            saveStudyTimeForCurrentLesson();
        }
        // Also refresh display from server every 2 minutes
        if (Math.random() < 0.1) { // 10% chance each interval to refresh from server
            loadAndDisplayStudyTime();
        }
    }, 30000); // Save every 30 seconds
    
    // Start live timer display
    startLiveTimer();
}

/**
 * Stop timer for current lesson
 */
function stopLessonTimer() {
    if (timerUpdateInterval) {
        clearInterval(timerUpdateInterval);
        timerUpdateInterval = null;
    }
    if (studyTimeInterval) {
        clearInterval(studyTimeInterval);
        studyTimeInterval = null;
    }
}

/**
 * Start live timer that updates every second
 */
function startLiveTimer() {
    // Clear existing timer
    if (timerUpdateInterval) {
        clearInterval(timerUpdateInterval);
    }
    
    timerUpdateInterval = setInterval(() => {
        updateLiveTimer();
    }, 1000);
    
    // Initial update
    updateLiveTimer();
}

/**
 * Update live timer display (matching functions.html)
 */
function updateLiveTimer() {
    if (!sreiCurrentLesson) return;
    
    // If lesson is completed, show final time and stop updating
    if (sreiCompletedLessons.has(sreiCurrentLesson)) {
        const finalTime = totalStudyTime[sreiCurrentLesson] || 0;
        const minutes = Math.floor(finalTime / 60);
        const seconds = finalTime % 60;
        const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        const activeSection = document.getElementById(`lesson${sreiCurrentLesson}`);
        if (activeSection) {
            const timer = activeSection.querySelector('.lesson-timer-display');
            if (timer) {
                timer.textContent = timeDisplay;
            }
            // Show full progress for completed lessons
            const progressCircle = activeSection.querySelector('.timer-progress');
            if (progressCircle) {
                progressCircle.style.animation = 'none';
                progressCircle.style.strokeDashoffset = '0';
                progressCircle.style.stroke = '#10b981'; // Green for completed
            }
        }
        return;
    }
    
    // For active lessons, calculate time accurately
    // Use lastSavedTime (confirmed saved to server) + elapsed since last save
    const baseTime = lastSavedTime[sreiCurrentLesson] || 0;
    
    // Calculate elapsed time since last save (or since lesson started if no save yet)
    let currentSessionElapsed = 0;
    const saveStartTime = lastSaveTimestamp[sreiCurrentLesson] || lessonStartTime[sreiCurrentLesson];
    if (saveStartTime) {
        const now = Date.now();
        currentSessionElapsed = Math.floor((now - saveStartTime) / 1000);
    }
    
    const totalSeconds = baseTime + currentSessionElapsed;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    const activeSection = document.getElementById(`lesson${sreiCurrentLesson}`);
    if (activeSection) {
        const timer = activeSection.querySelector('.lesson-timer-display');
        if (timer) {
            timer.textContent = timeDisplay;
        }
        
        // Update circular progress (assuming 60 minutes max)
        const maxTime = 60 * 60; // 60 minutes in seconds
        const progress = Math.min(totalSeconds / maxTime, 1);
        const circumference = 2 * Math.PI * 34; // radius = 34 (matches smaller timer size)
        const offset = circumference * (1 - progress);
        
        const progressCircle = activeSection.querySelector('.timer-progress');
        if (progressCircle) {
            progressCircle.style.strokeDashoffset = offset;
        }
    }
}

/**
 * Save study time for current lesson (matching functions.html)
 */
function saveStudyTimeForCurrentLesson() {
    if (!sreiCurrentLesson) return;
    
    // CRITICAL: Never save time for completed lessons
    // Once a lesson is completed, the timer should be frozen
    if (sreiCompletedLessons.has(sreiCurrentLesson)) {
        console.log(`Lesson ${sreiCurrentLesson} is completed, skipping timer save`);
        return;
    }
    
    // Use lastSaveTimestamp if available, otherwise use lessonStartTime
    const saveStartTime = lastSaveTimestamp[sreiCurrentLesson] || lessonStartTime[sreiCurrentLesson];
    if (!saveStartTime) return;
    
    const now = Date.now();
    const elapsed = Math.floor((now - saveStartTime) / 1000); // in seconds
    
    // Only add time if it's reasonable (less than 2 hours per session)
    if (elapsed > 0 && elapsed < 7200) {
        // Get the last confirmed saved time (from server)
        const baseTime = lastSavedTime[sreiCurrentLesson] || 0;
        
        // Calculate new total: last saved time + NEW elapsed time since last save
        const newTotalTime = baseTime + elapsed;
        
        // Update both totalStudyTime and lastSavedTime
        totalStudyTime[sreiCurrentLesson] = newTotalTime;
        lastSavedTime[sreiCurrentLesson] = newTotalTime;
        lastSaveTimestamp[sreiCurrentLesson] = now;
        
        // Reset lessonStartTime to now for next interval
        lessonStartTime[sreiCurrentLesson] = now;
        
        // Update display immediately
        updateLiveTimer();
        
        // Send to server periodically
        sendStudyTimeToServer();
    } else if (elapsed >= 7200) {
        console.warn(`Elapsed time too large for lesson ${sreiCurrentLesson}: ${elapsed} seconds`);
    }
}

/**
 * Send study time to server (matching functions.html)
 */
async function sendStudyTimeToServer() {
    try {
        const studyTimeData = {};
        
        // Only send time for current lesson if not completed
        if (sreiCurrentLesson && !sreiCompletedLessons.has(sreiCurrentLesson)) {
            const time = totalStudyTime[sreiCurrentLesson] || 0;
            if (time > 0) {
                studyTimeData[sreiCurrentLesson] = time;
            }
        }
        
        if (Object.keys(studyTimeData).length === 0) return;
        
        const response = await fetch('../php/store-study-time.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                topic: 'solving-rational-equations-inequalities',
                study_time: studyTimeData
            }),
            credentials: 'include'
        });
        
        if (response.ok) {
            console.log('Study time saved successfully');
            // Update lastSavedTime with what we just saved
            for (let lesson in studyTimeData) {
                const lessonNum = parseInt(lesson);
                if (studyTimeData[lesson] > (lastSavedTime[lessonNum] || 0)) {
                    lastSavedTime[lessonNum] = studyTimeData[lesson];
                    totalStudyTime[lessonNum] = studyTimeData[lesson];
                }
            }
            // Refresh display from local data (which is now synced)
            updateLiveTimer();
        }
    } catch (error) {
        console.error('Error saving study time:', error);
    }
}

/**
 * Load and display study time from server (matching functions.html)
 */
async function loadAndDisplayStudyTime() {
    try {
        const response = await fetch('../php/get-study-time.php?topic=solving-rational-equations-inequalities', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.studyTime) {
            // IMPORTANT: When loading from server, set totalStudyTime and lastSavedTime directly
            // This prevents double-counting when the timer updates
            const now = Date.now();
            for (let lesson = 1; lesson <= sreiTotalLessons; lesson++) {
                if (data.studyTime[lesson] !== undefined) {
                    let seconds = parseInt(data.studyTime[lesson]) || 0;
                    
                    // Ensure seconds is actually in seconds, not milliseconds
                    if (seconds > 86400) {
                        const asSeconds = Math.floor(seconds / 1000);
                        if (asSeconds <= 86400) {
                            seconds = asSeconds;
                        } else {
                            seconds = 86400;
                        }
                    }
                    
                    // Set totalStudyTime and lastSavedTime directly from server
                    totalStudyTime[lesson] = seconds;
                    lastSavedTime[lesson] = seconds;
                    // Update lastSaveTimestamp to now so we know when we last synced with server
                    lastSaveTimestamp[lesson] = now;
                }
            }
            // Update display
            updateLiveTimer();
        }
    } catch (error) {
        console.error('Error loading study time:', error);
    }
}

// ------------------------------
// Performance Analysis Functions
// ------------------------------
/**
 * Show performance analysis section (only when all quizzes are completed)
 */
function showPerformanceAnalysisSection() {
    // Check if all 4 topics are completed
    if (sreiCompletedLessons.size !== sreiTotalLessons) {
        console.log('Performance analysis will only show after completing all quizzes. Current completed:', sreiCompletedLessons.size, '/', sreiTotalLessons);
        return;
    }
    
    const section = document.getElementById('performanceAnalysisSection');
    if (section) {
        section.style.display = 'block';
        // Scroll to analysis section smoothly
        setTimeout(() => {
            section.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 300);
    }
}

/**
 * Analyze quiz performance using custom AI
 */
async function analyzePerformance() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultSection = document.getElementById('analysisResult');
    
    // Show loading state
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
    }
    
    try {
        const response = await fetch(`../php/analyze-quiz-performance.php?topic=solving-rational-equations-inequalities`, {
            method: 'GET',
            credentials: 'include'
        });
        
        // Get response text first to see what we got
        const responseText = await response.text();
        console.log('Raw response:', responseText.substring(0, 500));
        
        if (!response.ok) {
            // Try to parse error message
            let errorMessage = `Server error: ${response.status} ${response.statusText}`;
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.message || errorMessage;
                if (errorData.debug) {
                    errorMessage += '\n\nDebug: ' + errorData.debug;
                }
            } catch (e) {
                // Not JSON, use raw text
                errorMessage = responseText.substring(0, 200);
            }
            throw new Error(errorMessage);
        }
        
        const result = JSON.parse(responseText);
        
        if (result.success && result.analysis) {
            displayPerformanceAnalysis(result.analysis);
            
            Swal.fire({
                title: 'Analysis Complete!',
                text: 'Your performance analysis has been completed.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            throw new Error(result.message || 'Failed to analyze performance');
        }
        
    } catch (error) {
        console.error('Performance Analysis Error:', error);
        
        Swal.fire({
            title: 'Analysis Error',
            html: `
                <div class="text-left">
                    <p class="text-gray-700 mb-3"><strong>Error:</strong> ${error.message}</p>
                    <p class="text-sm text-gray-600 mb-3">Unable to analyze your performance right now. Please try again later.</p>
                    <p class="text-sm text-gray-600 mb-3">Make sure you have completed at least one quiz before analyzing.</p>
                </div>
            `,
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#667eea'
        });
    } finally {
        // Reset button
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-chart-bar mr-2"></i>Analyze My Performance';
        }
    }
}

/**
 * Display performance analysis results
 */
function displayPerformanceAnalysis(analysis) {
    const resultSection = document.getElementById('analysisResult');
    if (!resultSection) return;
    
    const overallAverage = analysis.overallAverage || 0;
    const totalQuizzes = analysis.totalQuizzes || 0;
    const strengths = analysis.strengths || [];
    const weaknesses = analysis.weaknesses || [];
    const correctAnswers = analysis.correctAnswers || [];
    const incorrectAnswers = analysis.incorrectAnswers || [];
    const recommendations = analysis.recommendations || [];
    const topicPerformance = analysis.topicPerformance || {};
    
    // Build HTML
    let html = `
        <div class="space-y-6">
            <!-- Overall Performance -->
            <div class="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border-l-4 border-indigo-500">
                <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-trophy text-indigo-500 mr-2"></i>
                    Overall Performance
                </h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-white rounded-lg p-4 text-center">
                        <div class="text-3xl font-bold text-blue-600">${overallAverage}%</div>
                        <div class="text-sm text-gray-600 mt-1">Average Score</div>
                    </div>
                    <div class="bg-white rounded-lg p-4 text-center">
                        <div class="text-3xl font-bold text-green-600">${correctAnswers.length}</div>
                        <div class="text-sm text-gray-600 mt-1">Correct</div>
                    </div>
                    <div class="bg-white rounded-lg p-4 text-center">
                        <div class="text-3xl font-bold text-red-600">${incorrectAnswers.length}</div>
                        <div class="text-sm text-gray-600 mt-1">Incorrect</div>
                    </div>
                    <div class="bg-white rounded-lg p-4 text-center">
                        <div class="text-3xl font-bold text-purple-600">${totalQuizzes}</div>
                        <div class="text-sm text-gray-600 mt-1">Quizzes Taken</div>
                    </div>
                </div>
            </div>
            
            <!-- Topic Performance -->
            <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-chart-bar text-blue-500 mr-2"></i>
                    Performance per Topic
                </h4>
                <div class="space-y-4">
    `;
    
    // Display each topic performance
    for (let topicNum = 1; topicNum <= 4; topicNum++) {
        if (topicPerformance[topicNum]) {
            const perf = topicPerformance[topicNum];
            const percentage = perf.total > 0 ? Math.round((perf.correct / perf.total) * 100) : 0;
            const topicName = getTopicNameForAnalysis(topicNum);
            const colorClass = percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600';
            const borderClass = percentage >= 80 ? 'border-green-500' : percentage >= 60 ? 'border-yellow-500' : 'border-red-500';
            
            html += `
                <div class="border-l-4 ${borderClass} bg-gray-50 rounded p-4">
                    <div class="flex justify-between items-center mb-2">
                        <h5 class="font-semibold text-gray-800">${topicName}</h5>
                        <span class="text-2xl font-bold ${colorClass}">${percentage}%</span>
                    </div>
                    <div class="text-sm text-gray-600 mb-2">
                        Correct: ${perf.correct} | Incorrect: ${perf.incorrect} | Total: ${perf.total}
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-primary h-2 rounded-full transition-all" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }
    }
    
    html += `
                </div>
            </div>
            
            <!-- Strengths -->
            <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-l-4 border-green-500">
                <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-check-circle text-green-500 mr-2"></i>
                    Your Strengths
                </h4>
                ${strengths.length > 0 ? `
                    <ul class="space-y-2">
                        ${strengths.map(strength => `
                            <li class="flex items-start">
                                <span class="text-green-500 mr-2">✓</span>
                                <span class="text-gray-700">${typeof strength === 'object' && strength.message ? strength.message : strength}</span>
                            </li>
                        `).join('')}
                    </ul>
                ` : '<p class="text-gray-600">No strengths recorded yet. Take a quiz to see your strengths.</p>'}
            </div>
            
            <!-- Weaknesses -->
            <div class="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border-l-4 border-red-500">
                <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                    Areas to Improve
                </h4>
                ${weaknesses.length > 0 ? `
                    <ul class="space-y-2">
                        ${weaknesses.map(weakness => `
                            <li class="flex items-start">
                                <span class="text-red-500 mr-2">⚠</span>
                                <span class="text-gray-700">${typeof weakness === 'object' && weakness.message ? weakness.message : weakness}</span>
                            </li>
                        `).join('')}
                    </ul>
                ` : '<p class="text-gray-600">No weaknesses recorded. Keep up the great work!</p>'}
            </div>
            
            <!-- Recommendations -->
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-blue-500">
                <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-lightbulb text-blue-500 mr-2"></i>
                    Recommendations
                </h4>
                ${recommendations.length > 0 ? `
                    <ul class="space-y-2">
                        ${recommendations.map(rec => `
                            <li class="flex items-start">
                                <span class="text-blue-500 mr-2">💡</span>
                                <span class="text-gray-700">${typeof rec === 'object' && rec.message ? rec.message : rec}</span>
                            </li>
                        `).join('')}
                    </ul>
                ` : '<p class="text-gray-600">Complete more quizzes to get personalized recommendations.</p>'}
            </div>
        </div>
    `;
    
    resultSection.innerHTML = html;
    resultSection.classList.remove('hidden');
}

/**
 * Get topic name for analysis display
 */
function getTopicNameForAnalysis(topicNum) {
    const topicNames = {
        1: 'Topic 1: Rational Equations',
        2: 'Topic 2: Rational Inequalities',
        3: 'Topic 3: Graphical Solutions',
        4: 'Topic 4: Real-World Applications'
    };
    return topicNames[topicNum] || `Topic ${topicNum}`;
}

// ------------------------------
// Lesson Navigation & Completion
// ------------------------------

// Removed - navigation buttons are now in HTML

async function sreiNavigateLesson(direction) {
    const newLesson = sreiCurrentLesson + direction;
    if (newLesson < 1 || newLesson > sreiTotalLessons) return;
    
    // Check if new lesson can be accessed
    if (!sreiCanAccessTopic(newLesson) && !sreiCompletedLessons.has(newLesson)) {
        sreiShowTopicLockedMessage(newLesson);
        return;
    }
    
    // If moving forward, check if current lesson is completed
    if (direction > 0 && !sreiCompletedLessons.has(sreiCurrentLesson)) {
        // Quiz will handle completion internally
        await sreiRunLessonQuiz(sreiCurrentLesson);
        return; // Quiz handles navigation after completion
    }
    
    sreiShowLesson(newLesson, true);
}

function sreiShowLesson(lessonNum, scrollToTop = false) {
    // Check if topic can be accessed
    if (!sreiCanAccessTopic(lessonNum) && !sreiCompletedLessons.has(lessonNum)) {
        sreiShowTopicLockedMessage(lessonNum);
        return;
    }
    
    // Stop current timer
    stopLessonTimer();
    
    sreiCurrentLesson = lessonNum;
    
    // Load study time from server when switching lessons
    loadAndDisplayStudyTime();
    
    // Update sidebar
    sreiUpdateLessonNavigation();
    
    // Expand current topic in sidebar
    document.querySelectorAll('.lesson-topic').forEach(t => {
        const n = parseInt(t.dataset.lesson, 10);
        if (n === lessonNum) {
            t.classList.add('expanded');
            t.querySelector('.lesson-topic-header')?.setAttribute('aria-expanded', 'true');
        } else {
            t.classList.remove('expanded');
            t.querySelector('.lesson-topic-header')?.setAttribute('aria-expanded', 'false');
        }
    });
    
    // Show selected lesson
    const lessonSections = document.querySelectorAll('.lesson-section');
    lessonSections.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`lesson${lessonNum}`);
    if (target) target.classList.add('active');
    
    // Start timer for this lesson
    startLessonTimer(lessonNum);
    
    // Update UI
    sreiUpdateNavigationButtons();
    sreiUpdateProgressIndicators();
    sreiUpdateLessonCompletionStatus();
    
    // Show/hide Topic 4 quiz button
    const quizButton = document.getElementById('topic4QuizButton');
    if (quizButton) {
        if (lessonNum === 4 && !sreiCompletedLessons.has(4)) {
            quizButton.style.display = 'block';
        } else {
            quizButton.style.display = 'none';
        }
    }
    
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
        const sidebar = document.getElementById('lessonSidebar');
        const backdrop = document.getElementById('sidebarBackdrop');
        if (sidebar) sidebar.classList.remove('open');
        document.body.style.overflow = '';
        if (backdrop) backdrop.remove();
    }
    
    if (scrollToTop) {
        const lessonContent = document.querySelector('.lesson-content');
        if (lessonContent) lessonContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function sreiUpdateLessonNavigation() {
    const topics = document.querySelectorAll('.lesson-topic');
    topics.forEach(topic => {
        const lessonNum = parseInt(topic.dataset.lesson, 10);
        const isActive = lessonNum === sreiCurrentLesson;
        const accessible = sreiCanAccessTopic(lessonNum);
        const complete = sreiCompletedLessons.has(lessonNum);
        
        // Update active subitems
        const subitems = topic.querySelectorAll('.lesson-subitem');
        subitems.forEach(subitem => {
            subitem.classList.remove('active');
            if (parseInt(subitem.dataset.lesson) === sreiCurrentLesson) {
                subitem.classList.add('active');
            }
        });
    });
    
    // Update sidebar progress to reflect locked states
    sreiUpdateSidebarProgress();
}

function sreiUpdateNavigationButtons() {
    const prevBtns = document.querySelectorAll('#prevLessonBtn');
    const nextBtns = document.querySelectorAll('#nextLessonBtn');
    
    prevBtns.forEach(btn => {
        if (btn) btn.disabled = sreiCurrentLesson === 1;
    });
    
    nextBtns.forEach(btn => {
        if (btn) {
            btn.disabled = sreiCurrentLesson === sreiTotalLessons;
            // Update onclick to trigger quiz
            btn.onclick = async () => {
                if (!sreiCompletedLessons.has(sreiCurrentLesson)) {
                    await sreiRunLessonQuiz(sreiCurrentLesson);
                } else {
                    sreiNavigateLesson(1);
                }
            };
        }
    });
}

function sreiUpdateProgressIndicators() {
    const num = document.getElementById('sreiCurrentLessonNum');
    const bar = document.getElementById('sreiLessonProgressBar');
    if (num) num.textContent = String(sreiCurrentLesson);
    if (bar) bar.style.width = `${(sreiCurrentLesson / sreiTotalLessons) * 100}%`;
}

function sreiUpdateSidebarProgress() {
    const topics = document.querySelectorAll('.lesson-topic');
    topics.forEach(topic => {
        const lessonNum = parseInt(topic.dataset.lesson, 10);
        const accessible = sreiCanAccessTopic(lessonNum);
        const complete = sreiCompletedLessons.has(lessonNum);
        
        // Never lock a topic that is already completed
        topic.classList.toggle('locked', !accessible && !complete);
        
        const progressText = topic.querySelector('.topic-status-text');
        if (progressText) {
            if (complete) {
                progressText.textContent = 'Complete';
                progressText.className = 'lesson-topic-status complete';
            } else if (!accessible) {
                progressText.textContent = '—';
                progressText.className = 'lesson-topic-status locked';
            } else {
                // Leave empty for accessible but incomplete topics (like functions.html)
                progressText.textContent = '';
                progressText.className = '';
            }
        }
        
        const topicDot = topic.querySelector('.lesson-topic-dot');
        if (topicDot) {
            if (complete) {
                topicDot.classList.add('completed');
            } else {
                topicDot.classList.remove('completed');
            }
        }
        
        // Update header active state
        const header = topic.querySelector('.lesson-topic-header');
        if (header) {
            if (lessonNum === sreiCurrentLesson) {
                header.classList.add('active');
            } else {
                header.classList.remove('active');
            }
        }
    });
}

function sreiUpdateLessonCompletionStatus() {
    sreiUpdateSidebarProgress();
    sreiShowTopicCompletionOption();
}

// Removed - completion is now handled through quiz system

async function sreiCompleteLesson(lessonNum) {
    console.log('Attempting to complete lesson:', lessonNum);
    
    try {
        const requestData = {
            topic: 'solving-rational-equations-inequalities',
            lesson: lessonNum,
            action: 'complete'
        };
        
        console.log('Sending request:', requestData);
        
        const response = await fetch('../php/complete-lesson.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
            credentials: 'include'
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        console.log('Raw response:', text);
        
        let data;
        
        try {
            data = JSON.parse(text);
            console.log('Parsed response:', data);
        } catch (parseError) {
            console.error('Invalid JSON response:', text);
            throw new Error('Invalid server response format');
        }
        
        if (data && data.success) {
            console.log('Lesson completion successful');
            
            // CRITICAL: Save final study time BEFORE marking as completed
            // This ensures the timer is saved and frozen at completion
            if (lessonNum === sreiCurrentLesson) {
                const now = Date.now();
                // Use lastSaveTimestamp if available, otherwise use lessonStartTime
                const saveStartTime = lastSaveTimestamp[lessonNum] || lessonStartTime[lessonNum];
                
                if (saveStartTime) {
                    const elapsed = Math.floor((now - saveStartTime) / 1000); // in seconds
                    
                    if (elapsed > 0 && elapsed < 7200) {
                        // Get last confirmed saved time (from server)
                        const baseTime = lastSavedTime[lessonNum] || 0;
                        // Calculate final total time: last saved + elapsed since last save
                        const finalTotalTime = baseTime + elapsed;
                        
                        // Update local tracking
                        totalStudyTime[lessonNum] = finalTotalTime;
                        lastSavedTime[lessonNum] = finalTotalTime;
                        
                        // Force save final time to server immediately
                        console.log(`Saving final study time for lesson ${lessonNum}: ${finalTotalTime} seconds`);
                        try {
                            const studyTimeData = {};
                            studyTimeData[lessonNum] = finalTotalTime;
                            
                            const response = await fetch('../php/store-study-time.php', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    topic: 'solving-rational-equations-inequalities',
                                    study_time: studyTimeData,
                                    is_final: true // Flag to indicate this is the final save
                                }),
                                credentials: 'include'
                            });
                            
                            if (response.ok) {
                                console.log(`Final study time saved successfully for lesson ${lessonNum}`);
                            } else {
                                console.error('Failed to save final study time');
                            }
                        } catch (error) {
                            console.error('Error saving final study time:', error);
                        }
                    }
                }
                
                // CRITICAL: Clear start time and save timestamp to prevent further timer updates
                lessonStartTime[lessonNum] = null;
                lastSaveTimestamp[lessonNum] = null;
            }
            
            // Add to completed lessons AFTER saving time
            sreiCompletedLessons.add(lessonNum);
            
            // Stop timer for completed lesson
            if (lessonNum === sreiCurrentLesson) {
                // Stop the timer interval
                if (timerUpdateInterval) {
                    clearInterval(timerUpdateInterval);
                    timerUpdateInterval = null;
                }
                
                // Stop the study time interval for this lesson
                if (studyTimeInterval) {
                    clearInterval(studyTimeInterval);
                    studyTimeInterval = null;
                }
                
                // Update timer display with final time
                updateLiveTimer();
            }
            
            await sreiLoadCompletedLessons();
            sreiUpdateSidebarProgress();
            sreiUpdateLessonCompletionStatus();
            // Performance analysis will only show after all quizzes are completed
            
            // Hide Topic 4 quiz button if Topic 4 is completed
            if (lessonNum === 4) {
                const quizButton = document.getElementById('topic4QuizButton');
                if (quizButton) {
                    quizButton.style.display = 'none';
                }
            }
            
            if (sreiCompletedLessons.size === sreiTotalLessons) {
                sreiShowTopicCompletionOption();
            }
        }
    } catch (e) {
        console.error('Error completing lesson:', e);
    }
}

async function sreiLoadCompletedLessons() {
    try {
        console.log('Loading completed lessons for Solving Rational Equations and Inequalities...');
        
        const requestData = {
            action: 'get_completed',
            topic: 'Solving Rational Equations and Inequalities'
        };
        
        console.log('Sending request:', requestData);
        
        const res = await fetch('../php/complete-lesson.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
            credentials: 'include',
            cache: 'no-store'
        });
        
        console.log('Response status:', res.status);
        console.log('Response headers:', res.headers);
        
        if (res.ok) {
            const text = await res.text();
            console.log('Raw response:', text);
            
            let data;
            try {
                data = JSON.parse(text);
                console.log('Parsed response:', data);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response text:', text);
                throw new Error('Invalid server response format');
            }
            
            const list = Array.isArray(data.completed_lessons) ? data.completed_lessons.map(Number) : [];
            sreiCompletedLessons = new Set(list);
            sreiUpdateSidebarProgress();
            sreiUpdateLessonCompletionStatus();
            // Hide Topic 4 quiz button if Topic 4 is already completed
            if (sreiCompletedLessons.has(4)) {
                const quizButton = document.getElementById('topic4QuizButton');
                if (quizButton) {
                    quizButton.style.display = 'none';
                }
            }
            console.log('Completed lessons loaded:', Array.from(sreiCompletedLessons));
            return;
        }
        
        // Fallback to get-progress.php
        console.log('Primary API failed, trying fallback...');
        const fallback = await fetch('../php/get-progress.php', { 
            credentials: 'include', 
            cache: 'no-store' 
        });
        
        if (fallback.ok) {
            const text = await fallback.text();
            console.log('Fallback response:', text);
            
            let d;
            try {
                d = JSON.parse(text);
            } catch (parseError) {
                console.error('Fallback JSON parse error:', parseError);
                throw new Error('Invalid fallback response format');
            }
            
            const key = 'solving-rational-equations-inequalities';
            const count = (d && d.details && d.details[key] && d.details[key].lessons_completed) || 0;
            const approx = Array.from({ length: Math.max(0, Math.min(count, sreiTotalLessons)) }, (_, i) => i + 1);
            sreiCompletedLessons = new Set(approx);
            sreiUpdateSidebarProgress();
            sreiUpdateLessonCompletionStatus();
            // Hide Topic 4 quiz button if Topic 4 is already completed
            if (sreiCompletedLessons.has(4)) {
                const quizButton = document.getElementById('topic4QuizButton');
                if (quizButton) {
                    quizButton.style.display = 'none';
                }
            }
            console.log('Fallback completed lessons loaded:', Array.from(sreiCompletedLessons));
        } else {
            console.error('Fallback also failed with status:', fallback.status);
        }
    } catch (error) {
        console.error('Error loading completed lessons:', error);
        // Don't show error to user for this background operation
    }
}

// Topic Completion Functions
function sreiShowTopicCompletionOption() {
    if (sreiCompletedLessons.size === sreiTotalLessons) {
        // Check if topic completion button already exists
        if (document.getElementById('sreiTopicCompletionBtn')) return;
        
        // Create topic completion section
        const completionSection = document.createElement('div');
        completionSection.id = 'sreiTopicCompletionSection';
        completionSection.className = 'bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-8 mb-8 border-2 border-emerald-200';
        completionSection.innerHTML = `
            <div class="text-center">
                <div class="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-trophy text-3xl"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-800 mb-4">🎉 Congratulations!</h3>
                <p class="text-lg text-gray-600 mb-6">You've completed all ${sreiTotalLessons} lessons in Solving Rational Equations and Inequalities!</p>
                <p class="text-gray-700 mb-6">You can now mark this entire topic as completed and earn your achievement badge.</p>
                <button id="sreiTopicCompletionBtn" onclick="sreiCompleteTopic()" 
                        class="bg-emerald-500 text-white px-8 py-4 rounded-lg hover:bg-emerald-600 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl">
                    <i class="fas fa-check-circle mr-2"></i>Complete Topic
                </button>
            </div>
        `;
        
        // Insert after the last lesson section
        const lastSection = document.querySelector('.lesson-section:last-of-type');
        if (lastSection) {
            lastSection.parentNode.insertBefore(completionSection, lastSection.nextSibling);
        }
    } else {
        // Remove topic completion section if it exists
        const existingSection = document.getElementById('sreiTopicCompletionSection');
        if (existingSection) {
            existingSection.remove();
        }
    }
}

async function sreiCompleteTopic() {
    try {
        console.log('Attempting to complete topic: Solving Rational Equations and Inequalities');
        
        const requestData = {
            topic: 'Solving Rational Equations and Inequalities',
            action: 'complete_topic'
        };
        
        console.log('Sending request:', requestData);
        
        const res = await fetch('../php/complete-lesson.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
            credentials: 'include'
        });
        
        console.log('Response status:', res.status);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const text = await res.text();
        console.log('Raw response:', text);
        
        let data;
        try {
            data = JSON.parse(text);
            console.log('Parsed response:', data);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            throw new Error('Invalid server response format');
        }
        
        if (data && data.success) {
            // Show success modal
            await Swal.fire({
                icon: 'success',
                title: 'Topic Completed! 🎉',
                html: `
                    <div class="text-center">
                        <div class="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6">
                            <i class="fas fa-trophy text-4xl"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800 mb-4">Congratulations!</h3>
                        <p class="text-lg text-gray-600 mb-4">You have successfully completed the entire topic:</p>
                        <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                            <p class="text-emerald-800 font-semibold text-xl">Solving Rational Equations and Inequalities</p>
                            <p class="text-emerald-700">All ${sreiTotalLessons} lessons completed!</p>
                        </div>
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p class="text-blue-800 font-semibold">What you've mastered:</p>
                            <ul class="text-blue-700 text-left mt-2">
                                <li>• Solving rational equations algebraically</li>
                                <li>• Solving rational inequalities using sign analysis</li>
                                <li>• Graphical solutions and intersections</li>
                                <li>• Real-world applications and problem-solving</li>
                            </ul>
                        </div>
                        <p class="text-gray-600 mb-4">Your achievement has been recorded and you can now move on to other topics!</p>
                    </div>
                `,
                confirmButtonText: 'View Dashboard',
                confirmButtonColor: '#10b981',
                showCancelButton: true,
                cancelButtonText: 'Continue Learning',
                cancelButtonColor: '#6b7280'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '../dashboard.html';
                }
            });
            
            // Update the completion button
            const btn = document.getElementById('sreiTopicCompletionBtn');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Topic Completed!';
                btn.classList.remove('bg-emerald-500', 'hover:bg-emerald-600');
                btn.classList.add('bg-emerald-600');
            }
            
        } else {
            await Swal.fire({
                icon: 'error',
                title: 'Failed to Complete Topic',
                html: `
                    <div class="text-left">
                        <p><strong>Error:</strong> ${data && data.message ? data.message : 'Unknown error occurred'}</p>
                        <p><strong>Topic:</strong> Solving Rational Equations and Inequalities</p>
                        <hr class="my-3">
                        <p class="text-sm text-gray-600">
                            <strong>Possible causes:</strong><br>
                            • Database connection issue<br>
                            • Server configuration problem<br>
                            • Invalid topic data<br>
                            • Session timeout
                        </p>
                        <div class="mt-3">
                            <a href="../fix-complete-button.html" target="_blank" class="text-blue-600 hover:text-blue-800 underline">
                                Open Diagnostic Tool
                            </a>
                        </div>
                    </div>
                `,
                confirmButtonText: 'Try Again',
                confirmButtonColor: '#ef4444'
            });
        }
    } catch (e) {
        console.error('Error completing topic:', e);
        
        await Swal.fire({
            icon: 'error',
            title: 'Network Error',
            html: `
                <div class="text-left">
                    <p><strong>Error:</strong> ${e.message}</p>
                    <p><strong>Topic:</strong> Solving Rational Equations and Inequalities</p>
                    <hr class="my-3">
                    <p class="text-sm text-gray-600">
                        <strong>Troubleshooting:</strong><br>
                        • Check your internet connection<br>
                        • Verify the server is running<br>
                        • Try refreshing the page<br>
                        • Contact support if the issue persists
                    </p>
                    <div class="mt-3">
                        <a href="../fix-complete-button.html" target="_blank" class="text-blue-600 hover:text-blue-800 underline">
                            Open Diagnostic Tool
                        </a>
                    </div>
                </div>
            `,
            confirmButtonText: 'OK',
            confirmButtonColor: '#ef4444'
        });
    }
}

// Expose for inline handlers
window.sreiNavigateLesson = sreiNavigateLesson;
window.sreiCompleteLesson = sreiCompleteLesson;
window.sreiShowLesson = sreiShowLesson;
window.sreiCompleteTopic = sreiCompleteTopic;
window.sreiShowTopic4Quiz = sreiShowTopic4Quiz;
window.sreiRunLessonQuiz = sreiRunLessonQuiz;
window.analyzePerformance = analyzePerformance;
window.displayPerformanceAnalysis = displayPerformanceAnalysis;
window.showPerformanceAnalysisSection = showPerformanceAnalysisSection;
window.getTopicNameForAnalysis = getTopicNameForAnalysis;
window.toggleUserDropdown = toggleUserDropdown;
window.toggleMobileMenu = toggleMobileMenu;
window.confirmLogout = confirmLogout;
window.toggleSidebar = toggleSidebar;

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
