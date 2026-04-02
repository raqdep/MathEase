// Domain and Range of Rational Functions - Interactive JavaScript

// ------------------------------
// Lesson Navigation & Completion
// ------------------------------
let drrfCurrentLesson = 1;
let drrfCompletedLessons = new Set();
const drrfTotalLessons = 4;

// ------------------------------
// Quiz System - 5 questions per topic
// ------------------------------
const drrfLesson1Quiz = [
    {
        question: "What is the domain of a rational function?",
        options: [
            "All real numbers except where the denominator equals zero",
            "All positive numbers",
            "All integers",
            "All real numbers"
        ],
        correct: 0
    },
    {
        question: "For f(x) = 1/(x - 3), what is the domain?",
        options: [
            "All real numbers except x = 3",
            "All real numbers except x = -3",
            "All real numbers",
            "x > 3"
        ],
        correct: 0
    },
    {
        question: "What values must be excluded from the domain of f(x) = (x + 2)/(x² - 9)?",
        options: [
            "x = 3 and x = -3",
            "x = 2 and x = -2",
            "x = 0",
            "No values need to be excluded"
        ],
        correct: 0
    },
    {
        question: "In interval notation, how do we express 'all real numbers except x = 2'?",
        options: [
            "(-∞, 2) ∪ (2, ∞)",
            "[2, ∞)",
            "(-∞, 2]",
            "(2, ∞)"
        ],
        correct: 0
    },
    {
        question: "What happens when you try to evaluate a rational function at a value that makes the denominator zero?",
        options: [
            "The function is undefined",
            "The function equals zero",
            "The function equals one",
            "The function equals infinity"
        ],
        correct: 0
    }
];

const drrfLesson2Quiz = [
    {
        question: "What is the range of a rational function?",
        options: [
            "The set of all possible output values (y-values)",
            "The set of all input values (x-values)",
            "The set of all positive numbers",
            "The set of all integers"
        ],
        correct: 0
    },
    {
        question: "How do horizontal asymptotes affect the range?",
        options: [
            "They provide boundaries that the function approaches but may not cross",
            "They have no effect on the range",
            "They always exclude values from the range",
            "They make the range all real numbers"
        ],
        correct: 0
    },
    {
        question: "For f(x) = 1/x, what is the range?",
        options: [
            "All real numbers except y = 0",
            "All real numbers",
            "Only positive numbers",
            "Only negative numbers"
        ],
        correct: 0
    },
    {
        question: "When the degrees of numerator and denominator are equal, what happens to the range?",
        options: [
            "The range excludes the horizontal asymptote value",
            "The range is all real numbers",
            "The range is only positive numbers",
            "The range is only negative numbers"
        ],
        correct: 0
    },
    {
        question: "For f(x) = (2x + 1)/(3x - 2), what is the horizontal asymptote?",
        options: [
            "y = 2/3",
            "y = 0",
            "y = 1",
            "No horizontal asymptote"
        ],
        correct: 0
    }
];

const drrfLesson3Quiz = [
    {
        question: "What is the first step in finding the domain of a rational function?",
        options: [
            "Identify the denominator and set it equal to zero",
            "Find the numerator",
            "Graph the function",
            "Find the range first"
        ],
        correct: 0
    },
    {
        question: "To find the range, what should you determine first?",
        options: [
            "The horizontal asymptote",
            "The vertical asymptote",
            "The x-intercepts",
            "The y-intercepts"
        ],
        correct: 0
    },
    {
        question: "For f(x) = (x² - 1)/(x + 2), what is the domain?",
        options: [
            "All real numbers except x = -2",
            "All real numbers except x = 1 and x = -1",
            "All real numbers",
            "x > -2"
        ],
        correct: 0
    },
    {
        question: "What is the range of f(x) = (x² - 1)/(x + 2)?",
        options: [
            "All real numbers",
            "All real numbers except y = 0",
            "Only positive numbers",
            "Only negative numbers"
        ],
        correct: 0
    },
    {
        question: "In interval notation, how do we express 'all real numbers'?",
        options: [
            "(-∞, ∞)",
            "[0, ∞)",
            "(-∞, 0]",
            "(0, ∞)"
        ],
        correct: 0
    }
];

const drrfLesson4Quiz = [
    {
        question: "In a real-world application, why is domain analysis important?",
        options: [
            "To ensure the function makes sense in the context",
            "To make calculations easier",
            "To find the maximum value",
            "To graph the function"
        ],
        correct: 0
    },
    {
        question: "For an average cost function AC(x) = C(x)/x, what is the domain restriction?",
        options: [
            "x > 0 (production must be positive)",
            "x ≥ 0",
            "x can be any real number",
            "x must be an integer"
        ],
        correct: 0
    },
    {
        question: "In the lens equation 1/f = 1/d₀ + 1/dᵢ, what values are excluded from the domain?",
        options: [
            "Values where d₀ = f (object distance equals focal length)",
            "Values where d₀ = 0",
            "Values where f = 0",
            "No values are excluded"
        ],
        correct: 0
    },
    {
        question: "For a market share function S(a) = ka/(a + b), what is the range?",
        options: [
            "0 ≤ S(a) < k (between 0 and maximum market share)",
            "S(a) ≥ k",
            "S(a) can be any real number",
            "S(a) < 0"
        ],
        correct: 0
    },
    {
        question: "Why is range analysis important in real-world applications?",
        options: [
            "To understand the possible outcomes and limitations",
            "To make the function simpler",
            "To find the domain",
            "To solve equations"
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
            if (!drrfCanAccessTopic(lessonNum) && lessonNum !== drrfCurrentLesson) {
                drrfShowTopicLockedMessage(lessonNum);
                return;
            }
            
            const isExpanded = topic.classList.contains('expanded');
            document.querySelectorAll('.lesson-topic').forEach(t => t.classList.remove('expanded'));
            if (!isExpanded) {
                topic.classList.add('expanded');
                this.setAttribute('aria-expanded', 'true');
                drrfShowLesson(lessonNum);
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
            if (!drrfCanAccessTopic(lessonNum)) {
                drrfShowTopicLockedMessage(lessonNum);
                return;
            }
            
            // Show lesson and scroll to section
            drrfShowLesson(lessonNum, false);
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
    drrfUpdateSidebarProgress();
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

function drrfUpdateSidebarProgress() {
    for (let i = 1; i <= drrfTotalLessons; i++) {
        const topic = document.getElementById(`sidebar-topic-${i}`);
        if (!topic) continue;
        
        const dot = topic.querySelector('.lesson-topic-dot');
        const progressText = topic.querySelector('.topic-status-text');
        const accessible = drrfCanAccessTopic(i);
        const complete = drrfCompletedLessons.has(i);
        
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

function drrfCanAccessTopic(lessonNum) {
    if (lessonNum === 1) return true;
    return drrfCompletedLessons.has(lessonNum - 1);
}

function drrfShowTopicLockedMessage(lessonNum) {
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
function drrfShuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function drrfShuffleQuiz(quizArray) {
    const shuffled = drrfShuffleArray(quizArray);
    return shuffled.map(quiz => {
        const options = [...quiz.options];
        const correctIndex = quiz.correct;
        const correctAnswer = options[correctIndex];
        
        const shuffledOptions = drrfShuffleArray(options);
        const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);
        
        return {
            ...quiz,
            options: shuffledOptions,
            correct: newCorrectIndex
        };
    });
}

function drrfGenerateExplanation(quiz, selectedAnswer) {
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
    
    if (question.includes('domain')) {
        explanation += 'HOW TO SOLVE:\nThe domain of a rational function excludes values that make the denominator zero. Set the denominator equal to zero and solve for x. Those values are NOT in the domain.';
    } else if (question.includes('range')) {
        explanation += 'HOW TO SOLVE:\nThe range of a rational function depends on horizontal asymptotes and any restrictions. Analyze the function behavior as x approaches ±∞ and near vertical asymptotes.';
    } else if (question.includes('asymptote')) {
        explanation += 'HOW TO SOLVE:\nVertical asymptotes occur where the denominator equals zero (and numerator doesn\'t). Horizontal asymptotes depend on the degrees of numerator and denominator polynomials.';
    } else if (question.includes('rational function')) {
        explanation += 'HOW TO SOLVE:\nA rational function is a fraction of polynomials. Key concepts: domain (denominator ≠ 0), vertical asymptotes (zeros of denominator), horizontal asymptotes (degree comparison).';
    } else {
        explanation += 'HOW TO SOLVE:\n1. Read the question carefully\n2. Identify what concept is being tested\n3. Apply the relevant rules or formulas\n4. Check your answer makes sense';
    }
    return explanation;
}

async function drrfRunLessonQuiz(lessonNum) {
    const quizArray = [
        drrfLesson1Quiz,
        drrfLesson2Quiz,
        drrfLesson3Quiz,
        drrfLesson4Quiz
    ][lessonNum - 1];
    
    if (!quizArray) return false;
    
    // Track quiz start time
    window.drrfQuizStartTime = Date.now();
    
    // Shuffle quiz questions and options
    const shuffledQuiz = drrfShuffleQuiz(quizArray);
    
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
    });
    
    if (!introResult.isConfirmed) {
        return false;
    }
    
    window.drrfQuizStartTime = Date.now();
    
    return new Promise((resolve) => {
        window.drrfQuizResolve = resolve;
        
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
                            explanation = drrfGenerateExplanation(currentQuiz, selectedAnswer);
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
                                drrfShowLesson(lessonNum, true);
                                if (window.drrfQuizResolve) {
                                    window.drrfQuizResolve(false);
                                    window.drrfQuizResolve = null;
                                }
                            } else {
                                displayQuestion();
                            }
                        });
                    } else {
                        drrfShowLesson(lessonNum, true);
                        if (window.drrfQuizResolve) {
                            window.drrfQuizResolve(false);
                            window.drrfQuizResolve = null;
                        }
                    }
                }
            });
        }
        
        function showQuizResults() {
            const percentage = Math.round((score / shuffledQuiz.length) * 100);
            const passed = score >= 3;
            
            // Calculate time taken
            const timeTaken = window.drrfQuizStartTime ? Math.floor((Date.now() - window.drrfQuizStartTime) / 1000) : 0;
            
            // Store quiz data
            drrfStoreQuizData(lessonNum, score, shuffledQuiz.length, userAnswers, timeTaken);
            
            Swal.fire({
                title: passed ? '🎉 Great Job!' : '📚 Keep Learning',
                html: `
                    <div class="text-center">
                        <div class="text-4xl font-bold mb-4 ${passed ? 'text-green-600' : 'text-orange-600'}">
                            ${score}/${shuffledQuiz.length} (${percentage}%)
                        </div>
                        ${passed ? 
                            '<p class="text-lg text-gray-700 mb-4">You passed! You can now proceed to the next topic.</p>' :
                            '<p class="text-lg text-gray-700 mb-4">You need at least 3 correct answers to pass. Review the topic and try again!</p>'
                        }
                    </div>
                `,
                icon: passed ? 'success' : 'info',
                confirmButtonText: passed ? 'Continue' : 'Review Topic',
                confirmButtonColor: passed ? '#10b981' : '#667eea'
            }).then(async () => {
                if (passed) {
                    // IMPORTANT: Save final study time BEFORE marking as completed
                    // This ensures drrfSaveStudyTimeForCurrentLesson() doesn't skip saving
                    drrfSaveStudyTimeForCurrentLesson();
                    
                    // Wait a moment for the save to complete
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    // Complete lesson and stop timer (this will save final time again and mark as complete)
                    await drrfCompleteLesson(lessonNum);
                    
                    // Mark as completed AFTER saving time
                    drrfCompletedLessons.add(lessonNum);
                    drrfUpdateSidebarProgress();
                    
                    // Reload study time to ensure we have the latest saved time from server
                    await drrfLoadAndDisplayStudyTime();
                    
                    // Update timer display with the loaded time
                    drrfUpdateLiveTimer();
                    
                    // Hide Topic 4 quiz button if this is Topic 4
                    if (lessonNum === 4) {
                        const topic4QuizButton = document.getElementById('topic4QuizButton');
                        if (topic4QuizButton) {
                            topic4QuizButton.style.display = 'none';
                        }
                    }
                    
                    // Check if all lessons are completed and show performance analysis section
                    if (drrfCompletedLessons.size === drrfTotalLessons) {
                        drrfShowPerformanceAnalysisSection();
                    }
                }
                if (window.drrfQuizResolve) {
                    window.drrfQuizResolve(passed);
                    window.drrfQuizResolve = null;
                }
            });
        }
        
        displayQuestion();
    });
}

async function drrfStoreQuizData(lessonNum, score, total, userAnswers, timeTaken = 0) {
    try {
        const response = await fetch('../php/store-quiz-data.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic: 'domain-range-rational-functions',
                lesson: lessonNum,
                score: score,
                total: total,
                user_answers: userAnswers,
                time_taken_seconds: timeTaken
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

// Show Topic 4 Quiz
function drrfShowTopic4Quiz() {
    if (drrfCompletedLessons.has(4)) {
        Swal.fire({
            title: 'Already Completed',
            text: 'You have already completed Topic 4 quiz.',
            icon: 'info',
            confirmButtonText: 'OK'
        });
        return;
    }
    drrfRunLessonQuiz(4);
}

// ------------------------------
// Timer Functions
// ------------------------------
// ------------------------------
// Timer Functions (matching functions.html)
// ------------------------------
let drrfLessonStartTime = {};
let drrfTotalStudyTime = {}; // Track total time per lesson in seconds
let drrfLastSavedTime = {}; // Track last confirmed saved time from server (to prevent double counting)
let drrfLastSaveTimestamp = {}; // Track when we last saved (to calculate elapsed correctly)
let drrfStudyTimeInterval = null;
let drrfTimerUpdateInterval = null; // For live timer display

function drrfStartLiveTimer() {
    // Clear existing timer
    if (drrfTimerUpdateInterval) {
        clearInterval(drrfTimerUpdateInterval);
    }
    
    // Don't start timer if lesson is already completed
    if (drrfCompletedLessons.has(drrfCurrentLesson)) {
        drrfUpdateLiveTimer(); // Just show final time
        return;
    }
    
    // Update timer immediately
    drrfUpdateLiveTimer();
    
    // Update timer every second
    drrfTimerUpdateInterval = setInterval(function() {
        // Stop if lesson becomes completed
        if (drrfCompletedLessons.has(drrfCurrentLesson)) {
            clearInterval(drrfTimerUpdateInterval);
            drrfTimerUpdateInterval = null;
            drrfUpdateLiveTimer(); // Show final time
            return;
        }
        drrfUpdateLiveTimer();
    }, 1000);
}

function drrfUpdateLiveTimer() {
    if (!drrfCurrentLesson) return;
    
    const section = document.getElementById(`lesson${drrfCurrentLesson}`);
    if (!section) return;
    
    // Ensure timer container is visible
    const timerContainer = section.querySelector('.flex-shrink-0.ml-6');
    if (timerContainer) {
        timerContainer.classList.remove('hidden');
        timerContainer.style.display = 'flex';
        timerContainer.style.visibility = 'visible';
    }
    
    const timerDisplay = section.querySelector('.lesson-timer-display');
    if (!timerDisplay) return;
    
    // Don't update timer if lesson is already completed
    if (drrfCompletedLessons.has(drrfCurrentLesson)) {
        // Show final time for completed lesson
        let finalTime = drrfTotalStudyTime[drrfCurrentLesson] || drrfLastSavedTime[drrfCurrentLesson] || 0;
        
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
    const baseTime = drrfLastSavedTime[drrfCurrentLesson] || 0;
    
    let currentSessionElapsed = 0;
    const saveStartTime = drrfLastSaveTimestamp[drrfCurrentLesson] || drrfLessonStartTime[drrfCurrentLesson];
    if (saveStartTime) {
        const now = Date.now();
        const elapsedMs = now - saveStartTime;
        currentSessionElapsed = Math.floor(elapsedMs / 1000);
        
        if (currentSessionElapsed > 7200) {
            console.warn(`Session elapsed time too large (${currentSessionElapsed}s) for lesson ${drrfCurrentLesson}, resetting start time`);
            drrfLessonStartTime[drrfCurrentLesson] = now;
            drrfLastSaveTimestamp[drrfCurrentLesson] = now;
            currentSessionElapsed = 0;
        }
        
        if (currentSessionElapsed < 0) {
            console.warn(`Negative elapsed time detected for lesson ${drrfCurrentLesson}, resetting start time`);
            drrfLessonStartTime[drrfCurrentLesson] = now;
            drrfLastSaveTimestamp[drrfCurrentLesson] = now;
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

function drrfSaveStudyTimeForCurrentLesson() {
    if (!drrfCurrentLesson) return;
    
    // CRITICAL: Never save time for completed lessons
    if (drrfCompletedLessons.has(drrfCurrentLesson)) {
        console.log(`Lesson ${drrfCurrentLesson} is completed, skipping timer save`);
        return;
    }
    
    const saveStartTime = drrfLastSaveTimestamp[drrfCurrentLesson] || drrfLessonStartTime[drrfCurrentLesson];
    if (!saveStartTime) return;
    
    const now = Date.now();
    const elapsed = Math.floor((now - saveStartTime) / 1000);
    
    if (elapsed > 0 && elapsed < 7200) {
        const baseTime = drrfLastSavedTime[drrfCurrentLesson] || 0;
        const newTotalTime = baseTime + elapsed;
        
        drrfTotalStudyTime[drrfCurrentLesson] = newTotalTime;
        drrfLastSavedTime[drrfCurrentLesson] = newTotalTime;
        drrfLastSaveTimestamp[drrfCurrentLesson] = now;
        drrfLessonStartTime[drrfCurrentLesson] = now;
        
        drrfSendStudyTimeToServer();
    } else if (elapsed >= 7200) {
        drrfLessonStartTime[drrfCurrentLesson] = now;
        drrfLastSaveTimestamp[drrfCurrentLesson] = now;
    }
}

function drrfSendStudyTimeToServer() {
    if (!drrfCurrentLesson) return;
    
    const studyTimeData = {};
    if (!drrfCompletedLessons.has(drrfCurrentLesson) && drrfTotalStudyTime[drrfCurrentLesson] && drrfTotalStudyTime[drrfCurrentLesson] > 0) {
        studyTimeData[drrfCurrentLesson] = drrfTotalStudyTime[drrfCurrentLesson];
    }
    
    if (Object.keys(studyTimeData).length === 0) return;
    
    fetch('../php/store-study-time.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            topic: 'domain-range-rational-functions',
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
                drrfLastSavedTime[lessonNum] = drrfTotalStudyTime[lessonNum];
                drrfLastSaveTimestamp[lessonNum] = Date.now();
            });
        }
    })
    .catch(error => {
        console.error('Error saving study time:', error);
    });
}

async function drrfLoadAndDisplayStudyTime() {
    // Load study time for all lessons (not just current) to ensure consistency
    try {
        const response = await fetch(`../php/get-study-time.php?topic=domain-range-rational-functions`, {
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
                        drrfTotalStudyTime[lessonNum] = seconds;
                        drrfLastSavedTime[lessonNum] = seconds;
                        const now = Date.now();
                        drrfLastSaveTimestamp[lessonNum] = now;
                        
                        // For completed lessons, don't update lessonStartTime
                        if (!drrfCompletedLessons.has(lessonNum)) {
                            if (!drrfLessonStartTime[lessonNum]) {
                                drrfLessonStartTime[lessonNum] = now;
                            }
                        }
                    }
                }
                
                // Update timer display for current lesson
                if (drrfCurrentLesson) {
                    // Ensure timer container is visible for current lesson
                    const section = document.getElementById(`lesson${drrfCurrentLesson}`);
                    if (section) {
                        const timerContainer = section.querySelector('.flex-shrink-0.ml-6');
                        if (timerContainer) {
                            timerContainer.classList.remove('hidden');
                            timerContainer.style.display = 'flex';
                            timerContainer.style.visibility = 'visible';
                        }
                    }
                    
                    drrfUpdateLiveTimer();
                }
            }
        }
    } catch (e) {
        console.error('Error loading study time:', e);
    }
}

// ------------------------------
// Performance Analysis (Custom AI - matching functions.html)
// ------------------------------
function drrfShowPerformanceAnalysisSection() {
    // Check if all 4 topics are completed
    if (drrfCompletedLessons.size !== drrfTotalLessons) {
        console.log('Performance analysis will only show after completing all quizzes. Current completed:', drrfCompletedLessons.size, '/', drrfTotalLessons);
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

async function drrfAnalyzePerformance() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultSection = document.getElementById('analysisResult');
    
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
    }
    
    try {
        const response = await fetch(`../php/analyze-quiz-performance.php?topic=domain-range-rational-functions`, {
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
            drrfDisplayPerformanceAnalysis(result.analysis);
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

function drrfDisplayPerformanceAnalysis(analysis) {
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

function drrfGetTopicNameForAnalysis() {
    return 'domain-range-rational-functions';
}

// ------------------------------
// User Dropdown Functions
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

function loadProfilePicture() {
    fetch('../php/user.php', { credentials: 'include', cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.user) {
                const userName = `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim() || 'Student';
                document.querySelectorAll('#userName, #userNameDropdown, #userNameMobile').forEach(el => {
                    if (el) el.textContent = userName;
                });
                const profileImages = document.querySelectorAll('#userProfileImage, #userProfileImageDropdown, #userProfileImageMobile');
                const profileIcons = document.querySelectorAll('#userProfileIcon, #userProfileIconDropdown, #userProfileIconMobile');
                if (data.user.profile_picture) {
                    const path = `../${data.user.profile_picture}?t=${Date.now()}`;
                    profileImages.forEach(img => {
                        if (img) { img.src = path; img.classList.remove('hidden'); }
                    });
                    profileIcons.forEach(icon => { if (icon) icon.style.display = 'none'; });
                } else {
                    profileImages.forEach(img => { if (img) { img.src = ''; img.classList.add('hidden'); } });
                    profileIcons.forEach(icon => { if (icon) icon.style.display = 'block'; });
                }
            }
        })
        .catch(err => console.error('Error loading profile:', err));
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown && !dropdown.contains(event.target)) {
        const menu = document.getElementById('userDropdownMenu');
        if (menu) menu.classList.add('hidden');
    }
});

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize sidebar navigation
    initializeSidebar();
    
    // Load profile picture
    loadProfilePicture();
    
    // Load completion state from server
    await drrfLoadCompletedLessons();
    
    // Start study time interval (save every 30 seconds)
    drrfStudyTimeInterval = setInterval(() => {
        if (drrfCurrentLesson && !drrfCompletedLessons.has(drrfCurrentLesson)) {
            drrfSaveStudyTimeForCurrentLesson();
        }
    }, 30000);
    
    // Load and display study time for current lesson
    await drrfLoadAndDisplayStudyTime();
    
    // Initialize first lesson
    await drrfShowLesson(1, false);
    
    // Initialize authentication guard and user progress
    initializeAuthGuard();
    loadUserProgress();

    // Initialize interactive tools
    try { initializeCalculators(); } catch (_) {}
    
    // Add visibility change listener to handle tab switching
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Page is hidden, save current time
            if (drrfCurrentLesson && !drrfCompletedLessons.has(drrfCurrentLesson)) {
                drrfSaveStudyTimeForCurrentLesson();
            }
        } else {
            // Page is visible again, reload time and restart timer
            if (drrfCurrentLesson && !drrfCompletedLessons.has(drrfCurrentLesson)) {
                const now = Date.now();
                if (!drrfLastSaveTimestamp[drrfCurrentLesson]) {
                    drrfLastSaveTimestamp[drrfCurrentLesson] = now;
                }
                if (!drrfLessonStartTime[drrfCurrentLesson]) {
                    drrfLessonStartTime[drrfCurrentLesson] = now;
                }
                drrfLoadAndDisplayStudyTime().then(() => {
                    drrfStartLiveTimer();
                });
            } else if (drrfCurrentLesson && drrfCompletedLessons.has(drrfCurrentLesson)) {
                // Just show final time for completed lessons
                drrfUpdateLiveTimer();
            }
        }
    });
    
    // Save time before page unload
    window.addEventListener('beforeunload', function() {
        if (drrfCurrentLesson && !drrfCompletedLessons.has(drrfCurrentLesson)) {
            drrfSaveStudyTimeForCurrentLesson();
            // Use sendBeacon for more reliable sending on page unload
            const studyTimeData = {};
            if (drrfTotalStudyTime[drrfCurrentLesson] && drrfTotalStudyTime[drrfCurrentLesson] > 0) {
                studyTimeData[drrfCurrentLesson] = drrfTotalStudyTime[drrfCurrentLesson];
            }
            if (Object.keys(studyTimeData).length > 0) {
                navigator.sendBeacon('../php/store-study-time.php', JSON.stringify({
                    topic: 'domain-range-rational-functions',
                    study_time: studyTimeData
                }));
            }
        }
    });
    
    // Handle window focus/blur
    window.addEventListener('focus', function() {
        if (drrfCurrentLesson && !drrfCompletedLessons.has(drrfCurrentLesson)) {
            const now = Date.now();
            if (!drrfLastSaveTimestamp[drrfCurrentLesson]) {
                drrfLastSaveTimestamp[drrfCurrentLesson] = now;
            }
            drrfStartLiveTimer();
        }
    });
    
    window.addEventListener('blur', function() {
        if (drrfCurrentLesson && !drrfCompletedLessons.has(drrfCurrentLesson)) {
            drrfSaveStudyTimeForCurrentLesson();
        }
    });
});

// Navigation buttons are already in HTML, just need to update them
function drrfUpdateNavigationButtons() {
    // Update all navigation button sets in each lesson
    for (let i = 1; i <= drrfTotalLessons; i++) {
        const lessonSection = document.getElementById(`lesson${i}`);
        if (!lessonSection) continue;
        
        // Find prev button
        const prevBtn = lessonSection.querySelector('button[onclick*="drrfNavigateLesson(-1)"]');
        if (prevBtn) {
            prevBtn.disabled = drrfCurrentLesson === 1;
        }
        
        // Find next button
        const nextBtn = lessonSection.querySelector('button[onclick*="drrfNavigateLesson(1)"]');
        if (nextBtn) {
            nextBtn.disabled = drrfCurrentLesson === drrfTotalLessons;
        }
    }
}

function drrfNavigateLesson(direction) {
    const newLesson = drrfCurrentLesson + direction;
    if (newLesson < 1 || newLesson > drrfTotalLessons) return;
    
    // Check if current lesson's quiz has been passed
    if (direction > 0 && !drrfCompletedLessons.has(drrfCurrentLesson)) {
        // Trigger quiz for current lesson
        drrfRunLessonQuiz(drrfCurrentLesson).then(passed => {
            if (passed) {
                drrfShowLesson(newLesson, true);
            }
        });
        return;
    }
    
    // Check if target lesson is accessible
    if (!drrfCanAccessTopic(newLesson)) {
        drrfShowTopicLockedMessage(newLesson);
        return;
    }
    
    drrfShowLesson(newLesson, true);
}

async function drrfShowLesson(lessonNum, scrollToTop = false) {
    // Check if lesson is accessible
    if (!drrfCanAccessTopic(lessonNum)) {
        drrfShowTopicLockedMessage(lessonNum);
        return;
    }
    
    // Save time for previous lesson before switching
    if (drrfCurrentLesson && !drrfCompletedLessons.has(drrfCurrentLesson)) {
        drrfSaveStudyTimeForCurrentLesson();
    }
    
    // Update current lesson
    drrfCurrentLesson = lessonNum;
    
    // Hide all lesson sections
    const lessonSections = document.querySelectorAll('.lesson-section');
    lessonSections.forEach(s => s.classList.remove('active'));
    
    // Show selected lesson
    const activeSection = document.getElementById(`lesson${lessonNum}`);
    if (activeSection) {
        activeSection.classList.add('active');
        
        // Ensure timer container is visible
        const timerContainer = activeSection.querySelector('.flex-shrink-0.ml-6');
        if (timerContainer) {
            timerContainer.classList.remove('hidden');
            timerContainer.style.display = 'flex';
            timerContainer.style.visibility = 'visible';
        }
    }
    
    // Start tracking for new lesson - only if not completed
    if (!drrfCompletedLessons.has(lessonNum)) {
        if (!drrfLessonStartTime[lessonNum]) {
            drrfLessonStartTime[lessonNum] = Date.now();
        }
        // Ensure lastSavedTime and lastSaveTimestamp are initialized
        if (drrfLastSavedTime[lessonNum] === undefined) {
            drrfLastSavedTime[lessonNum] = drrfTotalStudyTime[lessonNum] || 0;
        }
        if (!drrfLastSaveTimestamp[lessonNum]) {
            drrfLastSaveTimestamp[lessonNum] = Date.now();
        }
    } else {
        // If lesson is completed, clear start time to prevent timer from running
        drrfLessonStartTime[lessonNum] = null;
        if (drrfTimerUpdateInterval) {
            clearInterval(drrfTimerUpdateInterval);
            drrfTimerUpdateInterval = null;
        }
    }
    
    // Load and display study time for this lesson
    await drrfLoadAndDisplayStudyTime();
    
    // Start/restart live timer display (will show final time if completed, but won't update)
    drrfStartLiveTimer();
    
    // Ensure timer is updated after loading
    drrfUpdateLiveTimer();
    
    // Show/hide Topic 4 quiz button
    const topic4QuizButton = document.getElementById('topic4QuizButton');
    if (topic4QuizButton) {
        if (lessonNum === 4 && !drrfCompletedLessons.has(4)) {
            topic4QuizButton.style.display = 'block';
        } else {
            topic4QuizButton.style.display = 'none';
        }
    }
    
    // Update UI
    drrfUpdateNavigationButtons();
    drrfUpdateProgressIndicators();
    drrfUpdateLessonCompletionStatus();
    drrfUpdateSidebarProgress();
    setSidebarActive(lessonNum, 'objective');
    
    if (scrollToTop) {
        const lessonMain = document.querySelector('.lesson-main');
        if (lessonMain) lessonMain.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function updateAIAnalysisVisibility() {
    const aiSection = document.getElementById('aiAnalysisSection');
    if (aiSection) {
        // Only show if all lessons are completed AND we're on Topic 4
        if (drrfCompletedLessons.size === drrfTotalLessons && drrfCurrentLesson === drrfTotalLessons) {
            aiSection.classList.remove('hidden');
        } else {
            aiSection.classList.add('hidden');
        }
    }
}

function drrfUpdateNavigationButtons() {
    const prev = document.querySelector('[data-drrf-prev]');
    const next = document.querySelector('[data-drrf-next]');
    if (prev) prev.disabled = drrfCurrentLesson === 1;
    if (next) next.disabled = drrfCurrentLesson === drrfTotalLessons;
}

function drrfUpdateProgressIndicators() {
    const numEls = document.querySelectorAll('#drrfCurrentLessonNum');
    numEls.forEach(el => el.textContent = String(drrfCurrentLesson));
    const bars = document.querySelectorAll('#drrfLessonProgressBar');
    bars.forEach(bar => bar.style.width = `${(drrfCurrentLesson / drrfTotalLessons) * 100}%`);
}

function drrfUpdateLessonCompletionStatus() {
    const navBtns = document.querySelectorAll('.lesson-nav-btn');
    navBtns.forEach(btn => {
        const lesson = parseInt(btn.getAttribute('data-lesson') || '0', 10);
        btn.classList.toggle('completed', drrfCompletedLessons.has(lesson));
        const icon = btn.querySelector('.w-16');
        if (icon && drrfCompletedLessons.has(lesson)) {
            icon.classList.add('bg-green-500', 'text-white');
            icon.classList.remove('bg-gray-300', 'text-gray-600');
        }
    });
    drrfUpdateCompletionButtonsUI();
}

function drrfGetCompleteButtonForLesson(lessonNum) {
    const section = document.getElementById(`lesson${lessonNum}`);
    if (!section) return null;
    return section.querySelector(`[data-drrf-complete-btn="${lessonNum}"]`);
}

function drrfSetCompleteButtonState(lessonNum, { completed = false, loading = false } = {}) {
    const btn = drrfGetCompleteButtonForLesson(lessonNum);
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

function drrfUpdateCompletionButtonsUI() {
    for (let i = 1; i <= drrfTotalLessons; i++) {
        drrfSetCompleteButtonState(i, { completed: drrfCompletedLessons.has(i) });
    }
}

async function drrfCompleteLesson(lessonNum) {
    try {
        let savedFinalTime = 0; // Store the final time for use in setTimeout callbacks
        
        // Save final study time before marking as complete
        if (lessonNum === drrfCurrentLesson && !drrfCompletedLessons.has(lessonNum)) {
            // Save current accumulated time first
            drrfSaveStudyTimeForCurrentLesson();
            
            // Wait a bit for the save to update local variables
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Calculate final time - use the most recent saved time
            const baseTime = drrfLastSavedTime[lessonNum] || drrfTotalStudyTime[lessonNum] || 0;
            const saveStartTime = drrfLastSaveTimestamp[lessonNum] || drrfLessonStartTime[lessonNum];
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
            
            // If still 0, try to get from current session time
            if (finalTime === 0 && drrfLessonStartTime[lessonNum]) {
                const now = Date.now();
                const sessionElapsed = Math.floor((now - drrfLessonStartTime[lessonNum]) / 1000);
                if (sessionElapsed > 0 && sessionElapsed < 7200) {
                    finalTime = sessionElapsed;
                }
            }
            
            // Always save the final time (even if 0, to ensure consistency)
            const timeToSave = finalTime > 0 ? finalTime : (drrfLastSavedTime[lessonNum] || drrfTotalStudyTime[lessonNum] || 0);
            savedFinalTime = timeToSave;
            
            if (timeToSave > 0) {
                const saveResponse = await fetch('../php/store-study-time.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topic: 'domain-range-rational-functions',
                        study_time: { [lessonNum]: timeToSave },
                        is_final: true
                    }),
                    credentials: 'include'
                });
                
                const saveData = await saveResponse.json();
                if (saveData.success) {
                    drrfTotalStudyTime[lessonNum] = timeToSave;
                    drrfLastSavedTime[lessonNum] = timeToSave;
                    drrfLastSaveTimestamp[lessonNum] = Date.now();
                }
            } else {
                // If timeToSave is still 0, use whatever we have locally
                const lastSaved = drrfLastSavedTime[lessonNum] || drrfTotalStudyTime[lessonNum] || 0;
                if (lastSaved > 0) {
                    drrfTotalStudyTime[lessonNum] = lastSaved;
                    drrfLastSavedTime[lessonNum] = lastSaved;
                    savedFinalTime = lastSaved;
                }
            }
            
            // Stop timer intervals
            if (drrfTimerUpdateInterval) {
                clearInterval(drrfTimerUpdateInterval);
                drrfTimerUpdateInterval = null;
            }
            if (drrfStudyTimeInterval) {
                clearInterval(drrfStudyTimeInterval);
                drrfStudyTimeInterval = null;
            }
            
            // Clear start time
            drrfLessonStartTime[lessonNum] = null;
            
            // Update timer display to show final time (green)
            drrfUpdateLiveTimer();
            
            // Ensure timer container is visible
            const section = document.getElementById(`lesson${lessonNum}`);
            if (section) {
                const timerContainer = section.querySelector('.flex-shrink-0.ml-6');
                if (timerContainer) {
                    timerContainer.classList.remove('hidden');
                    timerContainer.style.display = 'flex';
                    timerContainer.style.visibility = 'visible';
                }
            }
            
            // Reload study time after a short delay to ensure server has saved it
            setTimeout(async () => {
                await drrfLoadAndDisplayStudyTime();
                
                // Ensure we have a valid time displayed
                const currentTime = drrfTotalStudyTime[lessonNum] || drrfLastSavedTime[lessonNum] || 0;
                
                if (currentTime === 0 && savedFinalTime > 0) {
                    // Use the saved time as fallback
                    drrfTotalStudyTime[lessonNum] = savedFinalTime;
                    drrfLastSavedTime[lessonNum] = savedFinalTime;
                }
                
                drrfUpdateLiveTimer();
                
                // If still 0 after reload, try one more time
                const retryTime = drrfTotalStudyTime[lessonNum] || drrfLastSavedTime[lessonNum] || 0;
                if (retryTime === 0 && savedFinalTime > 0) {
                    setTimeout(async () => {
                        await drrfLoadAndDisplayStudyTime();
                        const finalRetryTime = drrfTotalStudyTime[lessonNum] || drrfLastSavedTime[lessonNum] || 0;
                        if (finalRetryTime === 0 && savedFinalTime > 0) {
                            drrfTotalStudyTime[lessonNum] = savedFinalTime;
                            drrfLastSavedTime[lessonNum] = savedFinalTime;
                        }
                        drrfUpdateLiveTimer();
                    }, 1000);
                }
            }, 800);
        }
        
        console.log('Attempting to complete lesson:', lessonNum);
        
        if (drrfCompletedLessons.has(lessonNum)) { 
            drrfSetCompleteButtonState(lessonNum, { completed: true }); 
            return true; 
        }
        
        drrfSetCompleteButtonState(lessonNum, { loading: true });
        
        const requestData = {
            topic: 'domain-range-rational-functions',
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
                        <p><strong>Topic:</strong> Domain and Range of Rational Functions</p>
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
            
            drrfSetCompleteButtonState(lessonNum, { completed: false });
            return false;
        }
        
        if (data && data.success) {
            await drrfLoadCompletedLessons();
            
            // Reload study time after completion to ensure we have the latest saved time
            await drrfLoadAndDisplayStudyTime();
            
            // Update timer display with the loaded time
            drrfUpdateLiveTimer();
            
            drrfSetCompleteButtonState(lessonNum, { completed: true });
            drrfUpdateLessonCompletionStatus();
            
            // Show success modal
            await Swal.fire({
                icon: 'success',
                title: 'Lesson Completed!',
                html: `
                    <div class="text-center">
                        <p class="text-lg mb-4">Great job completing <strong>Lesson ${lessonNum}</strong>!</p>
                        <p class="text-gray-600 mb-4">You're making excellent progress in Domain and Range of Rational Functions.</p>
                        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <p class="text-green-800 font-semibold">Progress Update:</p>
                            <p class="text-green-700">${drrfCompletedLessons.size} of ${drrfTotalLessons} lessons completed</p>
                        </div>
                        ${drrfCompletedLessons.size === drrfTotalLessons ? 
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
            
            return true;
        } else {
            drrfSetCompleteButtonState(lessonNum, { completed: false });
            
            await Swal.fire({
                icon: 'error',
                title: 'Failed to Complete Lesson',
                html: `
                    <div class="text-left">
                        <p><strong>Error:</strong> ${data && data.message ? data.message : 'Unknown error occurred'}</p>
                        <p><strong>Lesson:</strong> ${lessonNum}</p>
                        <p><strong>Topic:</strong> Domain and Range of Rational Functions</p>
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
            
            return false;
        }
    } catch (e) {
        console.error('Error completing lesson:', e);
        drrfSetCompleteButtonState(lessonNum, { completed: false });
        
        await Swal.fire({
            icon: 'error',
            title: 'Network Error',
            html: `
                <div class="text-left">
                    <p><strong>Error:</strong> ${e.message}</p>
                    <p><strong>Lesson:</strong> ${lessonNum}</p>
                    <p><strong>Topic:</strong> Domain and Range of Rational Functions</p>
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
        
        return false;
    }
}

async function drrfLoadCompletedLessons() {
    try {
        console.log('Loading completed lessons for Domain and Range of Rational Functions...');
        
        const requestData = {
            action: 'get_completed',
            topic: 'domain-range-rational-functions'
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
            drrfCompletedLessons = new Set(list);
            
            // Load study time for all lessons (including completed ones)
            try {
                const timeRes = await fetch(`../php/get-study-time.php?topic=domain-range-rational-functions`, {
                    credentials: 'include'
                });
                if (timeRes.ok) {
                    const timeData = await timeRes.json();
                    if (timeData.success && timeData.study_time) {
                        for (const lesson in timeData.study_time) {
                            const lessonNum = parseInt(lesson);
                            const seconds = parseInt(timeData.study_time[lesson]);
                            
                            if (!isNaN(seconds) && seconds >= 0) {
                                drrfTotalStudyTime[lessonNum] = seconds;
                                drrfLastSavedTime[lessonNum] = seconds;
                                drrfLastSaveTimestamp[lessonNum] = Date.now();
                            }
                        }
                        
                        // Update timer display if we're viewing a completed lesson
                        if (drrfCurrentLesson && drrfCompletedLessons.has(drrfCurrentLesson)) {
                            drrfUpdateLiveTimer();
                        }
                    }
                }
            } catch (e) {
                console.error('Error loading study time:', e);
            }
            
            drrfUpdateLessonCompletionStatus();
            drrfUpdateSidebarProgress();
            
            // Hide Topic 4 quiz button if Topic 4 is completed
            if (drrfCompletedLessons.has(4)) {
                const topic4QuizButton = document.getElementById('topic4QuizButton');
                if (topic4QuizButton) {
                    topic4QuizButton.style.display = 'none';
                }
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
            
            const topicKey = 'domain-range-rational-functions';
            const count = (data2 && data2.topics && data2.topics[topicKey] && data2.topics[topicKey].lessons_completed) || 0;
            const approx = Array.from({ length: Math.max(0, Math.min(count, drrfTotalLessons)) }, (_, i) => i + 1);
            drrfCompletedLessons = new Set(approx);
            drrfUpdateLessonCompletionStatus();
            drrfUpdateSidebarProgress();
            updateAIAnalysisVisibility();
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

// Interactive Range Analyzer Functions
function initializeInteractiveRangeAnalyzer() {
    // Add click handlers for example buttons
    const exampleButtons = document.querySelectorAll('[onclick^="drrfSetRangeExample"]');
    exampleButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            exampleButtons.forEach(btn => btn.classList.remove('ring-2', 'ring-green-500'));
            // Add active class to clicked button
            this.classList.add('ring-2', 'ring-green-500');
        });
    });
}

// Set Range Example
function drrfSetRangeExample(functionInput) {
    try {
        // Add loading animation
        const displays = ['rangeFunctionDisplay', 'horizontalAsymptote', 'rangeNotation', 'rangeExplanation'];
        displays.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.opacity = '0.5';
                el.style.transform = 'scale(0.95)';
            }
        });

        setTimeout(() => {
            // Display the function with animation
            document.getElementById('rangeFunctionDisplay').innerHTML = `
                <div class="flex items-center mb-3">
                    <div class="bg-green-500 rounded-full p-2 mr-3">
                        <i class="fas fa-function text-white text-sm"></i>
                    </div>
                    <h4 class="font-bold text-gray-800 text-lg">Selected Function:</h4>
                </div>
                <div class="text-xl font-mono text-green-900 font-bold bg-white rounded-lg p-3 text-center animate-pulse-once">f(x) = ${functionInput}</div>
            `;
            
            // Analyze horizontal asymptote
            const horizontalAsymptote = drrfAnalyzeHorizontalAsymptote(functionInput);
            document.getElementById('horizontalAsymptote').innerHTML = `
                <div class="flex items-center mb-3">
                    <div class="bg-blue-500 rounded-full p-2 mr-3">
                        <i class="fas fa-arrows-alt-h text-white text-sm"></i>
                    </div>
                    <h4 class="font-bold text-gray-800 text-lg">Horizontal Asymptote:</h4>
                </div>
                <div class="text-gray-800 bg-white rounded-lg p-3 font-semibold text-lg">${horizontalAsymptote}</div>
            `;
            
            // Analyze range
            const rangeAnalysis = drrfAnalyzeRangeRestrictions(functionInput);
            document.getElementById('rangeNotation').innerHTML = `
                <div class="flex items-center mb-3">
                    <div class="bg-teal-500 rounded-full p-2 mr-3">
                        <i class="fas fa-brackets-curly text-white text-sm"></i>
                    </div>
                    <h4 class="font-bold text-gray-800 text-lg">Range in Interval Notation:</h4>
                </div>
                <div class="text-gray-800 font-mono bg-white rounded-lg p-3 text-center font-bold text-lg text-teal-700">${rangeAnalysis.intervalNotation}</div>
            `;
            
            // Display step-by-step explanation
            document.getElementById('rangeExplanation').innerHTML = `
                <div class="flex items-center mb-3">
                    <div class="bg-purple-500 rounded-full p-2 mr-3">
                        <i class="fas fa-list-ol text-white text-sm"></i>
                    </div>
                    <h4 class="font-bold text-gray-800 text-lg">Step-by-Step Explanation:</h4>
                </div>
                <div class="text-gray-800 bg-white rounded-lg p-4">${rangeAnalysis.explanation}</div>
            `;

            // Restore opacity and add animation
            displays.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.opacity = '1';
                    el.style.transform = 'scale(1)';
                    el.style.transition = 'all 0.3s ease';
                }
            });
        }, 150);
        
    } catch (error) {
        console.error('Error analyzing range:', error);
        showError('Invalid function format. Please check your input.');
    }
}

// Analyze Horizontal Asymptote with detailed explanations
function drrfAnalyzeHorizontalAsymptote(functionInput) {
    if (functionInput === '1/x') {
        return 'y = 0 (degree of denominator is greater than numerator)';
    } else if (functionInput === '(2x+1)/(3x-2)') {
        return 'y = 2/3 (degrees of numerator and denominator are equal)';
    } else if (functionInput === '(x²-1)/(x+2)') {
        return 'No horizontal asymptote (degree of numerator is greater than denominator)';
    } else if (functionInput === '(x+1)/(x²-4)') {
        return 'y = 0 (degree of denominator is greater than numerator)';
    } else if (functionInput === '(3x²+2)/(x²+1)') {
        return 'y = 3 (degrees are equal, ratio of leading coefficients)';
    } else if (functionInput === '(x+5)/(x²+2x+1)') {
        return 'y = 0 (degree of denominator is greater than numerator)';
    } else {
        return 'Depends on degrees of numerator and denominator';
    }
}

// Analyze Range Restrictions with detailed explanations
function drrfAnalyzeRangeRestrictions(functionInput) {
    if (functionInput === '1/x') {
        return {
            intervalNotation: '(-∞, 0) ∪ (0, ∞)',
            explanation: `
                <ol class="list-decimal list-inside space-y-2 text-sm">
                    <li><strong>Find horizontal asymptote:</strong> Degree of denominator > degree of numerator, so y = 0</li>
                    <li><strong>Analyze behavior:</strong> As x approaches ±∞, f(x) approaches 0</li>
                    <li><strong>Check if asymptote is reached:</strong> f(x) = 0 has no solution, so y ≠ 0</li>
                    <li><strong>Result:</strong> Range is all real numbers except 0</li>
                    <li><strong>Interval notation:</strong> (-∞, 0) ∪ (0, ∞)</li>
                </ol>
            `
        };
    } else if (functionInput === '(2x+1)/(3x-2)') {
        return {
            intervalNotation: '(-∞, 2/3) ∪ (2/3, ∞)',
            explanation: `
                <ol class="list-decimal list-inside space-y-2 text-sm">
                    <li><strong>Find horizontal asymptote:</strong> Degrees are equal, so y = 2/3</li>
                    <li><strong>Analyze behavior:</strong> As x approaches ±∞, f(x) approaches 2/3</li>
                    <li><strong>Check if asymptote is reached:</strong> f(x) = 2/3 has no solution, so y ≠ 2/3</li>
                    <li><strong>Result:</strong> Range is all real numbers except 2/3</li>
                    <li><strong>Interval notation:</strong> (-∞, 2/3) ∪ (2/3, ∞)</li>
                </ol>
            `
        };
    } else if (functionInput === '(x²-1)/(x+2)') {
        return {
            intervalNotation: 'All real numbers',
            explanation: `
                <ol class="list-decimal list-inside space-y-2 text-sm">
                    <li><strong>Find horizontal asymptote:</strong> Degree of numerator > degree of denominator, so no horizontal asymptote</li>
                    <li><strong>Analyze behavior:</strong> Function can take any real value</li>
                    <li><strong>Check vertical asymptote:</strong> x = -2 creates a vertical asymptote but doesn't restrict range</li>
                    <li><strong>Result:</strong> Range is all real numbers</li>
                    <li><strong>Interval notation:</strong> (-∞, ∞)</li>
                </ol>
            `
        };
    } else if (functionInput === '(x+1)/(x²-4)') {
        return {
            intervalNotation: 'All real numbers',
            explanation: `
                <ol class="list-decimal list-inside space-y-2 text-sm">
                    <li><strong>Find horizontal asymptote:</strong> Degree of denominator > degree of numerator, so y = 0</li>
                    <li><strong>Analyze behavior:</strong> Function approaches 0 as x approaches ±∞</li>
                    <li><strong>Check if all values are possible:</strong> Function can take any real value</li>
                    <li><strong>Result:</strong> Range is all real numbers</li>
                    <li><strong>Interval notation:</strong> (-∞, ∞)</li>
                </ol>
            `
        };
    } else if (functionInput === '(3x²+2)/(x²+1)') {
        return {
            intervalNotation: '[2, 3)',
            explanation: `
                <ol class="list-decimal list-inside space-y-2 text-sm">
                    <li><strong>Find horizontal asymptote:</strong> Degrees are equal, so y = 3</li>
                    <li><strong>Find minimum value:</strong> When x = 0, f(x) = 2</li>
                    <li><strong>Analyze behavior:</strong> Function approaches 3 but never reaches it</li>
                    <li><strong>Result:</strong> Range is from 2 (inclusive) to 3 (exclusive)</li>
                    <li><strong>Interval notation:</strong> [2, 3)</li>
                </ol>
            `
        };
    } else if (functionInput === '(x+5)/(x²+2x+1)') {
        return {
            intervalNotation: 'All real numbers',
            explanation: `
                <ol class="list-decimal list-inside space-y-2 text-sm">
                    <li><strong>Find horizontal asymptote:</strong> Degree of denominator > degree of numerator, so y = 0</li>
                    <li><strong>Analyze behavior:</strong> Function approaches 0 as x approaches ±∞</li>
                    <li><strong>Check if all values are possible:</strong> Function can take any real value</li>
                    <li><strong>Result:</strong> Range is all real numbers</li>
                    <li><strong>Interval notation:</strong> (-∞, ∞)</li>
                </ol>
            `
        };
    } else {
        return {
            intervalNotation: 'Depends on specific function behavior',
            explanation: 'Please select a specific function to see detailed analysis.'
        };
    }
}

// Interactive Domain & Range Calculator Functions
function initializeInteractiveDomainRangeCalculator() {
    // Add click handlers for example buttons
    const exampleButtons = document.querySelectorAll('[onclick^="drrfSetDomainRangeExample"]');
    exampleButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            exampleButtons.forEach(btn => btn.classList.remove('ring-2', 'ring-purple-500'));
            // Add active class to clicked button
            this.classList.add('ring-2', 'ring-purple-500');
        });
    });
}

// Set Domain Range Example
function drrfSetDomainRangeExample(functionInput) {
    try {
        // Add loading animation
        const displays = ['functionDisplay', 'domainResult', 'rangeResult', 'stepByStepSolution'];
        displays.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.opacity = '0.5';
                el.style.transform = 'scale(0.95)';
            }
        });

        setTimeout(() => {
            // Display the function with animation
            document.getElementById('functionDisplay').innerHTML = `
                <div class="flex items-center mb-3">
                    <div class="bg-indigo-500 rounded-full p-2 mr-3">
                        <i class="fas fa-function text-white text-sm"></i>
                    </div>
                    <h4 class="font-bold text-gray-800 text-lg">Selected Function:</h4>
                </div>
                <div class="text-xl font-mono text-indigo-900 font-bold bg-white rounded-lg p-3 text-center animate-pulse-once">f(x) = ${functionInput}</div>
            `;
            
            // Calculate domain
            const domainAnalysis = drrfAnalyzeDomainRestrictions(functionInput);
            document.getElementById('domainResult').innerHTML = `
                <div class="flex items-center mb-3">
                    <div class="bg-blue-500 rounded-full p-2 mr-3">
                        <i class="fas fa-search text-white text-sm"></i>
                    </div>
                    <h4 class="font-bold text-gray-800 text-lg">Domain:</h4>
                </div>
                <div class="bg-white rounded-lg p-4">
                    <div class="text-gray-800 font-mono text-lg font-bold text-blue-700 mb-2">${domainAnalysis.intervalNotation}</div>
                    <div class="text-sm text-gray-600 border-t pt-2">${domainAnalysis.restrictions}</div>
                </div>
            `;
            
            // Calculate range
            const rangeAnalysis = drrfAnalyzeRangeRestrictions(functionInput);
            const horizontalAsymptote = drrfAnalyzeHorizontalAsymptote(functionInput);
            document.getElementById('rangeResult').innerHTML = `
                <div class="flex items-center mb-3">
                    <div class="bg-pink-500 rounded-full p-2 mr-3">
                        <i class="fas fa-chart-bar text-white text-sm"></i>
                    </div>
                    <h4 class="font-bold text-gray-800 text-lg">Range:</h4>
                </div>
                <div class="bg-white rounded-lg p-4">
                    <div class="text-gray-800 font-mono text-lg font-bold text-pink-700 mb-2">${rangeAnalysis.intervalNotation}</div>
                    <div class="text-sm text-gray-600 border-t pt-2">${horizontalAsymptote}</div>
                </div>
            `;
            
            // Show complete step-by-step solution
            const stepByStepSolution = drrfGenerateCompleteStepByStepSolution(functionInput);
            document.getElementById('stepByStepSolution').innerHTML = `
                <div class="flex items-center mb-3">
                    <div class="bg-purple-500 rounded-full p-2 mr-3">
                        <i class="fas fa-list-ol text-white text-sm"></i>
                    </div>
                    <h4 class="font-bold text-gray-800 text-lg">Complete Step-by-Step Solution:</h4>
                </div>
                <div class="bg-white rounded-lg p-4">${stepByStepSolution}</div>
            `;

            // Restore opacity and add animation
            displays.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.opacity = '1';
                    el.style.transform = 'scale(1)';
                    el.style.transition = 'all 0.3s ease';
                }
            });
        }, 150);
        
    } catch (error) {
        console.error('Error calculating domain and range:', error);
        showError('Invalid function format. Please check your input.');
    }
}

// Generate Complete Step-by-Step Solution
function drrfGenerateCompleteStepByStepSolution(functionInput) {
    const domainAnalysis = drrfAnalyzeDomainRestrictions(functionInput);
    const rangeAnalysis = drrfAnalyzeRangeRestrictions(functionInput);
    const horizontalAsymptote = drrfAnalyzeHorizontalAsymptote(functionInput);
    
    return `
        <div class="space-y-4">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 class="font-semibold text-blue-800 mb-2">📋 Domain Analysis:</h5>
                <div class="text-blue-700 text-sm">${domainAnalysis.explanation}</div>
            </div>
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 class="font-semibold text-green-800 mb-2">📊 Range Analysis:</h5>
                <div class="text-green-700 text-sm">${rangeAnalysis.explanation}</div>
            </div>
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h5 class="font-semibold text-purple-800 mb-2">🎯 Summary:</h5>
                <div class="text-purple-700 text-sm">
                    <p><strong>Domain:</strong> ${domainAnalysis.intervalNotation}</p>
                    <p><strong>Range:</strong> ${rangeAnalysis.intervalNotation}</p>
                    <p><strong>Horizontal Asymptote:</strong> ${horizontalAsymptote}</p>
                </div>
            </div>
        </div>
    `;
}

// Expose for onclick
window.drrfNavigateLesson = drrfNavigateLesson;
window.drrfShowLesson = drrfShowLesson;
window.drrfCompleteLesson = drrfCompleteLesson;
window.drrfShuffleArray = drrfShuffleArray;
window.drrfShuffleQuiz = drrfShuffleQuiz;
window.drrfGenerateExplanation = drrfGenerateExplanation;
window.drrfRunLessonQuiz = drrfRunLessonQuiz;
window.drrfStoreQuizData = drrfStoreQuizData;
window.drrfStartLiveTimer = drrfStartLiveTimer;
window.drrfUpdateLiveTimer = drrfUpdateLiveTimer;
window.drrfSaveStudyTimeForCurrentLesson = drrfSaveStudyTimeForCurrentLesson;
window.drrfSendStudyTimeToServer = drrfSendStudyTimeToServer;
window.drrfLoadAndDisplayStudyTime = drrfLoadAndDisplayStudyTime;
window.drrfCompleteLesson = drrfCompleteLesson;
window.drrfLoadCompletedLessons = drrfLoadCompletedLessons;
window.drrfShowPerformanceAnalysisSection = drrfShowPerformanceAnalysisSection;
window.drrfAnalyzePerformance = drrfAnalyzePerformance;
window.drrfDisplayPerformanceAnalysis = drrfDisplayPerformanceAnalysis;
window.drrfGetTopicNameForAnalysis = drrfGetTopicNameForAnalysis;
window.drrfShowTopic4Quiz = drrfShowTopic4Quiz;
window.toggleUserDropdown = toggleUserDropdown;
window.toggleMobileMenu = toggleMobileMenu;
window.confirmLogout = confirmLogout;
window.drrfSetDomainExample = drrfSetDomainExample;
window.drrfSetRangeExample = drrfSetRangeExample;
window.drrfSetDomainRangeExample = drrfSetDomainRangeExample;

// Initialize all calculators and interactive tools
function initializeCalculators() {
    // Initialize Interactive Domain Analyzer
    initializeInteractiveDomainAnalyzer();
    
    // Initialize Interactive Range Analyzer
    initializeInteractiveRangeAnalyzer();
    
    // Initialize Interactive Domain & Range Calculator
    initializeInteractiveDomainRangeCalculator();
    
    // Initialize Application Problem Solver
    initializeApplicationProblemSolver();
}

// Interactive Domain Analyzer Functions
function initializeInteractiveDomainAnalyzer() {
    // Add click handlers for example buttons
    const exampleButtons = document.querySelectorAll('[onclick^="drrfSetDomainExample"]');
    exampleButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            exampleButtons.forEach(btn => btn.classList.remove('ring-2', 'ring-blue-500'));
            // Add active class to clicked button
            this.classList.add('ring-2', 'ring-blue-500');
        });
    });
}

// Set Domain Example
function drrfSetDomainExample(functionInput) {
    try {
        // Add loading animation
        const displays = ['domainFunctionDisplay', 'domainRestrictions', 'domainNotation', 'domainExplanation'];
        displays.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.opacity = '0.5';
                el.style.transform = 'scale(0.95)';
            }
        });

        setTimeout(() => {
            // Display the function with animation
            document.getElementById('domainFunctionDisplay').innerHTML = `
                <div class="flex items-center mb-3">
                    <div class="bg-blue-500 rounded-full p-2 mr-3">
                        <i class="fas fa-function text-white text-sm"></i>
                    </div>
                    <h4 class="font-bold text-gray-800 text-lg">Selected Function:</h4>
                </div>
                <div class="text-xl font-mono text-blue-900 font-bold bg-white rounded-lg p-3 text-center animate-pulse-once">f(x) = ${functionInput}</div>
            `;
            
            // Analyze domain restrictions
            const domainAnalysis = drrfAnalyzeDomainRestrictions(functionInput);
            document.getElementById('domainRestrictions').innerHTML = `
                <div class="flex items-center mb-3">
                    <div class="bg-red-500 rounded-full p-2 mr-3">
                        <i class="fas fa-exclamation-triangle text-white text-sm"></i>
                    </div>
                    <h4 class="font-bold text-gray-800 text-lg">Domain Restrictions:</h4>
                </div>
                <div class="text-gray-800 bg-white rounded-lg p-3 font-semibold text-lg">${domainAnalysis.restrictions}</div>
            `;
            
            // Display domain in interval notation
            document.getElementById('domainNotation').innerHTML = `
                <div class="flex items-center mb-3">
                    <div class="bg-green-500 rounded-full p-2 mr-3">
                        <i class="fas fa-brackets-curly text-white text-sm"></i>
                    </div>
                    <h4 class="font-bold text-gray-800 text-lg">Domain in Interval Notation:</h4>
                </div>
                <div class="text-gray-800 font-mono bg-white rounded-lg p-3 text-center font-bold text-lg text-green-700">${domainAnalysis.intervalNotation}</div>
            `;
            
            // Display step-by-step explanation
            document.getElementById('domainExplanation').innerHTML = `
                <div class="flex items-center mb-3">
                    <div class="bg-purple-500 rounded-full p-2 mr-3">
                        <i class="fas fa-list-ol text-white text-sm"></i>
                    </div>
                    <h4 class="font-bold text-gray-800 text-lg">Step-by-Step Explanation:</h4>
                </div>
                <div class="text-gray-800 bg-white rounded-lg p-4">${domainAnalysis.explanation}</div>
            `;

            // Restore opacity and add animation
            displays.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.opacity = '1';
                    el.style.transform = 'scale(1)';
                    el.style.transition = 'all 0.3s ease';
                }
            });
        }, 150);
        
    } catch (error) {
        console.error('Error analyzing domain:', error);
        showError('Invalid function format. Please check your input.');
    }
}

// Analyze Domain Restrictions with detailed explanations
function drrfAnalyzeDomainRestrictions(functionInput) {
    if (functionInput === '1/x') {
        return {
            restrictions: 'x ≠ 0 (denominator cannot be zero)',
            intervalNotation: '(-∞, 0) ∪ (0, ∞)',
            explanation: `
                <ol class="list-decimal list-inside space-y-2 text-sm">
                    <li><strong>Identify the denominator:</strong> The denominator is x</li>
                    <li><strong>Set denominator equal to zero:</strong> x = 0</li>
                    <li><strong>Exclude from domain:</strong> x cannot equal 0</li>
                    <li><strong>Result:</strong> Domain is all real numbers except 0</li>
                    <li><strong>Interval notation:</strong> (-∞, 0) ∪ (0, ∞)</li>
                </ol>
            `
        };
    } else if (functionInput === '1/(x-2)') {
        return {
            restrictions: 'x ≠ 2 (denominator cannot be zero)',
            intervalNotation: '(-∞, 2) ∪ (2, ∞)',
            explanation: `
                <ol class="list-decimal list-inside space-y-2 text-sm">
                    <li><strong>Identify the denominator:</strong> The denominator is (x - 2)</li>
                    <li><strong>Set denominator equal to zero:</strong> x - 2 = 0</li>
                    <li><strong>Solve:</strong> x = 2</li>
                    <li><strong>Exclude from domain:</strong> x cannot equal 2</li>
                    <li><strong>Result:</strong> Domain is all real numbers except 2</li>
                    <li><strong>Interval notation:</strong> (-∞, 2) ∪ (2, ∞)</li>
                </ol>
            `
        };
    } else if (functionInput === '1/(x+1)') {
        return {
            restrictions: 'x ≠ -1 (denominator cannot be zero)',
            intervalNotation: '(-∞, -1) ∪ (-1, ∞)',
            explanation: `
                <ol class="list-decimal list-inside space-y-2 text-sm">
                    <li><strong>Identify the denominator:</strong> The denominator is (x + 1)</li>
                    <li><strong>Set denominator equal to zero:</strong> x + 1 = 0</li>
                    <li><strong>Solve:</strong> x = -1</li>
                    <li><strong>Exclude from domain:</strong> x cannot equal -1</li>
                    <li><strong>Result:</strong> Domain is all real numbers except -1</li>
                    <li><strong>Interval notation:</strong> (-∞, -1) ∪ (-1, ∞)</li>
                </ol>
            `
        };
    } else if (functionInput === '(x+2)/(x²-9)') {
        return {
            restrictions: 'x ≠ 3 and x ≠ -3 (denominator cannot be zero)',
            intervalNotation: '(-∞, -3) ∪ (-3, 3) ∪ (3, ∞)',
            explanation: `
                <ol class="list-decimal list-inside space-y-2 text-sm">
                    <li><strong>Identify the denominator:</strong> The denominator is (x² - 9)</li>
                    <li><strong>Set denominator equal to zero:</strong> x² - 9 = 0</li>
                    <li><strong>Factor:</strong> (x + 3)(x - 3) = 0</li>
                    <li><strong>Solve:</strong> x = -3 or x = 3</li>
                    <li><strong>Exclude from domain:</strong> x cannot equal -3 or 3</li>
                    <li><strong>Result:</strong> Domain is all real numbers except -3 and 3</li>
                    <li><strong>Interval notation:</strong> (-∞, -3) ∪ (-3, 3) ∪ (3, ∞)</li>
                </ol>
            `
        };
    } else if (functionInput === '(x²-1)/(x+2)') {
        return {
            restrictions: 'x ≠ -2 (denominator cannot be zero)',
            intervalNotation: '(-∞, -2) ∪ (-2, ∞)',
            explanation: `
                <ol class="list-decimal list-inside space-y-2 text-sm">
                    <li><strong>Identify the denominator:</strong> The denominator is (x + 2)</li>
                    <li><strong>Set denominator equal to zero:</strong> x + 2 = 0</li>
                    <li><strong>Solve:</strong> x = -2</li>
                    <li><strong>Exclude from domain:</strong> x cannot equal -2</li>
                    <li><strong>Result:</strong> Domain is all real numbers except -2</li>
                    <li><strong>Interval notation:</strong> (-∞, -2) ∪ (-2, ∞)</li>
                </ol>
            `
        };
    } else if (functionInput === '(2x+3)/(x²-4)') {
        return {
            restrictions: 'x ≠ 2 and x ≠ -2 (denominator cannot be zero)',
            intervalNotation: '(-∞, -2) ∪ (-2, 2) ∪ (2, ∞)',
            explanation: `
                <ol class="list-decimal list-inside space-y-2 text-sm">
                    <li><strong>Identify the denominator:</strong> The denominator is (x² - 4)</li>
                    <li><strong>Set denominator equal to zero:</strong> x² - 4 = 0</li>
                    <li><strong>Factor:</strong> (x + 2)(x - 2) = 0</li>
                    <li><strong>Solve:</strong> x = -2 or x = 2</li>
                    <li><strong>Exclude from domain:</strong> x cannot equal -2 or 2</li>
                    <li><strong>Result:</strong> Domain is all real numbers except -2 and 2</li>
                    <li><strong>Interval notation:</strong> (-∞, -2) ∪ (-2, 2) ∪ (2, ∞)</li>
                </ol>
            `
        };
    } else {
        return {
            restrictions: 'All real numbers except where denominator equals zero',
            intervalNotation: 'Depends on specific function',
            explanation: 'Please select a specific function to see detailed analysis.'
        };
    }
}

// Domain Analyzer
function initializeDomainAnalyzer() {
    const domainFunctionInput = document.getElementById('domainFunctionInput');
    
    if (domainFunctionInput) {
        // Add real-time updates with debouncing
        let timeout;
        domainFunctionInput.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                analyzeDomain();
            }, 500);
        });
    }
}

// Analyze Domain
function analyzeDomain() {
    const functionInput = document.getElementById('domainFunctionInput').value.trim();
    
    if (!functionInput) {
        resetDomainResults();
        return;
    }
    
    try {
        // Display the function
        document.getElementById('domainFunctionDisplay').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Function:</h4>
            <div class="text-lg font-mono text-primary">f(x) = ${functionInput}</div>
        `;
        
        // Analyze domain restrictions
        const domainAnalysis = analyzeDomainRestrictions(functionInput);
        document.getElementById('domainRestrictions').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Domain Restrictions:</h4>
            <div class="text-gray-700">${domainAnalysis.restrictions}</div>
        `;
        
        // Display domain in interval notation
        document.getElementById('domainNotation').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Domain in Interval Notation:</h4>
            <div class="text-gray-700 font-mono">${domainAnalysis.intervalNotation}</div>
        `;
        
    } catch (error) {
        console.error('Error analyzing domain:', error);
        showError('Invalid function format. Please check your input.');
    }
}

// Analyze Domain Restrictions
function analyzeDomainRestrictions(functionInput) {
    // Simple domain analysis for common cases
    if (functionInput.includes('1/x')) {
        return {
            restrictions: 'x ≠ 0 (denominator cannot be zero)',
            intervalNotation: '(-∞, 0) ∪ (0, ∞)'
        };
    } else if (functionInput.includes('1/(x-2)')) {
        return {
            restrictions: 'x ≠ 2 (denominator cannot be zero)',
            intervalNotation: '(-∞, 2) ∪ (2, ∞)'
        };
    } else if (functionInput.includes('1/(x+1)')) {
        return {
            restrictions: 'x ≠ -1 (denominator cannot be zero)',
            intervalNotation: '(-∞, -1) ∪ (-1, ∞)'
        };
    } else if (functionInput.includes('x²-9') || functionInput.includes('x^2-9')) {
        return {
            restrictions: 'x ≠ 3 and x ≠ -3 (denominator cannot be zero)',
            intervalNotation: '(-∞, -3) ∪ (-3, 3) ∪ (3, ∞)'
        };
    } else if (functionInput.includes('x²-4') || functionInput.includes('x^2-4')) {
        return {
            restrictions: 'x ≠ 2 and x ≠ -2 (denominator cannot be zero)',
            intervalNotation: '(-∞, -2) ∪ (-2, 2) ∪ (2, ∞)'
        };
    } else {
        return {
            restrictions: 'All real numbers except where denominator equals zero',
            intervalNotation: 'Depends on specific function'
        };
    }
}

// Reset Domain Results
function resetDomainResults() {
    document.getElementById('domainFunctionDisplay').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Function:</h4>
        <div class="text-lg font-mono text-primary">f(x) = </div>
    `;
    document.getElementById('domainRestrictions').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Domain Restrictions:</h4>
        <div class="text-gray-700">Enter a function to analyze</div>
    `;
    document.getElementById('domainNotation').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Domain in Interval Notation:</h4>
        <div class="text-gray-700">Enter a function to analyze</div>
    `;
}

// Range Analyzer
function initializeRangeAnalyzer() {
    const rangeFunctionInput = document.getElementById('rangeFunctionInput');
    
    if (rangeFunctionInput) {
        // Add real-time updates with debouncing
        let timeout;
        rangeFunctionInput.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                analyzeRange();
            }, 500);
        });
    }
}

// Analyze Range
function analyzeRange() {
    const functionInput = document.getElementById('rangeFunctionInput').value.trim();
    
    if (!functionInput) {
        resetRangeResults();
        return;
    }
    
    try {
        // Display the function
        document.getElementById('rangeFunctionDisplay').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Function:</h4>
            <div class="text-lg font-mono text-primary">f(x) = ${functionInput}</div>
        `;
        
        // Analyze horizontal asymptote
        const horizontalAsymptote = analyzeHorizontalAsymptote(functionInput);
        document.getElementById('horizontalAsymptote').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Horizontal Asymptote:</h4>
            <div class="text-gray-700">${horizontalAsymptote}</div>
        `;
        
        // Analyze range
        const rangeAnalysis = analyzeRangeRestrictions(functionInput);
        document.getElementById('rangeNotation').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Range in Interval Notation:</h4>
            <div class="text-gray-700 font-mono">${rangeAnalysis}</div>
        `;
        
    } catch (error) {
        console.error('Error analyzing range:', error);
        showError('Invalid function format. Please check your input.');
    }
}

// Analyze Horizontal Asymptote
function analyzeHorizontalAsymptote(functionInput) {
    if (functionInput.includes('(2x+1)/(3x-2)')) {
        return 'y = 2/3 (degrees of numerator and denominator are equal)';
    } else if (functionInput.includes('1/x')) {
        return 'y = 0 (degree of denominator is greater than numerator)';
    } else if (functionInput.includes('x²') && functionInput.includes('x²')) {
        return 'y = ratio of leading coefficients (degrees are equal)';
    } else if (functionInput.includes('x²') && !functionInput.includes('x²')) {
        return 'y = 0 (degree of denominator is greater)';
    } else {
        return 'Depends on degrees of numerator and denominator';
    }
}

// Analyze Range Restrictions
function analyzeRangeRestrictions(functionInput) {
    if (functionInput.includes('1/x')) {
        return '(-∞, 0) ∪ (0, ∞)';
    } else if (functionInput.includes('(2x+1)/(3x-2)')) {
        return '(-∞, 2/3) ∪ (2/3, ∞)';
    } else if (functionInput.includes('x²') && functionInput.includes('x²')) {
        return 'All real numbers except horizontal asymptote';
    } else if (functionInput.includes('x²') && !functionInput.includes('x²')) {
        return 'All real numbers';
    } else {
        return 'Depends on specific function behavior';
    }
}

// Reset Range Results
function resetRangeResults() {
    document.getElementById('rangeFunctionDisplay').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Function:</h4>
        <div class="text-lg font-mono text-primary">f(x) = </div>
    `;
    document.getElementById('horizontalAsymptote').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Horizontal Asymptote:</h4>
        <div class="text-gray-700">Enter a function to analyze</div>
    `;
    document.getElementById('rangeNotation').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Range in Interval Notation:</h4>
        <div class="text-gray-700">Enter a function to analyze</div>
    `;
}

// Domain & Range Calculator
function initializeDomainRangeCalculator() {
    const domainRangeInput = document.getElementById('domainRangeInput');
    
    if (domainRangeInput) {
        // Add real-time updates with debouncing
        let timeout;
        domainRangeInput.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                calculateDomainAndRange();
            }, 500);
        });
    }
}

// Calculate Domain and Range
function calculateDomainAndRange() {
    const functionInput = document.getElementById('domainRangeInput').value.trim();
    
    if (!functionInput) {
        resetDomainRangeResults();
        return;
    }
    
    try {
        // Display the function
        document.getElementById('functionDisplay').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Function:</h4>
            <div class="text-lg font-mono text-primary">f(x) = ${functionInput}</div>
        `;
        
        // Calculate domain
        const domainAnalysis = analyzeDomainRestrictions(functionInput);
        document.getElementById('domainResult').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Domain:</h4>
            <div class="text-gray-700 font-mono">${domainAnalysis.intervalNotation}</div>
            <div class="text-sm text-gray-600 mt-1">${domainAnalysis.restrictions}</div>
        `;
        
        // Calculate range
        const rangeAnalysis = analyzeRangeRestrictions(functionInput);
        const horizontalAsymptote = analyzeHorizontalAsymptote(functionInput);
        document.getElementById('rangeResult').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Range:</h4>
            <div class="text-gray-700 font-mono">${rangeAnalysis}</div>
            <div class="text-sm text-gray-600 mt-1">${horizontalAsymptote}</div>
        `;
        
        // Show step-by-step solution
        const stepByStepSolution = generateStepByStepSolution(functionInput);
        document.getElementById('stepByStepSolution').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Step-by-Step Solution:</h4>
            <div class="text-gray-700">${stepByStepSolution}</div>
        `;
        
    } catch (error) {
        console.error('Error calculating domain and range:', error);
        showError('Invalid function format. Please check your input.');
    }
}

// Generate Step-by-Step Solution
function generateStepByStepSolution(functionInput) {
    let steps = '<ol class="list-decimal list-inside space-y-2">';
    
    // Domain steps
    steps += '<li><strong>Finding Domain:</strong></li>';
    steps += '<li>Identify the denominator of the rational function</li>';
    
    if (functionInput.includes('1/x')) {
        steps += '<li>Set denominator equal to zero: x = 0</li>';
        steps += '<li>Domain excludes x = 0</li>';
        steps += '<li>Domain: (-∞, 0) ∪ (0, ∞)</li>';
    } else if (functionInput.includes('1/(x-2)')) {
        steps += '<li>Set denominator equal to zero: x - 2 = 0</li>';
        steps += '<li>Solve: x = 2</li>';
        steps += '<li>Domain excludes x = 2</li>';
        steps += '<li>Domain: (-∞, 2) ∪ (2, ∞)</li>';
    } else {
        steps += '<li>Set denominator equal to zero and solve</li>';
        steps += '<li>Domain excludes all solutions</li>';
    }
    
    // Range steps
    steps += '<li><strong>Finding Range:</strong></li>';
    steps += '<li>Determine horizontal asymptote by comparing degrees</li>';
    
    if (functionInput.includes('1/x')) {
        steps += '<li>Degree of denominator > degree of numerator</li>';
        steps += '<li>Horizontal asymptote: y = 0</li>';
        steps += '<li>Range: (-∞, 0) ∪ (0, ∞)</li>';
    } else if (functionInput.includes('(2x+1)/(3x-2)')) {
        steps += '<li>Degrees of numerator and denominator are equal</li>';
        steps += '<li>Horizontal asymptote: y = 2/3</li>';
        steps += '<li>Range: (-∞, 2/3) ∪ (2/3, ∞)</li>';
    } else {
        steps += '<li>Analyze function behavior near asymptotes</li>';
        steps += '<li>Determine complete range</li>';
    }
    
    steps += '</ol>';
    return steps;
}

// Reset Domain Range Results
function resetDomainRangeResults() {
    document.getElementById('functionDisplay').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Function:</h4>
        <div class="text-lg font-mono text-primary">f(x) = </div>
    `;
    document.getElementById('domainResult').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Domain:</h4>
        <div class="text-gray-700">Enter a function to analyze</div>
    `;
    document.getElementById('rangeResult').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Range:</h4>
        <div class="text-gray-700">Enter a function to analyze</div>
    `;
    document.getElementById('stepByStepSolution').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Step-by-Step Solution:</h4>
        <div class="text-gray-700">Enter a function to see the solution steps</div>
    `;
}

// Application Problem Solver
function initializeApplicationProblemSolver() {
    const applicationTypeSelect = document.getElementById('applicationType');
    
    if (applicationTypeSelect) {
        applicationTypeSelect.addEventListener('change', function() {
            updateApplicationInputs(this.value);
        });
    }
}

// Update Application Inputs
function updateApplicationInputs(applicationType) {
    const applicationInputs = document.getElementById('applicationInputs');
    const applicationDescription = document.getElementById('applicationDescription');
    
    if (!applicationInputs || !applicationDescription) return;
    
    switch (applicationType) {
        case 'resistance':
            applicationInputs.innerHTML = `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Resistance 1 (R₁):</label>
                    <input type="number" id="r1" placeholder="e.g., 4" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Resistance 2 (R₂):</label>
                    <input type="number" id="r2" placeholder="e.g., 6" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Resistance 3 (R₃):</label>
                    <input type="number" id="r3" placeholder="e.g., 12" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
            `;
            applicationDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Problem Description:</h4>
                <div class="text-gray-700">Three resistors with resistances R₁, R₂, and R₃ are connected in parallel. Find the domain and range of the total resistance function: 1/R_total = 1/R₁ + 1/R₂ + 1/R₃</div>
            `;
            break;
            
        case 'lens':
            applicationInputs.innerHTML = `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Focal Length (f):</label>
                    <input type="number" id="focalLength" placeholder="e.g., 10" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Object Distance (d₀):</label>
                    <input type="number" id="objectDistance" placeholder="e.g., 15" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
            `;
            applicationDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Problem Description:</h4>
                <div class="text-gray-700">Using the lens equation 1/f = 1/d₀ + 1/dᵢ, analyze the domain and range of the image distance function dᵢ = 1/(1/f - 1/d₀)</div>
            `;
            break;
            
        case 'cost':
            applicationInputs.innerHTML = `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Fixed Cost:</label>
                    <input type="number" id="fixedCost" placeholder="e.g., 1000" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Variable Cost per Unit:</label>
                    <input type="number" id="variableCost" placeholder="e.g., 5" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
            `;
            applicationDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Problem Description:</h4>
                <div class="text-gray-700">Analyze the domain and range of the average cost function AC(x) = C(x)/x, where C(x) = Fixed Cost + (Variable Cost × x)</div>
            `;
            break;
            
        case 'market':
            applicationInputs.innerHTML = `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Maximum Market Share (k):</label>
                    <input type="number" id="maxMarketShare" placeholder="e.g., 0.8" step="0.1" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Saturation Constant (b):</label>
                    <input type="number" id="saturationConstant" placeholder="e.g., 100" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
            `;
            applicationDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Problem Description:</h4>
                <div class="text-gray-700">Analyze the domain and range of the market share function S(a) = ka/(a + b), where a is advertising expenditure</div>
            `;
            break;
            
        case 'vehicle':
            applicationInputs.innerHTML = `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Coefficient (a):</label>
                    <input type="number" id="coefficientA" placeholder="e.g., 50" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Coefficient (b):</label>
                    <input type="number" id="coefficientB" placeholder="e.g., 10" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Coefficient (c):</label>
                    <input type="number" id="coefficientC" placeholder="e.g., 100" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
            `;
            applicationDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Problem Description:</h4>
                <div class="text-gray-700">Analyze the domain and range of the fuel efficiency function E(v) = av/(v² + bv + c), where v is velocity</div>
            `;
            break;
            
        default:
            applicationInputs.innerHTML = '<div class="text-gray-600">Select an application type to see inputs</div>';
            applicationDescription.innerHTML = '<div class="text-gray-600">Select an application type to see the description</div>';
    }
}

// Solve Application Problem
function solveApplicationProblem() {
    const applicationType = document.getElementById('applicationType').value;
    
    if (!applicationType) {
        showError('Please select an application type first.');
        return;
    }
    
    try {
        let solution;
        
        switch (applicationType) {
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
                showError('Unknown application type.');
                return;
        }
        
        displayApplicationSolution(solution);
        
    } catch (error) {
        console.error('Error solving application problem:', error);
        showError('Error solving problem. Please check your inputs.');
    }
}

// Solve Resistance Problem
function solveResistanceProblem() {
    const r1 = parseFloat(document.getElementById('r1').value);
    const r2 = parseFloat(document.getElementById('r2').value);
    const r3 = parseFloat(document.getElementById('r3').value);
    
    if (!r1 || !r2 || !r3) {
        throw new Error('Please enter all resistance values.');
    }
    
    return {
        domainAnalysis: `
            <strong>Domain:</strong> R₁ > 0, R₂ > 0, R₃ > 0<br>
            <em>Explanation:</em> Resistance values must be positive real numbers. The domain excludes zero and negative values because resistance cannot be zero or negative in physical systems.
        `,
        rangeAnalysis: `
            <strong>Range:</strong> R_total > 0<br>
            <em>Explanation:</em> The total resistance in parallel is always positive and approaches zero as individual resistances decrease. The range is all positive real numbers.
        `,
        practicalImplications: `
            <strong>Practical Implications:</strong><br>
            • All resistance values must be positive<br>
            • Total resistance is always less than the smallest individual resistance<br>
            • As any resistance approaches zero, total resistance approaches zero<br>
            • This model is valid for ideal resistors in parallel circuits
        `
    };
}

// Solve Lens Problem
function solveLensProblem() {
    const focalLength = parseFloat(document.getElementById('focalLength').value);
    const objectDistance = parseFloat(document.getElementById('objectDistance').value);
    
    if (!focalLength || !objectDistance) {
        throw new Error('Please enter both focal length and object distance.');
    }
    
    return {
        domainAnalysis: `
            <strong>Domain:</strong> f > 0, d₀ > 0, d₀ ≠ f<br>
            <em>Explanation:</em> Focal length and object distance must be positive. Object distance cannot equal focal length as this would make the denominator zero.
        `,
        rangeAnalysis: `
            <strong>Range:</strong> dᵢ ∈ ℝ, dᵢ ≠ 0<br>
            <em>Explanation:</em> Image distance can be any real number except zero. Positive values indicate real images, negative values indicate virtual images.
        `,
        practicalImplications: `
            <strong>Practical Implications:</strong><br>
            • For d₀ > f: Real, inverted image<br>
            • For d₀ < f: Virtual, upright image<br>
            • For d₀ = f: Image at infinity (not physically achievable)<br>
            • This model applies to thin lenses in geometric optics
        `
    };
}

// Solve Cost Problem
function solveCostProblem() {
    const fixedCost = parseFloat(document.getElementById('fixedCost').value);
    const variableCost = parseFloat(document.getElementById('variableCost').value);
    
    if (!fixedCost || !variableCost) {
        throw new Error('Please enter both fixed and variable costs.');
    }
    
    return {
        domainAnalysis: `
            <strong>Domain:</strong> x > 0<br>
            <em>Explanation:</em> Production quantity must be positive. The domain excludes zero because average cost is undefined when no units are produced.
        `,
        rangeAnalysis: `
            <strong>Range:</strong> AC(x) > Variable Cost<br>
            <em>Explanation:</em> Average cost approaches the variable cost per unit as production increases. It cannot be less than the variable cost per unit.
        `,
        practicalImplications: `
            <strong>Practical Implications:</strong><br>
            • Average cost decreases as production increases<br>
            • Minimum average cost occurs at optimal production level<br>
            • Fixed costs are spread over more units as production increases<br>
            • This model assumes constant variable cost per unit
        `
    };
}

// Solve Market Problem
function solveMarketProblem() {
    const maxMarketShare = parseFloat(document.getElementById('maxMarketShare').value);
    const saturationConstant = parseFloat(document.getElementById('saturationConstant').value);
    
    if (!maxMarketShare || !saturationConstant) {
        throw new Error('Please enter both maximum market share and saturation constant.');
    }
    
    return {
        domainAnalysis: `
            <strong>Domain:</strong> a ≥ 0<br>
            <em>Explanation:</em> Advertising expenditure must be non-negative. The domain includes zero (no advertising) and all positive values.
        `,
        rangeAnalysis: `
            <strong>Range:</strong> 0 ≤ S(a) < ${maxMarketShare}<br>
            <em>Explanation:</em> Market share starts at 0 and approaches but never reaches the maximum value k. It's bounded between 0 and k.
        `,
        practicalImplications: `
            <strong>Practical Implications:</strong><br>
            • Market share increases with advertising expenditure<br>
            • Diminishing returns: each additional dollar of advertising has less impact<br>
            • Maximum market share is never fully achieved<br>
            • This model represents realistic market saturation effects
        `
    };
}

// Solve Vehicle Problem
function solveVehicleProblem() {
    const coefficientA = parseFloat(document.getElementById('coefficientA').value);
    const coefficientB = parseFloat(document.getElementById('coefficientB').value);
    const coefficientC = parseFloat(document.getElementById('coefficientC').value);
    
    if (!coefficientA || !coefficientB || !coefficientC) {
        throw new Error('Please enter all coefficients.');
    }
    
    return {
        domainAnalysis: `
            <strong>Domain:</strong> v > 0<br>
            <em>Explanation:</em> Velocity must be positive. The domain excludes zero and negative velocities as they don't represent realistic driving conditions.
        `,
        rangeAnalysis: `
            <strong>Range:</strong> 0 < E(v) < ${coefficientA}/${coefficientC}<br>
            <em>Explanation:</em> Fuel efficiency is always positive and has a maximum value determined by the coefficients. It approaches zero as velocity approaches zero or infinity.
        `,
        practicalImplications: `
            <strong>Practical Implications:</strong><br>
            • Optimal speed exists for maximum fuel efficiency<br>
            • Very low speeds (traffic) reduce efficiency<br>
            • Very high speeds reduce efficiency due to air resistance<br>
            • This model represents typical vehicle performance curves
        `
    };
}

// Display Application Solution
function displayApplicationSolution(solution) {
    document.getElementById('domainAnalysis').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Domain Analysis:</h4>
        <div class="text-gray-700">${solution.domainAnalysis}</div>
    `;
    
    document.getElementById('rangeAnalysis').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Range Analysis:</h4>
        <div class="text-gray-700">${solution.rangeAnalysis}</div>
    `;
    
    document.getElementById('practicalImplications').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Practical Implications:</h4>
        <div class="text-gray-700">${solution.practicalImplications}</div>
    `;
}

// Utility Functions
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
    const savedProgress = localStorage.getItem('domainRangeRationalFunctionsProgress');
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
    const progress = JSON.parse(localStorage.getItem('domainRangeRationalFunctionsProgress') || '{}');
    progress[lessonId] = {
        completed: completed,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('domainRangeRationalFunctionsProgress', JSON.stringify(progress));
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
document.addEventListener('DOMContentLoaded', async function() {
    try {
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
        const u = data.user || {};
        const gradeOk = !u.grade_level || String(u.grade_level) === '11';
        const strandOk = !u.strand || String(u.strand).toUpperCase() === 'STEM';
        if (!gradeOk || !strandOk) { 
            window.location.href = '../dashboard.html'; 
            return; 
        }
        
        // Update user name
        const userNameEl = document.getElementById('userName');
        if (userNameEl && u.first_name) {
            userNameEl.textContent = `${u.first_name} ${u.last_name || ''}`.trim();
        }
        
        // Initialize interactive elements
        initializeInteractiveElements();
        
    } catch (e) {
        window.location.href = '../login.html';
    }
});

// Initialize Interactive Elements
function initializeInteractiveElements() {
    // Add event listeners to input fields
    const inputFields = document.querySelectorAll('input[type="text"], input[type="number"]');
    inputFields.forEach(field => {
        field.addEventListener('input', function() {
            this.classList.add('focus-ring');
        });
        
        field.addEventListener('blur', function() {
            this.classList.remove('focus-ring');
        });
    });
    
    // Add hover effects to interactive elements
    const interactiveElements = document.querySelectorAll('.interactive-element, .lesson-card, .practice-example');
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.classList.add('hover-lift');
        });
        
        element.addEventListener('mouseleave', function() {
            this.classList.remove('hover-lift');
        });
    });
    
    // Initialize any graphs or visualizations
    setTimeout(() => {
        // Add any initialization code here
    }, 100);
}

// Auto-save functionality
function autoSave() {
    const currentLesson = localStorage.getItem('currentLesson') || '1';
    const progress = JSON.parse(localStorage.getItem('domainRangeRationalFunctionsProgress') || '{}');
    
    // Mark current lesson as in progress
    progress[`lesson${currentLesson}`] = {
        completed: false,
        inProgress: true,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('domainRangeRationalFunctionsProgress', JSON.stringify(progress));
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

// Utility Functions
function formatFunction(func) {
    return func.replace(/\s/g, '').replace(/\*/g, '');
}

function validateFunction(func) {
    // Basic validation for function expressions
    const validPattern = /^[+-]?\d*x(\^?\d+)?([+-]\d*x(\^?\d+)?)*([+-]\d+)?$/;
    return validPattern.test(func.replace(/\s/g, ''));
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

// Topic Completion Functions
function drrfShowTopicCompletionOption() {
    if (drrfCompletedLessons.size === drrfTotalLessons) {
        // Check if topic completion button already exists
        if (document.getElementById('drrfTopicCompletionBtn')) return;
        
        // Create topic completion section
        const completionSection = document.createElement('div');
        completionSection.id = 'drrfTopicCompletionSection';
        completionSection.className = 'bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-8 mb-8 border-2 border-emerald-200';
        completionSection.innerHTML = `
            <div class="text-center">
                <div class="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-trophy text-3xl"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-800 mb-4">🎉 Congratulations!</h3>
                <p class="text-lg text-gray-600 mb-6">You've completed all lessons in <strong>Domain and Range of Rational Functions</strong>!</p>
                <p class="text-gray-700 mb-8">You can now mark this entire topic as completed and move on to the next topic.</p>
                <button id="drrfTopicCompletionBtn" onclick="drrfCompleteTopic()" 
                        class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                    <i class="fas fa-check-circle mr-2"></i>Complete Topic
                </button>
            </div>
        `;
        
        // Insert after the last lesson section
        const lastLesson = document.getElementById(`lesson${drrfTotalLessons}`);
        if (lastLesson) {
            lastLesson.parentNode.insertBefore(completionSection, lastLesson.nextSibling);
        }
    }
}

async function drrfCompleteTopic() {
    try {
        console.log('Attempting to complete topic: Domain and Range of Rational Functions');
        
        const requestData = {
            topic: 'domain-range-rational-functions',
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
                        <p><strong>Topic:</strong> Domain and Range of Rational Functions</p>
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
                        <p class="text-lg text-gray-600 mb-6">You've successfully completed <strong>Domain and Range of Rational Functions</strong>!</p>
                        <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-6">
                            <p class="text-emerald-800 font-semibold mb-2">What you've accomplished:</p>
                            <ul class="text-emerald-700 text-left space-y-1">
                                <li>✅ Mastered domain concepts for rational functions</li>
                                <li>✅ Learned to find range using horizontal asymptotes</li>
                                <li>✅ Applied domain and range to real-world problems</li>
                                <li>✅ Solved complex rational function problems</li>
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
                        <p><strong>Topic:</strong> Domain and Range of Rational Functions</p>
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
                    <p><strong>Topic:</strong> Domain and Range of Rational Functions</p>
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

// Update lesson completion status to show topic completion option
function drrfUpdateLessonCompletionStatus() {
    const navBtns = document.querySelectorAll('.lesson-nav-btn');
    navBtns.forEach(btn => {
        const lesson = parseInt(btn.getAttribute('data-lesson') || '0', 10);
        btn.classList.toggle('completed', drrfCompletedLessons.has(lesson));
        const icon = btn.querySelector('.w-16');
        if (icon && drrfCompletedLessons.has(lesson)) {
            icon.classList.add('bg-green-500', 'text-white');
            icon.classList.remove('bg-gray-300', 'text-gray-600');
        }
    });
    drrfUpdateCompletionButtonsUI();
    
    // Show topic completion option if all lessons are completed
    drrfShowTopicCompletionOption();
}

// Expose topic completion functions
window.drrfCompleteTopic = drrfCompleteTopic;
window.drrfShowTopicCompletionOption = drrfShowTopicCompletionOption;
