// Domain and Range of Rational Functions - Interactive JavaScript

// ------------------------------
// Lesson Navigation & Completion
// ------------------------------
let drrfCurrentLesson = 1;
let drrfCompletedLessons = new Set();
const drrfTotalLessons = 4;

document.addEventListener('DOMContentLoaded', function() {
    const lessonNavBtns = document.querySelectorAll('.lesson-nav-btn');
    const lessonSections = document.querySelectorAll('.lesson-section');

    // Inject completion + navigation controls
    drrfInjectLessonControls();

    lessonNavBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const lessonNum = this.dataset.lesson;

            // Update navigation buttons visuals
            lessonNavBtns.forEach(b => {
                b.classList.remove('border-primary', 'bg-primary');
                b.classList.add('border-transparent');
                const icon = b.querySelector('.w-16');
                if (icon) {
                    icon.classList.remove('bg-primary', 'text-white');
                    icon.classList.add('bg-gray-300', 'text-gray-600');
                }
            });

            this.classList.add('border-primary', 'bg-primary');
            this.classList.remove('border-transparent');
            const icon = this.querySelector('.w-16');
            if (icon) {
                icon.classList.add('bg-primary', 'text-white');
                icon.classList.remove('bg-gray-300', 'text-gray-600');
            }

            // Show selected lesson
            lessonSections.forEach(section => section.classList.remove('active'));
            document.getElementById(`lesson${lessonNum}`).classList.add('active');

            // Update state and indicators
            drrfCurrentLesson = parseInt(lessonNum, 10);
            drrfUpdateNavigationButtons();
            drrfUpdateProgressIndicators();
            drrfUpdateLessonCompletionStatus();

            // Smooth scroll to top of lesson content
            const lessonContent = document.querySelector('.lesson-content');
            if (lessonContent) lessonContent.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Add animation
            const activeSection = document.getElementById(`lesson${lessonNum}`);
            activeSection.classList.add('fade-in');
        });
    });

    // Initialize first lesson as active
    if (lessonNavBtns[0]) lessonNavBtns[0].click();

    // Load completion state from server
    drrfLoadCompletedLessons();
    drrfUpdateCompletionButtonsUI();

    // Initialize authentication guard and user progress
    initializeAuthGuard();
    loadUserProgress();

    // Initialize interactive tools
    try { initializeCalculators(); } catch (_) {}
});

function drrfInjectLessonControls() {
    const sections = document.querySelectorAll('.lesson-section');
    sections.forEach((section, index) => {
        const lessonNum = index + 1;
        if (section.querySelector('[data-drrf-controls]')) return;

        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-drrf-controls', 'true');
        wrapper.innerHTML = `
            <div class="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 mb-8">
                <h3 class="text-xl font-semibold text-gray-800 mb-4 text-center">
                    <i class="fas fa-check-circle text-emerald-500 mr-2"></i>Complete This Lesson
                </h3>
                <p class="text-gray-600 text-center mb-6">Mark this lesson as completed to track your progress and unlock the next lesson.</p>
                <div class="text-center">
                    <button onclick="drrfCompleteLesson(${lessonNum})" class="bg-emerald-500 text-white px-8 py-3 rounded-lg hover:bg-emerald-600 transition-colors font-semibold" data-drrf-complete-btn="${lessonNum}">
                        <i class="fas fa-check mr-2"></i>Mark as Complete
                    </button>
                </div>
            </div>

            <div class="flex justify-between items-center mb-8">
                <button onclick="drrfNavigateLesson(-1)" class="flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" data-drrf-prev>
                    <i class="fas fa-chevron-left mr-2"></i>Previous Lesson
                </button>
                <div class="flex items-center space-x-4">
                    <div class="text-center">
                        <div class="text-lg font-semibold text-primary"><span id="drrfCurrentLessonNum">${drrfCurrentLesson}</span> of ${drrfTotalLessons}</div>
                    </div>
                    <div class="w-32 bg-gray-200 rounded-full h-2">
                        <div id="drrfLessonProgressBar" class="bg-primary h-2 rounded-full transition-all duration-300" style="width: ${(drrfCurrentLesson / drrfTotalLessons) * 100}%"></div>
                    </div>
                </div>
                <button onclick="drrfNavigateLesson(1)" class="flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" data-drrf-next>
                    Next Lesson<i class="fas fa-chevron-right ml-2"></i>
                </button>
            </div>
        `;

        section.appendChild(wrapper);
    });

    drrfUpdateNavigationButtons();
}

function drrfNavigateLesson(direction) {
    const newLesson = drrfCurrentLesson + direction;
    if (newLesson >= 1 && newLesson <= drrfTotalLessons) {
        drrfShowLesson(newLesson, true);
    }
}

function drrfShowLesson(lessonNum, scrollToTop = false) {
    const lessonSections = document.querySelectorAll('.lesson-section');
    drrfCurrentLesson = lessonNum;
    lessonSections.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`lesson${lessonNum}`);
    if (target) target.classList.add('active');
    drrfUpdateNavigationButtons();
    drrfUpdateProgressIndicators();
    drrfUpdateLessonCompletionStatus();
    if (scrollToTop) {
        const lessonContent = document.querySelector('.lesson-content');
        if (lessonContent) lessonContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        console.log('Attempting to complete lesson:', lessonNum);
        
        if (drrfCompletedLessons.has(lessonNum)) { 
            drrfSetCompleteButtonState(lessonNum, { completed: true }); 
            return; 
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
            return;
        }
        
        if (data && data.success) {
            await drrfLoadCompletedLessons();
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
            drrfUpdateLessonCompletionStatus();
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
        // Display the function
        document.getElementById('rangeFunctionDisplay').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Selected Function:</h4>
            <div class="text-lg font-mono text-primary">f(x) = ${functionInput}</div>
        `;
        
        // Analyze horizontal asymptote
        const horizontalAsymptote = drrfAnalyzeHorizontalAsymptote(functionInput);
        document.getElementById('horizontalAsymptote').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Horizontal Asymptote:</h4>
            <div class="text-gray-700">${horizontalAsymptote}</div>
        `;
        
        // Analyze range
        const rangeAnalysis = drrfAnalyzeRangeRestrictions(functionInput);
        document.getElementById('rangeNotation').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Range in Interval Notation:</h4>
            <div class="text-gray-700 font-mono">${rangeAnalysis.intervalNotation}</div>
        `;
        
        // Display step-by-step explanation
        document.getElementById('rangeExplanation').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Step-by-Step Explanation:</h4>
            <div class="text-gray-700">${rangeAnalysis.explanation}</div>
        `;
        
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
        // Display the function
        document.getElementById('functionDisplay').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Selected Function:</h4>
            <div class="text-lg font-mono text-primary">f(x) = ${functionInput}</div>
        `;
        
        // Calculate domain
        const domainAnalysis = drrfAnalyzeDomainRestrictions(functionInput);
        document.getElementById('domainResult').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Domain:</h4>
            <div class="text-gray-700 font-mono">${domainAnalysis.intervalNotation}</div>
            <div class="text-sm text-gray-600 mt-1">${domainAnalysis.restrictions}</div>
        `;
        
        // Calculate range
        const rangeAnalysis = drrfAnalyzeRangeRestrictions(functionInput);
        const horizontalAsymptote = drrfAnalyzeHorizontalAsymptote(functionInput);
        document.getElementById('rangeResult').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Range:</h4>
            <div class="text-gray-700 font-mono">${rangeAnalysis.intervalNotation}</div>
            <div class="text-sm text-gray-600 mt-1">${horizontalAsymptote}</div>
        `;
        
        // Show complete step-by-step solution
        const stepByStepSolution = drrfGenerateCompleteStepByStepSolution(functionInput);
        document.getElementById('stepByStepSolution').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Complete Step-by-Step Solution:</h4>
            <div class="text-gray-700">${stepByStepSolution}</div>
        `;
        
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
        // Display the function
        document.getElementById('domainFunctionDisplay').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Selected Function:</h4>
            <div class="text-lg font-mono text-primary">f(x) = ${functionInput}</div>
        `;
        
        // Analyze domain restrictions
        const domainAnalysis = drrfAnalyzeDomainRestrictions(functionInput);
        document.getElementById('domainRestrictions').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Domain Restrictions:</h4>
            <div class="text-gray-700">${domainAnalysis.restrictions}</div>
        `;
        
        // Display domain in interval notation
        document.getElementById('domainNotation').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Domain in Interval Notation:</h4>
            <div class="text-gray-700 font-mono">${domainAnalysis.intervalNotation}</div>
        `;
        
        // Display step-by-step explanation
        document.getElementById('domainExplanation').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Step-by-Step Explanation:</h4>
            <div class="text-gray-700">${domainAnalysis.explanation}</div>
        `;
        
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
