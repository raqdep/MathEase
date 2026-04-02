// Solving Interest Problems - Interactive JavaScript

// ------------------------------
// Lesson Navigation & Completion
// ------------------------------
let sipCurrentLesson = 1;
let sipCompletedLessons = new Set();
const sipTotalLessons = 5;
let sipLessonStartTime = {};
let sipTotalStudyTime = {};
let sipStudyTimeInterval = {};
let sipTimerUpdateInterval = {};

// ------------------------------
// Quiz System - 5 questions per topic
// ------------------------------
const sipLesson1Quiz = [
    {
        question: "What is the main purpose of solving problems involving simple and compound interest?",
        options: [
            "To make informed financial decisions in real-life situations",
            "To avoid paying interest",
            "To calculate only simple interest",
            "To understand only compound interest"
        ],
        correct: 0
    },
    {
        question: "What are the key components needed to solve interest problems?",
        options: [
            "Principal (P), rate (r), time (t), and maturity value (F)",
            "Only principal and rate",
            "Only time and rate",
            "Only principal and time"
        ],
        correct: 0
    },
    {
        question: "What does DepEd MELC GM11-IIa-1 focus on?",
        options: [
            "Solving problems involving simple interest and related measures",
            "Only compound interest",
            "Only present value",
            "Only future value"
        ],
        correct: 0
    },
    {
        question: "What does DepEd MELC GM11-IIa-2 focus on?",
        options: [
            "Solving problems involving compound interest",
            "Only simple interest",
            "Only maturity value",
            "Only present value"
        ],
        correct: 0
    },
    {
        question: "Why is it important to differentiate between simple and compound interest?",
        options: [
            "To choose the best financial option and understand long-term growth",
            "They are always the same",
            "Only simple interest matters",
            "Only compound interest matters"
        ],
        correct: 0
    }
];

const sipLesson2Quiz = [
    {
        question: "What is the formula for simple interest?",
        options: [
            "Is = Prt",
            "Is = P + r + t",
            "Is = P / (rt)",
            "Is = P × r / t"
        ],
        correct: 0
    },
    {
        question: "What is the formula for maturity value using simple interest?",
        options: [
            "F = P(1 + rt)",
            "F = P + r + t",
            "F = P / (1 + rt)",
            "F = P × r × t"
        ],
        correct: 0
    },
    {
        question: "If P = ₱20,000, r = 5%, t = 3 years, what is the simple interest?",
        options: [
            "₱3,000",
            "₱2,500",
            "₱3,500",
            "₱2,000"
        ],
        correct: 0
    },
    {
        question: "If P = ₱20,000, r = 5%, t = 3 years, what is the maturity value F?",
        options: [
            "₱23,000",
            "₱22,500",
            "₱23,500",
            "₱22,000"
        ],
        correct: 0
    },
    {
        question: "In real-life banking, when is simple interest typically used?",
        options: [
            "Short-term loans, promissory notes, and basic savings accounts",
            "Only long-term investments",
            "Only mortgages",
            "Only credit cards"
        ],
        correct: 0
    }
];

const sipLesson3Quiz = [
    {
        question: "How do you solve for Principal (P) when Is, r, and t are known?",
        options: [
            "P = Is / (rt)",
            "P = Is × r × t",
            "P = Is + r + t",
            "P = Is - r - t"
        ],
        correct: 0
    },
    {
        question: "How do you solve for Rate (r) when Is, P, and t are known?",
        options: [
            "r = Is / (Pt)",
            "r = Is × P × t",
            "r = P / (Is × t)",
            "r = t / (Is × P)"
        ],
        correct: 0
    },
    {
        question: "How do you solve for Time (t) when Is, P, and r are known?",
        options: [
            "t = Is / (Pr)",
            "t = Is × P × r",
            "t = P / (Is × r)",
            "t = r / (Is × P)"
        ],
        correct: 0
    },
    {
        question: "What is the relationship between maturity value (F) and simple interest (Is)?",
        options: [
            "F = P + Is",
            "F = P - Is",
            "F = P × Is",
            "F = P / Is"
        ],
        correct: 0
    },
    {
        question: "If Is = ₱2,775, P = ₱18,500, t = 5 years, what is the rate r?",
        options: [
            "3%",
            "2.5%",
            "3.5%",
            "4%"
        ],
        correct: 0
    }
];

const sipLesson4Quiz = [
    {
        question: "What is the formula for compound interest maturity value?",
        options: [
            "F = P(1 + r/n)^(nt)",
            "F = P(1 + rt)",
            "F = P + rt",
            "F = P × r × t"
        ],
        correct: 0
    },
    {
        question: "What is the formula for compound interest (Ic)?",
        options: [
            "Ic = F - P",
            "Ic = F + P",
            "Ic = F × P",
            "Ic = F / P"
        ],
        correct: 0
    },
    {
        question: "What is the formula for Present Value (PV) from Future Value?",
        options: [
            "PV = F / (1 + r/n)^(nt)",
            "PV = F × (1 + r/n)^(nt)",
            "PV = F + r",
            "PV = F - r"
        ],
        correct: 0
    },
    {
        question: "If P = ₱35,000, r = 3%, n = 12 (monthly), t = 3 years, what is F?",
        options: [
            "₱38,292",
            "₱38,000",
            "₱37,500",
            "₱38,500"
        ],
        correct: 0
    },
    {
        question: "What does 'n' represent in the compound interest formula?",
        options: [
            "Number of times interest is compounded per year",
            "Number of years",
            "Principal amount",
            "Interest rate"
        ],
        correct: 0
    }
];

const sipLesson5Quiz = [
    {
        question: "When comparing different deposit options, what factors should be considered?",
        options: [
            "Interest rate, time period, compounding frequency, and financial goals",
            "Only interest rate",
            "Only time period",
            "Only principal amount"
        ],
        correct: 0
    },
    {
        question: "For ₱50,000, compare: 1.10% (3y), 1.25% (5y), 1.75% (8y). Which typically yields more?",
        options: [
            "The option with higher rate and longer time (1.75% for 8 years)",
            "The option with lowest rate",
            "They all yield the same",
            "The option with shortest time"
        ],
        correct: 0
    },
    {
        question: "What is liquidity in financial decision-making?",
        options: [
            "How easily you can access your money when needed",
            "The interest rate",
            "The time period",
            "The principal amount"
        ],
        correct: 0
    },
    {
        question: "Why might someone choose a shorter-term deposit even with a lower rate?",
        options: [
            "For better liquidity and flexibility",
            "It always yields more",
            "It's always better",
            "No reason"
        ],
        correct: 0
    },
    {
        question: "What should be included in a financial proposal?",
        options: [
            "Calculated values, comparison of options, justification of choice, and risk assessment",
            "Only interest rates",
            "Only time periods",
            "Only principal amounts"
        ],
        correct: 0
    }
];

// ------------------------------
// Quiz Runner Function
// ------------------------------
function sipRunLessonQuiz(lessonNum) {
    const quizArray = [
        sipLesson1Quiz,
        sipLesson2Quiz,
        sipLesson3Quiz,
        sipLesson4Quiz,
        sipLesson5Quiz
    ][lessonNum - 1];
    
    if (!quizArray) return;
    
    let currentQuestion = 0;
    let score = 0;
    const totalQuestions = quizArray.length;
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
            sipShowLesson(lessonNum);
        }
    });
    
    function displayQuestion() {
        if (currentQuestion >= totalQuestions) {
            showQuizResults();
            return;
        }
        
        const q = quizArray[currentQuestion];
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
                // Capture current question index and quiz data in closure
                const questionIndex = currentQuestion;
                const currentQuiz = quizArray[questionIndex];
                
                // Add click handlers to options
                document.querySelectorAll('.quiz-option').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const selectedAnswer = parseInt(this.dataset.answer);
                        
                        // Store answer
                        userAnswers[questionIndex] = {
                            question: currentQuiz.question,
                            options: currentQuiz.options,
                            selected: selectedAnswer,
                            selectedText: currentQuiz.options[selectedAnswer],
                            correct: currentQuiz.correct,
                            correctText: currentQuiz.options[currentQuiz.correct],
                            isCorrect: selectedAnswer === currentQuiz.correct
                        };
                        
                        // Disable all buttons (no visual feedback - user won't know if correct or incorrect)
                        document.querySelectorAll('.quiz-option').forEach(b => {
                            b.disabled = true;
                            // Just add a subtle selected state, no color indication
                            if (parseInt(b.dataset.answer) === selectedAnswer) {
                                b.classList.add('opacity-75');
                            }
                        });
                        
                        // Update score
                        if (selectedAnswer === currentQuiz.correct) {
                            score++;
                        }
                        
                        // Move to next question immediately (no delay to show feedback)
                        setTimeout(() => {
                            currentQuestion++;
                            displayQuestion();
                        }, 300);
                    });
                });
            }
        }).then((result) => {
            // Handle cancel button
            if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
                Swal.fire({
                    title: 'Cancel Quiz?',
                    text: 'Are you sure you want to cancel? Your progress will not be saved.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#ef4444',
                    cancelButtonColor: '#6b7280',
                    confirmButtonText: 'Yes, Cancel',
                    cancelButtonText: 'Continue Quiz'
                }).then((cancelResult) => {
                    if (cancelResult.isConfirmed) {
                        sipShowLesson(lessonNum);
                    } else {
                        // Continue quiz
                        displayQuestion();
                    }
                });
            }
        });
    }
    
    function showQuizResults() {
        const percentage = Math.round((score / totalQuestions) * 100);
        const passed = percentage >= 60;
        
        // Build results HTML
        let resultsHtml = `
            <div class="text-left space-y-4">
                <div class="text-center mb-6">
                    <div class="inline-block p-6 rounded-full ${passed ? 'bg-green-100' : 'bg-red-100'} mb-4">
                        <i class="fas ${passed ? 'fa-check-circle' : 'fa-times-circle'} text-5xl ${passed ? 'text-green-600' : 'text-red-600'}"></i>
                    </div>
                    <h3 class="text-2xl font-bold ${passed ? 'text-green-600' : 'text-red-600'} mb-2">
                        ${passed ? 'Quiz Passed!' : 'Quiz Failed'}
                    </h3>
                    <p class="text-3xl font-bold text-gray-800 mb-2">Your Score: ${score}/${totalQuestions}</p>
                    <p class="text-xl text-gray-600">${percentage}%</p>
                </div>
        `;
        
        if (passed) {
            resultsHtml += `
                <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                    <p class="text-gray-700"><strong>Congratulations!</strong> You can now proceed to the next topic.</p>
                </div>
            `;
        } else {
            resultsHtml += `
                <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                    <p class="text-gray-700"><strong>You need at least 60% to pass.</strong> Please review the lesson and try again.</p>
                </div>
            `;
        }
        
        resultsHtml += `</div>`;
        
        Swal.fire({
            icon: passed ? 'success' : 'error',
            title: passed ? 'Quiz Passed!' : 'Quiz Failed',
            html: resultsHtml,
            confirmButtonText: passed ? 'Continue to Next Topic' : 'Review Lesson',
            confirmButtonColor: '#667eea',
            allowOutsideClick: false,
            width: '600px',
            customClass: {
                popup: 'rounded-2xl shadow-2xl',
                title: 'text-slate-800 text-2xl font-bold',
                htmlContainer: 'text-left'
            }
        }).then((result) => {
            if (passed) {
                sipStoreQuizData(lessonNum, score, totalQuestions, userAnswers);
                sipCompleteLesson(lessonNum);
                
                // Hide Topic 5 quiz button if this is Topic 5
                if (lessonNum === 5) {
                    const topic5QuizButton = document.getElementById('topic5QuizButton');
                    if (topic5QuizButton) {
                        topic5QuizButton.style.display = 'none';
                    }
                }
                
                // Automatically navigate to next lesson if not the last one
                if (lessonNum < sipTotalLessons) {
                    setTimeout(() => {
                        sipShowLesson(lessonNum + 1);
                    }, 500);
                } else {
                    // If it's the last lesson, show performance analysis section
                    sipShowPerformanceAnalysisSection();
                }
            } else {
                // Show lesson again if failed
                sipShowLesson(lessonNum);
            }
        });
    }
}

// ------------------------------
// Store Quiz Data for AI Analysis
// ------------------------------
function sipStoreQuizData(lessonNum, score, totalQuestions, userAnswers) {
    const quizArray = [
        sipLesson1Quiz,
        sipLesson2Quiz,
        sipLesson3Quiz,
        sipLesson4Quiz,
        sipLesson5Quiz
    ][lessonNum - 1];
    
    const quizData = {
        topic: 'solving-interest-problems',
        lesson: lessonNum,
        score: score,
        totalQuestions: totalQuestions,
        percentage: (score / totalQuestions) * 100,
        answers: quizArray.map((q, i) => ({
            question: q.question,
            options: q.options,
            selected: userAnswers[i]?.selected ?? -1,
            selectedText: userAnswers[i]?.selectedText ?? 'Not answered',
            correct: q.correct,
            correctText: q.options[q.correct],
            isCorrect: userAnswers[i]?.isCorrect ?? false
        })),
        timestamp: new Date().toISOString()
    };
    
    fetch('../php/store-quiz-data.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(quizData)
    }).catch(err => console.error('Error storing quiz data:', err));
}

// ------------------------------
// Timer System
// ------------------------------
function sipStartLessonTimer(lessonNum) {
    // Stop any existing timer for this lesson
    sipStopLessonTimer(lessonNum);
    
    sipLessonStartTime[lessonNum] = Date.now();
    const timerDisplay = document.querySelector(`#lesson${lessonNum} .lesson-timer-display`);
    const progressCircle = document.querySelector(`#lesson${lessonNum} .timer-progress`);
    
    if (!timerDisplay) return;
    
    sipTimerUpdateInterval[lessonNum] = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sipLessonStartTime[lessonNum]) / 1000) + (sipTotalStudyTime[lessonNum] || 0);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // Update circular progress (assuming 60 minutes max)
        if (progressCircle) {
            const maxTime = 3600; // 60 minutes in seconds
            const progress = Math.min(elapsed / maxTime, 1);
            const circumference = 2 * Math.PI * 34; // radius = 34 (matching functions.html)
            const offset = circumference * (1 - progress);
            progressCircle.style.strokeDashoffset = offset;
        }
    }, 1000);
}

function sipStopLessonTimer(lessonNum) {
    if (sipTimerUpdateInterval[lessonNum]) {
        clearInterval(sipTimerUpdateInterval[lessonNum]);
        delete sipTimerUpdateInterval[lessonNum];
    }
    
    // Save study time
    sipSaveStudyTimeForCurrentLesson(lessonNum);
}

function sipSaveStudyTimeForCurrentLesson(lessonNum) {
    const timerDisplay = document.querySelector(`#lesson${lessonNum} .lesson-timer-display`);
    if (!timerDisplay) return;
    
    const timeText = timerDisplay.textContent;
    const [minutes, seconds] = timeText.split(':').map(Number);
    const totalSeconds = minutes * 60 + seconds;
    
    if (totalSeconds > 0 && sipLessonStartTime[lessonNum]) {
        const elapsed = Math.floor((Date.now() - sipLessonStartTime[lessonNum]) / 1000);
        sipTotalStudyTime[lessonNum] = (sipTotalStudyTime[lessonNum] || 0) + elapsed;
        
        // Save to backend
        fetch('../php/store-study-time.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                topic: 'solving-interest-problems',
                lesson: lessonNum,
                time: sipTotalStudyTime[lessonNum] || 0,
                timestamp: new Date().toISOString()
            })
        }).catch(err => console.error('Error saving study time:', err));
        
        delete sipLessonStartTime[lessonNum];
    }
}

// ------------------------------
// Sidebar Navigation
// ------------------------------
function sipInitializeSidebar() {
    const sidebar = document.getElementById('lessonSidebar');
    if (!sidebar) return;
    
    // Topic headers - expand/collapse
    sidebar.querySelectorAll('.lesson-topic-header').forEach(header => {
        header.addEventListener('click', function(e) {
            if (e.target.closest('.lesson-subitem')) return;
            const topic = this.closest('.lesson-topic');
            const lessonNum = parseInt(topic.dataset.lesson);
            
            // Check if topic is accessible
            if (!sipCanAccessTopic(lessonNum) && lessonNum !== sipCurrentLesson) {
                sipShowTopicLockedMessage(lessonNum);
                return;
            }
            
            const isExpanded = topic.classList.contains('expanded');
            document.querySelectorAll('.lesson-topic').forEach(t => t.classList.remove('expanded'));
            if (!isExpanded) {
                topic.classList.add('expanded');
                this.setAttribute('aria-expanded', 'true');
                sipShowLesson(lessonNum);
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
            if (!sipCanAccessTopic(lessonNum)) {
                sipShowTopicLockedMessage(lessonNum);
                return;
            }
            
            // Show lesson and scroll to section
            sipShowLesson(lessonNum, false);
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
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
            const backdrop = document.getElementById('mobileBackdrop');
            if (backdrop) {
                backdrop.classList.toggle('hidden');
            }
        });
    }
    
    // Mobile backdrop click to close
    const backdrop = document.getElementById('mobileBackdrop');
    if (backdrop) {
        backdrop.addEventListener('click', function() {
            sidebar.classList.remove('open');
            this.classList.add('hidden');
        });
    }
}

function setSidebarActive(lessonNum, section) {
    document.querySelectorAll('.lesson-subitem').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`.lesson-subitem[data-lesson="${lessonNum}"][data-section="${section}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

function sipUpdateSidebarProgress() {
    for (let i = 1; i <= sipTotalLessons; i++) {
        const topic = document.getElementById(`sidebar-topic-${i}`);
        if (!topic) continue;
        
        const progressText = topic.querySelector('.topic-status-text');
        const dot = topic.querySelector('.lesson-topic-dot');
        const accessible = sipCanAccessTopic(i);
        const complete = sipCompletedLessons.has(i);
        
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

function sipCanAccessTopic(lessonNum) {
    if (lessonNum === 1) return true;
    return sipCompletedLessons.has(lessonNum - 1);
}

function sipShowTopicLockedMessage(lessonNum) {
    Swal.fire({
        icon: 'info',
        title: 'Topic Locked',
        text: `Please complete Topic ${lessonNum - 1} first to unlock this topic.`,
        confirmButtonColor: '#667eea'
    });
}

function sipUnlockTopics() {
    for (let i = 1; i <= sipTotalLessons; i++) {
        const topic = document.getElementById(`sidebar-topic-${i}`);
        if (!topic) continue;
        
        if (sipCanAccessTopic(i)) {
            topic.classList.remove('locked');
        } else {
            topic.classList.add('locked');
        }
    }
}

// ------------------------------
// Lesson Management
// ------------------------------
function sipShowLesson(lessonNum, startTimer = true) {
    if (!sipCanAccessTopic(lessonNum) && lessonNum !== 1) {
        sipShowTopicLockedMessage(lessonNum);
        return;
    }
    
    sipCurrentLesson = lessonNum;
    document.querySelectorAll('.lesson-section').forEach(s => s.classList.remove('active'));
    const act = document.getElementById(`lesson${lessonNum}`);
    if (act) {
        act.classList.add('active');
    }
    
    // Update sidebar
    document.querySelectorAll('.lesson-topic').forEach(topic => {
        const num = parseInt(topic.dataset.lesson);
        if (num === lessonNum) {
            topic.classList.add('expanded');
            topic.querySelector('.lesson-topic-header')?.setAttribute('aria-expanded', 'true');
        } else if (num < lessonNum || sipCompletedLessons.has(num)) {
            // Keep unlocked topics expanded
        } else {
            topic.classList.remove('expanded');
            topic.querySelector('.lesson-topic-header')?.setAttribute('aria-expanded', 'false');
        }
    });
    
    // Update navigation buttons
    sipUpdateNavigationButtons();
    
    // Update progress indicators
    sipUpdateProgressIndicators();
    
    // Start timer if needed
    if (startTimer) {
        sipStartLessonTimer(lessonNum);
    }
    
    // Update sidebar active state
    setSidebarActive(lessonNum, 'objective');
    
    // Show/hide Topic 5 quiz button
    const topic5QuizButton = document.getElementById('topic5QuizButton');
    if (topic5QuizButton) {
        if (lessonNum === 5 && !sipCompletedLessons.has(5)) {
            topic5QuizButton.style.display = 'block';
        } else {
            topic5QuizButton.style.display = 'none';
        }
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function sipNavigateLesson(direction) {
    const next = sipCurrentLesson + direction;
    
    // If moving forward
    if (direction > 0) {
        // If trying to go beyond the last lesson, show message
        if (next > sipTotalLessons) {
            Swal.fire({
                icon: 'info',
                title: 'Last Topic',
                text: 'You have reached the last topic. Complete the quiz to see your AI performance analysis!',
                confirmButtonColor: '#667eea'
            });
            return;
        }
        
        // If current lesson is not completed, show quiz first
        if (!sipCompletedLessons.has(sipCurrentLesson)) {
            // Show quiz for current lesson before allowing navigation
            sipRunLessonQuiz(sipCurrentLesson);
            return;
        }
        
        // Check if next topic is accessible
        if (!sipCanAccessTopic(next)) {
            sipShowTopicLockedMessage(next);
            return;
        }
        
        // Navigate to the next lesson
        sipShowLesson(next);
    } else {
        // Moving backward
        if (next >= 1) {
            sipShowLesson(next);
        }
    }
}

// Export navigation function
window.sipNavigateLesson = sipNavigateLesson;

function sipUpdateNavigationButtons() {
    const prevBtn = document.querySelector('#prevLessonBtn');
    const nextBtn = document.querySelector('#nextLessonBtn');
    
    if (prevBtn) {
        prevBtn.disabled = sipCurrentLesson <= 1;
    }
    
    // Next button is always enabled - navigation logic handles quiz and locked topics
    if (nextBtn) {
        nextBtn.disabled = false;
    }
}

function sipUpdateProgressIndicators() {
    const numEl = document.querySelector('#currentLessonNum');
    const barEl = document.querySelector('#lessonProgressBar');
    
    if (numEl) {
        numEl.textContent = String(sipCurrentLesson);
    }
    
    if (barEl) {
        const progress = (sipCurrentLesson / sipTotalLessons) * 100;
        barEl.style.width = progress + '%';
    }
}

function sipLoadCompletedLessons() {
    fetch('../php/complete-lesson.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
            action: 'get_completed',
            topic: 'solving-interest-problems' 
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success && data.completed_lessons) {
            sipCompletedLessons = new Set(data.completed_lessons);
            sipUpdateSidebarProgress();
            sipUnlockTopics();
        }
    })
    .catch(() => {
        // Fallback to localStorage
        const stored = localStorage.getItem('sip_completed_lessons');
        if (stored) {
            sipCompletedLessons = new Set(JSON.parse(stored));
            sipUpdateSidebarProgress();
            sipUnlockTopics();
        }
    });
}

function sipCompleteLesson(lessonNum) {
    sipCompletedLessons.add(lessonNum);
    
    // Save to backend
    fetch('../php/complete-lesson.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            action: 'complete',
            topic: 'solving-interest-problems',
            lesson: lessonNum
        })
    }).catch(err => console.error('Error completing lesson:', err));
    
    sipUpdateSidebarProgress();
    sipUnlockTopics();
    
    // Show performance analysis section if all quizzes are completed
    if (sipCompletedLessons.size === sipTotalLessons) {
        sipShowPerformanceAnalysisSection();
    }
    
    // Stop timer
    sipStopLessonTimer(lessonNum);
    
    const statusEl = document.getElementById(`lessonCompletionStatus-${lessonNum}`);
    if (statusEl) {
        statusEl.classList.remove('hidden');
    }
    
    // Show topic completion option if all lessons are done
    if (sipCompletedLessons.size === sipTotalLessons) {
        showTopicCompletionOption();
    }
}

function showTopicCompletionOption() {
    const section = document.getElementById('topicCompletionSection');
    if (section) {
        section.classList.remove('hidden');
    }
}

function completeTopic() {
    fetch('../php/complete-lesson.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            action: 'complete_topic',
            topic: 'solving-interest-problems'
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Topic Completed!',
                text: data.message || 'Congratulations! You have completed this topic.',
                confirmButtonColor: '#667eea'
            });
        }
    })
    .catch(err => console.error('Error completing topic:', err));
}

// ------------------------------
// Performance Analysis (Custom AI - matching functions.html)
// ------------------------------
function sipShowPerformanceAnalysisSection() {
    // Check if all 5 topics are completed
    if (sipCompletedLessons.size !== sipTotalLessons) {
        console.log('Performance analysis will only show after completing all quizzes. Current completed:', sipCompletedLessons.size, '/', sipTotalLessons);
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

async function sipAnalyzePerformance() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultSection = document.getElementById('analysisResult');
    
    // Show loading state
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
    }
    
    try {
        const response = await fetch(`../php/analyze-quiz-performance.php?topic=solving-interest-problems`, {
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
            sipDisplayPerformanceAnalysis(result.analysis);
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
            analyzeBtn.innerHTML = '<i class="fas fa-chart-bar mr-2"></i>Analyze My Performance';
        }
    }
}

function sipDisplayPerformanceAnalysis(analysis) {
    const resultSection = document.getElementById('analysisResult');
    if (!resultSection) return;
    
    resultSection.classList.remove('hidden');
    resultSection.innerHTML = analysis;
}

// ------------------------------
// Calculator Functions
// ------------------------------
function sip_calculateSimpleInterest() {
    const P = parseFloat(document.getElementById('sip_siP').value) || 0;
    const r = (parseFloat(document.getElementById('sip_siR').value) || 0) / 100;
    const t = parseFloat(document.getElementById('sip_siT').value) || 0;
    
    const Is = P * r * t;
    const F = P + Is;
    
    document.getElementById('sip_siIs').textContent = '₱' + Is.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    document.getElementById('sip_siF').textContent = '₱' + F.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function sip_solveSimpleRelations() {
    const Is = parseFloat(document.getElementById('sip_is').value) || 0;
    const P = parseFloat(document.getElementById('sip_p').value) || 0;
    const r = (parseFloat(document.getElementById('sip_r').value) || 0) / 100;
    const t = parseFloat(document.getElementById('sip_t').value) || 0;
    
    let calculatedIs = 0;
    let calculatedP = 0;
    let calculatedRT = null;
    
    if (Is > 0 && P > 0 && r > 0 && t > 0) {
        calculatedIs = P * r * t;
    } else if (P > 0 && r > 0 && t > 0) {
        calculatedIs = P * r * t;
    }
    
    if (Is > 0 && r > 0 && t > 0) {
        calculatedP = Is / (r * t);
    }
    
    if (Is > 0 && P > 0) {
        if (r === 0 && t > 0) {
            calculatedRT = (Is / (P * t)) * 100;
        } else if (t === 0 && r > 0) {
            calculatedRT = Is / (P * r);
        }
    }
    
    const F = P + (calculatedIs || Is);
    
    document.getElementById('sip_rel_is').textContent = '₱' + (calculatedIs || Is).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    document.getElementById('sip_rel_p').textContent = '₱' + (calculatedP || P).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    document.getElementById('sip_rel_rt').textContent = calculatedRT ? (calculatedRT > 1 ? calculatedRT.toFixed(2) + '%' : calculatedRT.toFixed(2)) : '—';
    document.getElementById('sip_rel_f').textContent = '₱' + F.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function sip_calculateCompound() {
    const P = parseFloat(document.getElementById('sip_ciP').value) || 0;
    const r = (parseFloat(document.getElementById('sip_ciR').value) || 0) / 100;
    const t = parseFloat(document.getElementById('sip_ciT').value) || 0;
    const n = parseInt(document.getElementById('sip_ciN').value) || 1;
    
    const F = P * Math.pow(1 + r / n, n * t);
    const Ic = F - P;
    
    document.getElementById('sip_ciF').textContent = '₱' + F.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    document.getElementById('sip_ciIc').textContent = '₱' + Ic.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function sip_computePVFromF() {
    const F = parseFloat(document.getElementById('sip_ciFInput').value) || 0;
    const r = (parseFloat(document.getElementById('sip_ciR').value) || 0) / 100;
    const t = parseFloat(document.getElementById('sip_ciT').value) || 0;
    const n = parseInt(document.getElementById('sip_ciN').value) || 1;
    
    if (F > 0 && r > 0 && t > 0 && n > 0) {
        const PV = F / Math.pow(1 + r / n, n * t);
        document.getElementById('sip_ciPV').textContent = '₱' + PV.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
}

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
        title: 'Logout?',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#667eea',
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
        .then(r => r.json())
        .then(data => {
            if (data.success && data.user) {
                const userName = (data.user.first_name || '') + ' ' + (data.user.last_name || '').trim() || 'Student';
                document.querySelectorAll('#userName, #userNameDropdown, #userNameMobile').forEach(el => { if (el) el.textContent = userName; });
                const imgs = document.querySelectorAll('#userProfileImage, #userProfileImageDropdown, #userProfileImageMobile');
                const icons = document.querySelectorAll('#userProfileIcon, #userProfileIconDropdown, #userProfileIconMobile');
                if (data.user.profile_picture) {
                    const path = '../' + data.user.profile_picture + '?t=' + Date.now();
                    imgs.forEach(img => { if (img) { img.src = path; img.classList.remove('hidden'); } });
                    icons.forEach(icon => { if (icon) icon.style.display = 'none'; });
                } else {
                    imgs.forEach(img => { if (img) { img.src = ''; img.classList.add('hidden'); } });
                    icons.forEach(icon => { if (icon) icon.style.display = 'block'; });
                }
            }
        })
        .catch(() => {});
}

// ------------------------------
// Initialize Everything
// ------------------------------
document.addEventListener('DOMContentLoaded', function() {
    // Load user data
    loadProfilePicture();
    
    // Initialize sidebar
    sipInitializeSidebar();
    
    // Load completed lessons
    sipLoadCompletedLessons();
    
    // Show first lesson
    sipShowLesson(1);
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown && !dropdown.contains(e.target)) {
            const menu = document.getElementById('userDropdownMenu');
            if (menu) menu.classList.add('hidden');
        }
    });
    
    // Show performance analysis section if all quizzes are completed
    sipShowPerformanceAnalysisSection();
});

// Topic 5 Quiz Button Function
function sipShowTopic5Quiz() {
    if (sipCompletedLessons.has(5)) {
        Swal.fire({
            icon: 'info',
            title: 'Quiz Already Completed',
            text: 'You have already completed Topic 5 quiz.',
            confirmButtonColor: '#667eea'
        });
        return;
    }
    
    sipRunLessonQuiz(5);
}

// Make functions globally available
window.sipNavigateLesson = sipNavigateLesson;
window.sipRunLessonQuiz = sipRunLessonQuiz;
window.sipAnalyzePerformance = sipAnalyzePerformance;
window.sipShowPerformanceAnalysisSection = sipShowPerformanceAnalysisSection;
window.sipDisplayPerformanceAnalysis = sipDisplayPerformanceAnalysis;
window.sipShowTopic5Quiz = sipShowTopic5Quiz;
window.toggleUserDropdown = toggleUserDropdown;
window.toggleMobileMenu = toggleMobileMenu;
window.confirmLogout = confirmLogout;
window.completeTopic = completeTopic;
window.sip_calculateSimpleInterest = sip_calculateSimpleInterest;
window.sip_solveSimpleRelations = sip_solveSimpleRelations;
window.sip_calculateCompound = sip_calculateCompound;
window.sip_computePVFromF = sip_computePVFromF;
window.getTopicNameForAnalysis = () => 'solving-interest-problems';

// Wrapper functions for simple-interest.html (si prefix)
// These are aliases for the sip-prefixed functions to match HTML onclick handlers
function siNavigateLesson(direction) {
    return sipNavigateLesson(direction);
}

function siShowTopic4Quiz() {
    if (sipCompletedLessons.has(4)) {
        Swal.fire({
            icon: 'info',
            title: 'Quiz Already Completed',
            text: 'You have already completed Topic 4 quiz.',
            confirmButtonColor: '#667eea'
        });
        return;
    }
    
    sipRunLessonQuiz(4);
}

function siAnalyzePerformance() {
    return sipAnalyzePerformance();
}

// Export si-prefixed functions for HTML
window.siNavigateLesson = siNavigateLesson;
window.siShowTopic4Quiz = siShowTopic4Quiz;
window.siAnalyzePerformance = siAnalyzePerformance;