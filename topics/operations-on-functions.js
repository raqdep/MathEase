// Operations on Functions - Interactive JavaScript

// Global variables for lesson management
let currentLesson = 1;
let completedLessons = new Set();
let totalLessons = 5;

// Lesson Navigation
document.addEventListener('DOMContentLoaded', function() {
    const lessonNavBtns = document.querySelectorAll('.lesson-nav-btn');
    const lessonSections = document.querySelectorAll('.lesson-section');
    
    lessonNavBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const lessonNum = parseInt(this.dataset.lesson);
            showLesson(lessonNum, true); // Pass true to scroll to top
        });
    });
    
    // Initialize first lesson as active
    showLesson(1);
    updateNavigationButtons();
    loadCompletedLessons();
    // Initialize completion buttons state on first load
    updateCompletionButtonsUI();

    // Default auto-calc for calculators
    try { calculateOperation(); } catch(e) {}
    try { calculateMultiplication(); } catch(e) {}
    try { calculateDivision(); } catch(e) {}
    try { calculateComposition(); } catch(e) {}
});

// Show specific lesson
function showLesson(lessonNum, scrollToTop = false) {
    const lessonNavBtns = document.querySelectorAll('.lesson-nav-btn');
    const lessonSections = document.querySelectorAll('.lesson-section');
    
    currentLesson = lessonNum;
    
    // Update navigation buttons
    lessonNavBtns.forEach(b => {
        b.classList.remove('border-primary', 'bg-primary');
        b.classList.add('border-transparent');
        const icon = b.querySelector('.w-16');
        icon.classList.remove('bg-primary', 'text-white');
        icon.classList.add('bg-gray-300', 'text-gray-600');
    });
    
    // Highlight current lesson button
    const currentBtn = document.querySelector(`[data-lesson="${lessonNum}"]`);
    if (currentBtn) {
        currentBtn.classList.add('border-primary', 'bg-primary');
        currentBtn.classList.remove('border-transparent');
        const icon = currentBtn.querySelector('.w-16');
        icon.classList.add('bg-primary', 'text-white');
        icon.classList.remove('bg-gray-300', 'text-gray-600');
    }
    
    // Show selected lesson
    lessonSections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`lesson${lessonNum}`).classList.add('active');
    
    // Add animation
    const activeSection = document.getElementById(`lesson${lessonNum}`);
    activeSection.classList.add('fade-in');
    
    // Update progress indicators
    updateProgressIndicators();
    updateNavigationButtons();
    
    // Scroll to top if requested
    if (scrollToTop) {
        scrollToTopOfLesson();
    }

    // Ensure lesson completion buttons reflect current completion state
    updateCompletionButtonsUI();
}

// Navigate between lessons
function navigateLesson(direction) {
    const newLesson = currentLesson + direction;
    if (newLesson >= 1 && newLesson <= totalLessons) {
        showLesson(newLesson, true); // Pass true to scroll to top
    }
}

// Scroll to top of lesson content
function scrollToTopOfLesson() {
    // Find the lesson content container
    const lessonContent = document.querySelector('.lesson-content');
    if (lessonContent) {
        // Smooth scroll to the top of lesson content
        lessonContent.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    } else {
        // Fallback: scroll to top of page
        window.scrollTo({ 
            top: 0, 
            behavior: 'smooth' 
        });
    }
}

// --- Completion Button Helpers ---
function getCompleteButtonForLesson(lessonNum) {
    const section = document.getElementById(`lesson${lessonNum}`);
    if (!section) return null;
    return section.querySelector('button[onclick="completeLesson(' + lessonNum + ')"]');
}

function setCompleteButtonState(lessonNum, { completed = false, loading = false } = {}) {
    const btn = getCompleteButtonForLesson(lessonNum);
    if (!btn) return;

    if (loading) {
        btn.disabled = true;
        btn.classList.add('opacity-75', 'cursor-not-allowed');
        return;
    }

    btn.classList.remove('opacity-75', 'cursor-not-allowed');

    if (completed) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-check mr-2"></i>Completed';
        btn.classList.remove('bg-emerald-500', 'hover:bg-emerald-600');
        btn.classList.add('bg-gray-400');
    } else {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check mr-2"></i>Mark as Complete';
        btn.classList.add('bg-emerald-500');
        btn.classList.remove('bg-gray-400');
    }
}

function updateCompletionButtonsUI() {
    for (let i = 1; i <= totalLessons; i++) {
        setCompleteButtonState(i, { completed: completedLessons.has(i), loading: false });
    }
}

// Update navigation buttons state
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevLessonBtn');
    const nextBtn = document.getElementById('nextLessonBtn');
    
    if (!prevBtn || !nextBtn) return;
    
    // Previous button
    if (currentLesson <= 1) {
        prevBtn.disabled = true;
    } else {
        prevBtn.disabled = false;
    }
    
    // Next button
    if (currentLesson >= totalLessons) {
        nextBtn.disabled = true;
    } else {
        nextBtn.disabled = false;
    }
}

// Update progress indicators
function updateProgressIndicators() {
    const currentLessonNum = document.getElementById('currentLessonNum');
    const progressBar = document.getElementById('lessonProgressBar');
    
    if (currentLessonNum) {
        currentLessonNum.textContent = currentLesson;
    }
    
    if (progressBar) {
        const progress = (currentLesson / totalLessons) * 100;
        progressBar.style.width = progress + '%';
    }
}

// Complete a lesson
async function completeLesson(lessonNum) {
    console.log('Attempting to complete lesson:', lessonNum);
    
    try {
        // Guard: prevent duplicate completion submissions
        if (completedLessons.has(lessonNum)) {
            showSuccess(`Lesson ${lessonNum} is already completed.`);
            // Ensure UI reflects completed state
            setCompleteButtonState(lessonNum, { completed: true, loading: false });
            return;
        }

        // Set loading state on the specific button
        setCompleteButtonState(lessonNum, { completed: false, loading: true });

        const requestData = {
            topic: 'operations-on-functions',
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
            setCompleteButtonState(lessonNum, { completed: completedLessons.has(lessonNum), loading: false });
            return;
        }
        
        if (data.success) {
            console.log('Lesson completion successful');
            
            completedLessons.add(lessonNum);
            showSuccess('Lesson completed successfully!');
            
            // Update lesson completion status
            updateLessonCompletionStatus();
            // Lock the button as completed
            setCompleteButtonState(lessonNum, { completed: true, loading: false });
            
            // Check if all lessons are completed
            if (completedLessons.size === totalLessons) {
                showTopicCompletionOption();
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
        setCompleteButtonState(lessonNum, { completed: completedLessons.has(lessonNum), loading: false });
        
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

// Load completed lessons
async function loadCompletedLessons() {
    console.log('Loading completed lessons for operations-on-functions topic');
    
    try {
        const requestData = {
            topic: 'operations-on-functions',
            action: 'get_completed'
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
            // Don't show error to user, just log it
            // The lesson completion will still work, just won't show previous completions
            return;
        }
        
        if (data.success && data.completed_lessons) {
            console.log('Successfully loaded completed lessons:', data.completed_lessons);
            completedLessons = new Set(data.completed_lessons);
            updateLessonCompletionStatus();
            // Sync buttons with loaded completion state
            updateCompletionButtonsUI();
            
            // Check if all lessons are completed and show topic completion option
            if (completedLessons.size === totalLessons) {
                showTopicCompletionOption();
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

// Update lesson completion status
function updateLessonCompletionStatus() {
    const lessonNavBtns = document.querySelectorAll('.lesson-nav-btn');
    
    lessonNavBtns.forEach(btn => {
        const lessonNum = parseInt(btn.dataset.lesson);
        const icon = btn.querySelector('.w-16');
        
        if (completedLessons.has(lessonNum)) {
            // Mark as completed
            icon.classList.remove('bg-gray-300', 'text-gray-600', 'bg-primary', 'text-white');
            icon.classList.add('bg-green-500', 'text-white');
            
            // Add checkmark
            const checkmark = icon.querySelector('.fa-check');
            if (!checkmark) {
                icon.innerHTML = '<i class="fas fa-check text-lg"></i>';
            }

            // Also ensure the corresponding Complete button is disabled and marked
            setCompleteButtonState(lessonNum, { completed: true, loading: false });
        } else {
            // Reset to normal state
            if (lessonNum === currentLesson) {
                icon.classList.remove('bg-gray-300', 'text-gray-600', 'bg-green-500', 'text-white');
                icon.classList.add('bg-primary', 'text-white');
            } else {
                icon.classList.remove('bg-primary', 'text-white', 'bg-green-500', 'text-white');
                icon.classList.add('bg-gray-300', 'text-gray-600');
            }
            
            // Remove checkmark and restore original icon
            const originalIcons = {
                1: '<i class="fas fa-plus text-2xl"></i>',
                2: '<i class="fas fa-times text-2xl"></i>',
                3: '<i class="fas fa-divide text-2xl"></i>',
                4: '<i class="fas fa-layer-group text-2xl"></i>',
                5: '<i class="fas fa-chart-line text-2xl"></i>'
            };
            icon.innerHTML = originalIcons[lessonNum] || '<i class="fas fa-book text-2xl"></i>';

            // Ensure the Complete button is enabled for incomplete lessons
            setCompleteButtonState(lessonNum, { completed: false, loading: false });
        }
    });
}

// Show topic completion option
function showTopicCompletionOption() {
    // Create a topic completion section if it doesn't exist
    let topicCompletionSection = document.getElementById('topicCompletionSection');
    
    if (!topicCompletionSection) {
        // Find the last lesson section to add the topic completion after it
        const lastLesson = document.querySelector('#lesson5');
        if (lastLesson) {
            const completionHTML = `
                <div id="topicCompletionSection" class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 mb-8" style="display: block;">
                    <h3 class="text-xl font-semibold text-gray-800 mb-4 text-center">
                        <i class="fas fa-trophy text-purple-500 mr-2"></i>Complete This Topic
                    </h3>
                    <p class="text-gray-600 text-center mb-6">
                        Congratulations! You've completed all lessons in the Operations on Functions topic. Mark this topic as complete to update your progress.
                    </p>
                    <div class="text-center">
                        <button onclick="completeTopic()" 
                                class="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-colors font-semibold inline-flex items-center">
                            <i class="fas fa-trophy mr-2"></i>
                            Mark This Topic About Operations on Functions Complete
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
async function completeTopic() {
    console.log('Attempting to complete topic: operations-on-functions');
    
    try {
        const requestData = {
            topic: 'operations-on-functions',
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
                text: 'Congratulations! You have successfully completed the Operations on Functions topic. Your progress has been updated.',
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
                    <p class="mb-2"><strong>Topic:</strong> operations-on-functions</p>
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

// Function Operations Calculator
function calculateOperation() {
    const f = document.getElementById('functionF').value.trim();
    const g = document.getElementById('functionG').value.trim();
    const operation = document.getElementById('operation').value;
    
    if (!f || !g) {
        showError('Please enter both functions f(x) and g(x)');
        return;
    }
    
    try {
        let result;
        let steps = [];
        
        switch(operation) {
            case 'add':
                result = performAddition(f, g);
                steps = [
                    `(f + g)(x) = f(x) + g(x)`,
                    `= (${f}) + (${g})`,
                    `= ${result}`
                ];
                break;
            case 'subtract':
                result = performSubtraction(f, g);
                steps = [
                    `(f - g)(x) = f(x) - g(x)`,
                    `= (${f}) - (${g})`,
                    `= ${result}`
                ];
                break;
            default:
                showError('Operation not supported yet');
                return;
        }
        
        document.getElementById('operationResult').textContent = result;
        updateOperationSteps(steps);
        showSuccess('Operation calculated successfully!');
        
    } catch (error) {
        showError('Error calculating operation: ' + error.message);
    }
}

// --- Preset Helpers (click-only experience) ---
function setAddSub(which, expr) {
    if (which === 'f') {
        document.getElementById('functionF').value = expr;
    } else {
        document.getElementById('functionG').value = expr;
    }
    calculateOperation();
}

function setAddSubOp(op) {
    document.getElementById('operation').value = op;
    calculateOperation();
}

// Multiplication Calculator
function calculateMultiplication() {
    const f = document.getElementById('multFunctionF').value.trim();
    const g = document.getElementById('multFunctionG').value.trim();
    
    if (!f || !g) {
        showError('Please enter both functions f(x) and g(x)');
        return;
    }
    
    try {
        const result = performMultiplication(f, g);
        const steps = [
            `(f • g)(x) = f(x) • g(x)`,
            `= (${f}) • (${g})`,
            `= ${result}`
        ];
        
        document.getElementById('multiplicationResult').textContent = result;
        updateMultiplicationSteps(steps);
        showSuccess('Multiplication calculated successfully!');
        
    } catch (error) {
        showError('Error calculating multiplication: ' + error.message);
    }
}

function setMult(which, expr) {
    if (which === 'f') {
        document.getElementById('multFunctionF').value = expr;
    } else {
        document.getElementById('multFunctionG').value = expr;
    }
    calculateMultiplication();
}

// Division Calculator
function calculateDivision() {
    const f = document.getElementById('divFunctionF').value.trim();
    const g = document.getElementById('divFunctionG').value.trim();
    
    if (!f || !g) {
        showError('Please enter both functions f(x) and g(x)');
        return;
    }
    
    try {
        const result = performDivision(f, g);
        const restrictions = findDivisionRestrictions(f, g);
        const steps = [
            `(f / g)(x) = f(x) / g(x)`,
            `= (${f}) / (${g})`,
            `= ${result}`
        ];
        
        document.getElementById('divisionResult').textContent = result;
        document.getElementById('divisionRestrictions').textContent = restrictions;
        updateDivisionSteps(steps);
        showSuccess('Division calculated successfully!');
        
    } catch (error) {
        showError('Error calculating division: ' + error.message);
    }
}

function setDiv(which, expr) {
    if (which === 'f') {
        document.getElementById('divFunctionF').value = expr;
    } else {
        document.getElementById('divFunctionG').value = expr;
    }
    calculateDivision();
}

// Composition Calculator
function calculateComposition() {
    const f = document.getElementById('compFunctionF').value.trim();
    const g = document.getElementById('compFunctionG').value.trim();
    const type = document.getElementById('compositionType').value;
    
    if (!f || !g) {
        showError('Please enter both functions f(x) and g(x)');
        return;
    }
    
    try {
        let result, steps;
        
        if (type === 'fog') {
            result = performComposition(f, g);
            steps = [
                `(f ∘ g)(x) = f(g(x))`,
                `= f(${g})`,
                `= ${result}`
            ];
        } else {
            result = performComposition(g, f);
            steps = [
                `(g ∘ f)(x) = g(f(x))`,
                `= g(${f})`,
                `= ${result}`
            ];
        }
        
        document.getElementById('compositionResult').textContent = result;
        updateCompositionSteps(steps);
        showSuccess('Composition calculated successfully!');
        
    } catch (error) {
        showError('Error calculating composition: ' + error.message);
    }
}

function setComp(which, expr) {
    if (which === 'f') {
        document.getElementById('compFunctionF').value = expr;
    } else {
        document.getElementById('compFunctionG').value = expr;
    }
    calculateComposition();
}

function setCompType(type) {
    document.getElementById('compositionType').value = type;
    calculateComposition();
}

// Function Addition
function performAddition(f, g) {
    // Parse and simplify the addition
    const fParsed = parseFunction(f);
    const gParsed = parseFunction(g);
    
    if (fParsed.type === 'linear' && gParsed.type === 'linear') {
        const a1 = fParsed.coefficient;
        const b1 = fParsed.constant;
        const a2 = gParsed.coefficient;
        const b2 = gParsed.constant;
        
        const newCoeff = a1 + a2;
        const newConst = b1 + b2;
        
        if (newConst >= 0) {
            return `${newCoeff}x + ${newConst}`;
        } else {
            return `${newCoeff}x - ${Math.abs(newConst)}`;
        }
    } else if (fParsed.type === 'quadratic' || gParsed.type === 'quadratic') {
        // Handle quadratic + linear or quadratic + quadratic
        return `(${f}) + (${g})`;
    } else {
        return `(${f}) + (${g})`;
    }
}

// Function Subtraction
function performSubtraction(f, g) {
    // Parse and simplify the subtraction
    const fParsed = parseFunction(f);
    const gParsed = parseFunction(g);
    
    if (fParsed.type === 'linear' && gParsed.type === 'linear') {
        const a1 = fParsed.coefficient;
        const b1 = fParsed.constant;
        const a2 = gParsed.coefficient;
        const b2 = gParsed.constant;
        
        const newCoeff = a1 - a2;
        const newConst = b1 - b2;
        
        if (newConst >= 0) {
            return `${newCoeff}x + ${newConst}`;
        } else {
            return `${newCoeff}x - ${Math.abs(newConst)}`;
        }
    } else {
        return `(${f}) - (${g})`;
    }
}

// Function Multiplication
function performMultiplication(f, g) {
    const fParsed = parseFunction(f);
    const gParsed = parseFunction(g);
    
    if (fParsed.type === 'linear' && gParsed.type === 'linear') {
        const a1 = fParsed.coefficient;
        const b1 = fParsed.constant;
        const a2 = gParsed.coefficient;
        const b2 = gParsed.constant;
        
        // FOIL method: (a1x + b1)(a2x + b2) = a1a2x² + (a1b2 + b1a2)x + b1b2
        const x2Coeff = a1 * a2;
        const xCoeff = a1 * b2 + b1 * a2;
        const constTerm = b1 * b2;
        
        let result = '';
        if (x2Coeff !== 0) {
            result += x2Coeff === 1 ? 'x²' : x2Coeff === -1 ? '-x²' : `${x2Coeff}x²`;
        }
        if (xCoeff !== 0) {
            if (result && xCoeff > 0) result += ' + ';
            if (result && xCoeff < 0) result += ' - ';
            if (!result && xCoeff < 0) result += '-';
            result += Math.abs(xCoeff) === 1 ? 'x' : `${Math.abs(xCoeff)}x`;
        }
        if (constTerm !== 0) {
            if (result && constTerm > 0) result += ' + ';
            if (result && constTerm < 0) result += ' - ';
            if (!result && constTerm < 0) result += '-';
            result += Math.abs(constTerm);
        }
        
        return result || '0';
    } else {
        return `(${f}) • (${g})`;
    }
}

// Function Division
function performDivision(f, g) {
    // For simple cases, return the division
    if (f.includes('x²') && g.includes('x')) {
        // Try to factor and simplify
        if (f === 'x² - 4' && g === 'x - 2') {
            return 'x + 2';
        }
        if (f === 'x² - 9' && g === 'x + 3') {
            return 'x - 3';
        }
    }
    
    return `(${f}) / (${g})`;
}

// Find Division Restrictions
function findDivisionRestrictions(f, g) {
    const gParsed = parseFunction(g);
    
    if (gParsed.type === 'linear') {
        const a = gParsed.coefficient;
        const b = gParsed.constant;
        
        if (a !== 0) {
            const restriction = -b / a;
            return `where x ≠ ${restriction}`;
        }
    }
    
    return 'where g(x) ≠ 0';
}

// Function Composition
function performComposition(f, g) {
    const fParsed = parseFunction(f);
    const gParsed = parseFunction(g);
    
    if (fParsed.type === 'linear' && gParsed.type === 'linear') {
        // f(g(x)) where f(x) = a1x + b1 and g(x) = a2x + b2
        const a1 = fParsed.coefficient;
        const b1 = fParsed.constant;
        const a2 = gParsed.coefficient;
        const b2 = gParsed.constant;
        
        // f(g(x)) = a1(a2x + b2) + b1 = a1a2x + a1b2 + b1
        const newCoeff = a1 * a2;
        const newConst = a1 * b2 + b1;
        
        if (newConst >= 0) {
            return `${newCoeff}x + ${newConst}`;
        } else {
            return `${newCoeff}x - ${Math.abs(newConst)}`;
        }
    } else {
        return `f(${g})`;
    }
}

// Parse Function Expression
function parseFunction(func) {
    func = func.replace(/\s/g, ''); // Remove spaces
    
    // Check for linear function: ax + b
    const linearMatch = func.match(/^(-?\d*)x([+-]\d+)?$/);
    if (linearMatch) {
        const coeff = linearMatch[1] === '' || linearMatch[1] === '-' ? 
                     (linearMatch[1] === '-' ? -1 : 1) : parseInt(linearMatch[1]);
        const constant = linearMatch[2] ? parseInt(linearMatch[2]) : 0;
        return { type: 'linear', coefficient: coeff, constant: constant };
    }
    
    // Check for quadratic function: ax² + bx + c
    const quadraticMatch = func.match(/^(-?\d*)x²([+-]\d*x)?([+-]\d+)?$/);
    if (quadraticMatch) {
        return { type: 'quadratic', expression: func };
    }
    
    // Check for polynomial
    if (func.includes('x²') || func.includes('x^2')) {
        return { type: 'quadratic', expression: func };
    }
    
    // Default to polynomial
    return { type: 'polynomial', expression: func };
}

// Update Operation Steps
function updateOperationSteps(steps) {
    const stepsContainer = document.getElementById('operationSteps');
    if (!stepsContainer) return;
    
    stepsContainer.innerHTML = '';
    
    steps.forEach((step, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'bg-white/20 rounded-lg p-3';
        stepDiv.innerHTML = `
            <p class="text-sm">Step ${index + 1}: ${getStepDescription(index)}</p>
            <p class="font-mono text-lg">${step}</p>
        `;
        stepsContainer.appendChild(stepDiv);
    });
}

// Update Multiplication Steps
function updateMultiplicationSteps(steps) {
    const stepsContainer = document.getElementById('multiplicationSteps');
    if (!stepsContainer) return;
    
    stepsContainer.innerHTML = '';
    
    steps.forEach((step, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'bg-white/20 rounded-lg p-3';
        stepDiv.innerHTML = `
            <p class="text-sm">Step ${index + 1}: ${getMultiplicationStepDescription(index)}</p>
            <p class="font-mono text-lg">${step}</p>
        `;
        stepsContainer.appendChild(stepDiv);
    });
}

// Update Division Steps
function updateDivisionSteps(steps) {
    const stepsContainer = document.getElementById('divisionSteps');
    if (!stepsContainer) return;
    
    stepsContainer.innerHTML = '';
    
    steps.forEach((step, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'bg-white/20 rounded-lg p-3';
        stepDiv.innerHTML = `
            <p class="text-sm">Step ${index + 1}: ${getDivisionStepDescription(index)}</p>
            <p class="font-mono text-lg">${step}</p>
        `;
        stepsContainer.appendChild(stepDiv);
    });
}

// Update Composition Steps
function updateCompositionSteps(steps) {
    const stepsContainer = document.getElementById('compositionSteps');
    if (!stepsContainer) return;
    
    stepsContainer.innerHTML = '';
    
    steps.forEach((step, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'bg-white/20 rounded-lg p-3';
        stepDiv.innerHTML = `
            <p class="text-sm">Step ${index + 1}: ${getCompositionStepDescription(index)}</p>
            <p class="font-mono text-lg">${step}</p>
        `;
        stepsContainer.appendChild(stepDiv);
    });
}

// Get Step Description
function getStepDescription(stepIndex) {
    const descriptions = [
        'Write the operation formula',
        'Substitute the functions',
        'Simplify the result'
    ];
    return descriptions[stepIndex] || 'Calculate';
}

// Get Multiplication Step Description
function getMultiplicationStepDescription(stepIndex) {
    const descriptions = [
        'Write the multiplication formula',
        'Substitute the functions',
        'Apply FOIL method and simplify'
    ];
    return descriptions[stepIndex] || 'Calculate';
}

// Get Division Step Description
function getDivisionStepDescription(stepIndex) {
    const descriptions = [
        'Write the division formula',
        'Substitute the functions',
        'Factor and simplify'
    ];
    return descriptions[stepIndex] || 'Calculate';
}

// Get Composition Step Description
function getCompositionStepDescription(stepIndex) {
    const descriptions = [
        'Write the composition formula',
        'Substitute the inner function',
        'Apply the outer function'
    ];
    return descriptions[stepIndex] || 'Calculate';
}

// Show Success Message
function showSuccess(message) {
    showMessage(message, 'success');
}

// Show Error Message
function showError(message) {
    showMessage(message, 'error');
}

// Show Message
function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message-toast');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-toast fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateX(100%)';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// Interactive Function Evaluator
function evaluateFunctionAtPoint() {
    const functionInput = document.getElementById('functionInput');
    const pointInput = document.getElementById('pointInput');
    const resultDiv = document.getElementById('evaluationResult');
    
    if (!functionInput || !pointInput || !resultDiv) return;
    
    const func = functionInput.value.trim();
    const point = parseFloat(pointInput.value);
    
    if (!func || isNaN(point)) {
        resultDiv.innerHTML = '<p class="text-red-500">Please enter a valid function and point</p>';
        return;
    }
    
    try {
        const result = evaluateFunctionAt(func, point);
        resultDiv.innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <p class="text-green-800 font-semibold">f(${point}) = ${result}</p>
            </div>
        `;
    } catch (error) {
        resultDiv.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-red-800">Error: ${error.message}</p>
            </div>
        `;
    }
}

// Evaluate Function at Point
function evaluateFunctionAt(func, x) {
    // Simple evaluation for basic functions
    func = func.replace(/\s/g, ''); // Remove spaces
    
    // Handle linear functions: ax + b
    const linearMatch = func.match(/^(-?\d*)x([+-]\d+)?$/);
    if (linearMatch) {
        const coeff = linearMatch[1] === '' || linearMatch[1] === '-' ? 
                     (linearMatch[1] === '-' ? -1 : 1) : parseInt(linearMatch[1]);
        const constant = linearMatch[2] ? parseInt(linearMatch[2]) : 0;
        return coeff * x + constant;
    }
    
    // Handle quadratic functions: ax² + bx + c
    const quadraticMatch = func.match(/^(-?\d*)x²([+-]\d*x)?([+-]\d+)?$/);
    if (quadraticMatch) {
        const a = quadraticMatch[1] === '' || quadraticMatch[1] === '-' ? 
                 (quadraticMatch[1] === '-' ? -1 : 1) : parseInt(quadraticMatch[1]);
        const b = quadraticMatch[2] ? parseInt(quadraticMatch[2].replace('x', '')) : 0;
        const c = quadraticMatch[3] ? parseInt(quadraticMatch[3]) : 0;
        return a * x * x + b * x + c;
    }
    
    // For more complex functions, use a simple evaluator
    try {
        // Replace x with the actual value
        const expression = func.replace(/x/g, `(${x})`);
        return eval(expression);
    } catch (e) {
        throw new Error('Unable to evaluate function at this point');
    }
}

// Domain Calculator
function calculateDomain() {
    const functionInput = document.getElementById('domainFunction');
    const resultDiv = document.getElementById('domainResult');
    
    if (!functionInput || !resultDiv) return;
    
    const func = functionInput.value.trim();
    
    if (!func) {
        resultDiv.innerHTML = '<p class="text-red-500">Please enter a function</p>';
        return;
    }
    
    try {
        const domain = findDomain(func);
        resultDiv.innerHTML = `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p class="text-blue-800 font-semibold">Domain: ${domain}</p>
            </div>
        `;
    } catch (error) {
        resultDiv.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-red-800">Error: ${error.message}</p>
            </div>
        `;
    }
}

// Find Domain of Function
function findDomain(func) {
    func = func.replace(/\s/g, ''); // Remove spaces
    
    // Check for square root
    if (func.includes('√') || func.includes('sqrt')) {
        return 'x ≥ 0 (square root function)';
    }
    
    // Check for rational function
    if (func.includes('/') && func.includes('x')) {
        return 'x ≠ 0 (rational function)';
    }
    
    // Check for polynomial
    if (func.match(/^[+-]?\d*x(\^?\d+)?([+-]\d*x(\^?\d+)?)*([+-]\d+)?$/)) {
        return 'All real numbers (polynomial function)';
    }
    
    // Default case
    return 'All real numbers';
}

// Practice Problem Generator
function generatePracticeProblem() {
    const problems = [
        {
            type: 'addition',
            f: '2x + 3',
            g: 'x - 1',
            answer: '3x + 2',
            explanation: 'Add the coefficients of x and the constants separately'
        },
        {
            type: 'subtraction',
            f: 'x² + 2x',
            g: 'x + 1',
            answer: 'x² + x - 1',
            explanation: 'Subtract each term, remembering to distribute the negative sign'
        },
        {
            type: 'addition',
            f: '3x - 2',
            g: 'x² + 1',
            answer: 'x² + 3x - 1',
            explanation: 'Combine like terms: x² + (3x + 0x) + (-2 + 1)'
        }
    ];
    
    const randomProblem = problems[Math.floor(Math.random() * problems.length)];
    
    const problemDiv = document.getElementById('practiceProblem');
    if (problemDiv) {
        problemDiv.innerHTML = `
            <div class="bg-white rounded-lg p-6 shadow-lg">
                <h4 class="text-lg font-semibold text-gray-800 mb-4">Practice Problem</h4>
                <p class="text-gray-700 mb-2">Given: f(x) = ${randomProblem.f}, g(x) = ${randomProblem.g}</p>
                <p class="text-gray-700 mb-4">Find: (f ${randomProblem.type === 'addition' ? '+' : '-'} g)(x)</p>
                <button onclick="showPracticeAnswer('${randomProblem.answer}', '${randomProblem.explanation}')" 
                        class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition-colors">
                    Show Answer
                </button>
            </div>
        `;
    }
}

// Show Practice Answer
function showPracticeAnswer(answer, explanation) {
    const answerDiv = document.getElementById('practiceAnswer');
    if (answerDiv) {
        answerDiv.innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <h5 class="font-semibold text-green-800 mb-2">Answer:</h5>
                <p class="text-green-700 font-mono text-lg mb-2">${answer}</p>
                <p class="text-green-600 text-sm">${explanation}</p>
            </div>
        `;
    }
}

// Interactive Graph Drawing
function drawFunctionGraph() {
    const canvas = document.getElementById('functionGraph');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set up coordinate system
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 30; // pixels per unit
    
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
    
    // Draw function
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    let firstPoint = true;
    for (let x = -10; x <= 10; x += 0.1) {
        const y = x * x; // Simple quadratic function
        const screenX = centerX + x * scale;
        const screenY = centerY - y * scale;
        
        if (firstPoint) {
            ctx.moveTo(screenX, screenY);
            firstPoint = false;
        } else {
            ctx.lineTo(screenX, screenY);
        }
    }
    
    ctx.stroke();
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
        drawFunctionGraph();
    }, 100);
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

// Problem Solver Functions
function loadProblem() {
    const problemType = document.getElementById('problemType').value;
    const solutionDiv = document.getElementById('problemSolution');
    
    const problems = {
        economics: {
            solution: 'P(x) = -0.5x² + 30x - 100',
            steps: [
                'Step 1: Identify profit function',
                'P(x) = R(x) - C(x)',
                'Step 2: Substitute functions',
                'P(x) = (50x - 0.5x²) - (20x + 100)',
                'Step 3: Simplify',
                'P(x) = -0.5x² + 30x - 100'
            ]
        },
        physics: {
            solution: 'h(t) = 20t - 4.9t²',
            steps: [
                'Step 1: Identify composition',
                'h(t) = h(v(t))',
                'Step 2: Substitute v(t)',
                'h(t) = (20 - 9.8t)² / 19.6',
                'Step 3: Simplify',
                'h(t) = 20t - 4.9t²'
            ]
        },
        engineering: {
            solution: 'P(t) = 4sin²(t) × (5 + 0.1t)',
            steps: [
                'Step 1: Identify power formula',
                'P(t) = I²(t) × R(t)',
                'Step 2: Substitute functions',
                'P(t) = (2sin(t))² × (5 + 0.1t)',
                'Step 3: Simplify',
                'P(t) = 4sin²(t) × (5 + 0.1t)'
            ]
        }
    };
    
    const problem = problems[problemType];
    if (problem) {
        solutionDiv.textContent = problem.solution;
        updateProblemSteps(problem.steps);
    }
}

function solveProblem() {
    const problemType = document.getElementById('problemType').value;
    loadProblem();
    showSuccess('Problem solved successfully!');
}

function updateProblemSteps(steps) {
    const stepsContainer = document.getElementById('problemSteps');
    if (!stepsContainer) return;
    
    stepsContainer.innerHTML = '';
    
    steps.forEach((step, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'bg-white/20 rounded-lg p-3';
        stepDiv.innerHTML = `
            <p class="text-sm">${step}</p>
        `;
        stepsContainer.appendChild(stepDiv);
    });
}

// Export functions for global access
window.calculateOperation = calculateOperation;
window.calculateMultiplication = calculateMultiplication;
window.calculateDivision = calculateDivision;
window.calculateComposition = calculateComposition;
window.setAddSub = setAddSub;
window.setAddSubOp = setAddSubOp;
window.setMult = setMult;
window.setDiv = setDiv;
window.setComp = setComp;
window.setCompType = setCompType;
window.loadProblem = loadProblem;
window.solveProblem = solveProblem;
window.evaluateFunctionAtPoint = evaluateFunctionAtPoint;
window.calculateDomain = calculateDomain;
window.generatePracticeProblem = generatePracticeProblem;
window.showPracticeAnswer = showPracticeAnswer;
window.drawFunctionGraph = drawFunctionGraph;
window.navigateLesson = navigateLesson;
window.showLesson = showLesson;
window.completeLesson = completeLesson;
