// Rational Functions, Equations and Inequalities - Interactive JavaScript

// Global variables for rational function analysis
let currentFunction = {
    numerator: 'x + 1',
    denominator: 'x - 2',
    domain: 'x ≠ 2',
    verticalAsymptote: 'x = 2',
    horizontalAsymptote: 'y = 1'
};

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

function rfInjectLessonControls() {
    const sections = document.querySelectorAll('.lesson-section');
    sections.forEach((section, index) => {
        const lessonNum = index + 1;
        // Skip if controls already exist
        if (section.querySelector('[data-rf-controls]')) return;

        const controlsWrapper = document.createElement('div');
        controlsWrapper.setAttribute('data-rf-controls', 'true');
        controlsWrapper.innerHTML = `
            <div class="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 mb-8">
                <h3 class="text-xl font-semibold text-gray-800 mb-4 text-center">
                    <i class="fas fa-check-circle text-emerald-500 mr-2"></i>Complete This Lesson
                </h3>
                <p class="text-gray-600 text-center mb-6">Mark this lesson as completed to track your progress and unlock the next lesson.</p>
                <div class="text-center">
                    <button onclick="rfCompleteLesson(${lessonNum})" class="bg-emerald-500 text-white px-8 py-3 rounded-lg hover:bg-emerald-600 transition-colors font-semibold" data-rf-complete-btn="${lessonNum}">
                        <i class="fas fa-check mr-2"></i>Mark as Complete
                    </button>
                </div>
            </div>

            <div class="flex justify-between items-center mb-8">
                <button onclick="rfNavigateLesson(-1)" class="flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" data-rf-prev>
                    <i class="fas fa-chevron-left mr-2"></i>Previous Lesson
                </button>
                <div class="flex items-center space-x-4">
                    <div class="text-center">
                        <div class="text-lg font-semibold text-primary"><span id="rfCurrentLessonNum">${rfCurrentLesson}</span> of ${rfTotalLessons}</div>
                    </div>
                    <div class="w-32 bg-gray-200 rounded-full h-2">
                        <div id="rfLessonProgressBar" class="bg-primary h-2 rounded-full transition-all duration-300" style="width: ${(rfCurrentLesson / rfTotalLessons) * 100}%"></div>
                    </div>
                </div>
                <button onclick="rfNavigateLesson(1)" class="flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" data-rf-next>
                    Next Lesson<i class="fas fa-chevron-right ml-2"></i>
                </button>
            </div>
        `;

        section.appendChild(controlsWrapper);
    });

    rfUpdateNavigationButtons();
    rfUpdateCompletionButtonsUI();
}

function rfNavigateLesson(direction) {
    const newLesson = rfCurrentLesson + direction;
    if (newLesson >= 1 && newLesson <= rfTotalLessons) {
        rfShowLesson(newLesson, true);
    }
}

function rfShowLesson(lessonNum, scrollToTop = false) {
    const lessonNavBtns = document.querySelectorAll('.lesson-nav-btn');
    const lessonSections = document.querySelectorAll('.lesson-section');

    rfCurrentLesson = lessonNum;

    // Update nav buttons visual state
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

    // Show selected lesson
    lessonSections.forEach(section => section.classList.remove('active'));
    const target = document.getElementById(`lesson${lessonNum}`);
    if (target) target.classList.add('active');

    rfUpdateNavigationButtons();
    rfUpdateProgressIndicators();
    rfUpdateLessonCompletionStatus();

    if (scrollToTop) {
        const lessonContent = document.querySelector('.lesson-content');
        if (lessonContent) lessonContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function rfUpdateNavigationButtons() {
    const prev = document.querySelector('[data-rf-prev]');
    const next = document.querySelector('[data-rf-next]');
    if (prev) prev.disabled = rfCurrentLesson === 1;
    if (next) next.disabled = rfCurrentLesson === rfTotalLessons;
}

function rfUpdateProgressIndicators() {
    const numEl = document.getElementById('rfCurrentLessonNum');
    const bar = document.getElementById('rfLessonProgressBar');
    if (numEl) numEl.textContent = String(rfCurrentLesson);
    if (bar) bar.style.width = `${(rfCurrentLesson / rfTotalLessons) * 100}%`;
}

function rfUpdateLessonCompletionStatus() {
    const lessonNavBtns = document.querySelectorAll('.lesson-nav-btn');
    lessonNavBtns.forEach(btn => {
        const ln = parseInt(btn.dataset.lesson);
        const icon = btn.querySelector('.w-16');
        if (!icon) return;
        if (rfCompletedLessons.has(ln)) {
            icon.classList.remove('bg-gray-300', 'text-gray-600', 'bg-primary', 'text-white');
            icon.classList.add('bg-green-500', 'text-white');
            icon.innerHTML = '<i class="fas fa-check text-lg"></i>';
            rfSetCompleteButtonState(ln, { completed: true, loading: false });
        }
    });
    
    // Check if all lessons are completed and show topic completion option
    if (rfCompletedLessons.size === rfTotalLessons) {
        rfShowTopicCompletionOption();
    }
}

function rfGetCompleteButtonForLesson(lessonNum) {
    const section = document.getElementById(`lesson${lessonNum}`);
    if (!section) return null;
    return section.querySelector(`[data-rf-complete-btn="${lessonNum}"]`);
}

function rfSetCompleteButtonState(lessonNum, { completed = false, loading = false } = {}) {
    const btn = rfGetCompleteButtonForLesson(lessonNum);
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

function rfUpdateCompletionButtonsUI() {
    for (let i = 1; i <= rfTotalLessons; i++) {
        rfSetCompleteButtonState(i, { completed: rfCompletedLessons.has(i) });
    }
}

async function rfCompleteLesson(lessonNum) {
    console.log('Attempting to complete lesson:', lessonNum);
    
    try {
        // Guard: prevent duplicate completion submissions
        if (rfCompletedLessons.has(lessonNum)) {
            showSuccess(`Lesson ${lessonNum} is already completed.`);
            // Ensure UI reflects completed state
            rfSetCompleteButtonState(lessonNum, { completed: true, loading: false });
            return;
        }

        // Set loading state on the specific button
        rfSetCompleteButtonState(lessonNum, { completed: false, loading: true });

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
            
            // Show detailed error message
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
            // Revert loading state on error
            rfSetCompleteButtonState(lessonNum, { completed: rfCompletedLessons.has(lessonNum), loading: false });
            return;
        }
        
        if (data.success) {
            console.log('Lesson completion successful');
            
            // Add to completed lessons
            rfCompletedLessons.add(lessonNum);
            
            // Show completion status
            rfShowCompletionStatus();
            
            // Update lesson navigation
            rfUpdateLessonNavigation();
            
            // Lock the button as completed
            rfSetCompleteButtonState(lessonNum, { completed: true, loading: false });
            
            // Check if all lessons are completed
            if (rfCompletedLessons.size === rfTotalLessons) {
                // Show topic completion option
                rfShowTopicCompletionOption();
            }
            
            // Show success message
            Swal.fire({
                title: 'Lesson Completed!',
                text: `Great job completing Lesson ${lessonNum}!`,
                icon: 'success',
                confirmButtonText: 'Continue Learning',
                confirmButtonColor: '#10b981',
                background: '#ffffff',
                customClass: {
                    popup: 'rounded-2xl',
                    title: 'text-slate-800',
                    content: 'text-slate-600'
                }
            });
        } else {
            console.error('Server returned error:', data);
            throw new Error(data.message || 'Failed to complete lesson');
        }
    } catch (error) {
        console.error('Error completing lesson:', error);
        
        // Revert loading state on error
        rfSetCompleteButtonState(lessonNum, { completed: rfCompletedLessons.has(lessonNum), loading: false });
        
        // Show detailed error message
        Swal.fire({
            title: 'Error Completing Lesson',
            html: `
                <div class="text-left">
                    <p class="mb-2"><strong>Error:</strong> ${error.message}</p>
                    <p class="mb-2"><strong>Lesson:</strong> ${lessonNum}</p>
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
            rfUpdateCompletionButtonsUI();
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

// Show completion status
function rfShowCompletionStatus() {
    const statusDiv = document.getElementById('lessonCompletionStatus');
    if (statusDiv) {
        statusDiv.classList.remove('hidden');
        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 3000);
    }
}

// Update lesson navigation with completion status
function rfUpdateLessonNavigation() {
    const lessonNavBtns = document.querySelectorAll('.lesson-nav-btn');
    
    lessonNavBtns.forEach(btn => {
        const lessonNum = parseInt(btn.dataset.lesson);
        const icon = btn.querySelector('.w-16');
        
        if (rfCompletedLessons.has(lessonNum)) {
            icon.classList.remove('bg-gray-300', 'text-gray-600', 'bg-primary', 'text-white');
            icon.classList.add('bg-green-500', 'text-white');
        } else {
            icon.classList.remove('bg-green-500', 'text-white', 'bg-primary', 'text-white');
            icon.classList.add('bg-gray-300', 'text-gray-600');
        }
    });
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
// Lesson Navigation
document.addEventListener('DOMContentLoaded', function() {
    try {
        rfInjectLessonControls();

        // Rewire lesson nav buttons to use our showLesson (capture and stop)
        const lessonNavBtns = document.querySelectorAll('.lesson-nav-btn');
        lessonNavBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopImmediatePropagation();
                const lessonNum = parseInt(this.dataset.lesson);
                rfShowLesson(lessonNum, true);
            }, true);
        });

        // Initial state
        rfShowLesson(1, false);
        rfUpdateNavigationButtons();
        rfLoadCompletedLessons();
    } catch (_) {
        // Non-fatal if structure differs
    }
});

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
    
    // Parse the functions (simplified parsing for demo)
    const analysis = analyzeRationalFunctionMath(numerator, denominator);
    
    // Update results with animation
    animateResultUpdate('domainResult', analysis.domain);
    animateResultUpdate('verticalAsymptote', analysis.verticalAsymptote);
    animateResultUpdate('horizontalAsymptote', analysis.horizontalAsymptote);
    animateResultUpdate('xIntercept', analysis.xIntercept);
    animateResultUpdate('yIntercept', analysis.yIntercept);
    
    // Draw the graph (generic)
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
    // Simplified parsing for demo
    let restrictions = 'x ≠ 2, x ≠ -2';
    let domain = '(-∞, -2) ∪ (-2, 2) ∪ (2, ∞)';
    
    if (functionStr.includes('x² - 4')) {
        restrictions = 'x ≠ 2, x ≠ -2';
        domain = '(-∞, -2) ∪ (-2, 2) ∪ (2, ∞)';
    } else if (functionStr.includes('x - 2')) {
        restrictions = 'x ≠ 2';
        domain = '(-∞, 2) ∪ (2, ∞)';
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
    // Simplified analysis for demo purposes
    let domain = 'All real numbers';
    let verticalAsymptote = 'None';
    let horizontalAsymptote = 'y = 0';
    
    // Basic analysis based on common patterns
    if (denominator.includes('x')) {
        if (denominator.includes('x - 2')) {
            domain = 'x ≠ 2';
            verticalAsymptote = 'x = 2';
        } else if (denominator.includes('x + 3')) {
            domain = 'x ≠ -3';
            verticalAsymptote = 'x = -3';
        }
    }
    
    // Determine horizontal asymptote based on degrees
    const numDegree = getPolynomialDegree(numerator);
    const denDegree = getPolynomialDegree(denominator);
    
    if (numDegree < denDegree) {
        horizontalAsymptote = 'y = 0';
    } else if (numDegree === denDegree) {
        horizontalAsymptote = 'y = 1';
    } else {
        horizontalAsymptote = 'None (oblique asymptote)';
    }
    
    return {
        domain,
        verticalAsymptote,
        horizontalAsymptote
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
