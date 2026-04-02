// One-to-One Functions - Interactive JavaScript

// ------------------------------
// Lesson Navigation & Completion
// ------------------------------
let otoCurrentLesson = 1;
let otoCompletedLessons = new Set();
const otoTotalLessons = 4;

// ------------------------------
// Quiz System - 5 questions per topic
// ------------------------------
const otoLesson1Quiz = [
    {
        question: "What is a one-to-one function?",
        options: [
            "A function where each element in the range corresponds to exactly one element in the domain",
            "A function where multiple inputs can produce the same output",
            "A function that only has one input",
            "A function that only has one output"
        ],
        correct: 0
    },
    {
        question: "Which mathematical statement defines a one-to-one function?",
        options: [
            "f(x₁) = f(x₂) ⟹ x₁ = x₂",
            "f(x₁) = f(x₂) ⟹ x₁ ≠ x₂",
            "x₁ = x₂ ⟹ f(x₁) ≠ f(x₂)",
            "f(x₁) ≠ f(x₂) ⟹ x₁ = x₂"
        ],
        correct: 0
    },
    {
        question: "What is the horizontal line test used for?",
        options: [
            "To determine if a function is one-to-one",
            "To find the domain of a function",
            "To find the range of a function",
            "To graph a function"
        ],
        correct: 0
    },
    {
        question: "Which function is one-to-one?",
        options: [
            "f(x) = 2x + 3",
            "f(x) = x²",
            "f(x) = |x|",
            "f(x) = x² - 4"
        ],
        correct: 0
    },
    {
        question: "If f(2) = 5 and f(-2) = 5, what can we conclude about the function?",
        options: [
            "The function is NOT one-to-one",
            "The function is one-to-one",
            "The function has no inverse",
            "The function is constant"
        ],
        correct: 0
    }
];

const otoLesson2Quiz = [
    {
        question: "What is the algebraic test for one-to-one functions?",
        options: [
            "Assume f(a) = f(b) and show that a = b",
            "Assume a = b and show that f(a) = f(b)",
            "Find the derivative of the function",
            "Graph the function"
        ],
        correct: 0
    },
    {
        question: "For a differentiable function, when is it one-to-one?",
        options: [
            "When f'(x) > 0 for all x OR f'(x) < 0 for all x",
            "When f'(x) = 0 for all x",
            "When f'(x) changes sign",
            "When f'(x) is undefined"
        ],
        correct: 0
    },
    {
        question: "What does the horizontal line test check?",
        options: [
            "If any horizontal line intersects the graph more than once",
            "If any vertical line intersects the graph more than once",
            "If the function is continuous",
            "If the function is differentiable"
        ],
        correct: 0
    },
    {
        question: "Which test method is most reliable for determining if a function is one-to-one?",
        options: [
            "Algebraic test - showing f(a) = f(b) implies a = b",
            "Graphical test only",
            "Derivative test only",
            "Checking if the function is linear"
        ],
        correct: 0
    },
    {
        question: "If f(x) = x³ + 2x, what can we say about this function?",
        options: [
            "It is one-to-one because f'(x) = 3x² + 2 > 0 for all x",
            "It is not one-to-one because it's a cubic function",
            "It is one-to-one only for x > 0",
            "We need more information to determine"
        ],
        correct: 0
    }
];

const otoLesson3Quiz = [
    {
        question: "What is the inverse function of f?",
        options: [
            "The function f⁻¹ that undoes the action of f",
            "The reciprocal of f",
            "The negative of f",
            "The square of f"
        ],
        correct: 0
    },
    {
        question: "Which property must a function have to have an inverse?",
        options: [
            "It must be one-to-one",
            "It must be onto",
            "It must be continuous",
            "It must be differentiable"
        ],
        correct: 0
    },
    {
        question: "What is the relationship between f and f⁻¹?",
        options: [
            "f⁻¹(f(x)) = x and f(f⁻¹(x)) = x",
            "f⁻¹(f(x)) = f(x)",
            "f(f⁻¹(x)) = 0",
            "f⁻¹(x) = 1/f(x)"
        ],
        correct: 0
    },
    {
        question: "To find the inverse of f(x) = 2x + 3, what is the first step?",
        options: [
            "Replace f(x) with y",
            "Find the derivative",
            "Graph the function",
            "Set f(x) = 0"
        ],
        correct: 0
    },
    {
        question: "What happens to the domain and range when finding an inverse?",
        options: [
            "The domain of f becomes the range of f⁻¹, and the range of f becomes the domain of f⁻¹",
            "They remain the same",
            "They swap but only for linear functions",
            "The domain becomes the range but range stays the same"
        ],
        correct: 0
    }
];

const otoLesson4Quiz = [
    {
        question: "Why are one-to-one functions important in cryptography?",
        options: [
            "They ensure unique encryption and decryption",
            "They make encryption faster",
            "They reduce the size of encrypted messages",
            "They are easier to implement"
        ],
        correct: 0
    },
    {
        question: "In temperature conversion F = (9/5)C + 32, why is this function one-to-one?",
        options: [
            "Because it is linear with a positive slope",
            "Because it involves fractions",
            "Because it has two variables",
            "Because it's used for conversion"
        ],
        correct: 0
    },
    {
        question: "Why must database functions be one-to-one?",
        options: [
            "To ensure data integrity and prevent duplicate records",
            "To make queries faster",
            "To reduce storage space",
            "To simplify the database structure"
        ],
        correct: 0
    },
    {
        question: "What is a practical application of one-to-one functions in computer science?",
        options: [
            "Ensuring unique mappings in algorithms and data structures",
            "Making programs run faster",
            "Reducing memory usage",
            "Simplifying code"
        ],
        correct: 0
    },
    {
        question: "In the Caesar cipher f(x) = (x + shift) mod 26, why must it be one-to-one?",
        options: [
            "To ensure each letter maps to exactly one encrypted letter for unique decryption",
            "To make encryption faster",
            "To use less memory",
            "To simplify the algorithm"
        ],
        correct: 0
    }
];

// ------------------------------
// Sidebar Navigation
// ------------------------------
function initializeSidebar() {
    const sidebar = document.getElementById('lessonSidebar');
    if (!sidebar) return;
    
    // Topic headers - expand/collapse
    sidebar.querySelectorAll('.lesson-topic-header').forEach(header => {
        header.addEventListener('click', function(e) {
            if (e.target.closest('.lesson-subitem')) return;
            const topic = this.closest('.lesson-topic');
            const lessonNum = parseInt(topic.dataset.lesson);
            
            // Check if topic is accessible
            if (!otoCanAccessTopic(lessonNum) && lessonNum !== otoCurrentLesson) {
                otoShowTopicLockedMessage(lessonNum);
                return;
            }
            
            const isExpanded = topic.classList.contains('expanded');
            document.querySelectorAll('.lesson-topic').forEach(t => t.classList.remove('expanded'));
            if (!isExpanded) {
                topic.classList.add('expanded');
                this.setAttribute('aria-expanded', 'true');
                otoShowLesson(lessonNum);
                setSidebarActive(lessonNum, 'objective');
            } else {
                this.setAttribute('aria-expanded', 'false');
            }
        });
    });
    
    // Subitems - navigate to sections
    sidebar.querySelectorAll('.lesson-subitem').forEach(subitem => {
        subitem.addEventListener('click', function(e) {
            e.stopPropagation();
            const lessonNum = parseInt(this.dataset.lesson);
            const sectionId = this.dataset.sectionId;
            
            // Check if topic is accessible
            if (!otoCanAccessTopic(lessonNum)) {
                otoShowTopicLockedMessage(lessonNum);
                return;
            }
            
            // Show lesson and scroll to section
            otoShowLesson(lessonNum, false);
            setSidebarActive(lessonNum, this.dataset.section);
            
            const topic = document.getElementById(`sidebar-topic-${lessonNum}`);
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
            
            // Close mobile sidebar
            if (window.innerWidth < 1024) {
                sidebar.classList.remove('open');
                const backdrop = document.getElementById('mobileBackdrop');
                if (backdrop) backdrop.classList.add('hidden');
            }
        });
    });
    
    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileBackdrop = document.getElementById('mobileBackdrop');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
            if (mobileBackdrop) mobileBackdrop.classList.toggle('hidden');
        });
    }
    
    if (mobileBackdrop) {
        mobileBackdrop.addEventListener('click', function() {
            sidebar.classList.remove('open');
            this.classList.add('hidden');
        });
    }
    
    // Update sidebar progress
    otoUpdateSidebarProgress();
}

function setSidebarActive(lessonNum, section) {
    // Update subitems
    document.querySelectorAll('.lesson-subitem').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.dataset.lesson) === lessonNum && item.dataset.section === section) {
            item.classList.add('active');
        }
    });
    
    // Update topic headers
    document.querySelectorAll('.lesson-topic-header').forEach(header => {
        header.classList.remove('active');
        const topic = header.closest('.lesson-topic');
        if (parseInt(topic.dataset.lesson) === lessonNum) {
            header.classList.add('active');
            topic.classList.add('expanded');
        }
    });
}

function otoUpdateSidebarProgress() {
    for (let i = 1; i <= otoTotalLessons; i++) {
        const topic = document.getElementById(`sidebar-topic-${i}`);
        if (!topic) continue;
        
        const dot = topic.querySelector('.lesson-topic-dot');
        const progressText = topic.querySelector('.topic-status-text');
        const accessible = otoCanAccessTopic(i);
        const complete = otoCompletedLessons.has(i);
        
        // Never lock a topic that is already completed
        topic.classList.toggle('locked', !accessible && !complete);
        
        if (progressText) {
            if (complete) {
                progressText.textContent = '✓';
            } else if (!accessible) {
                progressText.textContent = '—';
            } else {
                progressText.textContent = ''; // Empty for accessible but incomplete
            }
        }
        
        if (dot) {
            if (complete) {
                dot.classList.add('completed');
                dot.innerHTML = '<i class="fas fa-check"></i>';
            } else {
                dot.classList.remove('completed');
            }
        }
    }
}

function otoCanAccessTopic(lessonNum) {
    if (lessonNum === 1) return true;
    return otoCompletedLessons.has(lessonNum - 1);
}

function otoShowTopicLockedMessage(lessonNum) {
    Swal.fire({
        icon: 'info',
        title: 'Topic Locked',
        html: `
            <div class="text-left">
                <p class="mb-3">You need to complete Topic ${lessonNum - 1} before accessing Topic ${lessonNum}.</p>
                <p class="text-sm text-gray-600">Complete the quiz for Topic ${lessonNum - 1} to unlock this topic.</p>
            </div>
        `,
        confirmButtonText: 'OK',
        confirmButtonColor: '#667eea'
    });
}

// ------------------------------
// Quiz System (matching functions.html)
// ------------------------------
function otoShuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function otoShuffleQuiz(quizArray) {
    const shuffled = otoShuffleArray(quizArray);
    return shuffled.map(quiz => {
        const options = [...quiz.options];
        const correctIndex = quiz.correct;
        const correctAnswer = options[correctIndex];
        
        const shuffledOptions = otoShuffleArray(options);
        const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);
        
        return {
            ...quiz,
            options: shuffledOptions,
            correct: newCorrectIndex
        };
    });
}

function otoGenerateExplanation(quiz, selectedAnswer) {
    if (!quiz || !quiz.options) return '';
    const isCorrect = selectedAnswer === quiz.correct;
    const correctAnswer = quiz.options[quiz.correct];
    const selectedAnswerText = quiz.options[selectedAnswer];
    const question = (quiz.question || '').toLowerCase();
    
    let explanation = '';
    if (isCorrect) {
        explanation = `✓ Correct! "${correctAnswer}" is the right answer.\n\n`;
    } else {
        explanation = `✗ Incorrect. You selected "${selectedAnswerText}", but the correct answer is "${correctAnswer}".\n\n`;
    }
    
    if (question.includes('one-to-one') || question.includes('one to one')) {
        explanation += 'HOW TO SOLVE:\nA one-to-one function (injective function) is a function where each element in the range corresponds to exactly one element in the domain. This means no two different inputs produce the same output. Use the horizontal line test or algebraic methods to verify.';
    } else if (question.includes('horizontal line test')) {
        explanation += 'HOW TO SOLVE:\nThe horizontal line test checks if any horizontal line intersects the graph more than once. If it does, the function is NOT one-to-one. If every horizontal line intersects at most once, the function is one-to-one.';
    } else if (question.includes('inverse')) {
        explanation += 'HOW TO SOLVE:\nOnly one-to-one functions have inverse functions. To find an inverse, replace f(x) with y, interchange x and y, solve for y, and replace y with f⁻¹(x).';
    } else if (question.includes('algebraic test')) {
        explanation += 'HOW TO SOLVE:\nAssume f(a) = f(b) and show that this implies a = b. If you can prove this for any a and b, then the function is one-to-one.';
    } else if (question.includes('derivative')) {
        explanation += 'HOW TO SOLVE:\nIf f\'(x) > 0 for all x (strictly increasing) or f\'(x) < 0 for all x (strictly decreasing), then f is one-to-one.';
    } else {
        explanation += 'HOW TO SOLVE:\n1. Read the question carefully\n2. Identify what concept is being tested\n3. Apply the relevant rules or formulas\n4. Check your answer makes sense';
    }
    return explanation;
}

async function otoRunLessonQuiz(lessonNum) {
    const quizArray = [
        otoLesson1Quiz,
        otoLesson2Quiz,
        otoLesson3Quiz,
        otoLesson4Quiz
    ][lessonNum - 1];
    
    if (!quizArray) return false;
    
    // Track quiz start time
    window.otoQuizStartTime = Date.now();
    
    // Shuffle quiz questions and options
    const shuffledQuiz = otoShuffleQuiz(quizArray);
    
    let currentQuestion = 0;
    let score = 0;
    const userAnswers = [];
    
    // Show intro modal (matching functions.html style)
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
        return false;
    }
    
    window.otoQuizStartTime = Date.now();
    
    return new Promise((resolve) => {
        window.otoQuizResolve = resolve;
        
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
                            explanation = otoGenerateExplanation(currentQuiz, selectedAnswer);
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
                            if (cr.isConfirmed) {
                                otoShowLesson(lessonNum, true);
                                if (window.otoQuizResolve) {
                                    window.otoQuizResolve(false);
                                    window.otoQuizResolve = null;
                                }
                            } else {
                                displayQuestion();
                            }
                        });
                    } else {
                        otoShowLesson(lessonNum, true);
                        if (window.otoQuizResolve) {
                            window.otoQuizResolve(false);
                            window.otoQuizResolve = null;
                        }
                    }
                }
            });
        }
        
        function showQuizResults() {
            const percentage = Math.round((score / shuffledQuiz.length) * 100);
            const passed = score >= 3;
            
            // Calculate time taken
            const timeTaken = window.otoQuizStartTime ? Math.floor((Date.now() - window.otoQuizStartTime) / 1000) : 0;
            
            // Store quiz data
            otoStoreQuizData(lessonNum, score, shuffledQuiz.length, userAnswers, timeTaken);
            
            Swal.fire({
                title: passed ? '🎉 Great Job!' : '📚 Keep Learning',
                html: `
                    <div class="text-center">
                        <div class="text-4xl font-bold mb-4 ${passed ? 'text-green-600' : 'text-orange-600'}">
                            ${score}/${shuffledQuiz.length} (${percentage}%)
                        </div>
                        ${(passed ? 
                            '<p class="text-lg text-gray-700 mb-4">You passed! You can now proceed to the next topic.</p>' :
                            '<p class="text-lg text-gray-700 mb-4">You need at least 3 correct answers to pass. Review the topic and try again!</p>'
                        )}
                    </div>
                `,
                icon: passed ? 'success' : 'info',
                confirmButtonText: passed ? 'Continue' : 'Review Topic',
                confirmButtonColor: passed ? '#10b981' : '#667eea'
            }).then(async () => {
                if (passed) {
                    // Save final study time before completing
                    otoSaveStudyTimeForCurrentLesson();
                    
                    // Complete lesson and stop timer
                    await otoCompleteLesson(lessonNum);
                    otoCompletedLessons.add(lessonNum);
                    otoUpdateSidebarProgress();
                    
                    // Hide Topic 4 quiz button if this is Topic 4
                    if (lessonNum === 4) {
                        const topic4QuizButton = document.getElementById('topic4QuizButton');
                        if (topic4QuizButton) {
                            topic4QuizButton.style.display = 'none';
                        }
                    }
                    
                    // Check if all lessons are completed and show performance analysis section
                    if (otoCompletedLessons.size === otoTotalLessons) {
                        otoShowPerformanceAnalysisSection();
                    }
                }
                if (window.otoQuizResolve) {
                    window.otoQuizResolve(passed);
                    window.otoQuizResolve = null;
                }
            });
        }
        
        displayQuestion();
    });
}

async function otoStoreQuizData(lessonNum, score, total, userAnswers, timeTakenSeconds = 0) {
    try {
        const response = await fetch('../php/store-quiz-data.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic: 'one-to-one-functions',
                lesson: lessonNum,
                score: score,
                total: total,
                user_answers: userAnswers,
                time_taken_seconds: timeTakenSeconds
            }),
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.success || false;
        }
        return false;
    } catch (error) {
        console.error('Error storing quiz data:', error);
        return false;
    }
}

// ------------------------------
// Timer Functions (matching functions.html)
// ------------------------------
let otoLessonStartTime = {};
let otoTotalStudyTime = {}; // Track total time per lesson in seconds
let otoLastSavedTime = {}; // Track last confirmed saved time from server (to prevent double counting)
let otoLastSaveTimestamp = {}; // Track when we last saved (to calculate elapsed correctly)
let otoStudyTimeInterval = null;
let otoTimerUpdateInterval = null; // For live timer display

function otoStartLiveTimer() {
    // Clear existing timer
    if (otoTimerUpdateInterval) {
        clearInterval(otoTimerUpdateInterval);
    }
    
    // Don't start timer if lesson is already completed
    if (otoCompletedLessons.has(otoCurrentLesson)) {
        otoUpdateLiveTimer(); // Just show final time
        return;
    }
    
    // Update timer immediately
    otoUpdateLiveTimer();
    
    // Update timer every second
    otoTimerUpdateInterval = setInterval(function() {
        // Stop if lesson becomes completed
        if (otoCompletedLessons.has(otoCurrentLesson)) {
            clearInterval(otoTimerUpdateInterval);
            otoTimerUpdateInterval = null;
            otoUpdateLiveTimer(); // Show final time
            return;
        }
        otoUpdateLiveTimer();
    }, 1000);
}

function otoUpdateLiveTimer() {
    if (!otoCurrentLesson) return;
    
    const section = document.getElementById(`lesson${otoCurrentLesson}`);
    if (!section) return;
    
    // Ensure timer container is visible
    const timerContainer = section.querySelector('.flex-shrink-0.ml-4');
    if (timerContainer) {
        timerContainer.classList.remove('hidden');
        timerContainer.style.display = 'flex';
        timerContainer.style.visibility = 'visible';
    }
    
    const timerDisplay = section.querySelector('.lesson-timer-display');
    if (!timerDisplay) return;
    
    // Don't update timer if lesson is already completed
    if (otoCompletedLessons.has(otoCurrentLesson)) {
        // Show final time for completed lesson
        let finalTime = otoTotalStudyTime[otoCurrentLesson] || otoLastSavedTime[otoCurrentLesson] || 0;
        
        // Ensure finalTime is in seconds (not milliseconds)
        if (finalTime > 86400) {
            const asSeconds = Math.floor(finalTime / 1000);
            if (asSeconds <= 86400) {
                finalTime = asSeconds;
            } else {
                finalTime = Math.min(finalTime, 86400);
            }
        }
        finalTime = Math.min(finalTime, 86400);
        
        const hours = Math.floor(finalTime / 3600);
        const minutes = Math.floor((finalTime % 3600) / 60);
        const secs = finalTime % 60;
        
        let timeDisplay = '';
        if (hours > 0) {
            timeDisplay = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        } else {
            timeDisplay = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        
        timerDisplay.textContent = timeDisplay;
        
        // Ensure timer text is visible
        timerDisplay.style.visibility = 'visible';
        timerDisplay.style.display = 'block';
        
        // Update circular progress (final state)
        const maxTime = 7200;
        const progress = Math.min((finalTime / maxTime) * 100, 100);
        const circumference = 2 * Math.PI * 34;
        const offset = circumference - (progress / 100) * circumference;
        
        const progressCircle = section.querySelector('.timer-progress');
        if (progressCircle) {
            progressCircle.style.strokeDashoffset = offset;
            progressCircle.style.stroke = '#10b981'; // Green for completed
        }
        
        return; // Stop here for completed lessons
    }
    
    // For active lessons, calculate current time
    const baseTime = otoLastSavedTime[otoCurrentLesson] || 0;
    
    let currentSessionElapsed = 0;
    const saveStartTime = otoLastSaveTimestamp[otoCurrentLesson] || otoLessonStartTime[otoCurrentLesson];
    if (saveStartTime) {
        const now = Date.now();
        const elapsedMs = now - saveStartTime;
        currentSessionElapsed = Math.floor(elapsedMs / 1000);
        
        if (currentSessionElapsed > 7200) {
            console.warn(`Session elapsed time too large (${currentSessionElapsed}s) for lesson ${otoCurrentLesson}, resetting start time`);
            otoLessonStartTime[otoCurrentLesson] = now;
            otoLastSaveTimestamp[otoCurrentLesson] = now;
            currentSessionElapsed = 0;
        }
        
        if (currentSessionElapsed < 0) {
            console.warn(`Negative elapsed time detected for lesson ${otoCurrentLesson}, resetting start time`);
            otoLessonStartTime[otoCurrentLesson] = now;
            otoLastSaveTimestamp[otoCurrentLesson] = now;
            currentSessionElapsed = 0;
        }
    }
    
    const totalTime = baseTime + currentSessionElapsed;
    const cappedTime = Math.min(totalTime, 86400);
    
    const hours = Math.floor(cappedTime / 3600);
    const minutes = Math.floor((cappedTime % 3600) / 60);
    const seconds = cappedTime % 60;
    
    let timeDisplay = '';
    if (hours > 0) {
        timeDisplay = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
        timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    timerDisplay.textContent = timeDisplay;
    
    // Ensure timer text is visible
    timerDisplay.style.visibility = 'visible';
    timerDisplay.style.display = 'block';
    
    // Update circular progress (max 2 hours = 7200 seconds)
    const maxTime = 7200;
    const progress = Math.min((cappedTime / maxTime) * 100, 100);
    const circumference = 2 * Math.PI * 34;
    const offset = circumference - (progress / 100) * circumference;
    
    const progressCircle = section.querySelector('.timer-progress');
    if (progressCircle) {
        progressCircle.style.strokeDashoffset = offset;
    }
}

function otoSaveStudyTimeForCurrentLesson() {
    if (!otoCurrentLesson) return;
    
    // CRITICAL: Never save time for completed lessons
    if (otoCompletedLessons.has(otoCurrentLesson)) {
        console.log(`Lesson ${otoCurrentLesson} is completed, skipping timer save`);
        return;
    }
    
    const saveStartTime = otoLastSaveTimestamp[otoCurrentLesson] || otoLessonStartTime[otoCurrentLesson];
    if (!saveStartTime) return;
    
    const now = Date.now();
    const elapsed = Math.floor((now - saveStartTime) / 1000);
    
    if (elapsed > 0 && elapsed < 7200) {
        const baseTime = otoLastSavedTime[otoCurrentLesson] || 0;
        const newTotalTime = baseTime + elapsed;
        
        otoTotalStudyTime[otoCurrentLesson] = newTotalTime;
        otoLastSavedTime[otoCurrentLesson] = newTotalTime;
        otoLastSaveTimestamp[otoCurrentLesson] = now;
        otoLessonStartTime[otoCurrentLesson] = now;
        
        otoSendStudyTimeToServer();
    } else if (elapsed >= 7200) {
        otoLessonStartTime[otoCurrentLesson] = now;
        otoLastSaveTimestamp[otoCurrentLesson] = now;
    }
}

function otoSendStudyTimeToServer() {
    if (!otoCurrentLesson) return;
    
    const studyTimeData = {};
    if (!otoCompletedLessons.has(otoCurrentLesson) && otoTotalStudyTime[otoCurrentLesson] && otoTotalStudyTime[otoCurrentLesson] > 0) {
        studyTimeData[otoCurrentLesson] = otoTotalStudyTime[otoCurrentLesson];
    }
    
    if (Object.keys(studyTimeData).length === 0) return;
    
    fetch('../php/store-study-time.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            topic: 'one-to-one-functions',
            study_time: studyTimeData
        }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update lastSavedTime and lastSaveTimestamp locally after successful save
            Object.keys(studyTimeData).forEach(lesson => {
                const lessonNum = parseInt(lesson);
                otoLastSavedTime[lessonNum] = otoTotalStudyTime[lessonNum];
                otoLastSaveTimestamp[lessonNum] = Date.now();
            });
        }
    })
    .catch(error => {
        console.error('Error saving study time:', error);
    });
}

async function otoLoadAndDisplayStudyTime() {
    // Load study time for all lessons (not just current) to ensure consistency
    try {
        const response = await fetch(`../php/get-study-time.php?topic=one-to-one-functions`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.study_time) {
                // Load study time for all lessons
                for (const lesson in data.study_time) {
                    const lessonNum = parseInt(lesson);
                    const seconds = parseInt(data.study_time[lesson]);
                    
                    if (!isNaN(seconds) && seconds >= 0) {
                        otoTotalStudyTime[lessonNum] = seconds;
                        otoLastSavedTime[lessonNum] = seconds;
                        const now = Date.now();
                        otoLastSaveTimestamp[lessonNum] = now;
                        
                        // For completed lessons, don't update lessonStartTime
                        if (!otoCompletedLessons.has(lessonNum)) {
                            if (!otoLessonStartTime[lessonNum]) {
                                otoLessonStartTime[lessonNum] = now;
                            }
                        }
                    }
                }
                
                // Update timer display for current lesson
                if (otoCurrentLesson) {
                    // Ensure timer container is visible for current lesson
                    const section = document.getElementById(`lesson${otoCurrentLesson}`);
                    if (section) {
                        const timerContainer = section.querySelector('.flex-shrink-0.ml-4');
                        if (timerContainer) {
                            timerContainer.classList.remove('hidden');
                            timerContainer.style.display = 'flex';
                            timerContainer.style.visibility = 'visible';
                        }
                    }
                    
                    otoUpdateLiveTimer();
                }
            }
        }
    } catch (e) {
        console.error('Error loading study time:', e);
    }
}

// ------------------------------
// Lesson Management
// ------------------------------
async function otoShowLesson(lessonNum, scrollToTop = false) {
    // Save time for previous lesson
    if (otoCurrentLesson && otoCurrentLesson !== lessonNum) {
        otoSaveStudyTimeForCurrentLesson();
    }
    
    // Check if lesson is accessible
    if (!otoCanAccessTopic(lessonNum)) {
        otoShowTopicLockedMessage(lessonNum);
        return;
    }
    
    // Stop current timer intervals before switching lessons
    clearInterval(otoTimerUpdateInterval);
    clearInterval(otoStudyTimeInterval);
    
    // Save study time for the lesson being left (if any and not completed)
    if (otoCurrentLesson && !otoCompletedLessons.has(otoCurrentLesson)) {
        otoSaveStudyTimeForCurrentLesson();
    }
    
    otoCurrentLesson = lessonNum;
    
    // Start tracking for new lesson - only if not completed
    if (!otoCompletedLessons.has(lessonNum)) {
        if (!otoLessonStartTime[lessonNum]) {
            otoLessonStartTime[lessonNum] = Date.now();
        }
        // Ensure lastSavedTime and lastSaveTimestamp are initialized
        if (otoLastSavedTime[lessonNum] === undefined) {
            otoLastSavedTime[lessonNum] = otoTotalStudyTime[lessonNum] || 0;
        }
        if (!otoLastSaveTimestamp[lessonNum]) {
            otoLastSaveTimestamp[lessonNum] = Date.now();
        }
    } else {
        // If lesson is completed, clear start time to prevent timer from running
        otoLessonStartTime[lessonNum] = null;
        otoLastSaveTimestamp[lessonNum] = null;
    }
    
    // Load and display study time for this lesson first
    await otoLoadAndDisplayStudyTime();
    
    // Start/restart live timer display (will show final time if completed, but won't update)
    otoStartLiveTimer();
    
    // Update lesson display
    const lessonSections = document.querySelectorAll('.lesson-section');
    lessonSections.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`lesson${lessonNum}`);
    if (target) {
        target.classList.add('active');
        
        // Ensure timer container is visible
        const timerContainer = target.querySelector('.flex-shrink-0.ml-6');
        if (timerContainer) {
            timerContainer.classList.remove('hidden');
            timerContainer.style.display = 'flex';
            timerContainer.style.visibility = 'visible';
        }
        
        // Show/hide Topic 4 quiz button
        const topic4QuizButton = document.getElementById('topic4QuizButton');
        if (topic4QuizButton) {
            if (lessonNum === 4 && !otoCompletedLessons.has(4)) {
                topic4QuizButton.style.display = 'block';
            } else {
                topic4QuizButton.style.display = 'none';
            }
        }
    }
    
    // Update UI
    otoUpdateNavigationButtons();
    otoUpdateProgressIndicators();
    otoUpdateLessonCompletionStatus();
    otoUpdateSidebarProgress();
    otoUpdateSidebarProgress();
    setSidebarActive(lessonNum, 'objective');
    
    if (scrollToTop) {
        setTimeout(() => {
            const lessonContent = document.querySelector('.lesson-content');
            if (lessonContent) {
                lessonContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }
}

function otoNavigateLesson(direction) {
    const newLesson = otoCurrentLesson + direction;
    
    // If trying to go to next lesson, show quiz first (unless already completed)
    if (direction === 1 && !otoCompletedLessons.has(otoCurrentLesson)) {
        otoRunLessonQuiz(otoCurrentLesson).then(passed => {
            if (passed && newLesson <= otoTotalLessons) {
                setTimeout(() => otoShowLesson(newLesson, true), 300);
            }
        });
        return;
    }
    
    if (newLesson >= 1 && newLesson <= otoTotalLessons) {
        // Check if new lesson is accessible
        if (!otoCanAccessTopic(newLesson)) {
            otoShowTopicLockedMessage(newLesson);
            return;
        }
        otoShowLesson(newLesson, true);
    }
}

function otoUpdateNavigationButtons() {
    const prevBtn = document.getElementById('prevLessonBtn');
    const nextBtn = document.getElementById('nextLessonBtn');
    
    if (prevBtn) {
        prevBtn.disabled = otoCurrentLesson <= 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = otoCurrentLesson >= otoTotalLessons;
    }
}

function otoUpdateProgressIndicators() {
    const currentLessonNum = document.getElementById('otoCurrentLessonNum');
    const lessonProgressBar = document.getElementById('otoLessonProgressBar');
    
    if (currentLessonNum) {
        currentLessonNum.textContent = otoCurrentLesson;
    }
    
    if (lessonProgressBar) {
        const progressPercentage = (otoCurrentLesson / otoTotalLessons) * 100;
        lessonProgressBar.style.width = `${progressPercentage}%`;
    }
}

function otoUpdateLessonCompletionStatus() {
    // Update completion buttons if they exist
    for (let i = 1; i <= otoTotalLessons; i++) {
        const completeBtn = document.querySelector(`button[onclick="completeLesson(${i})"]`);
        if (completeBtn) {
            if (otoCompletedLessons.has(i)) {
                completeBtn.disabled = true;
                completeBtn.innerHTML = `<i class="fas fa-check mr-2"></i>Topic ${i} Completed`;
                completeBtn.classList.remove('bg-emerald-500', 'hover:bg-emerald-600');
                completeBtn.classList.add('bg-green-600');
            }
        }
    }
}

async function otoLoadCompletedLessons() {
    try {
        const response = await fetch('../php/complete-lesson.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic: 'one-to-one-functions',
                action: 'get_completed'
            }),
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && Array.isArray(data.completed_lessons)) {
                otoCompletedLessons = new Set(data.completed_lessons.map(Number));
                otoUpdateSidebarProgress();
                otoUpdateLessonCompletionStatus();
                
                // Load study time for all completed lessons
                await otoLoadAndDisplayStudyTime();
                
                // Hide Topic 4 quiz button if Topic 4 is completed
                const topic4QuizButton = document.getElementById('topic4QuizButton');
                if (topic4QuizButton && otoCompletedLessons.has(4)) {
                    topic4QuizButton.style.display = 'none';
                }
                
                // Show performance analysis if all quizzes are completed
                if (otoCompletedLessons.size === otoTotalLessons) {
                    otoShowPerformanceAnalysisSection();
                }
            }
        }
    } catch (error) {
        console.error('Error loading completed lessons:', error);
    }
}

async function otoCompleteLesson(lessonNum) {
    try {
        // Save final study time before marking as complete
        if (lessonNum === otoCurrentLesson) {
            // Save current accumulated time first
            otoSaveStudyTimeForCurrentLesson();
            
            // Wait a bit for the save to update local variables
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Calculate final time - use the most recent saved time
            const baseTime = otoLastSavedTime[lessonNum] || otoTotalStudyTime[lessonNum] || 0;
            const saveStartTime = otoLastSaveTimestamp[lessonNum] || otoLessonStartTime[lessonNum];
            let finalTime = baseTime;
            
            if (saveStartTime) {
                const now = Date.now();
                const elapsed = Math.floor((now - saveStartTime) / 1000);
                if (elapsed > 0 && elapsed < 7200) {
                    finalTime = baseTime + elapsed;
                }
            }
            
            // Ensure finalTime is at least the baseTime if no elapsed time
            if (finalTime === 0 && baseTime > 0) {
                finalTime = baseTime;
            }
            
            // Send final time with is_final flag
            if (finalTime > 0) {
                const saveResponse = await fetch('../php/store-study-time.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topic: 'one-to-one-functions',
                        study_time: { [lessonNum]: finalTime },
                        is_final: true
                    }),
                    credentials: 'include'
                });
                
                const saveData = await saveResponse.json();
                if (saveData.success) {
                    otoTotalStudyTime[lessonNum] = finalTime;
                    otoLastSavedTime[lessonNum] = finalTime;
                    otoLastSaveTimestamp[lessonNum] = Date.now();
                }
            }
            
            // Stop timer intervals
            if (otoTimerUpdateInterval) {
                clearInterval(otoTimerUpdateInterval);
                otoTimerUpdateInterval = null;
            }
            if (otoStudyTimeInterval) {
                clearInterval(otoStudyTimeInterval);
                otoStudyTimeInterval = null;
            }
            
            // Clear start time
            otoLessonStartTime[lessonNum] = null;
            
            // Update timer display to show final time (green)
            otoUpdateLiveTimer();
            
            // Ensure timer container is visible
            const section = document.getElementById(`lesson${lessonNum}`);
            if (section) {
                const timerContainer = section.querySelector('.flex-shrink-0.ml-4');
                if (timerContainer) {
                    timerContainer.classList.remove('hidden');
                    timerContainer.style.display = 'flex';
                    timerContainer.style.visibility = 'visible';
                }
            }
            
            // Reload study time after a short delay to ensure server has saved it
            setTimeout(async () => {
                await otoLoadAndDisplayStudyTime();
                
                // If still 0 after reload, use the calculated finalTime as fallback
                const currentTime = otoTotalStudyTime[lessonNum] || otoLastSavedTime[lessonNum] || 0;
                if (currentTime === 0 && finalTime > 0) {
                    otoTotalStudyTime[lessonNum] = finalTime;
                    otoLastSavedTime[lessonNum] = finalTime;
                    otoUpdateLiveTimer();
                } else if (currentTime === 0) {
                    // If still 0 after reload, try one more time after a longer delay
                    setTimeout(async () => {
                        await otoLoadAndDisplayStudyTime();
                        const retryTime = otoTotalStudyTime[lessonNum] || otoLastSavedTime[lessonNum] || 0;
                        if (retryTime === 0 && finalTime > 0) {
                            otoTotalStudyTime[lessonNum] = finalTime;
                            otoLastSavedTime[lessonNum] = finalTime;
                            otoUpdateLiveTimer();
                        }
                    }, 500);
                } else {
                    otoUpdateLiveTimer();
                }
            }, 300);
        }
        
        const response = await fetch('../php/complete-lesson.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic: 'one-to-one-functions',
                lesson: lessonNum,
                action: 'complete'
            }),
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                await otoLoadCompletedLessons();
                otoUpdateSidebarProgress();
                otoUpdateLessonCompletionStatus();
            }
        }
    } catch (error) {
        console.error('Error completing lesson:', error);
    }
}

// Legacy function for backward compatibility
function completeLesson(lessonNum) {
    // Check if quiz is already passed
    if (otoCompletedLessons.has(lessonNum)) {
        Swal.fire({
            icon: 'info',
            title: 'Already Completed',
            text: `Topic ${lessonNum} is already completed.`,
            confirmButtonColor: '#667eea'
        });
        return;
    }
    
    // Run quiz first
    otoRunLessonQuiz(lessonNum).then(passed => {
        if (passed) {
            otoCompleteLesson(lessonNum);
        }
    });
}

// Legacy function for backward compatibility
function navigateLesson(direction) {
    otoNavigateLesson(direction);
}

// Export for global access
window.otoNavigateLesson = otoNavigateLesson;
window.completeLesson = completeLesson;
window.navigateLesson = navigateLesson;

// ------------------------------
// Performance Analysis (Custom AI - matching functions.html)
// ------------------------------
function otoShowPerformanceAnalysisSection() {
    // Check if all 4 topics are completed
    if (otoCompletedLessons.size !== otoTotalLessons) {
        console.log('Performance analysis will only show after completing all quizzes. Current completed:', otoCompletedLessons.size, '/', otoTotalLessons);
        return;
    }
    
    const analysisDiv = document.getElementById('performanceAnalysisSection');
    if (analysisDiv) {
        analysisDiv.style.display = 'block';
        setTimeout(() => {
            analysisDiv.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 300);
    }
}

async function otoAnalyzePerformance() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultSection = document.getElementById('analysisResult');
    
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
    }
    
    try {
        const response = await fetch(`../php/analyze-quiz-performance.php?topic=one-to-one-functions`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const responseText = await response.text();
        console.log('Raw response:', responseText.substring(0, 500));
        
        if (!response.ok) {
            let errorMessage = `Server error: ${response.status} ${response.statusText}`;
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = responseText.substring(0, 200);
            }
            throw new Error(errorMessage);
        }
        
        const result = JSON.parse(responseText);
        
        if (result.success && result.analysis) {
            otoDisplayPerformanceAnalysis(result.analysis);
        } else {
            throw new Error(result.message || 'Failed to analyze performance');
        }
    } catch (error) {
        console.error('Error analyzing performance:', error);
        if (resultSection) {
            resultSection.classList.remove('hidden');
            resultSection.innerHTML = `
                <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p class="text-red-700"><strong>Error:</strong> ${error.message}</p>
                    <p class="text-sm text-red-600 mt-2">Please try again later.</p>
                </div>
            `;
        }
    } finally {
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-chart-line mr-2"></i>Analyze My Performance';
        }
    }
}

function otoDisplayPerformanceAnalysis(analysis) {
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
                        ${Object.entries(topic_scores).map(([topic, score]) => `
                            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <span class="font-semibold text-gray-700">Topic ${topic}</span>
                                <div class="flex items-center space-x-3">
                                    <div class="w-32 bg-gray-200 rounded-full h-2">
                                        <div class="bg-primary h-2 rounded-full transition-all" style="width: ${score}%"></div>
                                    </div>
                                    <span class="text-lg font-bold text-primary w-12 text-right">${score}%</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Strengths -->
            ${strengths && strengths.length > 0 ? `
                <div class="bg-green-50 rounded-xl p-6 border-l-4 border-green-500">
                    <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-check-circle text-green-500 mr-2"></i>
                        Strengths
                    </h4>
                    <ul class="space-y-2">
                        ${strengths.map(strength => `<li class="text-gray-700 flex items-start"><i class="fas fa-arrow-right text-green-500 mr-2 mt-1"></i>${strength}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            <!-- Weaknesses -->
            ${weaknesses && weaknesses.length > 0 ? `
                <div class="bg-orange-50 rounded-xl p-6 border-l-4 border-orange-500">
                    <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-exclamation-triangle text-orange-500 mr-2"></i>
                        Areas for Improvement
                    </h4>
                    <ul class="space-y-2">
                        ${weaknesses.map(weakness => `<li class="text-gray-700 flex items-start"><i class="fas fa-arrow-right text-orange-500 mr-2 mt-1"></i>${weakness}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            <!-- Recommendations -->
            ${recommendations && recommendations.length > 0 ? `
                <div class="bg-purple-50 rounded-xl p-6 border-l-4 border-purple-500">
                    <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-lightbulb text-purple-500 mr-2"></i>
                        Recommendations
                    </h4>
                    <ul class="space-y-2">
                        ${recommendations.map(rec => `<li class="text-gray-700 flex items-start"><i class="fas fa-arrow-right text-purple-500 mr-2 mt-1"></i>${rec}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
    
    resultSection.classList.remove('hidden');
    resultSection.innerHTML = html;
}

function otoShowTopic4Quiz() {
    if (otoCompletedLessons.has(4)) {
        Swal.fire({
            icon: 'info',
            title: 'Already Completed',
            text: 'You have already completed Topic 4 quiz.',
            confirmButtonColor: '#667eea'
        });
        return;
    }
    
    otoRunLessonQuiz(4);
}

// Export functions to window for HTML onclick handlers
window.otoShowTopic4Quiz = otoShowTopic4Quiz;
window.otoAnalyzePerformance = otoAnalyzePerformance;
window.otoShowPerformanceAnalysisSection = otoShowPerformanceAnalysisSection;
window.otoDisplayPerformanceAnalysis = otoDisplayPerformanceAnalysis;
window.getTopicNameForAnalysis = () => 'one-to-one-functions';

// Legacy function for backward compatibility (removed Groq AI)
async function requestAIAnalysis() {
    // Redirect to custom performance analysis
    await otoAnalyzePerformance();
}

function displayAIAnalysis(result) {
    const resultsDiv = document.getElementById('aiAnalysisResult');
    if (!resultsDiv) return;
    
    let html = '<div class="space-y-6">';
    
    // Overall Performance Summary
    if (result.summary) {
        html += `
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-blue-500">
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-chart-line text-blue-500 mr-2"></i>Performance Summary
                </h3>
                <p class="text-gray-700">${result.summary}</p>
            </div>
        `;
    }
    
    // Strengths
    if (result.strengths && result.strengths.length > 0) {
        html += `
            <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-l-4 border-green-500">
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-check-circle text-green-500 mr-2"></i>Strengths
                </h3>
                <ul class="space-y-2 text-gray-700">
                    ${result.strengths.map(s => `<li class="flex items-start"><i class="fas fa-star text-yellow-500 mr-2 mt-1"></i><span>${s}</span></li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    // Areas for Improvement
    if (result.improvements && result.improvements.length > 0) {
        html += `
            <div class="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border-l-4 border-orange-500">
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-lightbulb text-orange-500 mr-2"></i>Areas for Improvement
                </h3>
                <ul class="space-y-2 text-gray-700">
                    ${result.improvements.map(i => `<li class="flex items-start"><i class="fas fa-arrow-up text-orange-500 mr-2 mt-1"></i><span>${i}</span></li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    // Recommendations
    if (result.recommendations && result.recommendations.length > 0) {
        html += `
            <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-l-4 border-purple-500">
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-graduation-cap text-purple-500 mr-2"></i>Recommendations
                </h3>
                <ul class="space-y-2 text-gray-700">
                    ${result.recommendations.map(r => `<li class="flex items-start"><i class="fas fa-book-reader text-purple-500 mr-2 mt-1"></i><span>${r}</span></li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    // Performance Chart
    if (result.lesson_scores) {
        html += `
            <div class="bg-white rounded-xl p-6 shadow-md">
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-chart-bar text-indigo-500 mr-2"></i>Performance by Topic
                </h3>
                <canvas id="performanceChart" width="400" height="200"></canvas>
            </div>
        `;
    }
    
    html += '</div>';
    resultsDiv.innerHTML = html;
    
    // Render chart if data available
    if (result.lesson_scores && typeof Chart !== 'undefined') {
        const ctx = document.getElementById('performanceChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: result.lesson_scores.map((_, i) => `Topic ${i + 1}`),
                    datasets: [{
                        label: 'Score (%)',
                        data: result.lesson_scores.map(s => (s.score / s.total) * 100),
                        backgroundColor: 'rgba(102, 126, 234, 0.6)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
        }
    }
}

// Export for global access
window.requestAIAnalysis = requestAIAnalysis;

// ------------------------------
// User Authentication Functions
// ------------------------------
function toggleUserDropdown() {
    const menu = document.getElementById('userDropdownMenu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

function confirmLogout() {
    Swal.fire({
        title: 'Logout',
        text: 'Are you sure you want to logout?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, logout',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = '../php/logout.php';
        }
    });
}

function loadProfilePicture() {
    fetch('../php/user.php', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.user) {
                const user = data.user;
                const profileImage = user.profile_picture;
                
                // Update all profile image elements
                ['userProfileImage', 'userProfileImageDropdown', 'userProfileImageMobile'].forEach(id => {
                    const img = document.getElementById(id);
                    const icon = document.getElementById(id.replace('Image', 'Icon'));
                    if (img && icon) {
                        if (profileImage) {
                            img.src = '../' + profileImage + '?t=' + Date.now();
                            img.classList.remove('hidden');
                            icon.style.display = 'none';
                        } else {
                            img.src = '';
                            img.classList.add('hidden');
                            icon.style.display = 'block';
                        }
                    }
                });
                
                // Update user names
                ['userName', 'userNameDropdown', 'userNameMobile'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el && user.first_name) {
                        el.textContent = `${user.first_name} ${user.last_name || ''}`.trim();
                    }
                });
            }
        })
        .catch(err => console.error('Error loading profile:', err));
}

// Export for global access
window.toggleUserDropdown = toggleUserDropdown;
window.toggleMobileMenu = toggleMobileMenu;
window.confirmLogout = confirmLogout;

// ------------------------------
// DOMContentLoaded Initialization
// ------------------------------
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Authentication guard
        const res = await fetch('../php/user.php', { credentials: 'include', cache: 'no-store' });
        if (res.status === 401) {
            window.location.href = '../login.html';
            return;
        }
        const data = await res.json();
        if (!data.success) {
            window.location.href = '../login.html';
            return;
        }
        
        const user = data.user || {};
        const gradeOk = !user.grade_level || String(user.grade_level) === '11';
        const strandOk = !user.strand || String(user.strand).toUpperCase() === 'STEM';
        
        if (!gradeOk || !strandOk) {
            window.location.href = '../dashboard.html';
            return;
        }
        
        // Load profile picture
        loadProfilePicture();
        
        // Initialize sidebar
        initializeSidebar();
        
        // Load completed lessons
        await otoLoadCompletedLessons();
        
        // Start study time interval (save every 30 seconds)
        otoStudyTimeInterval = setInterval(() => {
            if (otoCurrentLesson && !otoCompletedLessons.has(otoCurrentLesson)) {
                otoSaveStudyTimeForCurrentLesson();
            }
        }, 30000);
        
        // Load and display study time for current lesson
        await otoLoadAndDisplayStudyTime();
        
        // Show first lesson
        await otoShowLesson(1);
        
        // Initialize virtual aids
        initializeAllVirtualAids();
        
        // Add visibility change listener to handle tab switching
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                // Page is hidden, save time
                if (otoCurrentLesson && !otoCompletedLessons.has(otoCurrentLesson)) {
                    otoSaveStudyTimeForCurrentLesson();
                }
            } else {
                // Page is visible again, reload time and restart timer
                if (otoCurrentLesson && !otoCompletedLessons.has(otoCurrentLesson)) {
                    otoLoadAndDisplayStudyTime().then(() => {
                        otoStartLiveTimer();
                    });
                }
            }
        });
        
        // Save time before page unload
        window.addEventListener('beforeunload', function() {
            if (otoCurrentLesson && !otoCompletedLessons.has(otoCurrentLesson)) {
                otoSaveStudyTimeForCurrentLesson();
            }
        });
        
    } catch (error) {
        console.error('Initialization error:', error);
        window.location.href = '../login.html';
    }
});

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('userDropdown');
    const menu = document.getElementById('userDropdownMenu');
    if (dropdown && menu && !dropdown.contains(event.target)) {
        menu.classList.add('hidden');
    }
});

// ------------------------------
// Virtual Aids Functions (existing functions)
// ------------------------------
function initializeAllVirtualAids() {
    // Initialize function input listeners
    const functionInput = document.getElementById('functionInput');
    if (functionInput) {
        functionInput.addEventListener('input', debounce(analyzeOneToOne, 500));
    }
    
    // Initialize test function input listeners
    const testFunctionInput = document.getElementById('testFunctionInput');
    if (testFunctionInput) {
        testFunctionInput.addEventListener('input', debounce(testOneToOne, 500));
    }
    
    // Initialize inverse function input listeners
    const inverseFunctionInput = document.getElementById('inverseFunctionInput');
    if (inverseFunctionInput) {
        inverseFunctionInput.addEventListener('input', debounce(findInverse, 500));
    }
    
    // Initialize application type selector
    const applicationType = document.getElementById('applicationType');
    if (applicationType) {
        applicationType.addEventListener('change', function() {
            updateApplicationInputs(this.value);
        });
    }
    
    // Initialize test method selector
    const testMethod = document.getElementById('testMethod');
    if (testMethod) {
        testMethod.addEventListener('change', function() {
            testOneToOne();
        });
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

// ------------------------------
// Virtual Aid Functions
// ------------------------------

// One-to-One Function Analysis Logic
function analyzeOneToOne() {
    try {
        const functionInput = document.getElementById('functionInput');
        if (!functionInput) {
            console.error('Function input element not found');
            return;
        }
        
        const inputValue = functionInput.value.trim();
        
        if (!inputValue) {
            resetOneToOneResults();
            return;
        }
        
        // Display the function
        const functionDisplay = document.getElementById('functionDisplay');
        if (functionDisplay) {
            functionDisplay.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Function:</h4>
                <div class="function-display">f(x) = ${inputValue}</div>
            `;
        }
        
        // Analyze one-to-one property
        const oneToOneAnalysis = analyzeOneToOneProperty(inputValue);
        
        const oneToOneResult = document.getElementById('oneToOneResult');
        if (oneToOneResult) {
            oneToOneResult.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">One-to-One Status:</h4>
                <div class="text-gray-700">${oneToOneAnalysis.status}</div>
                <div class="text-sm text-gray-600 mt-2">${oneToOneAnalysis.explanation}</div>
            `;
        }
        
        // Horizontal line test analysis
        const horizontalLineTest = document.getElementById('horizontalLineTest');
        if (horizontalLineTest) {
            horizontalLineTest.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Horizontal Line Test:</h4>
                <div class="text-gray-700">${oneToOneAnalysis.horizontalLineTest}</div>
            `;
        }
        
        // Show analysis steps
        const analysisSteps = document.getElementById('analysisSteps');
        if (analysisSteps) {
            analysisSteps.style.display = 'block';
            analysisSteps.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Analysis Steps:</h4>
                <div class="text-gray-700">${oneToOneAnalysis.steps}</div>
            `;
        }
        
    } catch (error) {
        console.error('Error analyzing one-to-one function:', error);
        showError('Invalid function format. Please check your input.');
    }
}

// Analyze One-to-One Property
function analyzeOneToOneProperty(functionInput) {
    // Simple analysis for common cases
    if (functionInput.includes('x +') || functionInput.includes('x-') || functionInput.includes('2x') || functionInput.includes('3x')) {
        return {
            status: '<span class="one-to-one-status true">✓ One-to-One Function</span>',
            explanation: 'This is a linear function. Linear functions are always one-to-one because they have a constant rate of change.',
            horizontalLineTest: 'Every horizontal line intersects the graph at most once. The function passes the horizontal line test.',
            steps: `
                <div class="step-by-step">
                    <div class="step">
                        <div class="step-number">1</div>
                        <div><strong>Identify Function Type:</strong> This is a linear function of the form f(x) = mx + b</div>
                    </div>
                    <div class="step">
                        <div class="step-number">2</div>
                        <div><strong>Check Slope:</strong> Linear functions have a constant slope (m ≠ 0)</div>
                    </div>
                    <div class="step">
                        <div class="step-number">3</div>
                        <div><strong>Apply Horizontal Line Test:</strong> Any horizontal line intersects the graph at most once</div>
                    </div>
                    <div class="step">
                        <div class="step-number">4</div>
                        <div><strong>Conclusion:</strong> Since the function is strictly increasing or decreasing, it is one-to-one</div>
                    </div>
                </div>
            `
        };
    } else if (functionInput.includes('x³') || functionInput.includes('x^3')) {
        return {
            status: '<span class="one-to-one-status true">✓ One-to-One Function</span>',
            explanation: 'This is a cubic function. Cubic functions are one-to-one because they are strictly increasing.',
            horizontalLineTest: 'Every horizontal line intersects the graph at most once. The function passes the horizontal line test.',
            steps: `
                <div class="step-by-step">
                    <div class="step">
                        <div class="step-number">1</div>
                        <div><strong>Identify Function Type:</strong> This is a cubic function f(x) = x³</div>
                    </div>
                    <div class="step">
                        <div class="step-number">2</div>
                        <div><strong>Check Derivative:</strong> f'(x) = 3x² ≥ 0 for all x, and f'(x) > 0 for x ≠ 0</div>
                    </div>
                    <div class="step">
                        <div class="step-number">3</div>
                        <div><strong>Apply Horizontal Line Test:</strong> The function is strictly increasing, so any horizontal line intersects at most once</div>
                    </div>
                    <div class="step">
                        <div class="step-number">4</div>
                        <div><strong>Conclusion:</strong> The cubic function is one-to-one</div>
                    </div>
                </div>
            `
        };
    } else if (functionInput.includes('x²') || functionInput.includes('x^2')) {
        return {
            status: '<span class="one-to-one-status false">✗ Not One-to-One</span>',
            explanation: 'This is a quadratic function. Quadratic functions are not one-to-one because they have a turning point.',
            horizontalLineTest: 'Some horizontal lines intersect the graph twice. The function fails the horizontal line test.',
            steps: `
                <div class="step-by-step">
                    <div class="step">
                        <div class="step-number">1</div>
                        <div><strong>Identify Function Type:</strong> This is a quadratic function f(x) = x²</div>
                    </div>
                    <div class="step">
                        <div class="step-number">2</div>
                        <div><strong>Find Counterexample:</strong> f(2) = 4 and f(-2) = 4, but 2 ≠ -2</div>
                    </div>
                    <div class="step">
                        <div class="step-number">3</div>
                        <div><strong>Apply Horizontal Line Test:</strong> The horizontal line y = 4 intersects the graph at two points: (2, 4) and (-2, 4)</div>
                    </div>
                    <div class="step">
                        <div class="step-number">4</div>
                        <div><strong>Conclusion:</strong> The quadratic function is NOT one-to-one</div>
                    </div>
                </div>
            `
        };
    } else if (functionInput.includes('|x|') || functionInput.includes('abs(x)')) {
        return {
            status: '<span class="one-to-one-status false">✗ Not One-to-One</span>',
            explanation: 'This is an absolute value function. Absolute value functions are not one-to-one because f(a) = f(-a) for any a.',
            horizontalLineTest: 'Some horizontal lines intersect the graph twice. The function fails the horizontal line test.',
            steps: `
                <div class="step-by-step">
                    <div class="step">
                        <div class="step-number">1</div>
                        <div><strong>Identify Function Type:</strong> This is an absolute value function f(x) = |x|</div>
                    </div>
                    <div class="step">
                        <div class="step-number">2</div>
                        <div><strong>Find Counterexample:</strong> f(3) = 3 and f(-3) = 3, but 3 ≠ -3</div>
                    </div>
                    <div class="step">
                        <div class="step-number">3</div>
                        <div><strong>Apply Horizontal Line Test:</strong> The horizontal line y = 3 intersects the graph at two points: (3, 3) and (-3, 3)</div>
                    </div>
                    <div class="step">
                        <div class="step-number">4</div>
                        <div><strong>Conclusion:</strong> The absolute value function is NOT one-to-one</div>
                    </div>
                </div>
            `
        };
    } else {
        return {
            status: '<span class="one-to-one-status warning">⚠ Analysis Needed</span>',
            explanation: 'This function requires more detailed analysis to determine if it is one-to-one.',
            horizontalLineTest: 'Apply the horizontal line test or algebraic methods to determine one-to-one property.',
            steps: `
                <div class="step-by-step">
                    <div class="step">
                        <div class="step-number">1</div>
                        <div><strong>Identify Function Type:</strong> This function requires manual analysis</div>
                    </div>
                    <div class="step">
                        <div class="step-number">2</div>
                        <div><strong>Apply Algebraic Test:</strong> Assume f(a) = f(b) and show that a = b</div>
                    </div>
                    <div class="step">
                        <div class="step-number">3</div>
                        <div><strong>Apply Horizontal Line Test:</strong> Graph the function and check if any horizontal line intersects more than once</div>
                    </div>
                    <div class="step">
                        <div class="step-number">4</div>
                        <div><strong>Conclusion:</strong> Manual analysis required to determine one-to-one property</div>
                    </div>
                </div>
            `
        };
    }
}

// Reset One-to-One Results
function resetOneToOneResults() {
    const functionDisplay = document.getElementById('functionDisplay');
    const oneToOneResult = document.getElementById('oneToOneResult');
    const horizontalLineTest = document.getElementById('horizontalLineTest');
    const analysisSteps = document.getElementById('analysisSteps');
    
    if (functionDisplay) {
        functionDisplay.innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Function:</h4>
            <div class="function-display">f(x) = </div>
        `;
    }
    
    if (oneToOneResult) {
        oneToOneResult.innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">One-to-One Status:</h4>
            <div class="text-gray-700">Enter a function to analyze</div>
        `;
    }
    
    if (horizontalLineTest) {
        horizontalLineTest.innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Horizontal Line Test:</h4>
            <div class="text-gray-700">Enter a function to analyze</div>
        `;
    }
    
    if (analysisSteps) {
        analysisSteps.style.display = 'none';
        analysisSteps.innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Analysis Steps:</h4>
            <div class="text-gray-700">Analysis steps will appear here</div>
        `;
    }
}

// Test One-to-One Function
function testOneToOne() {
    const functionInput = document.getElementById('testFunctionInput');
    const testMethod = document.getElementById('testMethod');
    
    if (!functionInput || !testMethod) {
        console.error('Test elements not found');
        return;
    }
    
    const inputValue = functionInput.value.trim();
    const method = testMethod.value;
    
    if (!inputValue) {
        resetTestResults();
        return;
    }
    
    try {
        // Display the function
        const testFunctionDisplay = document.getElementById('testFunctionDisplay');
        if (testFunctionDisplay) {
            testFunctionDisplay.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Function:</h4>
                <div class="text-lg font-mono text-primary">f(x) = ${inputValue}</div>
            `;
        }
        
        // Perform test based on selected method
        const testResult = performTest(inputValue, method);
        
        const testResultDiv = document.getElementById('testResult');
        if (testResultDiv) {
            testResultDiv.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Test Result:</h4>
                <div class="text-gray-700">${testResult.result}</div>
            `;
        }
        
        // Show test steps
        const testSteps = document.getElementById('testSteps');
        if (testSteps) {
            testSteps.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Test Steps:</h4>
                <div class="text-gray-700">${testResult.steps}</div>
            `;
        }
        
    } catch (error) {
        console.error('Error testing function:', error);
        showError('Invalid function format. Please check your input.');
    }
}

// Perform Test
function performTest(functionInput, testMethod) {
    switch (testMethod) {
        case 'algebraic':
            return performAlgebraicTest(functionInput);
        case 'derivative':
            return performDerivativeTest(functionInput);
        case 'graphical':
            return performGraphicalTest(functionInput);
        default:
            return {
                result: 'Please select a test method.',
                steps: 'Choose a test method to see the steps.'
            };
    }
}

// Perform Algebraic Test
function performAlgebraicTest(functionInput) {
    if (functionInput.includes('x +') || functionInput.includes('x-') || functionInput.includes('2x') || functionInput.includes('3x')) {
        return {
            result: '<span class="one-to-one-status true">✓ One-to-One Function</span>',
            steps: `
                <ol class="list-decimal list-inside space-y-2">
                    <li>Assume f(a) = f(b)</li>
                    <li>Substitute: ${functionInput.replace('x', 'a')} = ${functionInput.replace('x', 'b')}</li>
                    <li>Solve algebraically</li>
                    <li>Result: a = b</li>
                    <li>Conclusion: Function is one-to-one</li>
                </ol>
            `
        };
    } else if (functionInput.includes('x²') || functionInput.includes('x^2')) {
        return {
            result: '<span class="one-to-one-status false">✗ Not One-to-One</span>',
            steps: `
                <ol class="list-decimal list-inside space-y-2">
                    <li>Consider f(2) = 2² = 4</li>
                    <li>And f(-2) = (-2)² = 4</li>
                    <li>Since f(2) = f(-2) but 2 ≠ -2</li>
                    <li>Conclusion: Function is NOT one-to-one</li>
                </ol>
            `
        };
    } else {
        return {
            result: '<span class="one-to-one-status warning">⚠ Manual Analysis Required</span>',
            steps: 'This function requires manual algebraic analysis to determine one-to-one property.'
        };
    }
}

// Perform Derivative Test
function performDerivativeTest(functionInput) {
    if (functionInput.includes('x +') || functionInput.includes('x-') || functionInput.includes('2x') || functionInput.includes('3x')) {
        return {
            result: '<span class="one-to-one-status true">✓ One-to-One Function</span>',
            steps: `
                <ol class="list-decimal list-inside space-y-2">
                    <li>Find derivative: f'(x) = constant</li>
                    <li>Since f'(x) > 0 for all x</li>
                    <li>The function is strictly increasing</li>
                    <li>Conclusion: Function is one-to-one</li>
                </ol>
            `
        };
    } else if (functionInput.includes('x²') || functionInput.includes('x^2')) {
        return {
            result: '<span class="one-to-one-status false">✗ Not One-to-One</span>',
            steps: `
                <ol class="list-decimal list-inside space-y-2">
                    <li>Find derivative: f'(x) = 2x</li>
                    <li>f'(x) = 0 when x = 0</li>
                    <li>The function is not strictly increasing</li>
                    <li>Conclusion: Function is NOT one-to-one</li>
                </ol>
            `
        };
    } else {
        return {
            result: '<span class="one-to-one-status warning">⚠ Manual Analysis Required</span>',
            steps: 'This function requires manual derivative analysis to determine one-to-one property.'
        };
    }
}

// Perform Graphical Test
function performGraphicalTest(functionInput) {
    if (functionInput.includes('x +') || functionInput.includes('x-') || functionInput.includes('2x') || functionInput.includes('3x')) {
        return {
            result: '<span class="one-to-one-status true">✓ One-to-One Function</span>',
            steps: `
                <ol class="list-decimal list-inside space-y-2">
                    <li>Graph the function</li>
                    <li>Draw horizontal lines across the graph</li>
                    <li>Each horizontal line intersects at most once</li>
                    <li>Conclusion: Function passes horizontal line test</li>
                </ol>
            `
        };
    } else if (functionInput.includes('x²') || functionInput.includes('x^2')) {
        return {
            result: '<span class="one-to-one-status false">✗ Not One-to-One</span>',
            steps: `
                <ol class="list-decimal list-inside space-y-2">
                    <li>Graph the function (parabola)</li>
                    <li>Draw horizontal lines across the graph</li>
                    <li>Some horizontal lines intersect twice</li>
                    <li>Conclusion: Function fails horizontal line test</li>
                </ol>
            `
        };
    } else {
        return {
            result: '<span class="one-to-one-status warning">⚠ Manual Analysis Required</span>',
            steps: 'This function requires manual graphical analysis to determine one-to-one property.'
        };
    }
}

// Reset Test Results
function resetTestResults() {
    const testFunctionDisplay = document.getElementById('testFunctionDisplay');
    const testResult = document.getElementById('testResult');
    const testSteps = document.getElementById('testSteps');
    
    if (testFunctionDisplay) {
        testFunctionDisplay.innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Function:</h4>
            <div class="text-lg font-mono text-primary">f(x) = </div>
        `;
    }
    
    if (testResult) {
        testResult.innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Test Result:</h4>
            <div class="text-gray-700">Enter a function and select test method</div>
        `;
    }
    
    if (testSteps) {
        testSteps.innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Test Steps:</h4>
            <div class="text-gray-700">Test steps will appear here</div>
        `;
    }
}

// Find Inverse Function
function findInverse() {
    const functionInput = document.getElementById('inverseFunctionInput');
    
    if (!functionInput) {
        console.error('Inverse function input not found');
        return;
    }
    
    const inputValue = functionInput.value.trim();
    
    if (!inputValue) {
        resetInverseResults();
        return;
    }
    
    try {
        // Display the original function
        const originalFunctionDisplay = document.getElementById('originalFunctionDisplay');
        if (originalFunctionDisplay) {
            originalFunctionDisplay.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Original Function:</h4>
                <div class="text-lg font-mono text-primary">f(x) = ${inputValue}</div>
            `;
        }
        
        // Find inverse function
        const inverseResult = findInverseFunction(inputValue);
        
        const inverseFunctionDisplay = document.getElementById('inverseFunctionDisplay');
        if (inverseFunctionDisplay) {
            inverseFunctionDisplay.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Inverse Function:</h4>
                <div class="text-lg font-mono text-green-600">f⁻¹(x) = ${inverseResult.inverse}</div>
            `;
        }
        
        // Show solution steps
        const inverseSteps = document.getElementById('inverseSteps');
        if (inverseSteps) {
            inverseSteps.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Solution Steps:</h4>
                <div class="text-gray-700">${inverseResult.steps}</div>
            `;
        }
        
        // Show verification
        const verification = document.getElementById('verification');
        if (verification) {
            verification.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Verification:</h4>
                <div class="text-gray-700">${inverseResult.verification}</div>
            `;
        }
        
    } catch (error) {
        console.error('Error finding inverse function:', error);
        showError('Invalid function format. Please check your input.');
    }
}

// Find Inverse Function
function findInverseFunction(functionInput) {
    // Handle linear functions: f(x) = mx + b
    // Pattern: matches "ax + b" or "ax - b" or "ax"
    const linearMatch = functionInput.match(/(-?\d*)x\s*([+\-]?\s*\d+)?/);
    
    if (linearMatch) {
        const coefficient = linearMatch[1] ? (linearMatch[1] === '-' ? -1 : parseInt(linearMatch[1]) || 1) : 1;
        let constant = 0;
        
        if (linearMatch[2]) {
            const constStr = linearMatch[2].replace(/\s+/g, '').replace('+', '');
            constant = parseInt(constStr) || 0;
        }
        
        // Calculate inverse: f(x) = mx + b → f⁻¹(x) = (x - b) / m
        let inverseStr;
        let stepsStr;
        let verificationStr;
        
        if (coefficient === 1 && constant === 0) {
            // f(x) = x
            inverseStr = 'x';
            stepsStr = `
                <ol class="list-decimal list-inside space-y-2">
                    <li>Replace f(x) with y: y = x</li>
                    <li>Interchange x and y: x = y</li>
                    <li>Solve for y: y = x</li>
                    <li>Replace y with f⁻¹(x): f⁻¹(x) = x</li>
                </ol>
            `;
        } else if (coefficient === 1) {
            // f(x) = x + b or f(x) = x - b
            const sign = constant >= 0 ? '+' : '';
            inverseStr = `x - ${constant}`;
            stepsStr = `
                <ol class="list-decimal list-inside space-y-2">
                    <li>Replace f(x) with y: y = x ${sign}${constant}</li>
                    <li>Interchange x and y: x = y ${sign}${constant}</li>
                    <li>Solve for y: y = x - ${constant}</li>
                    <li>Replace y with f⁻¹(x): f⁻¹(x) = x - ${constant}</li>
                </ol>
            `;
        } else if (constant === 0) {
            // f(x) = mx
            inverseStr = `x / ${coefficient}`;
            if (coefficient < 0) {
                inverseStr = `x / (${coefficient})`;
            }
            stepsStr = `
                <ol class="list-decimal list-inside space-y-2">
                    <li>Replace f(x) with y: y = ${coefficient}x</li>
                    <li>Interchange x and y: x = ${coefficient}y</li>
                    <li>Solve for y: y = x / ${coefficient}</li>
                    <li>Replace y with f⁻¹(x): f⁻¹(x) = x / ${coefficient}</li>
                </ol>
            `;
        } else {
            // f(x) = mx + b
            const sign = constant >= 0 ? '+' : '';
            inverseStr = `(x - ${constant}) / ${coefficient}`;
            if (coefficient < 0) {
                inverseStr = `(x - ${constant}) / (${coefficient})`;
            }
            stepsStr = `
                <ol class="list-decimal list-inside space-y-2">
                    <li>Replace f(x) with y: y = ${coefficient}x ${sign}${constant}</li>
                    <li>Interchange x and y: x = ${coefficient}y ${sign}${constant}</li>
                    <li>Subtract ${constant} from both sides: x - ${constant} = ${coefficient}y</li>
                    <li>Divide by ${coefficient}: y = (x - ${constant}) / ${coefficient}</li>
                    <li>Replace y with f⁻¹(x): f⁻¹(x) = (x - ${constant}) / ${coefficient}</li>
                </ol>
            `;
        }
        
        // Verification
        const sign = constant >= 0 ? '+' : '';
        verificationStr = `
            <div class="verification-display">
                <div class="verification-step">
                    <div class="step-icon">1</div>
                    <div>f(f⁻¹(x)) = f(${inverseStr}) = ${coefficient}(${inverseStr}) ${sign}${constant} = x ✓</div>
                </div>
                <div class="verification-step">
                    <div class="step-icon">2</div>
                    <div>f⁻¹(f(x)) = f⁻¹(${coefficient}x ${sign}${constant}) = ${inverseStr.replace('x', `${coefficient}x ${sign}${constant}`)} = x ✓</div>
                </div>
            </div>
        `;
        
        return {
            inverse: inverseStr,
            steps: stepsStr,
            verification: verificationStr
        };
    } else if (functionInput.includes('2x') || functionInput.includes('3x') || functionInput.match(/\d+x/)) {
        // Handle cases like "2x", "3x", etc.
        const match = functionInput.match(/(\d+)x/);
        if (match) {
            const coefficient = parseInt(match[1]);
            return {
                inverse: `x / ${coefficient}`,
                steps: `
                    <ol class="list-decimal list-inside space-y-2">
                        <li>Replace f(x) with y: y = ${coefficient}x</li>
                        <li>Interchange x and y: x = ${coefficient}y</li>
                        <li>Solve for y: y = x / ${coefficient}</li>
                        <li>Replace y with f⁻¹(x): f⁻¹(x) = x / ${coefficient}</li>
                    </ol>
                `,
                verification: `
                    <div class="verification-display">
                        <div class="verification-step">
                            <div class="step-icon">1</div>
                            <div>f(f⁻¹(x)) = f(x / ${coefficient}) = ${coefficient} × (x / ${coefficient}) = x ✓</div>
                        </div>
                        <div class="verification-step">
                            <div class="step-icon">2</div>
                            <div>f⁻¹(f(x)) = f⁻¹(${coefficient}x) = (${coefficient}x) / ${coefficient} = x ✓</div>
                        </div>
                    </div>
                `
            };
        }
    } else if (functionInput.includes('x³') || functionInput.includes('x^3')) {
        return {
            inverse: '∛x',
            steps: `
                <ol class="list-decimal list-inside space-y-2">
                    <li>Replace f(x) with y: y = x³</li>
                    <li>Interchange x and y: x = y³</li>
                    <li>Solve for y: y = ∛x</li>
                    <li>Replace y with f⁻¹(x): f⁻¹(x) = ∛x</li>
                </ol>
            `,
            verification: `
                <div class="verification-display">
                    <div class="verification-step">
                        <div class="step-icon">1</div>
                        <div>f(f⁻¹(x)) = f(∛x) = (∛x)³ = x ✓</div>
                    </div>
                    <div class="verification-step">
                        <div class="step-icon">2</div>
                        <div>f⁻¹(f(x)) = f⁻¹(x³) = ∛(x³) = x ✓</div>
                    </div>
                </div>
            `
        };
    } else {
        return {
            inverse: 'Manual calculation required',
            steps: 'This function requires manual calculation to find its inverse.',
            verification: 'Verification requires manual calculation.'
        };
    }
}

// Reset Inverse Results
function resetInverseResults() {
    const originalFunctionDisplay = document.getElementById('originalFunctionDisplay');
    const inverseFunctionDisplay = document.getElementById('inverseFunctionDisplay');
    const inverseSteps = document.getElementById('inverseSteps');
    const verification = document.getElementById('verification');
    
    if (originalFunctionDisplay) {
        originalFunctionDisplay.innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Original Function:</h4>
            <div class="text-lg font-mono text-primary">f(x) = </div>
        `;
    }
    
    if (inverseFunctionDisplay) {
        inverseFunctionDisplay.innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Inverse Function:</h4>
            <div class="text-lg font-mono text-green-600">f⁻¹(x) = </div>
        `;
    }
    
    if (inverseSteps) {
        inverseSteps.innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Solution Steps:</h4>
            <div class="text-gray-700">Enter a function to see the steps</div>
        `;
    }
    
    if (verification) {
        verification.innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Verification:</h4>
            <div class="text-gray-700">Verification will appear here</div>
        `;
    }
}

// Application Problem Solver
function updateApplicationInputs(applicationType) {
    const applicationInputs = document.getElementById('applicationInputs');
    const applicationDescription = document.getElementById('applicationDescription');
    
    if (!applicationInputs || !applicationDescription) return;
    
    switch (applicationType) {
        case 'cryptography':
            applicationInputs.innerHTML = `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Enter Message:</label>
                    <input type="text" id="message" placeholder="e.g., HELLO" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Shift Value:</label>
                    <input type="number" id="shiftValue" placeholder="e.g., 3" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
            `;
            applicationDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Problem Description:</h4>
                <div class="text-gray-700">Caesar cipher encryption: f(x) = (x + shift) mod 26. Analyze the one-to-one property of this encryption function.</div>
            `;
            break;
            
        case 'temperature':
            applicationInputs.innerHTML = `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Temperature in Celsius:</label>
                    <input type="number" id="celsius" placeholder="e.g., 25" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
            `;
            applicationDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Problem Description:</h4>
                <div class="text-gray-700">Temperature conversion: F = (9/5)C + 32. Analyze the one-to-one property and find the inverse function.</div>
            `;
            break;
            
        case 'database':
            applicationInputs.innerHTML = `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Student ID:</label>
                    <input type="number" id="studentId" placeholder="e.g., 12345" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Student Name:</label>
                    <input type="text" id="studentName" placeholder="e.g., John Doe" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
            `;
            applicationDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Problem Description:</h4>
                <div class="text-gray-700">Database function: f(student_id) = student_name. Analyze why this function must be one-to-one for data integrity.</div>
            `;
            break;
            
        case 'algorithm':
            applicationInputs.innerHTML = `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Input Value:</label>
                    <input type="number" id="inputValue" placeholder="e.g., 5" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Algorithm Type:</label>
                    <select id="algorithmType" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                        <option value="hash">Hash Function</option>
                        <option value="encrypt">Encryption Function</option>
                        <option value="sort">Sorting Function</option>
                    </select>
                </div>
            `;
            applicationDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Problem Description:</h4>
                <div class="text-gray-700">Algorithm design: Analyze how one-to-one functions ensure unique mappings and prevent conflicts in data processing.</div>
            `;
            break;
            
        default:
            applicationInputs.innerHTML = '<div class="text-gray-600">Select an application type to see inputs</div>';
            applicationDescription.innerHTML = '<div class="text-gray-600">Select an application type to see the description</div>';
    }
}

// Solve Application Problem
function solveApplicationProblem() {
    const applicationType = document.getElementById('applicationType');
    
    if (!applicationType) {
        showError('Please select an application type first.');
        return;
    }
    
    const type = applicationType.value;
    
    if (!type) {
        showError('Please select an application type first.');
        return;
    }
    
    try {
        let solution;
        
        switch (type) {
            case 'cryptography':
                solution = solveCryptographyProblem();
                break;
            case 'temperature':
                solution = solveTemperatureProblem();
                break;
            case 'database':
                solution = solveDatabaseProblem();
                break;
            case 'algorithm':
                solution = solveAlgorithmProblem();
                break;
            default:
                showError('Unknown application type.');
                return;
        }
        
        displayApplicationSolution(solution);
        
    } catch (error) {
        console.error('Error solving application problem:', error);
        showError('Error solving problem. Please check your inputs.');
    }
}

// Solve Cryptography Problem
function solveCryptographyProblem() {
    const message = document.getElementById('message');
    const shiftValue = document.getElementById('shiftValue');
    
    if (!message || !message.value) {
        throw new Error('Please enter a message to encrypt.');
    }
    
    if (!shiftValue || !shiftValue.value) {
        throw new Error('Please enter a shift value.');
    }
    
    const msg = message.value.toUpperCase().replace(/[^A-Z]/g, ''); // Only letters
    const shift = parseInt(shiftValue.value);
    
    if (!msg) {
        throw new Error('Please enter a message with at least one letter.');
    }
    
    if (isNaN(shift) || shift < 0 || shift > 25) {
        throw new Error('Shift value must be a number between 0 and 25.');
    }
    
    const encrypted = encryptMessage(msg, shift);
    
    // Show letter-by-letter mapping
    let mappingDetails = '';
    for (let i = 0; i < Math.min(msg.length, 10); i++) {
        const char = msg[i];
        const charCode = char.charCodeAt(0) - 65;
        const encryptedCode = (charCode + shift) % 26;
        const encryptedChar = String.fromCharCode(encryptedCode + 65);
        mappingDetails += `${char} → ${encryptedChar} (${charCode} + ${shift} mod 26 = ${encryptedCode})<br>`;
    }
    if (msg.length > 10) {
        mappingDetails += `... (${msg.length - 10} more letters)`;
    }
    
    return {
        oneToOneAnalysis: `
            <div class="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                <strong>One-to-One Analysis:</strong><br>
                The Caesar cipher function f(x) = (x + ${shift}) mod 26 is one-to-one because:<br>
                <ul class="list-disc list-inside mt-2 space-y-1">
                    <li>Each letter (A-Z) maps to exactly one encrypted letter</li>
                    <li>No two different letters produce the same encrypted result</li>
                    <li>The function is injective: if f(a) = f(b), then a = b</li>
                    <li>This ensures unique decryption for each encrypted message</li>
                </ul>
                <div class="mt-3 bg-white rounded p-3">
                    <strong>Letter Mapping Example:</strong><br>
                    <div class="text-sm font-mono">${mappingDetails}</div>
                </div>
            </div>
        `,
        solutionSteps: `
            <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <strong>Solution Steps:</strong><br>
                <ol class="list-decimal list-inside mt-2 space-y-1">
                    <li>Original message: <strong>${msg}</strong></li>
                    <li>Apply encryption function: f(x) = (x + ${shift}) mod 26</li>
                    <li>For each letter, shift by ${shift} positions in the alphabet</li>
                    <li>Encrypted result: <strong>${encrypted}</strong></li>
                    <li>One-to-one property ensures we can uniquely decrypt: f⁻¹(x) = (x - ${shift}) mod 26</li>
                </ol>
            </div>
        `,
        practicalImplications: `
            <div class="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                <strong>Practical Implications:</strong><br>
                <ul class="list-disc list-inside mt-2 space-y-1">
                    <li>Unique encryption ensures secure communication without ambiguity</li>
                    <li>One-to-one property prevents decryption errors</li>
                    <li>Essential for maintaining data integrity in cryptography</li>
                    <li>Enables reliable message transmission and reception</li>
                    <li>Foundation for more complex encryption algorithms</li>
                </ul>
            </div>
        `
    };
}

// Solve Temperature Problem
function solveTemperatureProblem() {
    const celsius = document.getElementById('celsius');
    
    if (!celsius || !celsius.value) {
        throw new Error('Please enter a temperature in Celsius.');
    }
    
    const temp = parseFloat(celsius.value);
    
    if (isNaN(temp)) {
        throw new Error('Please enter a valid number for Celsius temperature.');
    }
    
    const fahrenheit = (9/5) * temp + 32;
    const fahrenheitRounded = Math.round(fahrenheit * 10) / 10; // Round to 1 decimal place
    
    // Verify inverse: C = (5/9)(F - 32)
    const inverseCelsius = (5/9) * (fahrenheitRounded - 32);
    const inverseRounded = Math.round(inverseCelsius * 10) / 10;
    
    return {
        oneToOneAnalysis: `
            <div class="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                <strong>One-to-One Analysis:</strong><br>
                The temperature conversion function F = (9/5)C + 32 is one-to-one because:<br>
                <ul class="list-disc list-inside mt-2 space-y-1">
                    <li>Each Celsius temperature corresponds to exactly one Fahrenheit temperature</li>
                    <li>The function is linear with a positive slope (9/5 > 0)</li>
                    <li>Since it's strictly increasing, different inputs produce different outputs</li>
                    <li>This ensures unique conversion in both directions</li>
                </ul>
            </div>
        `,
        solutionSteps: `
            <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                <strong>Solution Steps:</strong><br>
                <ol class="list-decimal list-inside mt-2 space-y-1">
                    <li>Given: C = ${temp}°C</li>
                    <li>Apply conversion formula: F = (9/5) × C + 32</li>
                    <li>Substitute: F = (9/5) × ${temp} + 32</li>
                    <li>Calculate: F = ${(9/5) * temp} + 32 = ${fahrenheitRounded}°F</li>
                    <li>Verify inverse: C = (5/9)(F - 32) = (5/9)(${fahrenheitRounded} - 32) = ${inverseRounded}°C ✓</li>
                </ol>
            </div>
        `,
        practicalImplications: `
            <div class="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                <strong>Practical Implications:</strong><br>
                <ul class="list-disc list-inside mt-2 space-y-1">
                    <li>Unique temperature conversion prevents confusion in weather reports</li>
                    <li>One-to-one property enables reliable scientific measurements</li>
                    <li>Essential for cooking recipes that specify temperatures</li>
                    <li>Ensures consistency in temperature data across different systems</li>
                    <li>Critical for medical applications where precise temperature conversion is needed</li>
                </ul>
            </div>
        `
    };
}

// Solve Database Problem
function solveDatabaseProblem() {
    const studentId = document.getElementById('studentId');
    const studentName = document.getElementById('studentName');
    
    if (!studentId || !studentName) {
        throw new Error('Please enter both student ID and name.');
    }
    
    const id = studentId.value;
    const name = studentName.value;
    
    if (!id || !name) {
        throw new Error('Please enter both student ID and name.');
    }
    
    return {
        oneToOneAnalysis: `
            <strong>One-to-One Analysis:</strong><br>
            The database function f(student_id) = student_name must be one-to-one because:<br>
            • Each student ID corresponds to exactly one student name<br>
            • Prevents duplicate records and data conflicts<br>
            • Ensures data integrity and consistency<br>
            • Enables reliable student identification
        `,
        solutionSteps: `
            <strong>Solution Steps:</strong><br>
            1. Student ID: ${id}<br>
            2. Student Name: ${name}<br>
            3. Function: f(${id}) = "${name}"<br>
            4. One-to-one property ensures unique mapping
        `,
        practicalImplications: `
            <strong>Practical Implications:</strong><br>
            • Prevents duplicate student records<br>
            • Ensures accurate grade reporting<br>
            • Maintains data integrity in school systems<br>
            • Enables reliable student identification and tracking
        `
    };
}

// Solve Algorithm Problem
function solveAlgorithmProblem() {
    const inputValue = document.getElementById('inputValue');
    const algorithmType = document.getElementById('algorithmType');
    
    if (!inputValue || !algorithmType) {
        throw new Error('Please enter an input value.');
    }
    
    const value = parseInt(inputValue.value);
    const type = algorithmType.value;
    
    if (!value) {
        throw new Error('Please enter an input value.');
    }
    
    return {
        oneToOneAnalysis: `
            <strong>One-to-One Analysis:</strong><br>
            ${type} functions must be one-to-one because:<br>
            • Each input produces a unique output<br>
            • Prevents conflicts in data processing<br>
            • Ensures deterministic algorithm behavior<br>
            • Maintains data integrity and consistency
        `,
        solutionSteps: `
            <strong>Solution Steps:</strong><br>
            1. Input value: ${value}<br>
            2. Algorithm type: ${type}<br>
            3. Process: Apply ${type} function<br>
            4. Result: Unique output for input ${value}
        `,
        practicalImplications: `
            <strong>Practical Implications:</strong><br>
            • Ensures reliable data processing<br>
            • Prevents algorithm conflicts and errors<br>
            • Maintains system stability and performance<br>
            • Essential for critical computing applications
        `
    };
}

// Display Application Solution
function displayApplicationSolution(solution) {
    const oneToOneAnalysis = document.getElementById('oneToOneAnalysis');
    const solutionSteps = document.getElementById('solutionSteps');
    const practicalImplications = document.getElementById('practicalImplications');
    
    if (oneToOneAnalysis) {
        oneToOneAnalysis.innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">One-to-One Analysis:</h4>
            <div class="text-gray-700">${solution.oneToOneAnalysis}</div>
        `;
    }
    
    if (solutionSteps) {
        solutionSteps.innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Solution Steps:</h4>
            <div class="text-gray-700">${solution.solutionSteps}</div>
        `;
    }
    
    if (practicalImplications) {
        practicalImplications.innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Practical Implications:</h4>
            <div class="text-gray-700">${solution.practicalImplications}</div>
        `;
    }
}

// Utility Functions
function encryptMessage(message, shift) {
    return message.split('').map(char => {
        if (char >= 'A' && char <= 'Z') {
            return String.fromCharCode(((char.charCodeAt(0) - 65 + shift) % 26) + 65);
        }
        return char;
    }).join('');
}

// Show success message
function showSuccess(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Success!',
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
    } else {
        alert(message);
    }
}

// Show error message
function showError(message) {
    if (typeof Swal !== 'undefined') {
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
    } else {
        alert(message);
    }
}

// Export for global access
window.analyzeOneToOne = analyzeOneToOne;
window.testOneToOne = testOneToOne;
window.findInverse = findInverse;
window.updateApplicationInputs = updateApplicationInputs;
window.solveApplicationProblem = solveApplicationProblem;
window.showError = showError;
window.showSuccess = showSuccess;
