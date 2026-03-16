// Representations of Rational Functions - Interactive JavaScript

// Global variables for lesson tracking
let rprfCurrentLesson = 1;
let rprfCompletedLessons = new Set();
const rprfTotalLessons = 4;

// Study time tracking (matching functions.html)
let rprfLessonStartTime = {};
let rprfTotalStudyTime = {}; // Track total time per lesson in seconds
let rprfLastSavedTime = {}; // Track last confirmed saved time from server (to prevent double counting)
let rprfLastSaveTimestamp = {}; // Track when we last saved (to calculate elapsed correctly)
let rprfStudyTimeInterval = null;
let rprfTimerUpdateInterval = null; // For live timer display

// Lesson Navigation
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize sidebar
    initializeSidebar();
    
    // Load user profile
    await loadUserProfile();
    
    // Load completed lessons first
    try { await rprfLoadCompletedLessons(); } catch (e) {}
    
    // Update sidebar progress after loading completed lessons
    rprfUpdateSidebarProgress();
    
    // Initialize first lesson
    rprfShowLesson(1);
    
    // Initialize all calculators
    initializeCalculators();

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
    
    // Track time when page is visible (matching functions.html)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            // Page became visible, resume tracking (only if lesson is not completed)
            if (rprfCurrentLesson && !rprfCompletedLessons.has(rprfCurrentLesson)) {
                const now = Date.now();
                // Only start/resume timer if not already started
                if (!rprfLessonStartTime[rprfCurrentLesson]) {
                    rprfLessonStartTime[rprfCurrentLesson] = now;
                }
                // Ensure lastSavedTime and lastSaveTimestamp are initialized
                if (rprfLastSavedTime[rprfCurrentLesson] === undefined) {
                    rprfLastSavedTime[rprfCurrentLesson] = rprfTotalStudyTime[rprfCurrentLesson] || 0;
                }
                if (!rprfLastSaveTimestamp[rprfCurrentLesson]) {
                    rprfLastSaveTimestamp[rprfCurrentLesson] = now;
                }
                rprfStartLiveTimer(); // Restart timer display
            } else if (rprfCurrentLesson && rprfCompletedLessons.has(rprfCurrentLesson)) {
                // Just update display for completed lesson (don't start timer)
                rprfUpdateLiveTimer();
            }
        } else {
            // Page hidden, save current time (only if lesson is not completed)
            if (rprfCurrentLesson && !rprfCompletedLessons.has(rprfCurrentLesson)) {
                rprfSaveStudyTimeForCurrentLesson();
            }
            // Stop timer display
            if (rprfTimerUpdateInterval) {
                clearInterval(rprfTimerUpdateInterval);
                rprfTimerUpdateInterval = null;
            }
        }
    });
    
    // Save study time before page unload
    window.addEventListener('beforeunload', function() {
        if (rprfCurrentLesson && !rprfCompletedLessons.has(rprfCurrentLesson)) {
            rprfSaveStudyTimeForCurrentLesson();
            // Send final time to server
            rprfSendStudyTimeToServer();
        }
    });
});

// ------------------------------
// Quiz System
// ------------------------------
const rprfLesson1Quiz = [
    {
        question: "What is a rational function?",
        options: [
            "A function that can be expressed as the ratio of two polynomial functions",
            "A function that contains only integers",
            "A function that is always positive",
            "A function with no restrictions"
        ],
        correct: 0
    },
    {
        question: "What is the general form of a rational function?",
        options: [
            "f(x) = P(x)/Q(x) where Q(x) ≠ 0",
            "f(x) = P(x) + Q(x)",
            "f(x) = P(x) - Q(x)",
            "f(x) = P(x) × Q(x)"
        ],
        correct: 0
    },
    {
        question: "What values are excluded from the domain of a rational function?",
        options: [
            "Values that make the denominator equal to zero",
            "Values that make the numerator equal to zero",
            "Negative values",
            "Values greater than 10"
        ],
        correct: 0
    },
    {
        question: "For f(x) = (x + 1)/(x - 2), what is the domain?",
        options: [
            "All real numbers except x = 2",
            "All real numbers except x = -1",
            "All real numbers",
            "Only positive numbers"
        ],
        correct: 0
    },
    {
        question: "What creates vertical asymptotes in a rational function?",
        options: [
            "Values that make the denominator zero",
            "Values that make the numerator zero",
            "The degree of the numerator",
            "The constant term"
        ],
        correct: 0
    }
];

const rprfLesson2Quiz = [
    {
        question: "What is the first step in graphing a rational function?",
        options: [
            "Find vertical asymptotes by setting denominator equal to zero",
            "Find the y-intercept",
            "Plot random points",
            "Find the x-intercepts"
        ],
        correct: 0
    },
    {
        question: "How do you find horizontal asymptotes?",
        options: [
            "Compare the degrees of numerator and denominator polynomials",
            "Set the numerator equal to zero",
            "Find where x = 0",
            "Use the quadratic formula"
        ],
        correct: 0
    },
    {
        question: "What happens when the degree of the numerator is less than the degree of the denominator?",
        options: [
            "Horizontal asymptote at y = 0",
            "No horizontal asymptote",
            "Horizontal asymptote at y = 1",
            "Oblique asymptote"
        ],
        correct: 0
    },
    {
        question: "How do you find x-intercepts of a rational function?",
        options: [
            "Set the numerator equal to zero",
            "Set the denominator equal to zero",
            "Set x = 0",
            "Find the maximum value"
        ],
        correct: 0
    },
    {
        question: "What does a vertical asymptote represent?",
        options: [
            "A line that the graph approaches but never crosses",
            "A point where the function equals zero",
            "The maximum value of the function",
            "The minimum value of the function"
        ],
        correct: 0
    }
];

const rprfLesson3Quiz = [
    {
        question: "How do you find vertical asymptotes?",
        options: [
            "Set the denominator equal to zero and solve",
            "Set the numerator equal to zero and solve",
            "Find where the function equals zero",
            "Use the quadratic formula"
        ],
        correct: 0
    },
    {
        question: "When do you have a horizontal asymptote at y = 0?",
        options: [
            "When the degree of numerator < degree of denominator",
            "When the degree of numerator = degree of denominator",
            "When the degree of numerator > degree of denominator",
            "Always"
        ],
        correct: 0
    },
    {
        question: "What is the horizontal asymptote when degrees are equal?",
        options: [
            "y = ratio of leading coefficients",
            "y = 0",
            "No horizontal asymptote",
            "y = 1"
        ],
        correct: 0
    },
    {
        question: "How do you find the y-intercept of a rational function?",
        options: [
            "Evaluate f(0)",
            "Set the numerator equal to zero",
            "Set the denominator equal to zero",
            "Find the maximum value"
        ],
        correct: 0
    },
    {
        question: "What happens when both numerator and denominator are zero at the same point?",
        options: [
            "There may be a hole instead of an asymptote",
            "There is always an asymptote",
            "The function is undefined",
            "The function equals zero"
        ],
        correct: 0
    }
];

const rprfLesson4Quiz = [
    {
        question: "In which field are rational functions commonly used?",
        options: [
            "All of the above",
            "Physics (electrical resistance)",
            "Economics (average cost)",
            "Engineering (control systems)"
        ],
        correct: 0
    },
    {
        question: "What does the average cost function AC(x) = C(x)/x represent?",
        options: [
            "Cost per unit produced",
            "Total cost",
            "Fixed cost",
            "Variable cost"
        ],
        correct: 0
    },
    {
        question: "In parallel resistance, what is the formula for total resistance?",
        options: [
            "1/R_total = 1/R₁ + 1/R₂ + 1/R₃",
            "R_total = R₁ + R₂ + R₃",
            "R_total = R₁ × R₂ × R₃",
            "R_total = (R₁ + R₂ + R₃)/3"
        ],
        correct: 0
    },
    {
        question: "Why are domain restrictions important in real-world applications?",
        options: [
            "They represent physical limitations or constraints",
            "They make calculations easier",
            "They are not important",
            "They only apply to theoretical problems"
        ],
        correct: 0
    },
    {
        question: "What does a rational function model in market share problems?",
        options: [
            "The relationship between advertising expenditure and market share",
            "The total sales",
            "The profit margin",
            "The production cost"
        ],
        correct: 0
    }
];

// ------------------------------
// Sidebar Navigation
// ------------------------------
function rprfCanAccessTopic(lessonNum) {
    if (lessonNum <= 1) return true;
    for (let i = 1; i < lessonNum; i++) {
        if (!rprfCompletedLessons.has(i)) return false;
    }
    return true;
}

function rprfShowTopicLockedMessage(lessonNum) {
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
                if (e.target.closest('.lesson-subitem')) return;
                const lessonNum = parseInt(topic.dataset.lesson, 10);
                if (topic.classList.contains('locked') || !rprfCanAccessTopic(lessonNum)) {
                    rprfShowTopicLockedMessage(lessonNum);
                    return;
                }
                const isExpanded = topic.classList.contains('expanded');
                topics.forEach(t => t.classList.remove('expanded'));
                if (!isExpanded) {
                    topic.classList.add('expanded');
                    header.setAttribute('aria-expanded', 'true');
                    rprfShowLesson(lessonNum);
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
                if (!rprfCanAccessTopic(lessonNum)) {
                    rprfShowTopicLockedMessage(lessonNum);
                    return;
                }
                const sectionId = this.dataset.sectionId;
                rprfShowLesson(lessonNum);
                const topicEl = document.getElementById(`sidebar-topic-${lessonNum}`);
                if (topicEl && !topicEl.classList.contains('expanded')) {
                    topicEl.classList.add('expanded');
                    topicEl.querySelector('.lesson-topic-header')?.setAttribute('aria-expanded', 'true');
                }
                if (sectionId) {
                    setTimeout(() => {
                        const section = document.getElementById(sectionId);
                        if (section) {
                            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 100);
                }
                if (window.innerWidth < 1024) {
                    const sidebar = document.getElementById('lessonSidebar');
                    if (sidebar) sidebar.classList.remove('open');
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
        
        const backdrop = document.getElementById('sidebarBackdrop');
        if (!isOpen) {
            if (!backdrop) {
                const newBackdrop = document.createElement('div');
                newBackdrop.id = 'sidebarBackdrop';
                newBackdrop.className = 'mobile-backdrop';
                newBackdrop.addEventListener('click', toggleSidebar);
                document.body.appendChild(newBackdrop);
            }
        } else {
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
                
                ['userName', 'userNameDropdown', 'userNameMobile'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = userName;
                });
                
                if (profilePic) {
                    ['userProfileImage', 'userProfileImageDropdown', 'userProfileImageMobile'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) {
                            el.src = `../${profilePic}`;
                            el.classList.remove('hidden');
                            const iconId = id.replace('Image', 'Icon');
                            const iconEl = document.getElementById(iconId);
                            if (iconEl) iconEl.style.display = 'none';
                        }
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

function rprfInjectLessonControls() {
    const sections = document.querySelectorAll('.lesson-section');
    sections.forEach((section, index) => {
        const lessonNum = index + 1;
        if (section.querySelector('[data-rprf-controls]')) return;

        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-rprf-controls', 'true');
        wrapper.innerHTML = `
            <div class="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 mb-8">
                <h3 class="text-xl font-semibold text-gray-800 mb-4 text-center">
                    <i class="fas fa-check-circle text-emerald-500 mr-2"></i>Complete This Lesson
                </h3>
                <p class="text-gray-600 text-center mb-6">Mark this lesson as completed to track your progress and unlock the next lesson.</p>
                <div class="text-center">
                    <button onclick="rprfCompleteLesson(${lessonNum})" class="bg-emerald-500 text-white px-8 py-3 rounded-lg hover:bg-emerald-600 transition-colors font-semibold" data-rprf-complete-btn="${lessonNum}">
                        <i class="fas fa-check mr-2"></i>Mark as Complete
                    </button>
                </div>
            </div>

            <div class="flex justify-between items-center mb-8">
                <button onclick="rprfNavigateLesson(-1)" class="flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" data-rprf-prev>
                    <i class="fas fa-chevron-left mr-2"></i>Previous Lesson
                </button>
                <div class="flex items-center space-x-4">
                    <div class="text-center">
                        <div class="text-lg font-semibold text-primary"><span id="rprfCurrentLessonNum">${rprfCurrentLesson}</span> of ${rprfTotalLessons}</div>
                    </div>
                    <div class="w-32 bg-gray-200 rounded-full h-2">
                        <div id="rprfLessonProgressBar" class="bg-primary h-2 rounded-full transition-all duration-300" style="width: ${(rprfCurrentLesson / rprfTotalLessons) * 100}%"></div>
                    </div>
                </div>
                <button onclick="rprfNavigateLesson(1)" class="flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" data-rprf-next>
                    Next Lesson<i class="fas fa-chevron-right ml-2"></i>
                </button>
            </div>
        `;

        section.appendChild(wrapper);
    });

    rprfUpdateNavigationButtons();
}

async function rprfNavigateLesson(direction) {
    const newLesson = rprfCurrentLesson + direction;
    if (newLesson < 1 || newLesson > rprfTotalLessons) return;
    
    // If moving forward, check if current lesson is completed
    if (direction > 0 && !rprfCompletedLessons.has(rprfCurrentLesson)) {
        const passed = await rprfRunLessonQuiz(rprfCurrentLesson);
        if (!passed) {
            return; // Don't proceed if quiz not passed
        }
    }
    
    // Check if the new lesson is accessible before showing it
    if (!rprfCanAccessTopic(newLesson)) {
        rprfShowTopicLockedMessage(newLesson);
        return;
    }
    
    rprfShowLesson(newLesson, true);
}

async function rprfShowLesson(lessonNum, scrollToTop = false) {
    // Check if the lesson is accessible
    if (!rprfCanAccessTopic(lessonNum)) {
        rprfShowTopicLockedMessage(lessonNum);
        return;
    }
    
    // Save time for previous lesson
    if (rprfCurrentLesson && rprfCurrentLesson !== lessonNum) {
        rprfSaveStudyTimeForCurrentLesson();
    }
    
    const lessonSections = document.querySelectorAll('.lesson-section');
    rprfCurrentLesson = lessonNum;
    lessonSections.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`lesson${lessonNum}`);
    if (target) {
        target.classList.add('active');
    }
    
    // Start tracking for new lesson - only if not completed
    if (!rprfCompletedLessons.has(lessonNum)) {
        // Only reset start time if we don't have accumulated time yet
        if (!rprfLessonStartTime[lessonNum]) {
            rprfLessonStartTime[lessonNum] = Date.now();
        }
    } else {
        // If lesson is completed, clear start time to prevent timer from running
        rprfLessonStartTime[lessonNum] = null;
        // Ensure timer is stopped for completed lessons
        if (rprfTimerUpdateInterval) {
            clearInterval(rprfTimerUpdateInterval);
            rprfTimerUpdateInterval = null;
        }
    }
    
    // Load and display study time for this lesson first (to ensure we have the data)
    await rprfLoadAndDisplayStudyTime();
    
    // Ensure timer container is visible for this lesson
    const section = document.getElementById(`lesson${lessonNum}`);
    if (section) {
        const timerContainer = section.querySelector('.flex-shrink-0.ml-6');
        if (timerContainer) {
            // Remove 'hidden' class to ensure visibility on desktop
            timerContainer.classList.remove('hidden');
            timerContainer.style.display = 'flex';
            timerContainer.style.visibility = 'visible';
        }
    }
    
    // Start/restart live timer display (will show final time if completed, but won't update)
    rprfStartLiveTimer();
    
    // Show/hide Topic 4 quiz button
    const topic4QuizButton = document.getElementById('topic4QuizButton');
    if (topic4QuizButton) {
        if (lessonNum === 4 && !rprfCompletedLessons.has(4)) {
            topic4QuizButton.style.display = 'block';
        } else {
            topic4QuizButton.style.display = 'none';
        }
    }
    
    rprfUpdateNavigationButtons();
    rprfUpdateProgressIndicators();
    rprfUpdateSidebarProgress();
    setSidebarActive(lessonNum, 'objective');
    
    if (scrollToTop) {
        const lessonMain = document.querySelector('.lesson-main');
        if (lessonMain) lessonMain.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function setSidebarActive(lessonNum, section) {
    document.querySelectorAll('.lesson-subitem').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.dataset.lesson) === lessonNum && item.dataset.section === section) {
            item.classList.add('active');
        }
    });
    
    document.querySelectorAll('.lesson-topic-header').forEach(header => {
        header.classList.remove('active');
        const topic = header.closest('.lesson-topic');
        if (topic && parseInt(topic.dataset.lesson) === lessonNum) {
            header.classList.add('active');
        }
    });
}

// ------------------------------
// Quiz System
// ------------------------------
// Shuffle array using Fisher-Yates algorithm
function rprfShuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Shuffle quiz questions and options
function rprfShuffleQuiz(quizArray) {
    // Shuffle questions
    const shuffledQuestions = rprfShuffleArray(quizArray);
    
    // Shuffle options for each question and update correct answer index
    return shuffledQuestions.map(quiz => {
        const originalOptions = [...quiz.options];
        const originalCorrect = quiz.correct;
        
        // Create array of indices and shuffle them
        const indices = originalOptions.map((_, i) => i);
        const shuffledIndices = rprfShuffleArray(indices);
        
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
function rprfGenerateExplanation(quiz, selectedAnswer) {
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
    
    if (question.includes('rational function') || question.includes('domain')) {
        explanation += 'HOW TO SOLVE:\nRational functions are fractions. The denominator cannot be zero. Find what makes the denominator = 0; that value is NOT allowed in the domain.';
    } else if (question.includes('asymptote')) {
        explanation += 'HOW TO SOLVE:\nVertical asymptotes occur where the denominator equals zero. Horizontal asymptotes depend on the degrees of numerator and denominator polynomials.';
    } else if (question.includes('graph') || question.includes('graphing')) {
        explanation += 'HOW TO SOLVE:\nTo graph a rational function: 1) Find vertical asymptotes (denominator = 0), 2) Find horizontal asymptotes (compare degrees), 3) Find intercepts, 4) Plot points.';
    } else {
        explanation += 'HOW TO SOLVE:\n1. Read the question carefully\n2. Identify what concept is being tested\n3. Apply the relevant rules or formulas\n4. Check your answer makes sense';
    }
    
    return explanation;
}

async function rprfRunLessonQuiz(lessonNum) {
    const quizArray = [
        rprfLesson1Quiz,
        rprfLesson2Quiz,
        rprfLesson3Quiz,
        rprfLesson4Quiz
    ][lessonNum - 1];
    
    if (!quizArray) return false;
    
    // Track quiz start time
    window.quizStartTime = Date.now();
    
    // Shuffle quiz questions and options
    const shuffledQuiz = rprfShuffleQuiz(quizArray);
    
    let currentQuestion = 0;
    let score = 0;
    let userAnswers = []; // Store user's answers
    
    // Show intro modal (matching functions.html style)
    const introResult = await Swal.fire({
        title: `📚 Topic ${lessonNum} Quiz`,
        html: `
            <div class="text-left space-y-4">
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
                <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-l-4 border-green-500">
                    <p class="text-sm text-gray-700">
                        <i class="fas fa-lightbulb text-green-500 mr-2"></i>
                        <strong>Tip:</strong> Take your time and read each question carefully. You can try again if needed.
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
        width: window.innerWidth <= 768 ? '95%' : '650px',
        customClass: {
            popup: 'rounded-2xl',
            title: 'text-slate-800',
            htmlContainer: 'text-left'
        }
    });
    
    if (!introResult.isConfirmed) {
        rprfShowLesson(lessonNum);
        return false;
    }
    
    window.quizStartTime = Date.now(); // Start timer when user actually starts questions
    
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
            width: window.innerWidth <= 768 ? '95%' : '750px',
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
                        explanation = rprfGenerateExplanation(currentQuiz, selectedAnswer);
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
        });
    }
    
    function showQuizResults() {
        const percentage = Math.round((score / shuffledQuiz.length) * 100);
        const passed = score >= 3;
        
        // Verify that all answers were collected
        for (let i = 0; i < shuffledQuiz.length; i++) {
            if (!userAnswers[i] || typeof userAnswers[i] !== 'object') {
                const quiz = shuffledQuiz[i];
                userAnswers[i] = {
                    question: quiz.question,
                    options: quiz.options,
                    selected: -1,
                    selectedText: 'Not answered',
                    correct: quiz.correct,
                    correctText: quiz.options[quiz.correct],
                    isCorrect: false,
                    explanation: rprfGenerateExplanation(quiz, -1)
                };
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
            width: window.innerWidth <= 768 ? '95%' : '600px',
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
                    const quizResult = await rprfStoreQuizData(lessonNum, score, shuffledQuiz.length, userAnswers);
                    console.log('Quiz data stored:', quizResult);
                    
                    // Small delay to ensure quiz data is saved
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    // Now complete the lesson (this will save final study time and stop timer)
                    await rprfCompleteLesson(lessonNum);
                    
                    // Hide Topic 4 quiz button if this is Topic 4
                    if (lessonNum === 4) {
                        const topic4QuizButton = document.getElementById('topic4QuizButton');
                        if (topic4QuizButton) {
                            topic4QuizButton.style.display = 'none';
                        }
                        
                        // Small delay to ensure completion is saved
                        setTimeout(() => {
                            // Check if all lessons are completed
                            if (rprfCompletedLessons.size === rprfTotalLessons) {
                                // Only show performance analysis after ALL quizzes are completed
                                rprfShowPerformanceAnalysisSection();
                                rprfShowTopicCompletionOption();
                            }
                        }, 500);
                    }
                    
                    if (lessonNum < rprfTotalLessons) {
                        rprfShowLesson(lessonNum + 1, true);
                    }
                } catch (e) {
                    console.error('Error storing quiz data:', e);
                }
            } else {
                // Store quiz data even if failed
                try {
                    await rprfStoreQuizData(lessonNum, score, shuffledQuiz.length, userAnswers);
                    // Performance analysis will only show after all quizzes are completed
                } catch (e) {
                    console.error('Error storing quiz data:', e);
                }
                rprfShowLesson(lessonNum);
            }
        });
    }
    
    displayQuestion();
    return false;
}

async function rprfStoreQuizData(lessonNum, score, total, userAnswers) {
    try {
        const formData = new FormData();
        formData.append('action', 'store_quiz');
        formData.append('topic', 'Representations of Rational Functions');
        formData.append('lesson', lessonNum);
        formData.append('score', score);
        formData.append('total', total);
        formData.append('answers', JSON.stringify(userAnswers));
        
        const response = await fetch('../php/store-quiz-data.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result.success;
    } catch (e) {
        console.error('Error storing quiz data:', e);
        return false;
    }
}

// ------------------------------
// Timer Functions (matching functions.html)
// ------------------------------
function rprfStartLiveTimer() {
    // Clear existing timer
    if (rprfTimerUpdateInterval) {
        clearInterval(rprfTimerUpdateInterval);
    }
    
    // Don't start timer if lesson is already completed
    if (rprfCompletedLessons.has(rprfCurrentLesson)) {
        rprfUpdateLiveTimer(); // Just show final time
        return;
    }
    
    // Update timer immediately
    rprfUpdateLiveTimer();
    
    // Update timer every second
    rprfTimerUpdateInterval = setInterval(function() {
        // Stop if lesson becomes completed
        if (rprfCompletedLessons.has(rprfCurrentLesson)) {
            clearInterval(rprfTimerUpdateInterval);
            rprfTimerUpdateInterval = null;
            rprfUpdateLiveTimer(); // Show final time
            return;
        }
        rprfUpdateLiveTimer();
    }, 1000);
}

function rprfUpdateLiveTimer() {
    if (!rprfCurrentLesson) return;
    
    // Don't update timer if lesson is already completed
    if (rprfCompletedLessons.has(rprfCurrentLesson)) {
        // Show final time for completed lesson
        // Try totalStudyTime first, then lastSavedTime as fallback
        let finalTime = rprfTotalStudyTime[rprfCurrentLesson] || rprfLastSavedTime[rprfCurrentLesson] || 0;
        
        // If still 0, try to load from server (this shouldn't happen, but just in case)
        if (finalTime === 0) {
            console.warn(`Timer time is 0 for completed lesson ${rprfCurrentLesson}, attempting to load...`);
            // Don't await here to avoid blocking, just trigger a load
            rprfLoadAndDisplayStudyTime().then(() => {
                // After loading, update again
                const reloadedTime = rprfTotalStudyTime[rprfCurrentLesson] || rprfLastSavedTime[rprfCurrentLesson] || 0;
                if (reloadedTime > 0) {
                    rprfUpdateLiveTimer();
                }
            });
        }
        
        // Ensure finalTime is in seconds (not milliseconds)
        // If it's suspiciously large (> 86400 = 24 hours), it might be in milliseconds
        if (finalTime > 86400) {
            // Check if it's in milliseconds (divide by 1000)
            const asSeconds = Math.floor(finalTime / 1000);
            if (asSeconds <= 86400) {
                finalTime = asSeconds;
            } else {
                // Still too large, cap it
                finalTime = Math.min(finalTime, 86400);
            }
        }
        
        // Cap at 24 hours maximum
        finalTime = Math.min(finalTime, 86400);
        
        const hours = Math.floor(finalTime / 3600);
        const minutes = Math.floor((finalTime % 3600) / 60);
        const secs = finalTime % 60;
        
        let timeDisplay = '';
        if (hours > 0) {
            timeDisplay = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            timeDisplay = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        
        const activeSection = document.getElementById(`lesson${rprfCurrentLesson}`);
        if (activeSection) {
            // Ensure timer container is visible (remove hidden class if present)
            const timerContainer = activeSection.querySelector('.flex-shrink-0.ml-6');
            if (timerContainer) {
                // Remove 'hidden' class to ensure visibility on desktop
                timerContainer.classList.remove('hidden');
                timerContainer.style.display = 'flex';
                timerContainer.style.visibility = 'visible';
            }
            
            const timer = activeSection.querySelector('.lesson-timer-display');
            if (timer) {
                timer.textContent = timeDisplay;
                timer.style.visibility = 'visible';
                timer.style.opacity = '1';
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
    const baseTime = rprfLastSavedTime[rprfCurrentLesson] || 0; // This is the last confirmed saved time from server
    
    // Calculate elapsed time since last save (or since lesson started if no save yet)
    let currentSessionElapsed = 0;
    const saveStartTime = rprfLastSaveTimestamp[rprfCurrentLesson] || rprfLessonStartTime[rprfCurrentLesson];
    if (saveStartTime) {
        const now = Date.now();
        const elapsedMs = now - saveStartTime;
        currentSessionElapsed = Math.floor(elapsedMs / 1000); // in seconds
        
        // Cap current session at 2 hours to prevent unreasonable values
        // If elapsed is suspiciously large, it might be because page was left open
        if (currentSessionElapsed > 7200) {
            // Reset start time if session is too long (likely page was left open)
            console.warn(`Session elapsed time too large (${currentSessionElapsed}s) for lesson ${rprfCurrentLesson}, resetting start time`);
            rprfLessonStartTime[rprfCurrentLesson] = now;
            rprfLastSaveTimestamp[rprfCurrentLesson] = now;
            currentSessionElapsed = 0;
        }
        
        // Also check if elapsed is negative (shouldn't happen, but handle it)
        if (currentSessionElapsed < 0) {
            console.warn(`Negative elapsed time detected for lesson ${rprfCurrentLesson}, resetting start time`);
            rprfLessonStartTime[rprfCurrentLesson] = now;
            rprfLastSaveTimestamp[rprfCurrentLesson] = now;
            currentSessionElapsed = 0;
        }
    }
    
    // Total time = last saved time (from server) + elapsed since last save
    // This prevents double-counting because baseTime is the confirmed saved time
    // and currentSessionElapsed is only the NEW time since last save
    const totalTime = baseTime + currentSessionElapsed;
    
    // Cap at reasonable maximum (24 hours = 86400 seconds)
    const cappedTime = Math.min(totalTime, 86400);
    
    // Format time as MM:SS or HH:MM:SS
    const hours = Math.floor(cappedTime / 3600);
    const minutes = Math.floor((cappedTime % 3600) / 60);
    const seconds = cappedTime % 60;
    
    let timeDisplay = '';
    if (hours > 0) {
        timeDisplay = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Update timer display only for the active lesson section
    const activeSection = document.getElementById(`lesson${rprfCurrentLesson}`);
    if (activeSection) {
        // Ensure timer container is visible (remove hidden class if present)
        const timerContainer = activeSection.querySelector('.flex-shrink-0.ml-6');
        if (timerContainer) {
            // Remove 'hidden' class to ensure visibility on desktop
            timerContainer.classList.remove('hidden');
            timerContainer.style.display = 'flex';
            timerContainer.style.visibility = 'visible';
        }
        
        const timer = activeSection.querySelector('.lesson-timer-display');
        if (timer) {
            timer.textContent = timeDisplay;
            timer.style.visibility = 'visible';
            timer.style.opacity = '1';
        }
        
        // Update circular progress (max 2 hours = 7200 seconds)
        const maxTime = 7200; // 2 hours max
        const progress = Math.min((cappedTime / maxTime) * 100, 100);
        const circumference = 2 * Math.PI * 34; // radius = 34 (smaller timer)
        const offset = circumference - (progress / 100) * circumference;
        
        const progressCircle = activeSection.querySelector('.timer-progress');
        if (progressCircle) {
            progressCircle.style.strokeDashoffset = offset;
        }
    }
}

function rprfSaveStudyTimeForCurrentLesson() {
    if (!rprfCurrentLesson) return;
    
    // CRITICAL: Never save time for completed lessons
    // Once a lesson is completed, the timer should be frozen
    if (rprfCompletedLessons.has(rprfCurrentLesson)) {
        console.log(`Lesson ${rprfCurrentLesson} is completed, skipping timer save`);
        return;
    }
    
    // Use lastSaveTimestamp if available, otherwise use lessonStartTime
    const saveStartTime = rprfLastSaveTimestamp[rprfCurrentLesson] || rprfLessonStartTime[rprfCurrentLesson];
    if (!saveStartTime) return;
    
    const now = Date.now();
    const elapsed = Math.floor((now - saveStartTime) / 1000); // in seconds
    
    // Only add time if it's reasonable (less than 2 hours per session)
    if (elapsed > 0 && elapsed < 7200) {
        // Get the last confirmed saved time (from server)
        const baseTime = rprfLastSavedTime[rprfCurrentLesson] || 0;
        
        // Calculate new total: last saved time + NEW elapsed time since last save
        const newTotalTime = baseTime + elapsed;
        
        // Update both totalStudyTime and lastSavedTime
        rprfTotalStudyTime[rprfCurrentLesson] = newTotalTime;
        rprfLastSavedTime[rprfCurrentLesson] = newTotalTime;
        rprfLastSaveTimestamp[rprfCurrentLesson] = now;
        
        // Reset lessonStartTime to now for next interval
        rprfLessonStartTime[rprfCurrentLesson] = now;
        
        // Send to server periodically
        rprfSendStudyTimeToServer();
    } else if (elapsed >= 7200) {
        // If elapsed time is too large, reset everything (likely page was left open)
        rprfLessonStartTime[rprfCurrentLesson] = now;
        rprfLastSaveTimestamp[rprfCurrentLesson] = now;
    }
}

function rprfSendStudyTimeToServer() {
    if (!rprfCurrentLesson) return;
    
    // CRITICAL: Never send time for completed lessons
    if (rprfCompletedLessons.has(rprfCurrentLesson)) {
        console.log(`Lesson ${rprfCurrentLesson} is completed, skipping timer save to server`);
        return;
    }
    
    const studyTimeData = {};
    studyTimeData[rprfCurrentLesson] = rprfTotalStudyTime[rprfCurrentLesson] || 0;
    
    fetch('../php/store-study-time.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            topic: 'Representations of Rational Functions',
            study_time: studyTimeData
        }),
        credentials: 'include'
    }).then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to save study time');
    }).then(data => {
        if (data.success && data.study_time) {
            // Update lastSavedTime with what we just saved
            const lesson = rprfCurrentLesson;
            if (data.study_time[lesson] !== undefined) {
                const savedTime = data.study_time[lesson];
                if (savedTime > (rprfLastSavedTime[lesson] || 0)) {
                    rprfLastSavedTime[lesson] = savedTime;
                    rprfTotalStudyTime[lesson] = savedTime;
                }
            }
        }
    }).catch(e => {
        console.error('Error saving study time:', e);
    });
}

async function rprfLoadAndDisplayStudyTime() {
    if (!rprfCurrentLesson) return;
    
    // For completed lessons, still load from server to ensure we have the final saved time
    // This ensures the timer displays correctly even after completion
    
    try {
        const response = await fetch(`../php/get-study-time.php?topic=Representations of Rational Functions&lesson=${rprfCurrentLesson}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.study_time) {
                const lesson = rprfCurrentLesson;
                let seconds = parseInt(data.study_time[lesson]) || 0;
                
                // Ensure seconds is actually in seconds, not milliseconds
                // If it's suspiciously large (> 86400 = 24 hours), it might be in milliseconds
                if (seconds > 86400) {
                    // Check if it's in milliseconds (divide by 1000)
                    const asSeconds = Math.floor(seconds / 1000);
                    if (asSeconds <= 86400) {
                        seconds = asSeconds;
                    } else {
                        // Still too large, cap it at 24 hours
                        seconds = 86400;
                    }
                }
                
                // Set totalStudyTime and lastSavedTime directly from server (this is the total accumulated time)
                rprfTotalStudyTime[lesson] = seconds;
                rprfLastSavedTime[lesson] = seconds;
                
                // For completed lessons, don't update lastSaveTimestamp (keep it null to prevent updates)
                // For active lessons, update lastSaveTimestamp to now so we know when we last synced with server
                if (!rprfCompletedLessons.has(lesson)) {
                    const now = Date.now();
                    rprfLastSaveTimestamp[lesson] = now;
                }
                
                // Update display
                rprfUpdateLiveTimer();
                
                // Ensure timer container is visible
                const section = document.getElementById(`lesson${lesson}`);
                if (section) {
                    const timerContainer = section.querySelector('.flex-shrink-0.ml-6');
                    if (timerContainer) {
                        timerContainer.classList.remove('hidden');
                        timerContainer.style.display = 'flex';
                        timerContainer.style.visibility = 'visible';
                    }
                }
            }
        }
    } catch (e) {
        console.error('Error loading study time:', e);
        // Even on error, try to update display with current local values
        rprfUpdateLiveTimer();
    }
}

// ------------------------------
// Sidebar Progress Update
// ------------------------------
function rprfUpdateSidebarProgress() {
    const topics = document.querySelectorAll('.lesson-topic');
    topics.forEach(topic => {
        const lessonNum = parseInt(topic.dataset.lesson, 10);
        const accessible = rprfCanAccessTopic(lessonNum);
        const complete = rprfCompletedLessons.has(lessonNum);
        
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
        
        const header = topic.querySelector('.lesson-topic-header');
        if (header) {
            if (lessonNum === rprfCurrentLesson) {
                header.classList.add('active');
            } else {
                header.classList.remove('active');
            }
        }
    });
}

function rprfUpdateNavigationButtons() {
    const prev = document.querySelector('[data-rprf-prev]');
    const next = document.querySelector('[data-rprf-next]');
    if (prev) prev.disabled = rprfCurrentLesson === 1;
    if (next) next.disabled = rprfCurrentLesson === rprfTotalLessons;
}

function rprfUpdateProgressIndicators() {
    const numEls = document.querySelectorAll('[id^="rprfCurrentLessonNum"]');
    numEls.forEach(el => el.textContent = String(rprfCurrentLesson));
    const bars = document.querySelectorAll('[id^="rprfLessonProgressBar"]');
    bars.forEach(bar => bar.style.width = `${(rprfCurrentLesson / rprfTotalLessons) * 100}%`);
}

function rprfUpdateLessonCompletionStatus() {
    const navBtns = document.querySelectorAll('.lesson-nav-btn');
    navBtns.forEach(btn => {
        const lesson = parseInt(btn.getAttribute('data-lesson') || '0', 10);
        btn.classList.toggle('completed', rprfCompletedLessons.has(lesson));
        const icon = btn.querySelector('.w-16');
        if (icon && rprfCompletedLessons.has(lesson)) {
            icon.classList.add('bg-green-500', 'text-white');
            icon.classList.remove('bg-gray-300', 'text-gray-600');
        }
    });
    rprfUpdateCompletionButtonsUI();
    
    // Check if all lessons are completed and show topic completion option
    if (rprfCompletedLessons.size === rprfTotalLessons) {
        rprfShowTopicCompletionOption();
    }
}

function rprfGetCompleteButtonForLesson(lessonNum) {
    const section = document.getElementById(`lesson${lessonNum}`);
    if (!section) return null;
    return section.querySelector(`[data-rprf-complete-btn="${lessonNum}"]`);
}

function rprfSetCompleteButtonState(lessonNum, { completed = false, loading = false } = {}) {
    const btn = rprfGetCompleteButtonForLesson(lessonNum);
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

function rprfUpdateCompletionButtonsUI() {
    for (let i = 1; i <= rprfTotalLessons; i++) {
        rprfSetCompleteButtonState(i, { completed: rprfCompletedLessons.has(i) });
    }
}

async function rprfCompleteLesson(lessonNum) {
    try {
        console.log('Attempting to complete lesson:', lessonNum);
        
        if (rprfCompletedLessons.has(lessonNum)) { 
            rprfSetCompleteButtonState(lessonNum, { completed: true }); 
            return; 
        }
        
        rprfSetCompleteButtonState(lessonNum, { loading: true });
        
        const requestData = {
            topic: 'Representations of Rational Functions',
            lesson: lessonNum,
            action: 'complete'
        };
        
        console.log('Sending request:', requestData);
        
        const res = await fetch('../php/complete-lesson.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
            credentials: 'include'
        });
        
        console.log('Response status:', res.status);
        console.log('Response headers:', res.headers);
        
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
            console.error('Response text:', text);
            
            await Swal.fire({
                icon: 'error',
                title: 'Server Response Error',
                html: `
                    <div class="text-left">
                        <p><strong>Error:</strong> Invalid server response format</p>
                        <p><strong>Response:</strong> ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}</p>
                        <p><strong>Lesson:</strong> ${lessonNum}</p>
                        <p><strong>Topic:</strong> Representations of Rational Functions</p>
                        <hr class="my-3">
                        <p class="text-sm text-gray-600">
                            <strong>Troubleshooting:</strong><br>
                            • Check if the server is running properly<br>
                            • Verify database connection<br>
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
            
            rprfSetCompleteButtonState(lessonNum, { completed: false });
            return;
        }
        
        if (data && data.success) {
            console.log('Lesson completion successful');
            
            // CRITICAL: Save final study time BEFORE marking as completed
            // This ensures the timer is saved and frozen at completion
            if (lessonNum === rprfCurrentLesson) {
                const now = Date.now();
                // Use lastSaveTimestamp if available, otherwise use lessonStartTime
                const saveStartTime = rprfLastSaveTimestamp[lessonNum] || rprfLessonStartTime[lessonNum];
                
                if (saveStartTime) {
                    const elapsed = Math.floor((now - saveStartTime) / 1000); // in seconds
                    
                    if (elapsed > 0 && elapsed < 7200) {
                        // Get last confirmed saved time (from server)
                        const baseTime = rprfLastSavedTime[lessonNum] || 0;
                        // Calculate final total time: last saved + elapsed since last save
                        const finalTotalTime = baseTime + elapsed;
                        
                        // Update local tracking
                        rprfTotalStudyTime[lessonNum] = finalTotalTime;
                        rprfLastSavedTime[lessonNum] = finalTotalTime;
                        
                        // Force save final time to server immediately (bypass the completed check)
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
                                    topic: 'Representations of Rational Functions',
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
                rprfLessonStartTime[lessonNum] = null;
                rprfLastSaveTimestamp[lessonNum] = null;
            }
            
            // Add to completed lessons AFTER saving time
            rprfCompletedLessons.add(lessonNum);
            
            // Stop timer for completed lesson
            if (lessonNum === rprfCurrentLesson) {
                // Stop the timer interval
                if (rprfTimerUpdateInterval) {
                    clearInterval(rprfTimerUpdateInterval);
                    rprfTimerUpdateInterval = null;
                }
                
                // Load study time from server to ensure we have the final saved time
                await rprfLoadAndDisplayStudyTime();
                
                // Double-check: If timer still shows 0, try loading again with a small delay
                // This ensures the server has saved the final time
                setTimeout(async () => {
                    if (rprfTotalStudyTime[lessonNum] === 0 || rprfTotalStudyTime[lessonNum] === undefined) {
                        console.log(`Timer time is 0 for lesson ${lessonNum}, attempting to reload...`);
                        try {
                            const timeResponse = await fetch(`../php/get-study-time.php?topic=Representations of Rational Functions&lesson=${lessonNum}`, {
                                credentials: 'include'
                            });
                            
                            if (timeResponse.ok) {
                                const timeData = await timeResponse.json();
                                if (timeData.success && timeData.study_time && timeData.study_time[lessonNum] !== undefined) {
                                    let seconds = parseInt(timeData.study_time[lessonNum]) || 0;
                                    
                                    // Ensure seconds is actually in seconds, not milliseconds
                                    if (seconds > 86400) {
                                        const asSeconds = Math.floor(seconds / 1000);
                                        if (asSeconds <= 86400) {
                                            seconds = asSeconds;
                                        } else {
                                            seconds = 86400;
                                        }
                                    }
                                    
                                    // Set totalStudyTime and lastSavedTime
                                    rprfTotalStudyTime[lessonNum] = seconds;
                                    rprfLastSavedTime[lessonNum] = seconds;
                                    console.log(`Loaded study time for lesson ${lessonNum}: ${seconds} seconds`);
                                    
                                    // Update timer display
                                    rprfUpdateLiveTimer();
                                }
                            }
                        } catch (e) {
                            console.error(`Error reloading study time for lesson ${lessonNum}:`, e);
                        }
                    }
                }, 500);
                
                // Update timer display with final time (frozen state)
                rprfUpdateLiveTimer();
                
                // Make timer green to indicate completion and ensure visibility
                const section = document.getElementById(`lesson${lessonNum}`);
                if (section) {
                    // Ensure timer container is visible
                    const timerContainer = section.querySelector('.flex-shrink-0.ml-6');
                    if (timerContainer) {
                        timerContainer.classList.remove('hidden');
                        timerContainer.style.display = 'flex';
                        timerContainer.style.visibility = 'visible';
                    }
                    
                    const progressCircle = section.querySelector('.timer-progress');
                    if (progressCircle) {
                        progressCircle.style.stroke = '#10b981';
                    }
                    
                    // Ensure timer display text is visible
                    const timerDisplay = section.querySelector('.lesson-timer-display');
                    if (timerDisplay) {
                        timerDisplay.style.visibility = 'visible';
                        timerDisplay.style.opacity = '1';
                    }
                }
            }
            
            await rprfLoadCompletedLessons();
            rprfSetCompleteButtonState(lessonNum, { completed: true });
            rprfUpdateSidebarProgress();
            
            // Show success modal
            await Swal.fire({
                icon: 'success',
                title: 'Lesson Completed!',
                html: `
                    <div class="text-center">
                        <p class="text-lg mb-4">Great job completing <strong>Lesson ${lessonNum}</strong>!</p>
                        <p class="text-gray-600 mb-4">You're making excellent progress in Representations of Rational Functions.</p>
                        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <p class="text-green-800 font-semibold">Progress Update:</p>
                            <p class="text-green-700">${rprfCompletedLessons.size} of ${rprfTotalLessons} lessons completed</p>
                        </div>
                        ${rprfCompletedLessons.size === rprfTotalLessons ? 
                            '<p class="text-blue-600 font-semibold">🎉 All lessons completed! You can now complete the entire topic!</p>' : 
                            '<p class="text-gray-600">Keep up the great work!</p>'
                        }
                    </div>
                `,
                confirmButtonText: 'Continue Learning',
                confirmButtonColor: '#10b981',
                showCancelButton: true,
                cancelButtonText: 'View Dashboard',
                cancelButtonColor: '#6b7280'
            }).then((result) => {
                if (result.dismiss === Swal.DismissReason.cancel) {
                    window.location.href = '../dashboard.html';
                }
            });
            
        } else {
            rprfSetCompleteButtonState(lessonNum, { completed: false });
            
            await Swal.fire({
                icon: 'error',
                title: 'Failed to Complete Lesson',
                html: `
                    <div class="text-left">
                        <p><strong>Error:</strong> ${data && data.message ? data.message : 'Unknown error occurred'}</p>
                        <p><strong>Lesson:</strong> ${lessonNum}</p>
                        <p><strong>Topic:</strong> Representations of Rational Functions</p>
                        <hr class="my-3">
                        <p class="text-sm text-gray-600">
                            <strong>Possible causes:</strong><br>
                            • Database connection issue<br>
                            • Server configuration problem<br>
                            • Invalid lesson data<br>
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
        console.error('Error completing lesson:', e);
        rprfSetCompleteButtonState(lessonNum, { completed: false });
        
        await Swal.fire({
            icon: 'error',
            title: 'Network Error',
            html: `
                <div class="text-left">
                    <p><strong>Error:</strong> ${e.message}</p>
                    <p><strong>Lesson:</strong> ${lessonNum}</p>
                    <p><strong>Topic:</strong> Representations of Rational Functions</p>
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

async function rprfLoadCompletedLessons() {
    try {
        console.log('Loading completed lessons for Representations of Rational Functions...');
        
        const requestData = {
            action: 'get_completed',
            topic: 'Representations of Rational Functions'
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
            rprfCompletedLessons = new Set(list);
            rprfUpdateSidebarProgress();
            
            // Load study time for all completed lessons to ensure timer displays correctly
            for (const lessonNum of rprfCompletedLessons) {
                try {
                    const timeResponse = await fetch(`../php/get-study-time.php?topic=Representations of Rational Functions&lesson=${lessonNum}`, {
                        credentials: 'include'
                    });
                    
                    if (timeResponse.ok) {
                        const timeData = await timeResponse.json();
                        if (timeData.success && timeData.study_time && timeData.study_time[lessonNum] !== undefined) {
                            let seconds = parseInt(timeData.study_time[lessonNum]) || 0;
                            
                            // Ensure seconds is actually in seconds, not milliseconds
                            if (seconds > 86400) {
                                const asSeconds = Math.floor(seconds / 1000);
                                if (asSeconds <= 86400) {
                                    seconds = asSeconds;
                                } else {
                                    seconds = 86400;
                                }
                            }
                            
                            // Set totalStudyTime and lastSavedTime for completed lesson
                            rprfTotalStudyTime[lessonNum] = seconds;
                            rprfLastSavedTime[lessonNum] = seconds;
                        }
                    }
                } catch (e) {
                    console.error(`Error loading study time for completed lesson ${lessonNum}:`, e);
                }
            }
            
            // Update timer display if current lesson is completed
            if (rprfCurrentLesson && rprfCompletedLessons.has(rprfCurrentLesson)) {
                rprfUpdateLiveTimer();
            }
            
            // Hide Topic 4 quiz button if Topic 4 is completed
            const topic4QuizButton = document.getElementById('topic4QuizButton');
            if (topic4QuizButton && rprfCompletedLessons.has(4)) {
                topic4QuizButton.style.display = 'none';
            }
            
            // Show performance analysis if all quizzes are completed
            if (rprfCompletedLessons.size === rprfTotalLessons) {
                rprfShowPerformanceAnalysisSection();
            }
            
            return;
        }
        
        console.log('Primary request failed, trying fallback...');
        
        // Fallback to general progress
        const fallback = await fetch('../php/get-progress.php', { 
            credentials: 'include', 
            cache: 'no-store' 
        });
        
        if (fallback.ok) {
            const text = await fallback.text();
            console.log('Fallback response:', text);
            
            let data2;
            try {
                data2 = JSON.parse(text);
            } catch (parseError) {
                console.error('Fallback JSON parse error:', parseError);
                throw new Error('Invalid fallback response format');
            }
            
            const topicKey = 'representations-of-rational-functions';
            const count = (data2 && data2.topics && data2.topics[topicKey] && data2.topics[topicKey].lessons_completed) || 0;
            const approx = Array.from({ length: Math.max(0, Math.min(count, rprfTotalLessons)) }, (_, i) => i + 1);
            rprfCompletedLessons = new Set(approx);
            rprfUpdateLessonCompletionStatus();
        } else {
            console.error('Fallback request failed:', fallback.status);
            throw new Error('Both primary and fallback requests failed');
        }
    } catch (error) {
        console.error('Error loading completed lessons:', error);
        // Don't show error to user for this background operation
        // Just keep the current state
    }
}

// Topic Completion Functions
function rprfShowTopicCompletionOption() {
    if (rprfCompletedLessons.size === rprfTotalLessons) {
        // Check if topic completion button already exists
        if (document.getElementById('rprfTopicCompletionBtn')) return;
        
        // Create topic completion section
        const completionSection = document.createElement('div');
        completionSection.id = 'rprfTopicCompletionSection';
        completionSection.className = 'bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-8 mb-8 border-2 border-emerald-200';
        completionSection.innerHTML = `
            <div class="text-center">
                <div class="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-trophy text-3xl"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-800 mb-4">🎉 Congratulations!</h3>
                <p class="text-lg text-gray-600 mb-6">You've completed all lessons in <strong>Representations of Rational Functions</strong>!</p>
                <p class="text-gray-700 mb-8">You can now mark this entire topic as completed and move on to the next topic.</p>
                <button id="rprfTopicCompletionBtn" onclick="rprfCompleteTopic()" 
                        class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                    <i class="fas fa-check-circle mr-2"></i>Complete Topic
                </button>
            </div>
        `;
        
        // Insert after the last lesson section
        const lastLesson = document.getElementById(`lesson${rprfTotalLessons}`);
        if (lastLesson) {
            lastLesson.parentNode.insertBefore(completionSection, lastLesson.nextSibling);
        }
    }
}

async function rprfCompleteTopic() {
    try {
        console.log('Attempting to complete topic: Representations of Rational Functions');
        
        const requestData = {
            topic: 'Representations of Rational Functions',
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
        console.log('Response headers:', res.headers);
        
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
            console.error('Response text:', text);
            
            await Swal.fire({
                icon: 'error',
                title: 'Server Response Error',
                html: `
                    <div class="text-left">
                        <p><strong>Error:</strong> Invalid server response format</p>
                        <p><strong>Response:</strong> ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}</p>
                        <p><strong>Topic:</strong> Representations of Rational Functions</p>
                        <hr class="my-3">
                        <p class="text-sm text-gray-600">
                            <strong>Troubleshooting:</strong><br>
                            • Check if the server is running properly<br>
                            • Verify database connection<br>
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
            return;
        }
        
        if (data && data.success) {
            // Show success modal
            await Swal.fire({
                icon: 'success',
                title: 'Topic Completed!',
                html: `
                    <div class="text-center">
                        <div class="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6">
                            <i class="fas fa-trophy text-3xl"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800 mb-4">🎉 Amazing Work!</h3>
                        <p class="text-lg text-gray-600 mb-6">You've successfully completed <strong>Representations of Rational Functions</strong>!</p>
                        <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-6">
                            <p class="text-emerald-800 font-semibold mb-2">What you've accomplished:</p>
                            <ul class="text-emerald-700 text-left space-y-1">
                                <li>✅ Mastered rational function concepts</li>
                                <li>✅ Learned graphical representations</li>
                                <li>✅ Analyzed asymptotes and intercepts</li>
                                <li>✅ Applied knowledge to real-world problems</li>
                            </ul>
                        </div>
                        <p class="text-gray-600 mb-6">You're ready to move on to the next topic!</p>
                    </div>
                `,
                confirmButtonText: 'Continue Learning',
                confirmButtonColor: '#10b981',
                showCancelButton: true,
                cancelButtonText: 'View Dashboard',
                cancelButtonColor: '#6b7280'
            }).then((result) => {
                if (result.dismiss === Swal.DismissReason.cancel) {
                    window.location.href = '../dashboard.html';
                } else {
                    window.location.href = '../topics.html';
                }
            });
            
        } else {
            await Swal.fire({
                icon: 'error',
                title: 'Failed to Complete Topic',
                html: `
                    <div class="text-left">
                        <p><strong>Error:</strong> ${data && data.message ? data.message : 'Unknown error occurred'}</p>
                        <p><strong>Topic:</strong> Representations of Rational Functions</p>
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
                    <p><strong>Topic:</strong> Representations of Rational Functions</p>
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


// Show Topic 4 Quiz
function rprfShowTopic4Quiz() {
    if (rprfCompletedLessons.has(4)) {
        Swal.fire({
            title: 'Already Completed',
            text: 'You have already completed Topic 4 quiz.',
            icon: 'info',
            confirmButtonText: 'OK'
        });
        return;
    }
    rprfRunLessonQuiz(4);
}

/**
 * Show performance analysis section (only when all quizzes are completed)
 */
function rprfShowPerformanceAnalysisSection() {
    // Check if all 4 topics are completed
    if (rprfCompletedLessons.size !== rprfTotalLessons) {
        console.log('Performance analysis will only show after completing all quizzes. Current completed:', rprfCompletedLessons.size, '/', rprfTotalLessons);
        return;
    }
    
    const analysisDiv = document.getElementById('performanceAnalysisSection');
    if (analysisDiv) {
        analysisDiv.style.display = 'block';
        // Scroll to analysis section smoothly
        setTimeout(() => {
            analysisDiv.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 300);
    }
}

/**
 * Analyze quiz performance using custom AI
 */
async function rprfAnalyzePerformance() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultSection = document.getElementById('analysisResult');
    
    // Show loading state
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
    }
    
    try {
        const response = await fetch(`../php/analyze-quiz-performance.php?topic=representations-of-rational-functions`, {
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
            rprfDisplayPerformanceAnalysis(result.analysis);
        } else {
            throw new Error(result.message || 'Failed to analyze performance');
        }
    } catch (error) {
        console.error('Error analyzing performance:', error);
        
        if (resultSection) {
            resultSection.innerHTML = `
                <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p class="text-red-800 font-semibold">Error analyzing performance</p>
                    <p class="text-red-600 text-sm mt-2">${error.message}</p>
                </div>
            `;
            resultSection.classList.remove('hidden');
        }
    } finally {
        // Restore button state
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-chart-bar mr-2"></i>Analyze My Performance';
        }
    }
}

/**
 * Display performance analysis results
 */
function rprfDisplayPerformanceAnalysis(analysis) {
    const resultSection = document.getElementById('analysisResult');
    if (!resultSection) return;
    
    const { overall_score, strengths, weaknesses, recommendations, topic_scores } = analysis;
    
    let html = `
        <div class="space-y-6">
            <!-- Overall Score -->
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-blue-500">
                <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-chart-line text-blue-500 mr-2"></i>
                    Overall Performance
                </h4>
                <div class="text-4xl font-bold text-primary mb-2">${overall_score}%</div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-primary h-2 rounded-full transition-all" style="width: ${overall_score}%"></div>
                </div>
            </div>
            
            <!-- Topic Scores -->
            ${topic_scores && Object.keys(topic_scores).length > 0 ? `
                <div class="bg-white rounded-xl p-6 border-2 border-gray-200">
                    <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-list-ol text-primary mr-2"></i>
                        Topic Scores
                    </h4>
                    <div class="space-y-4">
                        ${Object.entries(topic_scores).map(([topic, score]) => {
                            const percentage = typeof score === 'object' ? score.percentage : score;
                            return `
                                <div>
                                    <div class="flex justify-between mb-1">
                                        <span class="font-semibold text-gray-700">${topic}</span>
                                        <span class="font-bold text-primary">${percentage}%</span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-2">
                                        <div class="bg-primary h-2 rounded-full transition-all" style="width: ${percentage}%"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Strengths -->
            <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-l-4 border-green-500">
                <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-check-circle text-green-500 mr-2"></i>
                    Your Strengths
                </h4>
                ${strengths && strengths.length > 0 ? `
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
                ${weaknesses && weaknesses.length > 0 ? `
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
                ${recommendations && recommendations.length > 0 ? `
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

// Expose functions for onclick
window.rprfNavigateLesson = rprfNavigateLesson;
window.rprfShowLesson = rprfShowLesson;
window.rprfCompleteLesson = rprfCompleteLesson;
window.rprfCompleteTopic = rprfCompleteTopic;
window.rprfAnalyzePerformance = rprfAnalyzePerformance;
window.rprfShowTopic4Quiz = rprfShowTopic4Quiz;
window.rprfShowPerformanceAnalysisSection = rprfShowPerformanceAnalysisSection;
window.rprfDisplayPerformanceAnalysis = rprfDisplayPerformanceAnalysis;
window.toggleUserDropdown = toggleUserDropdown;
window.toggleMobileMenu = toggleMobileMenu;
window.confirmLogout = confirmLogout;

// Global fallbacks for virtual-aid preset handlers (ensure availability even if initializers haven't run yet)
window.rprfSetExplorer = function(num, den) {
    try {
        const n = document.getElementById('numeratorInput');
        const d = document.getElementById('denominatorInput');
        if (n) n.value = num;
        if (d) d.value = den;
        if (n && d) analyzeRationalFunction();
    } catch (_) {}
};
window.rprfSetGraphFunction = function(expr) {
    try {
        const f = document.getElementById('graphFunctionInput');
        if (f) {
            f.value = expr;
            graphRationalFunction();
        }
    } catch (_) {}
};
window.rprfSetGraphWindow = function(preset) {
    try {
        const xMin = document.getElementById('xMin');
        const xMax = document.getElementById('xMax');
        const yMin = document.getElementById('yMin');
        const yMax = document.getElementById('yMax');
        if (!xMin || !xMax || !yMin || !yMax) return;
        if (preset === 'std') { xMin.value = -10; xMax.value = 10; yMin.value = -10; yMax.value = 10; }
        else if (preset === 'zoomIn') { xMin.value = -5; xMax.value = 5; yMin.value = -5; yMax.value = 5; }
        else if (preset === 'wide') { xMin.value = -20; xMax.value = 20; yMin.value = -20; yMax.value = 20; }
        graphRationalFunction();
    } catch (_) {}
};
window.rprfSetAnalyzeFunction = function(expr) {
    try {
        const a = document.getElementById('analyzeFunctionInput');
        if (a) {
            a.value = expr;
            analyzeAsymptotesAndIntercepts();
        }
    } catch (_) {}
};

// Initialize all calculators and interactive tools
function initializeCalculators() {
    // Initialize Rational Function Explorer
    initializeRationalFunctionExplorer();
    
    // Initialize Rational Function Grapher
    initializeRationalFunctionGrapher();
    
    // Initialize Asymptote Analyzer
    initializeAsymptoteAnalyzer();
    
    // Initialize Real-World Problem Solver
    initializeRealWorldProblemSolver();
}

// Rational Function Explorer
function initializeRationalFunctionExplorer() {
    const numeratorInput = document.getElementById('numeratorInput');
    const denominatorInput = document.getElementById('denominatorInput');
    
    if (numeratorInput && denominatorInput) {
        // Add real-time updates with debouncing
        let timeout;
        [numeratorInput, denominatorInput].forEach(input => {
            input.addEventListener('input', function() {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    analyzeRationalFunction();
                }, 500);
            });
        });
    }
}

// Analyze Rational Function
function analyzeRationalFunction() {
    const numerator = document.getElementById('numeratorInput').value.trim();
    const denominator = document.getElementById('denominatorInput').value.trim();
    
    if (!numerator || !denominator) {
        showFunctionDisplay('f(x) = ', 'Enter both numerator and denominator', 'Enter both numerator and denominator', 'Enter both numerator and denominator');
        return;
    }
    
    try {
        // Display the function
        const functionDisplay = `f(x) = (${numerator})/(${denominator})`;
        document.getElementById('functionDisplay').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Function:</h4>
            <div class="text-lg font-mono text-primary">${functionDisplay}</div>
        `;
        
        // Analyze domain
        const domainAnalysis = analyzeDomain(denominator);
        document.getElementById('domainDisplay').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Domain:</h4>
            <div class="text-gray-700">${domainAnalysis}</div>
        `;
        
        // Analyze asymptotes
        const asymptotesAnalysis = analyzeAsymptotes(numerator, denominator);
        document.getElementById('asymptotesDisplay').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Asymptotes:</h4>
            <div class="text-gray-700">Vertical: <span class="text-red-600">${asymptotesAnalysis.vertical}</span></div>
            <div class="text-gray-700">Horizontal: <span class="text-blue-600">${asymptotesAnalysis.horizontal}</span></div>
        `;
        // Copy summary helper
        window.rprfCopyExplorerSummary = function() {
            const text = `Function: ${functionDisplay}\nDomain: ${domainAnalysis}\nVertical Asymptotes: ${asymptotesAnalysis.vertical}\nHorizontal Asymptotes: ${asymptotesAnalysis.horizontal}`;
            navigator.clipboard.writeText(text)
                .then(() => showSuccess('Summary copied to clipboard'))
                .catch(() => showError('Copy failed'));
        };
        
    } catch (error) {
        console.error('Error analyzing function:', error);
        showError('Invalid function format. Please check your input.');
    }
}

// Analyze Domain
function analyzeDomain(denominator) {
    // Simple domain analysis for common cases
    if (denominator.includes('x')) {
        if (denominator === 'x') {
            return 'All real numbers except x = 0';
        } else if (denominator === 'x - 2') {
            return 'All real numbers except x = 2';
        } else if (denominator === 'x + 1') {
            return 'All real numbers except x = -1';
        } else if (denominator.includes('x²')) {
            return 'All real numbers except where denominator equals zero';
        } else {
            return 'All real numbers except where denominator equals zero';
        }
    }
    return 'All real numbers';
}

// Analyze Asymptotes
function analyzeAsymptotes(numerator, denominator) {
    const verticalAsymptotes = [];
    const horizontalAsymptotes = [];
    
    // Simple vertical asymptote analysis
    if (denominator === 'x') {
        verticalAsymptotes.push('x = 0');
    } else if (denominator === 'x - 2') {
        verticalAsymptotes.push('x = 2');
    } else if (denominator === 'x + 1') {
        verticalAsymptotes.push('x = -1');
    } else if (denominator.includes('x²')) {
        verticalAsymptotes.push('Multiple vertical asymptotes');
    }
    
    // Simple horizontal asymptote analysis
    if (numerator.includes('x²') && denominator.includes('x²')) {
        horizontalAsymptotes.push('y = ratio of leading coefficients');
    } else if (denominator.includes('x²') && !numerator.includes('x²')) {
        horizontalAsymptotes.push('y = 0');
    } else if (numerator.includes('x') && denominator.includes('x')) {
        horizontalAsymptotes.push('y = ratio of leading coefficients');
    } else {
        horizontalAsymptotes.push('y = 0');
    }
    
    return {
        vertical: verticalAsymptotes.length > 0 ? verticalAsymptotes.join(', ') : 'None',
        horizontal: horizontalAsymptotes.length > 0 ? horizontalAsymptotes.join(', ') : 'None'
    };
}

// Rational Function Grapher
function initializeRationalFunctionGrapher() {
    const graphFunctionInput = document.getElementById('graphFunctionInput');
    
    if (graphFunctionInput) {
        // Preset setters for function and window
        window.rprfSetGraphFunction = function(expr) {
            graphFunctionInput.value = expr;
            graphRationalFunction();
        };
        window.rprfSetGraphWindow = function(preset) {
            const xMin = document.getElementById('xMin');
            const xMax = document.getElementById('xMax');
            const yMin = document.getElementById('yMin');
            const yMax = document.getElementById('yMax');
            if (!xMin || !xMax || !yMin || !yMax) return;
            if (preset === 'std') {
                xMin.value = -10; xMax.value = 10; yMin.value = -10; yMax.value = 10;
            } else if (preset === 'zoomIn') {
                xMin.value = -5; xMax.value = 5; yMin.value = -5; yMax.value = 5;
            } else if (preset === 'wide') {
                xMin.value = -20; xMax.value = 20; yMin.value = -20; yMax.value = 20;
            }
            graphRationalFunction();
        };
    }
}

// Graph Rational Function
function graphRationalFunction() {
    const functionInput = document.getElementById('graphFunctionInput').value.trim();
    const canvas = document.getElementById('rationalGraphCanvas');
    
    if (!functionInput || !canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set up coordinate system
    const xMin = parseFloat(document.getElementById('xMin').value) || -10;
    const xMax = parseFloat(document.getElementById('xMax').value) || 10;
    const yMin = parseFloat(document.getElementById('yMin').value) || -10;
    const yMax = parseFloat(document.getElementById('yMax').value) || 10;
    
    // Draw grid, axes, and asymptotes
    drawGrid(ctx, width, height, xMin, xMax, yMin, yMax);
    drawAxes(ctx, width, height, xMin, xMax, yMin, yMax);
    const verticalXs = detectVerticalAsymptotes(functionInput, xMin, xMax);
    drawAsymptotes(ctx, width, height, xMin, xMax, yMin, yMax, verticalXs);
    
    // Draw function
    drawFunction(ctx, width, height, xMin, xMax, yMin, yMax, functionInput);
    
    // Update asymptotes and intercepts info and mark intercepts
    updateGraphInfoAdvanced(functionInput, xMin, xMax, verticalXs);
    const xZeros = findXIntercepts(functionInput, xMin, xMax);
    const yInt = getYIntercept(functionInput);
    ctx.fillStyle = '#16a34a';
    xZeros.forEach(x0 => {
        const xPos = (x0 - xMin) / (xMax - xMin) * width;
        const yPos = height - (0 - yMin) / (yMax - yMin) * height;
        if (isFinite(xPos) && isFinite(yPos)) {
            ctx.beginPath();
            ctx.arc(xPos, yPos, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    if (isFinite(yInt)) {
        ctx.fillStyle = '#7c3aed';
        const xPos = (0 - xMin) / (xMax - xMin) * width;
        const yPos = height - (yInt - yMin) / (yMax - yMin) * height;
        if (isFinite(xPos) && isFinite(yPos)) {
            ctx.beginPath();
            ctx.arc(xPos, yPos, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Draw Axes
function drawAxes(ctx, width, height, xMin, xMax, yMin, yMax) {
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#374151';
    ctx.font = '11px Arial';
    // X-axis
    const xAxisY = height - (0 - yMin) / (yMax - yMin) * height;
    if (xAxisY >= 0 && xAxisY <= height) {
        ctx.beginPath();
        ctx.moveTo(0, xAxisY);
        ctx.lineTo(width, xAxisY);
        ctx.stroke();
        const stepX = Math.max(1, Math.floor((xMax - xMin) / 10));
        for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += stepX) {
            const xPos = (x - xMin) / (xMax - xMin) * width;
            ctx.beginPath();
            ctx.moveTo(xPos, xAxisY - 4);
            ctx.lineTo(xPos, xAxisY + 4);
            ctx.stroke();
            if (Math.abs(x) > 1e-9) ctx.fillText(String(x), xPos - 6, xAxisY + 14);
        }
    }
    // Y-axis
    const yAxisX = (0 - xMin) / (xMax - xMin) * width;
    if (yAxisX >= 0 && yAxisX <= width) {
        ctx.beginPath();
        ctx.moveTo(yAxisX, 0);
        ctx.lineTo(yAxisX, height);
        ctx.stroke();
        const stepY = Math.max(1, Math.floor((yMax - yMin) / 10));
        for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += stepY) {
            const yPos = height - (y - yMin) / (yMax - yMin) * height;
            ctx.beginPath();
            ctx.moveTo(yAxisX - 4, yPos);
            ctx.lineTo(yAxisX + 4, yPos);
            ctx.stroke();
            if (Math.abs(y) > 1e-9) ctx.fillText(String(y), yAxisX + 6, yPos + 4);
        }
    }
}

// Draw Grid
function drawGrid(ctx, width, height, xMin, xMax, yMin, yMax) {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
        const xPos = (x - xMin) / (xMax - xMin) * width;
        ctx.beginPath();
        ctx.moveTo(xPos, 0);
        ctx.lineTo(xPos, height);
        ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
        const yPos = height - (y - yMin) / (yMax - yMin) * height;
        ctx.beginPath();
        ctx.moveTo(0, yPos);
        ctx.lineTo(width, yPos);
        ctx.stroke();
    }
}

// Draw Asymptotes
function drawAsymptotes(ctx, width, height, xMin, xMax, yMin, yMax, verticalXs) {
    if (!Array.isArray(verticalXs) || !verticalXs.length) return;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    verticalXs.forEach(xa => {
        const xPos = (xa - xMin) / (xMax - xMin) * width;
        if (xPos >= 0 && xPos <= width) {
            ctx.beginPath();
            ctx.moveTo(xPos, 0);
            ctx.lineTo(xPos, height);
            ctx.stroke();
        }
    });
    ctx.setLineDash([]);
}

// Draw Function
function drawFunction(ctx, width, height, xMin, xMax, yMin, yMax, functionInput) {
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    let firstPoint = true;
    
    for (let x = xMin; x <= xMax; x += (xMax - xMin) / width) {
        try {
            const y = evaluateFunction(functionInput, x);
            
            if (isFinite(y) && y >= yMin && y <= yMax) {
                const xPos = (x - xMin) / (xMax - xMin) * width;
                const yPos = height - (y - yMin) / (yMax - yMin) * height;
                
                if (firstPoint) {
                    ctx.moveTo(xPos, yPos);
                    firstPoint = false;
                } else {
                    // Break on large jumps to handle asymptotes
                    const prevY = evaluateFunction(functionInput, x - (xMax - xMin) / width);
                    if (isFinite(prevY) && Math.abs(prevY - y) > (yMax - yMin) * 0.5) {
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(xPos, yPos);
                    } else {
                        ctx.lineTo(xPos, yPos);
                    }
                }
            } else {
                if (!firstPoint) {
                    ctx.stroke();
                    ctx.beginPath();
                    firstPoint = true;
                }
            }
        } catch (error) {
            // Skip invalid points
        }
    }
    
    if (!firstPoint) {
        ctx.stroke();
    }
}

// Evaluate Function (simplified)
function evaluateFunction(functionInput, x) {
    // Lightweight safe evaluator: supports + - * / ^, parentheses, and x
    try {
        const expr = functionInput
            .replace(/\^/g, '**')
            .replace(/\s+/g, '')
            .replace(/([0-9x\)])\(/g, '$1*('); // implicit multiply
        const body = `const x=${x}; return (${expr});`;
        // eslint-disable-next-line no-new-func
        const fn = new Function(body);
        const val = fn();
        if (!isFinite(val)) return NaN;
        return val;
    } catch (_) {
        return NaN;
    }
}

// Update Graph Info
function updateGraphInfo(functionInput) {
    // Better text hints based on simple pattern checks
    let verticalAsymptotes = 'None';
    if (/(x\s*[-+]\s*2)\)?/.test(functionInput)) verticalAsymptotes = verticalAsymptotes === 'None' ? 'x = 2' : verticalAsymptotes + ', x = 2';
    if (/(x\s*[+]\s*1)\)?/.test(functionInput)) verticalAsymptotes = verticalAsymptotes === 'None' ? 'x = -1' : verticalAsymptotes + ', x = -1';
    let horizontalAsymptotes = functionInput.includes('x^2') || functionInput.includes('x²') ? 'Depends on degrees' : 'y = 0';
    
    document.getElementById('asymptotesInfo').innerHTML = `
        <div>Vertical: <span class="text-red-600">${verticalAsymptotes}</span></div>
        <div>Horizontal: <span class="text-blue-600">${horizontalAsymptotes}</span></div>
    `;
    
    // Update intercepts info (very basic hints)
    let xIntercepts = functionInput.includes('x+1') ? 'x = -1' : 'Depends on numerator';
    let yIntercept = functionInput.includes('1/x') ? 'None (undefined at x=0)' : 'Depends on function';
    
    document.getElementById('interceptsInfo').innerHTML = `
        <div>X-intercepts: <span class="text-green-600">${xIntercepts}</span></div>
        <div>Y-intercept: <span class="text-purple-600">${yIntercept}</span></div>
    `;
}

// Advanced graph info using numeric sampling
function updateGraphInfoAdvanced(functionInput, xMin, xMax, verticalXs) {
    try {
        const vText = (Array.isArray(verticalXs) && verticalXs.length)
            ? verticalXs.map(x => `x = ${round2(x)}`).join(', ')
            : 'None';
        // Estimate horizontal behavior near edges
        const leftY = evaluateFunction(functionInput, xMin + 0.001);
        const rightY = evaluateFunction(functionInput, xMax - 0.001);
        const hVal = (isFinite(leftY) && isFinite(rightY)) ? round2((leftY + rightY) / 2) : 'Depends on degrees';
        const hText = typeof hVal === 'number' ? `y = ${hVal}` : String(hVal);
        const asyEl = document.getElementById('asymptotesInfo');
        if (asyEl) {
            asyEl.innerHTML = `
                <div>Vertical: <span class="text-red-600">${vText}</span></div>
                <div>Horizontal: <span class="text-blue-600">${hText}</span></div>
            `;
        }
        // X intercepts and Y intercept
        const zeros = findXIntercepts(functionInput, xMin, xMax);
        const xText = zeros.length ? zeros.map(z => `x = ${round2(z)}`).join(', ') : 'None';
        const yInt = getYIntercept(functionInput);
        const yText = isFinite(yInt) ? `y = ${round2(yInt)}` : 'None (undefined at x = 0)';
        const intEl = document.getElementById('interceptsInfo');
        if (intEl) {
            intEl.innerHTML = `
                <div>X-intercepts: <span class="text-green-600">${xText}</span></div>
                <div>Y-intercept: <span class="text-purple-600">${yText}</span></div>
            `;
        }
    } catch (_) {
        // Fallback to simple updater
        updateGraphInfo(functionInput);
    }
}

function detectVerticalAsymptotes(funcStr, xMin, xMax) {
    const xs = [];
    const steps = 600;
    let prevY = evaluateFunction(funcStr, xMin);
    for (let i = 1; i <= steps; i++) {
        const x = xMin + (i / steps) * (xMax - xMin);
        const y = evaluateFunction(funcStr, x);
        if (!isFinite(y) || Math.abs(y) > 1e6) {
            xs.push(x);
        } else if (isFinite(prevY) && Math.abs(y - prevY) > 1000) {
            xs.push(x);
        }
        prevY = y;
    }
    // Deduplicate close values
    const dedup = [];
    xs.sort((a, b) => a - b).forEach(v => {
        if (!dedup.length || Math.abs(dedup[dedup.length - 1] - v) > (xMax - xMin) / 50) dedup.push(v);
    });
    return dedup.map(round2);
}

function findXIntercepts(funcStr, xMin, xMax) {
    const roots = [];
    const steps = 400;
    let prevX = xMin;
    let prevY = evaluateFunction(funcStr, prevX);
    for (let i = 1; i <= steps; i++) {
        const x = xMin + (i / steps) * (xMax - xMin);
        const y = evaluateFunction(funcStr, x);
        if (isFinite(prevY) && isFinite(y)) {
            if (prevY === 0) roots.push(prevX);
            if (prevY * y < 0) {
                // bisection refine
                let a = prevX, b = x, fa = prevY, fb = y;
                for (let k = 0; k < 20; k++) {
                    const m = (a + b) / 2;
                    const fm = evaluateFunction(funcStr, m);
                    if (!isFinite(fm)) break;
                    if (fa * fm <= 0) { b = m; fb = fm; } else { a = m; fa = fm; }
                }
                roots.push((a + b) / 2);
            }
        }
        prevX = x; prevY = y;
    }
    // Deduplicate close roots
    const out = [];
    roots.sort((a, b) => a - b).forEach(r => {
        if (!out.length || Math.abs(out[out.length - 1] - r) > (xMax - xMin) / 100) out.push(r);
    });
    return out;
}

function getYIntercept(funcStr) {
    return evaluateFunction(funcStr, 0);
}

function round2(v) { return Math.round(v * 100) / 100; }

// Asymptote Analyzer
function initializeAsymptoteAnalyzer() {
    const analyzeFunctionInput = document.getElementById('analyzeFunctionInput');
    
    if (analyzeFunctionInput) {
        window.rprfSetAnalyzeFunction = function(expr) {
            analyzeFunctionInput.value = expr;
            analyzeAsymptotesAndIntercepts();
        };
    }
}

// Analyze Asymptotes and Intercepts
function analyzeAsymptotesAndIntercepts() {
    const functionInput = document.getElementById('analyzeFunctionInput').value.trim();
    
    if (!functionInput) {
        resetAnalysisResults();
        return;
    }
    
    try {
        // Analyze vertical asymptotes
        const verticalAsymptotes = analyzeVerticalAsymptotes(functionInput);
        document.getElementById('verticalAsymptotes').innerHTML = verticalAsymptotes;
        
        // Analyze horizontal asymptotes
        const horizontalAsymptotes = analyzeHorizontalAsymptotes(functionInput);
        document.getElementById('horizontalAsymptotes').innerHTML = horizontalAsymptotes;
        
        // Analyze x-intercepts
        const xIntercepts = analyzeXIntercepts(functionInput);
        document.getElementById('xIntercepts').innerHTML = xIntercepts;
        
        // Analyze y-intercept
        const yIntercept = analyzeYIntercept(functionInput);
        document.getElementById('yIntercept').innerHTML = yIntercept;
        
    } catch (error) {
        console.error('Error analyzing function:', error);
        showError('Invalid function format. Please check your input.');
    }
}

// Analyze Vertical Asymptotes
function analyzeVerticalAsymptotes(functionInput) {
    if (functionInput.includes('x - 2')) {
        return '<span class="text-red-600 font-semibold">x = 2</span><br><small class="text-gray-600">Denominator equals zero when x = 2</small>';
    } else if (functionInput.includes('x + 1')) {
        return '<span class="text-red-600 font-semibold">x = -1</span><br><small class="text-gray-600">Denominator equals zero when x = -1</small>';
    } else if (functionInput.includes('x² - 9')) {
        return '<span class="text-red-600 font-semibold">x = 3, x = -3</span><br><small class="text-gray-600">Denominator equals zero when x² = 9</small>';
    } else {
        return '<span class="text-gray-600">Enter a function to analyze</span>';
    }
}

// Analyze Horizontal Asymptotes
function analyzeHorizontalAsymptotes(functionInput) {
    if (functionInput.includes('x²') && functionInput.includes('x²')) {
        return '<span class="text-blue-600 font-semibold">y = ratio of leading coefficients</span><br><small class="text-gray-600">Degrees of numerator and denominator are equal</small>';
    } else if (functionInput.includes('x²') && !functionInput.includes('x²')) {
        return '<span class="text-blue-600 font-semibold">y = 0</span><br><small class="text-gray-600">Degree of denominator is greater</small>';
    } else if (functionInput.includes('x') && functionInput.includes('x')) {
        return '<span class="text-blue-600 font-semibold">y = ratio of leading coefficients</span><br><small class="text-gray-600">Degrees of numerator and denominator are equal</small>';
    } else {
        return '<span class="text-blue-600 font-semibold">y = 0</span><br><small class="text-gray-600">Degree of denominator is greater</small>';
    }
}

// Analyze X-intercepts
function analyzeXIntercepts(functionInput) {
    if (functionInput.includes('x² - 1')) {
        return '<span class="text-green-600 font-semibold">x = 1, x = -1</span><br><small class="text-gray-600">Numerator equals zero when x² = 1</small>';
    } else if (functionInput.includes('x + 1')) {
        return '<span class="text-green-600 font-semibold">x = -1</span><br><small class="text-gray-600">Numerator equals zero when x = -1</small>';
    } else {
        return '<span class="text-gray-600">Enter a function to analyze</span>';
    }
}

// Analyze Y-intercept
function analyzeYIntercept(functionInput) {
    if (functionInput.includes('1/x')) {
        return '<span class="text-purple-600 font-semibold">None (undefined at x = 0)</span><br><small class="text-gray-600">Function is undefined when x = 0</small>';
    } else if (functionInput.includes('x² - 1')) {
        return '<span class="text-purple-600 font-semibold">y = -0.5</span><br><small class="text-gray-600">f(0) = -1/2</small>';
    } else {
        return '<span class="text-gray-600">Enter a function to analyze</span>';
    }
}

// Reset Analysis Results
function resetAnalysisResults() {
    document.getElementById('verticalAsymptotes').innerHTML = 'Enter a function to analyze';
    document.getElementById('horizontalAsymptotes').innerHTML = 'Enter a function to analyze';
    document.getElementById('xIntercepts').innerHTML = 'Enter a function to analyze';
    document.getElementById('yIntercept').innerHTML = 'Enter a function to analyze';
}

// Real-World Problem Solver
function initializeRealWorldProblemSolver() {
    const problemTypeSelect = document.getElementById('problemType');
    
    if (problemTypeSelect) {
        problemTypeSelect.addEventListener('change', function() {
            updateProblemInputs(this.value);
        });
    }
}

// Update Problem Inputs
function updateProblemInputs(problemType) {
    const problemInputs = document.getElementById('problemInputs');
    const problemDescription = document.getElementById('problemDescription');
    
    if (!problemInputs || !problemDescription) return;
    
    switch (problemType) {
        case 'resistance':
            problemInputs.innerHTML = `
                <div class="bg-white rounded-lg p-4 border-2 border-yellow-200">
                    <label class="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-bolt text-yellow-600 mr-2"></i>Resistance 1 (R₁) in Ω:
                    </label>
                    <input type="number" id="r1" placeholder="e.g., 4" min="0.01" step="0.01"
                           class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50">
                </div>
                <div class="bg-white rounded-lg p-4 border-2 border-yellow-200">
                    <label class="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-bolt text-yellow-600 mr-2"></i>Resistance 2 (R₂) in Ω:
                    </label>
                    <input type="number" id="r2" placeholder="e.g., 6" min="0.01" step="0.01"
                           class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50">
                </div>
                <div class="bg-white rounded-lg p-4 border-2 border-yellow-200">
                    <label class="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-bolt text-yellow-600 mr-2"></i>Resistance 3 (R₃) in Ω:
                    </label>
                    <input type="number" id="r3" placeholder="e.g., 12" min="0.01" step="0.01"
                           class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50">
                </div>
            `;
            problemDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                    <i class="fas fa-question-circle text-yellow-600 mr-2"></i>Problem Description:
                </h4>
                <div class="text-gray-700 bg-white rounded-lg p-4 border-2 border-yellow-200">
                    <p class="mb-2">Three resistors with resistances R₁, R₂, and R₃ are connected in parallel.</p>
                    <p class="mb-2">Find the total resistance using the formula:</p>
                    <p class="font-mono text-center bg-gray-50 p-2 rounded">1/R_total = 1/R₁ + 1/R₂ + 1/R₃</p>
                </div>
            `;
            break;
            
        case 'lens':
            problemInputs.innerHTML = `
                <div class="bg-white rounded-lg p-4 border-2 border-indigo-200">
                    <label class="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-eye text-indigo-600 mr-2"></i>Focal Length (f) in cm:
                    </label>
                    <input type="number" id="focalLength" placeholder="e.g., 10" min="0.01" step="0.01"
                           class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50">
                </div>
                <div class="bg-white rounded-lg p-4 border-2 border-indigo-200">
                    <label class="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-ruler text-indigo-600 mr-2"></i>Object Distance (d₀) in cm:
                    </label>
                    <input type="number" id="objectDistance" placeholder="e.g., 15" min="0.01" step="0.01"
                           class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50">
                </div>
            `;
            problemDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                    <i class="fas fa-question-circle text-indigo-600 mr-2"></i>Problem Description:
                </h4>
                <div class="text-gray-700 bg-white rounded-lg p-4 border-2 border-indigo-200">
                    <p class="mb-2">Using the lens equation, find the image distance when given the focal length and object distance.</p>
                    <p class="font-mono text-center bg-gray-50 p-2 rounded mb-2">1/f = 1/d₀ + 1/dᵢ</p>
                    <p class="text-sm text-gray-600">where f is focal length, d₀ is object distance, and dᵢ is image distance</p>
                </div>
            `;
            break;
            
        case 'cost':
            problemInputs.innerHTML = `
                <div class="bg-white rounded-lg p-4 border-2 border-blue-200">
                    <label class="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-dollar-sign text-green-600 mr-2"></i>Fixed Cost ($):
                    </label>
                    <input type="number" id="fixedCost" placeholder="e.g., 1000" min="0" step="0.01"
                           class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50">
                </div>
                <div class="bg-white rounded-lg p-4 border-2 border-blue-200">
                    <label class="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-chart-line text-blue-600 mr-2"></i>Variable Cost per Unit ($):
                    </label>
                    <input type="number" id="variableCost" placeholder="e.g., 5" min="0" step="0.01"
                           class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50">
                </div>
                <div class="bg-white rounded-lg p-4 border-2 border-blue-200">
                    <label class="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-boxes text-purple-600 mr-2"></i>Number of Units:
                    </label>
                    <input type="number" id="units" placeholder="e.g., 100" min="1" step="1"
                           class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50">
                </div>
            `;
            problemDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                    <i class="fas fa-question-circle text-blue-600 mr-2"></i>Problem Description:
                </h4>
                <div class="text-gray-700 bg-white rounded-lg p-4 border-2 border-blue-200">
                    <p class="mb-2">Calculate the average cost per unit using the formula:</p>
                    <p class="font-mono text-center bg-gray-50 p-2 rounded mb-2">AC(x) = C(x)/x</p>
                    <p class="text-sm text-gray-600">where C(x) = Fixed Cost + (Variable Cost × x)</p>
                </div>
            `;
            break;
            
        case 'market':
            problemInputs.innerHTML = `
                <div class="bg-white rounded-lg p-4 border-2 border-green-200">
                    <label class="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-users text-green-600 mr-2"></i>Total Market Size:
                    </label>
                    <input type="number" id="marketSize" placeholder="e.g., 10000" min="1" step="1"
                           class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50">
                </div>
                <div class="bg-white rounded-lg p-4 border-2 border-green-200">
                    <label class="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-percent text-blue-600 mr-2"></i>Market Share Coefficient (a):
                    </label>
                    <input type="number" id="marketCoeff" placeholder="e.g., 5000" min="0" step="0.01"
                           class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50">
                </div>
                <div class="bg-white rounded-lg p-4 border-2 border-green-200">
                    <label class="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-dollar-sign text-purple-600 mr-2"></i>Price per Unit ($):
                    </label>
                    <input type="number" id="marketPrice" placeholder="e.g., 50" min="0" step="0.01"
                           class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50">
                </div>
            `;
            problemDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                    <i class="fas fa-question-circle text-green-600 mr-2"></i>Problem Description:
                </h4>
                <div class="text-gray-700 bg-white rounded-lg p-4 border-2 border-green-200">
                    <p class="mb-2">Calculate market share using the rational function:</p>
                    <p class="font-mono text-center bg-gray-50 p-2 rounded mb-2">S(p) = ap/(M + p)</p>
                    <p class="text-sm text-gray-600">where S is market share, p is price, M is total market size, and a is a coefficient</p>
                </div>
            `;
            break;
            
        case 'vehicle':
            problemInputs.innerHTML = `
                <div class="bg-white rounded-lg p-4 border-2 border-red-200">
                    <label class="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-tachometer-alt text-red-600 mr-2"></i>Speed (v) in km/h:
                    </label>
                    <input type="number" id="vehicleSpeed" placeholder="e.g., 60" min="0" step="0.1"
                           class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50">
                </div>
                <div class="bg-white rounded-lg p-4 border-2 border-red-200">
                    <label class="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-sliders-h text-blue-600 mr-2"></i>Coefficient (a):
                    </label>
                    <input type="number" id="vehicleCoeffA" placeholder="e.g., 120" min="0" step="0.01"
                           class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50">
                </div>
                <div class="bg-white rounded-lg p-4 border-2 border-red-200">
                    <label class="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-sliders-h text-green-600 mr-2"></i>Coefficient (b):
                    </label>
                    <input type="number" id="vehicleCoeffB" placeholder="e.g., 2" min="0" step="0.01"
                           class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50">
                </div>
                <div class="bg-white rounded-lg p-4 border-2 border-red-200">
                    <label class="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-sliders-h text-purple-600 mr-2"></i>Coefficient (c):
                    </label>
                    <input type="number" id="vehicleCoeffC" placeholder="e.g., 100" min="0" step="0.01"
                           class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50">
                </div>
            `;
            problemDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                    <i class="fas fa-question-circle text-red-600 mr-2"></i>Problem Description:
                </h4>
                <div class="text-gray-700 bg-white rounded-lg p-4 border-2 border-red-200">
                    <p class="mb-2">Calculate fuel efficiency using the rational function:</p>
                    <p class="font-mono text-center bg-gray-50 p-2 rounded mb-2">E(v) = av/(v² + bv + c)</p>
                    <p class="text-sm text-gray-600">where E is efficiency (km/L), v is velocity (km/h), and a, b, c are vehicle-specific constants</p>
                </div>
            `;
            break;
            
        default:
            problemInputs.innerHTML = '<div class="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300 text-center text-gray-500"><i class="fas fa-hand-pointer text-2xl mb-2"></i><p class="text-sm">Select a problem type to begin</p></div>';
            problemDescription.innerHTML = '<div class="text-gray-600 bg-white rounded-lg p-3 border-2 border-gray-200">Select a problem type to see the description</div>';
    }
}

// Solve Real-World Problem
function solveRealWorldProblem() {
    const problemType = document.getElementById('problemType').value;
    
    if (!problemType) {
        showError('Please select a problem type first.');
        return;
    }
    
    try {
        let solution;
        
        switch (problemType) {
            case 'resistance':
                solution = solveResistanceProblem();
                break;
            case 'lens':
                solution = solveLensProblem();
                break;
            case 'cost':
                solution = solveCostProblem();
                break;
            case 'market':
                solution = solveMarketProblem();
                break;
            case 'vehicle':
                solution = solveVehicleProblem();
                break;
            default:
                showError('Unknown problem type.');
                return;
        }
        
        displaySolution(solution);
        
    } catch (error) {
        console.error('Error solving problem:', error);
        showError('Error solving problem. Please check your inputs.');
    }
}

// Solve Resistance Problem
function solveResistanceProblem() {
    const r1 = parseFloat(document.getElementById('r1').value);
    const r2 = parseFloat(document.getElementById('r2').value);
    const r3 = parseFloat(document.getElementById('r3').value);
    
    if (isNaN(r1) || isNaN(r2) || isNaN(r3) || r1 <= 0 || r2 <= 0 || r3 <= 0) {
        throw new Error('Please enter valid positive resistance values.');
    }
    
    const reciprocalSum = (1/r1) + (1/r2) + (1/r3);
    if (reciprocalSum === 0) {
        throw new Error('Invalid resistance values: reciprocal sum equals zero.');
    }
    const totalResistance = 1 / reciprocalSum;
    
    return {
        steps: [
            `Given: R₁ = ${r1}Ω, R₂ = ${r2}Ω, R₃ = ${r3}Ω`,
            `Step 1: Apply the Parallel Resistance Formula`,
            `1/R_total = 1/R₁ + 1/R₂ + 1/R₃`,
            `Step 2: Substitute the given values`,
            `1/R_total = 1/${r1} + 1/${r2} + 1/${r3}`,
            `Step 3: Calculate individual reciprocals`,
            `1/R₁ = ${(1/r1).toFixed(4)}, 1/R₂ = ${(1/r2).toFixed(4)}, 1/R₃ = ${(1/r3).toFixed(4)}`,
            `Step 4: Sum the reciprocals`,
            `1/R_total = ${(1/r1).toFixed(4)} + ${(1/r2).toFixed(4)} + ${(1/r3).toFixed(4)}`,
            `1/R_total = ${reciprocalSum.toFixed(4)}`,
            `Step 5: Calculate total resistance`,
            `R_total = 1/${reciprocalSum.toFixed(4)}`,
            `R_total = ${totalResistance.toFixed(2)}Ω`
        ],
        answer: `Total resistance = ${totalResistance.toFixed(2)}Ω`
    };
}

// Solve Lens Problem
function solveLensProblem() {
    const focalLength = parseFloat(document.getElementById('focalLength').value);
    const objectDistance = parseFloat(document.getElementById('objectDistance').value);
    
    if (isNaN(focalLength) || isNaN(objectDistance) || focalLength <= 0 || objectDistance <= 0) {
        throw new Error('Please enter valid positive values for focal length and object distance.');
    }
    
    if (objectDistance === focalLength) {
        throw new Error('Object distance cannot equal focal length (image would be at infinity).');
    }
    
    const reciprocalDiff = (1/focalLength) - (1/objectDistance);
    if (reciprocalDiff === 0) {
        throw new Error('Invalid values: image distance would be infinite.');
    }
    
    const imageDistance = 1 / reciprocalDiff;
    
    return {
        steps: [
            `Given: Focal Length (f) = ${focalLength}cm, Object Distance (d₀) = ${objectDistance}cm`,
            `Step 1: Apply the Lens Equation`,
            `1/f = 1/d₀ + 1/dᵢ`,
            `Step 2: Rearrange to solve for image distance`,
            `1/dᵢ = 1/f - 1/d₀`,
            `Step 3: Substitute the given values`,
            `1/dᵢ = 1/${focalLength} - 1/${objectDistance}`,
            `Step 4: Calculate the reciprocals`,
            `1/f = ${(1/focalLength).toFixed(4)}, 1/d₀ = ${(1/objectDistance).toFixed(4)}`,
            `Step 5: Calculate the difference`,
            `1/dᵢ = ${(1/focalLength).toFixed(4)} - ${(1/objectDistance).toFixed(4)}`,
            `1/dᵢ = ${reciprocalDiff.toFixed(4)}`,
            `Step 6: Calculate image distance`,
            `dᵢ = 1/${reciprocalDiff.toFixed(4)}`,
            `dᵢ = ${imageDistance.toFixed(2)}cm`
        ],
        answer: `Image distance = ${imageDistance.toFixed(2)}cm`
    };
}

// Solve Cost Problem
function solveCostProblem() {
    const fixedCost = parseFloat(document.getElementById('fixedCost').value);
    const variableCost = parseFloat(document.getElementById('variableCost').value);
    const units = parseFloat(document.getElementById('units').value);
    
    if (isNaN(fixedCost) || isNaN(variableCost) || isNaN(units) || fixedCost < 0 || variableCost < 0 || units <= 0) {
        throw new Error('Please enter valid positive values for all cost parameters.');
    }
    
    const totalCost = fixedCost + (variableCost * units);
    const averageCost = totalCost / units;
    
    return {
        steps: [
            `Given: Fixed Cost = $${fixedCost.toFixed(2)}, Variable Cost = $${variableCost.toFixed(2)}/unit, Units = ${units}`,
            `Step 1: Calculate Total Cost Function`,
            `C(x) = Fixed Cost + (Variable Cost × x)`,
            `C(x) = $${fixedCost.toFixed(2)} + ($${variableCost.toFixed(2)} × x)`,
            `Step 2: Evaluate Total Cost at x = ${units}`,
            `C(${units}) = $${fixedCost.toFixed(2)} + ($${variableCost.toFixed(2)} × ${units})`,
            `C(${units}) = $${fixedCost.toFixed(2)} + $${(variableCost * units).toFixed(2)}`,
            `C(${units}) = $${totalCost.toFixed(2)}`,
            `Step 3: Calculate Average Cost`,
            `AC(x) = C(x)/x = $${totalCost.toFixed(2)}/${units}`,
            `AC(${units}) = $${averageCost.toFixed(2)} per unit`
        ],
        answer: `Average cost per unit = $${averageCost.toFixed(2)}`
    };
}

// Solve Market Share Problem
function solveMarketProblem() {
    const marketSize = parseFloat(document.getElementById('marketSize').value);
    const marketCoeff = parseFloat(document.getElementById('marketCoeff').value);
    const marketPrice = parseFloat(document.getElementById('marketPrice').value);
    
    if (isNaN(marketSize) || isNaN(marketCoeff) || isNaN(marketPrice) || marketSize <= 0 || marketCoeff < 0 || marketPrice < 0) {
        throw new Error('Please enter valid positive values for all market parameters.');
    }
    
    const marketShare = (marketCoeff * marketPrice) / (marketSize + marketPrice);
    const marketSharePercent = (marketShare * 100).toFixed(2);
    
    return {
        steps: [
            `Given: Total Market Size (M) = ${marketSize}, Coefficient (a) = ${marketCoeff}, Price (p) = $${marketPrice.toFixed(2)}`,
            `Step 1: Identify the Market Share Function`,
            `S(p) = ap/(M + p)`,
            `Step 2: Substitute the given values`,
            `S(${marketPrice.toFixed(2)}) = (${marketCoeff} × ${marketPrice.toFixed(2)})/(${marketSize} + ${marketPrice.toFixed(2)})`,
            `S(${marketPrice.toFixed(2)}) = ${(marketCoeff * marketPrice).toFixed(2)}/${(marketSize + marketPrice).toFixed(2)}`,
            `Step 3: Calculate Market Share`,
            `S(${marketPrice.toFixed(2)}) = ${marketShare.toFixed(4)}`,
            `Market Share = ${marketSharePercent}%`
        ],
        answer: `Market share at price $${marketPrice.toFixed(2)} = ${marketSharePercent}%`
    };
}

// Solve Vehicle Performance Problem
function solveVehicleProblem() {
    const speed = parseFloat(document.getElementById('vehicleSpeed').value);
    const coeffA = parseFloat(document.getElementById('vehicleCoeffA').value);
    const coeffB = parseFloat(document.getElementById('vehicleCoeffB').value);
    const coeffC = parseFloat(document.getElementById('vehicleCoeffC').value);
    
    if (isNaN(speed) || isNaN(coeffA) || isNaN(coeffB) || isNaN(coeffC) || speed <= 0 || coeffA < 0 || coeffB < 0 || coeffC < 0) {
        throw new Error('Please enter valid positive values for all vehicle parameters.');
    }
    
    const denominator = (speed * speed) + (coeffB * speed) + coeffC;
    if (denominator === 0) {
        throw new Error('Invalid combination: denominator equals zero. Please check your inputs.');
    }
    
    const efficiency = (coeffA * speed) / denominator;
    
    return {
        steps: [
            `Given: Speed (v) = ${speed.toFixed(1)} km/h, Coefficient a = ${coeffA}, Coefficient b = ${coeffB}, Coefficient c = ${coeffC}`,
            `Step 1: Identify the Efficiency Function`,
            `E(v) = av/(v² + bv + c)`,
            `Step 2: Calculate the Denominator`,
            `v² + bv + c = (${speed.toFixed(1)})² + (${coeffB} × ${speed.toFixed(1)}) + ${coeffC}`,
            `v² + bv + c = ${(speed * speed).toFixed(2)} + ${(coeffB * speed).toFixed(2)} + ${coeffC}`,
            `v² + bv + c = ${denominator.toFixed(2)}`,
            `Step 3: Calculate the Numerator`,
            `av = ${coeffA} × ${speed.toFixed(1)} = ${(coeffA * speed).toFixed(2)}`,
            `Step 4: Calculate Efficiency`,
            `E(${speed.toFixed(1)}) = ${(coeffA * speed).toFixed(2)}/${denominator.toFixed(2)}`,
            `E(${speed.toFixed(1)}) = ${efficiency.toFixed(4)} km/L`
        ],
        answer: `Fuel efficiency at ${speed.toFixed(1)} km/h = ${efficiency.toFixed(4)} km/L`
    };
}

// Display Solution
function displaySolution(solution) {
    const solutionSteps = document.getElementById('solutionSteps');
    const finalAnswer = document.getElementById('finalAnswer');
    
    if (solutionSteps) {
        let stepNumber = 1;
        const formattedSteps = solution.steps.map(step => {
            // Check if step starts with "Step" to avoid numbering it
            if (step.startsWith('Step ')) {
                return `<div class="bg-blue-100 border-l-4 border-blue-500 p-3 rounded mb-2"><strong class="text-blue-800">${step}</strong></div>`;
            } else if (step.startsWith('Given:')) {
                return `<div class="bg-gray-100 border-l-4 border-gray-500 p-3 rounded mb-2"><strong class="text-gray-800">${step}</strong></div>`;
            } else {
                return `<div class="pl-4 py-2 text-gray-700 border-l-2 border-green-300 mb-1">${stepNumber++}. ${step}</div>`;
            }
        }).join('');
        
        solutionSteps.innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                <i class="fas fa-list-ol text-green-600 mr-2"></i>Solution Steps:
            </h4>
            <div class="bg-white rounded-lg p-4 border-2 border-green-200 max-h-[400px] overflow-y-auto">
                ${formattedSteps}
            </div>
        `;
    }
    
    if (finalAnswer) {
        finalAnswer.innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                <i class="fas fa-check-circle text-purple-600 mr-2"></i>Final Answer:
            </h4>
            <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-400">
                <div class="text-xl font-bold text-green-700 text-center">${solution.answer}</div>
            </div>
        `;
    }
    
    // Scroll to solution section smoothly
    const solutionSection = document.getElementById('lesson4-example');
    if (solutionSection) {
        solutionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Utility Functions
function showFunctionDisplay(functionText, domainText, verticalAsymptotes, horizontalAsymptotes) {
    document.getElementById('functionDisplay').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Function:</h4>
        <div class="text-lg font-mono text-primary">${functionText}</div>
    `;
    document.getElementById('domainDisplay').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Domain:</h4>
        <div class="text-gray-700">${domainText}</div>
    `;
    document.getElementById('asymptotesDisplay').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Asymptotes:</h4>
        <div class="text-gray-700">Vertical: <span class="text-red-600">${verticalAsymptotes}</span></div>
        <div class="text-gray-700">Horizontal: <span class="text-blue-600">${horizontalAsymptotes}</span></div>
    `;
}

function showError(message) {
    Swal.fire({
        title: 'Error',
        text: message,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444',
        background: '#ffffff',
        customClass: {
            popup: 'rounded-2xl',
            title: 'text-slate-800',
            content: 'text-slate-600'
        }
    });
}

function showSuccess(message) {
    Swal.fire({
        title: 'Success',
        text: message,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#10b981',
        background: '#ffffff',
        customClass: {
            popup: 'rounded-2xl',
            title: 'text-slate-800',
            content: 'text-slate-600'
        }
    });
}

// User Progress Management
function loadUserProgress() {
    // Load saved progress from localStorage
    const savedProgress = localStorage.getItem('representationsOfRationalFunctionsProgress');
    if (savedProgress) {
        try {
            const progress = JSON.parse(savedProgress);
            updateProgressDisplay(progress);
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    }
}

function saveUserProgress(lessonId, completed) {
    const progress = JSON.parse(localStorage.getItem('representationsOfRationalFunctionsProgress') || '{}');
    progress[lessonId] = {
        completed: completed,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('representationsOfRationalFunctionsProgress', JSON.stringify(progress));
}

function updateProgressDisplay(progress) {
    // Update lesson completion status
    Object.keys(progress).forEach(lessonId => {
        if (progress[lessonId].completed) {
            const lessonElement = document.getElementById(lessonId);
            if (lessonElement) {
                lessonElement.classList.add('completed');
            }
        }
    });
}

// Authentication Guard
function initializeAuthGuard() {
    // Check if user is authenticated
    fetch('../php/user.php', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            // Redirect to login if not authenticated
            window.location.href = '../index.html';
        } else {
            // Update user name display
            const userNameElement = document.getElementById('userName');
            if (userNameElement && data.user) {
                userNameElement.textContent = data.user.first_name || 'Student';
            }
        }
    })
    .catch(error => {
        console.error('Authentication check failed:', error);
        // Redirect to login on error
        window.location.href = '../index.html';
    });
}

// Auto-save functionality
function autoSave() {
    const currentLesson = localStorage.getItem('currentLesson') || '1';
    const progress = JSON.parse(localStorage.getItem('representationsOfRationalFunctionsProgress') || '{}');
    
    // Mark current lesson as in progress
    progress[`lesson${currentLesson}`] = {
        completed: false,
        inProgress: true,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('representationsOfRationalFunctionsProgress', JSON.stringify(progress));
}

// Auto-save every 30 seconds
setInterval(autoSave, 30000);

// Input validation
function validateInput(input, type) {
    switch (type) {
        case 'number':
            return !isNaN(parseFloat(input)) && isFinite(input);
        case 'function':
            return input.trim().length > 0;
        default:
            return true;
    }
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
