// One-to-One Functions - Interactive JavaScript

// Global variables
let currentLesson = 1;
let completedLessons = new Set();

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // Initialize lesson navigation first
    initializeLessonNavigation();
    
    // Initialize calculators and virtual aids
    initializeCalculators();
    
    // Load user progress
    loadUserProgress();
    
    // Initialize authentication guard
    initializeAuthGuard();
    
    // Initialize interactive elements
    initializeInteractiveElements();
    
    // Force show first lesson
    setTimeout(() => {
        forceNavigateToLesson(1);
    }, 100);
});

// Lesson Navigation System
function initializeLessonNavigation() {
    const lessonNavBtns = document.querySelectorAll('.lesson-nav-btn');
    const lessonSections = document.querySelectorAll('.lesson-section');
    
    lessonNavBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const lessonNum = parseInt(this.dataset.lesson);
            navigateToLesson(lessonNum);
        });
    });
    
    // Initialize first lesson as active
    navigateToLesson(1);
}

// Navigate to specific lesson
function navigateToLesson(lessonNum) {
    console.log('navigateToLesson called with:', lessonNum);
    forceNavigateToLesson(lessonNum);
}

// Navigate between lessons
function navigateLesson(direction) {
    const totalLessons = 4;
    const newLesson = currentLesson + direction;
    
    if (newLesson >= 1 && newLesson <= totalLessons) {
        navigateToLesson(newLesson);
        // Scroll to top of the selected lesson
        const targetSection = document.getElementById(`lesson${newLesson}`);
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

// Force lesson navigation (for debugging)
function forceNavigateToLesson(lessonNum) {
    console.log('Navigating to lesson:', lessonNum);
    
    // Hide all lesson sections
    const allSections = document.querySelectorAll('.lesson-section');
    allSections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Show target lesson
    const targetSection = document.getElementById(`lesson${lessonNum}`);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        console.log('Lesson section found and activated');
        
        // Add fade-in animation
        setTimeout(() => {
            targetSection.classList.add('fade-in');
        }, 50);
    } else {
        console.error('Lesson section not found:', `lesson${lessonNum}`);
    }
    
    // Update navigation buttons
    const navButtons = document.querySelectorAll('.lesson-nav-btn');
    navButtons.forEach(btn => {
        btn.classList.remove('border-primary', 'bg-primary');
        btn.classList.add('border-transparent');
        const icon = btn.querySelector('.w-16');
        if (icon) {
            icon.classList.remove('bg-primary', 'text-white');
            icon.classList.add('bg-gray-300', 'text-gray-600');
        }
    });
    
    // Activate current lesson button
    const currentBtn = document.querySelector(`[data-lesson="${lessonNum}"]`);
    if (currentBtn) {
        currentBtn.classList.add('border-primary', 'bg-primary');
        currentBtn.classList.remove('border-transparent');
        const icon = currentBtn.querySelector('.w-16');
        if (icon) {
            icon.classList.add('bg-primary', 'text-white');
            icon.classList.remove('bg-gray-300', 'text-gray-600');
        }
        console.log('Navigation button activated');
    }
    
    currentLesson = lessonNum;
    updateLessonProgress();
    
    // Re-initialize virtual aids after a short delay to ensure DOM is ready
    setTimeout(() => {
        initializeAllVirtualAids();
    }, 200);
}

// Complete a lesson
function completeLesson(lessonNum) {
    // Guard: skip if already completed
    if (completedLessons.has(lessonNum)) {
        updateCompletionButtonsUI();
        return;
    }

    setCompleteButtonState(lessonNum, { loading: true });

    // Save to backend and then refresh authoritative list
    saveLessonCompletionToBackend(lessonNum)
        .then((success) => {
            if (success) {
                // Refresh from backend to avoid duplicates and ensure persistence
                return reloadCompletedFromBackend();
            }
            throw new Error('Failed to complete lesson');
        })
        .then(() => {
            // Local optimistic update in case backend omitted
            completedLessons.add(lessonNum);
            updateCompletionButtonsUI();
            updateLessonProgress();
            showSuccess(`Lesson ${lessonNum} completed! Great job!`);
            const lessonElement = document.getElementById(`lesson${lessonNum}`);
            if (lessonElement) {
                lessonElement.classList.add('completed');
            }
        })
        .catch((err) => {
            console.error('Complete lesson error:', err);
            showError('Failed to save lesson completion. Please try again.');
        })
        .finally(() => {
            setCompleteButtonState(lessonNum, { loading: false, completed: completedLessons.has(lessonNum) });
        });
}

// Update lesson progress
function updateLessonProgress() {
    const progressBar = document.getElementById('lessonProgressBar');
    const currentLessonNum = document.getElementById('currentLessonNum');
    const prevBtn = document.getElementById('prevLessonBtn');
    const nextBtn = document.getElementById('nextLessonBtn');
    
    if (progressBar) {
        const progress = (currentLesson / 4) * 100;
        progressBar.style.width = `${progress}%`;
    }
    
    if (currentLessonNum) {
        currentLessonNum.textContent = currentLesson;
    }
    
    if (prevBtn) {
        prevBtn.disabled = currentLesson === 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentLesson === 4;
    }
}

// Initialize all calculators and interactive tools
function initializeCalculators() {
    // Initialize One-to-One Function Analyzer
    initializeOneToOneAnalyzer();
    
    // Initialize Function Testing Tool
    initializeFunctionTestingTool();
    
    // Initialize Inverse Function Calculator
    initializeInverseFunctionCalculator();
    
    // Initialize Application Problem Solver
    initializeApplicationProblemSolver();
    
    // Initialize all virtual aids
    initializeAllVirtualAids();
}

// Initialize all virtual aids
function initializeAllVirtualAids() {
    console.log('Initializing virtual aids...');
    
    // Remove existing listeners to prevent duplicates
    const functionInput = document.getElementById('functionInput');
    if (functionInput) {
        console.log('Function input found, adding listener');
        // Remove existing listeners
        functionInput.removeEventListener('input', analyzeOneToOne);
        functionInput.addEventListener('input', debounce(analyzeOneToOne, 500));
    } else {
        console.log('Function input not found');
    }
    
    // Initialize test function input listeners
    const testFunctionInput = document.getElementById('testFunctionInput');
    if (testFunctionInput) {
        console.log('Test function input found, adding listener');
        testFunctionInput.removeEventListener('input', testOneToOne);
        testFunctionInput.addEventListener('input', debounce(testOneToOne, 500));
    } else {
        console.log('Test function input not found');
    }
    
    // Initialize inverse function input listeners
    const inverseFunctionInput = document.getElementById('inverseFunctionInput');
    if (inverseFunctionInput) {
        console.log('Inverse function input found, adding listener');
        inverseFunctionInput.removeEventListener('input', findInverse);
        inverseFunctionInput.addEventListener('input', debounce(findInverse, 500));
    } else {
        console.log('Inverse function input not found');
    }
    
    // Initialize application type selector
    const applicationType = document.getElementById('applicationType');
    if (applicationType) {
        console.log('Application type selector found, adding listener');
        applicationType.removeEventListener('change', updateApplicationInputs);
        applicationType.addEventListener('change', function() {
            updateApplicationInputs(this.value);
        });
    } else {
        console.log('Application type selector not found');
    }
    
    // Initialize test method selector
    const testMethod = document.getElementById('testMethod');
    if (testMethod) {
        console.log('Test method selector found, adding listener');
        testMethod.removeEventListener('change', testOneToOne);
        testMethod.addEventListener('change', function() {
            testOneToOne();
        });
    } else {
        console.log('Test method selector not found');
    }
    
    // Initialize solve application problem button
    const solveBtn = document.querySelector('button[onclick="solveApplicationProblem()"]');
    if (solveBtn) {
        console.log('Solve application problem button found');
    } else {
        console.log('Solve application problem button not found');
    }
    
    // Initialize quick example buttons
    const quickExampleBtns = document.querySelectorAll('button[onclick*="analyzeOneToOne"]');
    quickExampleBtns.forEach(btn => {
        console.log('Quick example button found:', btn.textContent);
    });
    
    console.log('Virtual aids initialization complete');
}

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

// User Progress Management
function loadUserProgress() {
    // Load saved progress from localStorage
    const savedProgress = localStorage.getItem('oneToOneFunctionsProgress');
    if (savedProgress) {
        try {
            const progress = JSON.parse(savedProgress);
            completedLessons = new Set(progress.completedLessons || []);
            updateLessonProgress();
            updateCompletionButtonsUI();
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    }
}

function saveUserProgress() {
    const progress = {
        completedLessons: Array.from(completedLessons),
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('oneToOneFunctionsProgress', JSON.stringify(progress));
}

// Backend sync helpers
async function saveLessonCompletionToBackend(lessonNum) {
    try {
        const response = await fetch('../php/complete-lesson.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: 'one-to-one-functions', lesson: lessonNum, action: 'complete' }),
            credentials: 'include'
        });
        if (!response.ok) return false;
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { return false; }
        return !!(data && data.success);
    } catch (e) {
        return false;
    }
}

async function reloadCompletedFromBackend() {
    try {
        const response = await fetch('../php/complete-lesson.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: 'one-to-one-functions', action: 'get_completed' }),
            credentials: 'include'
        });
        if (!response.ok) return;
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { return; }
        if (data && data.success && Array.isArray(data.completed_lessons)) {
            completedLessons = new Set(data.completed_lessons);
            saveUserProgress();
        }
    } catch (e) {
        // ignore; fallback to local state
    }
}

// Button UI helpers
function getCompleteButtonForLesson(lessonNum) {
    const section = document.getElementById(`lesson${lessonNum}`);
    if (!section) return null;
    return section.querySelector(`button[onclick="completeLesson(${lessonNum})"]`);
}

function setCompleteButtonState(lessonNum, { completed = false, loading = false } = {}) {
    const btn = getCompleteButtonForLesson(lessonNum);
    if (!btn) return;
    if (loading) {
        btn.disabled = true;
        btn.textContent = 'Saving...';
        return;
    }
    if (completed || completedLessons.has(lessonNum)) {
        btn.disabled = true;
        btn.textContent = `Lesson ${lessonNum} Completed`;
        btn.classList.remove('bg-emerald-500', 'hover:bg-emerald-600');
        btn.classList.add('bg-green-600');
    } else {
        btn.disabled = false;
        // restore original label if possible
        btn.textContent = `Mark Lesson ${lessonNum} Complete`;
        btn.classList.remove('bg-green-600');
        btn.classList.add('bg-emerald-500');
    }
}

function updateCompletionButtonsUI() {
    [1,2,3,4].forEach((n) => setCompleteButtonState(n, { completed: completedLessons.has(n) }));
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

// Auto-save functionality
function autoSave() {
    const progress = {
        completedLessons: Array.from(completedLessons),
        currentLesson: currentLesson,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('oneToOneFunctionsProgress', JSON.stringify(progress));
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

// One-to-One Function Analyzer
function initializeOneToOneAnalyzer() {
    const functionInput = document.getElementById('functionInput');
    
    if (functionInput) {
        // Add real-time updates with debouncing
        let timeout;
        functionInput.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                analyzeOneToOne();
            }, 500);
        });
    }
}

// Analyze One-to-One Function
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
    document.getElementById('functionDisplay').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Function:</h4>
        <div class="function-display">f(x) = </div>
    `;
    document.getElementById('oneToOneResult').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">One-to-One Status:</h4>
        <div class="text-gray-700">Enter a function to analyze</div>
    `;
    document.getElementById('horizontalLineTest').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Horizontal Line Test:</h4>
        <div class="text-gray-700">Enter a function to analyze</div>
    `;
    document.getElementById('analysisSteps').style.display = 'none';
    document.getElementById('analysisSteps').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Analysis Steps:</h4>
        <div class="text-gray-700">Analysis steps will appear here</div>
    `;
}

// Function Testing Tool
function initializeFunctionTestingTool() {
    const testFunctionInput = document.getElementById('testFunctionInput');
    
    if (testFunctionInput) {
        // Add real-time updates with debouncing
        let timeout;
        testFunctionInput.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                testOneToOne();
            }, 500);
        });
    }
}

// Test One-to-One Function
function testOneToOne() {
    const functionInput = document.getElementById('testFunctionInput').value.trim();
    const testMethod = document.getElementById('testMethod').value;
    
    if (!functionInput) {
        resetTestResults();
        return;
    }
    
    try {
        // Display the function
        document.getElementById('testFunctionDisplay').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Function:</h4>
            <div class="text-lg font-mono text-primary">f(x) = ${functionInput}</div>
        `;
        
        // Perform test based on selected method
        const testResult = performTest(functionInput, testMethod);
        document.getElementById('testResult').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Test Result:</h4>
            <div class="text-gray-700">${testResult.result}</div>
        `;
        
        // Show test steps
        document.getElementById('testSteps').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Test Steps:</h4>
            <div class="text-gray-700">${testResult.steps}</div>
        `;
        
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
    document.getElementById('testFunctionDisplay').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Function:</h4>
        <div class="text-lg font-mono text-primary">f(x) = </div>
    `;
    document.getElementById('testResult').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Test Result:</h4>
        <div class="text-gray-700">Enter a function and select test method</div>
    `;
    document.getElementById('testSteps').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Test Steps:</h4>
        <div class="text-gray-700">Test steps will appear here</div>
    `;
}

// Inverse Function Calculator
function initializeInverseFunctionCalculator() {
    const inverseFunctionInput = document.getElementById('inverseFunctionInput');
    
    if (inverseFunctionInput) {
        // Add real-time updates with debouncing
        let timeout;
        inverseFunctionInput.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                findInverse();
            }, 500);
        });
    }
}

// Find Inverse Function
function findInverse() {
    const functionInput = document.getElementById('inverseFunctionInput').value.trim();
    
    if (!functionInput) {
        resetInverseResults();
        return;
    }
    
    try {
        // Display the original function
        document.getElementById('originalFunctionDisplay').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Original Function:</h4>
            <div class="text-lg font-mono text-primary">f(x) = ${functionInput}</div>
        `;
        
        // Find inverse function
        const inverseResult = findInverseFunction(functionInput);
        document.getElementById('inverseFunctionDisplay').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Inverse Function:</h4>
            <div class="text-lg font-mono text-green-600">f⁻¹(x) = ${inverseResult.inverse}</div>
        `;
        
        // Show solution steps
        document.getElementById('inverseSteps').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Solution Steps:</h4>
            <div class="text-gray-700">${inverseResult.steps}</div>
        `;
        
        // Show verification
        document.getElementById('verification').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Verification:</h4>
            <div class="text-gray-700">${inverseResult.verification}</div>
        `;
        
    } catch (error) {
        console.error('Error finding inverse function:', error);
        showError('Invalid function format. Please check your input.');
    }
}

// Find Inverse Function
function findInverseFunction(functionInput) {
    if (functionInput.includes('x +') || functionInput.includes('x-')) {
        // Linear function: f(x) = x + c or f(x) = x - c
        const parts = functionInput.split('x');
        let constant = 0;
        
        if (parts[1]) {
            if (parts[1].includes('+')) {
                constant = parseInt(parts[1].replace('+', '').trim()) || 0;
            } else if (parts[1].includes('-')) {
                constant = -parseInt(parts[1].replace('-', '').trim()) || 0;
            }
        }
        
        return {
            inverse: `x - ${constant}`,
            steps: `
                <ol class="list-decimal list-inside space-y-2">
                    <li>Replace f(x) with y: y = x + ${constant}</li>
                    <li>Interchange x and y: x = y + ${constant}</li>
                    <li>Solve for y: y = x - ${constant}</li>
                    <li>Replace y with f⁻¹(x): f⁻¹(x) = x - ${constant}</li>
                </ol>
            `,
            verification: `
                <div class="verification-display">
                    <div class="verification-step">
                        <div class="step-icon">1</div>
                        <div>f(f⁻¹(x)) = f(x - ${constant}) = (x - ${constant}) + ${constant} = x ✓</div>
                    </div>
                    <div class="verification-step">
                        <div class="step-icon">2</div>
                        <div>f⁻¹(f(x)) = f⁻¹(x + ${constant}) = (x + ${constant}) - ${constant} = x ✓</div>
                    </div>
                </div>
            `
        };
    } else if (functionInput.includes('2x') || functionInput.includes('3x')) {
        // Linear function: f(x) = mx
        const coefficient = parseInt(functionInput.replace('x', '').trim()) || 1;
        
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
    document.getElementById('originalFunctionDisplay').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Original Function:</h4>
        <div class="text-lg font-mono text-primary">f(x) = </div>
    `;
    document.getElementById('inverseFunctionDisplay').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Inverse Function:</h4>
        <div class="text-lg font-mono text-green-600">f⁻¹(x) = </div>
    `;
    document.getElementById('inverseSteps').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Solution Steps:</h4>
        <div class="text-gray-700">Enter a function to see the steps</div>
    `;
    document.getElementById('verification').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Verification:</h4>
        <div class="text-gray-700">Verification will appear here</div>
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
    const applicationType = document.getElementById('applicationType').value;
    
    if (!applicationType) {
        showError('Please select an application type first.');
        return;
    }
    
    try {
        let solution;
        
        switch (applicationType) {
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
    const message = document.getElementById('message').value.toUpperCase();
    const shiftValue = parseInt(document.getElementById('shiftValue').value);
    
    if (!message || !shiftValue) {
        throw new Error('Please enter both message and shift value.');
    }
    
    return {
        oneToOneAnalysis: `
            <strong>One-to-One Analysis:</strong><br>
            The Caesar cipher function f(x) = (x + ${shiftValue}) mod 26 is one-to-one because:<br>
            • Each letter maps to exactly one encrypted letter<br>
            • No two different letters produce the same encrypted result<br>
            • This ensures unique decryption for each encrypted message
        `,
        solutionSteps: `
            <strong>Solution Steps:</strong><br>
            1. Original message: ${message}<br>
            2. Apply encryption: f(x) = (x + ${shiftValue}) mod 26<br>
            3. Encrypted result: ${encryptMessage(message, shiftValue)}<br>
            4. One-to-one property ensures unique decryption
        `,
        practicalImplications: `
            <strong>Practical Implications:</strong><br>
            • Unique encryption ensures secure communication<br>
            • One-to-one property prevents decryption ambiguity<br>
            • Essential for maintaining data integrity in cryptography<br>
            • Enables reliable message transmission and reception
        `
    };
}

// Solve Temperature Problem
function solveTemperatureProblem() {
    const celsius = parseFloat(document.getElementById('celsius').value);
    
    if (!celsius) {
        throw new Error('Please enter a temperature in Celsius.');
    }
    
    const fahrenheit = (9/5) * celsius + 32;
    
    return {
        oneToOneAnalysis: `
            <strong>One-to-One Analysis:</strong><br>
            The temperature conversion function F = (9/5)C + 32 is one-to-one because:<br>
            • Each Celsius temperature corresponds to exactly one Fahrenheit temperature<br>
            • The function is linear with a positive slope<br>
            • This ensures unique conversion in both directions
        `,
        solutionSteps: `
            <strong>Solution Steps:</strong><br>
            1. Given: C = ${celsius}°C<br>
            2. Apply conversion: F = (9/5) × ${celsius} + 32<br>
            3. Calculate: F = ${fahrenheit}°F<br>
            4. Inverse function: C = (5/9)(F - 32)
        `,
        practicalImplications: `
            <strong>Practical Implications:</strong><br>
            • Unique temperature conversion prevents confusion<br>
            • One-to-one property enables reliable weather reporting<br>
            • Essential for scientific measurements and calculations<br>
            • Ensures consistency in temperature data across systems
        `
    };
}

// Solve Database Problem
function solveDatabaseProblem() {
    const studentId = document.getElementById('studentId').value;
    const studentName = document.getElementById('studentName').value;
    
    if (!studentId || !studentName) {
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
            1. Student ID: ${studentId}<br>
            2. Student Name: ${studentName}<br>
            3. Function: f(${studentId}) = "${studentName}"<br>
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
    const inputValue = parseInt(document.getElementById('inputValue').value);
    const algorithmType = document.getElementById('algorithmType').value;
    
    if (!inputValue) {
        throw new Error('Please enter an input value.');
    }
    
    return {
        oneToOneAnalysis: `
            <strong>One-to-One Analysis:</strong><br>
            ${algorithmType} functions must be one-to-one because:<br>
            • Each input produces a unique output<br>
            • Prevents conflicts in data processing<br>
            • Ensures deterministic algorithm behavior<br>
            • Maintains data integrity and consistency
        `,
        solutionSteps: `
            <strong>Solution Steps:</strong><br>
            1. Input value: ${inputValue}<br>
            2. Algorithm type: ${algorithmType}<br>
            3. Process: Apply ${algorithmType} function<br>
            4. Result: Unique output for input ${inputValue}
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
    document.getElementById('oneToOneAnalysis').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">One-to-One Analysis:</h4>
        <div class="text-gray-700">${solution.oneToOneAnalysis}</div>
    `;
    
    document.getElementById('solutionSteps').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Solution Steps:</h4>
        <div class="text-gray-700">${solution.solutionSteps}</div>
    `;
    
    document.getElementById('practicalImplications').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Practical Implications:</h4>
        <div class="text-gray-700">${solution.practicalImplications}</div>
    `;
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
    const savedProgress = localStorage.getItem('oneToOneFunctionsProgress');
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
    const progress = JSON.parse(localStorage.getItem('oneToOneFunctionsProgress') || '{}');
    progress[lessonId] = {
        completed: completed,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('oneToOneFunctionsProgress', JSON.stringify(progress));
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
    fetch('php/user.php', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            // Redirect to login if not authenticated
            window.location.href = 'index.html';
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
        window.location.href = 'index.html';
    });
}

// Auto-save functionality
function autoSave() {
    const currentLesson = localStorage.getItem('currentLesson') || '1';
    const progress = JSON.parse(localStorage.getItem('oneToOneFunctionsProgress') || '{}');
    
    // Mark current lesson as in progress
    progress[`lesson${currentLesson}`] = {
        completed: false,
        inProgress: true,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('oneToOneFunctionsProgress', JSON.stringify(progress));
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
