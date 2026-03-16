// Simple and Compound Values - Interactive JavaScript

// ------------------------------
// Lesson Navigation & Completion
// ------------------------------
let scCurrentLesson = 1;
let scCompletedLessons = new Set();
const scTotalLessons = 5;
let scLessonStartTime = {};
let scTotalStudyTime = {}; // Track total time per lesson in seconds
let scLastSavedTime = {}; // Track last confirmed saved time from server (to prevent double counting)
let scLastSaveTimestamp = {}; // Track when we last saved (to calculate elapsed correctly)
let scStudyTimeInterval = null;
let scTimerUpdateInterval = null; // For live timer display

// ------------------------------
// Quiz System - 5 questions per topic
// ------------------------------
const scLesson1Quiz = [
    {
        question: "What is the main purpose of understanding interest in financial transactions?",
        options: [
            "To make wise financial decisions about savings, loans, and investments",
            "To avoid paying interest",
            "To calculate only simple interest",
            "To understand only compound interest"
        ],
        correct: 0
    },
    {
        question: "In the dialogue, Janice considers a Kid Savers bank account with 2.5% annual interest. What does this mean?",
        options: [
            "The bank will pay 2.5% of the principal amount as interest each year",
            "The bank will charge 2.5% interest",
            "The interest rate changes monthly",
            "Interest is only paid once"
        ],
        correct: 0
    },
    {
        question: "What are the advantages of saving money in a bank account with interest?",
        options: [
            "Money grows over time, helps with future expenses, and teaches financial discipline",
            "Money stays the same",
            "Money decreases over time",
            "No advantages"
        ],
        correct: 0
    },
    {
        question: "Why is it important to understand the difference between simple and compound interest?",
        options: [
            "It helps in choosing the best savings or loan options",
            "They are always the same",
            "Only simple interest matters",
            "Only compound interest matters"
        ],
        correct: 0
    },
    {
        question: "What types of financial transactions involve interest?",
        options: [
            "Deposits, withdrawals, loans, and credit purchases",
            "Only deposits",
            "Only loans",
            "Only credit purchases"
        ],
        correct: 0
    }
];

const scLesson2Quiz = [
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
        question: "In the formula Is = Prt, what does 'r' represent?",
        options: [
            "Annual interest rate as a decimal",
            "Monthly interest rate",
            "Total interest",
            "Principal amount"
        ],
        correct: 0
    },
    {
        question: "What is the formula for maturity value (F) using simple interest?",
        options: [
            "F = P(1 + rt) = P + Is",
            "F = P + r + t",
            "F = P / (1 + rt)",
            "F = P × r × t"
        ],
        correct: 0
    },
    {
        question: "If P = ₱18,500, r = 3%, t = 5 years, what is the simple interest?",
        options: [
            "₱2,775",
            "₱2,500",
            "₱3,000",
            "₱2,000"
        ],
        correct: 0
    },
    {
        question: "How do you solve for Principal (P) when Is, r, and t are known?",
        options: [
            "P = Is / (rt)",
            "P = Is × r × t",
            "P = Is + r + t",
            "P = Is - r - t"
        ],
        correct: 0
    }
];

const scLesson3Quiz = [
    {
        question: "What is the purpose of Activity 1.1 in simple interest?",
        options: [
            "To compute Is and F with given P, r, t (converting percent to decimals and months to years)",
            "To only calculate principal",
            "To only calculate rate",
            "To skip calculations"
        ],
        correct: 0
    },
    {
        question: "In Activity 1.2, what do you need to find?",
        options: [
            "Missing components given any three of P, r, t, Is, F",
            "Only principal",
            "Only interest",
            "Only time"
        ],
        correct: 0
    },
    {
        question: "How do you convert a percentage rate to decimal form?",
        options: [
            "Divide by 100",
            "Multiply by 100",
            "Add 100",
            "Subtract 100"
        ],
        correct: 0
    },
    {
        question: "How do you convert 9 months to years for the formula?",
        options: [
            "9/12 = 0.75 years",
            "9 × 12 = 108 years",
            "9/100 = 0.09 years",
            "9 years"
        ],
        correct: 0
    },
    {
        question: "What is the relationship between simple interest and maturity value?",
        options: [
            "F = P + Is",
            "F = P - Is",
            "F = P × Is",
            "F = P / Is"
        ],
        correct: 0
    }
];

const scLesson4Quiz = [
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
        question: "In the formula F = P(1 + r/n)^(nt), what does 'n' represent?",
        options: [
            "Number of times interest is compounded per year",
            "Number of years",
            "Principal amount",
            "Interest rate"
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
        question: "What is the formula for Present Value (PV)?",
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
    }
];

const scLesson5Quiz = [
    {
        question: "In the Money Matters activity, what factors should be considered besides interest rate?",
        options: [
            "Liquidity, risk, and financial goals",
            "Only interest rate",
            "Only time period",
            "Only principal amount"
        ],
        correct: 0
    },
    {
        question: "Why does compound interest yield more than simple interest over time?",
        options: [
            "Because interest earns interest, creating exponential growth",
            "They always yield the same",
            "Simple interest always yields more",
            "It depends on the rate"
        ],
        correct: 0
    },
    {
        question: "What are ways to reduce loan costs with compound interest?",
        options: [
            "Early partial payments, lower rate, shorter term",
            "Only longer term",
            "Only higher rate",
            "Only larger principal"
        ],
        correct: 0
    },
    {
        question: "For a ₱50,000 time deposit at 1.75% for 8 years, what is the final amount with compound interest?",
        options: [
            "₱57,470",
            "₱57,000",
            "₱56,500",
            "₱57,200"
        ],
        correct: 0
    },
    {
        question: "What is the key difference between simple and compound interest in real-world applications?",
        options: [
            "Compound interest grows exponentially, simple interest grows linearly",
            "They are the same",
            "Simple interest always grows faster",
            "Compound interest only works for loans"
        ],
        correct: 0
    }
];

// ------------------------------
// Quiz System
// ------------------------------
// Fisher-Yates shuffle algorithm
function scShuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function scShuffleQuiz(quizArray) {
    // Shuffle questions
    const shuffledQuestions = scShuffleArray(quizArray);
    
    // Shuffle options for each question and update correct index
    return shuffledQuestions.map(quiz => {
        const options = [...quiz.options];
        const correctAnswer = options[quiz.correct];
        const shuffledOptions = scShuffleArray(options);
        const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);
        
        return {
            ...quiz,
            options: shuffledOptions,
            correct: newCorrectIndex
        };
    });
}

function scGenerateExplanation(quiz, selectedAnswer) {
    const isCorrect = selectedAnswer === quiz.correct;
    const correctText = quiz.options[quiz.correct];
    
    if (isCorrect) {
        return `Correct! ${correctText} is the right answer.`;
    } else {
        return `Incorrect. The correct answer is: ${correctText}`;
    }
}

async function scRunLessonQuiz(lessonNum) {
    const quizArray = [
        scLesson1Quiz,
        scLesson2Quiz,
        scLesson3Quiz,
        scLesson4Quiz,
        scLesson5Quiz
    ][lessonNum - 1];
    
    if (!quizArray) return false;
    
    // Track quiz start time
    window.scQuizStartTime = Date.now();
    
    // Shuffle quiz questions and options
    const shuffledQuiz = scShuffleQuiz(quizArray);
    
    let currentQuestion = 0;
    let score = 0;
    const totalQuestions = shuffledQuiz.length;
    const userAnswers = [];
    
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
        confirmButtonColor: '#8b5cf6',
        cancelButtonText: 'Cancel',
        showCancelButton: true,
        cancelButtonColor: '#6b7280',
        allowOutsideClick: false,
        width: window.innerWidth <= 768 ? '90%' : '700px',
        customClass: {
            popup: 'rounded-2xl shadow-2xl',
            title: 'text-slate-800 text-2xl font-bold',
            htmlContainer: 'text-left',
            confirmButton: 'px-6 py-3 rounded-lg font-semibold',
            cancelButton: 'px-6 py-3 rounded-lg font-semibold'
        }
    });
    
    if (!introResult.isConfirmed) {
        return false;
    }
    
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
            width: window.innerWidth <= 768 ? '90%' : '750px',
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
                            explanation: scGenerateExplanation(currentQuiz, selectedAnswer)
                        };
                        
                        if (isCorrect) {
                            score++;
                        }
                        
                        // Disable all options (no visual feedback - user won't know if correct or incorrect)
                        document.querySelectorAll('.quiz-option').forEach(b => {
                            b.disabled = true;
                            // Just add a subtle selected state, no color indication
                            if (parseInt(b.dataset.answer) === selectedAnswer) {
                                b.classList.add('opacity-75');
                            }
                        });
                        
                        // Move to next question immediately (no delay to show feedback)
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
                        scShowLesson(lessonNum);
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
            width: window.innerWidth <= 768 ? '90%' : '600px',
            customClass: {
                popup: 'rounded-2xl shadow-2xl',
                title: 'text-slate-800 text-2xl font-bold',
                htmlContainer: 'text-left'
            }
        }).then(async (result) => {
            if (passed) {
                // Calculate time taken
                const timeTakenSeconds = Math.floor((Date.now() - window.scQuizStartTime) / 1000);
                
                // Store quiz data with enhanced information
                await scStoreQuizData(lessonNum, score, totalQuestions, userAnswers, timeTakenSeconds);
                
                // Complete lesson
                await scCompleteLesson(lessonNum);
                
                // Automatically navigate to next lesson if not the last one
                if (lessonNum < scTotalLessons) {
                    setTimeout(() => {
                        scShowLesson(lessonNum + 1);
                    }, 500);
                } else {
                    // If it's the last lesson, show performance analysis section
                    scShowPerformanceAnalysisSection();
                }
            } else {
                // Show lesson again if failed
                scShowLesson(lessonNum);
            }
        });
    }
    
    displayQuestion();
    return true;
}

// ------------------------------
// Store Quiz Data
// ------------------------------
async function scStoreQuizData(lessonNum, score, totalQuestions, userAnswers, timeTakenSeconds = 0) {
    const quizData = {
        topic: 'simple-and-compound-values',
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
// Timer variables are declared at the top of the file

function scStartLiveTimer() {
    // Clear existing timer
    if (scTimerUpdateInterval) {
        clearInterval(scTimerUpdateInterval);
    }
    
    // Don't start timer if lesson is already completed
    if (scCompletedLessons.has(scCurrentLesson)) {
        scUpdateLiveTimer(); // Just show final time
        return;
    }
    
    // Initialize start time if not set
    if (!scLessonStartTime[scCurrentLesson]) {
        scLessonStartTime[scCurrentLesson] = Date.now();
    }
    
    // Initialize last save timestamp if not set
    if (!scLastSaveTimestamp[scCurrentLesson]) {
        scLastSaveTimestamp[scCurrentLesson] = Date.now();
    }
    
    // Update timer immediately
    scUpdateLiveTimer();
    
    // Update timer every second
    scTimerUpdateInterval = setInterval(function() {
        // Stop if lesson becomes completed
        if (scCompletedLessons.has(scCurrentLesson)) {
            clearInterval(scTimerUpdateInterval);
            scTimerUpdateInterval = null;
            scUpdateLiveTimer(); // Show final time
            return;
        }
        scUpdateLiveTimer();
    }, 1000);
}

function scUpdateLiveTimer() {
    if (!scCurrentLesson) return;
    
    const section = document.getElementById(`lesson${scCurrentLesson}`);
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
    if (scCompletedLessons.has(scCurrentLesson)) {
        // Show final time for completed lesson
        let finalTime = scTotalStudyTime[scCurrentLesson] || scLastSavedTime[scCurrentLesson] || 0;
        
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
    const currentSessionElapsed = Math.floor((now - scLastSaveTimestamp[scCurrentLesson]) / 1000);
    const totalElapsed = (scLastSavedTime[scCurrentLesson] || 0) + currentSessionElapsed;
    
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

function scSaveStudyTimeForCurrentLesson() {
    if (!scCurrentLesson || scCompletedLessons.has(scCurrentLesson)) return;
    
    const now = Date.now();
    if (!scLastSaveTimestamp[scCurrentLesson]) {
        scLastSaveTimestamp[scCurrentLesson] = now;
        return;
    }
    
    // Calculate elapsed time since last save
    const elapsedSinceLastSave = Math.floor((now - scLastSaveTimestamp[scCurrentLesson]) / 1000);
    
    if (elapsedSinceLastSave > 0) {
        // Add to total study time
        scTotalStudyTime[scCurrentLesson] = (scTotalStudyTime[scCurrentLesson] || 0) + elapsedSinceLastSave;
        
        // Update last saved time
        scLastSavedTime[scCurrentLesson] = scTotalStudyTime[scCurrentLesson];
        scLastSaveTimestamp[scCurrentLesson] = now;
        
        // Send to server
        scSendStudyTimeToServer();
    }
}

async function scSendStudyTimeToServer() {
    if (!scCurrentLesson) return;
    
    const timeToSave = scTotalStudyTime[scCurrentLesson] || 0;
    if (timeToSave <= 0) return;
    
    try {
        const response = await fetch('../php/store-study-time.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                topic: 'simple-and-compound-values',
                study_time: {
                    [scCurrentLesson]: timeToSave
                }
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Update last saved time after successful save
                scLastSavedTime[scCurrentLesson] = timeToSave;
                scLastSaveTimestamp[scCurrentLesson] = Date.now();
            }
        }
    } catch (error) {
        console.error('Error saving study time:', error);
    }
}

async function scLoadAndDisplayStudyTime() {
    if (!scCurrentLesson) return;
    
    try {
        const response = await fetch(`../php/get-study-time.php?topic=simple-and-compound-values&lesson=${scCurrentLesson}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.study_time) {
                const savedTime = parseInt(data.study_time[scCurrentLesson]) || 0;
                scLastSavedTime[scCurrentLesson] = savedTime;
                scTotalStudyTime[scCurrentLesson] = savedTime;
                scLastSaveTimestamp[scCurrentLesson] = Date.now();
                
                // Update display
                scUpdateLiveTimer();
            }
        }
    } catch (error) {
        console.error('Error loading study time:', error);
    }
}

// ------------------------------
// Sidebar Navigation
// ------------------------------
function scInitializeSidebar() {
    document.querySelectorAll('.lesson-topic-header').forEach(header => {
        header.addEventListener('click', function(e) {
            const topic = this.closest('.lesson-topic');
            const lessonNum = parseInt(topic.dataset.lesson);
            
            if (topic.classList.contains('locked')) {
                scShowTopicLockedMessage(lessonNum);
                return;
            }
            
            // Show lesson when topic header is clicked
            scShowLesson(lessonNum);
            scSetSidebarActive(lessonNum, 'objective');
            
            // Also toggle expansion
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
            if (sidebar && window.innerWidth <= 1023) {
                sidebar.classList.remove('open');
                if (backdrop) backdrop.classList.add('hidden');
            }
        });
    });
    
    document.querySelectorAll('.lesson-subitem').forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent topic header click
            
            const lessonNum = parseInt(this.dataset.lesson);
            if (this.closest('.lesson-topic').classList.contains('locked')) {
                scShowTopicLockedMessage(lessonNum);
                return;
            }
            
            scShowLesson(lessonNum);
            scSetSidebarActive(lessonNum, this.dataset.section);
            
            // Close mobile sidebar
            const sidebar = document.getElementById('lessonSidebar');
            const backdrop = document.getElementById('mobileBackdrop');
            if (sidebar && window.innerWidth <= 1023) {
                sidebar.classList.remove('open');
                if (backdrop) backdrop.classList.add('hidden');
            }
        });
    });
    
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

function scSetSidebarActive(lessonNum, section) {
    document.querySelectorAll('.lesson-subitem').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.dataset.lesson) === lessonNum && item.dataset.section === section) {
            item.classList.add('active');
        }
    });
    
    const topic = document.getElementById(`sidebar-topic-${lessonNum}`);
    if (topic) {
        document.querySelectorAll('.lesson-topic').forEach(t => t.classList.remove('expanded'));
        topic.classList.add('expanded');
        const header = topic.querySelector('.lesson-topic-header');
        if (header) header.setAttribute('aria-expanded', 'true');
    }
}

function scUpdateSidebarProgress() {
    for (let i = 1; i <= scTotalLessons; i++) {
        const topic = document.getElementById(`sidebar-topic-${i}`);
        if (!topic) continue;
        
        const progressText = topic.querySelector('.topic-status-text');
        if (progressText) {
            if (scCompletedLessons.has(i)) {
                progressText.textContent = '✓';
            } else {
                // Empty string for accessible but incomplete topics (matching functions.html)
                progressText.textContent = '';
            }
        }
        
        const dot = topic.querySelector('.lesson-topic-dot');
        if (dot) {
            if (scCompletedLessons.has(i)) {
                dot.classList.add('completed');
            } else {
                dot.classList.remove('completed');
                dot.textContent = i;
            }
        }
    }
}

function scCanAccessTopic(topicNum) {
    if (topicNum === 1) return true;
    return scCompletedLessons.has(topicNum - 1);
}

function scShowTopicLockedMessage(topicNum) {
    Swal.fire({
        icon: 'lock',
        title: 'Topic Locked',
        text: `Please complete Topic ${topicNum - 1} first to unlock this topic.`,
        confirmButtonColor: '#8b5cf6'
    });
}

function scUnlockTopics() {
    for (let i = 1; i <= scTotalLessons; i++) {
        const topic = document.getElementById(`sidebar-topic-${i}`);
        if (!topic) continue;
        
        if (scCanAccessTopic(i)) {
            topic.classList.remove('locked');
        } else {
            topic.classList.add('locked');
        }
    }
}

// ------------------------------
// Lesson Display & Navigation
// ------------------------------
async function scShowLesson(lessonNum) {
    // Stop timer intervals before switching
    if (scTimerUpdateInterval) {
        clearInterval(scTimerUpdateInterval);
        scTimerUpdateInterval = null;
    }
    if (scStudyTimeInterval) {
        clearInterval(scStudyTimeInterval);
        scStudyTimeInterval = null;
    }
    
    // Save study time for previous lesson before switching
    if (scCurrentLesson && !scCompletedLessons.has(scCurrentLesson)) {
        await scSaveStudyTimeForCurrentLesson(scCurrentLesson);
    }
    
    scCurrentLesson = lessonNum;
    
    document.querySelectorAll('.lesson-section').forEach(s => s.classList.remove('active'));
    
    const lesson = document.getElementById(`lesson${lessonNum}`);
    if (lesson) {
        lesson.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Ensure timer container is visible
        const timerContainer = lesson.querySelector('.flex-shrink-0.ml-4');
        if (timerContainer) {
            timerContainer.classList.remove('hidden');
            timerContainer.style.display = 'flex';
            timerContainer.style.visibility = 'visible';
        }
        
        // Initialize timer variables for new lessons
        if (!scCompletedLessons.has(lessonNum)) {
            if (!scLastSavedTime[lessonNum]) {
                scLastSavedTime[lessonNum] = 0;
            }
            if (!scLastSaveTimestamp[lessonNum]) {
                scLastSaveTimestamp[lessonNum] = Date.now();
            }
        } else {
            // Clear start time for completed lessons
            delete scLessonStartTime[lessonNum];
        }
        
        // Load study time for this lesson
        await scLoadAndDisplayStudyTime();
        
        // Start timer (will handle completed lessons appropriately)
        scStartLiveTimer();
        
        // Update timer display
        scUpdateLiveTimer();
        
        // Update sidebar
        scSetSidebarActive(lessonNum, 'objective');
        
        // Show/hide Topic 5 quiz button (if applicable)
        const topic5QuizButton = document.getElementById('topic5QuizButton');
        if (topic5QuizButton) {
            if (lessonNum === 5 && !scCompletedLessons.has(5)) {
                topic5QuizButton.style.display = 'block';
            } else {
                topic5QuizButton.style.display = 'none';
            }
        }
    }
    
    scUpdateNavigationButtons();
    scUpdateSidebarProgress();
}

function scUpdateNavigationButtons() {
    for (let i = 1; i <= scTotalLessons; i++) {
        const prevBtn = document.getElementById(`prevLessonBtn-${i}`);
        const nextBtn = document.getElementById(`nextLessonBtn-${i}`);
        const currentNum = document.getElementById(`currentLessonNum-${i}`);
        const progressBar = document.getElementById(`lessonProgressBar-${i}`);
        
        if (prevBtn) {
            prevBtn.disabled = scCurrentLesson <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = false; // Never disable next button
        }
        
        if (currentNum) {
            currentNum.textContent = scCurrentLesson;
        }
        
        if (progressBar) {
            progressBar.style.width = `${(scCurrentLesson / scTotalLessons) * 100}%`;
        }
    }
}

function scNavigateLesson(dir) {
    const next = scCurrentLesson + dir;
    
    if (dir > 0) {
        if (!scCompletedLessons.has(scCurrentLesson)) {
            scRunLessonQuiz(scCurrentLesson);
            return;
        }
        
        if (!scCanAccessTopic(next)) {
            scShowTopicLockedMessage(next);
            return;
        }
        
        if (next > scTotalLessons) {
            Swal.fire({
                icon: 'info',
                title: 'All Topics Completed!',
                text: 'You have completed all topics. Great job!',
                confirmButtonColor: '#8b5cf6'
            });
            return;
        }
    }
    
    if (next >= 1 && next <= scTotalLessons) {
        scShowLesson(next);
    }
}

// ------------------------------
// Lesson Completion
// ------------------------------
async function scCompleteLesson(lessonNum) {
    // Save final study time before marking as complete
    if (!scCompletedLessons.has(lessonNum)) {
        await scSaveStudyTimeForCurrentLesson(lessonNum);
        
        // Calculate final time
        const finalTime = scTotalStudyTime[lessonNum] || scLastSavedTime[lessonNum] || 0;
        
        // Send to server
        await scSendStudyTimeToServer();
        
        // Add to completed set after saving
        scCompletedLessons.add(lessonNum);
        
        // Stop timer intervals
        if (scTimerUpdateInterval) {
            clearInterval(scTimerUpdateInterval);
            scTimerUpdateInterval = null;
        }
        if (scStudyTimeInterval) {
            clearInterval(scStudyTimeInterval);
            scStudyTimeInterval = null;
        }
        
        // Clear start time for completed lesson
        delete scLessonStartTime[lessonNum];
        
        // Update timer display to show final time (green)
        scUpdateLiveTimer();
        
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
        
        // Load and display study time to ensure correct display
        await scLoadAndDisplayStudyTime();
        scUpdateLiveTimer();
        
        // Retry mechanism if timer still shows 00:00
        if ((scTotalStudyTime[lessonNum] || 0) === 0 && finalTime > 0) {
            setTimeout(async () => {
                await scLoadAndDisplayStudyTime();
                scUpdateLiveTimer();
                
                // If still 0, use the calculated finalTime as fallback
                if ((scTotalStudyTime[lessonNum] || 0) === 0 && finalTime > 0) {
                    scTotalStudyTime[lessonNum] = finalTime;
                    scLastSavedTime[lessonNum] = finalTime;
                    scUpdateLiveTimer();
                }
            }, 500);
        }
        
        try {
            await fetch('../php/complete-lesson.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    action: 'complete',
                    topic: 'simple-and-compound-values',
                    lesson: lessonNum
                })
            });
        } catch (err) {
            console.error('Error completing lesson:', err);
        }
        
        scUpdateSidebarProgress();
    }
    
    scUpdateSidebarProgress();
    scUnlockTopics();
    
    // Reload study time to ensure correct display
    await scLoadAndDisplayStudyTime();
    scUpdateLiveTimer();
    
    // Retry if timer still shows 00:00
    setTimeout(async () => {
        const timerDisplay = section?.querySelector('.lesson-timer-display');
        if (timerDisplay && timerDisplay.textContent === '00:00') {
            await scLoadAndDisplayStudyTime();
            scUpdateLiveTimer();
        }
    }, 500);
    
    // Show performance analysis section if all quizzes are completed
    scShowPerformanceAnalysisSection();
    
    const statusEl = document.getElementById(`lessonCompletionStatus-${lessonNum}`);
    if (statusEl) {
        statusEl.classList.remove('hidden');
        statusEl.innerHTML = `
            <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p class="text-green-800 font-semibold">✓ Topic ${lessonNum} Completed!</p>
            </div>
        `;
    }
}

async function scLoadCompletedLessons() {
    try {
        const response = await fetch('../php/complete-lesson.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                action: 'get_completed',
                topic: 'simple-and-compound-values'
            })
        });
        
        const data = await response.json();
        if (data.success && data.lessons) {
            scCompletedLessons = new Set(data.lessons);
            
            // Load study time for all completed lessons
            for (const lessonNum of scCompletedLessons) {
                try {
                    const timeResponse = await fetch(`../php/get-study-time.php?topic=simple-and-compound-values&lesson=${lessonNum}`, {
                        credentials: 'include'
                    });
                    if (timeResponse.ok) {
                        const timeData = await timeResponse.json();
                        if (timeData.success && timeData.study_time) {
                            const savedTime = parseInt(timeData.study_time[lessonNum]) || 0;
                            scLastSavedTime[lessonNum] = savedTime;
                            scTotalStudyTime[lessonNum] = savedTime;
                            scLastSaveTimestamp[lessonNum] = Date.now();
                        }
                    }
                } catch (e) {
                    console.error(`Error loading study time for lesson ${lessonNum}:`, e);
                }
            }
            
            scUpdateSidebarProgress();
            scUnlockTopics();
        }
    } catch (err) {
        console.error('Error loading completed lessons:', err);
    }
}

// ------------------------------
// Performance Analysis (Custom AI - matching functions.html)
// ------------------------------
function scShowPerformanceAnalysisSection() {
    // Check if all 5 topics are completed
    if (scCompletedLessons.size !== scTotalLessons) {
        console.log('Performance analysis will only show after completing all quizzes. Current completed:', scCompletedLessons.size, '/', scTotalLessons);
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

async function scAnalyzePerformance() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultSection = document.getElementById('analysisResult');
    
    // Show loading state
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
    }
    
    try {
        const response = await fetch(`../php/analyze-quiz-performance.php?topic=simple-and-compound-values`, {
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
            scDisplayPerformanceAnalysis(result.analysis);
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

function scDisplayPerformanceAnalysis(analysis) {
    const resultSection = document.getElementById('analysisResult');
    if (!resultSection) return;
    
    resultSection.classList.remove('hidden');
    resultSection.innerHTML = analysis;
}

function scShowTopic5Quiz() {
    if (scCompletedLessons.has(5)) {
        Swal.fire({
            icon: 'info',
            title: 'Quiz Already Completed',
            text: 'You have already completed Topic 5 quiz.',
            confirmButtonColor: '#667eea'
        });
        return;
    }
    
    scRunLessonQuiz(5);
}

// Export functions to window for HTML onclick handlers
window.scNavigateLesson = scNavigateLesson;
window.scShowTopic5Quiz = scShowTopic5Quiz;
window.scAnalyzePerformance = scAnalyzePerformance;
window.scShowPerformanceAnalysisSection = scShowPerformanceAnalysisSection;
window.scDisplayPerformanceAnalysis = scDisplayPerformanceAnalysis;
window.getTopicNameForAnalysis = () => 'simple-and-compound-values';

function completeTopic() {
    fetch('../php/complete-lesson.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            action: 'complete_topic',
            topic: 'simple-and-compound-values'
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Topic Completed!',
                text: 'Great job completing all topics!',
                confirmButtonColor: '#8b5cf6'
            });
        }
    })
    .catch(err => console.error('Error completing topic:', err));
}

// ------------------------------
// User Dropdown Functions
// ------------------------------
function toggleUserDropdown() {
    const menu = document.getElementById('userDropdownMenu');
    if (menu) {
        menu.classList.toggle('show');
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
        confirmButtonColor: '#8b5cf6',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, logout'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = '../php/logout.php';
        }
    });
}

function loadProfilePicture(userId) {
    const profileImg = document.getElementById('userProfileImage');
    const profileImgDropdown = document.getElementById('userProfileImageDropdown');
    const profileImgMobile = document.getElementById('userProfileImageMobile');
    const iconIds = ['userProfileIcon', 'userProfileIconDropdown', 'userProfileIconMobile'];
    if (!userId) return;
    fetch('../php/user.php', { credentials: 'include', cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
            if (!data.success || !data.user || !data.user.profile_picture) {
                [profileImg, profileImgDropdown, profileImgMobile].forEach(img => {
                    if (img) { img.src = ''; img.classList.add('hidden'); }
                });
                iconIds.forEach(id => {
                    const icon = document.getElementById(id);
                    if (icon) icon.style.display = 'block';
                });
                return;
            }
            const path = '../' + data.user.profile_picture + '?t=' + Date.now();
            [profileImg, profileImgDropdown, profileImgMobile].forEach(img => {
                if (img) {
                    img.src = path;
                    img.classList.remove('hidden');
                }
            });
            iconIds.forEach(id => {
                const icon = document.getElementById(id);
                if (icon) icon.style.display = 'none';
            });
        })
        .catch(() => {});
}

// ------------------------------
// Calculator Functions
// ------------------------------
function calculateSimpleInterest() {
    const P = parseFloat(document.getElementById('siP')?.value) || 0;
    const rPct = parseFloat(document.getElementById('siR')?.value) || 0;
    const t = parseFloat(document.getElementById('siT')?.value) || 0;
    const r = rPct / 100;
    const Is = P * r * t;
    const F = P + Is;

    // Update main results
    const siInterest = document.getElementById('siInterest');
    const siFuture = document.getElementById('siFuture');
    const siExample = document.getElementById('siExample');
    if (siInterest) {
        siInterest.textContent = '₱ ' + Is.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        siInterest.classList.add('updated');
        setTimeout(() => siInterest.classList.remove('updated'), 600);
    }
    if (siFuture) {
        siFuture.textContent = '₱ ' + F.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        siFuture.classList.add('updated');
        setTimeout(() => siFuture.classList.remove('updated'), 600);
    }
    if (siExample) {
        siExample.textContent = `Is = ${P.toLocaleString()}×${r.toFixed(3)}×${t} = ${Is.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} → F = ${F.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    }
    
    // Update display values
    const siPDisplay = document.getElementById('siPDisplay');
    const siRDisplay = document.getElementById('siRDisplay');
    const siTDisplay = document.getElementById('siTDisplay');
    if (siPDisplay) siPDisplay.textContent = '₱' + P.toLocaleString();
    if (siRDisplay) siRDisplay.textContent = rPct.toFixed(1) + '%';
    if (siTDisplay) {
        const years = parseFloat(t);
        siTDisplay.textContent = years === 1 ? '1 year' : years + ' years';
    }
    
    // Update visual breakdown
    updateSimpleInterestVisualBreakdown(P, F, Is);
    
    // Update step-by-step solution
    updateSimpleInterestStepByStep(P, rPct, r, t, Is, F);
}

function updateSimpleInterestVisualBreakdown(P, F, Is) {
    const principalBar = document.getElementById('siPrincipalBar');
    const interestBar = document.getElementById('siInterestBar');
    const principalBarText = document.getElementById('siPrincipalBarText');
    const interestBarText = document.getElementById('siInterestBarText');
    const principalPercent = document.getElementById('siPrincipalPercent');
    const interestPercent = document.getElementById('siInterestPercent');
    
    if (F > 0) {
        const principalPct = (P / F) * 100;
        const interestPct = (Is / F) * 100;
        
        if (principalBar) {
            principalBar.style.width = principalPct + '%';
            if (principalBarText) principalBarText.textContent = '₱' + P.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        if (interestBar) {
            interestBar.style.width = interestPct + '%';
            if (interestBarText) interestBarText.textContent = '₱' + Is.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        if (principalPercent) principalPercent.textContent = principalPct.toFixed(1) + '%';
        if (interestPercent) interestPercent.textContent = interestPct.toFixed(1) + '%';
    }
}

function updateSimpleInterestStepByStep(P, rPct, r, t, Is, F) {
    const stepByStepEl = document.getElementById('siStepByStep');
    if (!stepByStepEl) return;
    
    stepByStepEl.innerHTML = `
        <div class="bg-white rounded-lg p-3 mb-2">
            <div class="font-semibold text-gray-800 mb-1">Step 1: Convert rate to decimal</div>
            <div class="font-mono text-sm text-gray-700">r = ${rPct}% = ${r.toFixed(4)}</div>
        </div>
        <div class="bg-white rounded-lg p-3 mb-2">
            <div class="font-semibold text-gray-800 mb-1">Step 2: Calculate simple interest</div>
            <div class="font-mono text-sm text-gray-700">Is = P × r × t</div>
            <div class="font-mono text-sm text-gray-700">Is = ₱${P.toLocaleString()} × ${r.toFixed(4)} × ${t}</div>
            <div class="font-mono text-sm font-bold text-primary mt-1">Is = ₱${Is.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
        </div>
        <div class="bg-white rounded-lg p-3">
            <div class="font-semibold text-gray-800 mb-1">Step 3: Calculate maturity value</div>
            <div class="font-mono text-sm text-gray-700">F = P + Is</div>
            <div class="font-mono text-sm text-gray-700">F = ₱${P.toLocaleString()} + ₱${Is.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
            <div class="font-mono text-sm font-bold text-green-600 mt-1">F = ₱${F.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
        </div>
    `;
}

// Interest Comparison Tool (Topic 1)
function updateInterestComparison() {
    const amount = parseFloat(document.getElementById('compareAmount')?.value) || 10000;
    const ratePct = parseFloat(document.getElementById('compareRate')?.value) || 2.5;
    const time = parseFloat(document.getElementById('compareTime')?.value) || 5;
    const rate = ratePct / 100;
    
    // Simple Interest
    const simpleInterest = amount * rate * time;
    const simpleTotal = amount + simpleInterest;
    
    // Compound Interest (annual)
    const compoundTotal = amount * Math.pow(1 + rate, time);
    const compoundInterest = compoundTotal - amount;
    
    // Difference
    const difference = compoundTotal - simpleTotal;
    const differencePercent = ((difference / simpleTotal) * 100);
    
    // Update results
    const simpleResult = document.getElementById('simpleResult');
    const compoundResult = document.getElementById('compoundResult');
    const simpleInterestEl = document.getElementById('simpleInterest');
    const compoundInterestEl = document.getElementById('compoundInterest');
    const differenceAmount = document.getElementById('differenceAmount');
    const differencePercentEl = document.getElementById('differencePercent');
    
    if (simpleResult) {
        simpleResult.textContent = '₱' + simpleTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        simpleResult.classList.add('updated');
        setTimeout(() => simpleResult.classList.remove('updated'), 600);
    }
    if (compoundResult) {
        compoundResult.textContent = '₱' + compoundTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        compoundResult.classList.add('updated');
        setTimeout(() => compoundResult.classList.remove('updated'), 600);
    }
    if (simpleInterestEl) simpleInterestEl.textContent = '₱' + simpleInterest.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (compoundInterestEl) compoundInterestEl.textContent = '₱' + compoundInterest.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (differenceAmount) {
        differenceAmount.textContent = '₱' + difference.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        differenceAmount.classList.add('updated');
        setTimeout(() => differenceAmount.classList.remove('updated'), 600);
    }
    if (differencePercentEl) differencePercentEl.textContent = differencePercent.toFixed(1) + '%';
    
    // Update yearly comparison
    updateYearlyComparison(amount, rate, time);
}

function updateYearlyComparison(amount, rate, time) {
    const yearlyEl = document.getElementById('yearlyComparison');
    if (!yearlyEl) return;
    
    let html = '';
    for (let year = 1; year <= Math.min(time, 10); year++) {
        const simpleValue = amount * (1 + rate * year);
        const compoundValue = amount * Math.pow(1 + rate, year);
        const diff = compoundValue - simpleValue;
        
        html += `
            <div class="bg-white rounded-lg p-3 flex items-center justify-between hover:bg-blue-50 transition-colors">
                <div class="flex-1">
                    <p class="font-semibold text-gray-800">Year ${year}:</p>
                    <div class="text-xs text-gray-600 mt-1">
                        <span class="text-blue-600">Simple: ₱${simpleValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span> | 
                        <span class="text-green-600">Compound: ₱${compoundValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-semibold text-purple-600">+₱${diff.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</p>
                    <p class="text-xs text-gray-500">difference</p>
                </div>
            </div>
        `;
    }
    yearlyEl.innerHTML = html;
}

function showInterestTutorial() {
    Swal.fire({
        title: '📚 How to Use the Comparison Tool',
        html: `
            <div class="text-left space-y-4">
                <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <h4 class="font-bold text-gray-800 mb-2">Step 1: Enter Your Values</h4>
                    <p class="text-sm text-gray-700">Enter the initial amount, interest rate, and time period.</p>
                </div>
                <div class="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                    <h4 class="font-bold text-gray-800 mb-2">Step 2: Compare Results</h4>
                    <p class="text-sm text-gray-700">See how simple interest compares to compound interest. Notice how compound interest grows faster!</p>
                </div>
                <div class="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <h4 class="font-bold text-gray-800 mb-2">Step 3: View Year-by-Year</h4>
                    <p class="text-sm text-gray-700">Scroll down to see how the difference grows each year.</p>
                </div>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'Got it!',
        confirmButtonColor: '#8b5cf6',
        width: '600px'
    });
}

function showSimpleInterestTutorial() {
    Swal.fire({
        title: '📚 Simple Interest Calculator Tutorial',
        html: `
            <div class="text-left space-y-4">
                <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <h4 class="font-bold text-gray-800 mb-2">Understanding the Formula</h4>
                    <p class="text-sm text-gray-700 mb-2">Simple Interest = Principal × Rate × Time</p>
                    <p class="text-xs text-gray-600">Remember: Rate must be in decimal form (divide percentage by 100)</p>
                </div>
                <div class="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                    <h4 class="font-bold text-gray-800 mb-2">Step-by-Step Solution</h4>
                    <p class="text-sm text-gray-700">Watch the step-by-step solution update automatically as you change values!</p>
                </div>
                <div class="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <h4 class="font-bold text-gray-800 mb-2">Visual Breakdown</h4>
                    <p class="text-sm text-gray-700">See the visual representation of how principal and interest make up the total amount.</p>
                </div>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'Got it!',
        confirmButtonColor: '#8b5cf6',
        width: '600px'
    });
}

// Practice Table Calculator
function calculatePracticeTable() {
    const rows = document.querySelectorAll('#practiceTableBody tr');
    rows.forEach((row, index) => {
        const inputs = row.querySelectorAll('.practice-input');
        let P = 0, r = 0, t = 0, Is = 0, F = 0;
        
        inputs.forEach(input => {
            const field = input.dataset.field;
            const value = parseFloat(input.value) || 0;
            if (field === 'P') P = value;
            else if (field === 'r') r = value / 100;
            else if (field === 't') t = value;
            else if (field === 'Is') Is = value;
        });
        
        // Calculate missing values
        if (P && r && t && !Is) {
            Is = P * r * t;
            const IsInput = row.querySelector('[data-field="Is"]');
            if (IsInput && !IsInput.value) {
                IsInput.value = Is.toFixed(2);
            }
        } else if (P && r && Is && !t) {
            t = Is / (P * r);
            const tInput = row.querySelector('[data-field="t"]');
            if (tInput && !tInput.value) {
                tInput.value = t.toFixed(2);
            }
        } else if (P && t && Is && !r) {
            r = Is / (P * t);
            const rInput = row.querySelector('[data-field="r"]');
            if (rInput && !rInput.value) {
                rInput.value = (r * 100).toFixed(2);
            }
        } else if (r && t && Is && !P) {
            P = Is / (r * t);
            const PInput = row.querySelector('[data-field="P"]');
            if (PInput && !PInput.value) {
                PInput.value = P.toFixed(2);
            }
        }
        
        // Recalculate if values changed
        if (P && r && t) {
            Is = P * r * t;
        }
        
        F = P + Is;
        
        // Update display cells
        const IsCell = document.getElementById(`row${index}-Is`);
        const FCell = document.getElementById(`row${index}-F`);
        if (IsCell && Is > 0) {
            IsCell.textContent = '₱' + Is.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            IsCell.classList.add('updated');
            setTimeout(() => IsCell.classList.remove('updated'), 600);
        }
        if (FCell && F > 0) {
            FCell.textContent = '₱' + F.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            FCell.classList.add('updated');
            setTimeout(() => FCell.classList.remove('updated'), 600);
        }
    });
}

// Add event listeners to practice inputs
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const practiceInputs = document.querySelectorAll('.practice-input');
        practiceInputs.forEach(input => {
            input.addEventListener('input', calculatePracticeTable);
        });
    }, 500);
});

function calculateCompoundInteractive() {
    const P = parseFloat(document.getElementById('ciP')?.value) || 0;
    const rPct = parseFloat(document.getElementById('ciR')?.value) || 0;
    const t = parseFloat(document.getElementById('ciT')?.value) || 0;
    const n = parseInt(document.getElementById('ciN')?.value) || 1;
    const r = rPct / 100;
    const rOverN = r / n;
    const nt = n * t;
    const onePlusROverN = 1 + rOverN;
    const powerResult = Math.pow(onePlusROverN, nt);
    const F = P * powerResult;
    const Ic = F - P;

    // Update main results
    const fEl = document.getElementById('ciF');
    const iEl = document.getElementById('ciIc');
    const formula = document.getElementById('ciFormula');
    if (fEl) {
        fEl.textContent = '₱ ' + F.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        fEl.classList.add('updated');
        setTimeout(() => fEl.classList.remove('updated'), 600);
    }
    if (iEl) {
        iEl.textContent = '₱ ' + Ic.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        iEl.classList.add('updated');
        setTimeout(() => iEl.classList.remove('updated'), 600);
    }
    if (formula) {
        formula.textContent = `F = ${P.toLocaleString()}(1 + ${rOverN.toFixed(4)}/${n})^(${n}×${t})`;
    }
    
    // Update display values
    const ciPDisplay = document.getElementById('ciPDisplay');
    const ciRDisplay = document.getElementById('ciRDisplay');
    const ciTDisplay = document.getElementById('ciTDisplay');
    if (ciPDisplay) ciPDisplay.textContent = '₱' + P.toLocaleString();
    if (ciRDisplay) ciRDisplay.textContent = rPct.toFixed(1) + '%';
    if (ciTDisplay) {
        const years = parseFloat(t);
        ciTDisplay.textContent = years === 1 ? '1 year' : years + ' years';
    }
    
    // Update visual breakdown
    updateCompoundInterestVisualBreakdown(P, F, Ic);
    
    // Update step-by-step solution
    updateCompoundInterestStepByStep(P, rPct, r, n, t, rOverN, nt, onePlusROverN, powerResult, F, Ic);
}

function updateCompoundInterestVisualBreakdown(P, F, Ic) {
    const principalBar = document.getElementById('ciPrincipalBar');
    const interestBar = document.getElementById('ciInterestBar');
    const principalBarText = document.getElementById('ciPrincipalBarText');
    const interestBarText = document.getElementById('ciInterestBarText');
    const principalPercent = document.getElementById('ciPrincipalPercent');
    const interestPercent = document.getElementById('ciInterestPercent');
    
    if (F > 0) {
        const principalPct = (P / F) * 100;
        const interestPct = (Ic / F) * 100;
        
        if (principalBar) {
            principalBar.style.width = principalPct + '%';
            if (principalBarText) principalBarText.textContent = '₱' + P.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        if (interestBar) {
            interestBar.style.width = interestPct + '%';
            if (interestBarText) interestBarText.textContent = '₱' + Ic.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        if (principalPercent) principalPercent.textContent = principalPct.toFixed(1) + '%';
        if (interestPercent) interestPercent.textContent = interestPct.toFixed(1) + '%';
    }
}

function updateCompoundInterestStepByStep(P, rPct, r, n, t, rOverN, nt, onePlusROverN, powerResult, F, Ic) {
    const stepByStepEl = document.getElementById('ciStepByStep');
    if (!stepByStepEl) return;
    
    stepByStepEl.innerHTML = `
        <div class="bg-white rounded-lg p-3 mb-2">
            <div class="font-semibold text-gray-800 mb-1">Step 1: Convert rate to decimal</div>
            <div class="font-mono text-sm text-gray-700">r = ${rPct}% = ${r.toFixed(4)}</div>
        </div>
        <div class="bg-white rounded-lg p-3 mb-2">
            <div class="font-semibold text-gray-800 mb-1">Step 2: Calculate r/n</div>
            <div class="font-mono text-sm text-gray-700">r/n = ${r.toFixed(4)}/${n} = ${rOverN.toFixed(6)}</div>
        </div>
        <div class="bg-white rounded-lg p-3 mb-2">
            <div class="font-semibold text-gray-800 mb-1">Step 3: Calculate nt</div>
            <div class="font-mono text-sm text-gray-700">nt = ${n} × ${t} = ${nt}</div>
        </div>
        <div class="bg-white rounded-lg p-3 mb-2">
            <div class="font-semibold text-gray-800 mb-1">Step 4: Calculate (1 + r/n)</div>
            <div class="font-mono text-sm text-gray-700">1 + r/n = 1 + ${rOverN.toFixed(6)} = ${onePlusROverN.toFixed(6)}</div>
        </div>
        <div class="bg-white rounded-lg p-3 mb-2">
            <div class="font-semibold text-gray-800 mb-1">Step 5: Raise to power nt</div>
            <div class="font-mono text-sm text-gray-700">(${onePlusROverN.toFixed(6)})^${nt} = ${powerResult.toFixed(6)}</div>
        </div>
        <div class="bg-white rounded-lg p-3">
            <div class="font-semibold text-gray-800 mb-1">Step 6: Multiply by Principal</div>
            <div class="font-mono text-sm text-gray-700">F = ₱${P.toLocaleString()} × ${powerResult.toFixed(6)}</div>
            <div class="font-mono text-sm font-bold text-green-600 mt-1">F = ₱${F.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
            <div class="font-mono text-sm text-gray-700 mt-2">Ic = F - P = ₱${F.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} - ₱${P.toLocaleString()}</div>
            <div class="font-mono text-sm font-bold text-blue-600 mt-1">Ic = ₱${Ic.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
        </div>
    `;
}

function showCompoundInterestTutorial() {
    Swal.fire({
        title: '📚 Compound Interest Calculator Tutorial',
        html: `
            <div class="text-left space-y-4">
                <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <h4 class="font-bold text-gray-800 mb-2">Understanding the Formula</h4>
                    <p class="text-sm text-gray-700 mb-2">F = P(1 + r/n)^(nt)</p>
                    <p class="text-xs text-gray-600">Where n is the compounding frequency per year</p>
                </div>
                <div class="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                    <h4 class="font-bold text-gray-800 mb-2">Compounding Frequency</h4>
                    <p class="text-sm text-gray-700">More frequent compounding (higher n) results in higher final amounts. Try different frequencies to see the difference!</p>
                </div>
                <div class="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <h4 class="font-bold text-gray-800 mb-2">Step-by-Step Solution</h4>
                    <p class="text-sm text-gray-700">Watch the detailed step-by-step solution update automatically as you change values!</p>
                </div>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'Got it!',
        confirmButtonColor: '#8b5cf6',
        width: '600px'
    });
}

// Deposit Comparison Tool (Topic 5)
function compareDepositOptions() {
    const principal = parseFloat(document.getElementById('depositAmount')?.value) || 50000;
    
    // Option 1
    const opt1Rate = parseFloat(document.getElementById('opt1Rate')?.value) || 1.10;
    const opt1Term = parseFloat(document.getElementById('opt1Term')?.value) || 3;
    const opt1F = principal * Math.pow(1 + (opt1Rate / 100), opt1Term);
    const opt1Interest = opt1F - principal;
    
    // Option 2
    const opt2Rate = parseFloat(document.getElementById('opt2Rate')?.value) || 1.25;
    const opt2Term = parseFloat(document.getElementById('opt2Term')?.value) || 5;
    const opt2F = principal * Math.pow(1 + (opt2Rate / 100), opt2Term);
    const opt2Interest = opt2F - principal;
    
    // Option 3
    const opt3Rate = parseFloat(document.getElementById('opt3Rate')?.value) || 1.75;
    const opt3Term = parseFloat(document.getElementById('opt3Term')?.value) || 8;
    const opt3F = principal * Math.pow(1 + (opt3Rate / 100), opt3Term);
    const opt3Interest = opt3F - principal;
    
    // Update displays
    const opt1Amount = document.getElementById('opt1Amount');
    const opt1InterestEl = document.getElementById('opt1Interest');
    const opt2Amount = document.getElementById('opt2Amount');
    const opt2InterestEl = document.getElementById('opt2Interest');
    const opt3Amount = document.getElementById('opt3Amount');
    const opt3InterestEl = document.getElementById('opt3Interest');
    
    if (opt1Amount) {
        opt1Amount.textContent = '₱' + opt1F.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        opt1Amount.classList.add('updated');
        setTimeout(() => opt1Amount.classList.remove('updated'), 600);
    }
    if (opt1InterestEl) opt1InterestEl.textContent = '₱' + opt1Interest.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    if (opt2Amount) {
        opt2Amount.textContent = '₱' + opt2F.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        opt2Amount.classList.add('updated');
        setTimeout(() => opt2Amount.classList.remove('updated'), 600);
    }
    if (opt2InterestEl) opt2InterestEl.textContent = '₱' + opt2Interest.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    if (opt3Amount) {
        opt3Amount.textContent = '₱' + opt3F.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        opt3Amount.classList.add('updated');
        setTimeout(() => opt3Amount.classList.remove('updated'), 600);
    }
    if (opt3InterestEl) opt3InterestEl.textContent = '₱' + opt3Interest.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    // Find best option
    const amounts = [
        { value: opt1F, interest: opt1Interest, option: 1, rate: opt1Rate, term: opt1Term },
        { value: opt2F, interest: opt2Interest, option: 2, rate: opt2Rate, term: opt2Term },
        { value: opt3F, interest: opt3Interest, option: 3, rate: opt3Rate, term: opt3Term }
    ];
    
    const bestOption = amounts.reduce((best, current) => 
        current.interest > best.interest ? current : best
    );
    
    // Update best option analysis
    const analysisEl = document.getElementById('bestOptionAnalysis');
    if (analysisEl) {
        analysisEl.innerHTML = `
            <div class="bg-white rounded-lg p-4 mb-3">
                <p class="text-sm text-gray-600 mb-2">Highest Return:</p>
                <p class="text-2xl font-bold text-primary">Option ${bestOption.option}</p>
                <p class="text-sm text-gray-600 mt-2">Rate: ${bestOption.rate}% | Term: ${bestOption.term} years</p>
                <p class="text-lg font-semibold text-green-600 mt-2">Total Interest: ₱${bestOption.interest.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</p>
            </div>
            <div class="bg-blue-50 rounded-lg p-3">
                <p class="text-xs text-gray-700"><strong>💡 Remember:</strong> Consider liquidity needs, risk tolerance, and financial goals when choosing!</p>
            </div>
        `;
    }
}

function computePVFromF() {
    const F = parseFloat(document.getElementById('pvF')?.value) || 0;
    const rPct = parseFloat(document.getElementById('ciR')?.value) || 0;
    const t = parseFloat(document.getElementById('ciT')?.value) || 0;
    const n = parseInt(document.getElementById('ciN')?.value) || 1;
    const r = rPct / 100;
    const PV = F / Math.pow(1 + r / n, n * t);
    const pvEl = document.getElementById('ciPV');
    if (pvEl) {
        pvEl.textContent = '₱ ' + PV.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        pvEl.classList.add('updated');
        setTimeout(() => pvEl.classList.remove('updated'), 600);
    }
}

// ------------------------------
// Initialize Everything
// ------------------------------
document.addEventListener('DOMContentLoaded', function() {
    // Load user info
    fetch('../php/user.php', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.user) {
                const nameEl = document.getElementById('userName');
                const nameDropdown = document.getElementById('userNameDropdown');
                const nameMobile = document.getElementById('userNameMobile');
                
                if (nameEl) nameEl.textContent = data.user.first_name;
                if (nameDropdown) nameDropdown.textContent = data.user.first_name;
                if (nameMobile) nameMobile.textContent = data.user.first_name;
                
                if (data.user.id) {
                    loadProfilePicture(data.user.id);
                }
            }
        })
        .catch(() => {});
    
    // Initialize sidebar
    scInitializeSidebar();
    
    // Load completed lessons
    scLoadCompletedLessons();
    
    // Load and display study time
    scLoadAndDisplayStudyTime();
    
    // Show first lesson
    scShowLesson(1);
    
    // Start periodic study time saving (every 30 seconds)
    scStudyTimeInterval = setInterval(() => {
        if (scCurrentLesson && !scCompletedLessons.has(scCurrentLesson)) {
            scSaveStudyTimeForCurrentLesson(scCurrentLesson);
        }
    }, 30000);
    
    // Handle visibility change (tab switch, minimize, etc.)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Page is hidden, save current time
            if (scCurrentLesson && !scCompletedLessons.has(scCurrentLesson)) {
                scSaveStudyTimeForCurrentLesson(scCurrentLesson);
            }
        } else {
            // Page is visible again, reload study time and restart timer
            if (scCurrentLesson) {
                scLoadAndDisplayStudyTime().then(() => {
                    // Re-initialize timestamp for current session
                    if (!scCompletedLessons.has(scCurrentLesson)) {
                        scLastSaveTimestamp[scCurrentLesson] = Date.now();
                        scStartLiveTimer();
                    }
                });
            }
        }
    });
    
    // Handle page unload (beforeunload)
    window.addEventListener('beforeunload', function() {
        if (scCurrentLesson && !scCompletedLessons.has(scCurrentLesson)) {
            scSaveStudyTimeForCurrentLesson(scCurrentLesson);
        }
    });
    
    // Initialize calculators
    calculateSimpleInterest();
    calculateCompoundInteractive();
    
    // Initialize interest comparison tool
    if (document.getElementById('compareAmount')) {
        updateInterestComparison();
    }
    
    // Initialize deposit comparison tool
    if (document.getElementById('depositAmount')) {
        compareDepositOptions();
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('userDropdown');
        const menu = document.getElementById('userDropdownMenu');
        if (dropdown && menu && !dropdown.contains(event.target)) {
            menu.classList.remove('show');
        }
    });
});
