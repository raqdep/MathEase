// Solving Real-Life Problems Involving Functions - Interactive JavaScript

// Global variables for problem solving
let currentProblem = 'taxi';
let currentScientificModel = 'population';
let currentComplexProblem = 'optimization';

// Sidebar Navigation Functions
function canAccessTopic(lessonNum) {
    if (lessonNum <= 1) return true;
    for (let i = 1; i < lessonNum; i++) {
        if (!slpCompletedLessons.has(i)) return false;
    }
    return true;
}

function showTopicLockedMessage(lessonNum) {
    const prev = lessonNum - 1;
    Swal.fire({
        icon: 'info',
        title: 'Complete Previous Topic First',
        html: `You need to <strong>pass the 5 questions</strong> for Topic ${prev} before you can open Topic ${lessonNum}.<br><br>Stay on Topic ${prev}, finish the lesson, then take the quiz and get at least <strong>3/5 correct</strong> (60%) to unlock Topic ${lessonNum}.`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#667eea'
    });
}

function setSidebarActive(lessonNum, section) {
    document.querySelectorAll('.lesson-topic-header').forEach(h => h.classList.remove('active'));
    document.querySelectorAll('.lesson-subitem').forEach(s => s.classList.remove('active'));
    const topic = document.getElementById('sidebar-topic-' + lessonNum);
    if (topic) {
        topic.querySelector('.lesson-topic-header').classList.add('active');
        const dot = topic.querySelector('.lesson-topic-dot');
        if (dot) {
            dot.classList.remove('completed');
            if (slpCompletedLessons.has(lessonNum)) dot.classList.add('completed');
        }
    }
    const sub = document.querySelector(`.lesson-subitem[data-lesson="${lessonNum}"][data-section="${section}"]`);
    if (sub) sub.classList.add('active');
}

function updateSidebarProgress() {
    document.querySelectorAll('.lesson-topic').forEach(topic => {
        const n = parseInt(topic.dataset.lesson, 10);
        const accessible = canAccessTopic(n);
        const complete = slpCompletedLessons.has(n);
        // Never lock a topic that is already completed
        topic.classList.toggle('locked', !accessible && !complete);
        // Removed progress text logic - only update dot completion status
        const dot = topic.querySelector('.lesson-topic-dot');
        if (dot) {
            if (complete) dot.classList.add('completed');
            else dot.classList.remove('completed');
        }
    });
}

// User Dropdown Functions
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

// Load and display profile picture
async function loadProfilePicture(userId) {
    try {
        const profileResponse = await fetch(`../php/get-profile.php?user_id=${userId}`, {
            credentials: 'include'
        });
        
        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.success && profileData.user && profileData.user.profile_picture) {
                const profilePicPath = `../${profileData.user.profile_picture}`;
                
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

// Lesson Navigation
document.addEventListener('DOMContentLoaded', function() {
    // Sidebar: topic expand/collapse
    document.querySelectorAll('.lesson-topic-header').forEach(header => {
        header.addEventListener('click', function(e) {
            if (e.target.closest('.lesson-subitem')) return;
            const topic = this.closest('.lesson-topic');
            const lessonNum = parseInt(topic.dataset.lesson, 10);
            if (topic.classList.contains('locked') || !canAccessTopic(lessonNum)) {
                showTopicLockedMessage(lessonNum);
                return;
            }
            topic.classList.toggle('expanded');
            this.setAttribute('aria-expanded', topic.classList.contains('expanded'));
            if (topic.classList.contains('expanded')) {
                slpShowLesson(lessonNum);
                setSidebarActive(lessonNum, 'objective');
            }
        });
    });
    
    // Sidebar: subitem click -> show lesson and scroll to section (only if topic unlocked)
    document.querySelectorAll('.lesson-subitem').forEach(sub => {
        sub.addEventListener('click', function(e) {
            e.stopPropagation();
            const lessonNum = parseInt(this.dataset.lesson, 10);
            if (!canAccessTopic(lessonNum)) {
                showTopicLockedMessage(lessonNum);
                return;
            }
            const section = this.dataset.section;
            const sectionId = this.dataset.sectionId;
            slpShowLesson(lessonNum);
            setSidebarActive(lessonNum, section);
            const topic = document.getElementById('sidebar-topic-' + lessonNum);
            if (topic && !topic.classList.contains('expanded')) {
                topic.classList.add('expanded');
                topic.querySelector('.lesson-topic-header').setAttribute('aria-expanded', 'true');
            }
            if (sectionId) {
                setTimeout(() => {
                    const el = document.getElementById(sectionId);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
            if (window.innerWidth < 1024) document.getElementById('lessonSidebar')?.classList.remove('open');
        });
    });
    
    // Mobile sidebar toggle with overlay and swipe gestures
    const sidebar = document.getElementById('lessonSidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.createElement('div');
    sidebarOverlay.className = 'sidebar-overlay';
    sidebarOverlay.addEventListener('click', function() {
        if (sidebar) closeSidebar();
    });
    document.body.appendChild(sidebarOverlay);
    
    function openSidebar() {
        if (sidebar && window.innerWidth < 1024) {
            sidebar.classList.add('open');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    function closeSidebar() {
        if (sidebar) {
            sidebar.classList.remove('open');
            sidebar.classList.remove('swiping');
            sidebar.style.transform = '';
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    sidebarToggle?.addEventListener('click', function() {
        if (sidebar?.classList.contains('open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });
    
    // Swipe gesture support for sidebar
    let touchStartX = 0;
    let touchEndX = 0;
    let isSwiping = false;
    const swipeThreshold = 50;
    const edgeSwipeThreshold = 20;
    
    // Swipe from left edge to open sidebar
    document.addEventListener('touchstart', function(e) {
        if (window.innerWidth >= 1024) return;
        touchStartX = e.touches[0].clientX;
        if (touchStartX <= edgeSwipeThreshold && !sidebar?.classList.contains('open')) {
            isSwiping = true;
        }
    }, { passive: true });
    
    document.addEventListener('touchmove', function(e) {
        if (!isSwiping || window.innerWidth >= 1024) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - touchStartX;
        
        if (diff > 0 && sidebar && !sidebar.classList.contains('open')) {
            const translateX = Math.min(diff, 280);
            sidebar.style.transform = `translateX(${-280 + translateX}px)`;
            sidebar.classList.add('swiping');
        } else if (diff < 0 && sidebar?.classList.contains('open')) {
            const translateX = Math.max(diff, -280);
            sidebar.style.transform = `translateX(${translateX}px)`;
            sidebar.classList.add('swiping');
        }
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
        if (!isSwiping || window.innerWidth >= 1024) {
            isSwiping = false;
            return;
        }
        
        touchEndX = e.changedTouches[0].clientX;
        const diff = touchEndX - touchStartX;
        
        if (sidebar) {
            sidebar.classList.remove('swiping');
            
            if (diff > swipeThreshold && !sidebar.classList.contains('open')) {
                openSidebar();
            } else if (diff < -swipeThreshold && sidebar.classList.contains('open')) {
                closeSidebar();
            } else {
                if (sidebar.classList.contains('open')) {
                    sidebar.style.transform = 'translateX(0)';
                } else {
                    sidebar.style.transform = 'translateX(-100%)';
                }
            }
        }
        
        isSwiping = false;
    }, { passive: true });
    
    // Close sidebar when clicking outside
    document.querySelector('.lesson-sidebar')?.addEventListener('click', function(e) {
        if (e.target === this && window.innerWidth < 1024) {
            closeSidebar();
        }
    });
    
    // Initialize sidebar state
    if (window.innerWidth < 1024 && sidebar) {
        sidebar.classList.remove('open');
    }
    
    // Prevent body scroll when sidebar is open
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (sidebar?.classList.contains('open')) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
            }
        });
    });
    
    if (sidebar) {
        observer.observe(sidebar, { attributes: true });
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
    
    // Top nav cards are intentionally non-clickable (navigation is via Prev/Next + quizzes).
    // Still initialize all calculators.
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
        const isTeacher = data.user_type === 'teacher';
        const gradeOk = isTeacher || !u.grade_level || String(u.grade_level) === '11';
        const strandOk = isTeacher || !u.strand || String(u.strand).toUpperCase() === 'STEM';
        if (!gradeOk || !strandOk) { window.location.href = '../dashboard.html'; return; }
        
        if (isTeacher) {
            document.querySelectorAll('a[href="../dashboard.html"]').forEach(function(a) {
                a.href = '../teacher-dashboard.html';
                if (a.textContent.includes('Dashboard')) a.textContent = a.textContent.replace('Dashboard', 'Teacher Dashboard').trim();
            });
            fetch('../php/teacher-lesson-progress.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=record_view&topic_slug=solving-real-life-problems&topic_name=Solving Real-Life Problems Involving Functions',
                credentials: 'include'
            }).catch(function() {});
        }
        
        // Update user name in all locations
        const userNameEl = document.getElementById('userName');
        const userNameDropdown = document.getElementById('userNameDropdown');
        const userNameMobile = document.getElementById('userNameMobile');
        const userNameText = `${u.first_name} ${u.last_name || ''}`.trim();
        
        if (userNameEl && u.first_name) {
            userNameEl.textContent = userNameText;
        }
        if (userNameDropdown && u.first_name) {
            userNameDropdown.textContent = userNameText;
        }
        if (userNameMobile && u.first_name) {
            userNameMobile.textContent = userNameText;
        }
        
        // Load and display profile picture
        if (u.id) {
            loadProfilePicture(u.id);
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

// Study time tracking
let slpLessonStartTime = {};
let slpTotalStudyTime = {}; // Track total time per lesson in seconds
let slpLastSavedTime = {}; // Track last confirmed saved time from server (to prevent double counting)
let slpLastSaveTimestamp = {}; // Track when we last saved (to calculate elapsed correctly)
let slpStudyTimeInterval = null;
let slpTimerUpdateInterval = null; // For live timer display

// Quiz Arrays - 5 questions per lesson
const slpLesson1Quiz = [
    {
        question: "What is a piecewise function?",
        options: [
            "A function with multiple rules for different intervals",
            "A function that only works for positive numbers",
            "A function with no domain restrictions",
            "A function that always returns zero"
        ],
        correct: 0
    },
    {
        question: "If a taxi charges ₱40 for the first km and ₱15 for each additional km, what is the fare for 5 km?",
        options: [
            "₱100",
            "₱115",
            "₱120",
            "₱125"
        ],
        correct: 0
    },
    {
        question: "What is the function model for a phone plan that costs ₱500 base with ₱2 per minute beyond 100 minutes?",
        options: [
            "f(x) = 500 + 2x for x > 100",
            "f(x) = 500 + 2(x - 100) for x > 100",
            "f(x) = 500x + 2 for x > 100",
            "f(x) = 500 - 2x for x > 100"
        ],
        correct: 1
    },
    {
        question: "In the electricity bill function f(x) = 8x for 0 ≤ x ≤ 100, what does x represent?",
        options: [
            "The bill amount in pesos",
            "The kilowatt-hours consumed",
            "The number of appliances",
            "The time in hours"
        ],
        correct: 1
    },
    {
        question: "Why are piecewise functions useful in real-world modeling?",
        options: [
            "They simplify calculations",
            "They allow different rules for different conditions or intervals",
            "They always produce linear graphs",
            "They eliminate the need for variables"
        ],
        correct: 1
    }
];

const slpLesson2Quiz = [
    {
        question: "What is the profit function formula?",
        options: [
            "P(x) = R(x) + C(x)",
            "P(x) = R(x) - C(x)",
            "P(x) = R(x) × C(x)",
            "P(x) = R(x) / C(x)"
        ],
        correct: 1
    },
    {
        question: "If R(x) = 15,000x and C(x) = 50,000 + 8,000x, what is the profit function?",
        options: [
            "P(x) = 7,000x - 50,000",
            "P(x) = 7,000x + 50,000",
            "P(x) = 23,000x - 50,000",
            "P(x) = 23,000x + 50,000"
        ],
        correct: 0
    },
    {
        question: "What is the break-even point?",
        options: [
            "Where profit is maximum",
            "Where revenue equals cost (no profit, no loss)",
            "Where cost is minimum",
            "Where revenue is maximum"
        ],
        correct: 1
    },
    {
        question: "If a company has fixed costs of ₱50,000, variable costs of ₱8,000 per unit, and sells at ₱15,000 per unit, what is the break-even quantity?",
        options: [
            "5 units",
            "7 units",
            "8 units",
            "10 units"
        ],
        correct: 2
    },
    {
        question: "What does the cost function C(x) = FC + VC(x) represent?",
        options: [
            "Total cost equals fixed cost plus variable cost per unit times quantity",
            "Total cost equals fixed cost minus variable cost",
            "Total cost equals variable cost only",
            "Total cost equals fixed cost only"
        ],
        correct: 0
    }
];

const slpLesson3Quiz = [
    {
        question: "What type of function models population growth?",
        options: [
            "Linear function",
            "Exponential function",
            "Quadratic function",
            "Constant function"
        ],
        correct: 1
    },
    {
        question: "In the population growth model P(t) = P₀ × e^(rt), what does r represent?",
        options: [
            "Initial population",
            "Time",
            "Growth rate",
            "Final population"
        ],
        correct: 2
    },
    {
        question: "What is Newton's Law of Cooling used to model?",
        options: [
            "Population growth",
            "Temperature change over time",
            "Radioactive decay",
            "Projectile motion"
        ],
        correct: 1
    },
    {
        question: "In the projectile motion function h(t) = h₀ + v₀t - ½gt², what does g represent?",
        options: [
            "Initial height",
            "Initial velocity",
            "Gravity constant (9.8 m/s²)",
            "Time"
        ],
        correct: 2
    },
    {
        question: "What type of function is typically used to model radioactive decay?",
        options: [
            "Linear decay",
            "Exponential decay",
            "Quadratic decay",
            "Logarithmic decay"
        ],
        correct: 1
    }
];

const slpLesson4Quiz = [
    {
        question: "What is the first step in solving complex real-life problems?",
        options: [
            "Solve immediately",
            "Understand the problem and identify what's given and asked",
            "Guess the answer",
            "Skip to the solution"
        ],
        correct: 1
    },
    {
        question: "In linear programming optimization, what method is used to find the maximum or minimum?",
        options: [
            "Evaluate at all corner points of the feasible region",
            "Use only the center point",
            "Random selection",
            "Use only one constraint"
        ],
        correct: 0
    },
    {
        question: "What does the objective function represent in an optimization problem?",
        options: [
            "The constraints",
            "The quantity to maximize or minimize",
            "The variables only",
            "The domain restrictions"
        ],
        correct: 1
    },
    {
        question: "In the problem-solving framework, what comes after 'Plan'?",
        options: [
            "Understand",
            "Solve",
            "Check",
            "Skip"
        ],
        correct: 1
    },
    {
        question: "Why is it important to check your answer in real-world problem solving?",
        options: [
            "To verify it makes sense in the real-world context",
            "To make it look longer",
            "To add extra steps",
            "It's not important"
        ],
        correct: 0
    }
];

// Initialize lesson UX (adds controls, wires clicks, loads completion)
document.addEventListener('DOMContentLoaded', async function() {
    try {
        slpInjectLessonControls();

        // Initial state
        slpShowLesson(1, false);
        slpUpdateNavigationButtons();
        await slpLoadCompletedLessons();
        
        // Start timer tracking after account loads
        await slpStartStudyTimeTracking();
    } catch (_) {
        // Non-fatal if structure differs
    }
});

function slpInjectLessonControls() {
    for (let i = 1; i <= slpTotalLessons; i++) {
        const section = document.getElementById(`lesson${i}`);
        if (!section) continue;
        const container = section.querySelector('.bg-white.rounded-2xl.shadow-xl.p-8.mb-8') || section;

        // Navigation controls - place at bottom after References section
        if (!section.querySelector('#lessonProgressBar')) {
            const progressPct = Math.round((i / slpTotalLessons) * 100);
            const nav = document.createElement('div');
            
            // Match functions.html layout: centered for first/last lesson, justify-between for middle lessons
            if (i === 1) {
                // First lesson: Only Next button (centered)
                nav.className = 'flex justify-center items-center mb-8';
                nav.innerHTML = `
                    <div class=\"flex items-center space-x-4\"> 
                        <div class=\"text-center\"> 
                            <div class=\"text-sm text-gray-600\">Topic Progress</div>
                            <div class=\"text-lg font-semibold text-primary\"> 
                                <span id=\"currentLessonNum\">${i}</span> of ${slpTotalLessons}
                            </div>
                        </div>
                        <div class=\"w-32 bg-gray-200 rounded-full h-2\"> 
                            <div id=\"lessonProgressBar\" class=\"bg-primary h-2 rounded-full transition-all duration-300\" style=\"width: ${progressPct}%\"></div>
                        </div>
                    </div>
                    <button id=\"nextLessonBtn\" onclick=\"navigateLesson(1)\" 
                            class=\"flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-8\"> 
                        Next Topic<i class=\"fas fa-chevron-right ml-2\"></i>
                    </button>`;
            } else if (i === slpTotalLessons) {
                // Last lesson: Only Previous button (centered)
                nav.className = 'flex justify-center items-center mb-8';
                nav.innerHTML = `
                    <button id=\"prevLessonBtn\" onclick=\"navigateLesson(-1)\" 
                            class=\"flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed\"> 
                        <i class=\"fas fa-chevron-left mr-2\"></i>Previous Topic
                    </button>
                    <div class=\"flex items-center space-x-4 ml-8\"> 
                        <div class=\"text-center\"> 
                            <div class=\"text-sm text-gray-600\">Topic Progress</div>
                            <div class=\"text-lg font-semibold text-primary\"> 
                                <span id=\"currentLessonNum\">${i}</span> of ${slpTotalLessons}
                            </div>
                        </div>
                        <div class=\"w-32 bg-gray-200 rounded-full h-2\"> 
                            <div id=\"lessonProgressBar\" class=\"bg-primary h-2 rounded-full transition-all duration-300\" style=\"width: ${progressPct}%\"></div>
                        </div>
                    </div>`;
            } else {
                // Middle lessons: Both buttons (justify-between)
            nav.className = 'flex justify-between items-center mb-8';
            nav.innerHTML = `
                <button id=\"prevLessonBtn\" onclick=\"navigateLesson(-1)\" 
                        class=\"flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed\"> 
                        <i class=\"fas fa-chevron-left mr-2\"></i>Previous Topic
                </button>
                <div class=\"flex items-center space-x-4\"> 
                    <div class=\"text-center\"> 
                            <div class=\"text-sm text-gray-600\">Topic Progress</div>
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
                        Next Topic<i class=\"fas fa-chevron-right ml-2\"></i>
                </button>`;
            }
            
            // Find References section or append at the end
            const referencesSection = container.querySelector(`#lesson${i}-reference`);
            if (referencesSection) {
                // Insert after References section
                referencesSection.parentNode.insertBefore(nav, referencesSection.nextSibling);
            } else {
                // If no References section, append at the end
                container.appendChild(nav);
            }
        }
    }
}

function slpShowLesson(lessonNum, scrollToTop = false) {
    slpCurrentLesson = lessonNum;
    const lessonSections = document.querySelectorAll('.lesson-section');
    
    // Update sidebar - expand current topic, collapse others
    document.querySelectorAll('.lesson-topic').forEach(t => {
        const n = parseInt(t.dataset.lesson, 10);
        if (n === lessonNum) {
            t.classList.add('expanded');
            t.querySelector('.lesson-topic-header')?.setAttribute('aria-expanded', 'true');
        } else {
            t.classList.remove('expanded');
            t.querySelector('.lesson-topic-header')?.setAttribute('aria-expanded', 'false');
        }
    });
    
    lessonSections.forEach(s => s.classList.remove('active'));
    document.getElementById(`lesson${lessonNum}`)?.classList.add('active');

    // Set sidebar active to objective by default
    setSidebarActive(lessonNum, 'objective');
    updateSidebarProgress();
    
    // Initialize timer for current lesson (only if not completed)
    if (slpCurrentLesson && !slpCompletedLessons.has(slpCurrentLesson)) {
        const now = Date.now();
        if (!slpLessonStartTime[slpCurrentLesson]) {
            slpLessonStartTime[slpCurrentLesson] = now;
        }
        // Ensure lastSavedTime and lastSaveTimestamp are initialized
        if (slpLastSavedTime[slpCurrentLesson] === undefined) {
            slpLastSavedTime[slpCurrentLesson] = slpTotalStudyTime[slpCurrentLesson] || 0;
        }
        if (!slpLastSaveTimestamp[slpCurrentLesson]) {
            slpLastSaveTimestamp[slpCurrentLesson] = now;
        }
    } else if (slpCurrentLesson && slpCompletedLessons.has(slpCurrentLesson)) {
        // If lesson is completed, clear start time and save timestamp to prevent timer from running
        slpLessonStartTime[slpCurrentLesson] = null;
        slpLastSaveTimestamp[slpCurrentLesson] = null;
    }
    
    // Restart live timer for new lesson
    slpStartLiveTimer();

    slpUpdateProgressIndicators();
    slpUpdateNavigationButtons();
    if (scrollToTop) slpScrollToTopOfLesson();
}

function navigateLesson(direction) {
    const target = slpCurrentLesson + direction;
    
    // If trying to go to next lesson, show quiz first (unless already completed)
    if (slpCurrentLesson === 1 && direction === 1 && !slpCompletedLessons.has(1)) {
        slpShowLesson1Quiz();
        return;
    }
    if (slpCurrentLesson === 2 && direction === 1 && !slpCompletedLessons.has(2)) {
        slpRunLessonQuiz(slpLesson2Quiz, 2, () => setTimeout(() => slpShowLesson(3, true), 300));
        return;
    }
    if (slpCurrentLesson === 3 && direction === 1 && !slpCompletedLessons.has(3)) {
        slpRunLessonQuiz(slpLesson3Quiz, 3, () => setTimeout(() => slpShowLesson(4, true), 300));
        return;
    }
    if (slpCurrentLesson === 4 && direction === 1 && !slpCompletedLessons.has(4)) {
        slpRunLessonQuiz(slpLesson4Quiz, 4, () => {
            // After passing Lesson 4, check if all lessons are completed
            setTimeout(() => {
                if (slpCompletedLessons.size === slpTotalLessons) {
                    slpShowTopicCompletionOption();
                }
            }, 500);
        });
        return;
    }
    
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

// ==========================================
// TIMER FUNCTIONS
// ==========================================

/**
 * Start study time tracking (only when account loads)
 */
async function slpStartStudyTimeTracking() {
    // Verify user is authenticated before starting timer
    try {
        const response = await fetch('../php/get-study-time.php?topic=solving-real-life-problems', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.warn('User not authenticated, timer will not start');
            return; // Don't start timer if user is not authenticated
        }
        
        const data = await response.json();
        if (!data.success) {
            console.warn('Failed to verify user authentication, timer will not start');
            return; // Don't start timer if authentication check fails
        }
        
        // User is authenticated, proceed with timer initialization
        console.log('User authenticated, starting timer tracking');
        
        // Load existing study time from server
        await slpLoadAndDisplayStudyTime();
    } catch (error) {
        console.error('Error verifying user authentication:', error);
        return; // Don't start timer if there's an error
    }
    
    // Initialize time tracking for current lesson (only if not completed)
    if (slpCurrentLesson && !slpCompletedLessons.has(slpCurrentLesson)) {
        const now = Date.now();
        if (!slpLessonStartTime[slpCurrentLesson]) {
            slpLessonStartTime[slpCurrentLesson] = now;
        }
        // Initialize lastSavedTime and lastSaveTimestamp if not set (will be set when loading from server)
        if (slpLastSavedTime[slpCurrentLesson] === undefined) {
            slpLastSavedTime[slpCurrentLesson] = slpTotalStudyTime[slpCurrentLesson] || 0;
            slpLastSaveTimestamp[slpCurrentLesson] = now;
        }
    }
    
    // Clear any existing interval (timer will only save when quiz is completed)
    if (slpStudyTimeInterval) {
        clearInterval(slpStudyTimeInterval);
        slpStudyTimeInterval = null;
    }
    
    // Start live timer display (updates every second for display only, no auto-saving)
    slpStartLiveTimer();
}

/**
 * Start live timer that updates every second
 */
function slpStartLiveTimer() {
    // Clear existing timer
    if (slpTimerUpdateInterval) {
        clearInterval(slpTimerUpdateInterval);
        slpTimerUpdateInterval = null;
    }
    
    // Don't start timer if there's no current lesson
    if (!slpCurrentLesson) {
        return;
    }
    
    // Don't start timer if lesson is already completed
    if (slpCompletedLessons.has(slpCurrentLesson)) {
        slpUpdateLiveTimer(); // Just show final time
        return;
    }
    
    // Update timer immediately
    slpUpdateLiveTimer();
    
    // Update timer every second
    slpTimerUpdateInterval = setInterval(function() {
        // Stop if lesson becomes completed or no current lesson
        if (!slpCurrentLesson || slpCompletedLessons.has(slpCurrentLesson)) {
            clearInterval(slpTimerUpdateInterval);
            slpTimerUpdateInterval = null;
            slpUpdateLiveTimer(); // Show final time
            return;
        }
        slpUpdateLiveTimer();
    }, 1000);
}

/**
 * Update live timer display for current lesson
 */
function slpUpdateLiveTimer() {
    if (!slpCurrentLesson) return;
    
    // Don't update timer if lesson is already completed
    if (slpCompletedLessons.has(slpCurrentLesson)) {
        // Show final time for completed lesson
        let finalTime = slpTotalStudyTime[slpCurrentLesson] || 0;
        
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
            timeDisplay = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            timeDisplay = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        
        const activeSection = document.getElementById(`lesson${slpCurrentLesson}`);
        if (activeSection) {
            const timer = activeSection.querySelector('.lesson-timer-display');
            if (timer) {
                timer.textContent = timeDisplay;
            }
        }
        return;
    }
    
    // For active lessons, calculate time accurately
    // Use lastSavedTime (confirmed saved to server) + elapsed since last save
    const baseTime = slpLastSavedTime[slpCurrentLesson] || 0; // This is the last confirmed saved time from server
    
    // Calculate elapsed time since last save (or since lesson started if no save yet)
    let currentSessionElapsed = 0;
    const saveStartTime = slpLastSaveTimestamp[slpCurrentLesson] || slpLessonStartTime[slpCurrentLesson];
    if (saveStartTime) {
        const now = Date.now();
        const elapsedMs = now - saveStartTime;
        currentSessionElapsed = Math.floor(elapsedMs / 1000); // in seconds
        
        // Cap current session at 2 hours to prevent unreasonable values
        if (currentSessionElapsed > 7200) {
            console.warn(`Session elapsed time too large (${currentSessionElapsed}s) for lesson ${slpCurrentLesson}, resetting start time`);
            slpLessonStartTime[slpCurrentLesson] = now;
            slpLastSaveTimestamp[slpCurrentLesson] = now;
            currentSessionElapsed = 0;
        }
        
        if (currentSessionElapsed < 0) {
            console.warn(`Negative elapsed time detected for lesson ${slpCurrentLesson}, resetting start time`);
            slpLessonStartTime[slpCurrentLesson] = now;
            slpLastSaveTimestamp[slpCurrentLesson] = now;
            currentSessionElapsed = 0;
        }
    }
    
    // Total time = last saved time (from server) + elapsed since last save
    // This prevents double-counting because baseTime is the confirmed saved time
    // and currentSessionElapsed is only the NEW time since last save
    const totalTime = baseTime + currentSessionElapsed;
    
    // Cap at reasonable maximum (24 hours = 86400 seconds)
    const cappedTime = Math.min(totalTime, 86400);
    
    // Format time as MM:SS or HH:MM:SS
    const hours = Math.floor(cappedTime / 3600);
    const minutes = Math.floor((cappedTime % 3600) / 60);
    const seconds = cappedTime % 60;
    
    let timeDisplay = '';
    if (hours > 0) {
        timeDisplay = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Update timer display only for the active lesson section
    const activeSection = document.getElementById(`lesson${slpCurrentLesson}`);
    if (activeSection) {
        const timer = activeSection.querySelector('.lesson-timer-display');
        if (timer) {
            timer.textContent = timeDisplay;
        }
        
        // Update circular progress (max 2 hours = 7200 seconds)
        const maxTime = 7200; // 2 hours max
        const progress = Math.min((cappedTime / maxTime) * 100, 100);
        const circumference = 2 * Math.PI * 34; // radius = 34 (smaller timer)
        const offset = circumference - (progress / 100) * circumference;
        
        const progressCircle = activeSection.querySelector('.timer-progress');
        if (progressCircle) {
            progressCircle.style.strokeDashoffset = offset;
        }
    }
}

/**
 * Save study time for current lesson
 */
function slpSaveStudyTimeForCurrentLesson(lessonNum) {
    if (!lessonNum) lessonNum = slpCurrentLesson;
    if (!lessonNum) return;
    
    // CRITICAL: Never save time for completed lessons
    if (slpCompletedLessons.has(lessonNum)) {
        console.log(`Lesson ${lessonNum} is completed, skipping timer save`);
        return;
    }
    
    // Use lastSaveTimestamp if available, otherwise use lessonStartTime
    const saveStartTime = slpLastSaveTimestamp[lessonNum] || slpLessonStartTime[lessonNum];
    if (!saveStartTime) return;
    
    const now = Date.now();
    const elapsed = Math.floor((now - saveStartTime) / 1000); // in seconds
    
    // Only add time if it's reasonable (less than 2 hours per session)
    if (elapsed > 0 && elapsed < 7200) {
        // Get the last confirmed saved time (from server)
        const baseTime = slpLastSavedTime[lessonNum] || 0;
        
        // Calculate new total: last saved time + NEW elapsed time since last save
        const newTotalTime = baseTime + elapsed;
        
        // Update both totalStudyTime and lastSavedTime
        slpTotalStudyTime[lessonNum] = newTotalTime;
        slpLastSavedTime[lessonNum] = newTotalTime;
        slpLastSaveTimestamp[lessonNum] = now;
        
        // Send to server immediately (only when quiz is completed)
        slpSendStudyTimeToServer();
    } else if (elapsed >= 7200) {
        // If elapsed time is too large, reset everything (likely page was left open)
        console.warn(`Elapsed time too large (${elapsed}s) for lesson ${lessonNum}, resetting start time`);
        slpLessonStartTime[lessonNum] = now;
        slpLastSaveTimestamp[lessonNum] = now;
    }
}

/**
 * Send study time to server
 */
async function slpSendStudyTimeToServer() {
    try {
        const studyTimeData = {};
        for (let lesson = 1; lesson <= slpTotalLessons; lesson++) {
            // Only send time for lessons that are not completed
            if (!slpCompletedLessons.has(lesson) && slpTotalStudyTime[lesson] && slpTotalStudyTime[lesson] > 0) {
                studyTimeData[lesson] = slpTotalStudyTime[lesson];
            }
        }
        
        if (Object.keys(studyTimeData).length === 0) return;
        
        const response = await fetch('../php/store-study-time.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                topic: 'solving-real-life-problems',
                study_time: studyTimeData
            }),
            credentials: 'include'
        });
        
        if (response.ok) {
            console.log('Study time saved successfully');
            // Update lastSavedTime and lastSaveTimestamp with what we just saved
            const now = Date.now();
            for (let lesson in studyTimeData) {
                const lessonNum = parseInt(lesson);
                if (studyTimeData[lesson] > (slpLastSavedTime[lessonNum] || 0)) {
                    slpLastSavedTime[lessonNum] = studyTimeData[lesson];
                    slpTotalStudyTime[lessonNum] = studyTimeData[lesson];
                    slpLastSaveTimestamp[lessonNum] = now;
                }
            }
        }
    } catch (error) {
        console.error('Error saving study time:', error);
    }
}

/**
 * Load and display study time from server
 */
async function slpLoadAndDisplayStudyTime() {
    try {
        const response = await fetch('../php/get-study-time.php?topic=solving-real-life-problems', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.studyTime) {
            // IMPORTANT: When loading from server, set totalStudyTime and lastSavedTime directly
            const now = Date.now();
            for (let lesson = 1; lesson <= slpTotalLessons; lesson++) {
                if (data.studyTime[lesson] !== undefined) {
                    let seconds = parseInt(data.studyTime[lesson]) || 0;
                    
                    // Ensure seconds is actually in seconds, not milliseconds
                    if (seconds > 86400) {
                        const asSeconds = Math.floor(seconds / 1000);
                        if (asSeconds <= 86400) {
                            seconds = asSeconds;
                        } else {
                            seconds = 86400;
                        }
                    }
                    
                    // Set totalStudyTime and lastSavedTime directly from server (this is the total accumulated time)
                    slpTotalStudyTime[lesson] = seconds;
                    slpLastSavedTime[lesson] = seconds;
                    // Update lastSaveTimestamp to now so we know when we last synced with server
                    slpLastSaveTimestamp[lesson] = now;
                    
                    // Reset lessonStartTime to now if we just updated from server
                    // This prevents adding the current session's elapsed time again
                    if (!slpCompletedLessons.has(lesson)) {
                        slpLessonStartTime[lesson] = now;
                    }
                }
            }
            slpUpdateLiveTimer();
        }
    } catch (error) {
        console.error('Error loading study time:', error);
    }
}

// ==========================================
// QUIZ FUNCTIONS
// ==========================================

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Shuffle quiz questions and options
function shuffleQuiz(quizArray) {
    // Shuffle questions
    const shuffledQuestions = shuffleArray(quizArray);
    
    // Shuffle options for each question and update correct answer index
    return shuffledQuestions.map(quiz => {
        const originalOptions = [...quiz.options];
        const originalCorrect = quiz.correct;
        
        // Create array of indices and shuffle them
        const indices = originalOptions.map((_, i) => i);
        const shuffledIndices = shuffleArray(indices);
        
        // Map original correct index to new shuffled index
        const newCorrectIndex = shuffledIndices.indexOf(originalCorrect);
        
        // Create new options array with shuffled order
        const shuffledOptions = shuffledIndices.map(idx => originalOptions[idx]);
        
        return {
            ...quiz,
            options: shuffledOptions,
            correct: newCorrectIndex
        };
    });
}

// Quiz Functions
function slpRunLessonQuiz(quizArray, lessonNum, onPassed) {
    // Track quiz start time
    window.quizStartTime = Date.now();
    
    // Shuffle quiz questions and options
    const shuffledQuiz = shuffleQuiz(quizArray);
    
    let currentQuestion = 0;
    let score = 0;
    let userAnswers = [];

    Swal.fire({
        title: `📚 Lesson ${lessonNum} Quiz`,
        html: `
            <div class="text-left space-y-4">${typeof mathEaseQuizIntroBanner === 'function' ? mathEaseQuizIntroBanner() : ''}
                <div class="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-5 border-l-4 border-primary">
                    <h3 class="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <i class="fas fa-info-circle text-primary mr-2"></i>
                        Quiz Instructions
                    </h3>
                    <p class="text-gray-700 mb-2">
                        You will answer <strong>5 questions</strong> for Lesson ${lessonNum}.
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
    }).then((result) => {
        if (result.isConfirmed) {
            window.quizStartTime = Date.now(); // Start timer when user actually starts questions
            displayQuestion();
        } else {
            slpShowLesson(lessonNum, true);
        }
    });

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
                // Capture current question index and quiz data in closure
                const questionIndex = currentQuestion;
                const currentQuiz = shuffledQuiz[questionIndex];
                
                document.querySelectorAll('.quiz-option').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const selectedAnswer = parseInt(this.dataset.answer);
                        userAnswers[questionIndex] = {
                            question: currentQuiz.question,
                            options: currentQuiz.options,
                            selected: selectedAnswer,
                            selectedText: currentQuiz.options[selectedAnswer],
                            correct: currentQuiz.correct,
                            correctText: currentQuiz.options[currentQuiz.correct],
                            isCorrect: selectedAnswer === currentQuiz.correct
                        };
                        if (selectedAnswer === currentQuiz.correct) score++;
                        document.querySelectorAll('.quiz-option').forEach(b => b.disabled = true);
                        setTimeout(() => {
                            currentQuestion++;
                            displayQuestion();
                        }, 500);
                    });
                });
            }
        }).then((result) => {
            if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
                if (typeof mathEaseConfirmTopicQuizCancel === 'function') {
                    mathEaseConfirmTopicQuizCancel().then((cr) => {
                        if (cr.isConfirmed) slpShowLesson(lessonNum, true);
                        else displayQuestion();
                    });
                } else {
                    slpShowLesson(lessonNum, true);
                }
            }
        });
    }

    function showQuizResults() {
        const percentage = Math.round((score / shuffledQuiz.length) * 100);
        const passed = score >= 3;

        Swal.fire({
            title: passed ? '🎉 Congratulations!' : '📚 Keep Learning!',
            html: `
                <div class="text-center">
                    <div class="mb-6">
                        <div class="inline-flex items-center justify-center w-24 h-24 rounded-full ${passed ? 'bg-green-100' : 'bg-red-100'} mb-4">
                            <span class="text-4xl">${passed ? '✓' : '✗'}</span>
                        </div>
                        <p class="text-3xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}">
                            Score: ${score}/${shuffledQuiz.length}
                        </p>
                        <p class="text-xl font-semibold ${passed ? 'text-green-600' : 'text-red-600'}">
                            ${percentage}%
                        </p>
                    </div>
                    ${passed
                        ? `<p class="text-lg text-gray-700 mb-4">Great job! Lesson ${lessonNum} is now completed.</p>`
                        : `<p class="text-lg text-gray-700 mb-4">You need at least 60% (3/5). Review Lesson ${lessonNum} and try again.</p>`
                    }
                </div>
            `,
            icon: passed ? 'success' : 'error',
            confirmButtonText: passed ? 'Continue' : `Review Lesson ${lessonNum}`,
            confirmButtonColor: passed ? '#10b981' : '#667eea',
            allowOutsideClick: false,
            width: '600px',
            customClass: {
                popup: 'rounded-2xl',
                title: 'text-slate-800',
                htmlContainer: 'text-center'
            }
        }).then(async (result) => {
            if (result.isConfirmed && passed) {
                try {
                    // Stop timer before completing lesson
                    if (slpLessonStartTime[lessonNum]) {
                        slpSaveStudyTimeForCurrentLesson(lessonNum);
                        slpLessonStartTime[lessonNum] = null;
                        slpLastSaveTimestamp[lessonNum] = null;
                    }
                    
                    await slpStoreQuizData(lessonNum, score, shuffledQuiz.length, userAnswers);
                    await completeLesson(lessonNum);
                    
                    if (lessonNum === 4) {
                        setTimeout(() => {
                            if (slpCompletedLessons.size === slpTotalLessons) {
                                slpShowTopicCompletionOption();
                            }
                        }, 500);
                    }
                } catch (e) {
                    console.error('Error storing quiz data:', e);
                }
                if (typeof onPassed === 'function') onPassed();
            } else {
                try {
                    await slpStoreQuizData(lessonNum, score, shuffledQuiz.length, userAnswers);
                } catch (e) {
                    console.error('Error storing quiz data:', e);
                }
                slpShowLesson(lessonNum, true);
            }
        });
    }
}

// Show Lesson 1 Quiz
function slpShowLesson1Quiz() {
    if (slpCompletedLessons.has(1)) {
        slpShowLesson(2, true);
        return;
    }
    
    // Track quiz start time
    window.quizStartTime = Date.now();
    
    // Shuffle quiz questions and options
    const shuffledQuiz = shuffleQuiz(slpLesson1Quiz);
    
    let currentQuestion = 0;
    let score = 0;
    let userAnswers = [];

    Swal.fire({
        title: '📚 Lesson 1 Quiz',
        html: `
            <div class="text-left space-y-4">${typeof mathEaseQuizIntroBanner === 'function' ? mathEaseQuizIntroBanner() : ''}
                <div class="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-5 border-l-4 border-primary">
                    <h3 class="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <i class="fas fa-info-circle text-primary mr-2"></i>
                        Quiz Instructions
                    </h3>
                    <p class="text-gray-700 mb-2">
                        You will answer <strong>5 questions</strong> for Lesson 1.
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
                
                <div class="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-5 border-l-4 border-yellow-500">
                    <h4 class="text-lg font-bold text-gray-800 mb-2">
                        <i class="fas fa-trophy text-yellow-500 mr-2"></i>Quiz Requirements
                    </h4>
                    <div class="space-y-2 text-sm text-gray-700">
                        <p><strong>Total Questions:</strong> 5 questions about Lesson 1</p>
                        <p><strong>Passing Score:</strong> At least 3 out of 5 correct answers (60%)</p>
                        <p><strong>What Happens:</strong></p>
                        <ul class="list-disc list-inside ml-4 space-y-1">
                            <li>If you pass → You can proceed to Lesson 2</li>
                            <li>If you fail → You'll need to review Lesson 1 and try again</li>
                        </ul>
                    </div>
                </div>
                
                <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-l-4 border-green-500">
                    <p class="text-sm text-gray-700">
                        <i class="fas fa-lightbulb text-green-500 mr-2"></i>
                        <strong>Tip:</strong> Take your time and read each question carefully. These questions help ensure you have a solid foundation before moving forward!
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
    }).then((result) => {
        if (result.isConfirmed) {
            window.quizStartTime = Date.now(); // Start timer when user actually starts questions
            displayQuestion();
        } else {
            slpShowLesson(1, true);
        }
    });

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
                    <div class="space-y-3">
                        ${optionsHtml}
                    </div>
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
                // Capture current question index and quiz data in closure
                const questionIndex = currentQuestion;
                const currentQuiz = shuffledQuiz[questionIndex];
                
                document.querySelectorAll('.quiz-option').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const selectedAnswer = parseInt(this.dataset.answer);
                        userAnswers[questionIndex] = {
                            question: currentQuiz.question,
                            options: currentQuiz.options,
                            selected: selectedAnswer,
                            selectedText: currentQuiz.options[selectedAnswer],
                            correct: currentQuiz.correct,
                            correctText: currentQuiz.options[currentQuiz.correct],
                            isCorrect: selectedAnswer === currentQuiz.correct
                        };
                        
                        if (selectedAnswer === currentQuiz.correct) {
                            score++;
                        }
                        
                        document.querySelectorAll('.quiz-option').forEach(b => b.disabled = true);
                        
                        setTimeout(() => {
                            currentQuestion++;
                            displayQuestion();
                        }, 500);
                    });
                });
            }
        }).then((result) => {
            if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
                if (typeof mathEaseConfirmTopicQuizCancel === 'function') {
                    mathEaseConfirmTopicQuizCancel().then((cr) => {
                        if (cr.isConfirmed) slpShowLesson(1, true);
                        else displayQuestion();
                    });
                } else {
                    slpShowLesson(1, true);
                }
            }
        });
    }

    function showQuizResults() {
        const percentage = Math.round((score / shuffledQuiz.length) * 100);
        const passed = score >= 3;

        Swal.fire({
            title: passed ? '🎉 Congratulations!' : '📚 Keep Learning!',
            html: `
                <div class="text-center">
                    <div class="mb-6">
                        <div class="inline-flex items-center justify-center w-24 h-24 rounded-full ${passed ? 'bg-green-100' : 'bg-red-100'} mb-4">
                            <span class="text-4xl">${passed ? '✓' : '✗'}</span>
                        </div>
                        <p class="text-3xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}">
                            Score: ${score}/${shuffledQuiz.length}
                        </p>
                        <p class="text-xl font-semibold ${passed ? 'text-green-600' : 'text-red-600'}">
                            ${percentage}%
                        </p>
                    </div>
                    ${passed ? 
                        '<p class="text-lg text-gray-700 mb-4">Great job! You understand the topic. You can now proceed to Lesson 2.</p>' :
                        '<p class="text-lg text-gray-700 mb-4">You need to score at least 60% (3/5) to proceed. Please review Lesson 1 and try again!</p>'
                    }
                </div>
            `,
            icon: passed ? 'success' : 'error',
            confirmButtonText: passed ? 'Continue to Lesson 2' : 'Review Lesson 1',
            confirmButtonColor: passed ? '#10b981' : '#667eea',
            allowOutsideClick: false,
            width: '600px',
            customClass: {
                popup: 'rounded-2xl',
                title: 'text-slate-800',
                htmlContainer: 'text-center'
            }
        }).then(async (result) => {
            if (result.isConfirmed && passed) {
                try {
                    // Stop timer before completing lesson
                    if (slpLessonStartTime[1]) {
                        slpSaveStudyTimeForCurrentLesson(1);
                        slpLessonStartTime[1] = null;
                        slpLastSaveTimestamp[1] = null;
                    }
                    
                    await slpStoreQuizData(1, score, shuffledQuiz.length, userAnswers);
                    await completeLesson(1);
                    setTimeout(() => {
                        slpShowLesson(2, true);
                    }, 500);
                } catch (error) {
                    console.error('Error completing lesson:', error);
                    slpShowLesson(2, true);
                }
            } else if (!passed) {
                try {
                    await slpStoreQuizData(1, score, shuffledQuiz.length, userAnswers);
                } catch (e) {
                    console.error('Error storing quiz data:', e);
                }
                slpShowLesson(1, true);
            }
        });
    }
}

// Store quiz data to database
async function slpStoreQuizData(lessonNum, score, totalQuestions, userAnswers) {
    try {
        const response = await fetch('../php/store-quiz-data.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                topic: 'solving-real-life-problems',
                lesson: lessonNum,
                quiz_type: `solving_real_life_problems_lesson_${lessonNum}`,
                score: score,
                total_questions: totalQuestions,
                answers: userAnswers
            }),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            console.warn('Quiz data storage warning:', data.message);
        }
        
        // Show performance analysis section after completing all lessons
        if (lessonNum === slpTotalLessons && slpCompletedLessons.size === slpTotalLessons) {
            setTimeout(() => {
                showPerformanceAnalysisSection();
            }, 1000);
        }
    } catch (error) {
        console.error('Error storing quiz data:', error);
    }
}

async function completeLesson(lessonNum) {
    console.log('Attempting to complete lesson:', lessonNum);
    
    try {
        if (slpCompletedLessons.has(lessonNum)) {
            return;
        }
        
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
            return;
        }
        
        if (data.success) {
            console.log('Lesson completion successful');
            
            // CRITICAL: Save final study time BEFORE marking as completed
            // This ensures the final time is saved to the database when quiz is passed
            const now = Date.now();
            const saveStartTime = slpLastSaveTimestamp[lessonNum] || slpLessonStartTime[lessonNum];
            
            if (saveStartTime) {
                const elapsed = Math.floor((now - saveStartTime) / 1000); // in seconds
                
                if (elapsed > 0 && elapsed < 7200) {
                    // Get last confirmed saved time (from server)
                    const baseTime = slpLastSavedTime[lessonNum] || 0;
                    // Calculate final total time: last saved + elapsed since last save
                    const finalTotalTime = baseTime + elapsed;
                    
                    // Update local tracking
                    slpTotalStudyTime[lessonNum] = finalTotalTime;
                    slpLastSavedTime[lessonNum] = finalTotalTime;
                    
                    // Force save final time to server immediately
                    console.log(`Saving final study time for lesson ${lessonNum} after quiz pass: ${elapsed}s elapsed, total: ${finalTotalTime}s`);
                    try {
                        const response = await fetch('../php/store-study-time.php', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                topic: 'solving-real-life-problems',
                                study_time: {
                                    [lessonNum]: finalTotalTime
                                },
                                is_final: true
                            }),
                            credentials: 'include'
                        });
                        
                        if (response.ok) {
                            const result = await response.json();
                            console.log('Final study time saved successfully after quiz pass:', result);
                        }
                    } catch (error) {
                        console.error('Error sending final study time:', error);
                    }
                }
                
                // CRITICAL: Clear start time and save timestamp to prevent further timer updates
                slpLessonStartTime[lessonNum] = null;
                slpLastSaveTimestamp[lessonNum] = null;
            } else {
                // If no start time, just save current total time
                const finalTotalTime = slpTotalStudyTime[lessonNum] || 0;
                if (finalTotalTime > 0) {
                    console.log(`Saving final study time for lesson ${lessonNum} (no active session): ${finalTotalTime}s`);
                    slpLastSavedTime[lessonNum] = finalTotalTime;
                    try {
                        const response = await fetch('../php/store-study-time.php', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                topic: 'solving-real-life-problems',
                                study_time: {
                                    [lessonNum]: finalTotalTime
                                },
                                is_final: true
                            }),
                            credentials: 'include'
                        });
                        
                        if (response.ok) {
                            console.log('Final study time saved successfully');
                        }
                    } catch (error) {
                        console.error('Error sending final study time:', error);
                    }
                }
            }
            
            // Add to completed lessons AFTER saving time
            slpCompletedLessons.add(lessonNum);
            
            slpUpdateLessonCompletionStatus();
            updateSidebarProgress();
            
            // Show performance analysis if all lessons completed
            if (slpCompletedLessons.size === slpTotalLessons) {
                setTimeout(() => {
                    showPerformanceAnalysisSection();
                }, 500);
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
            updateSidebarProgress();
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

// ==========================================
// CUSTOM AI PERFORMANCE ANALYSIS
// ==========================================

/**
 * Analyze quiz performance using custom AI
 */
async function analyzePerformance() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultSection = document.getElementById('analysisResult');
    
    // Show loading state
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
    }
    
    try {
        const response = await fetch(`../php/analyze-quiz-performance.php?topic=solving-real-life-problems`, {
            method: 'GET',
            credentials: 'include'
        });
        
        // Get response text first to see what we got
        const responseText = await response.text();
        console.log('Raw response:', responseText.substring(0, 500));
        
        if (!response.ok) {
            // Try to parse error message
            let errorMessage = `Server error: ${response.status} ${response.statusText}`;
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.message || errorMessage;
                if (errorData.debug) {
                    errorMessage += '\n\nDebug: ' + errorData.debug;
                }
            } catch (e) {
                // Not JSON, use raw text
                errorMessage = responseText.substring(0, 200);
            }
            throw new Error(errorMessage);
        }
        
        const result = JSON.parse(responseText);
        
        if (result.success && result.analysis) {
            displayPerformanceAnalysis(result.analysis);
            
            Swal.fire({
                title: 'Analysis Complete!',
                text: 'Your performance analysis has been completed.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            throw new Error(result.message || 'Failed to analyze performance');
        }
        
    } catch (error) {
        console.error('Performance Analysis Error:', error);
        
        Swal.fire({
            title: 'Analysis Error',
            html: `
                <div class="text-left">
                    <p class="text-gray-700 mb-3"><strong>Error:</strong> ${error.message}</p>
                    <p class="text-sm text-gray-600 mb-3">Unable to analyze your performance right now. Please try again later.</p>
                    <p class="text-sm text-gray-600 mb-3">Make sure you have completed at least one quiz before analyzing.</p>
                </div>
            `,
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#667eea'
        });
    } finally {
        // Reset button
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-chart-bar mr-2"></i>Analyze My Performance';
        }
    }
}

/**
 * Display performance analysis results
 */
function displayPerformanceAnalysis(analysis) {
    const resultSection = document.getElementById('analysisResult');
    if (!resultSection) return;
    
    const overallAverage = analysis.overallAverage || 0;
    const totalQuizzes = analysis.totalQuizzes || 0;
    const strengths = analysis.strengths || [];
    const weaknesses = analysis.weaknesses || [];
    const correctAnswers = analysis.correctAnswers || [];
    const incorrectAnswers = analysis.incorrectAnswers || [];
    const recommendations = analysis.recommendations || [];
    const topicPerformance = analysis.topicPerformance || {};
    
    // Build HTML
    let html = `
        <div class="space-y-6">
            <!-- Overall Performance -->
            <div class="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border-l-4 border-indigo-500">
                <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-trophy text-indigo-500 mr-2"></i>
                    Overall Performance
                </h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-white rounded-lg p-4 text-center">
                        <div class="text-3xl font-bold text-blue-600">${overallAverage}%</div>
                        <div class="text-sm text-gray-600 mt-1">Average Score</div>
                    </div>
                    <div class="bg-white rounded-lg p-4 text-center">
                        <div class="text-3xl font-bold text-green-600">${correctAnswers.length}</div>
                        <div class="text-sm text-gray-600 mt-1">Correct</div>
                    </div>
                    <div class="bg-white rounded-lg p-4 text-center">
                        <div class="text-3xl font-bold text-red-600">${incorrectAnswers.length}</div>
                        <div class="text-sm text-gray-600 mt-1">Incorrect</div>
                    </div>
                    <div class="bg-white rounded-lg p-4 text-center">
                        <div class="text-3xl font-bold text-purple-600">${totalQuizzes}</div>
                        <div class="text-sm text-gray-600 mt-1">Quizzes Taken</div>
                    </div>
                </div>
            </div>
            
            <!-- Topic Performance -->
            <div class="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-chart-bar text-blue-500 mr-2"></i>
                    Performance per Topic
                </h4>
                <div class="space-y-4">
    `;
    
    // Display each topic performance
    for (let topicNum = 1; topicNum <= 4; topicNum++) {
        if (topicPerformance[topicNum]) {
            const perf = topicPerformance[topicNum];
            const percentage = perf.total > 0 ? Math.round((perf.correct / perf.total) * 100) : 0;
            const topicName = getTopicNameForAnalysis(topicNum);
            const colorClass = percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600';
            const borderClass = percentage >= 80 ? 'border-green-500' : percentage >= 60 ? 'border-yellow-500' : 'border-red-500';
            
            html += `
                <div class="border-l-4 ${borderClass} bg-gray-50 rounded p-4">
                    <div class="flex justify-between items-center mb-2">
                        <h5 class="font-semibold text-gray-800">${topicName}</h5>
                        <span class="text-2xl font-bold ${colorClass}">${percentage}%</span>
                    </div>
                    <div class="text-sm text-gray-600 mb-2">
                        Correct: ${perf.correct} | Incorrect: ${perf.incorrect} | Total: ${perf.total}
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-primary h-2 rounded-full transition-all" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }
    }
    
    html += `
                </div>
            </div>
            
            <!-- Strengths -->
            <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-l-4 border-green-500">
                <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-check-circle text-green-500 mr-2"></i>
                    Your Strengths
                </h4>
                ${strengths.length > 0 ? `
                    <ul class="space-y-2">
                        ${strengths.map(strength => `
                            <li class="flex items-start">
                                <span class="text-green-500 mr-2">✓</span>
                                <span class="text-gray-700">${typeof strength === 'object' && strength.message ? strength.message : strength}</span>
                            </li>
                        `).join('')}
                    </ul>
                ` : '<p class="text-gray-600">No strengths recorded yet. Take a quiz to see your strengths.</p>'}
            </div>
            
            <!-- Weaknesses -->
            <div class="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border-l-4 border-red-500">
                <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                    Areas to Improve
                </h4>
                ${weaknesses.length > 0 ? `
                    <ul class="space-y-2">
                        ${weaknesses.map(weakness => `
                            <li class="flex items-start">
                                <span class="text-red-500 mr-2">⚠</span>
                                <span class="text-gray-700">${typeof weakness === 'object' && weakness.message ? weakness.message : weakness}</span>
                            </li>
                        `).join('')}
                    </ul>
                ` : '<p class="text-gray-600">No weaknesses recorded. Keep up the great work!</p>'}
            </div>
            
            <!-- Correct Answers -->
            ${correctAnswers.length > 0 ? `
            <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-l-4 border-green-500">
                <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-check text-green-500 mr-2"></i>
                    Your Correct Answers (${correctAnswers.length})
                </h4>
                <div class="space-y-3 max-h-96 overflow-y-auto">
                    ${correctAnswers.map((answer, index) => `
                        <div class="bg-white rounded-lg p-3 border border-green-200">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <div class="font-semibold text-green-700">Topic ${answer.topic} - Q${answer.questionNum}</div>
                                    <div class="text-sm text-gray-600 mt-1">${answer.question}</div>
                                    <div class="text-sm text-gray-700 mt-2">
                                        <span class="font-semibold">Your answer:</span> ${answer.selected}
                                    </div>
                                    ${answer.explanation ? `
                                        <div class="text-sm text-gray-600 mt-3 bg-green-50 p-3 rounded border-l-2 border-green-400">
                                            <span class="font-semibold text-green-700 block mb-2">Explanation:</span>
                                            <div class="whitespace-pre-line text-gray-700">${answer.explanation}</div>
                                        </div>
                                    ` : ''}
                                </div>
                                <span class="text-green-500 text-xl ml-2">✓</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <!-- Incorrect Answers -->
            ${incorrectAnswers.length > 0 ? `
            <div class="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border-l-4 border-red-500">
                <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-times text-red-500 mr-2"></i>
                    Your Incorrect Answers (${incorrectAnswers.length})
                </h4>
                <div class="space-y-3 max-h-96 overflow-y-auto">
                    ${incorrectAnswers.map((answer, index) => `
                        <div class="bg-white rounded-lg p-4 border border-red-200">
                            <div class="flex items-start justify-between mb-2">
                                <div class="flex-1">
                                    <div class="font-semibold text-red-700">Topic ${answer.topic} - Q${answer.questionNum}</div>
                                    <div class="text-sm text-gray-700 mt-1">${answer.question}</div>
                                </div>
                                <span class="text-red-500 text-xl ml-2">✗</span>
                            </div>
                            <div class="mt-2 space-y-1">
                                <div class="text-sm">
                                    <span class="font-semibold text-red-600">Your incorrect answer:</span> 
                                    <span class="text-gray-700">${answer.selected}</span>
                                </div>
                                <div class="text-sm">
                                    <span class="font-semibold text-green-600">Correct answer:</span> 
                                    <span class="text-gray-700">${answer.correct}</span>
                                </div>
                                ${answer.explanation ? `
                                    <div class="text-sm text-gray-700 mt-3 bg-blue-50 p-3 rounded border-l-2 border-blue-400">
                                        <span class="font-semibold text-blue-700 block mb-2">Explanation:</span>
                                        <div class="whitespace-pre-line text-gray-700">${answer.explanation}</div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <!-- Recommendations -->
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-blue-500">
                <h4 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-lightbulb text-blue-500 mr-2"></i>
                    Recommendations to Improve
                </h4>
                <ul class="space-y-4">
                    ${recommendations.map((rec, index) => {
                        const hasLineBreaks = rec.includes('\n');
                        const isFocusReview = rec.includes('FOCUS REVIEW:');
                        
                        if (hasLineBreaks) {
                            const lines = rec.split('\n');
                            const mainLine = lines[0];
                            const subLines = lines.slice(1);
                            
                            return `
                                <li class="flex items-start">
                                    <span class="text-blue-500 mr-3 mt-1 font-bold">${index + 1}.</span>
                                    <div class="flex-1">
                                        <div class="text-gray-800 font-semibold mb-1">${mainLine}</div>
                                        ${subLines.map(line => `
                                            <div class="text-gray-700 text-sm ml-4 mb-1">${line}</div>
                                        `).join('')}
                                    </div>
                                </li>
                            `;
                        } else {
                            return `
                                <li class="flex items-start">
                                    <span class="text-blue-500 mr-3 mt-1 font-bold">${index + 1}.</span>
                                    <span class="text-gray-700 ${isFocusReview ? 'font-semibold text-gray-800' : ''}">${rec}</span>
                                </li>
                            `;
                        }
                    }).join('')}
                </ul>
            </div>
        </div>
    `;
    
    resultSection.innerHTML = html;
    resultSection.classList.remove('hidden');
}

/**
 * Get topic name for analysis display
 */
function getTopicNameForAnalysis(topicNum) {
    const topicNames = {
        1: 'Topic 1: Real-World Models',
        2: 'Topic 2: Business & Economics',
        3: 'Topic 3: Science & Technology',
        4: 'Topic 4: Complex Problem Solving'
    };
    return topicNames[topicNum] || `Topic ${topicNum}`;
}

/**
 * Show Performance Analysis section (only after all quizzes are completed)
 */
function showPerformanceAnalysisSection() {
    const analysisSection = document.getElementById('performanceAnalysisSection');
    if (analysisSection && slpCompletedLessons.size === slpTotalLessons) {
        analysisSection.style.display = 'block';
        setTimeout(() => {
            analysisSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }
}

// Export navigation functions
window.navigateLesson = navigateLesson;
window.completeLesson = completeLesson;
window.slpShowLesson1Quiz = slpShowLesson1Quiz;
window.slpRunLessonQuiz = slpRunLessonQuiz;
window.slpStoreQuizData = slpStoreQuizData;
window.analyzePerformance = analyzePerformance;
window.displayPerformanceAnalysis = displayPerformanceAnalysis;
window.showPerformanceAnalysisSection = showPerformanceAnalysisSection;
window.toggleUserDropdown = toggleUserDropdown;
window.toggleMobileMenu = toggleMobileMenu;
window.confirmLogout = confirmLogout;
window.loadProfilePicture = loadProfilePicture;
window.setSidebarActive = setSidebarActive;
window.updateSidebarProgress = updateSidebarProgress;
window.canAccessTopic = canAccessTopic;
window.showTopicLockedMessage = showTopicLockedMessage;