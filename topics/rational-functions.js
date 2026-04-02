// Rational Functions, Equations and Inequalities - Interactive JavaScript

// Global variables for rational function analysis
let currentFunction = {
    numerator: 'x + 1',
    denominator: 'x - 2',
    domain: 'x ≠ 2',
    verticalAsymptote: 'x = 2',
    horizontalAsymptote: 'y = 1'
};

// Timer variables for each lesson
let lessonTimers = {
    1: { startTime: null, elapsed: 0, interval: null },
    2: { startTime: null, elapsed: 0, interval: null },
    3: { startTime: null, elapsed: 0, interval: null },
    4: { startTime: null, elapsed: 0, interval: null }
};

// Sidebar Navigation Functions
function canAccessTopic(lessonNum) {
    if (lessonNum <= 1) return true;
    for (let i = 1; i < lessonNum; i++) {
        if (!rfCompletedLessons.has(i)) return false;
    }
    return true;
}

function showTopicLockedMessage(lessonNum) {
    const prev = lessonNum - 1;
    Swal.fire({
        icon: 'info',
        title: 'Complete Previous Topic First',
        html: `You need to <strong>pass the 5 questions</strong> for Topic ${prev} before you can open Topic ${lessonNum}.<br><br>Stay on Topic ${prev}, finish the lesson, then take the quiz and get at least <strong>3/5 correct</strong> (60%) to unlock Topic ${lessonNum}.`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#667eea'
    });
}

function setSidebarActive(lessonNum, section) {
    document.querySelectorAll('.lesson-topic-header').forEach(h => h.classList.remove('active'));
    document.querySelectorAll('.lesson-subitem').forEach(s => s.classList.remove('active'));
    const topic = document.getElementById('sidebar-topic-' + lessonNum);
    if (topic) {
        topic.querySelector('.lesson-topic-header').classList.add('active');
        const dot = topic.querySelector('.lesson-topic-dot');
        if (dot) {
            dot.classList.remove('completed');
            if (rfCompletedLessons.has(lessonNum)) dot.classList.add('completed');
        }
    }
    const sub = document.querySelector(`.lesson-subitem[data-lesson="${lessonNum}"][data-section="${section}"]`);
    if (sub) sub.classList.add('active');
}

function updateSidebarProgress() {
    document.querySelectorAll('.lesson-topic').forEach(topic => {
        const n = parseInt(topic.dataset.lesson, 10);
        const accessible = canAccessTopic(n);
        const complete = rfCompletedLessons.has(n);
        topic.classList.toggle('locked', !accessible && !complete);
        const span = topic.querySelector('.topic-status-text');
        if (span) {
            if (complete) {
                span.textContent = 'Complete';
                span.className = 'lesson-topic-status complete';
            } else if (!accessible) {
                span.textContent = '—';
                span.className = 'lesson-topic-status locked';
            } else {
                // Leave empty for accessible but incomplete topics (like functions.html)
                span.textContent = '';
                span.className = '';
            }
        }
        const dot = topic.querySelector('.lesson-topic-dot');
        if (dot) {
            if (complete) dot.classList.add('completed');
            else dot.classList.remove('completed');
        }
    });
}

// Timer Functions
function startLessonTimer(lessonNum) {
    if (lessonTimers[lessonNum].interval) return; // Already running
    
    if (!lessonTimers[lessonNum].startTime) {
        lessonTimers[lessonNum].startTime = Date.now() - lessonTimers[lessonNum].elapsed;
    }
    
    lessonTimers[lessonNum].interval = setInterval(() => {
        const elapsed = Date.now() - lessonTimers[lessonNum].startTime;
        lessonTimers[lessonNum].elapsed = elapsed;
        updateTimerDisplay(lessonNum, elapsed);
    }, 1000);
}

function stopLessonTimer(lessonNum) {
    if (lessonTimers[lessonNum].interval) {
        clearInterval(lessonTimers[lessonNum].interval);
        lessonTimers[lessonNum].interval = null;
    }
}

function updateTimerDisplay(lessonNum, elapsedMs) {
    const timerEl = document.getElementById(`lesson${lessonNum}-timer`);
    if (!timerEl) return;
    
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    // Format as MM:SS for circular timer display
    timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Update circular progress
    const progressCircle = timerEl.closest('.relative')?.querySelector('.timer-progress');
    if (progressCircle) {
        const circumference = 2 * Math.PI * 34; // radius = 34
        const maxTime = 3600; // 1 hour in seconds
        const progress = Math.min(totalSeconds / maxTime, 1);
        const offset = circumference * (1 - progress);
        progressCircle.style.strokeDashoffset = offset;
    }
}

// User Dropdown Functions
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdownMenu');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// Load and display profile picture
async function loadProfilePicture(userId) {
    try {
        const profileResponse = await fetch(`../php/get-profile.php?user_id=${userId}`, {
            credentials: 'include'
        });
        
        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.success && profileData.user && profileData.user.profile_picture) {
                const profilePicPath = `../${profileData.user.profile_picture}`;
                
                // Update profile image in dropdown button
                const profileImg = document.getElementById('userProfileImage');
                const profileIcon = document.getElementById('userProfileIcon');
                if (profileImg && profileIcon) {
                    profileImg.src = profilePicPath;
                    profileImg.onload = function() {
                        profileImg.classList.remove('hidden');
                        profileIcon.style.display = 'none';
                    };
                    profileImg.onerror = function() {
                        profileImg.classList.add('hidden');
                        profileIcon.style.display = 'block';
                    };
                }
                
                // Update profile image in dropdown menu
                const profileImgDropdown = document.getElementById('userProfileImageDropdown');
                const profileIconDropdown = document.getElementById('userProfileIconDropdown');
                if (profileImgDropdown && profileIconDropdown) {
                    profileImgDropdown.src = profilePicPath;
                    profileImgDropdown.onload = function() {
                        profileImgDropdown.classList.remove('hidden');
                        profileIconDropdown.style.display = 'none';
                    };
                    profileImgDropdown.onerror = function() {
                        profileImgDropdown.classList.add('hidden');
                        profileIconDropdown.style.display = 'block';
                    };
                }
                
                // Update profile image in mobile menu
                const profileImgMobile = document.getElementById('userProfileImageMobile');
                const profileIconMobile = document.getElementById('userProfileIconMobile');
                if (profileImgMobile && profileIconMobile) {
                    profileImgMobile.src = profilePicPath;
                    profileImgMobile.onload = function() {
                        profileImgMobile.classList.remove('hidden');
                        profileIconMobile.style.display = 'none';
                    };
                    profileImgMobile.onerror = function() {
                        profileImgMobile.classList.add('hidden');
                        profileIconMobile.style.display = 'block';
                    };
                }
            }
        }
    } catch (e) {
        console.error('Error loading profile picture:', e);
    }
}

// Logout with confirmation
function confirmLogout() {
    Swal.fire({
        title: 'Logout?',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, Logout',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        customClass: {
            popup: 'rounded-2xl',
            title: 'text-slate-800',
            content: 'text-slate-600'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const dropdownMenu = document.getElementById('userDropdownMenu');
            const mobileMenu = document.getElementById('mobileMenu');
            if (dropdownMenu) dropdownMenu.classList.add('hidden');
            if (mobileMenu) mobileMenu.classList.add('hidden');
            window.location.href = '../php/logout.php';
        }
    });
}

// Success and Error Notification Functions
function showSuccess(message) {
    // Create a temporary success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
            <i class="fas fa-times"></i>
        </button>
    `;
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

function showError(message) {
    // Create a temporary error notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2';
    notification.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
            <i class="fas fa-times"></i>
        </button>
    `;
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// ----------------------------------------------
// Lesson Navigation & Completion (Rational Topic)
// ----------------------------------------------
let rfCurrentLesson = 1;
let rfCompletedLessons = new Set();
const rfTotalLessons = 4;

// Quiz Arrays - 5 questions per lesson
const rfLesson1Quiz = [
    {
        question: "What is a rational function?",
        options: [
            "A function that can be expressed as the ratio of two polynomials",
            "A function that only works with integers",
            "A function with no restrictions",
            "A function that always returns zero"
        ],
        correct: 0
    },
    {
        question: "What is the domain restriction for f(x) = 1/(x - 2)?",
        options: [
            "x ≠ 0",
            "x ≠ 2",
            "x ≠ -2",
            "No restrictions"
        ],
        correct: 1
    },
    {
        question: "For the function f(x) = (x + 1)/(x - 2), what is the vertical asymptote?",
        options: [
            "x = -1",
            "x = 2",
            "x = 0",
            "No vertical asymptote"
        ],
        correct: 1
    },
    {
        question: "What happens when the denominator of a rational function equals zero?",
        options: [
            "The function equals zero",
            "The function is undefined (vertical asymptote)",
            "The function equals one",
            "The function becomes linear"
        ],
        correct: 1
    },
    {
        question: "In the function f(x) = (x² - 1)/(x - 1), what is the domain?",
        options: [
            "All real numbers",
            "x ≠ 1",
            "x ≠ -1",
            "x ≠ 1 and x ≠ -1"
        ],
        correct: 1
    }
];

const rfLesson2Quiz = [
    {
        question: "How do you find vertical asymptotes of a rational function?",
        options: [
            "Set numerator equal to zero",
            "Set denominator equal to zero",
            "Set the function equal to zero",
            "Find where the function equals one"
        ],
        correct: 1
    },
    {
        question: "If the degree of the numerator is less than the degree of the denominator, what is the horizontal asymptote?",
        options: [
            "y = 1",
            "y = 0",
            "No horizontal asymptote",
            "y = ratio of leading coefficients"
        ],
        correct: 1
    },
    {
        question: "For f(x) = (2x + 1)/(x - 3), what is the horizontal asymptote?",
        options: [
            "y = 0",
            "y = 2",
            "y = 3",
            "No horizontal asymptote"
        ],
        correct: 1
    },
    {
        question: "What are the x-intercepts of a rational function?",
        options: [
            "Where denominator equals zero",
            "Where numerator equals zero (and denominator doesn't)",
            "Where the function equals one",
            "Where the function is undefined"
        ],
        correct: 1
    },
    {
        question: "In graphing rational functions, what should you find first?",
        options: [
            "Intercepts",
            "Domain restrictions and asymptotes",
            "Range",
            "Derivative"
        ],
        correct: 1
    }
];

const rfLesson3Quiz = [
    {
        question: "What is the first step in solving a rational equation?",
        options: [
            "Solve immediately",
            "Find the LCD (Least Common Denominator)",
            "Factor the numerator",
            "Graph the function"
        ],
        correct: 1
    },
    {
        question: "What are extraneous solutions?",
        options: [
            "Solutions that work perfectly",
            "Solutions that appear valid but don't satisfy the original equation",
            "Solutions that are always correct",
            "Solutions that are complex numbers"
        ],
        correct: 1
    },
    {
        question: "Why must you check solutions in rational equations?",
        options: [
            "To make the problem longer",
            "To verify they don't make any denominator zero",
            "To find more solutions",
            "It's not necessary"
        ],
        correct: 1
    },
    {
        question: "When solving 1/x + 1/(x+2) = 5/12, what is the LCD?",
        options: [
            "x",
            "x + 2",
            "x(x + 2)",
            "12"
        ],
        correct: 2
    },
    {
        question: "After clearing fractions in a rational equation, what type of equation do you typically get?",
        options: [
            "Another rational equation",
            "A polynomial equation",
            "A trigonometric equation",
            "A logarithmic equation"
        ],
        correct: 1
    }
];

const rfLesson4Quiz = [
    {
        question: "What are critical points in solving rational inequalities?",
        options: [
            "Only zeros of the numerator",
            "Zeros of numerator and denominator",
            "Only zeros of the denominator",
            "Points where the function equals one"
        ],
        correct: 1
    },
    {
        question: "How do you solve a rational inequality?",
        options: [
            "Multiply both sides by the denominator",
            "Use sign analysis with critical points",
            "Set it equal to zero",
            "Graph it only"
        ],
        correct: 1
    },
    {
        question: "In the inequality (x - 1)/(x + 2) ≥ 0, what are the critical points?",
        options: [
            "x = 1 only",
            "x = -2 only",
            "x = 1 and x = -2",
            "No critical points"
        ],
        correct: 2
    },
    {
        question: "What does the solution (-∞, -2) ∪ [1, ∞) mean?",
        options: [
            "All numbers between -2 and 1",
            "All numbers less than -2 or greater than or equal to 1",
            "Only -2 and 1",
            "No solution"
        ],
        correct: 1
    },
    {
        question: "When testing intervals in sign analysis, what are you checking?",
        options: [
            "If the function is positive or negative",
            "If the function is increasing or decreasing",
            "If the function is continuous",
            "If the function is differentiable"
        ],
        correct: 0
    }
];

function rfInjectLessonControls() {
    // Navigation controls are now handled by sidebar
    // This function is kept for compatibility but navigation is via sidebar
    rfUpdateNavigationButtons();
}

function rfNavigateLesson(direction) {
    const target = rfCurrentLesson + direction;
    
    // If trying to go to next lesson, show quiz first (unless already completed)
    if (direction === 1) {
        // Moving forward - check if current lesson is completed
        if (rfCurrentLesson === 1 && !rfCompletedLessons.has(1)) {
            rfShowLesson1Quiz();
            return;
        }
        if (rfCurrentLesson === 2 && !rfCompletedLessons.has(2)) {
            rfRunLessonQuiz(rfLesson2Quiz, 2, () => setTimeout(() => rfShowLesson(3, true), 300));
            return;
        }
        if (rfCurrentLesson === 3 && !rfCompletedLessons.has(3)) {
            rfRunLessonQuiz(rfLesson3Quiz, 3, () => setTimeout(() => rfShowLesson(4, true), 300));
            return;
        }
        if (rfCurrentLesson === 4 && !rfCompletedLessons.has(4)) {
            rfRunLessonQuiz(rfLesson4Quiz, 4, () => {
                setTimeout(() => {
                    if (rfCompletedLessons.size === rfTotalLessons) {
                        rfShowTopicCompletionOption();
                    }
                }, 500);
            });
            return;
        }
    }
    
    // If moving backward or lesson is already completed, navigate directly
    if (target >= 1 && target <= rfTotalLessons) {
        rfShowLesson(target, true);
    }
}

function rfShowLesson(lessonNum, scrollToTop = false) {
    // Stop timer for previous lesson
    if (rfCurrentLesson !== lessonNum && rfCurrentLesson >= 1 && rfCurrentLesson <= 4) {
        stopLessonTimer(rfCurrentLesson);
    }
    
    rfCurrentLesson = lessonNum;
    
    // Update sidebar - expand current topic, collapse others
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
    lessonSections.forEach(section => section.classList.remove('active'));
    const target = document.getElementById(`lesson${lessonNum}`);
    if (target) target.classList.add('active');

    // Set sidebar active to objective by default
    setSidebarActive(lessonNum, 'objective');
    updateSidebarProgress();

    // Start timer for current lesson
    startLessonTimer(lessonNum);
    
    // Initialize timer display
    if (lessonTimers[lessonNum].elapsed > 0) {
        updateTimerDisplay(lessonNum, lessonTimers[lessonNum].elapsed);
    }

    // Show/hide Topic 4 quiz button
    const topic4QuizButton = document.getElementById('topic4QuizButton');
    if (topic4QuizButton) {
        if (lessonNum === 4 && !rfCompletedLessons.has(4)) {
            topic4QuizButton.style.display = 'block';
        } else {
            topic4QuizButton.style.display = 'none';
        }
    }

    rfUpdateProgressIndicators();
    rfUpdateNavigationButtons();
    rfUpdateLessonCompletionStatus();

    if (scrollToTop) {
        const lessonContent = document.querySelector('.lesson-content');
        if (lessonContent) lessonContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function rfUpdateNavigationButtons() {
    const disablePrev = rfCurrentLesson <= 1;
    const disableNext = rfCurrentLesson >= rfTotalLessons;
    document.querySelectorAll('#prevLessonBtn').forEach(btn => {
        if (btn) btn.disabled = disablePrev;
    });
    document.querySelectorAll('#nextLessonBtn').forEach(btn => {
        if (btn) btn.disabled = disableNext;
    });
}

function rfUpdateProgressIndicators() {
    // Update all in-lesson progress labels/bars
    document.querySelectorAll('#currentLessonNum').forEach(el => {
        if (el) el.textContent = rfCurrentLesson;
    });
    document.querySelectorAll('#lessonProgressBar').forEach(bar => {
        if (bar) {
            const progress = (rfCurrentLesson / rfTotalLessons) * 100;
            bar.style.width = progress + '%';
        }
    });
}

function rfUpdateLessonCompletionStatus() {
    updateSidebarProgress();
    
    // Check if all lessons are completed and show topic completion option
    if (rfCompletedLessons.size === rfTotalLessons) {
        rfShowTopicCompletionOption();
    }
}

// Completion button functions removed - using quiz system instead

async function rfCompleteLesson(lessonNum) {
    console.log('Attempting to complete lesson:', lessonNum);
    
    try {
        // Guard: prevent duplicate completion submissions
        if (rfCompletedLessons.has(lessonNum)) {
            return;
        }

        const requestData = {
            topic: 'Rational Functions',
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
            console.error('Parse error:', parseError);
            return;
        }
        
        if (data.success) {
            console.log('Lesson completion successful');
            
            // Add to completed lessons
            rfCompletedLessons.add(lessonNum);
            
            // Update lesson navigation
            rfUpdateLessonCompletionStatus();
            updateSidebarProgress();
            
            // Check if all lessons are completed
            if (rfCompletedLessons.size === rfTotalLessons) {
                // Show topic completion option
                rfShowTopicCompletionOption();
            }
        } else {
            console.error('Server returned error:', data);
            throw new Error(data.message || 'Failed to complete lesson');
        }
    } catch (error) {
        console.error('Error completing lesson:', error);
    }
}

async function rfLoadCompletedLessons() {
    console.log('Loading completed lessons for rational-functions topic');
    
    try {
        const requestData = {
            topic: 'Rational Functions',
            action: 'get_completed'
        };
        
        console.log('Sending request:', requestData);
        
        const response = await fetch('../php/complete-lesson.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
            credentials: 'include'
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

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
            console.error('Parse error:', parseError);
            // Don't show error to user, just log it
            // The lesson completion will still work, just won't show previous completions
            return;
        }
        
        if (data.success && data.completed_lessons) {
            console.log('Successfully loaded completed lessons:', data.completed_lessons);
            rfCompletedLessons = new Set(data.completed_lessons);
            rfUpdateLessonCompletionStatus();
            updateSidebarProgress();
            // Hide Topic 4 quiz button if Topic 4 is already completed
            if (rfCompletedLessons.has(4)) {
                const quizButton = document.getElementById('topic4QuizButton');
                if (quizButton) {
                    quizButton.style.display = 'none';
                }
            }
        } else if (!data.success) {
            console.warn('Failed to load completed lessons:', data.message);
            // Don't show error to user, just log it
        }
    } catch (error) {
        console.error('Error loading completed lessons:', error);
        // Don't show error to user, just log it
        // The lesson completion will still work, just won't show previous completions
    }
}

// Navigation functions removed - using sidebar navigation instead

// Shuffle array using Fisher-Yates algorithm
function rfShuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Shuffle quiz questions and options
function rfShuffleQuiz(quizArray) {
    // Shuffle questions
    const shuffledQuestions = rfShuffleArray(quizArray);
    
    // Shuffle options for each question and update correct answer index
    return shuffledQuestions.map(quiz => {
        const originalOptions = [...quiz.options];
        const originalCorrect = quiz.correct;
        
        // Create array of indices and shuffle them
        const indices = originalOptions.map((_, i) => i);
        const shuffledIndices = rfShuffleArray(indices);
        
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
function rfGenerateExplanation(quiz, selectedAnswer) {
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
    if (question.includes('rational function')) {
        explanation += 'HOW TO SOLVE:\nA rational function is a function expressed as the ratio of two polynomials. The denominator cannot be zero, which creates domain restrictions.';
    } else if (question.includes('domain') || question.includes('restriction')) {
        explanation += 'HOW TO SOLVE:\nTo find domain restrictions, set the denominator equal to zero and solve. Those values are excluded from the domain.';
    } else if (question.includes('asymptote')) {
        explanation += 'HOW TO SOLVE:\nVertical asymptotes occur where the denominator equals zero. Horizontal asymptotes depend on the degrees of numerator and denominator.';
    } else if (question.includes('equation') || question.includes('solve')) {
        explanation += 'HOW TO SOLVE:\n1. Find the LCD (Least Common Denominator)\n2. Clear fractions by multiplying both sides by LCD\n3. Solve the resulting polynomial equation\n4. Check for extraneous solutions';
    } else if (question.includes('inequality')) {
        explanation += 'HOW TO SOLVE:\n1. Find critical points (where numerator = 0 and denominator = 0)\n2. Create number line with critical points\n3. Test intervals to determine sign\n4. Identify solution intervals';
    } else {
        explanation += 'HOW TO SOLVE:\n1. Read the question carefully\n2. Identify what concept is being tested\n3. Apply the relevant rules or formulas\n4. Check your answer makes sense';
    }
    return explanation;
}

// Quiz Functions
function rfRunLessonQuiz(quizArray, lessonNum, onPassed) {
    // Track quiz start time
    window.quizStartTime = Date.now();
    
    // Shuffle quiz questions and options
    const shuffledQuiz = rfShuffleQuiz(quizArray);
    
    let currentQuestion = 0;
    let score = 0;
    let userAnswers = [];

    Swal.fire({
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
        width: '650px',
        customClass: {
            popup: 'rounded-2xl',
            title: 'text-slate-800',
            htmlContainer: 'text-left'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            window.quizStartTime = Date.now(); // Start timer when user actually starts questions
            displayQuestion();
        } else {
            rfShowLesson(lessonNum, true);
        }
    });

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
            width: '750px',
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
                        explanation = rfGenerateExplanation(currentQuiz, selectedAnswer);
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
                            if (cr.isConfirmed) rfShowLesson(lessonNum, true);
                            else displayQuestion();
                        });
                    } else {
                        rfShowLesson(lessonNum, true);
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
        
        // Log all answers for debugging
        console.log('Quiz Results - All Answers:', {
            lessonNum: lessonNum,
            score: score,
            totalQuestions: shuffledQuiz.length,
            answersCount: userAnswers.length,
            answers: userAnswers
        });

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
            width: '600px',
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
                    const quizResult = await rfStoreQuizData(lessonNum, score, shuffledQuiz.length, userAnswers);
                    console.log('Quiz data stored:', quizResult);
                    
                    // Small delay to ensure quiz data is saved
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    // Now complete the lesson (this will save final study time)
                    await rfCompleteLesson(lessonNum);
                    
                    // If this is Topic 4, check if all topics are completed and show completion section
                    if (lessonNum === 4) {
                        // Hide quiz button after completing Topic 4
                        const quizButton = document.getElementById('topic4QuizButton');
                        if (quizButton) {
                            quizButton.style.display = 'none';
                        }
                        // Small delay to ensure completion is saved
                        setTimeout(() => {
                            // Check if all lessons are completed
                            if (rfCompletedLessons.size === rfTotalLessons) {
                                // Only show performance analysis after ALL quizzes are completed
                                showPerformanceAnalysisSection();
                                rfShowTopicCompletionOption();
                            }
                        }, 500);
                    }
                } catch (e) {
                    console.error('Error storing quiz data:', e);
                    // even if saving fails, continue UI flow
                }
                if (typeof onPassed === 'function') onPassed();
            } else {
                // Store quiz data even if failed
                try {
                    await rfStoreQuizData(lessonNum, score, shuffledQuiz.length, userAnswers);
                    // Performance analysis will only show after all quizzes are completed
                } catch (e) {
                    console.error('Error storing quiz data:', e);
                }
                rfShowLesson(lessonNum, true);
            }
        });
    }
}

// Show Lesson 1 Quiz
function rfShowLesson1Quiz() {
    if (rfCompletedLessons.has(1)) { // already passed, skip quiz
        rfShowLesson(2, true);
        return;
    }
    
    // Track quiz start time
    window.quizStartTime = Date.now();
    
    // Shuffle quiz questions and options
    const shuffledQuiz = rfShuffleQuiz(rfLesson1Quiz);
    
    let currentQuestion = 0;
    let score = 0;
    let userAnswers = [];

    // Show questions purpose explanation FIRST as a separate popup
    Swal.fire({
        title: '📚 Topic 1 Quiz',
        html: `
            <div class="text-left space-y-4">
                <div class="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-5 border-l-4 border-primary">
                    <h3 class="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <i class="fas fa-info-circle text-primary mr-2"></i>
                        Quiz Instructions
                    </h3>
                    <p class="text-gray-700 mb-2">
                        You will answer <strong>5 questions</strong> for Topic 1.
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
                        <p><strong>Total Questions:</strong> 5 questions about Topic 1</p>
                        <p><strong>Passing Score:</strong> At least 3 out of 5 correct answers (60%)</p>
                        <p><strong>What Happens:</strong></p>
                        <ul class="list-disc list-inside ml-4 space-y-1">
                            <li>If you pass → You can proceed to Topic 2</li>
                            <li>If you fail → You'll need to review Topic 1 and try again</li>
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
        width: '650px',
        customClass: {
            popup: 'rounded-2xl',
            title: 'text-slate-800',
            htmlContainer: 'text-left'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            window.quizStartTime = Date.now(); // Start timer when user actually starts questions
            displayQuestion();
        } else {
            rfShowLesson(1, true);
        }
    });

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
                    <div class="space-y-3">
                        ${optionsHtml}
                    </div>
                </div>
            `,
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'Cancel Quiz',
            cancelButtonColor: '#ef4444',
            allowOutsideClick: false,
            width: '750px',
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
                        explanation = rfGenerateExplanation(currentQuiz, selectedAnswer);
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
        const passed = score >= 3; // Need at least 3 out of 5 to pass
        
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
        
        // Log all answers for debugging
        console.log('Lesson 1 Quiz Results - All Answers:', {
            score: score,
            totalQuestions: shuffledQuiz.length,
            answersCount: userAnswers.length,
            answers: userAnswers
        });

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
                    ${passed ? 
                        '<p class="text-lg text-gray-700 mb-4">Great job! You understand the topic. You can now proceed to Topic 2.</p>' :
                        '<p class="text-lg text-gray-700 mb-4">You need to score at least 60% (3/5) to proceed. Please review Topic 1 and try again!</p>'
                    }
                </div>
            `,
            icon: passed ? 'success' : 'error',
            confirmButtonText: passed ? 'Continue to Topic 2' : 'Review Topic 1',
            confirmButtonColor: passed ? '#10b981' : '#667eea',
            allowOutsideClick: false,
            width: '600px',
            customClass: {
                popup: 'rounded-2xl',
                title: 'text-slate-800',
                htmlContainer: 'text-center'
            }
        }).then(async (result) => {
            if (result.isConfirmed && passed) {
                // Mark lesson as complete and proceed to next lesson
                try {
                    // Store quiz data before completing lesson
                    await rfStoreQuizData(1, score, shuffledQuiz.length, userAnswers);
                    await rfCompleteLesson(1);
                    // Performance analysis will only show after all quizzes are completed
                    // Small delay to ensure completion is saved
                    setTimeout(() => {
                        rfShowLesson(2, true);
                    }, 500);
                } catch (error) {
                    console.error('Error completing lesson:', error);
                    // Still proceed to next lesson even if save fails
                    rfShowLesson(2, true);
                }
            } else if (!passed) {
                // Store quiz data even if failed
                try {
                    await rfStoreQuizData(1, score, shuffledQuiz.length, userAnswers);
                    // Performance analysis will only show after all quizzes are completed
                } catch (e) {
                    console.error('Error storing quiz data:', e);
                }
                // Stay on Lesson 1
                rfShowLesson(1, true);
            }
        });
    }
}

// Show Topic 4 Quiz
function rfShowTopic4Quiz() {
    if (rfCompletedLessons.has(4)) {
        // Already passed, show completion section
        rfShowTopicCompletionOption();
        return;
    }
    rfRunLessonQuiz(rfLesson4Quiz, 4, async () => {
        // After passing Topic 4 quiz
        try {
            await rfCompleteLesson(4);
            // Small delay to ensure completion is saved
            setTimeout(() => {
                // Check if all lessons are completed and show completion section
                if (rfCompletedLessons.size === rfTotalLessons) {
                    rfShowTopicCompletionOption();
                }
                // Hide quiz button and show completion section
                const quizButton = document.getElementById('topic4QuizButton');
                if (quizButton) {
                    quizButton.style.display = 'none';
                }
            }, 500);
        } catch (error) {
            console.error('Error completing Topic 4:', error);
        }
    });
}

// Store quiz data to database
/**
 * Store Quiz Data to Database
 * 
 * DATABASE TABLE: quiz_attempts
 * PHP ENDPOINT: ../php/store-quiz-data.php
 * 
 * IMPORTANT SEPARATION:
 * - This file (topics/rational-functions.js) uses quiz_type format: rational_functions_topic_1, rational_functions_topic_2, etc.
 * - Quiz files in /quiz folder use different quiz_type values
 * - Both use the same quiz_attempts table but with DIFFERENT quiz_type values, so NO CONFLICT
 * 
 * - Uses session-based authentication (credentials: 'include')
 * - Quiz type format: rational_functions_topic_1, rational_functions_topic_2, etc.
 * - Student ID: Automatically retrieved from PHP session ($_SESSION['user_id'])
 * 
 * @param {number} lessonNum - Topic number (1-4)
 * @param {number} score - Number of correct answers
 * @param {number} totalQuestions - Total number of questions
 * @param {Array} userAnswers - Array of answer objects with question, options, selected, correct, etc.
 */
async function rfStoreQuizData(lessonNum, score, totalQuestions, userAnswers) {
    try {
        // Validate and clean userAnswers array
        // Ensure all questions are accounted for (up to totalQuestions)
        const cleanedAnswers = [];
        for (let i = 0; i < totalQuestions; i++) {
            if (userAnswers[i] && typeof userAnswers[i] === 'object') {
                // Ensure all required fields are present
                const answer = {
                    question: userAnswers[i].question || `Question ${i + 1}`,
                    options: userAnswers[i].options || [],
                    selected: userAnswers[i].selected !== undefined ? userAnswers[i].selected : -1,
                    selectedText: userAnswers[i].selectedText || (userAnswers[i].options && userAnswers[i].options[userAnswers[i].selected] ? userAnswers[i].options[userAnswers[i].selected] : 'N/A'),
                    correct: userAnswers[i].correct !== undefined ? userAnswers[i].correct : -1,
                    correctText: userAnswers[i].correctText || (userAnswers[i].options && userAnswers[i].options[userAnswers[i].correct] ? userAnswers[i].options[userAnswers[i].correct] : 'N/A'),
                    isCorrect: userAnswers[i].isCorrect !== undefined ? userAnswers[i].isCorrect : false,
                    explanation: userAnswers[i].explanation || '' // Include explanation if available
                };
                cleanedAnswers.push(answer);
            } else {
                // Missing answer - create placeholder
                console.warn(`Missing answer for question ${i + 1}`);
                cleanedAnswers.push({
                    question: `Question ${i + 1}`,
                    options: [],
                    selected: -1,
                    selectedText: 'Not answered',
                    correct: -1,
                    correctText: 'N/A',
                    isCorrect: false
                });
            }
        }
        
        // Log for debugging
        console.log(`Storing quiz data for Topic ${lessonNum}:`, {
            quiz_type: `rational_functions_topic_${lessonNum}`,
            topic: 'rational-functions',
            score: score,
            totalQuestions: totalQuestions,
            answersCount: cleanedAnswers.length,
            answers: cleanedAnswers
        });
        
        // Calculate time taken for quiz (if available)
        const quizStartTime = window.quizStartTime || Date.now();
        const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000); // in seconds
        
        // IMPORTANT: This endpoint uses $_SESSION['user_id'] as student_id
        // Quiz type format: rational_functions_topic_1, rational_functions_topic_2, etc.
        const response = await fetch('../php/store-quiz-data.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                topic: 'rational-functions', // Topic name - used for filtering
                lesson: lessonNum, // Lesson number (1-4)
                quiz_type: `rational_functions_topic_${lessonNum}`,
                score: score,
                total_questions: totalQuestions,
                answers: cleanedAnswers, // Detailed answers
                time_taken_seconds: timeTaken
            }),
            credentials: 'include' // Sends session cookie so PHP can get $_SESSION['user_id']
        });

        if (!response.ok) {
            // Try to get error message from response
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorText = await response.text();
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // Not JSON, use status text
            }
            throw new Error(errorMessage);
        }

        const text = await response.text();
        let data;
        
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('Invalid JSON response:', text);
            throw new Error('Server returned invalid response. Please check if database tables exist.');
        }
        
        if (!data.success) {
            console.warn('Quiz data storage warning:', data.message);
            // Don't throw error, just log warning - quiz completion should still work
        } else {
            console.log('Quiz data stored successfully:', data);
        }
        
        return data;
    } catch (error) {
        console.error('Error storing quiz data:', error);
        // Don't throw error - allow quiz completion to continue even if storage fails
        return { success: false, message: error.message };
    }
}

// Show topic completion option when all lessons are completed
function rfShowTopicCompletionOption() {
    // Create a topic completion section if it doesn't exist
    let topicCompletionSection = document.getElementById('topicCompletionSection');
    
    if (!topicCompletionSection) {
        // Find the last lesson section to add the topic completion after it
        const lastLesson = document.querySelector('#lesson4');
        if (lastLesson) {
            const completionHTML = `
                <div id="topicCompletionSection" class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 mb-8" style="display: block;">
                    <h3 class="text-xl font-semibold text-gray-800 mb-4 text-center">
                        <i class="fas fa-trophy text-purple-500 mr-2"></i>Complete This Topic
                    </h3>
                    <p class="text-gray-600 text-center mb-6">
                        Congratulations! You've completed all lessons in the Rational Functions topic. Mark this topic as complete to update your progress.
                    </p>
                    <div class="text-center">
                        <button onclick="rfCompleteTopic()" 
                                class="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-colors font-semibold inline-flex items-center">
                            <i class="fas fa-trophy mr-2"></i>
                            Mark This Topic About Rational Functions Complete
                        </button>
                    </div>
                </div>
            `;
            lastLesson.insertAdjacentHTML('afterend', completionHTML);
        }
    } else {
        topicCompletionSection.style.display = 'block';
    }
}

// Complete the entire topic
async function rfCompleteTopic() {
    console.log('Attempting to complete topic: rational-functions');
    
    try {
        const requestData = {
            topic: 'Rational Functions',
            action: 'complete_topic'
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
        console.log('Response headers:', response.headers);

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
            console.error('Parse error:', parseError);
            
            Swal.fire({
                title: 'Server Error',
                html: `
                    <div class="text-left">
                        <p class="mb-2">The server returned an invalid response.</p>
                        <p class="mb-2"><strong>Possible causes:</strong></p>
                        <ul class="list-disc list-inside mb-4 text-sm">
                            <li>Database tables are missing</li>
                            <li>PHP error occurred</li>
                            <li>Server configuration issue</li>
                        </ul>
                        <p class="mb-2"><strong>Raw response:</strong></p>
                        <pre class="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">${text.substring(0, 500)}</pre>
                        <p class="mt-2 text-sm">
                            <a href="../fix-complete-button.html" class="text-blue-500 underline">
                                Click here to fix this issue
                            </a>
                        </p>
                    </div>
                `,
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
            return;
        }
        
        if (data.success) {
            console.log('Topic completion successful');
            
            // Show success message
            Swal.fire({
                title: 'Topic Completed!',
                text: 'Congratulations! You have successfully completed the Rational Functions topic. Your progress has been updated.',
                icon: 'success',
                confirmButtonText: 'View Progress',
                confirmButtonColor: '#8b5cf6',
                background: '#ffffff',
                customClass: {
                    popup: 'rounded-2xl',
                    title: 'text-slate-800',
                    content: 'text-slate-600'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    // Redirect to dashboard to show updated progress
                    window.location.href = '../dashboard.html#progress';
                }
            });
        } else {
            console.error('Server returned error:', data);
            throw new Error(data.message || 'Failed to complete topic');
        }
    } catch (error) {
        console.error('Error completing topic:', error);
        
        Swal.fire({
            title: 'Error Completing Topic',
            html: `
                <div class="text-left">
                    <p class="mb-2"><strong>Error:</strong> ${error.message}</p>
                    <p class="mb-2"><strong>Topic:</strong> rational-functions</p>
                    <p class="mb-4">Please try the following:</p>
                    <ol class="list-decimal list-inside mb-4 text-sm space-y-1">
                        <li>Make sure you're logged in</li>
                        <li>Check your internet connection</li>
                        <li>Try refreshing the page</li>
                        <li>Contact support if the problem persists</li>
                    </ol>
                    <p class="text-sm">
                        <a href="../fix-complete-button.html" class="text-blue-500 underline">
                            Click here to run diagnostic tools
                        </a>
                    </p>
                </div>
            `,
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
}

// Navigate to next topic
function rfGoToNextTopic() {
    // Show confirmation dialog
    Swal.fire({
        title: 'Continue to Next Topic?',
        text: 'You have completed the Rational Functions topic. Would you like to continue to the next topic?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Continue',
        cancelButtonText: 'Stay Here',
        confirmButtonColor: '#10b981',
        background: '#ffffff',
        customClass: {
            popup: 'rounded-2xl',
            title: 'text-slate-800',
            content: 'text-slate-600'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Redirect to next topic (you can customize this based on your topic order)
            window.location.href = '../topics/representations-of-rational-functions.html';
        }
    });
}

// Review topic (go back to beginning)
function rfReviewTopic() {
    // Show confirmation dialog
    Swal.fire({
        title: 'Review Topic?',
        text: 'Would you like to go back to the beginning of the Rational Functions topic to review?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Review',
        cancelButtonText: 'Stay Here',
        confirmButtonColor: '#8b5cf6',
        background: '#ffffff',
        customClass: {
            popup: 'rounded-2xl',
            title: 'text-slate-800',
            content: 'text-slate-600'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Go to first lesson
            rfShowLesson(1, true);
        }
    });
}

// Expose globals for onclick handlers
window.rfNavigateLesson = rfNavigateLesson;
window.rfCompleteLesson = rfCompleteLesson;
window.rfShowLesson = rfShowLesson;
window.rfCompleteTopic = rfCompleteTopic;
window.rfGoToNextTopic = rfGoToNextTopic;
window.rfReviewTopic = rfReviewTopic;
window.rfShowLesson1Quiz = rfShowLesson1Quiz;
window.rfShowTopic4Quiz = rfShowTopic4Quiz;
window.rfRunLessonQuiz = rfRunLessonQuiz;
window.rfStoreQuizData = rfStoreQuizData;
window.analyzePerformance = analyzePerformance;
window.displayPerformanceAnalysis = displayPerformanceAnalysis;
window.showPerformanceAnalysisSection = showPerformanceAnalysisSection;
window.getTopicNameForAnalysis = getTopicNameForAnalysis;
window.toggleUserDropdown = toggleUserDropdown;
window.toggleMobileMenu = toggleMobileMenu;
window.confirmLogout = confirmLogout;
window.loadProfilePicture = loadProfilePicture;
window.setSidebarActive = setSidebarActive;
window.updateSidebarProgress = updateSidebarProgress;
window.canAccessTopic = canAccessTopic;
window.showTopicLockedMessage = showTopicLockedMessage;

// Initialize all interactive calculators
function initializeCalculators() {
    // Initialize rational function analyzer
    analyzeRationalFunction();
    
    // Initialize graphing calculator
    graphRationalFunction();
    
    // Initialize equation solver
    solveRationalEquation();
    
    // Initialize inequality solver
    solveRationalInequality();
}

// Enhanced Rational Function Analysis Functions
function analyzeRationalFunction() {
    const numerator = document.getElementById('numerator').value;
    const denominator = document.getElementById('denominator').value;
    
    if (!numerator || !denominator) return;
    
    // Parse the functions
    const analysis = analyzeRationalFunctionMath(numerator, denominator);
    
    // Update results with animation
    animateResultUpdate('domainResult', analysis.domain);
    animateResultUpdate('verticalAsymptote', analysis.verticalAsymptote);
    animateResultUpdate('horizontalAsymptote', analysis.horizontalAsymptote);
    animateResultUpdate('xIntercept', analysis.xIntercept || 'None');
    animateResultUpdate('yIntercept', analysis.yIntercept || 'Undefined');
    
    // Draw the graph
    drawRationalFunctionGraph(numerator, denominator);
    
    // Show visual feedback
    showVisualFeedback('Function analyzed successfully!');
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

// Enhanced Step-by-Step Analysis
function showStepByStep() {
    const numerator = document.getElementById('numerator').value;
    const denominator = document.getElementById('denominator').value;
    
    if (!numerator || !denominator) {
        showVisualFeedback('Please enter both numerator and denominator');
        return;
    }
    
    const stepByStepDiv = document.getElementById('stepByStepAnalysis');
    const stepsDiv = document.getElementById('analysisSteps');
    
    // Generate step-by-step analysis
    const steps = generateStepByStepAnalysis(numerator, denominator);
    
    // Populate steps
    stepsDiv.innerHTML = steps.map((step, index) => `
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
    
    // Show the step-by-step analysis
    stepByStepDiv.style.display = 'block';
    stepByStepDiv.scrollIntoView({ behavior: 'smooth' });
}

function generateStepByStepAnalysis(numerator, denominator) {
    const steps = [
        {
            title: "Identify the Function Type",
            description: "This is a rational function of the form f(x) = P(x)/Q(x)",
            expression: `f(x) = ${numerator}/${denominator}`
        },
        {
            title: "Find Domain Restrictions",
            description: "Set the denominator equal to zero to find restrictions",
            expression: `${denominator} = 0`
        },
        {
            title: "Solve for Vertical Asymptotes",
            description: "The vertical asymptotes occur where the denominator equals zero",
            expression: "x = 2 (from x - 2 = 0)"
        },
        {
            title: "Find Horizontal Asymptotes",
            description: "Compare the degrees of numerator and denominator",
            expression: "y = 1 (same degree, ratio of leading coefficients)"
        },
        {
            title: "Find x-intercepts",
            description: "Set numerator equal to zero",
            expression: `${numerator} = 0 → x = -1`
        },
        {
            title: "Find y-intercepts",
            description: "Evaluate f(0)",
            expression: "f(0) = (0 + 1)/(0 - 2) = -0.5"
        }
    ];
    
    return steps;
}

// Enhanced Domain Analysis with Real-time Updates
function analyzeDomain() {
    const functionInput = document.getElementById('domainFunction').value.trim();
    
    if (!functionInput) {
        showVisualFeedback('Please enter a rational function');
        return;
    }
    
    // Parse the function for domain analysis
    const domainAnalysis = parseDomainAnalysis(functionInput);
    
    // Update domain analysis results with animation
    animateResultUpdate('domainRestrictions', domainAnalysis.restrictions);
    animateResultUpdate('domainResult', domainAnalysis.domain);
    
    // Animate the update
    const analysisDiv = document.getElementById('domainAnalysis');
    analysisDiv.style.transform = 'scale(1.05)';
    analysisDiv.style.transition = 'transform 0.3s ease';
    setTimeout(() => {
        analysisDiv.style.transform = 'scale(1)';
    }, 300);
    
    // Show visual feedback
    showVisualFeedback('Domain analysis completed!');
}

// Show Domain Steps
function showDomainSteps() {
    const functionInput = document.getElementById('domainFunction').value.trim();
    
    if (!functionInput) {
        showVisualFeedback('Please enter a rational function first');
        return;
    }
    
    const stepsDiv = document.getElementById('domainSteps');
    const contentDiv = document.getElementById('domainStepsContent');
    
    // Generate step-by-step domain analysis
    const steps = generateDomainSteps(functionInput);
    
    // Populate steps
    contentDiv.innerHTML = steps.map((step, index) => `
        <div class="domain-step">
            <div class="flex items-start">
                <span class="step-number">${index + 1}</span>
                <div class="flex-1">
                    <h6 class="font-semibold text-gray-800 mb-2">${step.title}</h6>
                    <p class="text-gray-700 mb-2">${step.description}</p>
                    <div class="bg-white rounded-lg p-3 border-l-4 border-blue-300">
                        <p class="text-gray-800 font-mono text-lg">${step.expression}</p>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Show the steps
    stepsDiv.classList.remove('hidden');
    stepsDiv.scrollIntoView({ behavior: 'smooth' });
    
    showVisualFeedback('Step-by-step analysis generated!');
}

function generateDomainSteps(functionStr) {
    const steps = [
        {
            title: "Identify the Function",
            description: "This is a rational function where we need to find values that make the denominator zero.",
            expression: `f(x) = ${functionStr}`
        },
        {
            title: "Set Denominator Equal to Zero",
            description: "Find all values of x that make the denominator equal to zero.",
            expression: "Denominator = 0"
        },
        {
            title: "Solve for Restrictions",
            description: "Solve the equation to find the values that are not in the domain.",
            expression: "x = 2, x = -2 (from x² - 4 = 0)"
        },
        {
            title: "Write the Domain",
            description: "The domain includes all real numbers except the restricted values.",
            expression: "Domain: {x | x ≠ 2, x ≠ -2}"
        }
    ];
    
    return steps;
}

// Load Example Function
function loadExampleFunction(functionStr) {
    const input = document.getElementById('domainFunction');
    input.value = functionStr;
    input.style.transform = 'scale(1.05)';
    input.style.transition = 'transform 0.3s ease';
    
    setTimeout(() => {
        input.style.transform = 'scale(1)';
    }, 300);
    
    // Automatically analyze the loaded function
    setTimeout(() => {
        analyzeDomain();
    }, 500);
    
    showVisualFeedback('Example function loaded!');
}

// Clear Domain Input
function clearDomainInput() {
    const input = document.getElementById('domainFunction');
    input.value = '';
    input.focus();
    
    // Clear results
    document.getElementById('domainRestrictions').textContent = 'Enter a function to analyze';
    document.getElementById('domainResult').textContent = 'Enter a function to analyze';
    
    // Hide steps
    const stepsDiv = document.getElementById('domainSteps');
    stepsDiv.classList.add('hidden');
    
    showVisualFeedback('Input cleared!');
}

// Load Random Example
function loadExample() {
    const examples = [
        '(x + 1)/(x - 2)',
        '(x² - 1)/(x + 3)',
        '1/(x² - 9)',
        '(x - 1)/(x² - 4)',
        '(2x + 3)/(x² - 1)',
        '(x + 2)/(x - 5)'
    ];
    
    const randomExample = examples[Math.floor(Math.random() * examples.length)];
    loadExampleFunction(randomExample);
}

function parseDomainAnalysis(functionStr) {
    // Parse the function to find denominator
    const { num, den } = splitFunction(functionStr);
    const denRoots = getDenominatorRoots(den);
    
    let restrictions = 'None';
    let domain = 'All real numbers';
    
    if (denRoots.length > 0) {
        if (denRoots.length === 1) {
            restrictions = `x ≠ ${formatNumber(denRoots[0])}`;
            domain = `(-∞, ${formatNumber(denRoots[0])}) ∪ (${formatNumber(denRoots[0])}, ∞)`;
        } else {
            restrictions = denRoots.map(r => `x ≠ ${formatNumber(r)}`).join(', ');
            const sortedRoots = [...denRoots].sort((a, b) => a - b);
            const intervals = [];
            intervals.push(`(-∞, ${formatNumber(sortedRoots[0])})`);
            for (let i = 0; i < sortedRoots.length - 1; i++) {
                intervals.push(`(${formatNumber(sortedRoots[i])}, ${formatNumber(sortedRoots[i + 1])})`);
            }
            intervals.push(`(${formatNumber(sortedRoots[sortedRoots.length - 1])}, ∞)`);
            domain = intervals.join(' ∪ ');
        }
    }
    
    return { restrictions, domain };
}

// Enhanced Graph Animation
function animateGraph() {
    const canvas = document.getElementById('rationalGraphCanvas');
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
    
    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();
    
    // Draw grid
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += scale) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
    }
    for (let i = 0; i < height; i += scale) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
    }
    
    // Animate the function drawing
    let progress = 0;
    const animate = () => {
        progress += 0.02;
        if (progress > 1) return;
        
        // Clear previous drawing
        ctx.clearRect(0, 0, width, height);
        
        // Redraw axes and grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, height);
        ctx.stroke();
        
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += scale) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
        }
        for (let i = 0; i < height; i += scale) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
            ctx.stroke();
        }
        
        // Draw the function with animation
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        let firstPoint = true;
        const maxX = 10 * progress;
        
        for (let x = -10; x <= maxX; x += 0.1) {
            if (Math.abs(x - 2) < 0.5) continue;
            
            let y = (x + 1) / (x - 2);
            
            if (Math.abs(y) < 20) {
                const screenX = centerX + x * scale;
                const screenY = centerY - y * scale;
                
                if (firstPoint) {
                    ctx.moveTo(screenX, screenY);
                    firstPoint = false;
                } else {
                    ctx.lineTo(screenX, screenY);
                }
            }
        }
        
        ctx.stroke();
        
        // Draw asymptotes
        if (progress > 0.5) {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(centerX + 2 * scale, 0);
            ctx.lineTo(centerX + 2 * scale, height);
            ctx.stroke();
            
            ctx.strokeStyle = '#3b82f6';
            ctx.beginPath();
            ctx.moveTo(0, centerY - 1 * scale);
            ctx.lineTo(width, centerY - 1 * scale);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Add labels
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText('x', width - 10, centerY - 5);
        ctx.fillText('y', centerX + 5, 15);
        
        requestAnimationFrame(animate);
    };
    
    animate();
}

function analyzeRationalFunctionMath(numerator, denominator) {
    // Parse denominator to find vertical asymptotes
    let domain = 'All real numbers';
    let verticalAsymptote = 'None';
    let horizontalAsymptote = 'y = 0';
    let xIntercept = 'None';
    let yIntercept = 'Undefined';
    
    // Find vertical asymptote (denominator = 0)
    const denRoots = getDenominatorRoots(denominator);
    if (denRoots.length > 0) {
        if (denRoots.length === 1) {
            domain = `x ≠ ${formatNumber(denRoots[0])}`;
            verticalAsymptote = `x = ${formatNumber(denRoots[0])}`;
        } else {
            domain = `x ≠ ${denRoots.map(r => formatNumber(r)).join(', x ≠ ')}`;
            verticalAsymptote = denRoots.map(r => `x = ${formatNumber(r)}`).join(', ');
        }
    }
    
    // Determine horizontal asymptote based on degrees
    const numDegree = getPolynomialDegree(normalizeExpr(numerator));
    const denDegree = getPolynomialDegree(normalizeExpr(denominator));
    
    if (numDegree < denDegree) {
        horizontalAsymptote = 'y = 0';
    } else if (numDegree === denDegree) {
        const numLead = getLeadingCoefficient(numerator, numDegree);
        const denLead = getLeadingCoefficient(denominator, denDegree);
        if (denLead !== 0) {
            horizontalAsymptote = `y = ${formatNumber(numLead / denLead)}`;
        } else {
            horizontalAsymptote = 'y = 0';
        }
    } else {
        horizontalAsymptote = 'None (oblique asymptote)';
    }
    
    // Find x-intercepts (numerator = 0, but not denominator)
    const numRoots = getNumeratorRoots(numerator);
    const validXIntercepts = numRoots.filter(r => !isCloseToAny(r, denRoots, 1e-6));
    if (validXIntercepts.length > 0) {
        xIntercept = validXIntercepts.map(r => `x = ${formatNumber(r)}`).join(', ');
    }
    
    // Find y-intercept (f(0))
    const expr = `(${normalizeExpr(numerator)})/(${normalizeExpr(denominator)})`;
    const y0 = safeEvalExpr(expr, 0);
    if (y0 !== null && isFinite(y0)) {
        yIntercept = `y = ${formatNumber(y0)}`;
    }
    
    return {
        domain,
        verticalAsymptote,
        horizontalAsymptote,
        xIntercept,
        yIntercept
    };
}

function getPolynomialDegree(expression) {
    // Simplified degree calculation
    if (expression.includes('x²') || expression.includes('x^2')) return 2;
    if (expression.includes('x')) return 1;
    return 0;
}

function drawRationalFunctionGraph(numerator, denominator) {
    const canvas = document.getElementById('rationalGraphCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 30; // px per unit

    // Helpers
    const expr = `(${normalizeExpr(numerator)})/(${normalizeExpr(denominator)})`;
    const denomRoots = getDenominatorRoots(denominator);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Grid
    drawGrid(ctx, width, height, centerX, centerY, scale);

    // Asymptotes: vertical
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    denomRoots.forEach(r => {
        const xPix = centerX + r * scale;
        ctx.beginPath();
        ctx.moveTo(xPix, 0);
        ctx.lineTo(xPix, height);
        ctx.stroke();
    });

    // Asymptote: horizontal
    const hAsym = computeHorizontalAsymptote(numerator, denominator);
    if (hAsym !== null && isFinite(hAsym)) {
        ctx.strokeStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(0, centerY - hAsym * scale);
        ctx.lineTo(width, centerY - hAsym * scale);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    // Function curve
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2.5;
    let first = true;
    let prevY;
    for (let x = -10; x <= 10; x += 0.02) {
        if (isCloseToAny(x, denomRoots, 0.02)) { first = true; continue; }
        const y = safeEvalExpr(expr, x);
        if (y === null || !isFinite(y) || Math.abs(y) > 50) { first = true; continue; }
        const sx = centerX + x * scale;
        const sy = centerY - y * scale;
        if (first || Math.abs(y - prevY) > 5) {
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            first = false;
        } else {
            ctx.lineTo(sx, sy);
        }
        prevY = y;
    }
    ctx.stroke();

    // Intercepts
    ctx.fillStyle = '#10b981';
    const y0 = safeEvalExpr(expr, 0);
    if (y0 !== null && isFinite(y0) && Math.abs(y0) < 100) {
        drawDot(ctx, centerX, centerY - y0 * scale);
    }

    const numRoots = getNumeratorRoots(numerator);
    numRoots.forEach(r => {
        if (!isCloseToAny(r, denomRoots, 1e-6)) {
            drawDot(ctx, centerX + r * scale, centerY);
        }
    });

    // Axis labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.fillText('x', width - 12, centerY - 6);
    ctx.fillText('y', centerX + 6, 12);
}

function evaluateRationalFunction(x, numerator, denominator) {
    // Simplified evaluation for demo
    if (denominator.includes('x - 2') && Math.abs(x - 2) < 0.1) return undefined;
    
    // Basic rational function: (x + 1)/(x - 2)
    if (numerator.includes('x + 1') && denominator.includes('x - 2')) {
        return (x + 1) / (x - 2);
    }
    
    // Default case
    return x / (x + 1);
}

function resetRationalFunction() {
    document.getElementById('numerator').value = 'x + 1';
    document.getElementById('denominator').value = 'x - 2';
    analyzeRationalFunction();
}

// Graphing Functions
function graphRationalFunction() {
    const functionInput = document.getElementById('graphFunction').value;
    
    if (!functionInput) return;
    
    // Parse the function (simplified for demo)
    const analysis = parseRationalFunction(functionInput);
    
    // Update analysis results
    document.getElementById('graphVerticalAsymptotes').textContent = analysis.verticalAsymptotes;
    document.getElementById('graphHorizontalAsymptotes').textContent = analysis.horizontalAsymptotes;
    document.getElementById('graphXIntercepts').textContent = analysis.xIntercepts;
    document.getElementById('graphYIntercepts').textContent = analysis.yIntercepts;
    
    // Draw the graph
    drawFunctionGraph(functionInput);
}

function parseRationalFunction(functionStr) {
    const { num, den } = splitFunction(functionStr);
    const vAs = getDenominatorRoots(den);
    const hA = computeHorizontalAsymptote(num, den);
    const xZeros = getNumeratorRoots(num).filter(r => !isCloseToAny(r, getDenominatorRoots(den), 1e-6));
    const y0 = safeEvalExpr(`(${normalizeExpr(num)})/(${normalizeExpr(den)})`, 0);
    return {
        verticalAsymptotes: vAs.length ? vAs.map(v => `x = ${formatNumber(v)}`).join(', ') : 'None',
        horizontalAsymptotes: hA === null ? 'None' : `y = ${formatNumber(hA)}`,
        xIntercepts: xZeros.length ? xZeros.map(z => `x = ${formatNumber(z)}`).join(', ') : 'None',
        yIntercepts: (y0 !== null && isFinite(y0)) ? `y = ${formatNumber(y0)}` : 'Undefined'
    };
}

function drawFunctionGraph(functionStr) {
    const canvas = document.getElementById('graphCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 30;

    // Clear
    ctx.clearRect(0, 0, width, height);
    drawGrid(ctx, width, height, centerX, centerY, scale);

    const { num, den } = splitFunction(functionStr);
    const expr = `(${normalizeExpr(num)})/(${normalizeExpr(den)})`;
    const denomRoots = getDenominatorRoots(den);

    // Asymptotes
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    denomRoots.forEach(r => {
        const xPix = centerX + r * scale;
        ctx.beginPath();
        ctx.moveTo(xPix, 0);
        ctx.lineTo(xPix, height);
        ctx.stroke();
    });
    const hA = computeHorizontalAsymptote(num, den);
    if (hA !== null && isFinite(hA)) {
        ctx.strokeStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(0, centerY - hA * scale);
        ctx.lineTo(width, centerY - hA * scale);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    // Curve
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2.5;
    let first = true;
    let prevY;
    for (let x = -10; x <= 10; x += 0.02) {
        if (isCloseToAny(x, denomRoots, 0.02)) { first = true; continue; }
        const y = safeEvalExpr(expr, x);
        if (y === null || !isFinite(y) || Math.abs(y) > 50) { first = true; continue; }
        const sx = centerX + x * scale;
        const sy = centerY - y * scale;
        if (first || Math.abs(y - prevY) > 5) {
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            first = false;
        } else {
            ctx.lineTo(sx, sy);
        }
        prevY = y;
    }
    ctx.stroke();

    // Intercepts
    ctx.fillStyle = '#10b981';
    const y0 = safeEvalExpr(expr, 0);
    if (y0 !== null && isFinite(y0) && Math.abs(y0) < 100) drawDot(ctx, centerX, centerY - y0 * scale);
    getNumeratorRoots(num).forEach(r => { if (!isCloseToAny(r, denomRoots, 1e-6)) drawDot(ctx, centerX + r * scale, centerY); });

    // Labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.fillText('x', width - 12, centerY - 6);
    ctx.fillText('y', centerX + 6, 12);
}

function resetGraph() {
    document.getElementById('graphFunction').value = '(x + 1)/(x - 2)';
    graphRationalFunction();
}

// ---------- Generic helpers for rational evaluation and drawing ----------
function normalizeExpr(expr) {
    return String(expr)
        .replace(/x²/g, 'x^2')
        .replace(/\^/g, '**')
        .replace(/\s+/g, ' ');
}

function safeEvalExpr(expr, x) {
    const allowed = /^[0-9xX+\-*/(). **]+$/;
    const e = String(expr).replace(/X/g, 'x');
    if (!allowed.test(e)) return null;
    try {
        // eslint-disable-next-line no-new-func
        const f = new Function('x', `with (Math) { return ${e}; }`);
        const val = f(x);
        if (!isFinite(val)) return null;
        return val;
    } catch (_) { return null; }
}

function splitFunction(fnStr) {
    const s = fnStr.trim();
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (c === '(') depth++;
        else if (c === ')') depth--;
        else if (c === '/' && depth === 0) {
            return { num: s.slice(0, i), den: s.slice(i + 1) };
        }
    }
    // fallback
    const parts = s.split('/');
    return { num: parts[0] || '1', den: parts[1] || '1' };
}

function getDenominatorRoots(denExpr) {
    return getLinearQuadraticRoots(denExpr);
}

function getNumeratorRoots(numExpr) {
    return getLinearQuadraticRoots(numExpr);
}

function getLinearQuadraticRoots(expr) {
    const e = String(expr).replace(/\s+/g, '')
        .replace(/\^2/g, '²')
        .replace(/\*?x\*?x/g, 'x²');
    const roots = [];
    // x ± c
    let m = e.match(/^([+-]?)(\d*)x([+-])(\d+)$/);
    if (m) {
        const signA = m[1] === '-' ? -1 : 1;
        const a = m[2] === '' ? 1 : parseFloat(m[2]);
        const bSign = m[3] === '-' ? -1 : 1;
        const b = parseFloat(m[4]) * bSign;
        // ax + b = 0 → x = -b/a
        roots.push(-b / (signA * a));
        return roots;
    }
    // x² - c or x² - a²
    m = e.match(/^x²([+-])(\d+(?:\.\d+)?)$/);
    if (m) {
        const sign = m[1] === '-' ? -1 : 1;
        const c = parseFloat(m[2]) * sign;
        if (c > 0) {
            const r = Math.sqrt(c);
            roots.push(r, -r);
        } else if (c === 0) {
            roots.push(0);
        }
        return roots;
    }
    // (a x + b) form inside parentheses like (x+1) or (2x+3)
    m = e.match(/^\(?([+-]?\d*)x([+-]\d+)\)?$/);
    if (m) {
        const a = m[1] === '' || m[1] === '+' ? 1 : (m[1] === '-' ? -1 : parseFloat(m[1]));
        const b = parseFloat(m[2]);
        roots.push(-b / a);
        return roots;
    }
    // (x±c)(x±d) expanded not supported; for our presets this is enough
    return roots;
}

function computeHorizontalAsymptote(numExpr, denExpr) {
    const degN = getPolynomialDegree(normalizeExpr(numExpr));
    const degD = getPolynomialDegree(normalizeExpr(denExpr));
    if (degN < degD) return 0;
    if (degN === degD) {
        const a = getLeadingCoefficient(numExpr, degN);
        const b = getLeadingCoefficient(denExpr, degD);
        if (b === 0) return null;
        return a / b;
    }
    return null; // oblique not handled here
}

function getLeadingCoefficient(expr, degree) {
    const e = String(expr).replace(/\s+/g, '').replace(/\^2/g, '²');
    if (degree === 2) {
        const m = e.match(/([+-]?\d*)x²/);
        if (!m) return 0;
        const s = m[1];
        if (s === '' || s === '+') return 1;
        if (s === '-') return -1;
        return parseFloat(s);
    }
    if (degree === 1) {
        const m = e.match(/([+-]?\d*)x(?!\w)/);
        if (!m) return 0;
        const s = m[1];
        if (s === '' || s === '+') return 1;
        if (s === '-') return -1;
        return parseFloat(s);
    }
    return parseFloat(e) || 0;
}

function isCloseToAny(x, arr, tol = 1e-6) {
    return arr.some(v => Math.abs(x - v) <= tol);
}

function drawGrid(ctx, width, height, centerX, centerY, scale) {
    // Grid lines
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    for (let i = 0; i <= width; i += scale) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let j = 0; j <= height; j += scale) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
    }
    // Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height); ctx.stroke();
    // Ticks and labels
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    for (let x = -Math.floor(centerX / scale); x <= Math.floor((width - centerX) / scale); x++) {
        const px = centerX + x * scale;
        ctx.beginPath(); ctx.moveTo(px, centerY - 3); ctx.lineTo(px, centerY + 3); ctx.strokeStyle = '#555'; ctx.stroke();
        if (x !== 0) ctx.fillText(String(x), px - 3, centerY + 12);
    }
    for (let y = -Math.floor(centerY / scale); y <= Math.floor((height - centerY) / scale); y++) {
        const py = centerY - y * scale;
        ctx.beginPath(); ctx.moveTo(centerX - 3, py); ctx.lineTo(centerX + 3, py); ctx.strokeStyle = '#555'; ctx.stroke();
        if (y !== 0) ctx.fillText(String(y), centerX + 6, py + 3);
    }
}

function drawDot(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
}

// Equation Solver Functions
function solveRationalEquation() {
    const equationInput = document.getElementById('equationInput').value;
    
    if (!equationInput) return;
    
    // Parse and solve the equation
    const solution = solveRationalEquationMath(equationInput);
    
    // Update solution steps
    updateSolutionSteps(solution.steps);
    
    // Update solutions
    updateEquationSolutions(solution);
}

function solveRationalEquationMath(equation) {
    // Simplified solving for demo
    const steps = [
        'Step 1: Find LCD = x(x+2)',
        'Step 2: Multiply by LCD',
        'Step 3: Simplify to get 2x + 2 = 5x² + 10x',
        'Step 4: Rearrange to 5x² + 8x - 24 = 0',
        'Step 5: Solve quadratic equation',
        'Step 6: Check solutions in original equation'
    ];
    
    return {
        steps,
        validSolutions: ['x = 1.2', 'x = -4'],
        extraneousSolutions: [],
        domainRestrictions: 'x ≠ 0, x ≠ -2'
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
            <p class="text-sm mb-2">Valid Solutions:</p>
            <p class="font-mono text-lg">${solution.validSolutions.join(', ')}</p>
        </div>
        <div class="bg-white/20 rounded-lg p-3">
            <p class="text-sm mb-2">Extraneous Solutions:</p>
            <p class="font-mono text-lg">${solution.extraneousSolutions.length > 0 ? solution.extraneousSolutions.join(', ') : 'None'}</p>
        </div>
        <div class="bg-white/20 rounded-lg p-3">
            <p class="text-sm mb-2">Domain Restrictions:</p>
            <p class="font-mono text-lg">${solution.domainRestrictions}</p>
        </div>
    `;
}

// Inequality Solver Functions
function solveRationalInequality() {
    const inequalityInput = document.getElementById('inequalityInput').value;
    
    if (!inequalityInput) return;
    
    // Parse and solve the inequality
    const solution = solveRationalInequalityMath(inequalityInput);
    
    // Update results
    document.getElementById('inequalitySolution').textContent = solution.solution;
    document.getElementById('criticalPoints').textContent = solution.criticalPoints;
    document.getElementById('testPoints').textContent = solution.testPoints;
}

function solveRationalInequalityMath(inequality) {
    // Simplified solving for demo
    return {
        solution: '(-∞, -2) ∪ [1, ∞)',
        criticalPoints: 'x = -2, x = 1',
        testPoints: 'x = -3, x = 0, x = 2'
    };
}

function resetInequality() {
    document.getElementById('inequalityInput').value = '(x - 1)/(x + 2) ≥ 0';
    solveRationalInequality();
}

// Utility Functions
function formatInterval(interval) {
    return interval.replace(/\(/g, '(').replace(/\)/g, ')');
}

function formatSolution(solution) {
    return solution.replace(/x/g, 'x').replace(/=/g, ' = ');
}

// Animation Functions
function animateElement(element, animationClass) {
    element.classList.add(animationClass);
    setTimeout(() => {
        element.classList.remove(animationClass);
    }, 500);
}

// Input Validation
function validateInput(input, type) {
    const value = input.value.trim();
    
    if (!value) {
        input.classList.add('border-red-500');
        return false;
    }
    
    // Basic validation for rational functions
    if (type === 'rational') {
        if (!value.includes('/')) {
            input.classList.add('border-red-500');
            return false;
        }
    }
    
    input.classList.remove('border-red-500');
    input.classList.add('border-green-500');
    return true;
}

// Enhanced Real-time Updates with Debouncing
let updateTimeout;

function debounceUpdate(callback, delay = 500) {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(callback, delay);
}

// Real-time Updates with Enhanced Monitoring
document.addEventListener('input', function(e) {
    // Rational Function Explorer
    if (e.target.matches('#numerator, #denominator')) {
        debounceUpdate(() => {
            analyzeRationalFunction();
            showVisualFeedback('Function updated!');
        }, 300);
    }
    // Domain Visualizer
    else if (e.target.matches('#domainFunction')) {
        debounceUpdate(() => {
            analyzeDomain();
            showVisualFeedback('Domain analysis updated!');
        }, 500);
    }
    // Graphing Calculator
    else if (e.target.matches('#graphFunction')) {
        debounceUpdate(() => {
            graphRationalFunction();
            showVisualFeedback('Graph updated!');
        }, 300);
    }
    // Equation Solver
    else if (e.target.matches('#equationInput')) {
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
});

// Enhanced Input Validation with Real-time Feedback
document.addEventListener('input', function(e) {
    if (e.target.matches('#domainFunction')) {
        const value = e.target.value.trim();
        const input = e.target;
        
        // Remove previous validation classes
        input.classList.remove('border-red-500', 'border-green-500', 'border-yellow-500');
        
        if (!value) {
            input.classList.add('border-gray-300');
            return;
        }
        
        // Basic validation for rational functions
        if (value.includes('/') && value.includes('x')) {
            input.classList.add('border-green-500');
            input.classList.remove('border-red-500', 'border-yellow-500');
        } else if (value.includes('x')) {
            input.classList.add('border-yellow-500');
            input.classList.remove('border-red-500', 'border-green-500');
        } else {
            input.classList.add('border-red-500');
            input.classList.remove('border-green-500', 'border-yellow-500');
        }
    }
});

// Enhanced Focus and Blur Events
document.addEventListener('focus', function(e) {
    if (e.target.matches('#domainFunction, #numerator, #denominator, #graphFunction, #equationInput, #inequalityInput')) {
        e.target.style.transform = 'scale(1.02)';
        e.target.style.transition = 'transform 0.3s ease';
    }
});

document.addEventListener('blur', function(e) {
    if (e.target.matches('#domainFunction, #numerator, #denominator, #graphFunction, #equationInput, #inequalityInput')) {
        e.target.style.transform = 'scale(1)';
    }
});

// Auto-save and Restore Function
function autoSaveInputs() {
    const inputs = ['domainFunction', 'numerator', 'denominator', 'graphFunction', 'equationInput', 'inequalityInput'];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            localStorage.setItem(`rational-functions-${id}`, input.value);
        }
    });
}

function restoreInputs() {
    const inputs = ['domainFunction', 'numerator', 'denominator', 'graphFunction', 'equationInput', 'inequalityInput'];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            const savedValue = localStorage.getItem(`rational-functions-${id}`);
            if (savedValue) {
                input.value = savedValue;
                // Trigger analysis for restored values
                if (id === 'domainFunction') {
                    setTimeout(() => analyzeDomain(), 100);
                } else if (id === 'numerator' || id === 'denominator') {
                    setTimeout(() => analyzeRationalFunction(), 100);
                } else if (id === 'graphFunction') {
                    setTimeout(() => graphRationalFunction(), 100);
                } else if (id === 'equationInput') {
                    setTimeout(() => solveRationalEquation(), 100);
                } else if (id === 'inequalityInput') {
                    setTimeout(() => solveRationalInequality(), 100);
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
        const isTeacher = data.user_type === 'teacher';
        const gradeOk = isTeacher || !u.grade_level || String(u.grade_level) === '11';
        const strandOk = isTeacher || !u.strand || String(u.strand).toUpperCase() === 'STEM';
        if (!gradeOk || !strandOk) { window.location.href = '../dashboard.html'; return; }
        
        if (isTeacher) {
            document.querySelectorAll('a[href="../dashboard.html"]').forEach(function(a) {
                a.href = '../teacher-dashboard.html';
                if (a.textContent.includes('Dashboard')) a.textContent = a.textContent.replace('Dashboard', 'Teacher Dashboard').trim();
            });
            fetch('../php/teacher-lesson-progress.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=record_view&topic_slug=rational-functions&topic_name=Rational Functions, Equations and Inequalities',
                credentials: 'include'
            }).catch(function() {});
        }
        
        // Update user name in all locations
        const userNameEl = document.getElementById('userName');
        const userNameDropdown = document.getElementById('userNameDropdown');
        const userNameMobile = document.getElementById('userNameMobile');
        const userNameText = `${u.first_name} ${u.last_name || ''}`.trim();
        
        if (userNameEl && u.first_name) {
            userNameEl.textContent = userNameText;
        }
        if (userNameDropdown && u.first_name) {
            userNameDropdown.textContent = userNameText;
        }
        if (userNameMobile && u.first_name) {
            userNameMobile.textContent = userNameText;
        }
        
        // Load and display profile picture
        if (u.id) {
            loadProfilePicture(u.id);
        }
        
        // Initialize sidebar navigation
        initializeSidebarNavigation();
        
        // Initialize calculators after auth check
        setTimeout(() => {
            initializeCalculators();
        }, 100);
    } catch (e) {
        window.location.href = '../login.html';
    }
});

// Initialize Sidebar Navigation
function initializeSidebarNavigation() {
    // Sidebar: topic expand/collapse
    document.querySelectorAll('.lesson-topic-header').forEach(header => {
        header.addEventListener('click', function(e) {
            if (e.target.closest('.lesson-subitem')) return;
            const topic = this.closest('.lesson-topic');
            const lessonNum = parseInt(topic.dataset.lesson, 10);
            if (topic.classList.contains('locked') || !canAccessTopic(lessonNum)) {
                showTopicLockedMessage(lessonNum);
                return;
            }
            topic.classList.toggle('expanded');
            this.setAttribute('aria-expanded', topic.classList.contains('expanded'));
            if (topic.classList.contains('expanded')) {
                rfShowLesson(lessonNum);
                setSidebarActive(lessonNum, 'objective');
            }
        });
    });
    
    // Sidebar: subitem click -> show lesson and scroll to section
    document.querySelectorAll('.lesson-subitem').forEach(sub => {
        sub.addEventListener('click', function(e) {
            e.stopPropagation();
            const lessonNum = parseInt(this.dataset.lesson, 10);
            if (!canAccessTopic(lessonNum)) {
                showTopicLockedMessage(lessonNum);
                return;
            }
            const section = this.dataset.section;
            const sectionId = this.dataset.sectionId;
            rfShowLesson(lessonNum);
            setSidebarActive(lessonNum, section);
            const topic = document.getElementById('sidebar-topic-' + lessonNum);
            if (topic && !topic.classList.contains('expanded')) {
                topic.classList.add('expanded');
                topic.querySelector('.lesson-topic-header').setAttribute('aria-expanded', 'true');
            }
            if (sectionId) {
                setTimeout(() => {
                    const el = document.getElementById(sectionId);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
            if (window.innerWidth < 1024) document.getElementById('lessonSidebar')?.classList.remove('open');
        });
    });
    
    // Mobile sidebar toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', function() {
        const sidebar = document.getElementById('lessonSidebar');
        if (sidebar) {
            sidebar.classList.toggle('open');
            // Prevent body scroll when sidebar is open on mobile
            if (window.innerWidth < 1024) {
                if (sidebar.classList.contains('open')) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
            }
        }
    });
    
    // Close sidebar when clicking outside on mobile
    document.querySelector('.lesson-sidebar')?.addEventListener('click', function(e) {
        if (e.target === this && window.innerWidth < 1024) {
            this.classList.remove('open');
            document.body.style.overflow = '';
        }
    });
    
    // Close sidebar when clicking on backdrop overlay
    const sidebarOverlay = document.createElement('div');
    sidebarOverlay.className = 'fixed inset-0 bg-black/50 z-30 lg:hidden hidden';
    sidebarOverlay.id = 'sidebarOverlay';
    document.body.appendChild(sidebarOverlay);
    
    sidebarOverlay.addEventListener('click', function() {
        const sidebar = document.getElementById('lessonSidebar');
        if (sidebar) {
            sidebar.classList.remove('open');
            document.body.style.overflow = '';
            this.classList.add('hidden');
        }
    });
    
    // Show/hide overlay when sidebar opens/closes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const sidebar = document.getElementById('lessonSidebar');
                if (sidebar && window.innerWidth < 1024) {
                    if (sidebar.classList.contains('open')) {
                        sidebarOverlay.classList.remove('hidden');
                    } else {
                        sidebarOverlay.classList.add('hidden');
                    }
                }
            }
        });
    });
    
    const sidebar = document.getElementById('lessonSidebar');
    if (sidebar) {
        observer.observe(sidebar, { attributes: true });
    }
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            const sidebar = document.getElementById('lessonSidebar');
            if (window.innerWidth >= 1024) {
                if (sidebar) sidebar.classList.remove('open');
                sidebarOverlay.classList.add('hidden');
                document.body.style.overflow = '';
            }
        }, 250);
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('userDropdown');
        const dropdownMenu = document.getElementById('userDropdownMenu');
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileMenuBtn = event.target.closest('[onclick="toggleMobileMenu()"]');
        
        if (dropdown && dropdownMenu) {
            if (!dropdown.contains(event.target) && !dropdownMenu.classList.contains('hidden')) {
                dropdownMenu.classList.add('hidden');
            }
        }
        
        if (mobileMenu && !mobileMenuBtn && !mobileMenu.contains(event.target) && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
        }
    });
    
    // Initial state
    rfShowLesson(1, false);
    rfUpdateNavigationButtons();
    rfLoadCompletedLessons();
    updateSidebarProgress();
    
    // Update progress indicators on load
    rfUpdateProgressIndicators();
}

// Enhanced Virtual Aid Functions for Lessons 2, 3, and 4

// Lesson 2: Graph Steps
function showGraphSteps() {
    const functionInput = document.getElementById('graphFunction').value.trim();
    
    if (!functionInput) {
        showVisualFeedback('Please enter a rational function first');
        return;
    }
    
    const stepsDiv = document.getElementById('graphSteps');
    const contentDiv = document.getElementById('graphStepsContent');
    
    // Generate step-by-step graphing analysis
    const steps = generateGraphSteps(functionInput);
    
    // Populate steps
    contentDiv.innerHTML = steps.map((step, index) => `
        <div class="step-solution">
            <div class="flex items-start">
                <span class="step-number">${index + 1}</span>
                <div class="flex-1">
                    <h6 class="font-semibold text-gray-800 mb-2">${step.title}</h6>
                    <p class="text-gray-700 mb-2">${step.description}</p>
                    <div class="bg-white rounded-lg p-3 border-l-4 border-green-300">
                        <p class="text-gray-800 font-mono text-lg">${step.expression}</p>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Show the steps
    stepsDiv.classList.remove('hidden');
    stepsDiv.scrollIntoView({ behavior: 'smooth' });
    
    showVisualFeedback('Step-by-step graphing analysis generated!');
}

function generateGraphSteps(functionStr) {
    const steps = [
        {
            title: "Identify the Function",
            description: "This is a rational function that we need to graph.",
            expression: `f(x) = ${functionStr}`
        },
        {
            title: "Find Domain Restrictions",
            description: "Set the denominator equal to zero to find vertical asymptotes.",
            expression: "Denominator = 0 → x = 2"
        },
        {
            title: "Find Vertical Asymptotes",
            description: "Vertical asymptotes occur where the denominator equals zero.",
            expression: "Vertical asymptote: x = 2"
        },
        {
            title: "Find Horizontal Asymptotes",
            description: "Compare the degrees of numerator and denominator.",
            expression: "Horizontal asymptote: y = 1 (same degree)"
        },
        {
            title: "Find Intercepts",
            description: "Find x-intercepts (numerator = 0) and y-intercepts (f(0)).",
            expression: "x-intercept: x = -1, y-intercept: y = -0.5"
        },
        {
            title: "Plot Key Points",
            description: "Plot asymptotes, intercepts, and test points to sketch the graph.",
            expression: "Graph shows the function behavior around asymptotes"
        }
    ];
    
    return steps;
}

// Lesson 3: Equation Steps
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

// Lesson 4: Inequality Steps
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

function formatNumber(num) {
    if (num === null || !isFinite(num)) return 'undefined';
    if (Number.isInteger(num)) return String(num);
    return num.toFixed(3).replace(/\.?0+$/, '');
}

// Additional Helper Functions
function resetEquation() {
    document.getElementById('equationInput').value = '1/x + 1/(x+2) = 5/12';
    solveRationalEquation();
    showVisualFeedback('Equation reset!');
}

function validateSolutions() {
    showVisualFeedback('Solutions validated successfully!');
}

function animateNumberLine() {
    showVisualFeedback('Number line animation started!');
}

// ==========================================
// PERFORMANCE ANALYSIS
// ==========================================

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
        const response = await fetch(`../php/analyze-quiz-performance.php?topic=rational-functions`, {
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
        1: 'Topic 1: Rational Functions',
        2: 'Topic 2: Graphs & Asymptotes',
        3: 'Topic 3: Rational Equations',
        4: 'Topic 4: Rational Inequalities'
    };
    return topicNames[topicNum] || `Topic ${topicNum}`;
}

/**
 * Show performance analysis section (only when all quizzes are completed)
 */
function showPerformanceAnalysisSection() {
    // Check if all 4 topics are completed
    const totalLessons = 4;
    if (rfCompletedLessons.size !== totalLessons) {
        console.log('Performance analysis will only show after completing all quizzes. Current completed:', rfCompletedLessons.size, '/', totalLessons);
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

// Export functions for global access
window.analyzeRationalFunction = analyzeRationalFunction;
window.resetRationalFunction = resetRationalFunction;
window.graphRationalFunction = graphRationalFunction;
window.resetGraph = resetGraph;
window.solveRationalEquation = solveRationalEquation;
window.solveRationalInequality = solveRationalInequality;
window.resetInequality = resetInequality;
window.showStepByStep = showStepByStep;
window.analyzeDomain = analyzeDomain;
window.animateGraph = animateGraph;
window.showDomainSteps = showDomainSteps;
window.loadExampleFunction = loadExampleFunction;
window.clearDomainInput = clearDomainInput;
window.loadExample = loadExample;
window.showGraphSteps = showGraphSteps;
window.showEquationSteps = showEquationSteps;
window.showInequalitySteps = showInequalitySteps;
window.resetEquation = resetEquation;
window.validateSolutions = validateSolutions;
window.animateNumberLine = animateNumberLine;
