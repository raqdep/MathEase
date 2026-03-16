// Domain and Range of Inverse Functions - Interactive JavaScript

// ------------------------------
// Lesson Navigation & Completion
// ------------------------------
let drifCurrentLesson = 1;
let drifCompletedLessons = new Set();
const drifTotalLessons = 4;

// ------------------------------
// Quiz System - 5 questions per topic
// ------------------------------
const drifLesson1Quiz = [
    {
        question: "What is an inverse function?",
        options: [
            "A function that undoes the action of another function",
            "The reciprocal of a function",
            "The negative of a function",
            "The square of a function"
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
        question: "What is the domain-range relationship for inverse functions?",
        options: [
            "Domain of f⁻¹ = Range of f, Range of f⁻¹ = Domain of f",
            "Domain of f⁻¹ = Domain of f",
            "Range of f⁻¹ = Range of f",
            "There is no relationship"
        ],
        correct: 0
    },
    {
        question: "If f(x) = 2x + 3, what is f⁻¹(x)?",
        options: [
            "(x - 3)/2",
            "2x - 3",
            "(x + 3)/2",
            "x/2 - 3"
        ],
        correct: 0
    }
];

const drifLesson2Quiz = [
    {
        question: "What is the domain of f⁻¹ equal to?",
        options: [
            "The range of f",
            "The domain of f",
            "All real numbers",
            "The inverse of the domain of f"
        ],
        correct: 0
    },
    {
        question: "For f(x) = x² with domain x ≥ 0, what is the domain of f⁻¹(x) = √x?",
        options: [
            "x ≥ 0 (same as range of f)",
            "x < 0",
            "All real numbers",
            "x > 0"
        ],
        correct: 0
    },
    {
        question: "To find the domain of f⁻¹, what must you first determine?",
        options: [
            "The range of the original function f",
            "The domain of the original function f",
            "The graph of f",
            "The derivative of f"
        ],
        correct: 0
    },
    {
        question: "If f(x) = 1/x, what is the domain of f⁻¹?",
        options: [
            "x ≠ 0 (same as range of f)",
            "x > 0",
            "All real numbers",
            "x < 0"
        ],
        correct: 0
    },
    {
        question: "What is the fundamental relationship for finding the domain of inverse functions?",
        options: [
            "Domain of f⁻¹ = Range of f",
            "Domain of f⁻¹ = Domain of f",
            "Domain of f⁻¹ = 1/(Domain of f)",
            "Domain of f⁻¹ = Range of f⁻¹"
        ],
        correct: 0
    }
];

const drifLesson3Quiz = [
    {
        question: "What is the range of f⁻¹ equal to?",
        options: [
            "The domain of f",
            "The range of f",
            "All real numbers",
            "The inverse of the range of f"
        ],
        correct: 0
    },
    {
        question: "For f(x) = 2x + 3 with domain all real numbers, what is the range of f⁻¹?",
        options: [
            "All real numbers (same as domain of f)",
            "y ≥ 0",
            "y > 0",
            "y ≠ 0"
        ],
        correct: 0
    },
    {
        question: "To find the range of f⁻¹, what must you first identify?",
        options: [
            "The domain of the original function f",
            "The range of the original function f",
            "The graph of f",
            "The derivative of f"
        ],
        correct: 0
    },
    {
        question: "If f(x) = x² with domain x ≥ 0, what is the range of f⁻¹(x) = √x?",
        options: [
            "y ≥ 0 (same as domain of f)",
            "y > 0",
            "All real numbers",
            "y < 0"
        ],
        correct: 0
    },
    {
        question: "What is the fundamental relationship for finding the range of inverse functions?",
        options: [
            "Range of f⁻¹ = Domain of f",
            "Range of f⁻¹ = Range of f",
            "Range of f⁻¹ = 1/(Range of f)",
            "Range of f⁻¹ = Domain of f⁻¹"
        ],
        correct: 0
    }
];

const drifLesson4Quiz = [
    {
        question: "In temperature conversion F = (9/5)C + 32, what is the domain of the inverse function C(F)?",
        options: [
            "All real numbers (same as range of F)",
            "F > 0",
            "F ≥ 0",
            "F < 0"
        ],
        correct: 0
    },
    {
        question: "For kinetic energy KE = (1/2)mv², what is the domain of the inverse function v(KE)?",
        options: [
            "KE ≥ 0 (non-negative kinetic energy)",
            "KE > 0",
            "All real numbers",
            "KE < 0"
        ],
        correct: 0
    },
    {
        question: "Why is the domain-range relationship important in real-world applications?",
        options: [
            "It ensures the inverse function produces valid outputs for practical problems",
            "It makes calculations easier",
            "It simplifies the function",
            "It reduces computation time"
        ],
        correct: 0
    },
    {
        question: "In supply and demand, if P = f(Q), what is the domain of Q(P)?",
        options: [
            "P ≥ 0 (non-negative prices)",
            "P > 0",
            "All real numbers",
            "P < 0"
        ],
        correct: 0
    },
    {
        question: "What is a key application of inverse functions in real-world problems?",
        options: [
            "Converting between different units and solving optimization problems",
            "Making graphs look better",
            "Simplifying equations",
            "Reducing calculation errors"
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
            if (!drifCanAccessTopic(lessonNum) && lessonNum !== drifCurrentLesson) {
                drifShowTopicLockedMessage(lessonNum);
                return;
            }
            
            const isExpanded = topic.classList.contains('expanded');
            document.querySelectorAll('.lesson-topic').forEach(t => t.classList.remove('expanded'));
            if (!isExpanded) {
                topic.classList.add('expanded');
                this.setAttribute('aria-expanded', 'true');
                drifShowLesson(lessonNum);
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
            if (!drifCanAccessTopic(lessonNum)) {
                drifShowTopicLockedMessage(lessonNum);
                return;
            }
            
            // Show lesson and scroll to section
            drifShowLesson(lessonNum, false);
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
    drifUpdateSidebarProgress();
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

function drifUpdateSidebarProgress() {
    for (let i = 1; i <= drifTotalLessons; i++) {
        const topic = document.getElementById(`sidebar-topic-${i}`);
        if (!topic) continue;
        
        const dot = topic.querySelector('.lesson-topic-dot');
        const progressText = topic.querySelector('.topic-status-text');
        const accessible = drifCanAccessTopic(i);
        const complete = drifCompletedLessons.has(i);
        
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

function drifCanAccessTopic(lessonNum) {
    if (lessonNum === 1) return true;
    return drifCompletedLessons.has(lessonNum - 1);
}

function drifShowTopicLockedMessage(lessonNum) {
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
function drifShuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function drifShuffleQuiz(quizArray) {
    const shuffled = drifShuffleArray(quizArray);
    return shuffled.map(quiz => {
        const options = [...quiz.options];
        const correctIndex = quiz.correct;
        const correctAnswer = options[correctIndex];
        
        const shuffledOptions = drifShuffleArray(options);
        const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);
        
        return {
            ...quiz,
            options: shuffledOptions,
            correct: newCorrectIndex
        };
    });
}

function drifGenerateExplanation(quiz, selectedAnswer) {
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
    
    if (question.includes('inverse function') || question.includes('inverse')) {
        explanation += 'HOW TO SOLVE:\nAn inverse function undoes the action of the original function. If f maps x to y, then f⁻¹ maps y back to x. The key relationship is: Domain of f⁻¹ = Range of f, and Range of f⁻¹ = Domain of f.';
    } else if (question.includes('domain')) {
        explanation += 'HOW TO SOLVE:\nThe domain of f⁻¹ equals the range of the original function f. To find it, first determine what values the original function can output.';
    } else if (question.includes('range')) {
        explanation += 'HOW TO SOLVE:\nThe range of f⁻¹ equals the domain of the original function f. To find it, identify what values the original function accepts as inputs.';
    } else if (question.includes('one-to-one')) {
        explanation += 'HOW TO SOLVE:\nA function must be one-to-one (injective) to have an inverse. This means each output corresponds to exactly one input. Use the horizontal line test to verify.';
    } else {
        explanation += 'HOW TO SOLVE:\n1. Read the question carefully\n2. Identify what concept is being tested\n3. Apply the relevant rules or formulas\n4. Check your answer makes sense';
    }
    return explanation;
}

async function drifRunLessonQuiz(lessonNum) {
    const quizArray = [
        drifLesson1Quiz,
        drifLesson2Quiz,
        drifLesson3Quiz,
        drifLesson4Quiz
    ][lessonNum - 1];
    
    if (!quizArray) return false;
    
    // Track quiz start time
    window.drifQuizStartTime = Date.now();
    
    // Shuffle quiz questions and options
    const shuffledQuiz = drifShuffleQuiz(quizArray);
    
    let currentQuestion = 0;
    let score = 0;
    const userAnswers = [];
    
    // Show intro modal
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
    
    window.drifQuizStartTime = Date.now();
    
    return new Promise((resolve) => {
        window.drifQuizResolve = resolve;
        
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
                            explanation = drifGenerateExplanation(currentQuiz, selectedAnswer);
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
            
            // Calculate time taken
            const timeTaken = window.drifQuizStartTime ? Math.floor((Date.now() - window.drifQuizStartTime) / 1000) : 0;
            
            // Store quiz data
            drifStoreQuizData(lessonNum, score, shuffledQuiz.length, userAnswers, timeTaken);
            
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
            }).then(() => {
                if (passed) {
                    // Save final study time before completing
                    drifSaveStudyTimeForCurrentLesson();
                    
                    // Complete lesson and stop timer
                    drifCompleteLesson(lessonNum).then(() => {
                        drifCompletedLessons.add(lessonNum);
                        drifUpdateSidebarProgress();
                        
                        // Hide Topic 4 quiz button if this is Topic 4
                        if (lessonNum === 4) {
                            const topic4QuizButton = document.getElementById('topic4QuizButton');
                            if (topic4QuizButton) {
                                topic4QuizButton.style.display = 'none';
                            }
                        }
                        
                        // Check if all lessons are completed and show performance analysis section
                        if (drifCompletedLessons.size === drifTotalLessons) {
                            drifShowPerformanceAnalysisSection();
                        }
                    });
                }
                if (window.drifQuizResolve) {
                    window.drifQuizResolve(passed);
                    window.drifQuizResolve = null;
                }
            });
        }
        
        displayQuestion();
    });
}

async function drifStoreQuizData(lessonNum, score, total, userAnswers, timeTakenSeconds = 0) {
    try {
        const response = await fetch('../php/store-quiz-data.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic: 'domain-range-inverse-functions',
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
let drifLessonStartTime = {};
let drifTotalStudyTime = {}; // Track total time per lesson in seconds
let drifLastSavedTime = {}; // Track last confirmed saved time from server (to prevent double counting)
let drifLastSaveTimestamp = {}; // Track when we last saved (to calculate elapsed correctly)
let drifStudyTimeInterval = null;
let drifTimerUpdateInterval = null; // For live timer display

function drifStartLiveTimer() {
    // Clear existing timer
    if (drifTimerUpdateInterval) {
        clearInterval(drifTimerUpdateInterval);
    }
    
    // Don't start timer if lesson is already completed
    if (drifCompletedLessons.has(drifCurrentLesson)) {
        drifUpdateLiveTimer(); // Just show final time
        return;
    }
    
    // Update timer immediately
    drifUpdateLiveTimer();
    
    // Update timer every second
    drifTimerUpdateInterval = setInterval(function() {
        // Stop if lesson becomes completed
        if (drifCompletedLessons.has(drifCurrentLesson)) {
            clearInterval(drifTimerUpdateInterval);
            drifTimerUpdateInterval = null;
            drifUpdateLiveTimer(); // Show final time
            return;
        }
        drifUpdateLiveTimer();
    }, 1000);
}

function drifUpdateLiveTimer() {
    if (!drifCurrentLesson) return;
    
    const section = document.getElementById(`lesson${drifCurrentLesson}`);
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
    if (drifCompletedLessons.has(drifCurrentLesson)) {
        // Show final time for completed lesson
        let finalTime = drifTotalStudyTime[drifCurrentLesson] || drifLastSavedTime[drifCurrentLesson] || 0;
        
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
    const baseTime = drifLastSavedTime[drifCurrentLesson] || 0;
    
    let currentSessionElapsed = 0;
    const saveStartTime = drifLastSaveTimestamp[drifCurrentLesson] || drifLessonStartTime[drifCurrentLesson];
    if (saveStartTime) {
        const now = Date.now();
        const elapsedMs = now - saveStartTime;
        currentSessionElapsed = Math.floor(elapsedMs / 1000);
        
        if (currentSessionElapsed > 7200) {
            console.warn(`Session elapsed time too large (${currentSessionElapsed}s) for lesson ${drifCurrentLesson}, resetting start time`);
            drifLessonStartTime[drifCurrentLesson] = now;
            drifLastSaveTimestamp[drifCurrentLesson] = now;
            currentSessionElapsed = 0;
        }
        
        if (currentSessionElapsed < 0) {
            console.warn(`Negative elapsed time detected for lesson ${drifCurrentLesson}, resetting start time`);
            drifLessonStartTime[drifCurrentLesson] = now;
            drifLastSaveTimestamp[drifCurrentLesson] = now;
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

function drifSaveStudyTimeForCurrentLesson() {
    if (!drifCurrentLesson) return;
    
    // CRITICAL: Never save time for completed lessons
    if (drifCompletedLessons.has(drifCurrentLesson)) {
        console.log(`Lesson ${drifCurrentLesson} is completed, skipping timer save`);
        return;
    }
    
    const saveStartTime = drifLastSaveTimestamp[drifCurrentLesson] || drifLessonStartTime[drifCurrentLesson];
    if (!saveStartTime) return;
    
    const now = Date.now();
    const elapsed = Math.floor((now - saveStartTime) / 1000);
    
    if (elapsed > 0 && elapsed < 7200) {
        const baseTime = drifLastSavedTime[drifCurrentLesson] || 0;
        const newTotalTime = baseTime + elapsed;
        
        drifTotalStudyTime[drifCurrentLesson] = newTotalTime;
        drifLastSavedTime[drifCurrentLesson] = newTotalTime;
        drifLastSaveTimestamp[drifCurrentLesson] = now;
        drifLessonStartTime[drifCurrentLesson] = now;
        
        drifSendStudyTimeToServer();
    } else if (elapsed >= 7200) {
        drifLessonStartTime[drifCurrentLesson] = now;
        drifLastSaveTimestamp[drifCurrentLesson] = now;
    }
}

function drifSendStudyTimeToServer() {
    if (!drifCurrentLesson) return;
    
    const studyTimeData = {};
    if (!drifCompletedLessons.has(drifCurrentLesson) && drifTotalStudyTime[drifCurrentLesson] && drifTotalStudyTime[drifCurrentLesson] > 0) {
        studyTimeData[drifCurrentLesson] = drifTotalStudyTime[drifCurrentLesson];
    }
    
    if (Object.keys(studyTimeData).length === 0) return;
    
    fetch('../php/store-study-time.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            topic: 'domain-range-inverse-functions',
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
                drifLastSavedTime[lessonNum] = drifTotalStudyTime[lessonNum];
                drifLastSaveTimestamp[lessonNum] = Date.now();
            });
        }
    })
    .catch(error => {
        console.error('Error saving study time:', error);
    });
}

async function drifLoadAndDisplayStudyTime() {
    // Load study time for all lessons (not just current) to ensure consistency
    try {
        const response = await fetch(`../php/get-study-time.php?topic=domain-range-inverse-functions`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.study_time) {
                for (const lesson in data.study_time) {
                    const lessonNum = parseInt(lesson);
                    const seconds = parseInt(data.study_time[lesson]);
                    
                    if (!isNaN(seconds) && seconds >= 0) {
                        drifTotalStudyTime[lessonNum] = seconds;
                        drifLastSavedTime[lessonNum] = seconds;
                        const now = Date.now();
                        drifLastSaveTimestamp[lessonNum] = now;
                        
                        // For completed lessons, don't update lessonStartTime
                        if (!drifCompletedLessons.has(lessonNum)) {
                            if (!drifLessonStartTime[lessonNum]) {
                                drifLessonStartTime[lessonNum] = now;
                            }
                        }
                    }
                }
                
                // Update timer display for current lesson
                if (drifCurrentLesson) {
                    drifUpdateLiveTimer();
                    
                    // Ensure timer container is visible after loading
                    const section = document.getElementById(`lesson${drifCurrentLesson}`);
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
        }
    } catch (e) {
        console.error('Error loading study time:', e);
    }
}

// ------------------------------
// Lesson Navigation
// ------------------------------
async function drifShowLesson(lessonNum, scrollToTop = false) {
    // Stop current timer intervals before switching lessons
    clearInterval(drifTimerUpdateInterval);
    clearInterval(drifStudyTimeInterval);
    
    // Save study time for the lesson being left (if any and not completed)
    if (drifCurrentLesson && !drifCompletedLessons.has(drifCurrentLesson)) {
        drifSaveStudyTimeForCurrentLesson();
    }
    
    drifCurrentLesson = lessonNum;
    
    // Start tracking for new lesson - only if not completed
    if (!drifCompletedLessons.has(lessonNum)) {
        if (!drifLessonStartTime[lessonNum]) {
            drifLessonStartTime[lessonNum] = Date.now();
        }
        // Ensure lastSavedTime and lastSaveTimestamp are initialized
        if (drifLastSavedTime[lessonNum] === undefined) {
            drifLastSavedTime[lessonNum] = drifTotalStudyTime[lessonNum] || 0;
        }
        if (!drifLastSaveTimestamp[lessonNum]) {
            drifLastSaveTimestamp[lessonNum] = Date.now();
        }
    } else {
        // If lesson is completed, clear start time to prevent timer from running
        drifLessonStartTime[lessonNum] = null;
        drifLastSaveTimestamp[lessonNum] = null;
    }
    
    // Load and display study time for this lesson first
    await drifLoadAndDisplayStudyTime();
    
    // Start/restart live timer display (will show final time if completed, but won't update)
    drifStartLiveTimer();
    
    // Hide all lessons
    document.querySelectorAll('.lesson-section').forEach(section => {
        section.classList.remove('active');
    });
    
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
        
        // Show/hide Topic 4 quiz button
        const topic4QuizButton = document.getElementById('topic4QuizButton');
        if (topic4QuizButton) {
            if (lessonNum === 4 && !drifCompletedLessons.has(4)) {
                topic4QuizButton.style.display = 'block';
            } else {
                topic4QuizButton.style.display = 'none';
            }
        }
        
        // Update sidebar
        setSidebarActive(lessonNum, 'objective');
        drifUpdateSidebarProgress();
        
        // Update navigation buttons
        drifUpdateNavigationButtons();
        
        if (scrollToTop) {
            activeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

function drifNavigateLesson(direction) {
    const newLesson = drifCurrentLesson + direction;
    
    if (newLesson < 1 || newLesson > drifTotalLessons) return;
    
    // Check if we can navigate forward
    if (direction > 0 && !drifCanAccessTopic(newLesson)) {
        drifShowTopicLockedMessage(newLesson);
        return;
    }
    
    // Check if we need to take quiz before proceeding
    if (direction > 0 && !drifCompletedLessons.has(drifCurrentLesson)) {
        Swal.fire({
            icon: 'info',
            title: 'Complete Current Topic',
            html: `
                <div class="text-left">
                    <p class="mb-3">You need to <strong>pass the 5 questions</strong> for Topic ${drifCurrentLesson} before you can open Topic ${newLesson}.</p>
                    <p class="text-sm text-gray-600">Stay on Topic ${drifCurrentLesson}, finish the lesson, then take the quiz and get at least <strong>3/5 correct</strong> (60%) to unlock Topic ${newLesson}.</p>
                </div>
            `,
            confirmButtonText: 'Take Quiz Now',
            confirmButtonColor: '#667eea',
            showCancelButton: true,
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                drifRunLessonQuiz(drifCurrentLesson).then(passed => {
                    if (passed) {
                        drifShowLesson(newLesson, true);
                    }
                });
            }
        });
        return;
    }
    
    drifShowLesson(newLesson, true);
}

function drifUpdateNavigationButtons() {
    const prevBtn = document.getElementById('prevLessonBtn');
    const nextBtn = document.getElementById('nextLessonBtn');
    const progressBar = document.getElementById('drifLessonProgressBar');
    const lessonNum = document.getElementById('drifCurrentLessonNum');
    
    if (prevBtn) {
        prevBtn.disabled = drifCurrentLesson === 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = drifCurrentLesson === drifTotalLessons;
    }
    
    if (progressBar) {
        const progress = (drifCurrentLesson / drifTotalLessons) * 100;
        progressBar.style.width = `${progress}%`;
    }
    
    if (lessonNum) {
        lessonNum.textContent = drifCurrentLesson;
    }
}

// ------------------------------
// Lesson Completion
// ------------------------------
async function drifCompleteLesson(lessonNum) {
    try {
        console.log('Attempting to complete lesson:', lessonNum);
        
        // CRITICAL: Save final study time BEFORE marking as completed
        // This ensures the timer is saved and frozen at completion
        if (lessonNum === drifCurrentLesson) {
            const now = Date.now();
            // Use lastSaveTimestamp if available, otherwise use lessonStartTime
            const saveStartTime = drifLastSaveTimestamp[lessonNum] || drifLessonStartTime[lessonNum];
            
            if (saveStartTime) {
                const elapsed = Math.floor((now - saveStartTime) / 1000); // in seconds
                
                if (elapsed > 0 && elapsed < 7200) {
                    // Get last confirmed saved time (from server)
                    const baseTime = drifLastSavedTime[lessonNum] || 0;
                    // Calculate final total time: last saved + elapsed since last save
                    const finalTotalTime = baseTime + elapsed;
                    
                    // Update local tracking
                    drifTotalStudyTime[lessonNum] = finalTotalTime;
                    drifLastSavedTime[lessonNum] = finalTotalTime;
                    
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
                                topic: 'domain-range-inverse-functions',
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
            drifLessonStartTime[lessonNum] = null;
            drifLastSaveTimestamp[lessonNum] = null;
        }
        
        const response = await fetch('../php/complete-lesson.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic: 'domain-range-inverse-functions',
                lesson: lessonNum,
                action: 'complete'
            }),
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Add to completed lessons AFTER saving time
                drifCompletedLessons.add(lessonNum);
                drifUpdateSidebarProgress();
                
                // Stop timer for completed lesson
                if (lessonNum === drifCurrentLesson) {
                    // Stop the timer interval
                    if (drifTimerUpdateInterval) {
                        clearInterval(drifTimerUpdateInterval);
                        drifTimerUpdateInterval = null;
                    }
                    
                    // Update timer display with final time
                    drifUpdateLiveTimer();
                    
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
                    
                    // Retry mechanism for 00:00 timer issue
                    if (drifTotalStudyTime[lessonNum] === 0 || drifTotalStudyTime[lessonNum] === undefined) {
                        console.warn(`Study time for lesson ${lessonNum} is 0 after completion. Retrying load...`);
                        setTimeout(async () => {
                            await drifLoadAndDisplayStudyTime();
                            drifUpdateLiveTimer(); // Update again after retry
                        }, 500); // Small delay to allow server to process
                    }
                }
                
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error completing lesson:', error);
        return false;
    }
}

async function drifLoadCompletedLessons() {
    try {
        const response = await fetch('../php/complete-lesson.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic: 'domain-range-inverse-functions',
                action: 'get_completed'
            }),
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && Array.isArray(data.completed_lessons)) {
                drifCompletedLessons = new Set(data.completed_lessons.map(Number));
                drifUpdateSidebarProgress();
                
                // Load study time for all completed lessons
                await drifLoadAndDisplayStudyTime();
                
                // Hide Topic 4 quiz button if Topic 4 is completed
                const topic4QuizButton = document.getElementById('topic4QuizButton');
                if (topic4QuizButton && drifCompletedLessons.has(4)) {
                    topic4QuizButton.style.display = 'none';
                }
                
                // Show performance analysis if all quizzes are completed
                if (drifCompletedLessons.size === drifTotalLessons) {
                    drifShowPerformanceAnalysisSection();
                }
            }
        }
    } catch (error) {
        console.error('Error loading completed lessons:', error);
    }
}

// ------------------------------
// Performance Analysis (Custom AI - matching functions.html)
// ------------------------------
function drifShowPerformanceAnalysisSection() {
    // Check if all 4 topics are completed
    if (drifCompletedLessons.size !== drifTotalLessons) {
        console.log('Performance analysis will only show after completing all quizzes. Current completed:', drifCompletedLessons.size, '/', drifTotalLessons);
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

async function drifAnalyzePerformance() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultSection = document.getElementById('analysisResult');
    
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
    }
    
    try {
        const response = await fetch(`../php/analyze-quiz-performance.php?topic=domain-range-inverse-functions`, {
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
            drifDisplayPerformanceAnalysis(result.analysis);
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

function drifDisplayPerformanceAnalysis(analysis) {
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

function drifShowTopic4Quiz() {
    if (drifCompletedLessons.has(4)) {
        Swal.fire({
            icon: 'info',
            title: 'Already Completed',
            text: 'You have already completed Topic 4 quiz.',
            confirmButtonColor: '#667eea'
        });
        return;
    }
    
    drifRunLessonQuiz(4);
}

// Export functions to window for HTML onclick handlers
window.drifShowTopic4Quiz = drifShowTopic4Quiz;
window.drifAnalyzePerformance = drifAnalyzePerformance;
window.drifShowPerformanceAnalysisSection = drifShowPerformanceAnalysisSection;
window.drifDisplayPerformanceAnalysis = drifDisplayPerformanceAnalysis;
window.getTopicNameForAnalysis = () => 'domain-range-inverse-functions';

// ------------------------------
// User Dropdown & Mobile Menu
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
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, Logout',
        cancelButtonText: 'Cancel'
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
                const user = data.user;
                const profilePicture = user.profile_picture;
                const imgElements = document.querySelectorAll('#userProfileImage, #userProfileImageDropdown, #userProfileImageMobile');
                const iconElements = document.querySelectorAll('#userProfileIcon, #userProfileIconDropdown, #userProfileIconMobile');
                if (profilePicture) {
                    imgElements.forEach(img => {
                        if (img) {
                            img.src = '../' + profilePicture + '?t=' + Date.now();
                            img.classList.remove('hidden');
                        }
                    });
                    iconElements.forEach(icon => { if (icon) icon.style.display = 'none'; });
                } else {
                    imgElements.forEach(img => { if (img) { img.src = ''; img.classList.add('hidden'); } });
                    iconElements.forEach(icon => { if (icon) icon.style.display = 'block'; });
                }
            }
        })
        .catch(err => console.error('Error loading profile picture:', err));
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('userDropdown');
    const menu = document.getElementById('userDropdownMenu');
    
    if (dropdown && menu && !dropdown.contains(event.target)) {
        menu.classList.add('hidden');
    }
});

// ------------------------------
// Initialize Visual Aids (existing functions)
// ------------------------------
function initializeCalculators() {
    initializeInverseFunctionAnalyzer();
    initializeDomainFinder();
    initializeRangeFinder();
    initializeApplicationProblemSolver();
}

function initializeInverseFunctionAnalyzer() {
    const inverseFunctionInput = document.getElementById('inverseFunctionInput');
    const domainRestrictionInput = document.getElementById('domainRestrictionInput');
    
    if (inverseFunctionInput) {
        let timeout;
        inverseFunctionInput.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                analyzeInverseFunction();
            }, 500);
        });
        
        // Add Enter key support
        inverseFunctionInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                analyzeInverseFunction();
            }
        });
    }
    
    if (domainRestrictionInput) {
        let timeout;
        domainRestrictionInput.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                analyzeInverseFunction();
            }, 500);
        });
    }
}

function analyzeInverseFunction() {
    const functionInput = document.getElementById('inverseFunctionInput').value.trim();
    const domainRestriction = document.getElementById('domainRestrictionInput').value.trim();
    
    if (!functionInput) {
        resetInverseFunctionResults();
        return;
    }
    
    try {
        // Add loading animation
        const originalDisplay = document.getElementById('originalFunctionDisplay');
        const inverseDisplay = document.getElementById('inverseFunctionDisplay');
        const analysisDisplay = document.getElementById('domainRangeAnalysis');
        
        if (originalDisplay) {
            originalDisplay.classList.add('opacity-50');
        }
        
        setTimeout(() => {
            if (originalDisplay) {
                originalDisplay.classList.remove('opacity-50');
                originalDisplay.classList.add('success-pop');
                originalDisplay.innerHTML = `
                    <h4 class="font-semibold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-function text-blue-500 mr-2"></i>Original Function:
                    </h4>
                    <div class="text-lg font-mono text-primary bg-blue-50 p-3 rounded">f(x) = ${functionInput}${domainRestriction ? `, ${domainRestriction}` : ''}</div>
                `;
            }
            
            const inverseFunction = findInverseFunction(functionInput);
            if (inverseDisplay) {
                inverseDisplay.classList.remove('opacity-50');
                inverseDisplay.classList.add('success-pop');
                inverseDisplay.innerHTML = `
                    <h4 class="font-semibold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-exchange-alt text-purple-500 mr-2"></i>Inverse Function:
                    </h4>
                    <div class="text-lg font-mono text-purple-600 bg-purple-50 p-3 rounded">f⁻¹(x) = ${inverseFunction.expression}</div>
                `;
            }
            
            const domainRangeAnalysis = analyzeDomainRangeRelationship(functionInput, domainRestriction);
            if (analysisDisplay) {
                analysisDisplay.classList.remove('opacity-50');
                analysisDisplay.classList.add('success-pop');
                analysisDisplay.innerHTML = `
                    <h4 class="font-semibold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-chart-line text-green-500 mr-2"></i>Domain-Range Analysis:
                    </h4>
                    <div class="text-gray-700 bg-green-50 p-3 rounded">${domainRangeAnalysis}</div>
                `;
            }
            
            // Remove animation class after animation completes
            setTimeout(() => {
                [originalDisplay, inverseDisplay, analysisDisplay].forEach(el => {
                    if (el) el.classList.remove('success-pop');
                });
            }, 500);
        }, 300);
        
    } catch (error) {
        console.error('Error analyzing inverse function:', error);
        showError('Invalid function format. Please check your input.');
    }
}

function findInverseFunction(functionInput) {
    // Normalize input (remove spaces, handle variations)
    const normalized = functionInput.replace(/\s/g, '').toLowerCase();
    
    // Handle linear functions: ax + b
    if (normalized.includes('2x+3') || normalized === '2x+3') {
        return {
            expression: '(x-3)/2',
            domain: 'All real numbers',
            range: 'All real numbers'
        };
    } else if (normalized.includes('3x-1') || normalized === '3x-1' || normalized.includes('3x+(-1)')) {
        return {
            expression: '(x+1)/3',
            domain: 'All real numbers',
            range: 'All real numbers'
        };
    } else if (normalized.includes('x+5') || normalized === 'x+5') {
        return {
            expression: 'x-5',
            domain: 'All real numbers',
            range: 'All real numbers'
        };
    } else if (normalized.includes('x-') && !normalized.includes('x²') && !normalized.includes('x^2')) {
        // Generic linear: x - c
        const match = normalized.match(/x-(\d+)/);
        if (match) {
            const c = match[1];
            return {
                expression: `x+${c}`,
                domain: 'All real numbers',
                range: 'All real numbers'
            };
        }
    } else if (normalized.includes('x+') && !normalized.includes('x²') && !normalized.includes('x^2')) {
        // Generic linear: x + c
        const match = normalized.match(/x\+(\d+)/);
        if (match) {
            const c = match[1];
            return {
                expression: `x-${c}`,
                domain: 'All real numbers',
                range: 'All real numbers'
            };
        }
    }
    // Handle quadratic: x²
    else if (normalized.includes('x²') || normalized.includes('x^2') || normalized === 'x2') {
        return {
            expression: '√x',
            domain: 'x ≥ 0',
            range: 'y ≥ 0'
        };
    }
    // Handle rational: 1/x
    else if (normalized.includes('1/x') || normalized === '1/x' || normalized === '1÷x') {
        return {
            expression: '1/x',
            domain: 'x ≠ 0',
            range: 'y ≠ 0'
        };
    } else {
        return {
            expression: 'Enter a supported function (2x+3, x², 3x-1, 1/x, x+5)',
            domain: 'To be determined',
            range: 'To be determined'
        };
    }
}

function analyzeDomainRangeRelationship(functionInput, domainRestriction) {
    let analysis = '<div class="space-y-2">';
    
    if (functionInput.includes('2x+3')) {
        analysis += '<p><strong>Original Function f(x) = 2x + 3:</strong></p>';
        analysis += '<p>• Domain of f: All real numbers</p>';
        analysis += '<p>• Range of f: All real numbers</p>';
        analysis += '<p><strong>Inverse Function f⁻¹(x) = (x-3)/2:</strong></p>';
        analysis += '<p>• Domain of f⁻¹: All real numbers (same as range of f)</p>';
        analysis += '<p>• Range of f⁻¹: All real numbers (same as domain of f)</p>';
    } else if (functionInput.includes('x²') || functionInput.includes('x^2')) {
        analysis += '<p><strong>Original Function f(x) = x²:</strong></p>';
        analysis += '<p>• Domain of f: ' + (domainRestriction || 'All real numbers') + '</p>';
        analysis += '<p>• Range of f: y ≥ 0</p>';
        analysis += '<p><strong>Inverse Function f⁻¹(x) = √x:</strong></p>';
        analysis += '<p>• Domain of f⁻¹: x ≥ 0 (same as range of f)</p>';
        analysis += '<p>• Range of f⁻¹: y ≥ 0 (same as domain of f)</p>';
    } else if (functionInput.includes('1/x')) {
        analysis += '<p><strong>Original Function f(x) = 1/x:</strong></p>';
        analysis += '<p>• Domain of f: x ≠ 0</p>';
        analysis += '<p>• Range of f: y ≠ 0</p>';
        analysis += '<p><strong>Inverse Function f⁻¹(x) = 1/x:</strong></p>';
        analysis += '<p>• Domain of f⁻¹: x ≠ 0 (same as range of f)</p>';
        analysis += '<p>• Range of f⁻¹: y ≠ 0 (same as domain of f)</p>';
    } else {
        analysis += '<p><strong>General Relationship:</strong></p>';
        analysis += '<p>• Domain of f⁻¹ = Range of f</p>';
        analysis += '<p>• Range of f⁻¹ = Domain of f</p>';
        analysis += '<p>This is the fundamental relationship for inverse functions.</p>';
    }
    
    analysis += '</div>';
    return analysis;
}

function resetInverseFunctionResults() {
    document.getElementById('originalFunctionDisplay').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Original Function:</h4>
        <div class="text-lg font-mono text-primary">f(x) = </div>
    `;
    document.getElementById('inverseFunctionDisplay').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Inverse Function:</h4>
        <div class="text-gray-700">Enter a function to analyze</div>
    `;
    document.getElementById('domainRangeAnalysis').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Domain-Range Analysis:</h4>
        <div class="text-gray-700">Enter a function to analyze</div>
    `;
}

function initializeDomainFinder() {
    const domainOriginalFunction = document.getElementById('domainOriginalFunction');
    const originalDomain = document.getElementById('originalDomain');
    
    if (domainOriginalFunction) {
        let timeout;
        domainOriginalFunction.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                findInverseDomain();
            }, 500);
        });
        
        // Add Enter key support
        domainOriginalFunction.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                findInverseDomain();
            }
        });
    }
    
    if (originalDomain) {
        let timeout;
        originalDomain.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                findInverseDomain();
            }, 500);
        });
    }
}

function findInverseDomain() {
    const functionInput = document.getElementById('domainOriginalFunction').value.trim();
    const originalDomain = document.getElementById('originalDomain').value.trim();
    
    if (!functionInput) {
        resetDomainFinderResults();
        return;
    }
    
    try {
        document.getElementById('originalFunctionInfo').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Original Function:</h4>
            <div class="text-lg font-mono text-primary">f(x) = ${functionInput}</div>
            <div class="text-sm text-gray-600 mt-1">Domain: ${originalDomain || 'All real numbers'}</div>
        `;
        
        const rangeOfOriginal = findRangeOfOriginalFunction(functionInput, originalDomain);
        document.getElementById('rangeOfOriginal').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Range of Original Function:</h4>
            <div class="text-gray-700 font-mono">${rangeOfOriginal}</div>
        `;
        
        document.getElementById('domainOfInverse').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Domain of Inverse Function:</h4>
            <div class="text-gray-700 font-mono">${rangeOfOriginal}</div>
            <div class="text-sm text-gray-600 mt-1">(Same as range of original function)</div>
        `;
        
    } catch (error) {
        console.error('Error finding inverse domain:', error);
        showError('Invalid function format. Please check your input.');
    }
}

function findRangeOfOriginalFunction(functionInput, originalDomain) {
    if (functionInput.includes('2x+3')) {
        return 'All real numbers';
    } else if (functionInput.includes('x²') || functionInput.includes('x^2')) {
        if (originalDomain.includes('≥0') || originalDomain.includes('x≥0')) {
            return 'y ≥ 0';
        } else {
            return 'y ≥ 0';
        }
    } else if (functionInput.includes('1/x')) {
        return 'y ≠ 0';
    } else if (functionInput.includes('3x-1')) {
        return 'All real numbers';
    } else if (functionInput.includes('x+5')) {
        return 'All real numbers';
    } else {
        return 'Depends on specific function behavior';
    }
}

function resetDomainFinderResults() {
    document.getElementById('originalFunctionInfo').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Original Function:</h4>
        <div class="text-gray-700">Enter a function to analyze</div>
    `;
    document.getElementById('rangeOfOriginal').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Range of Original Function:</h4>
        <div class="text-gray-700">Enter a function to analyze</div>
    `;
    document.getElementById('domainOfInverse').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Domain of Inverse Function:</h4>
        <div class="text-gray-700">Enter a function to analyze</div>
    `;
}

function initializeRangeFinder() {
    const rangeOriginalFunction = document.getElementById('rangeOriginalFunction');
    const rangeOriginalDomain = document.getElementById('rangeOriginalDomain');
    
    if (rangeOriginalFunction) {
        let timeout;
        rangeOriginalFunction.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                findInverseRange();
            }, 500);
        });
        
        // Add Enter key support
        rangeOriginalFunction.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                findInverseRange();
            }
        });
    }
    
    if (rangeOriginalDomain) {
        let timeout;
        rangeOriginalDomain.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                findInverseRange();
            }, 500);
        });
    }
}

function findInverseRange() {
    const functionInput = document.getElementById('rangeOriginalFunction').value.trim();
    const originalDomain = document.getElementById('rangeOriginalDomain').value.trim();
    
    if (!functionInput) {
        resetRangeFinderResults();
        return;
    }
    
    try {
        document.getElementById('rangeOriginalFunctionInfo').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Original Function:</h4>
            <div class="text-lg font-mono text-primary">f(x) = ${functionInput}</div>
            <div class="text-sm text-gray-600 mt-1">Domain: ${originalDomain || 'All real numbers'}</div>
        `;
        
        document.getElementById('domainOfOriginal').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Domain of Original Function:</h4>
            <div class="text-gray-700 font-mono">${originalDomain || 'All real numbers'}</div>
        `;
        
        document.getElementById('rangeOfInverse').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Range of Inverse Function:</h4>
            <div class="text-gray-700 font-mono">${originalDomain || 'All real numbers'}</div>
            <div class="text-sm text-gray-600 mt-1">(Same as domain of original function)</div>
        `;
        
    } catch (error) {
        console.error('Error finding inverse range:', error);
        showError('Invalid function format. Please check your input.');
    }
}

function resetRangeFinderResults() {
    document.getElementById('rangeOriginalFunctionInfo').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Original Function:</h4>
        <div class="text-gray-700">Enter a function to analyze</div>
    `;
    document.getElementById('domainOfOriginal').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Domain of Original Function:</h4>
        <div class="text-gray-700">Enter a function to analyze</div>
    `;
    document.getElementById('rangeOfInverse').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Range of Inverse Function:</h4>
        <div class="text-gray-700">Enter a function to analyze</div>
    `;
}

function initializeApplicationProblemSolver() {
    const inverseApplicationTypeSelect = document.getElementById('inverseApplicationType');
    
    if (inverseApplicationTypeSelect) {
        inverseApplicationTypeSelect.addEventListener('change', function() {
            updateInverseApplicationInputs(this.value);
        });
    }
    
    // Add Enter key support for all input fields in application solver
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const activeInput = document.activeElement;
            if (activeInput && activeInput.closest('#inverseApplicationInputs')) {
                e.preventDefault();
                solveInverseApplicationProblem();
            }
        }
    });
}

function updateInverseApplicationInputs(applicationType) {
    const applicationInputs = document.getElementById('inverseApplicationInputs');
    const applicationDescription = document.getElementById('inverseApplicationDescription');
    
    if (!applicationInputs || !applicationDescription) return;
    
    switch (applicationType) {
        case 'temperature':
            applicationInputs.innerHTML = `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Temperature Value:</label>
                    <input type="number" id="tempValue" placeholder="e.g., 25" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Conversion Type:</label>
                    <select id="tempConversion" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                        <option value="c-to-f">Celsius to Fahrenheit</option>
                        <option value="f-to-c">Fahrenheit to Celsius</option>
                    </select>
                </div>
            `;
            applicationDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Problem Description:</h4>
                <div class="text-gray-700">Temperature conversion between Celsius and Fahrenheit using inverse functions: F = (9/5)C + 32 and C = (5/9)(F - 32)</div>
            `;
            break;
            
        case 'kinetic':
            applicationInputs.innerHTML = `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Kinetic Energy (J):</label>
                    <input type="number" id="kineticEnergy" placeholder="e.g., 100" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Mass (kg):</label>
                    <input type="number" id="mass" placeholder="e.g., 2" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
            `;
            applicationDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Problem Description:</h4>
                <div class="text-gray-700">Kinetic energy and velocity relationship: KE = (1/2)mv² and v = √(2KE/m)</div>
            `;
            break;
            
        case 'supply':
            applicationInputs.innerHTML = `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Price per Unit:</label>
                    <input type="number" id="price" placeholder="e.g., 10" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Supply Function Slope:</label>
                    <input type="number" id="supplySlope" placeholder="e.g., 2" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
            `;
            applicationDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Problem Description:</h4>
                <div class="text-gray-700">Supply and demand relationship: P = f(Q) and Q = f⁻¹(P) where P is price and Q is quantity</div>
            `;
            break;
            
        case 'interest':
            applicationInputs.innerHTML = `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Principal Amount:</label>
                    <input type="number" id="principal" placeholder="e.g., 1000" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Final Amount:</label>
                    <input type="number" id="finalAmount" placeholder="e.g., 1500" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Time Period (years):</label>
                    <input type="number" id="timePeriod" placeholder="e.g., 5" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
            `;
            applicationDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Problem Description:</h4>
                <div class="text-gray-700">Interest rate calculation: A = P(1 + r)ᵗ and r = (A/P)^(1/t) - 1</div>
            `;
            break;
            
        case 'signal':
            applicationInputs.innerHTML = `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Frequency (Hz):</label>
                    <input type="number" id="frequency" placeholder="e.g., 1000000" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Speed of Light (m/s):</label>
                    <input type="number" id="speedOfLight" placeholder="e.g., 300000000" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
            `;
            applicationDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Problem Description:</h4>
                <div class="text-gray-700">Frequency and wavelength relationship: f = c/λ and λ = c/f</div>
            `;
            break;
            
        case 'vehicle':
            applicationInputs.innerHTML = `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Fuel Consumption (L/100km):</label>
                    <input type="number" id="fuelConsumption" placeholder="e.g., 8" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Coefficient A:</label>
                    <input type="number" id="coeffA" placeholder="e.g., 50" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Coefficient B:</label>
                    <input type="number" id="coeffB" placeholder="e.g., 10" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
            `;
            applicationDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Problem Description:</h4>
                <div class="text-gray-700">Vehicle performance: C = av/(v² + bv + c) and optimal speed v = f⁻¹(min C)</div>
            `;
            break;
            
        default:
            applicationInputs.innerHTML = '<div class="text-gray-600">Select an application type to see inputs</div>';
            applicationDescription.innerHTML = '<div class="text-gray-600">Select an application type to see the description</div>';
    }
}

function solveInverseApplicationProblem() {
    const applicationType = document.getElementById('inverseApplicationType').value;
    
    if (!applicationType) {
        showError('Please select an application type first.');
        return;
    }
    
    try {
        let solution;
        
        switch (applicationType) {
            case 'temperature':
                solution = solveTemperatureProblem();
                break;
            case 'kinetic':
                solution = solveKineticProblem();
                break;
            case 'supply':
                solution = solveSupplyProblem();
                break;
            case 'interest':
                solution = solveInterestProblem();
                break;
            case 'signal':
                solution = solveSignalProblem();
                break;
            case 'vehicle':
                solution = solveVehicleProblem();
                break;
            default:
                showError('Unknown application type.');
                return;
        }
        
        displayInverseApplicationSolution(solution);
        
    } catch (error) {
        console.error('Error solving inverse application problem:', error);
        showError('Error solving problem. Please check your inputs.');
    }
}

function solveTemperatureProblem() {
    const tempValue = parseFloat(document.getElementById('tempValue').value);
    const conversionType = document.getElementById('tempConversion').value;
    
    if (isNaN(tempValue)) {
        throw new Error('Please enter a valid temperature value.');
    }
    
    let convertedTemp, originalFunction, inverseFunction, verification;
    
    if (conversionType === 'c-to-f') {
        // F = (9/5)C + 32
        convertedTemp = (9/5) * tempValue + 32;
        originalFunction = 'F = (9/5)C + 32';
        inverseFunction = 'C = (5/9)(F - 32)';
        // Verify: Convert back to Celsius
        verification = (5/9) * (convertedTemp - 32);
    } else {
        // C = (5/9)(F - 32)
        convertedTemp = (5/9) * (tempValue - 32);
        originalFunction = 'C = (5/9)(F - 32)';
        inverseFunction = 'F = (9/5)C + 32';
        // Verify: Convert back to Fahrenheit
        verification = (9/5) * convertedTemp + 32;
    }
    
    return {
        domainAnalysis: `
            <strong>Domain Analysis:</strong><br>
            <em>Original Function:</em> ${originalFunction}<br>
            <em>Domain:</em> All real numbers (any temperature)<br>
            <em>Inverse Function:</em> ${inverseFunction}<br>
            <em>Domain of Inverse:</em> All real numbers (same as range of original)
        `,
        rangeAnalysis: `
            <strong>Range Analysis:</strong><br>
            <em>Original Function Range:</em> All real numbers<br>
            <em>Inverse Function Range:</em> All real numbers (same as domain of original)<br>
            <em>Result:</em> ${tempValue}°${conversionType === 'c-to-f' ? 'C' : 'F'} = ${convertedTemp.toFixed(2)}°${conversionType === 'c-to-f' ? 'F' : 'C'}<br>
            <em>Verification:</em> Converting back gives ${verification.toFixed(2)}°${conversionType === 'c-to-f' ? 'C' : 'F'} ≈ ${tempValue}°${conversionType === 'c-to-f' ? 'C' : 'F'} ✓
        `,
        practicalImplications: `
            <strong>Practical Implications:</strong><br>
            • Temperature conversion functions are perfect inverses of each other<br>
            • Both functions have domain and range of all real numbers<br>
            • The relationship is linear and one-to-one (always works both ways!)<br>
            • This model is valid for all temperature ranges (even negative temperatures)<br>
            • Used daily in weather forecasts, cooking, science, and international communication
        `
    };
}

function solveKineticProblem() {
    const kineticEnergy = parseFloat(document.getElementById('kineticEnergy').value);
    const mass = parseFloat(document.getElementById('mass').value);
    
    if (!kineticEnergy || !mass) {
        throw new Error('Please enter both kinetic energy and mass values.');
    }
    
    if (kineticEnergy < 0) {
        throw new Error('Kinetic energy cannot be negative.');
    }
    
    if (mass <= 0) {
        throw new Error('Mass must be greater than zero.');
    }
    
    // Correct formula: KE = (1/2)mv², so v = √(2KE/m)
    const velocity = Math.sqrt(2 * kineticEnergy / mass);
    
    // Verify: (1/2)mv² should equal KE
    const verification = 0.5 * mass * velocity * velocity;
    
    return {
        domainAnalysis: `
            <strong>Domain Analysis:</strong><br>
            <em>Original Function:</em> KE = (1/2)mv²<br>
            <em>Domain:</em> v ≥ 0 (non-negative velocities in m/s)<br>
            <em>Inverse Function:</em> v = √(2KE/m)<br>
            <em>Domain of Inverse:</em> KE ≥ 0, m > 0 (non-negative kinetic energy, positive mass)
        `,
        rangeAnalysis: `
            <strong>Range Analysis:</strong><br>
            <em>Original Function Range:</em> KE ≥ 0<br>
            <em>Inverse Function Range:</em> v ≥ 0<br>
            <em>Result:</em> For KE = ${kineticEnergy} J and m = ${mass} kg<br>
            <em>Velocity:</em> v = √(2 × ${kineticEnergy} / ${mass}) = ${velocity.toFixed(4)} m/s<br>
            <em>Verification:</em> KE = (1/2) × ${mass} × (${velocity.toFixed(4)})² = ${verification.toFixed(2)} J ≈ ${kineticEnergy} J ✓
        `,
        practicalImplications: `
            <strong>Practical Implications:</strong><br>
            • Velocity and kinetic energy have a quadratic relationship (doubling velocity quadruples energy!)<br>
            • Both domain and range are restricted to non-negative values (physical constraints)<br>
            • The inverse function gives velocity from kinetic energy (useful in crash analysis)<br>
            • This model applies to classical mechanics and vehicle safety engineering<br>
            • Essential for understanding impact forces and designing safety systems
        `
    };
}

function solveSupplyProblem() {
    const price = parseFloat(document.getElementById('price').value);
    const supplySlope = parseFloat(document.getElementById('supplySlope').value);
    
    if (!price || !supplySlope) {
        throw new Error('Please enter both price and supply slope values.');
    }
    
    if (supplySlope === 0) {
        throw new Error('Supply slope cannot be zero.');
    }
    
    // Correct calculation: If P = mQ + b, then Q = (P - b)/m
    // For simplicity, assuming P = mQ (b = 0), so Q = P/m
    const quantity = price / supplySlope;
    
    // Calculate minimum price (when Q = 0)
    const minPrice = 0;
    
    return {
        domainAnalysis: `
            <strong>Domain Analysis:</strong><br>
            <em>Supply Function:</em> P = ${supplySlope}Q<br>
            <em>Domain:</em> Q ≥ 0 (non-negative quantities)<br>
            <em>Inverse Function:</em> Q = P/${supplySlope}<br>
            <em>Domain of Inverse:</em> P ≥ ${minPrice} (non-negative prices, starting from $${minPrice})
        `,
        rangeAnalysis: `
            <strong>Range Analysis:</strong><br>
            <em>Supply Function Range:</em> P ≥ ${minPrice}<br>
            <em>Inverse Function Range:</em> Q ≥ 0<br>
            <em>Result:</em> At price P = $${price}, quantity supplied Q = ${quantity.toFixed(2)} units
        `,
        practicalImplications: `
            <strong>Practical Implications:</strong><br>
            • Price and quantity have a linear relationship<br>
            • Both domain and range are restricted to non-negative values<br>
            • The inverse function gives quantity from price<br>
            • This model represents basic supply economics<br>
            • Higher prices lead to higher quantities supplied (positive slope)
        `
    };
}

function solveInterestProblem() {
    const principal = parseFloat(document.getElementById('principal').value);
    const finalAmount = parseFloat(document.getElementById('finalAmount').value);
    const timePeriod = parseFloat(document.getElementById('timePeriod').value);
    
    if (!principal || !finalAmount || !timePeriod) {
        throw new Error('Please enter all values: principal, final amount, and time period.');
    }
    
    if (principal <= 0) {
        throw new Error('Principal must be greater than zero.');
    }
    
    if (finalAmount <= 0) {
        throw new Error('Final amount must be greater than zero.');
    }
    
    if (timePeriod <= 0) {
        throw new Error('Time period must be greater than zero.');
    }
    
    if (finalAmount < principal) {
        throw new Error('Final amount should be greater than or equal to principal for positive interest rates.');
    }
    
    // Correct formula: A = P(1 + r)^t, so r = (A/P)^(1/t) - 1
    const interestRate = Math.pow(finalAmount / principal, 1 / timePeriod) - 1;
    
    // Verify: P(1 + r)^t should equal A
    const verification = principal * Math.pow(1 + interestRate, timePeriod);
    
    return {
        domainAnalysis: `
            <strong>Domain Analysis:</strong><br>
            <em>Compound Interest:</em> A = P(1 + r)ᵗ<br>
            <em>Domain:</em> r ≥ -1, t > 0, P > 0<br>
            <em>Inverse Function:</em> r = (A/P)^(1/t) - 1<br>
            <em>Domain of Inverse:</em> A > 0, P > 0, t > 0, A ≥ P
        `,
        rangeAnalysis: `
            <strong>Range Analysis:</strong><br>
            <em>Compound Interest Range:</em> A > 0 (when P > 0, r > -1, t > 0)<br>
            <em>Inverse Function Range:</em> r ≥ -1<br>
            <em>Result:</em> Interest rate r = ${(interestRate * 100).toFixed(4)}%<br>
            <em>Verification:</em> P(1 + r)ᵗ = $${principal.toFixed(2)} × (1 + ${interestRate.toFixed(6)})^${timePeriod} = $${verification.toFixed(2)} ≈ $${finalAmount.toFixed(2)} ✓
        `,
        practicalImplications: `
            <strong>Practical Implications:</strong><br>
            • Interest rate must be greater than -100% to avoid negative amounts<br>
            • Time period must be positive<br>
            • The inverse function gives interest rate from final amount<br>
            • This model applies to compound interest calculations<br>
            • Useful for comparing investment options and loan terms
        `
    };
}

function solveSignalProblem() {
    const frequency = parseFloat(document.getElementById('frequency').value);
    const speedOfLight = parseFloat(document.getElementById('speedOfLight').value);
    
    if (!frequency || !speedOfLight) {
        throw new Error('Please enter both frequency and speed of light values.');
    }
    
    if (frequency <= 0) {
        throw new Error('Frequency must be greater than zero.');
    }
    
    if (speedOfLight <= 0) {
        throw new Error('Speed of light must be greater than zero.');
    }
    
    // Correct formula: λ = c/f (wavelength = speed of light / frequency)
    const wavelength = speedOfLight / frequency;
    
    // Verify: f = c/λ should equal original frequency
    const verification = speedOfLight / wavelength;
    
    return {
        domainAnalysis: `
            <strong>Domain Analysis:</strong><br>
            <em>Frequency-Wavelength Relationship:</em> f = c/λ<br>
            <em>Domain:</em> λ > 0 (positive wavelengths in meters)<br>
            <em>Inverse Function:</em> λ = c/f<br>
            <em>Domain of Inverse:</em> f > 0 (positive frequencies in Hz)
        `,
        rangeAnalysis: `
            <strong>Range Analysis:</strong><br>
            <em>Frequency Function Range:</em> f > 0<br>
            <em>Inverse Function Range:</em> λ > 0<br>
            <em>Result:</em> For f = ${frequency.toLocaleString()} Hz and c = ${speedOfLight.toLocaleString()} m/s<br>
            <em>Wavelength:</em> λ = ${wavelength.toFixed(6)} m = ${(wavelength * 1000).toFixed(3)} mm<br>
            <em>Verification:</em> f = c/λ = ${speedOfLight.toLocaleString()} / ${wavelength.toFixed(6)} = ${verification.toLocaleString()} Hz ✓
        `,
        practicalImplications: `
            <strong>Practical Implications:</strong><br>
            • Frequency and wavelength are inversely proportional (as one increases, the other decreases)<br>
            • Both domain and range are restricted to positive values (physical constraints)<br>
            • The inverse function gives wavelength from frequency (essential for antenna design)<br>
            • This model applies to electromagnetic wave propagation (radio, light, X-rays, etc.)<br>
            • Higher frequency = shorter wavelength (e.g., radio waves vs. gamma rays)
        `
    };
}

function solveVehicleProblem() {
    const fuelConsumption = parseFloat(document.getElementById('fuelConsumption').value);
    const coeffA = parseFloat(document.getElementById('coeffA').value);
    const coeffB = parseFloat(document.getElementById('coeffB').value);
    
    if (!fuelConsumption || !coeffA || !coeffB) {
        throw new Error('Please enter all coefficient values.');
    }
    
    if (fuelConsumption <= 0) {
        throw new Error('Fuel consumption must be greater than zero.');
    }
    
    if (coeffA <= 0) {
        throw new Error('Coefficient A must be greater than zero.');
    }
    
    // Simplified model: C = a/v for demonstration
    // Optimal speed minimizes consumption: v = sqrt(a/C) is a simplified approximation
    // For more accurate: C = av/(v² + bv + c), optimal occurs when derivative = 0
    const optimalSpeed = Math.sqrt(coeffA / fuelConsumption);
    
    // Calculate fuel consumption at optimal speed (simplified)
    const optimalConsumption = coeffA / optimalSpeed;
    
    return {
        domainAnalysis: `
            <strong>Domain Analysis:</strong><br>
            <em>Fuel Consumption Model:</em> C = av/(v² + bv + c) or simplified C = a/v<br>
            <em>Domain:</em> v > 0 (positive speeds in km/h)<br>
            <em>Inverse Function:</em> v = f⁻¹(C) (gives speed from consumption)<br>
            <em>Domain of Inverse:</em> C > 0 (positive fuel consumption in L/100km)
        `,
        rangeAnalysis: `
            <strong>Range Analysis:</strong><br>
            <em>Fuel Consumption Range:</em> C > 0<br>
            <em>Inverse Function Range:</em> v > 0<br>
            <em>Result:</em> For consumption C = ${fuelConsumption} L/100km and coefficient a = ${coeffA}<br>
            <em>Optimal Speed:</em> ≈ ${optimalSpeed.toFixed(2)} km/h<br>
            <em>Consumption at Optimal Speed:</em> ≈ ${optimalConsumption.toFixed(2)} L/100km
        `,
        practicalImplications: `
            <strong>Practical Implications:</strong><br>
            • Vehicle speed and fuel consumption have a complex inverse relationship<br>
            • Both domain and range are restricted to positive values<br>
            • The inverse function helps find optimal speed for fuel efficiency<br>
            • This model represents realistic vehicle performance curves<br>
            • Lower speeds don't always mean better fuel economy - there's an optimal range!
        `
    };
}

function displayInverseApplicationSolution(solution) {
    // Add animation classes
    const domainEl = document.getElementById('inverseDomainAnalysis');
    const rangeEl = document.getElementById('inverseRangeAnalysis');
    const implicationsEl = document.getElementById('inversePracticalImplications');
    
    if (domainEl) {
        domainEl.classList.add('opacity-50');
        setTimeout(() => {
            domainEl.classList.remove('opacity-50');
            domainEl.classList.add('success-pop');
            domainEl.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2 flex items-center">
                    <i class="fas fa-bullseye text-green-500 mr-2"></i>Domain Analysis:
                </h4>
                <div class="text-gray-700 bg-green-50 p-3 rounded">${solution.domainAnalysis}</div>
            `;
            setTimeout(() => domainEl.classList.remove('success-pop'), 500);
        }, 200);
    }
    
    if (rangeEl) {
        rangeEl.classList.add('opacity-50');
        setTimeout(() => {
            rangeEl.classList.remove('opacity-50');
            rangeEl.classList.add('success-pop');
            rangeEl.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2 flex items-center">
                    <i class="fas fa-chart-bar text-purple-500 mr-2"></i>Range Analysis:
                </h4>
                <div class="text-gray-700 bg-purple-50 p-3 rounded">${solution.rangeAnalysis}</div>
            `;
            setTimeout(() => rangeEl.classList.remove('success-pop'), 500);
        }, 400);
    }
    
    if (implicationsEl) {
        implicationsEl.classList.add('opacity-50');
        setTimeout(() => {
            implicationsEl.classList.remove('opacity-50');
            implicationsEl.classList.add('success-pop');
            implicationsEl.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2 flex items-center">
                    <i class="fas fa-lightbulb text-orange-500 mr-2"></i>Practical Implications:
                </h4>
                <div class="text-gray-700 bg-orange-50 p-3 rounded">${solution.practicalImplications}</div>
            `;
            setTimeout(() => implicationsEl.classList.remove('success-pop'), 500);
        }, 600);
    }
    
    // Scroll to results
    setTimeout(() => {
        if (domainEl) {
            domainEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 700);
}

function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        confirmButtonColor: '#ef4444'
    });
}

// ------------------------------
// DOMContentLoaded Initialization
// ------------------------------
document.addEventListener('DOMContentLoaded', async function() {
    // Authentication guard
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
        const userNameEls = document.querySelectorAll('#userName, #userNameDropdown, #userNameMobile');
        userNameEls.forEach(el => {
            if (el && u.first_name) {
                el.textContent = `${u.first_name} ${u.last_name || ''}`.trim();
            }
        });
        
        // Load profile picture
        loadProfilePicture();
        
    } catch (e) {
        window.location.href = '../login.html';
        return;
    }
    
    // Initialize sidebar
    initializeSidebar();
    
    // Load completed lessons
    await drifLoadCompletedLessons();
    
    // Start study time interval (save every 30 seconds)
    drifStudyTimeInterval = setInterval(() => {
        if (drifCurrentLesson && !drifCompletedLessons.has(drifCurrentLesson)) {
            drifSaveStudyTimeForCurrentLesson();
        }
    }, 30000);
    
    // Load and display study time for current lesson
    await drifLoadAndDisplayStudyTime();
    
    // Show first lesson
    await drifShowLesson(1);
    
    // Initialize calculators
    initializeCalculators();
    
    // Update navigation buttons
    drifUpdateNavigationButtons();
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Page is hidden, save time
            if (drifCurrentLesson && !drifCompletedLessons.has(drifCurrentLesson)) {
                drifSaveStudyTimeForCurrentLesson();
            }
        } else {
            // Page is visible again, restart timer
            if (drifCurrentLesson && !drifCompletedLessons.has(drifCurrentLesson)) {
                const now = Date.now();
                if (!drifLessonStartTime[drifCurrentLesson]) {
                    drifLessonStartTime[drifCurrentLesson] = now;
                }
                if (!drifLastSaveTimestamp[drifCurrentLesson]) {
                    drifLastSaveTimestamp[drifCurrentLesson] = now;
                }
                drifStartLiveTimer();
            }
        }
    });
    
    // Handle page unload - save time before leaving
    window.addEventListener('beforeunload', function() {
        if (drifCurrentLesson && !drifCompletedLessons.has(drifCurrentLesson)) {
            drifSaveStudyTimeForCurrentLesson();
        }
    });
    
    // Handle window focus/blur
    window.addEventListener('focus', function() {
        if (drifCurrentLesson && !drifCompletedLessons.has(drifCurrentLesson)) {
            const now = Date.now();
            if (!drifLastSaveTimestamp[drifCurrentLesson]) {
                drifLastSaveTimestamp[drifCurrentLesson] = now;
            }
            drifStartLiveTimer();
        }
    });
    
    window.addEventListener('blur', function() {
        if (drifCurrentLesson && !drifCompletedLessons.has(drifCurrentLesson)) {
            drifSaveStudyTimeForCurrentLesson();
        }
    });
    
    // Handle Next button click - show quiz before proceeding
    const nextBtn = document.getElementById('nextLessonBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (this.disabled) return;
            
            // Check if current lesson is completed
            if (!drifCompletedLessons.has(drifCurrentLesson)) {
                Swal.fire({
                    icon: 'info',
                    title: 'Complete Current Topic',
                    html: `
                        <div class="text-left">
                            <p class="mb-3">You need to <strong>pass the 5 questions</strong> for Topic ${drifCurrentLesson} before proceeding.</p>
                            <p class="text-sm text-gray-600">Take the quiz and get at least <strong>3/5 correct</strong> (60%) to unlock the next topic.</p>
                        </div>
                    `,
                    confirmButtonText: 'Take Quiz Now',
                    confirmButtonColor: '#667eea',
                    showCancelButton: true,
                    cancelButtonText: 'Cancel'
                }).then((result) => {
                    if (result.isConfirmed) {
                        drifRunLessonQuiz(drifCurrentLesson).then(passed => {
                            if (passed && drifCurrentLesson < drifTotalLessons) {
                                drifShowLesson(drifCurrentLesson + 1, true);
                            }
                        });
                    }
                });
            } else {
                drifNavigateLesson(1);
            }
        });
    }
});
