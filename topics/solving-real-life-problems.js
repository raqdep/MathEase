// Solving Real-Life Problems Involving Functions - Interactive JavaScript

// Global variables for problem solving
let currentProblem = 'taxi';
let currentScientificModel = 'population';
let currentComplexProblem = 'optimization';

// Lesson Navigation
document.addEventListener('DOMContentLoaded', function() {
    const lessonNavBtns = document.querySelectorAll('.lesson-nav-btn');
    const lessonSections = document.querySelectorAll('.lesson-section');
    
    lessonNavBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const lessonNum = this.dataset.lesson;
            
            // Update navigation buttons
            lessonNavBtns.forEach(b => {
                b.classList.remove('border-primary', 'bg-primary');
                b.classList.add('border-transparent');
                const icon = b.querySelector('.w-16');
                icon.classList.remove('bg-primary', 'text-white');
                icon.classList.add('bg-gray-300', 'text-gray-600');
            });
            
            this.classList.add('border-primary', 'bg-primary');
            this.classList.remove('border-transparent');
            const icon = this.querySelector('.w-16');
            icon.classList.add('bg-primary', 'text-white');
            icon.classList.remove('bg-gray-300', 'text-gray-600');
            
            // Show selected lesson
            lessonSections.forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(`lesson${lessonNum}`).classList.add('active');
        });
    });
    
    // Initialize first lesson as active
    lessonNavBtns[0].click();
    
    // Initialize all calculators
    initializeCalculators();
});

// Initialize all interactive calculators
function initializeCalculators() {
    // Initialize problem solver
    updateProblem();
    
    // Initialize business calculator
    calculateBusiness();
    
    // Initialize scientific calculator
    updateScientificModel();
    
    // Initialize complex problem solver
    updateComplexProblem();
}

// Real-Life Problem Solver Functions
function updateProblem() {
    const problemType = document.getElementById('problemType').value;
    currentProblem = problemType;
    
    const problemDetails = {
        'taxi': {
            title: 'Taxi Fare Calculation',
            function: 'f(x) = 40 + 15(x-1)',
            domain: 'x > 0 (distance in km)',
            description: 'Taxi charges ₱40 for first km, ₱15 for each additional km',
            explanation: 'This is a piecewise function where the first kilometer has a fixed rate, and additional kilometers have a different rate.'
        },
        'phone': {
            title: 'Phone Bill Calculation',
            function: 'f(x) = 500 + 2(x-100) for x > 100',
            domain: 'x ≥ 0 (minutes used)',
            description: 'Phone plan: ₱500 base + ₱2 per minute beyond 100 minutes',
            explanation: 'This includes 100 free minutes, then charges ₱2 per additional minute.'
        },
        'salary': {
            title: 'Salary with Overtime',
            function: 'f(x) = 400x + 600(x-40) for x > 40',
            domain: 'x ≥ 0 (hours worked)',
            description: '₱400/hour regular, ₱600/hour overtime after 40 hours',
            explanation: 'Regular pay for first 40 hours, then overtime rate for additional hours.'
        },
        'shipping': {
            title: 'Shipping Cost',
            function: 'f(x) = 50 + 0.5x',
            domain: 'x ≥ 0 (weight in kg)',
            description: '₱50 base fee + ₱0.50 per kilogram',
            explanation: 'Linear function with fixed base cost plus variable cost per kilogram.'
        }
    };
    
    const selected = problemDetails[problemType];
    
    // Update problem details display
    const detailsContainer = document.getElementById('problemDetails');
    if (detailsContainer) {
        detailsContainer.innerHTML = `
            <div class="bg-white/20 rounded-lg p-3">
                <p class="text-sm mb-2">Problem:</p>
                <p class="font-mono text-lg">${selected.title}</p>
            </div>
            <div class="bg-white/20 rounded-lg p-3">
                <p class="text-sm mb-2">Function:</p>
                <p class="font-mono text-lg">${selected.function}</p>
            </div>
            <div class="bg-white/20 rounded-lg p-3">
                <p class="text-sm mb-2">Domain:</p>
                <p class="font-mono text-lg">${selected.domain}</p>
            </div>
        `;
    }
    
    // Solve the problem with current input
    solveProblem();
}

function solveProblem() {
    const problemType = document.getElementById('problemType').value;
    const inputSelect = document.getElementById('inputValueSelect');
    const inputValue = inputSelect ? parseFloat(inputSelect.value) : 0;
    
    let result, explanation, stepByStep;
    
    switch(problemType) {
        case 'taxi':
            if (inputValue <= 1) {
                result = 40;
                explanation = `Taxi fare for ${inputValue} km (first km only)`;
                stepByStep = `First km: ₱40 (fixed rate)`;
            } else {
                result = 40 + 15 * (inputValue - 1);
                explanation = `Taxi fare for ${inputValue} km`;
                stepByStep = `First km: ₱40 + Additional ${inputValue - 1} km: ${inputValue - 1} × ₱15 = ₱${15 * (inputValue - 1)}`;
            }
            break;
        case 'phone':
            if (inputValue <= 100) {
                result = 500;
                explanation = `Phone bill for ${inputValue} minutes (within free allowance)`;
                stepByStep = `Base plan: ₱500 (includes 100 free minutes)`;
            } else {
                result = 500 + 2 * (inputValue - 100);
                explanation = `Phone bill for ${inputValue} minutes`;
                stepByStep = `Base plan: ₱500 + Additional ${inputValue - 100} minutes: ${inputValue - 100} × ₱2 = ₱${2 * (inputValue - 100)}`;
            }
            break;
        case 'salary':
            if (inputValue <= 40) {
                result = 400 * inputValue;
                explanation = `Salary for ${inputValue} hours (regular time)`;
                stepByStep = `Regular hours: ${inputValue} × ₱400 = ₱${400 * inputValue}`;
            } else {
                result = 400 * 40 + 600 * (inputValue - 40);
                explanation = `Salary for ${inputValue} hours (with overtime)`;
                stepByStep = `Regular: 40 × ₱400 = ₱16,000 + Overtime: ${inputValue - 40} × ₱600 = ₱${600 * (inputValue - 40)}`;
            }
            break;
        case 'shipping':
            result = 50 + 0.5 * inputValue;
            explanation = `Shipping cost for ${inputValue} kg`;
            stepByStep = `Base fee: ₱50 + Weight cost: ${inputValue} kg × ₱0.50 = ₱${0.5 * inputValue}`;
            break;
        default:
            result = 0;
            explanation = 'Please select a problem type';
            stepByStep = '';
    }
    
    // Update results
    document.getElementById('problemResult').textContent = `₱${result.toLocaleString()}`;
    document.getElementById('problemExplanation').textContent = explanation;
    
    // Add step-by-step explanation if element exists
    const stepElement = document.getElementById('problemStepByStep');
    if (stepElement) {
        stepElement.textContent = stepByStep;
    }
}

// Business Calculator Functions
function calculateBusiness() {
    const pricePerUnit = parseFloat(document.getElementById('pricePerUnit').value) || 0;
    const fixedCost = parseFloat(document.getElementById('fixedCost').value) || 0;
    const variableCost = parseFloat(document.getElementById('variableCost').value) || 0;
    const quantity = parseFloat(document.getElementById('quantity').value) || 0;
    
    // Calculate business metrics
    const revenue = pricePerUnit * quantity;
    const totalCost = fixedCost + (variableCost * quantity);
    const profit = revenue - totalCost;
    const breakEven = Math.ceil(fixedCost / (pricePerUnit - variableCost));
    
    // Update results
    document.getElementById('revenueResult').textContent = `₱${revenue.toLocaleString()}`;
    document.getElementById('costResult').textContent = `₱${totalCost.toLocaleString()}`;
    document.getElementById('profitResult').textContent = `₱${profit.toLocaleString()}`;
    document.getElementById('breakEvenResult').textContent = `${breakEven} units`;
    
    // Update business functions display
    const functionsContainer = document.getElementById('businessFunctions');
    if (functionsContainer) {
        functionsContainer.innerHTML = `
            <div class="bg-white/20 rounded-lg p-3">
                <p class="text-sm mb-2">Revenue Function:</p>
                <p class="font-mono text-lg">R(x) = ${pricePerUnit}x</p>
            </div>
            <div class="bg-white/20 rounded-lg p-3">
                <p class="text-sm mb-2">Cost Function:</p>
                <p class="font-mono text-lg">C(x) = ${fixedCost} + ${variableCost}x</p>
            </div>
            <div class="bg-white/20 rounded-lg p-3">
                <p class="text-sm mb-2">Profit Function:</p>
                <p class="font-mono text-lg">P(x) = ${(pricePerUnit - variableCost)}x - ${fixedCost}</p>
            </div>
        `;
    }
}

// Scientific Calculator Functions
function updateScientificModel() {
    const model = document.getElementById('scientificModel').value;
    currentScientificModel = model;
    
    const modelDetails = {
        'population': {
            title: 'Population Growth',
            function: 'P(t) = 100,000 × e^(0.02t)',
            parameters: 'P₀ = 100,000, r = 0.02',
            description: 'Population after t years'
        },
        'decay': {
            title: 'Radioactive Decay',
            function: 'N(t) = N₀ × e^(-0.000121t)',
            parameters: 'N₀ = 1000, λ = 0.000121',
            description: 'Remaining amount after t years'
        },
        'cooling': {
            title: "Newton's Law of Cooling",
            function: 'T(t) = 20 + 80e^(-0.1t)',
            parameters: 'Tₐ = 20°C, T₀ = 100°C, k = 0.1',
            description: 'Temperature after t hours'
        },
        'projectile': {
            title: 'Projectile Motion',
            function: 'h(t) = 100 + 50t - 4.9t²',
            parameters: 'h₀ = 100m, v₀ = 50m/s, g = 9.8m/s²',
            description: 'Height after t seconds'
        }
    };
    
    const selected = modelDetails[model];
    
    // Update model details display
    const detailsContainer = document.getElementById('scientificModelDetails');
    if (detailsContainer) {
        detailsContainer.innerHTML = `
            <div class="bg-white/20 rounded-lg p-3">
                <p class="text-sm mb-2">Model:</p>
                <p class="font-mono text-lg">${selected.title}</p>
            </div>
            <div class="bg-white/20 rounded-lg p-3">
                <p class="text-sm mb-2">Function:</p>
                <p class="font-mono text-lg">${selected.function}</p>
            </div>
            <div class="bg-white/20 rounded-lg p-3">
                <p class="text-sm mb-2">Parameters:</p>
                <p class="font-mono text-lg">${selected.parameters}</p>
            </div>
        `;
    }
    
    // Calculate with current time
    calculateScientific();
}

function calculateScientific() {
    const model = document.getElementById('scientificModel').value;
    const time = parseFloat(document.getElementById('scientificTime').value) || 0;
    
    let result, explanation, stepByStep;
    
    switch(model) {
        case 'population':
            result = Math.round(100000 * Math.exp(0.02 * time));
            explanation = `Population after ${time} years`;
            stepByStep = `P(${time}) = 100,000 × e^(0.02 × ${time}) = 100,000 × e^${(0.02 * time).toFixed(3)}`;
            break;
        case 'decay':
            result = Math.round(1000 * Math.exp(-0.000121 * time));
            explanation = `Remaining amount after ${time} years`;
            stepByStep = `N(${time}) = 1,000 × e^(-0.000121 × ${time}) = 1,000 × e^${(-0.000121 * time).toFixed(6)}`;
            break;
        case 'cooling':
            result = Math.round(20 + 80 * Math.exp(-0.1 * time));
            explanation = `Temperature after ${time} hours`;
            stepByStep = `T(${time}) = 20 + 80 × e^(-0.1 × ${time}) = 20 + 80 × e^${(-0.1 * time).toFixed(3)}`;
            break;
        case 'projectile':
            result = Math.round(100 + 50 * time - 4.9 * time * time);
            explanation = `Height after ${time} seconds`;
            stepByStep = `h(${time}) = 100 + 50(${time}) - 4.9(${time})² = 100 + ${50 * time} - ${(4.9 * time * time).toFixed(1)}`;
            break;
        default:
            result = 0;
            explanation = 'Please select a model';
            stepByStep = '';
    }
    
    // Update results
    document.getElementById('scientificResult').textContent = result.toLocaleString();
    document.getElementById('scientificExplanation').textContent = explanation;
    
    // Add step-by-step explanation if element exists
    const stepElement = document.getElementById('scientificStepByStep');
    if (stepElement) {
        stepElement.textContent = stepByStep;
    }
}

// Complex Problem Solver Functions
function updateComplexProblem() {
    const problem = document.getElementById('complexProblem').value;
    currentComplexProblem = problem;
    
    const problemDetails = {
        'optimization': {
            title: 'Business Optimization',
            function: 'P(x,y) = 30x + 30y',
            constraints: 'x ≤ 100, y ≤ 150',
            method: 'Linear Programming'
        },
        'environmental': {
            title: 'Environmental Modeling',
            function: 'A(t) = 50 + 30sin(πt/12) + 10t',
            constraints: 't ≥ 0',
            method: 'Trigonometric Analysis'
        },
        'engineering': {
            title: 'Engineering Design',
            function: 'S(x) = 1000x - 0.5x²',
            constraints: '0 ≤ x ≤ 2000',
            method: 'Quadratic Optimization'
        },
        'social': {
            title: 'Social Science',
            function: 'I(x) = 1000/(1 + 99e^(-0.1x))',
            constraints: 'x ≥ 0',
            method: 'Logistic Growth'
        }
    };
    
    const selected = problemDetails[problem];
    
    // Update analysis display
    const analysisContainer = document.getElementById('complexAnalysis');
    if (analysisContainer) {
        analysisContainer.innerHTML = `
            <div class="bg-white/20 rounded-lg p-3">
                <p class="text-sm mb-2">Problem Type:</p>
                <p class="font-mono text-lg">${selected.title}</p>
            </div>
            <div class="bg-white/20 rounded-lg p-3">
                <p class="text-sm mb-2">Objective Function:</p>
                <p class="font-mono text-lg">${selected.function}</p>
            </div>
            <div class="bg-white/20 rounded-lg p-3">
                <p class="text-sm mb-2">Constraints:</p>
                <p class="font-mono text-lg">${selected.constraints}</p>
            </div>
            <div class="bg-white/20 rounded-lg p-3">
                <p class="text-sm mb-2">Method:</p>
                <p class="font-mono text-lg">${selected.method}</p>
            </div>
        `;
    }
    
    // Dynamically adjust preset options for lesson 4 depending on problem
    const presetSelect = document.getElementById('complexInputSelect');
    if (presetSelect) {
        let options = [];
        if (problem === 'optimization') {
            options = [
                { v: 'default', t: 'Default: x≤100, y≤150' },
                { v: 'highA', t: 'More A demand (x≤120, y≤120)' },
                { v: 'highB', t: 'More B demand (x≤80, y≤180)' }
            ];
        } else if (problem === 'environmental') {
            options = [
                { v: 'default', t: 'Default: threshold 100' },
                { v: 'threshold120', t: 'Higher threshold 120' },
                { v: 'threshold90', t: 'Lower threshold 90' }
            ];
        } else if (problem === 'engineering') {
            options = [
                { v: 'default', t: 'Default bounds 0≤x≤2000' },
                { v: 'narrow', t: 'Narrow bounds 0≤x≤1200' },
                { v: 'wide', t: 'Wide bounds 0≤x≤3000' }
            ];
        } else if (problem === 'social') {
            options = [
                { v: 'default', t: 'Default: 50% reach' },
                { v: 'reach70', t: 'Target 70% reach' },
                { v: 'reach30', t: 'Target 30% reach' }
            ];
        }
        presetSelect.innerHTML = options.map(o => `<option value="${o.v}">${o.t}</option>`).join('');
        presetSelect.value = options[0]?.v || 'default';
    }

    // Solve the problem
    solveComplexProblem();
}

function solveComplexProblem() {
    const problem = document.getElementById('complexProblem').value;
    const preset = document.getElementById('complexInputSelect')?.value || 'default';
    
    let solution, value, interpretation, methodology;
    let steps = [];
    
    switch(problem) {
        case 'optimization': {
            methodology = 'Linear Programming: Evaluate objective at feasible corner points';
            if (preset === 'highA') {
                solution = 'x = 120, y = 120';
                value = '₱7,200';
                interpretation = 'Shift capacity to A and balance B within limits';
                steps = [
                    'Define P(x,y) = 30x + 30y',
                    'Constraints: x ≤ 120, y ≤ 120, x ≥ 0, y ≥ 0',
                    'Corner points: (0,0), (120,0), (0,120), (120,120)',
                    'Evaluate P: 0, 3,600, 3,600, 7,200',
                    'Max at (120,120) → ₱7,200'
                ];
            } else if (preset === 'highB') {
                solution = 'x = 80, y = 180';
                value = '₱7,800';
                interpretation = 'Allocate more to B due to higher capacity';
                steps = [
                    'Define P(x,y) = 30x + 30y',
                    'Constraints: x ≤ 80, y ≤ 180, x ≥ 0, y ≥ 0',
                    'Corner points: (0,0), (80,0), (0,180), (80,180)',
                    'Evaluate P: 0, 2,400, 5,400, 7,800',
                    'Max at (80,180) → ₱7,800'
                ];
            } else {
                solution = 'x = 100, y = 150';
                value = '₱7,500';
                interpretation = 'Produce 100 units of A and 150 units of B for maximum profit';
                steps = [
                    'Define P(x,y) = 30x + 30y',
                    'Constraints: x ≤ 100, y ≤ 150, x ≥ 0, y ≥ 0',
                    'Corner points: (0,0), (100,0), (0,150), (100,150)',
                    'Evaluate P: 0, 3,000, 4,500, 7,500',
                    'Max at (100,150) → ₱7,500'
                ];
            }
            break;
        }
        case 'environmental': {
            const target = preset === 'threshold120' ? 120 : (preset === 'threshold90' ? 90 : 100);
            solution = target === 120 ? 't ≈ 4.9 months' : target === 90 ? 't ≈ 2.2 months' : 't ≈ 3.2 months';
            value = `A = ${target}`;
            interpretation = `AQI first exceeds ${target} around the computed time`;
            methodology = 'Numerical: Solve 50 + 30sin(πt/12) + 10t = target';
            steps = [
                `Set 50 + 30sin(πt/12) + 10t = ${target}`,
                'Isolate periodic and linear parts',
                'Use graphing or iteration to find first solution',
                `Approximate time → ${solution.split(' ')[2]} ${solution.split(' ')[3]}`
            ];
            break;
        }
        case 'engineering': {
            const bound = preset === 'narrow' ? 1200 : (preset === 'wide' ? 3000 : 2000);
            // S(x) = 1000x - 0.5x^2 → S'(x) = 1000 - x → critical at x=1000
            const xStar = Math.min(1000, bound);
            const S = (x) => 1000*x - 0.5*x*x;
            solution = `x = ${xStar}`;
            value = `S = ${formatNumber(Math.round(S(xStar)))}`;
            interpretation = `Maximum within 0≤x≤${bound} occurs at x = ${xStar}`;
            methodology = 'Calculus: Set derivative 1000 - x = 0 to find maximum';
            steps = [
                'S(x) = 1000x - 0.5x²',
                "S'(x) = 1000 - x",
                "Set S'(x)=0 → x = 1000",
                `Check bounds [0, ${bound}] → choose x = ${xStar}`,
                `Compute S(${xStar}) = ${value.split('=')[1].trim()}`
            ];
            break;
        }
        case 'social': {
            const target = preset === 'reach70' ? 700 : (preset === 'reach30' ? 300 : 500);
            // I(x) = 1000/(1 + 99e^-0.1x) → solve I(x)=target → 1000/target - 1 = 99e^-0.1x
            const rhs = (1000/target) - 1;
            const xVal = Math.round((-1/0.1) * Math.log(rhs/99));
            solution = `x = ${xVal}`;
            value = `I = ${target}`;
            interpretation = `Information reaches ${target/10}% at approximately x = ${xVal}`;
            methodology = 'Logistic equation: solve for x via algebra and logs';
            steps = [
                `Set 1000/(1 + 99e^(-0.1x)) = ${target}`,
                `Invert → 1 + 99e^(-0.1x) = ${(1000/target).toFixed(2)}`,
                'Subtract 1 and divide by 99',
                'Take natural logs and solve for x',
                `x ≈ ${xVal}`
            ];
            break;
        }
        default:
            solution = 'No solution';
            value = '0';
            interpretation = 'Please select a problem type';
            methodology = '';
    }
    
    // Update results
    document.getElementById('complexSolution').textContent = solution;
    document.getElementById('complexValue').textContent = value;
    document.getElementById('complexInterpretation').textContent = interpretation;
    
    // Add methodology explanation if element exists
    const methodElement = document.getElementById('complexMethodology');
    if (methodElement) {
        methodElement.textContent = methodology;
    }
    const stepsDiv = document.getElementById('complexSteps');
    if (stepsDiv) {
        stepsDiv.style.display = 'block';
        stepsDiv.innerHTML = `
            <h5>Step-by-Step:</h5>
            <ul>
                ${steps.map(s => `<li>${s}</li>`).join('')}
            </ul>
        `;
    }
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(amount);
}

function formatNumber(number) {
    return new Intl.NumberFormat('en-PH').format(number);
}

// Animation Functions
function animateElement(element, animationClass) {
    element.classList.add(animationClass);
    setTimeout(() => {
        element.classList.remove(animationClass);
    }, 500);
}

// Input Validation
function validateInput(input, min = 0, max = Infinity) {
    const value = parseFloat(input.value);
    if (isNaN(value) || value < min || value > max) {
        input.classList.add('border-red-500');
        return false;
    } else {
        input.classList.remove('border-red-500');
        return true;
    }
}

// Real-time Calculation Updates
document.addEventListener('input', function(e) {
    if (e.target.matches('#inputValue')) {
        solveProblem();
    } else if (e.target.matches('#pricePerUnit, #fixedCost, #variableCost, #quantity')) {
        calculateBusiness();
    } else if (e.target.matches('#scientificTime')) {
        calculateScientific();
    } else if (e.target.matches('#complexInput')) {
        solveComplexProblem();
    }
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

// Enhanced Learning Features
function showLearningTip(tip) {
    // Create a temporary tip display
    const tipElement = document.createElement('div');
    tipElement.className = 'fixed top-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
    tipElement.innerHTML = `
        <div class="flex items-start">
            <i class="fas fa-lightbulb mr-2 mt-1"></i>
            <div>
                <h4 class="font-semibold mb-2">Learning Tip</h4>
                <p class="text-sm">${tip}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    document.body.appendChild(tipElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (tipElement.parentElement) {
            tipElement.remove();
        }
    }, 5000);
}

function generatePracticeProblem(lesson) {
    const problems = {
        1: [
            "A parking lot charges ₱20 for the first hour and ₱10 for each additional hour. Write a function for the total cost.",
            "A cellphone plan costs ₱300 monthly with ₱5 per text message. Create a function for the monthly bill.",
            "A delivery service charges ₱30 base fee plus ₱2 per kilometer. Model this as a function."
        ],
        2: [
            "A company sells products for ₱200 each. Fixed costs are ₱10,000 and variable costs are ₱80 per unit. Find the break-even point.",
            "A restaurant has daily fixed costs of ₱5,000 and variable costs of ₱50 per meal. If meals sell for ₱150, how many meals must they sell to break even?",
            "A manufacturing company has revenue R(x) = 500x and cost C(x) = 20,000 + 200x. Find the profit function and break-even point."
        ],
        3: [
            "A bacteria culture doubles every 3 hours. If there are 100 bacteria initially, how many will there be after 12 hours?",
            "A radioactive substance has a half-life of 8 days. If you start with 1000 grams, how much will remain after 24 days?",
            "A hot cup of coffee cools from 90°C to 70°C in 10 minutes in a 20°C room. When will it reach 30°C?"
        ],
        4: [
            "A farmer has 100 meters of fencing to enclose a rectangular area. What dimensions give maximum area?",
            "A company produces two products. Product A gives ₱50 profit per unit, Product B gives ₱30 profit per unit. They can produce at most 200 units of A and 300 units of B. How many of each should they produce for maximum profit?",
            "A city's population grows according to P(t) = 50,000e^(0.02t). When will it reach 100,000?"
        ]
    };
    
    const lessonProblems = problems[lesson] || problems[1];
    const randomProblem = lessonProblems[Math.floor(Math.random() * lessonProblems.length)];
    
    showLearningTip(`Practice Problem: ${randomProblem}`);
}

function showMELCInfo(melc) {
    const melcInfo = {
        'M11GM-Ia-1': {
            title: 'Represent real-life situations using functions',
            description: 'Students will identify variables and relationships in real-world problems and express them as functions.',
            examples: ['Taxi fare calculations', 'Phone bill structures', 'Salary computations']
        },
        'M11GM-Ia-2': {
            title: 'Model business scenarios using functions',
            description: 'Students will create mathematical models for business problems including profit, cost, and revenue.',
            examples: ['Break-even analysis', 'Pricing strategies', 'Production optimization']
        },
        'M11GM-Ia-3': {
            title: 'Model scientific phenomena using functions',
            description: 'Students will apply functions to model natural and scientific processes.',
            examples: ['Population growth', 'Radioactive decay', 'Temperature changes']
        },
        'M11GM-Ia-4': {
            title: 'Solve multi-step real-life problems',
            description: 'Students will combine different function types to solve complex real-world scenarios.',
            examples: ['Optimization problems', 'Environmental modeling', 'Engineering design']
        }
    };
    
    const info = melcInfo[melc];
    if (info) {
        showLearningTip(`MELC ${melc}: ${info.title} - ${info.description}`);
    }
}

// Enhanced input validation
function validateEnhancedInput(input, type, constraints = {}) {
    const value = parseFloat(input.value);
    const errors = [];
    
    if (isNaN(value)) {
        errors.push('Please enter a valid number');
    }
    
    if (constraints.min !== undefined && value < constraints.min) {
        errors.push(`Value must be at least ${constraints.min}`);
    }
    
    if (constraints.max !== undefined && value > constraints.max) {
        errors.push(`Value must be at most ${constraints.max}`);
    }
    
    if (constraints.positive && value <= 0) {
        errors.push('Value must be positive');
    }
    
    if (errors.length > 0) {
        input.classList.add('border-red-500', 'bg-red-50');
        showLearningTip(`Input Error: ${errors.join(', ')}`);
        return false;
    } else {
        input.classList.remove('border-red-500', 'bg-red-50');
        input.classList.add('border-green-500', 'bg-green-50');
        return true;
    }
}

// Export functions for global access
window.updateProblem = updateProblem;
window.solveProblem = solveProblem;
window.calculateBusiness = calculateBusiness;
window.updateScientificModel = updateScientificModel;
window.calculateScientific = calculateScientific;
window.updateComplexProblem = updateComplexProblem;
window.solveComplexProblem = solveComplexProblem;
window.showLearningTip = showLearningTip;
window.generatePracticeProblem = generatePracticeProblem;
window.showMELCInfo = showMELCInfo;
window.validateEnhancedInput = validateEnhancedInput;

// ------------------------------
// Lesson Navigation & Completion
// ------------------------------

let slpCurrentLesson = 1;
let slpCompletedLessons = new Set();
const slpTotalLessons = 4;

// Initialize lesson UX (adds controls, wires clicks, loads completion)
document.addEventListener('DOMContentLoaded', function() {
    try {
        slpInjectLessonControls();

        // Rewire lesson nav buttons to use our showLesson (capture and stop)
        const lessonNavBtns = document.querySelectorAll('.lesson-nav-btn');
        lessonNavBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopImmediatePropagation();
                const lessonNum = parseInt(this.dataset.lesson);
                slpShowLesson(lessonNum, true);
            }, true);
        });

        // Initial state
        slpShowLesson(1, false);
        slpUpdateNavigationButtons();
        slpLoadCompletedLessons();
    } catch (_) {
        // Non-fatal if structure differs
    }
});

function slpInjectLessonControls() {
    for (let i = 1; i <= slpTotalLessons; i++) {
        const section = document.getElementById(`lesson${i}`);
        if (!section) continue;
        const container = section.querySelector('.bg-white.rounded-2xl.shadow-xl.p-8.mb-8') || section;

        // Completion block
        if (!section.querySelector(`button[onclick="completeLesson(${i})"]`)) {
            const completion = document.createElement('div');
            completion.className = 'bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 mb-8';
            completion.innerHTML = `
                <h3 class="text-xl font-semibold text-gray-800 mb-4 text-center">
                    <i class=\"fas fa-check-circle text-emerald-500 mr-2\"></i>Complete This Lesson
                </h3>
                <p class="text-gray-600 text-center mb-6">
                    Mark this lesson as completed to track your progress.
                </p>
                <div class="text-center">
                    <button onclick=\"completeLesson(${i})\" 
                            class="bg-emerald-500 text-white px-8 py-3 rounded-lg hover:bg-emerald-600 transition-colors font-semibold">
                        <i class=\"fas fa-check mr-2\"></i>Mark as Complete
                    </button>
                </div>`;
            container.appendChild(completion);
        }

        // Navigation controls
        if (!section.querySelector('#lessonProgressBar')) {
            const progressPct = Math.round((i / slpTotalLessons) * 100);
            const nav = document.createElement('div');
            nav.className = 'flex justify-between items-center mb-8';
            nav.innerHTML = `
                <button id=\"prevLessonBtn\" onclick=\"navigateLesson(-1)\" 
                        class=\"flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed\"> 
                    <i class=\"fas fa-chevron-left mr-2\"></i>Previous Lesson
                </button>
                <div class=\"flex items-center space-x-4\"> 
                    <div class=\"text-center\"> 
                        <div class=\"text-lg font-semibold text-primary\"> 
                            <span id=\"currentLessonNum\">${i}</span> of ${slpTotalLessons}
                        </div>
                    </div>
                    <div class=\"w-32 bg-gray-200 rounded-full h-2\"> 
                        <div id=\"lessonProgressBar\" class=\"bg-primary h-2 rounded-full transition-all duration-300\" style=\"width: ${progressPct}%\"></div>
                    </div>
                </div>
                <button id=\"nextLessonBtn\" onclick=\"navigateLesson(1)\" 
                        class=\"flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed\"> 
                    Next Lesson<i class=\"fas fa-chevron-right ml-2\"></i>
                </button>`;
            container.appendChild(nav);
        }
    }
}

function slpShowLesson(lessonNum, scrollToTop = false) {
    slpCurrentLesson = lessonNum;
    const lessonSections = document.querySelectorAll('.lesson-section');
    lessonSections.forEach(s => s.classList.remove('active'));
    document.getElementById(`lesson${lessonNum}`)?.classList.add('active');

    // Update nav card highlight
    const lessonNavBtns = document.querySelectorAll('.lesson-nav-btn');
    lessonNavBtns.forEach(b => {
        b.classList.remove('border-primary', 'bg-primary');
        b.classList.add('border-transparent');
        const icon = b.querySelector('.w-16');
        icon?.classList.remove('bg-primary', 'text-white');
        icon?.classList.add('bg-gray-300', 'text-gray-600');
    });
    const currentBtn = document.querySelector(`[data-lesson="${lessonNum}"]`);
    if (currentBtn) {
        currentBtn.classList.add('border-primary', 'bg-primary');
        currentBtn.classList.remove('border-transparent');
        const icon = currentBtn.querySelector('.w-16');
        icon?.classList.add('bg-primary', 'text-white');
        icon?.classList.remove('bg-gray-300', 'text-gray-600');
    }

    slpUpdateProgressIndicators();
    slpUpdateNavigationButtons();
    slpUpdateCompletionButtonsUI();
    if (scrollToTop) slpScrollToTopOfLesson();
}

function navigateLesson(direction) {
    const target = slpCurrentLesson + direction;
    if (target >= 1 && target <= slpTotalLessons) {
        slpShowLesson(target, true);
    }
}

function slpUpdateNavigationButtons() {
    const prevBtns = document.querySelectorAll('#prevLessonBtn');
    const nextBtns = document.querySelectorAll('#nextLessonBtn');
    prevBtns.forEach(b => b.disabled = slpCurrentLesson <= 1);
    nextBtns.forEach(b => b.disabled = slpCurrentLesson >= slpTotalLessons);
}

function slpUpdateProgressIndicators() {
    const nums = document.querySelectorAll('#currentLessonNum');
    nums.forEach(n => n.textContent = String(slpCurrentLesson));
    const bars = document.querySelectorAll('#lessonProgressBar');
    const pct = (slpCurrentLesson / slpTotalLessons) * 100;
    bars.forEach(bar => { bar.style.width = pct + '%'; });
}

function slpScrollToTopOfLesson() {
    const container = document.querySelector('.lesson-content');
    if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function slpGetCompleteButton(lessonNum) {
    const section = document.getElementById(`lesson${lessonNum}`);
    if (!section) return null;
    return section.querySelector(`button[onclick="completeLesson(${lessonNum})"]`);
}

function slpSetCompleteButtonState(lessonNum, { completed = false, loading = false } = {}) {
    const btn = slpGetCompleteButton(lessonNum);
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

function slpUpdateCompletionButtonsUI() {
    for (let i = 1; i <= slpTotalLessons; i++) {
        slpSetCompleteButtonState(i, { completed: slpCompletedLessons.has(i), loading: false });
    }
}

async function completeLesson(lessonNum) {
    console.log('Attempting to complete lesson:', lessonNum);
    
    try {
        if (slpCompletedLessons.has(lessonNum)) {
            slpSetCompleteButtonState(lessonNum, { completed: true, loading: false });
            return;
        }
        
        slpSetCompleteButtonState(lessonNum, { loading: true });
        
        const requestData = {
            topic: 'solving-real-life-problems',
            lesson: lessonNum,
            action: 'complete'
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
            slpSetCompleteButtonState(lessonNum, { completed: slpCompletedLessons.has(lessonNum), loading: false });
            return;
        }
        
        if (data.success) {
            console.log('Lesson completion successful');
            
            slpCompletedLessons.add(lessonNum);
            slpSetCompleteButtonState(lessonNum, { completed: true, loading: false });
            slpUpdateLessonCompletionStatus();
            
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
        
        slpSetCompleteButtonState(lessonNum, { completed: slpCompletedLessons.has(lessonNum), loading: false });
        
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

async function slpLoadCompletedLessons() {
    console.log('Loading completed lessons for solving-real-life-problems topic');
    
    try {
        const requestData = {
            topic: 'solving-real-life-problems',
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
            slpCompletedLessons = new Set(data.completed_lessons);
            slpUpdateLessonCompletionStatus();
            slpUpdateCompletionButtonsUI();
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

function slpUpdateLessonCompletionStatus() {
    const lessonNavBtns = document.querySelectorAll('.lesson-nav-btn');
    lessonNavBtns.forEach(btn => {
        const ln = parseInt(btn.dataset.lesson);
        const icon = btn.querySelector('.w-16');
        if (!icon) return;
        if (slpCompletedLessons.has(ln)) {
            icon.classList.remove('bg-gray-300', 'text-gray-600', 'bg-primary', 'text-white');
            icon.classList.add('bg-green-500', 'text-white');
            icon.innerHTML = '<i class="fas fa-check text-lg"></i>';
            slpSetCompleteButtonState(ln, { completed: true, loading: false });
        }
    });
    
    // Check if all lessons are completed and show topic completion option
    if (slpCompletedLessons.size === slpTotalLessons) {
        slpShowTopicCompletionOption();
    }
}

// Show topic completion option
function slpShowTopicCompletionOption() {
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
                        Congratulations! You've completed all lessons in the Solving Real-Life Problems Involving Functions topic. Mark this topic as complete to update your progress.
                    </p>
                    <div class="text-center">
                        <button onclick="completeTopic()" 
                                class="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-colors font-semibold inline-flex items-center">
                            <i class="fas fa-trophy mr-2"></i>
                            Mark This Topic About Solving Real-Life Problems Complete
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
    console.log('Attempting to complete topic: solving-real-life-problems');
    
    try {
        const requestData = {
            topic: 'solving-real-life-problems',
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
                text: 'Congratulations! You have successfully completed the Solving Real-Life Problems Involving Functions topic. Your progress has been updated.',
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
                    <p class="mb-2"><strong>Topic:</strong> solving-real-life-problems</p>
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

// Export navigation functions
window.navigateLesson = navigateLesson;
window.completeLesson = completeLesson;