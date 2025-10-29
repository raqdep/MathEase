// Domain and Range of Inverse Functions - Interactive JavaScript

// ------------------------------
// Lesson Navigation & Completion
// ------------------------------
let drifCurrentLesson = 1;
let drifCompletedLessons = new Set();
const drifTotalLessons = 4;

document.addEventListener('DOMContentLoaded', function() {
    const lessonNavBtns = document.querySelectorAll('.lesson-nav-btn');
    const lessonSections = document.querySelectorAll('.lesson-section');

    // Inject completion + navigation controls if missing
    drifInjectLessonControls();

    // Wire lesson buttons
    lessonNavBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const lessonNum = parseInt(this.dataset.lesson);
            drifShowLesson(lessonNum, true);
        });
    });

    // Initialize first lesson as active
    drifShowLesson(1);

    // Load completion from backend
    drifLoadCompletedLessons().then(() => {
        drifUpdateCompletionButtonsUI();
    });
});

function drifInjectLessonControls() {
    const sections = document.querySelectorAll('.lesson-section');
    sections.forEach((section, index) => {
        // Skip if already has our completion button
        if (section.querySelector('[data-drif-controls]')) return;

        const lessonNum = index + 1;
        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-drif-controls', 'true');
        wrapper.innerHTML = `
            <div class="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 mb-8">
                <h3 class="text-xl font-semibold text-gray-800 mb-4 text-center">
                    <i class="fas fa-check-circle text-emerald-500 mr-2"></i>Complete This Lesson
                </h3>
                <p class="text-gray-600 text-center mb-6">
                    Mark this lesson as completed to track your progress and unlock the next lesson.
                </p>
                <div class="text-center">
                    <button onclick="drifCompleteLesson(${lessonNum})"
                            class="bg-emerald-500 text-white px-8 py-3 rounded-lg hover:bg-emerald-600 transition-colors font-semibold inline-flex items-center">
                        <i class="fas fa-check mr-2"></i>
                        Mark Lesson ${lessonNum} Complete
                    </button>
                </div>
            </div>

            <div class="flex justify-center items-center mb-8">
                <button id="prevLessonBtn" onclick="drifNavigateLesson(-1)" 
                        class="flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="fas fa-chevron-left mr-2"></i>
                    Previous Lesson
                </button>
                
                <div class="flex items-center space-x-4 mx-8">
                    <div class="text-center">
                        <div class="text-sm text-gray-600">Lesson Progress</div>
                        <div class="text-lg font-semibold text-primary">
                            <span id="currentLessonNum">${lessonNum}</span> of ${drifTotalLessons}
                        </div>
                    </div>
                    <div class="w-32 bg-gray-200 rounded-full h-2">
                        <div id="drifLessonProgressBar" class="bg-primary h-2 rounded-full transition-all duration-300" style="width: ${(lessonNum / drifTotalLessons) * 100}%"></div>
                    </div>
                </div>
                
                <button id="nextLessonBtn" onclick="drifNavigateLesson(1)" 
                        class="flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Next Lesson
                    <i class="fas fa-chevron-right ml-2"></i>
                </button>
            </div>
        `;

        // Append controls at the end of the section content
        section.appendChild(wrapper);
    });
}

function drifShowLesson(lessonNum, scrollToTop = false) {
    const lessonNavBtns = document.querySelectorAll('.lesson-nav-btn');
    const lessonSections = document.querySelectorAll('.lesson-section');
    drifCurrentLesson = lessonNum;

    // Update nav buttons visual state
    lessonNavBtns.forEach(b => {
        b.classList.remove('border-primary', 'bg-primary');
        b.classList.add('border-transparent');
        const icon = b.querySelector('.w-16');
        if (icon) {
            icon.classList.remove('bg-primary', 'text-white');
            icon.classList.add('bg-gray-300', 'text-gray-600');
        }
        // Mark completed visuals
        const n = parseInt(b.dataset.lesson);
        b.classList.toggle('completed', drifCompletedLessons.has(n));
    });

    const currentBtn = document.querySelector(`[data-lesson="${lessonNum}"]`);
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
    const active = document.getElementById(`lesson${lessonNum}`);
    if (active) {
        active.classList.add('active');
        active.classList.add('fade-in');
    }

    drifUpdateProgressIndicators();
    drifUpdatePrevNextButtons();
    drifUpdateCompletionButtonsUI();

    if (scrollToTop && active) {
        active.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function drifNavigateLesson(direction) {
    const newLesson = drifCurrentLesson + direction;
    if (newLesson >= 1 && newLesson <= drifTotalLessons) {
        drifShowLesson(newLesson, true);
    }
}

function drifUpdateProgressIndicators() {
    const numEls = document.querySelectorAll('#currentLessonNum');
    const barEls = document.querySelectorAll('#drifLessonProgressBar');
    numEls.forEach(el => { el.textContent = drifCurrentLesson; });
    barEls.forEach(el => { el.style.width = `${(drifCurrentLesson / drifTotalLessons) * 100}%`; });
}

function drifUpdatePrevNextButtons() {
    const prevBtns = document.querySelectorAll('#prevLessonBtn');
    const nextBtns = document.querySelectorAll('#nextLessonBtn');
    prevBtns.forEach(b => { if (b) b.disabled = drifCurrentLesson === 1; });
    nextBtns.forEach(b => { if (b) b.disabled = drifCurrentLesson === drifTotalLessons; });
}

// Completion UI
function drifGetCompleteButtonForLesson(lessonNum) {
    const section = document.getElementById(`lesson${lessonNum}`);
    if (!section) return null;
    return section.querySelector(`button[onclick="drifCompleteLesson(${lessonNum})"]`) || section.querySelector(`button[onclick="completeLesson(${lessonNum})"]`);
}

function drifSetCompleteButtonState(lessonNum, { completed = false, loading = false } = {}) {
    const btn = drifGetCompleteButtonForLesson(lessonNum);
    if (!btn) return;
    if (loading) {
        btn.disabled = true;
        btn.textContent = 'Saving...';
        return;
    }
    if (completed || drifCompletedLessons.has(lessonNum)) {
        btn.disabled = true;
        btn.textContent = `Lesson ${lessonNum} Completed`;
        btn.classList.remove('bg-emerald-500', 'hover:bg-emerald-600');
        btn.classList.add('bg-green-600');
    } else {
        btn.disabled = false;
        btn.textContent = `Mark Lesson ${lessonNum} Complete`;
        btn.classList.remove('bg-green-600');
        btn.classList.add('bg-emerald-500');
    }
}

function drifUpdateCompletionButtonsUI() {
    [1,2,3,4].forEach(n => {
        drifSetCompleteButtonState(n, { completed: drifCompletedLessons.has(n) });
        // Also tag nav buttons
        const b = document.querySelector(`.lesson-nav-btn[data-lesson="${n}"]`);
        if (b) b.classList.toggle('completed', drifCompletedLessons.has(n));
    });
}

// Backend sync
async function drifLoadCompletedLessons() {
    try {
        const res = await fetch('../php/complete-lesson.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: 'domain-range-inverse-functions', action: 'get_completed' }),
            credentials: 'include'
        });
        if (!res.ok) return;
        const text = await res.text();
        let data; try { data = JSON.parse(text); } catch (_) { return; }
        if (data && data.success && Array.isArray(data.completed_lessons)) {
            drifCompletedLessons = new Set(data.completed_lessons);
        }
    } catch (_) { /* ignore */ }
}

async function drifSaveCompletionToBackend(lessonNum) {
    try {
        const res = await fetch('../php/complete-lesson.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: 'domain-range-inverse-functions', lesson: lessonNum, action: 'complete' }),
            credentials: 'include'
        });
        if (!res.ok) return false;
        const text = await res.text();
        let data; try { data = JSON.parse(text); } catch (_) { return false; }
        return !!(data && data.success);
    } catch (_) { return false; }
}

async function drifCompleteLesson(lessonNum) {
    if (drifCompletedLessons.has(lessonNum)) {
        drifUpdateCompletionButtonsUI();
        return;
    }
    drifSetCompleteButtonState(lessonNum, { loading: true });
    const ok = await drifSaveCompletionToBackend(lessonNum);
    if (!ok) {
        drifSetCompleteButtonState(lessonNum, { loading: false });
        if (typeof Swal !== 'undefined') {
            Swal.fire({ title: 'Error', text: 'Failed to save lesson completion. Please try again.', icon: 'error', confirmButtonColor: '#ef4444', background: '#ffffff' });
        } else {
            alert('Failed to save lesson completion. Please try again.');
        }
        return;
    }
    await drifLoadCompletedLessons();
    drifCompletedLessons.add(lessonNum);
    drifSetCompleteButtonState(lessonNum, { completed: true });
    if (typeof Swal !== 'undefined') {
        Swal.fire({ title: 'Lesson Completed!', text: `Great job completing Lesson ${lessonNum}!`, icon: 'success', confirmButtonColor: '#10b981', background: '#ffffff' });
    } else {
        alert('Lesson ' + lessonNum + ' completed!');
    }
}

// Initialize all calculators and interactive tools
function initializeCalculators() {
    // Initialize Inverse Function Analyzer
    initializeInverseFunctionAnalyzer();
    
    // Initialize Domain Finder
    initializeDomainFinder();
    
    // Initialize Range Finder
    initializeRangeFinder();
    
    // Initialize Application Problem Solver
    initializeApplicationProblemSolver();
}

// Inverse Function Analyzer
function initializeInverseFunctionAnalyzer() {
    const inverseFunctionInput = document.getElementById('inverseFunctionInput');
    
    if (inverseFunctionInput) {
        // Add real-time updates with debouncing
        let timeout;
        inverseFunctionInput.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                analyzeInverseFunction();
            }, 500);
        });
    }
}

// Analyze Inverse Function
function analyzeInverseFunction() {
    const functionInput = document.getElementById('inverseFunctionInput').value.trim();
    const domainRestriction = document.getElementById('domainRestrictionInput').value.trim();
    
    if (!functionInput) {
        resetInverseFunctionResults();
        return;
    }
    
    try {
        // Display the original function
        document.getElementById('originalFunctionDisplay').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Original Function:</h4>
            <div class="text-lg font-mono text-primary">f(x) = ${functionInput}${domainRestriction ? `, ${domainRestriction}` : ''}</div>
        `;
        
        // Find the inverse function
        const inverseFunction = findInverseFunction(functionInput);
        document.getElementById('inverseFunctionDisplay').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Inverse Function:</h4>
            <div class="text-lg font-mono text-purple-600">f⁻¹(x) = ${inverseFunction.expression}</div>
        `;
        
        // Analyze domain-range relationship
        const domainRangeAnalysis = analyzeDomainRangeRelationship(functionInput, domainRestriction);
        document.getElementById('domainRangeAnalysis').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Domain-Range Analysis:</h4>
            <div class="text-gray-700">${domainRangeAnalysis}</div>
        `;
        
    } catch (error) {
        console.error('Error analyzing inverse function:', error);
        showError('Invalid function format. Please check your input.');
    }
}

// Find Inverse Function
function findInverseFunction(functionInput) {
    // Simple inverse function finding for common cases
    if (functionInput.includes('2x+3')) {
        return {
            expression: '(x-3)/2',
            domain: 'All real numbers',
            range: 'All real numbers'
        };
    } else if (functionInput.includes('x²') || functionInput.includes('x^2')) {
        return {
            expression: '√x',
            domain: 'x ≥ 0',
            range: 'y ≥ 0'
        };
    } else if (functionInput.includes('3x-1')) {
        return {
            expression: '(x+1)/3',
            domain: 'All real numbers',
            range: 'All real numbers'
        };
    } else if (functionInput.includes('1/x')) {
        return {
            expression: '1/x',
            domain: 'x ≠ 0',
            range: 'y ≠ 0'
        };
    } else if (functionInput.includes('x+5')) {
        return {
            expression: 'x-5',
            domain: 'All real numbers',
            range: 'All real numbers'
        };
    } else {
        return {
            expression: 'Depends on specific function',
            domain: 'To be determined',
            range: 'To be determined'
        };
    }
}

// Analyze Domain-Range Relationship
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

// Reset Inverse Function Results
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

// Domain Finder
function initializeDomainFinder() {
    const domainOriginalFunction = document.getElementById('domainOriginalFunction');
    
    if (domainOriginalFunction) {
        // Add real-time updates with debouncing
        let timeout;
        domainOriginalFunction.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                findInverseDomain();
            }, 500);
        });
    }
}

// Find Inverse Domain
function findInverseDomain() {
    const functionInput = document.getElementById('domainOriginalFunction').value.trim();
    const originalDomain = document.getElementById('originalDomain').value.trim();
    
    if (!functionInput) {
        resetDomainFinderResults();
        return;
    }
    
    try {
        // Display original function info
        document.getElementById('originalFunctionInfo').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Original Function:</h4>
            <div class="text-lg font-mono text-primary">f(x) = ${functionInput}</div>
            <div class="text-sm text-gray-600 mt-1">Domain: ${originalDomain || 'All real numbers'}</div>
        `;
        
        // Find range of original function
        const rangeOfOriginal = findRangeOfOriginalFunction(functionInput, originalDomain);
        document.getElementById('rangeOfOriginal').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Range of Original Function:</h4>
            <div class="text-gray-700 font-mono">${rangeOfOriginal}</div>
        `;
        
        // Domain of inverse = Range of original
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

// Find Range of Original Function
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

// Reset Domain Finder Results
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

// Range Finder
function initializeRangeFinder() {
    const rangeOriginalFunction = document.getElementById('rangeOriginalFunction');
    
    if (rangeOriginalFunction) {
        // Add real-time updates with debouncing
        let timeout;
        rangeOriginalFunction.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                findInverseRange();
            }, 500);
        });
    }
}

// Find Inverse Range
function findInverseRange() {
    const functionInput = document.getElementById('rangeOriginalFunction').value.trim();
    const originalDomain = document.getElementById('rangeOriginalDomain').value.trim();
    
    if (!functionInput) {
        resetRangeFinderResults();
        return;
    }
    
    try {
        // Display original function info
        document.getElementById('rangeOriginalFunctionInfo').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Original Function:</h4>
            <div class="text-lg font-mono text-primary">f(x) = ${functionInput}</div>
            <div class="text-sm text-gray-600 mt-1">Domain: ${originalDomain || 'All real numbers'}</div>
        `;
        
        // Display domain of original function
        document.getElementById('domainOfOriginal').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Domain of Original Function:</h4>
            <div class="text-gray-700 font-mono">${originalDomain || 'All real numbers'}</div>
        `;
        
        // Range of inverse = Domain of original
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

// Reset Range Finder Results
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

// Application Problem Solver
function initializeApplicationProblemSolver() {
    const inverseApplicationTypeSelect = document.getElementById('inverseApplicationType');
    
    if (inverseApplicationTypeSelect) {
        inverseApplicationTypeSelect.addEventListener('change', function() {
            updateInverseApplicationInputs(this.value);
        });
    }
}

// Update Inverse Application Inputs
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

// Solve Inverse Application Problem
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

// Solve Temperature Problem
function solveTemperatureProblem() {
    const tempValue = parseFloat(document.getElementById('tempValue').value);
    const conversionType = document.getElementById('tempConversion').value;
    
    if (!tempValue) {
        throw new Error('Please enter a temperature value.');
    }
    
    let convertedTemp, originalFunction, inverseFunction;
    
    if (conversionType === 'c-to-f') {
        convertedTemp = (9/5) * tempValue + 32;
        originalFunction = 'F = (9/5)C + 32';
        inverseFunction = 'C = (5/9)(F - 32)';
    } else {
        convertedTemp = (5/9) * (tempValue - 32);
        originalFunction = 'C = (5/9)(F - 32)';
        inverseFunction = 'F = (9/5)C + 32';
    }
    
    return {
        domainAnalysis: `
            <strong>Domain Analysis:</strong><br>
            <em>Original Function:</em> ${originalFunction}<br>
            <em>Domain:</em> All real numbers<br>
            <em>Inverse Function:</em> ${inverseFunction}<br>
            <em>Domain of Inverse:</em> All real numbers (same as range of original)
        `,
        rangeAnalysis: `
            <strong>Range Analysis:</strong><br>
            <em>Original Function Range:</em> All real numbers<br>
            <em>Inverse Function Range:</em> All real numbers (same as domain of original)<br>
            <em>Result:</em> ${tempValue}°${conversionType === 'c-to-f' ? 'C' : 'F'} = ${convertedTemp.toFixed(2)}°${conversionType === 'c-to-f' ? 'F' : 'C'}
        `,
        practicalImplications: `
            <strong>Practical Implications:</strong><br>
            • Temperature conversion functions are inverses of each other<br>
            • Both functions have domain and range of all real numbers<br>
            • The relationship is linear and one-to-one<br>
            • This model is valid for all temperature ranges
        `
    };
}

// Solve Kinetic Problem
function solveKineticProblem() {
    const kineticEnergy = parseFloat(document.getElementById('kineticEnergy').value);
    const mass = parseFloat(document.getElementById('mass').value);
    
    if (!kineticEnergy || !mass) {
        throw new Error('Please enter both kinetic energy and mass values.');
    }
    
    const velocity = Math.sqrt(2 * kineticEnergy / mass);
    
    return {
        domainAnalysis: `
            <strong>Domain Analysis:</strong><br>
            <em>Original Function:</em> KE = (1/2)mv²<br>
            <em>Domain:</em> v ≥ 0 (non-negative velocities)<br>
            <em>Inverse Function:</em> v = √(2KE/m)<br>
            <em>Domain of Inverse:</em> KE ≥ 0 (non-negative kinetic energy)
        `,
        rangeAnalysis: `
            <strong>Range Analysis:</strong><br>
            <em>Original Function Range:</em> KE ≥ 0<br>
            <em>Inverse Function Range:</em> v ≥ 0<br>
            <em>Result:</em> For KE = ${kineticEnergy} J and m = ${mass} kg, v = ${velocity.toFixed(2)} m/s
        `,
        practicalImplications: `
            <strong>Practical Implications:</strong><br>
            • Velocity and kinetic energy have a quadratic relationship<br>
            • Both domain and range are restricted to non-negative values<br>
            • The inverse function gives velocity from kinetic energy<br>
            • This model applies to classical mechanics
        `
    };
}

// Solve Supply Problem
function solveSupplyProblem() {
    const price = parseFloat(document.getElementById('price').value);
    const supplySlope = parseFloat(document.getElementById('supplySlope').value);
    
    if (!price || !supplySlope) {
        throw new Error('Please enter both price and supply slope values.');
    }
    
    const quantity = price / supplySlope;
    
    return {
        domainAnalysis: `
            <strong>Domain Analysis:</strong><br>
            <em>Supply Function:</em> P = ${supplySlope}Q<br>
            <em>Domain:</em> Q ≥ 0 (non-negative quantities)<br>
            <em>Inverse Function:</em> Q = P/${supplySlope}<br>
            <em>Domain of Inverse:</em> P ≥ 0 (non-negative prices)
        `,
        rangeAnalysis: `
            <strong>Range Analysis:</strong><br>
            <em>Supply Function Range:</em> P ≥ 0<br>
            <em>Inverse Function Range:</em> Q ≥ 0<br>
            <em>Result:</em> At price P = ${price}, quantity supplied Q = ${quantity.toFixed(2)}
        `,
        practicalImplications: `
            <strong>Practical Implications:</strong><br>
            • Price and quantity have a linear relationship<br>
            • Both domain and range are restricted to non-negative values<br>
            • The inverse function gives quantity from price<br>
            • This model represents basic supply economics
        `
    };
}

// Solve Interest Problem
function solveInterestProblem() {
    const principal = parseFloat(document.getElementById('principal').value);
    const finalAmount = parseFloat(document.getElementById('finalAmount').value);
    const timePeriod = parseFloat(document.getElementById('timePeriod').value);
    
    if (!principal || !finalAmount || !timePeriod) {
        throw new Error('Please enter all values: principal, final amount, and time period.');
    }
    
    const interestRate = Math.pow(finalAmount / principal, 1 / timePeriod) - 1;
    
    return {
        domainAnalysis: `
            <strong>Domain Analysis:</strong><br>
            <em>Compound Interest:</em> A = P(1 + r)ᵗ<br>
            <em>Domain:</em> r ≥ -1, t > 0<br>
            <em>Inverse Function:</em> r = (A/P)^(1/t) - 1<br>
            <em>Domain of Inverse:</em> A > 0, P > 0, t > 0
        `,
        rangeAnalysis: `
            <strong>Range Analysis:</strong><br>
            <em>Compound Interest Range:</em> A > 0<br>
            <em>Inverse Function Range:</em> r > -1<br>
            <em>Result:</em> Interest rate r = ${(interestRate * 100).toFixed(2)}%
        `,
        practicalImplications: `
            <strong>Practical Implications:</strong><br>
            • Interest rate must be greater than -100% to avoid negative amounts<br>
            • Time period must be positive<br>
            • The inverse function gives interest rate from final amount<br>
            • This model applies to compound interest calculations
        `
    };
}

// Solve Signal Problem
function solveSignalProblem() {
    const frequency = parseFloat(document.getElementById('frequency').value);
    const speedOfLight = parseFloat(document.getElementById('speedOfLight').value);
    
    if (!frequency || !speedOfLight) {
        throw new Error('Please enter both frequency and speed of light values.');
    }
    
    const wavelength = speedOfLight / frequency;
    
    return {
        domainAnalysis: `
            <strong>Domain Analysis:</strong><br>
            <em>Frequency-Wavelength:</em> f = c/λ<br>
            <em>Domain:</em> λ > 0 (positive wavelengths)<br>
            <em>Inverse Function:</em> λ = c/f<br>
            <em>Domain of Inverse:</em> f > 0 (positive frequencies)
        `,
        rangeAnalysis: `
            <strong>Range Analysis:</strong><br>
            <em>Frequency Function Range:</em> f > 0<br>
            <em>Inverse Function Range:</em> λ > 0<br>
            <em>Result:</em> For f = ${frequency} Hz, λ = ${wavelength.toFixed(2)} m
        `,
        practicalImplications: `
            <strong>Practical Implications:</strong><br>
            • Frequency and wavelength are inversely proportional<br>
            • Both domain and range are restricted to positive values<br>
            • The inverse function gives wavelength from frequency<br>
            • This model applies to electromagnetic wave propagation
        `
    };
}

// Solve Vehicle Problem
function solveVehicleProblem() {
    const fuelConsumption = parseFloat(document.getElementById('fuelConsumption').value);
    const coeffA = parseFloat(document.getElementById('coeffA').value);
    const coeffB = parseFloat(document.getElementById('coeffB').value);
    
    if (!fuelConsumption || !coeffA || !coeffB) {
        throw new Error('Please enter all coefficient values.');
    }
    
    // This is a simplified calculation for demonstration
    const optimalSpeed = Math.sqrt(coeffA / fuelConsumption);
    
    return {
        domainAnalysis: `
            <strong>Domain Analysis:</strong><br>
            <em>Fuel Consumption:</em> C = av/(v² + bv + c)<br>
            <em>Domain:</em> v > 0 (positive speeds)<br>
            <em>Inverse Function:</em> v = f⁻¹(C) (complex expression)<br>
            <em>Domain of Inverse:</em> C > 0 (positive fuel consumption)
        `,
        rangeAnalysis: `
            <strong>Range Analysis:</strong><br>
            <em>Fuel Consumption Range:</em> C > 0<br>
            <em>Inverse Function Range:</em> v > 0<br>
            <em>Result:</em> For given parameters, optimal speed ≈ ${optimalSpeed.toFixed(2)} km/h
        `,
        practicalImplications: `
            <strong>Practical Implications:</strong><br>
            • Vehicle speed and fuel consumption have a complex relationship<br>
            • Both domain and range are restricted to positive values<br>
            • The inverse function gives optimal speed for minimum consumption<br>
            • This model represents realistic vehicle performance curves
        `
    };
}

// Display Inverse Application Solution
function displayInverseApplicationSolution(solution) {
    document.getElementById('inverseDomainAnalysis').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Domain Analysis:</h4>
        <div class="text-gray-700">${solution.domainAnalysis}</div>
    `;
    
    document.getElementById('inverseRangeAnalysis').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Range Analysis:</h4>
        <div class="text-gray-700">${solution.rangeAnalysis}</div>
    `;
    
    document.getElementById('inversePracticalImplications').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Practical Implications:</h4>
        <div class="text-gray-700">${solution.practicalImplications}</div>
    `;
}

// Utility Functions
function showError(message) {
    // Simple error display - you can enhance this with a modal or toast
    alert('Error: ' + message);
}

function showSuccess(message) {
    // Simple success display - you can enhance this with a modal or toast
    alert('Success: ' + message);
}

// User Progress Management
function loadUserProgress() {
    // Load saved progress from localStorage
    const savedProgress = localStorage.getItem('domainRangeInverseFunctionsProgress');
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
    const progress = JSON.parse(localStorage.getItem('domainRangeInverseFunctionsProgress') || '{}');
    progress[lessonId] = {
        completed: completed,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('domainRangeInverseFunctionsProgress', JSON.stringify(progress));
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
    const progress = JSON.parse(localStorage.getItem('domainRangeInverseFunctionsProgress') || '{}');
    
    // Mark current lesson as in progress
    progress[`lesson${currentLesson}`] = {
        completed: false,
        inProgress: true,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('domainRangeInverseFunctionsProgress', JSON.stringify(progress));
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

// Initialize all calculators when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeCalculators();
    loadUserProgress();
});
