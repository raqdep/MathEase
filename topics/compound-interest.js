// Compound Interest - Interactive JavaScript

// ------------------------------
// Lesson Navigation & Completion
// ------------------------------
let ciCurrentLesson = 1;
let ciCompletedLessons = new Set();
const ciTotalLessons = 5;

// ------------------------------
// Quiz System - 5 questions per topic
// ------------------------------
const ciLesson1Quiz = [
    {
        question: "What is compound interest?",
        options: [
            "Interest calculated only on the principal amount",
            "Interest calculated on principal and previously earned interest",
            "Interest that never changes",
            "Interest calculated monthly only"
        ],
        correct: 1
    },
    {
        question: "What is the formula for compound interest?",
        options: [
            "A = P(1 + r/n)^(nt)",
            "A = P + rt",
            "A = P(1 + rt)",
            "A = P × r × t"
        ],
        correct: 0
    },
    {
        question: "In the formula A = P(1 + r/n)^(nt), what does 'n' represent?",
        options: [
            "Number of times interest is compounded per year",
            "Number of years",
            "Principal amount",
            "Interest rate"
        ],
        correct: 0
    },
    {
        question: "If P = ₱10,000, r = 5%, n = 4 (quarterly), t = 2 years, what is A?",
        options: [
            "₱11,025",
            "₱11,050",
            "₱11,038",
            "₱11,000"
        ],
        correct: 2
    },
    {
        question: "How does compound interest differ from simple interest?",
        options: [
            "Compound interest grows exponentially, simple interest grows linearly",
            "They are the same",
            "Simple interest is always higher",
            "Compound interest is only for loans"
        ],
        correct: 0
    }
];

const ciLesson2Quiz = [
    {
        question: "What does 'r' represent in the compound interest formula?",
        options: [
            "Annual interest rate as a decimal",
            "Monthly interest rate",
            "Total interest earned",
            "Number of compounding periods"
        ],
        correct: 0
    },
    {
        question: "If r = 6%, what is the decimal form?",
        options: [
            "0.06",
            "0.6",
            "6.0",
            "0.006"
        ],
        correct: 0
    },
    {
        question: "What happens to the final amount when compounding frequency increases?",
        options: [
            "It increases",
            "It decreases",
            "It stays the same",
            "It becomes zero"
        ],
        correct: 0
    },
    {
        question: "If P = ₱20,000, r = 8%, n = 12 (monthly), t = 3 years, calculate A.",
        options: [
            "₱25,400",
            "₱25,408",
            "₱25,500",
            "₱24,800"
        ],
        correct: 1
    },
    {
        question: "What is the relationship between compounding frequency and final amount?",
        options: [
            "More frequent compounding results in higher final amount",
            "Less frequent compounding results in higher final amount",
            "Frequency doesn't affect the final amount",
            "Frequency only affects simple interest"
        ],
        correct: 0
    }
];

const ciLesson3Quiz = [
    {
        question: "What does 'n = 1' mean in compound interest?",
        options: [
            "Compounded annually",
            "Compounded monthly",
            "Compounded daily",
            "Compounded quarterly"
        ],
        correct: 0
    },
    {
        question: "What does 'n = 4' mean?",
        options: [
            "Compounded quarterly",
            "Compounded monthly",
            "Compounded annually",
            "Compounded daily"
        ],
        correct: 0
    },
    {
        question: "What does 'n = 12' mean?",
        options: [
            "Compounded monthly",
            "Compounded quarterly",
            "Compounded annually",
            "Compounded weekly"
        ],
        correct: 0
    },
    {
        question: "Which compounding frequency gives the highest final amount for the same rate and time?",
        options: [
            "Daily (n = 365)",
            "Monthly (n = 12)",
            "Quarterly (n = 4)",
            "Annually (n = 1)"
        ],
        correct: 0
    },
    {
        question: "If ₱10,000 is invested at 6% for 5 years, which gives more: annually or monthly compounding?",
        options: [
            "Monthly compounding gives more",
            "Annually compounding gives more",
            "They give the same amount",
            "Cannot be determined"
        ],
        correct: 0
    }
];

const ciLesson4Quiz = [
    {
        question: "What is Future Value (FV)?",
        options: [
            "The value of money at a future date",
            "The current value of money",
            "The interest rate",
            "The principal amount"
        ],
        correct: 0
    },
    {
        question: "What is Present Value (PV)?",
        options: [
            "The current value of money to be received in the future",
            "The future value of money",
            "The interest earned",
            "The compounding frequency"
        ],
        correct: 0
    },
    {
        question: "What is the formula for Present Value?",
        options: [
            "PV = FV / (1 + r/n)^(nt)",
            "PV = FV × (1 + r/n)^(nt)",
            "PV = FV + r",
            "PV = FV - r"
        ],
        correct: 0
    },
    {
        question: "If FV = ₱10,000, r = 6%, n = 12, t = 2 years, what is PV?",
        options: [
            "₱8,884",
            "₱9,000",
            "₱8,500",
            "₱9,500"
        ],
        correct: 0
    },
    {
        question: "What does the time value of money concept state?",
        options: [
            "Money today is worth more than the same amount in the future",
            "Money in the future is worth more",
            "Money value never changes",
            "Money value depends only on interest rate"
        ],
        correct: 0
    }
];

const ciLesson5Quiz = [
    {
        question: "Which scenario best demonstrates compound interest?",
        options: [
            "Long-term investment in a savings account",
            "Short-term loan",
            "Cash payment",
            "One-time deposit"
        ],
        correct: 0
    },
    {
        question: "In retirement planning, why is compound interest important?",
        options: [
            "It allows money to grow exponentially over time",
            "It keeps money the same",
            "It reduces money over time",
            "It only works for short periods"
        ],
        correct: 0
    },
    {
        question: "For a loan with compound interest, what happens to the total amount over time?",
        options: [
            "It increases exponentially",
            "It decreases",
            "It stays constant",
            "It becomes zero"
        ],
        correct: 0
    },
    {
        question: "If you invest ₱50,000 at 8% compounded quarterly for 5 years, what is the final amount?",
        options: [
            "₱74,297",
            "₱70,000",
            "₱75,000",
            "₱73,000"
        ],
        correct: 0
    },
    {
        question: "What is a key advantage of compound interest for investors?",
        options: [
            "Exponential growth over time",
            "Linear growth",
            "No growth",
            "Immediate returns only"
        ],
        correct: 0
    }
];

// ------------------------------
// Sidebar Navigation
// ------------------------------
function ciInitializeSidebar() {
    // Handle topic header clicks - show lesson when clicked
    document.querySelectorAll('.lesson-topic-header').forEach(header => {
        header.addEventListener('click', function(e) {
            const topic = this.closest('.lesson-topic');
            const lessonNum = parseInt(topic.dataset.lesson);
            
            if (topic.classList.contains('locked')) {
                ciShowTopicLockedMessage(lessonNum);
                return;
            }
            
            // Show the lesson
            ciShowLesson(lessonNum);
            ciSetSidebarActive(lessonNum, 'objective');
            
            // Toggle expansion
            const isExpanded = topic.classList.contains('expanded');
            document.querySelectorAll('.lesson-topic').forEach(t => t.classList.remove('expanded'));
            
            if (!isExpanded) {
                topic.classList.add('expanded');
                this.setAttribute('aria-expanded', 'true');
            } else {
                this.setAttribute('aria-expanded', 'false');
            }
            
            // Close mobile sidebar
            const sidebar = document.getElementById('lessonSidebar');
            const backdrop = document.getElementById('mobileBackdrop');
            if (sidebar && window.innerWidth < 1024) {
                sidebar.classList.remove('open');
                if (backdrop) backdrop.classList.add('hidden');
            }
        });
    });
    
    // Handle subitem clicks
    document.querySelectorAll('.lesson-subitem').forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent topic header click
            
            const lessonNum = parseInt(this.dataset.lesson);
            const section = this.dataset.section;
            
            if (this.closest('.lesson-topic').classList.contains('locked')) {
                ciShowTopicLockedMessage(lessonNum);
                return;
            }
            
            ciShowLesson(lessonNum);
            ciSetSidebarActive(lessonNum, section);
            
            // Close mobile sidebar
            const sidebar = document.getElementById('lessonSidebar');
            const backdrop = document.getElementById('mobileBackdrop');
            if (sidebar && window.innerWidth < 1024) {
                sidebar.classList.remove('open');
                if (backdrop) backdrop.classList.add('hidden');
            }
        });
    });
    
    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('lessonSidebar');
    const backdrop = document.getElementById('mobileBackdrop');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            if (backdrop) backdrop.classList.toggle('hidden');
        });
        
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                sidebar.classList.remove('open');
                backdrop.classList.add('hidden');
            });
        }
    }
}

function ciSetSidebarActive(lessonNum, section) {
    // Update all subitems
    document.querySelectorAll('.lesson-subitem').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.dataset.lesson) === lessonNum && item.dataset.section === section) {
            item.classList.add('active');
        }
    });
    
    // Expand the topic
    const topic = document.getElementById(`sidebar-topic-${lessonNum}`);
    if (topic) {
        document.querySelectorAll('.lesson-topic').forEach(t => t.classList.remove('expanded'));
        topic.classList.add('expanded');
        const header = topic.querySelector('.lesson-topic-header');
        if (header) header.setAttribute('aria-expanded', 'true');
    }
}

function ciUpdateSidebarProgress() {
    for (let i = 1; i <= ciTotalLessons; i++) {
        const topic = document.getElementById(`sidebar-topic-${i}`);
        if (!topic) continue;
        
        const progressText = topic.querySelector('.topic-status-text');
        if (progressText) {
            if (ciCompletedLessons.has(i)) {
                progressText.textContent = '✓';
            } else {
                // Empty string for accessible but incomplete topics (matching functions.html)
                progressText.textContent = '';
            }
        }
        
        const dot = topic.querySelector('.lesson-topic-dot');
        if (dot) {
            if (ciCompletedLessons.has(i)) {
                dot.classList.add('completed');
            } else {
                dot.classList.remove('completed');
                dot.textContent = i;
            }
        }
    }
}

function ciCanAccessTopic(topicNum) {
    if (topicNum === 1) return true;
    return ciCompletedLessons.has(topicNum - 1);
}

function ciShowTopicLockedMessage(topicNum) {
    Swal.fire({
        icon: 'lock',
        title: 'Topic Locked',
        text: `Please complete Topic ${topicNum - 1} first to unlock this topic.`,
        confirmButtonColor: '#667eea'
    });
}

function ciUnlockTopics() {
    for (let i = 1; i <= ciTotalLessons; i++) {
        const topic = document.getElementById(`sidebar-topic-${i}`);
        if (!topic) continue;
        
        if (ciCanAccessTopic(i)) {
            topic.classList.remove('locked');
        } else {
            topic.classList.add('locked');
        }
    }
}

// ------------------------------
// Lesson Display & Navigation
// ------------------------------
async function ciShowLesson(lessonNum) {
    // Stop timer intervals before switching
    if (ciTimerUpdateInterval) {
        clearInterval(ciTimerUpdateInterval);
        ciTimerUpdateInterval = null;
    }
    if (ciStudyTimeInterval) {
        clearInterval(ciStudyTimeInterval);
        ciStudyTimeInterval = null;
    }
    
    // Save study time for previous lesson before switching
    if (ciCurrentLesson && !ciCompletedLessons.has(ciCurrentLesson)) {
        ciSaveStudyTimeForCurrentLesson();
    }
    
    ciCurrentLesson = lessonNum;
    
    // Hide all lessons
    document.querySelectorAll('.lesson-section').forEach(s => s.classList.remove('active'));
    
    // Show selected lesson
    const lesson = document.getElementById(`lesson${lessonNum}`);
    if (lesson) {
        lesson.classList.add('active');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Load study time for this lesson
        await ciLoadAndDisplayStudyTime();
        
        // Start timer
        ciStartLiveTimer();
        
        // Update sidebar
        ciSetSidebarActive(lessonNum, 'objective');
        
        // Show/hide Topic 5 quiz button
        const topic5QuizButton = document.getElementById('topic5QuizButton');
        if (topic5QuizButton) {
            if (lessonNum === 5 && !ciCompletedLessons.has(5)) {
                topic5QuizButton.style.display = 'block';
            } else {
                topic5QuizButton.style.display = 'none';
            }
        }
    }
    
    ciUpdateNavigationButtons();
    ciUpdateSidebarProgress();
}

function ciUpdateNavigationButtons() {
    const prevBtn = document.querySelector('#prevLessonBtn');
    const nextBtn = document.querySelector('#nextLessonBtn');
    const currentNum = document.querySelector('#currentLessonNum');
    const progressBar = document.querySelector('#lessonProgressBar');
    
    if (prevBtn) {
        prevBtn.disabled = ciCurrentLesson <= 1;
    }
    
    if (nextBtn) {
        // Never disable next button
        nextBtn.disabled = false;
    }
    
    if (currentNum) {
        currentNum.textContent = ciCurrentLesson;
    }
    
    if (progressBar) {
        progressBar.style.width = `${(ciCurrentLesson / ciTotalLessons) * 100}%`;
    }
}

function ciNavigateLesson(dir) {
    const next = ciCurrentLesson + dir;
    
    // If moving forward
    if (dir > 0) {
        // If current lesson is not completed, show quiz first
        if (!ciCompletedLessons.has(ciCurrentLesson)) {
            ciRunLessonQuiz(ciCurrentLesson);
            return;
        }
        
        // Check if next topic is accessible
        if (!ciCanAccessTopic(next)) {
            ciShowTopicLockedMessage(next);
            return;
        }
        
        // If it's the last topic, show message
        if (next > ciTotalLessons) {
            Swal.fire({
                icon: 'info',
                title: 'All Topics Completed!',
                text: 'You have completed all topics. Great job!',
                confirmButtonColor: '#667eea'
            });
            return;
        }
    }
    
    // Navigate to the lesson
    if (next >= 1 && next <= ciTotalLessons) {
        ciShowLesson(next);
    }
}

// ------------------------------
// Quiz System
// ------------------------------
// Fisher-Yates shuffle algorithm
function ciShuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function ciShuffleQuiz(quizArray) {
    // Shuffle questions
    const shuffledQuestions = ciShuffleArray(quizArray);
    
    // Shuffle options for each question and update correct index
    return shuffledQuestions.map(quiz => {
        const options = [...quiz.options];
        const correctAnswer = options[quiz.correct];
        const shuffledOptions = ciShuffleArray(options);
        const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);
        
        return {
            ...quiz,
            options: shuffledOptions,
            correct: newCorrectIndex
        };
    });
}

function ciGenerateExplanation(quiz, selectedAnswer) {
    const isCorrect = selectedAnswer === quiz.correct;
    const correctText = quiz.options[quiz.correct];
    
    if (isCorrect) {
        return `Correct! ${correctText} is the right answer.`;
    } else {
        return `Incorrect. The correct answer is: ${correctText}`;
    }
}

async function ciRunLessonQuiz(lessonNum) {
    const quizArray = [
        ciLesson1Quiz,
        ciLesson2Quiz,
        ciLesson3Quiz,
        ciLesson4Quiz,
        ciLesson5Quiz
    ][lessonNum - 1];
    
    if (!quizArray) return false;
    
    // Track quiz start time
    window.ciQuizStartTime = Date.now();
    
    // Shuffle quiz questions and options
    const shuffledQuiz = ciShuffleQuiz(quizArray);
    
    let currentQuestion = 0;
    let score = 0;
    const totalQuestions = shuffledQuiz.length;
    const userAnswers = [];
    
    // Show quiz introduction dialog
    Swal.fire({
        title: `Topic ${lessonNum} Quiz`,
        html: `
            <div class="text-left space-y-4">${typeof mathEaseQuizIntroBanner === 'function' ? mathEaseQuizIntroBanner() : ''}
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border-l-4 border-blue-500">
                    <h4 class="text-lg font-bold text-gray-800 mb-3">
                        <i class="fas fa-info-circle text-blue-500 mr-2"></i>Purpose of these Questions
                    </h4>
                    <p class="text-base text-gray-700 mb-3">
                        Before you can proceed to the next topic, we need to make sure you understand the key concepts from Topic ${lessonNum}.
                    </p>
                    <ul class="text-sm text-gray-700 space-y-2 list-none">
                        <li class="flex items-start">
                            <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
                            <span><strong>Test Your Understanding:</strong> Verify that you've grasped the fundamental concepts</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
                            <span><strong>Ensure Readiness:</strong> Make sure you're prepared for the next topic</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
                            <span><strong>Identify Learning Gaps:</strong> Help you recognize which areas might need more review</span>
                        </li>
                    </ul>
                </div>
                
                <div class="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-5 border-l-4 border-yellow-500">
                    <h4 class="text-lg font-bold text-gray-800 mb-2">
                        <i class="fas fa-trophy text-yellow-500 mr-2"></i>Quiz Requirements
                    </h4>
                    <div class="space-y-2 text-sm text-gray-700">
                        <p><strong>Total Questions:</strong> ${totalQuestions} questions about Topic ${lessonNum}</p>
                        <p><strong>Passing Score:</strong> At least ${Math.ceil(totalQuestions * 0.6)} out of ${totalQuestions} correct answers (60%)</p>
                        <p><strong>What Happens:</strong></p>
                        <ul class="list-disc list-inside ml-4 space-y-1">
                            <li>If you pass → You can proceed to the next topic</li>
                            <li>If you fail → You'll need to review this topic and try again</li>
                        </ul>
                    </div>
                </div>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'Start Questions',
        confirmButtonColor: '#667eea',
        cancelButtonText: 'Cancel',
        showCancelButton: true,
        cancelButtonColor: '#ef4444',
        allowOutsideClick: false,
        width: '700px',
        customClass: {
            popup: 'rounded-2xl shadow-2xl',
            title: 'text-slate-800 text-2xl font-bold',
            htmlContainer: 'text-left',
            confirmButton: 'px-6 py-3 rounded-lg font-semibold',
            cancelButton: 'px-6 py-3 rounded-lg font-semibold'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            displayQuestion();
        } else {
            // User cancelled, return to current lesson
            ciShowLesson(lessonNum);
        }
    });
    
    function displayQuestion() {
        if (currentQuestion >= totalQuestions) {
            showQuizResults();
            return;
        }
        
        const q = shuffledQuiz[currentQuestion];
        const optionsHtml = q.options.map((opt, idx) => 
            `<button type="button" class="quiz-option w-full text-left px-5 py-4 mb-3 bg-white border-2 border-gray-300 rounded-lg hover:border-primary hover:bg-blue-50 transition-all duration-200 font-medium text-gray-800 shadow-sm hover:shadow-md" data-answer="${idx}">
                <div class="flex items-center">
                    <span class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-sm font-semibold text-gray-600">${String.fromCharCode(65 + idx)}</span>
                    <span>${opt}</span>
                </div>
            </button>`
        ).join('');
        
        Swal.fire({
            title: `Question ${currentQuestion + 1} of ${totalQuestions}`,
            html: `
                <div class="text-left">
                    <div class="mb-6">
                        <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div class="bg-primary h-2 rounded-full transition-all duration-300" style="width: ${((currentQuestion + 1) / totalQuestions) * 100}%"></div>
                        </div>
                        <p class="text-sm text-gray-600 text-center">Progress: ${currentQuestion + 1}/${totalQuestions}</p>
                    </div>
                    <p class="text-xl font-semibold mb-6 text-gray-900 leading-relaxed">${q.question}</p>
                    <div class="space-y-3">
                        ${optionsHtml}
                    </div>
                </div>
            `,
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'Cancel Questions',
            cancelButtonColor: '#ef4444',
            allowOutsideClick: false,
            width: '750px',
            customClass: {
                popup: 'rounded-2xl shadow-2xl',
                title: 'text-slate-800 text-2xl font-bold mb-4',
                htmlContainer: 'text-left',
                cancelButton: 'px-6 py-3 rounded-lg font-semibold'
            },
            didOpen: () => {
                const questionIndex = currentQuestion;
                const currentQuiz = shuffledQuiz[questionIndex];
                
                document.querySelectorAll('.quiz-option').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const selectedAnswer = parseInt(this.dataset.answer);
                        const selectedText = currentQuiz.options[selectedAnswer];
                        const correctText = currentQuiz.options[currentQuiz.correct];
                        const isCorrect = selectedAnswer === currentQuiz.correct;
                        
                        userAnswers[questionIndex] = {
                            question: currentQuiz.question,
                            selected: selectedAnswer,
                            selectedText: selectedText,
                            correct: currentQuiz.correct,
                            correctText: correctText,
                            isCorrect: isCorrect,
                            explanation: ciGenerateExplanation(currentQuiz, selectedAnswer)
                        };
                        
                        if (isCorrect) {
                            score++;
                        }
                        
                        // Disable all options (no color feedback during quiz)
                        document.querySelectorAll('.quiz-option').forEach(b => {
                            b.disabled = true;
                            // Add subtle opacity to selected option to show it was chosen
                            if (parseInt(b.dataset.answer) === selectedAnswer) {
                                b.style.opacity = '0.75';
                            }
                        });
                        
                        // Move to next question faster (no feedback to show)
                        setTimeout(() => {
                            currentQuestion++;
                            displayQuestion();
                        }, 300);
                    });
                });
            }
        }).then((result) => {
            if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
                Swal.fire({
                    title: 'Cancel Questions?',
                    text: 'Are you sure you want to cancel? You will need to take the quiz again to proceed.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#ef4444',
                    cancelButtonColor: '#667eea',
                    confirmButtonText: 'Yes, cancel',
                    cancelButtonText: 'No, continue'
                }).then((confirmResult) => {
                    if (confirmResult.isConfirmed) {
                        ciShowLesson(lessonNum);
                    } else {
                        displayQuestion();
                    }
                });
            }
        });
    }
    
    function showQuizResults() {
        const passed = score >= Math.ceil(totalQuestions * 0.6);
        const percentage = Math.round((score / totalQuestions) * 100);
        
        Swal.fire({
            title: passed ? '🎉 Congratulations!' : '📚 Review Needed',
            html: `
                <div class="text-left space-y-4">
                    <div class="bg-gradient-to-r ${passed ? 'from-green-50 to-emerald-50' : 'from-yellow-50 to-orange-50'} rounded-lg p-5 border-l-4 ${passed ? 'border-green-500' : 'border-yellow-500'}">
                        <h4 class="text-lg font-bold text-gray-800 mb-3">
                            <i class="fas ${passed ? 'fa-check-circle text-green-500' : 'fa-exclamation-triangle text-yellow-500'} mr-2"></i>
                            Your Score: ${score}/${totalQuestions} (${percentage}%)
                        </h4>
                        <p class="text-gray-700">
                            ${passed 
                                ? `Great job! You've demonstrated a solid understanding of Topic ${lessonNum}. You can now proceed to the next topic.`
                                : `You scored ${percentage}%, but you need at least 60% to proceed. Please review Topic ${lessonNum} and try again.`
                            }
                        </p>
                    </div>
                </div>
            `,
            icon: passed ? 'success' : 'warning',
            confirmButtonText: passed ? 'Continue to Next Topic' : 'Review Topic',
            confirmButtonColor: passed ? '#667eea' : '#f59e0b',
            allowOutsideClick: false,
            width: '600px',
            customClass: {
                popup: 'rounded-2xl shadow-2xl',
                title: 'text-slate-800 text-2xl font-bold',
                htmlContainer: 'text-left'
            }
        }).then(async (result) => {
            if (passed) {
                // Calculate time taken
                const timeTakenSeconds = Math.floor((Date.now() - window.ciQuizStartTime) / 1000);
                
                // Store quiz data with enhanced information
                await ciStoreQuizData(lessonNum, score, totalQuestions, userAnswers, timeTakenSeconds);
                
                // Complete lesson
                await ciCompleteLesson(lessonNum);
                
                // Automatically navigate to next lesson if not the last one
                if (lessonNum < ciTotalLessons) {
                    setTimeout(() => {
                        ciShowLesson(lessonNum + 1);
                    }, 500);
                } else {
                    // If it's the last lesson, show performance analysis section
                    ciShowPerformanceAnalysisSection();
                }
            } else {
                // Show lesson again if failed
                ciShowLesson(lessonNum);
            }
        });
    }
}

async function ciStoreQuizData(lessonNum, score, totalQuestions, userAnswers, timeTakenSeconds = 0) {
    const quizData = {
        topic: 'compound-interest',
        lesson: lessonNum,
        score: score,
        totalQuestions: totalQuestions,
        percentage: (score / totalQuestions) * 100,
        answers: userAnswers.map(answer => ({
            question: answer.question,
            selected: answer.selected,
            selectedText: answer.selectedText,
            correct: answer.correct,
            correctText: answer.correctText,
            isCorrect: answer.isCorrect,
            explanation: answer.explanation
        })),
        time_taken_seconds: timeTakenSeconds,
        timestamp: new Date().toISOString()
    };
    
    try {
        const response = await fetch('../php/store-quiz-data.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(quizData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to store quiz data');
        }
        
        return true;
    } catch (error) {
        console.error('Error storing quiz data:', error);
        return false;
    }
}

// ------------------------------
// Timer Functions (matching functions.html)
// ------------------------------
let ciLessonStartTime = {};
let ciTotalStudyTime = {}; // Track total time per lesson in seconds
let ciLastSavedTime = {}; // Track last confirmed saved time from server (to prevent double counting)
let ciLastSaveTimestamp = {}; // Track when we last saved (to calculate elapsed correctly)
let ciStudyTimeInterval = null;
let ciTimerUpdateInterval = null; // For live timer display

function ciStartLiveTimer() {
    // Clear existing timer
    if (ciTimerUpdateInterval) {
        clearInterval(ciTimerUpdateInterval);
    }
    
    // Don't start timer if lesson is already completed
    if (ciCompletedLessons.has(ciCurrentLesson)) {
        ciUpdateLiveTimer(); // Just show final time
        return;
    }
    
    // Initialize start time if not set
    if (!ciLessonStartTime[ciCurrentLesson]) {
        ciLessonStartTime[ciCurrentLesson] = Date.now();
    }
    
    // Initialize last save timestamp if not set
    if (!ciLastSaveTimestamp[ciCurrentLesson]) {
        ciLastSaveTimestamp[ciCurrentLesson] = Date.now();
    }
    
    // Update timer immediately
    ciUpdateLiveTimer();
    
    // Update timer every second
    ciTimerUpdateInterval = setInterval(function() {
        // Stop if lesson becomes completed
        if (ciCompletedLessons.has(ciCurrentLesson)) {
            clearInterval(ciTimerUpdateInterval);
            ciTimerUpdateInterval = null;
            ciUpdateLiveTimer(); // Show final time
            return;
        }
        ciUpdateLiveTimer();
    }, 1000);
}

function ciUpdateLiveTimer() {
    if (!ciCurrentLesson) return;
    
    const section = document.getElementById(`lesson${ciCurrentLesson}`);
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
    if (ciCompletedLessons.has(ciCurrentLesson)) {
        // Show final time for completed lesson
        let finalTime = ciTotalStudyTime[ciCurrentLesson] || ciLastSavedTime[ciCurrentLesson] || 0;
        
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
        const progressCircle = section.querySelector('.timer-progress');
        if (progressCircle) {
            const maxTime = 3600; // 60 minutes in seconds
            const progress = Math.min(finalTime / maxTime, 1);
            const circumference = 2 * Math.PI * 34; // radius = 34
            const offset = circumference * (1 - progress);
            progressCircle.style.strokeDashoffset = offset;
            progressCircle.style.stroke = '#10b981'; // Green for completed
        }
        
        return;
    }
    
    // Calculate current elapsed time
    const now = Date.now();
    const currentSessionElapsed = Math.floor((now - ciLastSaveTimestamp[ciCurrentLesson]) / 1000);
    const totalElapsed = (ciLastSavedTime[ciCurrentLesson] || 0) + currentSessionElapsed;
    
    const hours = Math.floor(totalElapsed / 3600);
    const minutes = Math.floor((totalElapsed % 3600) / 60);
    const seconds = totalElapsed % 60;
    
    let timeDisplay = '';
    if (hours > 0) {
        timeDisplay = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
        timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    timerDisplay.textContent = timeDisplay;
    
    // Update circular progress
    const progressCircle = section.querySelector('.timer-progress');
    if (progressCircle) {
        const maxTime = 3600; // 60 minutes in seconds
        const progress = Math.min(totalElapsed / maxTime, 1);
        const circumference = 2 * Math.PI * 34; // radius = 34
        const offset = circumference * (1 - progress);
        progressCircle.style.strokeDashoffset = offset;
    }
}

function ciSaveStudyTimeForCurrentLesson() {
    if (!ciCurrentLesson || ciCompletedLessons.has(ciCurrentLesson)) return;
    
    const now = Date.now();
    if (!ciLastSaveTimestamp[ciCurrentLesson]) {
        ciLastSaveTimestamp[ciCurrentLesson] = now;
        return;
    }
    
    // Calculate elapsed time since last save
    const elapsedSinceLastSave = Math.floor((now - ciLastSaveTimestamp[ciCurrentLesson]) / 1000);
    
    if (elapsedSinceLastSave > 0) {
        // Add to total study time
        ciTotalStudyTime[ciCurrentLesson] = (ciTotalStudyTime[ciCurrentLesson] || 0) + elapsedSinceLastSave;
        
        // Update last saved time
        ciLastSavedTime[ciCurrentLesson] = ciTotalStudyTime[ciCurrentLesson];
        ciLastSaveTimestamp[ciCurrentLesson] = now;
        
        // Send to server
        ciSendStudyTimeToServer();
    }
}

async function ciSendStudyTimeToServer() {
    if (!ciCurrentLesson) return;
    
    const timeToSave = ciTotalStudyTime[ciCurrentLesson] || 0;
    if (timeToSave <= 0) return;
    
    try {
        const response = await fetch('../php/store-study-time.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                topic: 'compound-interest',
                study_time: {
                    [ciCurrentLesson]: timeToSave
                }
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Update last saved time after successful save
                ciLastSavedTime[ciCurrentLesson] = timeToSave;
                ciLastSaveTimestamp[ciCurrentLesson] = Date.now();
            }
        }
    } catch (error) {
        console.error('Error saving study time:', error);
    }
}

async function ciLoadAndDisplayStudyTime() {
    if (!ciCurrentLesson) return;
    
    try {
        const response = await fetch(`../php/get-study-time.php?topic=compound-interest&lesson=${ciCurrentLesson}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.study_time) {
                const savedTime = parseInt(data.study_time[ciCurrentLesson]) || 0;
                ciLastSavedTime[ciCurrentLesson] = savedTime;
                ciTotalStudyTime[ciCurrentLesson] = savedTime;
                ciLastSaveTimestamp[ciCurrentLesson] = Date.now();
                
                // Update display
                ciUpdateLiveTimer();
            }
        }
    } catch (error) {
        console.error('Error loading study time:', error);
    }
}

// ------------------------------
// Lesson Completion
// ------------------------------
async function ciLoadCompletedLessons() {
    try {
        const response = await fetch('../php/complete-lesson.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
                action: 'get_completed',
                topic: 'compound-interest' 
            })
        });
        
        const data = await response.json();
        if (data.success && data.completed_lessons) {
            ciCompletedLessons = new Set(data.completed_lessons);
            
            // Load study time for all completed lessons
            for (const lessonNum of ciCompletedLessons) {
                try {
                    const timeResponse = await fetch(`../php/get-study-time.php?topic=compound-interest&lesson=${lessonNum}`, {
                        credentials: 'include'
                    });
                    if (timeResponse.ok) {
                        const timeData = await timeResponse.json();
                        if (timeData.success && timeData.study_time) {
                            const savedTime = parseInt(timeData.study_time[lessonNum]) || 0;
                            ciLastSavedTime[lessonNum] = savedTime;
                            ciTotalStudyTime[lessonNum] = savedTime;
                            ciLastSaveTimestamp[lessonNum] = Date.now();
                        }
                    }
                } catch (e) {
                    console.error(`Error loading study time for lesson ${lessonNum}:`, e);
                }
            }
            
            ciUpdateSidebarProgress();
            ciUnlockTopics();
        }
    } catch (error) {
        // Fallback to localStorage
        const stored = localStorage.getItem('ci_completed_lessons');
        if (stored) {
            ciCompletedLessons = new Set(JSON.parse(stored));
            ciUpdateSidebarProgress();
            ciUnlockTopics();
        }
    }
}

async function ciCompleteLesson(lessonNum) {
    // Save final study time before marking as complete
    if (!ciCompletedLessons.has(lessonNum)) {
        ciSaveStudyTimeForCurrentLesson();
        await ciSendStudyTimeToServer();
    }
    
    ciCompletedLessons.add(lessonNum);
    
    // Stop timer intervals
    if (ciTimerUpdateInterval) {
        clearInterval(ciTimerUpdateInterval);
        ciTimerUpdateInterval = null;
    }
    if (ciStudyTimeInterval) {
        clearInterval(ciStudyTimeInterval);
        ciStudyTimeInterval = null;
    }
    
    // Clear start time for completed lesson
    delete ciLessonStartTime[lessonNum];
    
    // Update timer display to show final time (green)
    ciUpdateLiveTimer();
    
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
    
    // Save to backend
    try {
        await fetch('../php/complete-lesson.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                action: 'complete',
                topic: 'compound-interest',
                lesson: lessonNum
            })
        });
    } catch (error) {
        // Fallback to localStorage
        localStorage.setItem('ci_completed_lessons', JSON.stringify(Array.from(ciCompletedLessons)));
    }
    
    ciUpdateSidebarProgress();
    ciUnlockTopics();
    
    // Reload study time to ensure correct display
    await ciLoadAndDisplayStudyTime();
    ciUpdateLiveTimer();
    
    // Retry if timer still shows 00:00
    setTimeout(async () => {
        const timerDisplay = section?.querySelector('.lesson-timer-display');
        if (timerDisplay && timerDisplay.textContent === '00:00') {
            await ciLoadAndDisplayStudyTime();
            ciUpdateLiveTimer();
        }
    }, 500);
    
    // Show performance analysis section if all quizzes are completed
    ciShowPerformanceAnalysisSection();
}

// ------------------------------
// Performance Analysis (Custom AI - matching functions.html)
// ------------------------------
function ciShowPerformanceAnalysisSection() {
    // Check if all 5 topics are completed
    if (ciCompletedLessons.size !== ciTotalLessons) {
        console.log('Performance analysis will only show after completing all quizzes. Current completed:', ciCompletedLessons.size, '/', ciTotalLessons);
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

async function ciAnalyzePerformance() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultSection = document.getElementById('analysisResult');
    
    // Show loading state
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
    }
    
    try {
        const response = await fetch(`../php/analyze-quiz-performance.php?topic=compound-interest`, {
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
            ciDisplayPerformanceAnalysis(result.analysis);
        } else {
            throw new Error(result.message || 'Failed to analyze performance');
        }
    } catch (error) {
        console.error('Error analyzing performance:', error);
        if (resultSection) {
            resultSection.classList.remove('hidden');
            resultSection.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p class="text-red-700">Error: ${error.message || 'Could not analyze performance. Please try again later.'}</p>
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

function ciDisplayPerformanceAnalysis(analysis) {
    const resultSection = document.getElementById('analysisResult');
    if (!resultSection) return;
    
    resultSection.classList.remove('hidden');
    resultSection.innerHTML = analysis;
}

function ciShowTopic5Quiz() {
    if (ciCompletedLessons.has(5)) {
        Swal.fire({
            icon: 'info',
            title: 'Quiz Already Completed',
            text: 'You have already completed Topic 5 quiz.',
            confirmButtonColor: '#667eea'
        });
        return;
    }
    
    ciRunLessonQuiz(5);
}

// ------------------------------
// Compound Interest Calculator
// ------------------------------
let growthChart = null;

function calculateCompoundInterest() {
    const principal = parseFloat(document.getElementById('principal')?.value) || 0;
    const rate = parseFloat(document.getElementById('rate')?.value) || 0;
    const time = parseFloat(document.getElementById('time')?.value) || 0;
    const frequency = parseInt(document.getElementById('frequency')?.value) || 1;

    const r = rate / 100;
    const rOverN = r / frequency;
    const nt = frequency * time;
    const onePlusROverN = 1 + rOverN;
    const powerResult = Math.pow(onePlusROverN, nt);
    const amount = principal * powerResult;
    const interest = amount - principal;

    // Update results with animation
    const amountEl = document.getElementById('compoundAmountResult');
    const interestEl = document.getElementById('compoundInterestResult');
    if (amountEl) {
        amountEl.textContent = '₱ ' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        amountEl.classList.add('updated');
        setTimeout(() => amountEl.classList.remove('updated'), 600);
    }
    if (interestEl) {
        interestEl.textContent = '₱ ' + interest.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        interestEl.classList.add('updated');
        setTimeout(() => interestEl.classList.remove('updated'), 600);
    }

    // Update visual breakdown
    updateVisualBreakdown(principal, amount, interest);

    // Update step-by-step calculation
    updateStepByStep(principal, rate, r, frequency, time, rOverN, nt, onePlusROverN, powerResult, amount);

    // Update year-by-year amounts
    updateYearlyAmounts(principal, r, frequency, time);

    // Update comparison
    updateComparison(principal, rate, time, amount);

    // Update chart
    updateGrowthChart(principal, r, frequency, time);
}

function updateVisualBreakdown(principal, amount, interest) {
    const principalBar = document.getElementById('principalBar');
    const interestBar = document.getElementById('interestBar');
    const principalBarText = document.getElementById('principalBarText');
    const interestBarText = document.getElementById('interestBarText');
    const principalPercent = document.getElementById('principalPercent');
    const interestPercent = document.getElementById('interestPercent');

    if (amount > 0) {
        const principalPct = (principal / amount) * 100;
        const interestPct = (interest / amount) * 100;

        if (principalBar) {
            principalBar.style.width = principalPct + '%';
            if (principalBarText) principalBarText.textContent = '₱' + principal.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        if (interestBar) {
            interestBar.style.width = interestPct + '%';
            if (interestBarText) interestBarText.textContent = '₱' + interest.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        if (principalPercent) principalPercent.textContent = principalPct.toFixed(1) + '%';
        if (interestPercent) interestPercent.textContent = interestPct.toFixed(1) + '%';
    }
}

function updateStepByStep(principal, rate, r, frequency, time, rOverN, nt, onePlusROverN, powerResult, amount) {
    const stepRate = document.getElementById('stepRate');
    const stepRateDecimal = document.getElementById('stepRateDecimal');
    const stepRateOverN = document.getElementById('stepRateOverN');
    const stepN = document.getElementById('stepN');
    const stepRateOverNResult = document.getElementById('stepRateOverNResult');
    const stepN2 = document.getElementById('stepN2');
    const stepT = document.getElementById('stepT');
    const stepNTResult = document.getElementById('stepNTResult');
    const stepOnePlusR = document.getElementById('stepOnePlusR');
    const stepOnePlusRResult = document.getElementById('stepOnePlusRResult');
    const stepPower = document.getElementById('stepPower');
    const stepPowerResult = document.getElementById('stepPowerResult');
    const stepP = document.getElementById('stepP');
    const stepFinalMult = document.getElementById('stepFinalMult');
    const stepFinalAmount = document.getElementById('stepFinalAmount');

    if (stepRate) stepRate.textContent = rate.toFixed(1);
    if (stepRateDecimal) stepRateDecimal.textContent = r.toFixed(4);
    if (stepRateOverN) stepRateOverN.textContent = r.toFixed(4);
    if (stepN) stepN.textContent = frequency;
    if (stepRateOverNResult) stepRateOverNResult.textContent = rOverN.toFixed(6);
    if (stepN2) stepN2.textContent = frequency;
    if (stepT) stepT.textContent = time;
    if (stepNTResult) stepNTResult.textContent = nt;
    if (stepOnePlusR) stepOnePlusR.textContent = rOverN.toFixed(6);
    if (stepOnePlusRResult) stepOnePlusRResult.textContent = onePlusROverN.toFixed(6);
    if (stepPower) stepPower.textContent = nt;
    if (stepPowerResult) stepPowerResult.textContent = powerResult.toFixed(6);
    if (stepP) stepP.textContent = principal.toLocaleString();
    if (stepFinalMult) stepFinalMult.textContent = powerResult.toFixed(6);
    if (stepFinalAmount) stepFinalAmount.textContent = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function updateYearlyAmounts(principal, r, frequency, time) {
    const maxYears = Math.min(Math.ceil(time), 10);
    const y1 = document.getElementById('year1Amount');
    const y2 = document.getElementById('year2Amount');
    const y3 = document.getElementById('year3Amount');
    
    if (y1 && maxYears >= 1) {
        const year1 = principal * Math.pow(1 + r / frequency, frequency * 1);
        y1.textContent = '₱' + year1.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    if (y2 && maxYears >= 2) {
        const year2 = principal * Math.pow(1 + r / frequency, frequency * 2);
        y2.textContent = '₱' + year2.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    if (y3 && maxYears >= 3) {
        const year3 = principal * Math.pow(1 + r / frequency, frequency * 3);
        y3.textContent = '₱' + year3.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}

function updateComparison(principal, rate, time, compoundAmount) {
    // Calculate simple interest
    const simpleInterest = principal * (rate / 100) * time;
    const simpleAmount = principal + simpleInterest;
    const difference = compoundAmount - simpleAmount;
    const differencePercent = ((difference / simpleAmount) * 100);

    const compoundTotal = document.getElementById('compoundTotal');
    const simpleTotal = document.getElementById('simpleTotal');
    const interestDifference = document.getElementById('interestDifference');
    const differencePercentEl = document.getElementById('differencePercent');

    if (compoundTotal) {
        compoundTotal.textContent = '₱' + compoundAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    if (simpleTotal) {
        simpleTotal.textContent = '₱' + simpleAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    if (interestDifference) {
        interestDifference.textContent = '₱' + difference.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        interestDifference.classList.add('updated');
        setTimeout(() => interestDifference.classList.remove('updated'), 600);
    }
    if (differencePercentEl) {
        differencePercentEl.textContent = differencePercent.toFixed(2) + '% more with compound interest!';
    }
}

function updateGrowthChart(principal, r, frequency, time) {
    const ctx = document.getElementById('growthChart');
    if (!ctx) return;
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded');
        return;
    }

    const maxYears = Math.min(Math.ceil(time), 10);
    const labels = [];
    const compoundData = [];
    const simpleData = [];

    for (let year = 0; year <= maxYears; year++) {
        labels.push(year === 0 ? 'Start' : `Year ${year}`);
        const compoundValue = principal * Math.pow(1 + r / frequency, frequency * year);
        const simpleValue = principal * (1 + (r * year));
        compoundData.push(compoundValue);
        simpleData.push(simpleValue);
    }

    if (growthChart) {
        growthChart.destroy();
    }

    growthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Compound Interest',
                data: compoundData,
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7
            }, {
                label: 'Simple Interest',
                data: simpleData,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                borderDash: [5, 5],
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ₱' + context.parsed.y.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Slider Update Functions
function updatePrincipalFromSlider() {
    const slider = document.getElementById('principalSlider');
    const input = document.getElementById('principal');
    const display = document.getElementById('principalDisplay');
    if (slider && input) {
        input.value = slider.value;
        if (display) display.textContent = '₱' + parseInt(slider.value).toLocaleString();
        calculateCompoundInterest();
    }
}

function updateRateFromSlider() {
    const slider = document.getElementById('rateSlider');
    const input = document.getElementById('rate');
    const display = document.getElementById('rateDisplay');
    if (slider && input) {
        input.value = slider.value;
        if (display) display.textContent = parseFloat(slider.value).toFixed(1) + '%';
        calculateCompoundInterest();
    }
}

function updateTimeFromSlider() {
    const slider = document.getElementById('timeSlider');
    const input = document.getElementById('time');
    const display = document.getElementById('timeDisplay');
    if (slider && input) {
        input.value = slider.value;
        if (display) {
            const years = parseFloat(slider.value);
            display.textContent = years === 1 ? '1 year' : years + ' years';
        }
        calculateCompoundInterest();
    }
}

// Sync input fields with sliders
document.addEventListener('DOMContentLoaded', function() {
    const principalInput = document.getElementById('principal');
    const principalSlider = document.getElementById('principalSlider');
    const rateInput = document.getElementById('rate');
    const rateSlider = document.getElementById('rateSlider');
    const timeInput = document.getElementById('time');
    const timeSlider = document.getElementById('timeSlider');

    if (principalInput && principalSlider) {
        principalInput.addEventListener('input', function() {
            principalSlider.value = this.value;
            const display = document.getElementById('principalDisplay');
            if (display) display.textContent = '₱' + parseInt(this.value).toLocaleString();
        });
    }

    if (rateInput && rateSlider) {
        rateInput.addEventListener('input', function() {
            rateSlider.value = this.value;
            const display = document.getElementById('rateDisplay');
            if (display) display.textContent = parseFloat(this.value).toFixed(1) + '%';
        });
    }

    if (timeInput && timeSlider) {
        timeInput.addEventListener('input', function() {
            timeSlider.value = this.value;
            const display = document.getElementById('timeDisplay');
            if (display) {
                const years = parseFloat(this.value);
                display.textContent = years === 1 ? '1 year' : years + ' years';
            }
        });
    }
});

// Preset Examples
function setPresetExample(principal, rate, time, frequency) {
    const principalInput = document.getElementById('principal');
    const rateInput = document.getElementById('rate');
    const timeInput = document.getElementById('time');
    const frequencySelect = document.getElementById('frequency');
    const principalSlider = document.getElementById('principalSlider');
    const rateSlider = document.getElementById('rateSlider');
    const timeSlider = document.getElementById('timeSlider');

    if (principalInput) {
        principalInput.value = principal;
        if (principalSlider) principalSlider.value = principal;
        const display = document.getElementById('principalDisplay');
        if (display) display.textContent = '₱' + principal.toLocaleString();
    }
    if (rateInput) {
        rateInput.value = rate;
        if (rateSlider) rateSlider.value = rate;
        const display = document.getElementById('rateDisplay');
        if (display) display.textContent = rate.toFixed(1) + '%';
    }
    if (timeInput) {
        timeInput.value = time;
        if (timeSlider) timeSlider.value = time;
        const display = document.getElementById('timeDisplay');
        if (display) display.textContent = time === 1 ? '1 year' : time + ' years';
    }
    if (frequencySelect) frequencySelect.value = frequency;

    // Animate the update
    setTimeout(() => {
        calculateCompoundInterest();
    }, 100);
}

// Tutorial Function
function showCalculatorTutorial() {
    Swal.fire({
        title: '📚 How to Use the Calculator',
        html: `
            <div class="text-left space-y-4">
                <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <h4 class="font-bold text-gray-800 mb-2">Step 1: Enter Your Values</h4>
                    <p class="text-sm text-gray-700">Use the input fields or sliders to set:</p>
                    <ul class="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                        <li><strong>Principal:</strong> Your initial investment amount</li>
                        <li><strong>Annual Rate:</strong> Interest rate per year (as percentage)</li>
                        <li><strong>Time:</strong> Number of years</li>
                        <li><strong>Frequency:</strong> How often interest is compounded</li>
                    </ul>
                </div>
                <div class="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                    <h4 class="font-bold text-gray-800 mb-2">Step 2: Try Preset Examples</h4>
                    <p class="text-sm text-gray-700">Click the preset buttons to see real-world scenarios like college funds, retirement savings, and more!</p>
                </div>
                <div class="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <h4 class="font-bold text-gray-800 mb-2">Step 3: Explore the Results</h4>
                    <p class="text-sm text-gray-700">Watch the visual breakdown, growth chart, and comparison with simple interest update in real-time!</p>
                </div>
                <div class="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                    <p class="text-sm text-gray-700"><strong>💡 Tip:</strong> Experiment with different compounding frequencies to see how they affect your final amount!</p>
                </div>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'Got it!',
        confirmButtonColor: '#667eea',
        width: '600px',
        customClass: {
            popup: 'rounded-2xl',
            title: 'text-slate-800 text-xl',
            htmlContainer: 'text-left'
        }
    });
}

// Comparison Card Details
function showCompoundInterestDetails() {
    Swal.fire({
        title: '💚 Compound Interest Explained',
        html: `
            <div class="text-left space-y-4">
                <div class="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                    <h4 class="font-bold text-gray-800 mb-2">What Makes It Special?</h4>
                    <p class="text-sm text-gray-700 mb-2">Compound interest is called "the eighth wonder of the world" because:</p>
                    <ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li>Interest earns interest - creating exponential growth</li>
                        <li>The longer you invest, the faster it grows</li>
                        <li>Small differences in rate or time create huge differences in results</li>
                    </ul>
                </div>
                <div class="bg-white rounded-lg p-4">
                    <h4 class="font-bold text-gray-800 mb-2">Real Example:</h4>
                    <p class="text-sm text-gray-700 mb-2">₱10,000 at 5% for 3 years:</p>
                    <div class="space-y-1 text-sm font-mono">
                        <div class="flex justify-between bg-green-50 p-2 rounded">
                            <span>Year 1:</span>
                            <span class="text-green-600">₱10,500</span>
                        </div>
                        <div class="flex justify-between bg-green-50 p-2 rounded">
                            <span>Year 2:</span>
                            <span class="text-green-600">₱11,025</span>
                        </div>
                        <div class="flex justify-between bg-green-50 p-2 rounded">
                            <span>Year 3:</span>
                            <span class="text-green-600">₱11,576</span>
                        </div>
                    </div>
                    <p class="text-xs text-gray-600 mt-2">Total Interest: ₱1,576 (vs. ₱1,500 with simple interest)</p>
                </div>
            </div>
        `,
        icon: 'success',
        confirmButtonText: 'Awesome!',
        confirmButtonColor: '#10b981',
        width: '600px',
        customClass: {
            popup: 'rounded-2xl',
            title: 'text-slate-800 text-xl',
            htmlContainer: 'text-left'
        }
    });
}

function showSimpleInterestDetails() {
    Swal.fire({
        title: '💙 Simple Interest Explained',
        html: `
            <div class="text-left space-y-4">
                <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <h4 class="font-bold text-gray-800 mb-2">How It Works:</h4>
                    <p class="text-sm text-gray-700 mb-2">Simple interest calculates interest only on the original principal:</p>
                    <ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li>Interest = Principal × Rate × Time</li>
                        <li>Same interest amount each period</li>
                        <li>Linear growth - grows at a constant rate</li>
                    </ul>
                </div>
                <div class="bg-white rounded-lg p-4">
                    <h4 class="font-bold text-gray-800 mb-2">Real Example:</h4>
                    <p class="text-sm text-gray-700 mb-2">₱10,000 at 5% for 3 years:</p>
                    <div class="space-y-1 text-sm font-mono">
                        <div class="flex justify-between bg-blue-50 p-2 rounded">
                            <span>Year 1:</span>
                            <span class="text-blue-600">₱10,500</span>
                        </div>
                        <div class="flex justify-between bg-blue-50 p-2 rounded">
                            <span>Year 2:</span>
                            <span class="text-blue-600">₱11,000</span>
                        </div>
                        <div class="flex justify-between bg-blue-50 p-2 rounded">
                            <span>Year 3:</span>
                            <span class="text-blue-600">₱11,500</span>
                        </div>
                    </div>
                    <p class="text-xs text-gray-600 mt-2">Total Interest: ₱1,500 (₱500 per year)</p>
                </div>
                <div class="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                    <p class="text-sm text-gray-700"><strong>💡 Key Difference:</strong> Simple interest grows linearly, while compound interest grows exponentially!</p>
                </div>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'Got it!',
        confirmButtonColor: '#3b82f6',
        width: '600px',
        customClass: {
            popup: 'rounded-2xl',
            title: 'text-slate-800 text-xl',
            htmlContainer: 'text-left'
        }
    });
}

// ------------------------------
// User Dropdown Functions
// ------------------------------
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

// Load and display profile picture
async function loadProfilePicture(userId) {
    try {
        const profileResponse = await fetch(`../php/get-profile.php?user_id=${userId}`, {
            credentials: 'include'
        });
        
        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.success && profileData.user && profileData.user.profile_picture) {
                const profilePicPath = `../${profileData.user.profile_picture}?t=${Date.now()}`;
                
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
            // Close dropdowns
            const dropdownMenu = document.getElementById('userDropdownMenu');
            const mobileMenu = document.getElementById('mobileMenu');
            if (dropdownMenu) dropdownMenu.classList.add('hidden');
            if (mobileMenu) mobileMenu.classList.add('hidden');
            
            // Redirect to logout
            window.location.href = '../php/logout.php';
        }
    });
}

// ------------------------------
// Initialize
// ------------------------------
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Load user info
        const userResponse = await fetch('../php/user.php', { credentials: 'include', cache: 'no-store' });
        const userData = await userResponse.json();
        
        if (userData.success && userData.user) {
            const nameEl = document.getElementById('userName');
            const nameDropdown = document.getElementById('userNameDropdown');
            const nameMobile = document.getElementById('userNameMobile');
            
            if (nameEl) nameEl.textContent = userData.user.first_name;
            if (nameDropdown) nameDropdown.textContent = userData.user.first_name;
            if (nameMobile) nameMobile.textContent = userData.user.first_name;
            
            // Load profile picture
            if (userData.user.user_id) {
                loadProfilePicture(userData.user.user_id);
            }
        } else {
            // Not authenticated, redirect to login
            window.location.href = '../login.html';
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
    
    // Initialize sidebar
    ciInitializeSidebar();
    
    // Load completed lessons
    await ciLoadCompletedLessons();
    
    // Load and display study time
    await ciLoadAndDisplayStudyTime();
    
    // Show first lesson
    await ciShowLesson(1);
    
    // Start study time interval (save every 30 seconds)
    ciStudyTimeInterval = setInterval(() => {
        if (ciCurrentLesson && !ciCompletedLessons.has(ciCurrentLesson)) {
            ciSaveStudyTimeForCurrentLesson();
        }
    }, 30000);
    
    // Handle visibility change (tab switch, minimize, etc.)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Page is hidden, save current time
            if (ciCurrentLesson && !ciCompletedLessons.has(ciCurrentLesson)) {
                ciSaveStudyTimeForCurrentLesson();
            }
        } else {
            // Page is visible again, reinitialize timer
            if (ciCurrentLesson && !ciCompletedLessons.has(ciCurrentLesson)) {
                ciLastSaveTimestamp[ciCurrentLesson] = Date.now();
                ciStartLiveTimer();
            }
        }
    });
    
    // Handle page unload (browser close, refresh, etc.)
    window.addEventListener('beforeunload', () => {
        if (ciCurrentLesson && !ciCompletedLessons.has(ciCurrentLesson)) {
            ciSaveStudyTimeForCurrentLesson();
            // Use sendBeacon for more reliable data sending on page unload
            const timeToSave = ciTotalStudyTime[ciCurrentLesson] || 0;
            if (timeToSave > 0) {
                navigator.sendBeacon('../php/store-study-time.php', JSON.stringify({
                    topic: 'compound-interest',
                    study_time: {
                        [ciCurrentLesson]: timeToSave
                    }
                }));
            }
        }
    });
    
    // Initialize calculator after a short delay to ensure DOM is ready
    setTimeout(() => {
        calculateCompoundInterest();
    }, 300);
    
    // Show performance analysis section if all quizzes are completed
    ciShowPerformanceAnalysisSection();
});

// Export functions to window for HTML onclick handlers
window.ciShowTopic5Quiz = ciShowTopic5Quiz;
window.ciAnalyzePerformance = ciAnalyzePerformance;
window.ciShowPerformanceAnalysisSection = ciShowPerformanceAnalysisSection;
window.ciDisplayPerformanceAnalysis = ciDisplayPerformanceAnalysis;
window.getTopicNameForAnalysis = () => 'compound-interest';
