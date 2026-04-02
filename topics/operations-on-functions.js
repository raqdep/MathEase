// Operations on Functions - Interactive JavaScript

// Global variables for lesson management
let currentLesson = 1;
let completedLessons = new Set();
let totalLessons = 5;

// Study time tracking
let lessonStartTime = {};
let totalStudyTime = {}; // Track total time per lesson in seconds
let lastSavedTime = {}; // Track last confirmed saved time from server (to prevent double counting)
let lastSaveTimestamp = {}; // Track when we last saved (to calculate elapsed correctly)
let studyTimeInterval = null;
let timerUpdateInterval = null; // For live timer display

// Quiz Arrays - 5 questions per lesson
const lesson1Quiz = [
    {
        question: "What is (f + g)(x) equal to?",
        options: [
            "f(x) + g(x)",
            "f(x) - g(x)",
            "f(x) × g(x)",
            "f(x) / g(x)"
        ],
        correct: 0
    },
    {
        question: "If f(x) = 3x - 2 and g(x) = x² + 1, what is (f + g)(x)?",
        options: [
            "x² + 3x - 1",
            "x² + 3x + 1",
            "3x² - 2x + 1",
            "x² - 3x - 1"
        ],
        correct: 0
    },
    {
        question: "What is (f - g)(x) equal to?",
        options: [
            "f(x) + g(x)",
            "f(x) - g(x)",
            "f(x) × g(x)",
            "f(x) / g(x)"
        ],
        correct: 1
    },
    {
        question: "If f(x) = x² + 2 and g(x) = x + 1, what is (f - g)(x)?",
        options: [
            "x² - x + 1",
            "x² + x + 1",
            "x² - x - 1",
            "x² + x - 1"
        ],
        correct: 0
    },
    {
        question: "What is the domain of (f + g) if both f and g have domain of all real numbers?",
        options: [
            "All real numbers",
            "x > 0",
            "x ≠ 0",
            "x ≥ 0"
        ],
        correct: 0
    }
];

const lesson2Quiz = [
    {
        question: "What is (f • g)(x) equal to?",
        options: [
            "f(x) + g(x)",
            "f(x) - g(x)",
            "f(x) × g(x)",
            "f(x) / g(x)"
        ],
        correct: 2
    },
    {
        question: "If f(x) = 2x + 1 and g(x) = x - 3, what is (f • g)(x)?",
        options: [
            "2x² - 5x - 3",
            "2x² - 6x - 3",
            "2x² - 5x + 3",
            "x² - 5x - 3"
        ],
        correct: 0
    },
    {
        question: "What method is used to multiply two binomials?",
        options: [
            "FOIL method",
            "PEMDAS method",
            "Distributive method only",
            "Addition method"
        ],
        correct: 0
    },
    {
        question: "In FOIL, what does 'O' stand for?",
        options: [
            "Order",
            "Outer",
            "Output",
            "Operation"
        ],
        correct: 1
    },
    {
        question: "If f(x) = 3x + 2 and g(x) = x - 1, what is (f • g)(x)?",
        options: [
            "3x² - x - 2",
            "3x² + x - 2",
            "3x² - x + 2",
            "3x² + x + 2"
        ],
        correct: 0
    }
];

const lesson3Quiz = [
    {
        question: "What is (f / g)(x) equal to?",
        options: [
            "f(x) + g(x)",
            "f(x) - g(x)",
            "f(x) × g(x)",
            "f(x) / g(x), where g(x) ≠ 0"
        ],
        correct: 3
    },
    {
        question: "If f(x) = x² - 4 and g(x) = x - 2, what is (f / g)(x)?",
        options: [
            "x + 2, where x ≠ 2",
            "x - 2, where x ≠ 2",
            "x² + 2, where x ≠ 2",
            "x + 4, where x ≠ 2"
        ],
        correct: 0
    },
    {
        question: "What is a vertical asymptote?",
        options: [
            "A value where the function equals zero",
            "A value excluded from the domain",
            "A value where the numerator equals zero",
            "A value where the function is undefined"
        ],
        correct: 1
    },
    {
        question: "If f(x) = x² - 9 and g(x) = x + 3, what is (f / g)(x)?",
        options: [
            "x - 3, where x ≠ -3",
            "x + 3, where x ≠ -3",
            "x² - 3, where x ≠ -3",
            "x + 9, where x ≠ -3"
        ],
        correct: 0
    },
    {
        question: "When dividing functions, what must we always check?",
        options: [
            "That the numerator is not zero",
            "That the denominator is not zero",
            "That both functions are defined",
            "That the result is positive"
        ],
        correct: 1
    }
];

const lesson4Quiz = [
    {
        question: "What is (f ∘ g)(x) equal to?",
        options: [
            "f(x) + g(x)",
            "f(g(x))",
            "g(f(x))",
            "f(x) × g(x)"
        ],
        correct: 1
    },
    {
        question: "If f(x) = 2x + 1 and g(x) = x - 3, what is (f ∘ g)(x)?",
        options: [
            "2x - 5",
            "2x - 2",
            "2x + 4",
            "2x - 6"
        ],
        correct: 0
    },
    {
        question: "If f(x) = 2x + 1 and g(x) = x - 3, what is (g ∘ f)(x)?",
        options: [
            "2x - 5",
            "2x - 2",
            "2x + 4",
            "2x - 6"
        ],
        correct: 1
    },
    {
        question: "Is (f ∘ g)(x) always equal to (g ∘ f)(x)?",
        options: [
            "Yes, always",
            "No, not in general",
            "Only when f = g",
            "Only for linear functions"
        ],
        correct: 1
    },
    {
        question: "In composition (f ∘ g)(x), which function is applied first?",
        options: [
            "f(x)",
            "g(x)",
            "Both at the same time",
            "It depends on the functions"
        ],
        correct: 1
    }
];

const lesson5Quiz = [
    {
        question: "If R(x) = 50x - 0.5x² and C(x) = 20x + 100, what is the profit function P(x)?",
        options: [
            "P(x) = -0.5x² + 30x - 100",
            "P(x) = 0.5x² + 30x - 100",
            "P(x) = -0.5x² - 30x - 100",
            "P(x) = 0.5x² - 30x + 100"
        ],
        correct: 0
    },
    {
        question: "In function composition for real-world problems, what does h(t) = h(v(t)) represent?",
        options: [
            "Height as a function of velocity",
            "Height as a function of time through velocity",
            "Velocity as a function of height",
            "Time as a function of height"
        ],
        correct: 1
    },
    {
        question: "What operation is used to find profit from revenue and cost?",
        options: [
            "Addition",
            "Subtraction",
            "Multiplication",
            "Division"
        ],
        correct: 1
    },
    {
        question: "In the power formula P(t) = I²(t) × R(t), what operation is used?",
        options: [
            "Addition",
            "Subtraction",
            "Multiplication",
            "Division"
        ],
        correct: 2
    },
    {
        question: "Why is function composition useful in real-world applications?",
        options: [
            "It simplifies calculations",
            "It allows modeling complex relationships where one quantity depends on another",
            "It makes graphs look better",
            "It's required by mathematics"
        ],
        correct: 1
    }
];

// Sidebar Navigation Functions
function canAccessTopic(lessonNum) {
    if (lessonNum <= 1) return true;
    for (let i = 1; i < lessonNum; i++) {
        if (!completedLessons.has(i)) return false;
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
            if (completedLessons.has(lessonNum)) dot.classList.add('completed');
        }
    }
    const sub = document.querySelector(`.lesson-subitem[data-lesson="${lessonNum}"][data-section="${section}"]`);
    if (sub) sub.classList.add('active');
}

function updateSidebarProgress() {
    document.querySelectorAll('.lesson-topic').forEach(topic => {
        const n = parseInt(topic.dataset.lesson, 10);
        const accessible = canAccessTopic(n);
        const complete = completedLessons.has(n);
        // Never lock a topic that is already completed
        topic.classList.toggle('locked', !accessible && !complete);
        // Progress text removed - no longer updating
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
    // Set total lesson label
    const totalLessonLabel = document.getElementById('totalLessonLabel');
    if (totalLessonLabel) {
        totalLessonLabel.textContent = totalLessons;
    }
    
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
                showLesson(lessonNum);
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
            showLesson(lessonNum);
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
            if (window.innerWidth < 1024) {
                const sidebar = document.getElementById('lessonSidebar');
                const overlay = document.querySelector('.sidebar-overlay');
                if (sidebar) {
                    sidebar.classList.remove('open');
                    if (overlay) overlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        });
    });
    
    // Mobile sidebar toggle with overlay
    const sidebar = document.getElementById('lessonSidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.createElement('div');
    sidebarOverlay.className = 'sidebar-overlay';
    sidebarOverlay.addEventListener('click', function() {
        if (sidebar) closeSidebar();
    });
    document.body.appendChild(sidebarOverlay);
    
    function openSidebar() {
        if (sidebar) {
            sidebar.classList.add('open');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    function closeSidebar() {
        if (sidebar) {
            sidebar.classList.remove('open');
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
        // Check if touch started near left edge
        if (touchStartX <= edgeSwipeThreshold && !sidebar?.classList.contains('open')) {
            isSwiping = true;
        }
    }, { passive: true });
    
    document.addEventListener('touchmove', function(e) {
        if (!isSwiping || window.innerWidth >= 1024) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - touchStartX;
        
        if (diff > 0 && sidebar && !sidebar.classList.contains('open')) {
            // Swiping right from left edge
            const translateX = Math.min(diff, 280);
            sidebar.style.transform = `translateX(${-280 + translateX}px)`;
            sidebar.classList.add('swiping');
        } else if (diff < 0 && sidebar?.classList.contains('open')) {
            // Swiping left to close
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
            sidebar.style.transform = ''; // Reset transform to allow CSS transition
        }
        
        if (diff > swipeThreshold && !sidebar?.classList.contains('open')) {
            // Swipe right to open
            openSidebar();
        } else if (diff < -swipeThreshold && sidebar?.classList.contains('open')) {
            // Swipe left to close
            closeSidebar();
        } else if (sidebar?.classList.contains('open')) {
            // If sidebar was open but not enough swipe to close, snap back open
            openSidebar();
        } else {
            // If sidebar was closed and not enough swipe to open, snap back closed
            closeSidebar();
        }
        isSwiping = false;
    });
    
    // Close sidebar when clicking outside on mobile
    document.querySelector('.lesson-sidebar')?.addEventListener('click', function(e) {
        if (e.target === this && window.innerWidth < 1024) {
            closeSidebar();
        }
    });
    
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
    
    // Load completed lessons first, then initialize lesson
    loadCompletedLessons().then(() => {
        // Initialize first lesson as active after completed lessons are loaded
        showLesson(1);
        setSidebarActive(1, 'objective');
        updateNavigationButtons();
        updateSidebarProgress();
        
        // Hide timers for inactive lessons initially
        document.querySelectorAll('.lesson-section').forEach(section => {
            if (!section.classList.contains('active')) {
                const timer = section.querySelector('.lesson-timer-display');
                if (timer) {
                    const timerContainer = timer.closest('.flex');
                    if (timerContainer) {
                        timerContainer.style.display = 'none';
                    }
                }
            }
        });
    }).catch(error => {
        console.error('Error loading completed lessons:', error);
        // Still initialize lesson even if loading fails
        showLesson(1);
        setSidebarActive(1, 'objective');
        updateNavigationButtons();
        updateSidebarProgress();
        
        // Hide timers for inactive lessons initially
        document.querySelectorAll('.lesson-section').forEach(section => {
            if (!section.classList.contains('active')) {
                const timer = section.querySelector('.lesson-timer-display');
                if (timer) {
                    const timerContainer = timer.closest('.flex');
                    if (timerContainer) {
                        timerContainer.style.display = 'none';
                    }
                }
            }
        });
    });

    // Timer initialization will be done after authentication check in the Authentication Guard section

    // Default auto-calc for calculators
    try { calculateOperation(); } catch(e) {}
    try { calculateMultiplication(); } catch(e) {}
    try { calculateDivision(); } catch(e) {}
    try { calculateComposition(); } catch(e) {}
});

// Show specific lesson
function showLesson(lessonNum, scrollToTop = false) {
    const lessonSections = document.querySelectorAll('.lesson-section');
    
    // Save time for previous lesson
    if (currentLesson && currentLesson !== lessonNum) {
        saveStudyTimeForCurrentLesson();
    }
    
    currentLesson = lessonNum;
    
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
    
    // Show selected lesson
    lessonSections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`lesson${lessonNum}`).classList.add('active');
    
    // Show/hide Lesson 5 quiz button
    const lesson5QuizButton = document.getElementById('lesson5QuizButtonContainer');
    if (lesson5QuizButton) {
        if (lessonNum === 5 && !completedLessons.has(5)) {
            lesson5QuizButton.style.display = 'block';
        } else {
            lesson5QuizButton.style.display = 'none';
        }
    }
    
    // Start tracking for new lesson - only if not completed
    if (!completedLessons.has(lessonNum)) {
        const now = Date.now();
        // Only reset start time if we don't have accumulated time yet
        if (!lessonStartTime[lessonNum]) {
            lessonStartTime[lessonNum] = now;
        }
        // Ensure lastSavedTime and lastSaveTimestamp are initialized
        if (lastSavedTime[lessonNum] === undefined) {
            lastSavedTime[lessonNum] = totalStudyTime[lessonNum] || 0;
        }
        if (!lastSaveTimestamp[lessonNum]) {
            lastSaveTimestamp[lessonNum] = now;
        }
    } else {
        // If lesson is completed, clear start time and save timestamp to prevent timer from running
        lessonStartTime[lessonNum] = null;
        lastSaveTimestamp[lessonNum] = null;
        // Ensure timer is stopped for completed lessons
        if (timerUpdateInterval) {
            clearInterval(timerUpdateInterval);
            timerUpdateInterval = null;
        }
    }
    
    // Show timer only for active lesson, hide for all others
    document.querySelectorAll('.lesson-timer-display').forEach(timer => {
        const section = timer.closest('.lesson-section');
        if (section && section.id === `lesson${lessonNum}`) {
            const timerContainer = timer.closest('.flex');
            if (timerContainer) {
                timerContainer.style.display = 'flex';
            }
        } else {
            const timerContainer = timer.closest('.flex');
            if (timerContainer) {
                timerContainer.style.display = 'none';
            }
        }
    });
    
    // Start/restart live timer display (will show final time if completed)
    startLiveTimer();
    
    // Set sidebar active to objective by default
    setSidebarActive(lessonNum, 'objective');
    updateSidebarProgress();
    
    // Add animation
    const activeSection = document.getElementById(`lesson${lessonNum}`);
    activeSection.classList.add('fade-in');
    
    // Update progress indicators and navigation
    updateProgressIndicators();
    updateNavigationButtons();
    updateLessonNavigation();
    
    // Scroll to top if requested
    if (scrollToTop) {
        scrollToTopOfLesson();
    }
}

// Navigate between lessons
function navigateLesson(direction) {
    const newLesson = currentLesson + direction;
    
    // If trying to go to next lesson, show quiz first (unless already completed)
    if (currentLesson === 1 && direction === 1 && !completedLessons.has(1)) {
        showLesson1Quiz();
        return;
    }
    if (currentLesson === 2 && direction === 1 && !completedLessons.has(2)) {
        runLessonQuiz(lesson2Quiz, 2, () => setTimeout(() => showLesson(3, true), 300));
        return;
    }
    if (currentLesson === 3 && direction === 1 && !completedLessons.has(3)) {
        runLessonQuiz(lesson3Quiz, 3, () => setTimeout(() => showLesson(4, true), 300));
        return;
    }
    if (currentLesson === 4 && direction === 1 && !completedLessons.has(4)) {
        runLessonQuiz(lesson4Quiz, 4, () => setTimeout(() => showLesson(5, true), 300));
        return;
    }
    if (currentLesson === 5 && direction === 1 && !completedLessons.has(5)) {
        takeLesson5Quiz();
        return;
    }
    
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

// Utility function to shuffle array (Fisher-Yates algorithm)
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
    // Shuffle the questions
    const shuffledQuestions = shuffleArray(quizArray);
    
    // Shuffle options within each question and update correct index
    return shuffledQuestions.map(quiz => {
        const originalOptions = [...quiz.options];
        const originalCorrect = quiz.correct;
        
        // Create array of indices and shuffle them
        const indices = originalOptions.map((_, i) => i);
        const shuffledIndices = shuffleArray(indices);
        
        // Map original options to new positions
        const shuffledOptions = shuffledIndices.map(i => originalOptions[i]);
        
        // Find new correct index
        const newCorrect = shuffledIndices.indexOf(originalCorrect);
        
        return {
            ...quiz,
            options: shuffledOptions,
            correct: newCorrect
        };
    });
}

// Quiz Functions
function runLessonQuiz(quizArray, lessonNum, onPassed) {
    // Shuffle quiz questions and options
    const shuffledQuiz = shuffleQuiz(quizArray);
    let currentQuestion = 0;
    let score = 0;
    let userAnswers = []; // Store user's answers

    Swal.fire({
        title: `📚 Topic ${lessonNum} Quiz`,
        html: `
            <div class="text-left space-y-4">${typeof mathEaseQuizIntroBanner === 'function' ? mathEaseQuizIntroBanner() : ''}
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
    }).then((result) => {
        if (result.isConfirmed) displayQuestion();
        else showLesson(lessonNum, true);
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
                title: 'text-slate-800 w-full',
                htmlContainer: 'text-left',
                cancelButton: 'px-6 py-3 rounded-lg font-semibold'
            },
            didOpen: () => {
                // Capture current question index and quiz data in closure
                const questionIndex = currentQuestion;
                const currentQuiz = shuffledQuiz[questionIndex];
                
                // Use setTimeout to ensure DOM is fully rendered
                setTimeout(() => {
                    // Query within Swal container to ensure we get the right elements
                    const swalContainer = document.querySelector('.swal2-popup');
                    if (!swalContainer) return;
                    
                    const quizOptions = swalContainer.querySelectorAll('.quiz-option');
                    quizOptions.forEach(btn => {
                        // Remove any existing listeners
                        const newBtn = btn.cloneNode(true);
                        btn.parentNode.replaceChild(newBtn, btn);
                        
                        newBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            const selectedAnswer = parseInt(this.dataset.answer);
                            if (isNaN(selectedAnswer)) return;
                            
                            // Generate explanation for this answer
                            const explanation = generateExplanation(currentQuiz, selectedAnswer);
                            
                            userAnswers[questionIndex] = {
                                question: currentQuiz.question,
                                options: currentQuiz.options, // Store all options
                                selected: selectedAnswer,
                                selectedText: currentQuiz.options[selectedAnswer], // Store selected option text
                                correct: currentQuiz.correct,
                                correctText: currentQuiz.options[currentQuiz.correct], // Store correct option text
                                isCorrect: selectedAnswer === currentQuiz.correct,
                                explanation: explanation // Store explanation
                            };
                            if (selectedAnswer === currentQuiz.correct) score++;
                            
                            // Disable all options
                            quizOptions.forEach(b => {
                                b.disabled = true;
                                b.style.opacity = '0.6';
                                b.style.cursor = 'not-allowed';
                            });
                            
                            // Highlight selected answer
                            this.style.borderColor = '#667eea';
                            this.style.backgroundColor = '#eef2ff';
                            
                            setTimeout(() => {
                                currentQuestion++;
                                displayQuestion();
                            }, 500);
                        });
                    });
                }, 100);
            }
        }).then((result) => {
            if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
                if (typeof mathEaseConfirmTopicQuizCancel === 'function') {
                    mathEaseConfirmTopicQuizCancel().then((cr) => {
                        if (cr.isConfirmed) showLesson(lessonNum, true);
                        else displayQuestion();
                    });
                } else {
                    showLesson(lessonNum, true);
                }
            }
        });
    }

    function showQuizResults() {
        const percentage = Math.round((score / shuffledQuiz.length) * 100);
        const passed = score >= 3;
        
        // CRITICAL: Verify userAnswers array before showing results
        console.log(`📊 Quiz Results for Lesson ${lessonNum}:`, {
            score,
            totalQuestions: shuffledQuiz.length,
            userAnswersCount: userAnswers.length,
            userAnswers: userAnswers,
            passed
        });
        
        // Validate userAnswers has data for all questions
        if (!userAnswers || userAnswers.length === 0) {
            console.error('❌ CRITICAL: userAnswers is empty in showQuizResults!');
            Swal.fire({
                title: 'Error',
                text: 'Quiz answers were not recorded properly. Please retake the quiz.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            showLesson(lessonNum, true);
            return;
        }
        
        // Check if all questions have answers
        const missingAnswers = [];
        for (let i = 0; i < shuffledQuiz.length; i++) {
            if (!userAnswers[i] || typeof userAnswers[i] !== 'object') {
                missingAnswers.push(i + 1);
            }
        }
        
        if (missingAnswers.length > 0) {
            console.warn(`⚠️ WARNING: Missing answers for questions: ${missingAnswers.join(', ')}`);
        }

        Swal.fire({
            title: passed ? '🎉 Congratulations!' : '📚 Keep Learning!',
            html: `
                <div class="text-center">
                    <p class="text-2xl font-bold mb-4 ${passed ? 'text-green-600' : 'text-red-600'}">
                        Score: ${score}/${shuffledQuiz.length} (${percentage}%)
                    </p>
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
        }).then(async (result) => {
            if (result.isConfirmed && passed) {
                try {
                    // Store quiz data before completing lesson
                    console.log(`📝 Storing quiz data for lesson ${lessonNum}...`);
                    const storeResult = await storeQuizData(lessonNum, score, shuffledQuiz.length, userAnswers);
                    console.log(`✅ Quiz data stored for lesson ${lessonNum}`);
                    
                    // Small delay to ensure data is saved to database
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    await completeLesson(lessonNum);
                    
                    // If this is Lesson 5, check if all lessons are completed
                    if (lessonNum === 5) {
                        setTimeout(() => {
                            if (completedLessons.size === totalLessons) {
                                // Show performance analysis section after all quizzes are completed
                                showPerformanceAnalysisSection();
                                showTopicCompletionOption();
                            }
                        }, 500);
                    }
                } catch (e) {
                    console.error('Error storing quiz data:', e);
                }
                if (typeof onPassed === 'function') onPassed();
            } else {
                // Store quiz data even if failed (for analysis)
                try {
                    console.log(`📝 Storing quiz data for failed quiz lesson ${lessonNum}...`);
                    const storeResult = await storeQuizData(lessonNum, score, shuffledQuiz.length, userAnswers);
                    console.log(`✅ Quiz data stored for failed quiz lesson ${lessonNum}:`, storeResult);
                } catch (e) {
                    console.error('❌ Error storing quiz data:', e);
                }
                showLesson(lessonNum, true);
            }
        });
    }
}

// Show Lesson 1 Quiz
function showLesson1Quiz() {
    if (completedLessons.has(1)) { // already passed, skip quiz
        showLesson(2, true);
        return;
    }
    let currentQuestion = 0;
    let score = 0;
    let userAnswers = [];

    // Shuffle quiz questions and options
    const shuffledQuiz = shuffleQuiz(lesson1Quiz);
    
    Swal.fire({
        title: `📚 Topic 1 Quiz`,
        html: `
            <div class="text-left space-y-4">${typeof mathEaseQuizIntroBanner === 'function' ? mathEaseQuizIntroBanner() : ''}
                <div class="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-5 border-l-4 border-primary">
                    <h3 class="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <i class="fas fa-info-circle text-primary mr-2"></i>
                        Quiz Instructions
                    </h3>
                    <p class="text-gray-700 mb-2">
                        You will answer <strong>5 questions</strong> for Topic 1.
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
            displayQuestion();
        } else {
            showLesson(1, true);
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
                
                // Use setTimeout to ensure DOM is fully rendered
                setTimeout(() => {
                    // Query within Swal container to ensure we get the right elements
                    const swalContainer = document.querySelector('.swal2-popup');
                    if (!swalContainer) return;
                    
                    const quizOptions = swalContainer.querySelectorAll('.quiz-option');
                    quizOptions.forEach(btn => {
                        // Remove any existing listeners
                        const newBtn = btn.cloneNode(true);
                        btn.parentNode.replaceChild(newBtn, btn);
                        
                        newBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            const selectedAnswer = parseInt(this.dataset.answer);
                            if (isNaN(selectedAnswer)) return;
                            
                            // Generate explanation for this answer
                            const explanation = generateExplanation(currentQuiz, selectedAnswer);
                            
                            userAnswers[questionIndex] = {
                                question: currentQuiz.question,
                                options: currentQuiz.options, // Store all options
                                selected: selectedAnswer,
                                selectedText: currentQuiz.options[selectedAnswer], // Store selected option text
                                correct: currentQuiz.correct,
                                correctText: currentQuiz.options[currentQuiz.correct], // Store correct option text
                                isCorrect: selectedAnswer === currentQuiz.correct,
                                explanation: explanation // Store explanation
                            };
                            
                            if (selectedAnswer === currentQuiz.correct) {
                                score++;
                            }
                            
                            // Disable all options
                            quizOptions.forEach(b => {
                                b.disabled = true;
                                b.style.opacity = '0.6';
                                b.style.cursor = 'not-allowed';
                            });
                            
                            // Highlight selected answer
                            this.style.borderColor = '#667eea';
                            this.style.backgroundColor = '#eef2ff';
                            
                            // Move to next question after 0.5 seconds
                            setTimeout(() => {
                                currentQuestion++;
                                displayQuestion();
                            }, 500);
                        });
                    });
                }, 100);
            }
        }).then((result) => {
            if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
                if (typeof mathEaseConfirmTopicQuizCancel === 'function') {
                    mathEaseConfirmTopicQuizCancel().then((cr) => {
                        if (cr.isConfirmed) showLesson(1, true);
                        else displayQuestion();
                    });
                } else {
                    showLesson(1, true);
                }
            }
        });
    }

    function showQuizResults() {
        const percentage = Math.round((score / shuffledQuiz.length) * 100);
        const passed = score >= 3; // Need at least 3 out of 5 to pass
        
        // CRITICAL: Verify userAnswers array before showing results
        console.log(`📊 Quiz Results for Lesson 1:`, {
            score,
            totalQuestions: shuffledQuiz.length,
            userAnswersCount: userAnswers.length,
            userAnswers: userAnswers,
            passed
        });
        
        // Validate userAnswers has data for all questions
        if (!userAnswers || userAnswers.length === 0) {
            console.error('❌ CRITICAL: userAnswers is empty in showQuizResults!');
            Swal.fire({
                title: 'Error',
                text: 'Quiz answers were not recorded properly. Please retake the quiz.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            showLesson(1, true);
            return;
        }
        
        // Check if all questions have answers
        const missingAnswers = [];
        for (let i = 0; i < shuffledQuiz.length; i++) {
            if (!userAnswers[i] || typeof userAnswers[i] !== 'object') {
                missingAnswers.push(i + 1);
            }
        }
        
        if (missingAnswers.length > 0) {
            console.warn(`⚠️ WARNING: Missing answers for questions: ${missingAnswers.join(', ')}`);
        }

        Swal.fire({
            title: passed ? '🎉 Congratulations!' : '📚 Keep Learning!',
            html: `
                <div class="text-center">
                    <p class="text-2xl font-bold mb-4 ${passed ? 'text-green-600' : 'text-red-600'}">
                        Score: ${score}/${shuffledQuiz.length} (${percentage}%)
                    </p>
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
        }).then(async (result) => {
            if (result.isConfirmed && passed) {
                // Mark lesson as complete and proceed to next lesson
                try {
                    // Store quiz data before completing lesson
                    console.log(`📝 Storing quiz data for lesson 1...`);
                    const storeResult = await storeQuizData(1, score, shuffledQuiz.length, userAnswers);
                    console.log(`✅ Quiz data stored for lesson 1`);
                    
                    // Small delay to ensure data is saved to database
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    await completeLesson(1);
                    // Small delay to ensure completion is saved
                    setTimeout(() => {
                        // Check if all lessons are completed and show performance analysis
                        if (completedLessons.size === totalLessons) {
                            showPerformanceAnalysisSection();
                        }
                        showLesson(2, true);
                    }, 500);
                } catch (error) {
                    console.error('Error completing lesson:', error);
                    // Still proceed to next lesson even if save fails
                    showLesson(2, true);
                }
            } else if (!passed) {
                // Store quiz data even if failed (for analysis)
                try {
                    console.log(`📝 Storing quiz data for failed quiz lesson 1...`);
                    const storeResult = await storeQuizData(1, score, shuffledQuiz.length, userAnswers);
                    console.log(`✅ Quiz data stored for failed quiz lesson 1:`, storeResult);
                } catch (e) {
                    console.error('❌ Error storing quiz data:', e);
                }
                // Stay on Lesson 1
                showLesson(1, true);
            }
        });
    }
}

// Store quiz data to database
async function storeQuizData(lessonNum, score, totalQuestions, userAnswers) {
    try {
        console.log(`📊 Preparing to store quiz data for lesson ${lessonNum}:`, {
            score,
            totalQuestions,
            userAnswersCount: userAnswers ? userAnswers.length : 0,
            userAnswers: userAnswers
        });
        
        // CRITICAL: Validate userAnswers is not empty
        if (!userAnswers || !Array.isArray(userAnswers) || userAnswers.length === 0) {
            console.error('❌ CRITICAL ERROR: userAnswers is empty or invalid!', {
                userAnswers,
                lessonNum,
                score,
                totalQuestions
            });
            throw new Error('Cannot save quiz data: userAnswers array is empty. Please retake the quiz.');
        }
        
        // Validate and clean userAnswers array
        // Ensure all questions are accounted for (up to totalQuestions)
        const cleanedAnswers = [];
        for (let i = 0; i < totalQuestions; i++) {
            if (userAnswers[i] && typeof userAnswers[i] === 'object') {
                // Ensure all required fields are present
                const answer = {
                    question: userAnswers[i].question || `Question ${i + 1}`,
                    options: userAnswers[i].options || [],
                    selected: userAnswers[i].selected !== undefined ? userAnswers[i].selected : -1,
                    selectedText: userAnswers[i].selectedText || (userAnswers[i].options && userAnswers[i].options[userAnswers[i].selected] ? userAnswers[i].options[userAnswers[i].selected] : 'N/A'),
                    correct: userAnswers[i].correct !== undefined ? userAnswers[i].correct : -1,
                    correctText: userAnswers[i].correctText || (userAnswers[i].options && userAnswers[i].options[userAnswers[i].correct] ? userAnswers[i].options[userAnswers[i].correct] : 'N/A'),
                    isCorrect: userAnswers[i].isCorrect !== undefined ? userAnswers[i].isCorrect : false,
                    explanation: userAnswers[i].explanation || '' // Include explanation if available
                };
                cleanedAnswers.push(answer);
            } else {
                // Fill in missing answer with default values
                cleanedAnswers.push({
                    question: `Question ${i + 1}`,
                    options: [],
                    selected: -1,
                    selectedText: 'Not answered',
                    correct: -1,
                    correctText: 'N/A',
                    isCorrect: false,
                    explanation: ''
                });
            }
        }
        
        // Use underscores to match the pattern expected by analyze-quiz-performance.php
        // Pattern: operations-on-functions% matches operations-on-functions-lesson-X
        // But groq-ai-performance.php expects operations_on_functions_lesson_X
        // Let's use the format that matches analyze-quiz-performance.php pattern
        const quizType = `operations-on-functions-lesson-${lessonNum}`;
        const payload = {
            topic: 'operations-on-functions',
            lesson: lessonNum,
            quiz_type: quizType,
            score: score,
            total_questions: totalQuestions,
            answers: cleanedAnswers
        };
        
        console.log(`📤 Sending quiz data to server:`, {
            quiz_type: quizType,
            topic: 'operations-on-functions',
            lesson: lessonNum,
            score,
            total_questions: totalQuestions,
            answers_count: cleanedAnswers.length,
            userAnswers_length: userAnswers ? userAnswers.length : 0,
            cleanedAnswers_sample: cleanedAnswers.length > 0 ? cleanedAnswers[0] : 'No answers'
        });
        
        // Verify userAnswers array has data
        if (!userAnswers || userAnswers.length === 0) {
            console.warn('⚠️ WARNING: userAnswers array is empty!');
        } else {
            console.log(`✅ userAnswers has ${userAnswers.length} entries`);
            userAnswers.forEach((ans, idx) => {
                if (!ans || typeof ans !== 'object') {
                    console.warn(`⚠️ WARNING: userAnswers[${idx}] is invalid:`, ans);
                }
            });
        }
        
        const response = await fetch('../php/store-quiz-data.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ HTTP error! status: ${response.status}`, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`📥 Server response:`, data);
        
        if (!data.success) {
            console.error('❌ Quiz data storage failed:', data.message);
            console.error('Full response:', data);
            // Show error to user but don't block lesson completion
            Swal.fire({
                title: 'Quiz Save Warning',
                text: data.message || 'Quiz data may not have been saved properly. Your progress is still recorded.',
                icon: 'warning',
                confirmButtonText: 'OK',
                timer: 5000
            });
            return false;
        } else {
            console.log('✅ Quiz data saved successfully:', {
                lesson: lessonNum,
                quiz_type: quizType,
                score: score,
                total_questions: totalQuestions,
                answers_count: cleanedAnswers.length,
                attempt_id: data.attempt_id || 'N/A'
            });
            
            // Verify the data was saved by checking the server
            setTimeout(async () => {
                try {
                    const verifyResponse = await fetch(`../php/analyze-quiz-performance.php?topic=operations-on-functions`, {
                        method: 'GET',
                        credentials: 'include'
                    });
                    const verifyData = await verifyResponse.json();
                    if (verifyData.success && verifyData.analysis) {
                        console.log('✅ Verification: Quiz data is accessible for analysis');
                    } else {
                        console.warn('⚠️ Verification: Quiz data may not be accessible yet:', verifyData.message);
                    }
                } catch (e) {
                    console.warn('⚠️ Could not verify quiz data:', e);
                }
            }, 2000);
            
            return true;
        }
    } catch (error) {
        console.error('❌ Error storing quiz data:', error);
        console.error('Error stack:', error.stack);
        // Show error but don't block lesson completion
        Swal.fire({
            title: 'Quiz Save Error',
            text: 'Failed to save quiz data: ' + error.message + '. Please try again or contact support.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return false;
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
    const currentLessonLabel = document.getElementById('currentLessonLabel');
    const progressBar = document.getElementById('lessonProgressBar');
    
    if (currentLessonNum) {
        currentLessonNum.textContent = currentLesson;
    }
    
    if (currentLessonLabel) {
        currentLessonLabel.textContent = currentLesson;
    }
    
    if (progressBar) {
        const progress = (currentLesson / totalLessons) * 100;
        progressBar.style.width = progress + '%';
    }
}

// Update lesson navigation visual state
function updateLessonNavigation() {
    const lessonSteps = document.querySelectorAll('.lesson-step');
    lessonSteps.forEach(step => {
        const lessonNum = parseInt(step.dataset.lesson);
        const dot = step.querySelector('.lesson-step-dot');
        
        // Remove all state classes
        dot.classList.remove('border-primary', 'text-primary', 'bg-primary', 
                            'border-gray-300', 'text-gray-600', 
                            'border-emerald-500', 'text-emerald-600', 'bg-emerald-50');
        
        if (completedLessons.has(lessonNum)) {
            // Completed state
            dot.classList.add('border-emerald-500', 'text-emerald-600', 'bg-emerald-50');
        } else if (lessonNum === currentLesson) {
            // Current state
            dot.classList.add('border-primary', 'text-primary', 'bg-white');
            step.setAttribute('aria-current', 'step');
        } else {
            // Not started state
            dot.classList.add('border-gray-300', 'text-gray-600', 'bg-white');
            step.removeAttribute('aria-current');
        }
    });
}

// Complete a lesson
// Update sidebar progress when lesson is completed
async function completeLesson(lessonNum) {
    console.log('Attempting to complete lesson:', lessonNum);
    
    try {
        // Guard: prevent duplicate completion submissions
        if (completedLessons.has(lessonNum)) {
            showSuccess(`Lesson ${lessonNum} is already completed.`);
            return;
        }

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
            return;
        }
        
        if (data.success) {
            console.log('Lesson completion successful');
            
            // CRITICAL: Save final study time BEFORE marking as completed
            // This ensures the final time is saved to the database when quiz is passed
            if (currentLesson === lessonNum) {
                const now = Date.now();
                // Use lastSaveTimestamp if available, otherwise use lessonStartTime
                const saveStartTime = lastSaveTimestamp[lessonNum] || lessonStartTime[lessonNum];
                
                if (saveStartTime) {
                    const elapsed = Math.floor((now - saveStartTime) / 1000); // in seconds
                    
                    if (elapsed > 0 && elapsed < 7200) {
                        // Get last confirmed saved time (from server)
                        const baseTime = lastSavedTime[lessonNum] || 0;
                        // Calculate final total time: last saved + elapsed since last save
                        const finalTotalTime = baseTime + elapsed;
                        
                        // Update local tracking
                        totalStudyTime[lessonNum] = finalTotalTime;
                        lastSavedTime[lessonNum] = finalTotalTime;
                        
                        // Force save final time to server immediately
                        console.log(`Saving final study time for lesson ${lessonNum} after quiz pass: ${elapsed}s elapsed, total: ${finalTotalTime}s`);
                        try {
                            const response = await fetch('../php/store-study-time.php', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    topic: 'operations-on-functions',
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
                    lessonStartTime[lessonNum] = null;
                    lastSaveTimestamp[lessonNum] = null;
                } else {
                    // If no start time, just save current total time
                    const finalTotalTime = totalStudyTime[lessonNum] || 0;
                    if (finalTotalTime > 0) {
                        console.log(`Saving final study time for lesson ${lessonNum} (no active session): ${finalTotalTime}s`);
                        lastSavedTime[lessonNum] = finalTotalTime;
                        try {
                            const response = await fetch('../php/store-study-time.php', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    topic: 'operations-on-functions',
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
            }
            
            // Add to completed lessons AFTER saving time
            completedLessons.add(lessonNum);
            showSuccess('Lesson completed successfully!');
            
            // Hide Lesson 5 quiz button if lesson 5 is completed
            if (lessonNum === 5) {
                const lesson5QuizButton = document.getElementById('lesson5QuizButtonContainer');
                if (lesson5QuizButton) {
                    lesson5QuizButton.style.display = 'none';
                }
            }
            
            // Stop timer for completed lesson
            if (lessonNum === currentLesson) {
                // Stop the timer interval
                if (timerUpdateInterval) {
                    clearInterval(timerUpdateInterval);
                    timerUpdateInterval = null;
                }
                
                // Update timer display with final time
                updateLiveTimer();
            }
            
            // Update lesson completion status and sidebar
            updateLessonCompletionStatus();
            updateSidebarProgress();
            
            // Check if all lessons are completed
            if (completedLessons.size === totalLessons) {
                // Show performance analysis section after all quizzes are completed
                showPerformanceAnalysisSection();
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
            updateSidebarProgress();
            
            // Check if all lessons are completed and show topic completion option
            if (completedLessons.size === totalLessons) {
                // Show performance analysis section after all quizzes are completed
                showPerformanceAnalysisSection();
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
    // Update navigation visual state
    updateLessonNavigation();
}

// Show topic completion option
function showTopicCompletionOption() {
    // Show the topic completion section (it's now in the HTML file)
    const topicCompletionDiv = document.getElementById('topicCompletionSection');
    if (topicCompletionDiv) {
        topicCompletionDiv.style.display = 'block';
        topicCompletionDiv.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
    
    // Show performance analysis section (only if all quizzes are completed)
    // This function already checks if all quizzes are done
    showPerformanceAnalysisSection();
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

// Study Time Tracking Functions
async function startStudyTimeTracking() {
    // Verify user is authenticated before starting timer
    try {
        const response = await fetch('../php/get-study-time.php?topic=operations-on-functions', {
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
    } catch (error) {
        console.error('Error verifying user authentication:', error);
        return; // Don't start timer if there's an error
    }
    
    // CRITICAL: Only initialize timer if lesson is not completed
    // If lesson is completed, timer should show final time only (no counting)
    if (currentLesson && !completedLessons.has(currentLesson)) {
        const now = Date.now();
        // Only set lessonStartTime if not already set
        if (!lessonStartTime[currentLesson]) {
            lessonStartTime[currentLesson] = now;
            console.log(`Timer started for lesson ${currentLesson} at ${new Date().toISOString()}`);
        }
        // Initialize lastSavedTime and lastSaveTimestamp if not set (will be set when loading from server)
        if (lastSavedTime[currentLesson] === undefined) {
            lastSavedTime[currentLesson] = totalStudyTime[currentLesson] || 0;
            lastSaveTimestamp[currentLesson] = now;
        }
    }
    
    // Update study time every 30 seconds
    if (studyTimeInterval) {
        clearInterval(studyTimeInterval);
    }
    
    studyTimeInterval = setInterval(function() {
        // Only save if current lesson is not completed
        if (currentLesson && !completedLessons.has(currentLesson)) {
            saveStudyTimeForCurrentLesson();
        }
        // CRITICAL: Never refresh from server automatically during active session
        // This prevents race conditions and double-counting
        // Server refresh only happens on page load or after lesson completion
    }, 30000); // Save every 30 seconds
    
    // Start live timer display
    startLiveTimer();
}

// Start live timer that updates every second
function startLiveTimer() {
    // Clear existing timer
    if (timerUpdateInterval) {
        clearInterval(timerUpdateInterval);
        timerUpdateInterval = null;
    }
    
    // Don't start timer if there's no current lesson
    if (!currentLesson) {
        return;
    }
    
    // Don't start timer if lesson is already completed
    if (completedLessons.has(currentLesson)) {
        updateLiveTimer(); // Just show final time
        return;
    }
    
    // Update timer immediately
    updateLiveTimer();
    
    // Update timer every second
    timerUpdateInterval = setInterval(function() {
        // Stop if lesson becomes completed or no current lesson
        if (!currentLesson || completedLessons.has(currentLesson)) {
            clearInterval(timerUpdateInterval);
            timerUpdateInterval = null;
            updateLiveTimer(); // Show final time
            return;
        }
        updateLiveTimer();
    }, 1000);
}

// Update live timer display for current lesson
function updateLiveTimer() {
    if (!currentLesson) return;
    
    // Don't update timer if lesson is already completed
    if (completedLessons.has(currentLesson)) {
        // Show final time for completed lesson
        let finalTime = totalStudyTime[currentLesson] || 0;
        
        // Ensure finalTime is in seconds (not milliseconds)
        // If it's suspiciously large (> 86400 = 24 hours), it might be in milliseconds
        if (finalTime > 86400) {
            // Check if it's in milliseconds (divide by 1000)
            const asSeconds = Math.floor(finalTime / 1000);
            if (asSeconds <= 86400) {
                finalTime = asSeconds;
            } else {
                // Still too large, cap it
                finalTime = Math.min(finalTime, 86400);
            }
        }
        
        // Cap at 24 hours maximum
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
        
        const activeSection = document.getElementById(`lesson${currentLesson}`);
        if (activeSection) {
            const timer = activeSection.querySelector('.lesson-timer-display');
            if (timer) {
                timer.textContent = timeDisplay;
            }
            // Show full progress for completed lessons
            const progressCircle = activeSection.querySelector('.timer-progress');
            if (progressCircle) {
                progressCircle.style.animation = 'none';
                progressCircle.style.strokeDashoffset = '0';
                progressCircle.style.stroke = '#10b981'; // Green for completed
            }
        }
        return;
    }
    
    // For active lessons, calculate time accurately
    // Use lastSavedTime (confirmed saved to server) + elapsed since last save
    const baseTime = lastSavedTime[currentLesson] || 0; // This is the last confirmed saved time from server
    
    // Calculate elapsed time since last save (or since lesson started if no save yet)
    let currentSessionElapsed = 0;
    const saveStartTime = lastSaveTimestamp[currentLesson] || lessonStartTime[currentLesson];
    if (saveStartTime) {
        const now = Date.now();
        const elapsedMs = now - saveStartTime;
        currentSessionElapsed = Math.floor(elapsedMs / 1000); // in seconds
        
        // Cap current session at 2 hours to prevent unreasonable values
        // If elapsed is suspiciously large, it might be because page was left open
        if (currentSessionElapsed > 7200) {
            // Reset start time if session is too long (likely page was left open)
            console.warn(`Session elapsed time too large (${currentSessionElapsed}s) for lesson ${currentLesson}, resetting start time`);
            lessonStartTime[currentLesson] = now;
            lastSaveTimestamp[currentLesson] = now;
            currentSessionElapsed = 0;
        }
        
        // Also check if elapsed is negative (shouldn't happen, but handle it)
        if (currentSessionElapsed < 0) {
            console.warn(`Negative elapsed time detected for lesson ${currentLesson}, resetting start time`);
            lessonStartTime[currentLesson] = now;
            lastSaveTimestamp[currentLesson] = now;
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
    const activeSection = document.getElementById(`lesson${currentLesson}`);
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

function saveStudyTimeForCurrentLesson() {
    if (!currentLesson) return;
    
    // CRITICAL: Never save time for completed lessons
    // Once a lesson is completed, the timer should be frozen
    if (completedLessons.has(currentLesson)) {
        console.log(`Lesson ${currentLesson} is completed, skipping timer save`);
        return;
    }
    
    // Use lastSaveTimestamp if available, otherwise use lessonStartTime
    const saveStartTime = lastSaveTimestamp[currentLesson] || lessonStartTime[currentLesson];
    if (!saveStartTime) {
        // If no start time, initialize it now
        lessonStartTime[currentLesson] = Date.now();
        return;
    }
    
    const now = Date.now();
    const elapsed = Math.floor((now - saveStartTime) / 1000); // in seconds
    
    // Only add time if it's reasonable (less than 2 hours per session)
    if (elapsed > 0 && elapsed < 7200) {
        // Get the last confirmed saved time (from server)
        const baseTime = lastSavedTime[currentLesson] || 0;
        
        // Calculate new total: last saved time + NEW elapsed time since last save
        const newTotalTime = baseTime + elapsed;
        
        // Update both totalStudyTime and lastSavedTime
        totalStudyTime[currentLesson] = newTotalTime;
        lastSavedTime[currentLesson] = newTotalTime;
        lastSaveTimestamp[currentLesson] = now;
        
        console.log(`Saving time for lesson ${currentLesson}: ${elapsed}s elapsed, total: ${newTotalTime}s`);
        
        // Reset lessonStartTime to now for next interval
        lessonStartTime[currentLesson] = now;
        
        // Update display immediately
        displayStudyTimeFromLocal();
        
        // Send to server periodically (but don't reload immediately to prevent race condition)
        sendStudyTimeToServer();
    } else if (elapsed >= 7200) {
        // If elapsed time is too large, reset everything (likely page was left open)
        console.warn(`Elapsed time too large (${elapsed}s) for lesson ${currentLesson}, resetting start time`);
        lessonStartTime[currentLesson] = now;
        lastSaveTimestamp[currentLesson] = now;
    }
}

async function sendStudyTimeToServer() {
    try {
        const studyTimeData = {};
        for (let lesson = 1; lesson <= totalLessons; lesson++) {
            // Only send time for lessons that are not completed
            // Completed lessons should have their final time already saved
            if (!completedLessons.has(lesson) && totalStudyTime[lesson] && totalStudyTime[lesson] > 0) {
                studyTimeData[lesson] = totalStudyTime[lesson];
            }
        }
        
        if (Object.keys(studyTimeData).length === 0) return;
        
        const response = await fetch('../php/store-study-time.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                topic: 'operations-on-functions',
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
                if (studyTimeData[lesson] > (lastSavedTime[lessonNum] || 0)) {
                    lastSavedTime[lessonNum] = studyTimeData[lesson];
                    totalStudyTime[lessonNum] = studyTimeData[lesson];
                    lastSaveTimestamp[lessonNum] = now;
                }
            }
            // Refresh display from local data (which is now synced)
            displayStudyTimeFromLocal();
            // Optionally reload from server after a delay to ensure sync (but don't block)
            setTimeout(() => {
                loadAndDisplayStudyTime();
            }, 1000);
        }
    } catch (error) {
        console.error('Error saving study time:', error);
    }
}

// Load and display study time from server
async function loadAndDisplayStudyTime() {
    try {
        const response = await fetch('../php/get-study-time.php?topic=operations-on-functions', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.studyTime) {
            displayStudyTime(data.studyTime);
        } else {
            // If no data, initialize totalStudyTime, lastSavedTime, and lastSaveTimestamp to 0 for all lessons
            const now = Date.now();
            for (let lesson = 1; lesson <= totalLessons; lesson++) {
                if (!totalStudyTime[lesson]) {
                    totalStudyTime[lesson] = 0;
                }
                if (lastSavedTime[lesson] === undefined) {
                    lastSavedTime[lesson] = 0;
                }
                if (!lastSaveTimestamp[lesson]) {
                    lastSaveTimestamp[lesson] = now;
                }
            }
            // Show current local tracking
            displayStudyTimeFromLocal();
        }
    } catch (error) {
        console.error('Error loading study time:', error);
        // Fallback to local tracking - don't overwrite existing local time
        displayStudyTimeFromLocal();
    }
}

// Display study time from server data
function displayStudyTime(studyTimeData) {
    // IMPORTANT: When loading from server, set totalStudyTime and lastSavedTime directly
    // This prevents double-counting when the timer updates
    // Server time is the total accumulated time, so set it directly
    const now = Date.now();
    for (let lesson = 1; lesson <= totalLessons; lesson++) {
        if (studyTimeData[lesson] !== undefined) {
            let seconds = parseInt(studyTimeData[lesson]) || 0;
            
            // Ensure seconds is actually in seconds, not milliseconds
            // If it's suspiciously large (> 86400 = 24 hours), it might be in milliseconds
            if (seconds > 86400) {
                // Check if it's in milliseconds (divide by 1000)
                const asSeconds = Math.floor(seconds / 1000);
                if (asSeconds <= 86400) {
                    seconds = asSeconds;
                } else {
                    // Still too large, cap it at 24 hours
                    seconds = 86400;
                }
            }
            
            // Set totalStudyTime and lastSavedTime directly from server (this is the total accumulated time)
            totalStudyTime[lesson] = seconds;
            lastSavedTime[lesson] = seconds;
            // Update lastSaveTimestamp to now so we know when we last synced with server
            lastSaveTimestamp[lesson] = now;
        }
    }
    
    // Update timer displays for completed lessons
    for (let lesson = 1; lesson <= totalLessons; lesson++) {
        if (completedLessons.has(lesson)) {
            updateLiveTimer();
        }
    }
}

// Display study time from local tracking
function displayStudyTimeFromLocal() {
    // Update timer displays for all lessons
    for (let lesson = 1; lesson <= totalLessons; lesson++) {
        if (completedLessons.has(lesson)) {
            updateLiveTimer();
        }
    }
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
        const isTeacher = data.user_type === 'teacher';
        const gradeOk = isTeacher || !u.grade_level || String(u.grade_level) === '11';
        const strandOk = isTeacher || !u.strand || String(u.strand).toUpperCase() === 'STEM';
        if (!gradeOk || !strandOk) { 
            window.location.href = '../dashboard.html'; 
            return; 
        }
        
        if (isTeacher) {
            document.querySelectorAll('a[href="../dashboard.html"]').forEach(function(a) {
                a.href = '../teacher-dashboard.html';
                if (a.textContent.includes('Dashboard')) a.textContent = a.textContent.replace('Dashboard', 'Teacher Dashboard').trim();
            });
            fetch('../php/teacher-lesson-progress.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=record_view&topic_slug=operations-on-functions&topic_name=Operations on Functions',
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
        
        // Initialize interactive elements
        initializeInteractiveElements();
        
        // Wait for completed lessons to load before starting timer
        // This ensures completedLessons is populated before timer starts
        await loadCompletedLessons();
        
        // Load study time from server FIRST (before starting timer)
        // This ensures we have the correct baseline time from server
        await loadAndDisplayStudyTime();
        
        // Start study time tracking AFTER authentication, completed lessons, and study time are loaded
        // This ensures timer starts with correct baseline and doesn't double-count
        startStudyTimeTracking();
        
        // Track time when page is visible
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                // Page became visible, resume tracking (only if lesson is not completed)
                if (currentLesson && !completedLessons.has(currentLesson)) {
                    const now = Date.now();
                    // Only start/resume timer if not already started
                    if (!lessonStartTime[currentLesson]) {
                        lessonStartTime[currentLesson] = now;
                    }
                    // Ensure lastSavedTime and lastSaveTimestamp are initialized
                    if (lastSavedTime[currentLesson] === undefined) {
                        lastSavedTime[currentLesson] = totalStudyTime[currentLesson] || 0;
                    }
                    if (!lastSaveTimestamp[currentLesson]) {
                        lastSaveTimestamp[currentLesson] = now;
                    }
                    startLiveTimer(); // Restart timer display
                } else if (currentLesson && completedLessons.has(currentLesson)) {
                    // Just update display for completed lesson (don't start timer)
                    updateLiveTimer();
                }
            } else {
                // Page hidden, save current time (only if lesson is not completed)
                if (!completedLessons.has(currentLesson)) {
                    saveStudyTimeForCurrentLesson();
                }
                // Stop timer display
                if (timerUpdateInterval) {
                    clearInterval(timerUpdateInterval);
                    timerUpdateInterval = null;
                }
            }
        });
        
        // Save time before page unload
        window.addEventListener('beforeunload', function() {
            saveStudyTimeForCurrentLesson();
            // Send final time to server
            sendStudyTimeToServer();
        });
        
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

// Performance Analysis Functions
function showPerformanceAnalysisSection() {
    // Check if all 5 topics are completed
    if (completedLessons.size !== totalLessons) {
        console.log('Performance analysis will only show after completing all quizzes. Current completed:', completedLessons.size, '/', totalLessons);
        return;
    }
    
    const analysisDiv = document.getElementById('performanceAnalysisSection');
    if (analysisDiv) {
        analysisDiv.style.display = 'block';
        // Scroll to analysis section smoothly
        setTimeout(() => {
            analysisDiv.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 300);
    }
}

async function analyzePerformance() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultSection = document.getElementById('analysisResult');
    
    // Show loading state
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
    }
    
    try {
        console.log('🔍 Starting performance analysis for topic: operations-on-functions');
        console.log('📊 Completed lessons:', Array.from(completedLessons));
        
        // First, verify that we have completed lessons
        if (completedLessons.size === 0) {
            throw new Error('No lessons completed yet. Please complete at least one quiz first.');
        }
        
        // Wait a bit to ensure all quiz data is saved
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response = await fetch(`../php/analyze-quiz-performance.php?topic=operations-on-functions`, {
            method: 'GET',
            credentials: 'include'
        });
        
        // Get response text first to see what we got
        const responseText = await response.text();
        console.log('📥 Raw response from server:', responseText.substring(0, 1000));
        
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
        console.log('📊 Parsed result:', result);
        
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
        console.error('❌ Performance Analysis Error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        
        Swal.fire({
            title: 'Analysis Error',
            html: `
                <div class="text-left">
                    <p class="text-gray-700 mb-3"><strong>Error:</strong> ${error.message}</p>
                    <p class="text-sm text-gray-600 mb-3">Unable to analyze your performance right now.</p>
                    <p class="text-sm text-gray-600 mb-3"><strong>Possible reasons:</strong></p>
                    <ul class="text-sm text-gray-600 list-disc list-inside mb-3">
                        <li>No quiz attempts found in database</li>
                        <li>Quiz data may not have been saved properly</li>
                        <li>Please try completing a quiz again</li>
                    </ul>
                    <p class="text-sm text-gray-600">Check the browser console for more details.</p>
                </div>
            `,
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#667eea',
            width: '600px'
        });
    } finally {
        // Reset button
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-chart-bar mr-2"></i>Analyze My Performance';
        }
    }
}

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
    for (let topicNum = 1; topicNum <= 5; topicNum++) {
        if (topicPerformance[topicNum]) {
            const perf = topicPerformance[topicNum];
            const percentage = perf.total > 0 ? Math.round((perf.correct / perf.total) * 100) : 0;
            const topicName = getTopicNameForAnalysis(topicNum);
            const colorClass = percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600';
            const borderClass = percentage >= 80 ? 'border-green-500' : percentage >= 60 ? 'border-yellow-500' : 'border-red-500';
            
            // Get attempt counts - show failed attempts before passing
            const totalAttempts = perf.total_attempts || 1;
            const failedBeforePass = perf.failed_before_pass || 0;
            const passedOnAttempt = perf.passed_on_attempt || (failedBeforePass > 0 ? failedBeforePass + 1 : 1);
            const hasPassed = perf.has_passed !== undefined ? perf.has_passed : (percentage >= 60);
            
            let attemptText = '';
            if (hasPassed) {
                if (failedBeforePass === 0) {
                    attemptText = `<i class="fas fa-check-circle text-green-500 mr-1"></i>Passed on first attempt`;
                } else {
                    attemptText = `<i class="fas fa-redo text-orange-500 mr-1"></i>Passed on attempt ${passedOnAttempt} (${failedBeforePass} failed before passed)`;
                }
            } else {
                // Not passed yet (shouldn't happen if required to pass, but handle it)
                attemptText = `<i class="fas fa-times-circle text-red-500 mr-1"></i>Not yet passed (${totalAttempts} attempt${totalAttempts > 1 ? 's' : ''})`;
            }
            
            html += `
                <div class="border-l-4 ${borderClass} bg-gray-50 rounded p-4">
                    <div class="flex justify-between items-center mb-2">
                        <h5 class="font-semibold text-gray-800">${topicName}</h5>
                        <span class="text-2xl font-bold ${colorClass}">${percentage}%</span>
                    </div>
                    <div class="text-sm text-gray-600 mb-2">
                        Correct: ${perf.correct} | Incorrect: ${perf.incorrect} | Total: ${perf.total}
                    </div>
                    <div class="text-xs text-gray-600 mb-2 font-medium">
                        ${attemptText}
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
                        // Check if recommendation has line breaks (multi-line)
                        const hasLineBreaks = rec.includes('\n');
                        const isFocusReview = rec.includes('FOCUS REVIEW:');
                        
                        if (hasLineBreaks || isFocusReview) {
                            // Multi-line recommendation - preserve formatting
                            const lines = rec.split('\n');
                            return `
                                <li class="flex items-start">
                                    <span class="text-blue-500 mr-3 mt-1 font-bold">${index + 1}.</span>
                                    <div class="text-gray-700">
                                        ${lines.map((line, lineIndex) => {
                                            if (line.trim() === '') return '';
                                            if (lineIndex === 0 || isFocusReview) {
                                                return `<div class="${isFocusReview ? 'font-semibold text-gray-800 mb-1' : ''}">${line}</div>`;
                                            } else {
                                                return `<div class="ml-4 text-gray-600">${line}</div>`;
                                            }
                                        }).join('')}
                                    </div>
                                </li>
                            `;
                        } else {
                            return `
                                <li class="flex items-start">
                                    <span class="text-blue-500 mr-3 mt-1 font-bold">${index + 1}.</span>
                                    <span class="text-gray-700">${rec}</span>
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
    
    // Scroll to results
    setTimeout(() => {
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function getTopicNameForAnalysis(topicNum) {
    const topicNames = {
        1: 'Topic 1: Addition & Subtraction',
        2: 'Topic 2: Multiplication',
        3: 'Topic 3: Division',
        4: 'Topic 4: Composition',
        5: 'Topic 5: Applications'
    };
    return topicNames[topicNum] || 'Topic ' + topicNum;
}

function generateExplanation(quiz, selectedAnswer) {
    const isCorrect = selectedAnswer === quiz.correct;
    const correctAnswer = quiz.options[quiz.correct];
    const selectedAnswerText = quiz.options[selectedAnswer];
    const question = quiz.question.toLowerCase();
    
    // If quiz has manual explanation, use it
    if (quiz.explanation) {
        return quiz.explanation;
    }
    
    // Generate detailed explanation based on question content
    let explanation = '';
    
    if (isCorrect) {
        explanation = `✓ Correct! "${correctAnswer}" is the right answer.\n\n`;
    } else {
        explanation = `✗ Incorrect. You selected "${selectedAnswerText}", but the correct answer is "${correctAnswer}".\n\n`;
    }
    
    // Add detailed step-by-step explanations based on question type
    if (question.includes('addition') || question.includes('subtraction') || question.includes('(f + g)') || question.includes('(f - g)')) {
        explanation += 'HOW TO SOLVE:\n';
        explanation += 'For addition/subtraction of functions:\n';
        explanation += '1. Write the operation formula: (f + g)(x) = f(x) + g(x) or (f - g)(x) = f(x) - g(x)\n';
        explanation += '2. Substitute the function expressions\n';
        explanation += '3. Combine like terms\n';
        explanation += '4. Simplify the result\n';
        explanation += 'Example: f(x) = 3x - 2, g(x) = x² + 1, (f + g)(x) = x² + 3x - 1';
    } else if (question.includes('multiplication') || question.includes('(f • g)') || question.includes('(f × g)')) {
        explanation += 'HOW TO SOLVE:\n';
        explanation += 'For multiplication of functions:\n';
        explanation += '1. Write the multiplication formula: (f • g)(x) = f(x) • g(x)\n';
        explanation += '2. Substitute the function expressions\n';
        explanation += '3. Apply FOIL method (First, Outer, Inner, Last) for binomials\n';
        explanation += '4. Combine like terms\n';
        explanation += 'Example: f(x) = 2x + 1, g(x) = x - 3, (f • g)(x) = 2x² - 5x - 3';
    } else if (question.includes('division') || question.includes('(f / g)') || question.includes('rational')) {
        explanation += 'HOW TO SOLVE:\n';
        explanation += 'For division of functions:\n';
        explanation += '1. Write the division formula: (f / g)(x) = f(x) / g(x), where g(x) ≠ 0\n';
        explanation += '2. Substitute the function expressions\n';
        explanation += '3. Factor numerator and denominator if possible\n';
        explanation += '4. Cancel common factors\n';
        explanation += '5. Identify domain restrictions (where denominator = 0)\n';
        explanation += 'Example: f(x) = x² - 4, g(x) = x - 2, (f / g)(x) = x + 2, where x ≠ 2';
    } else if (question.includes('composition') || question.includes('(f ∘ g)') || question.includes('composed')) {
        explanation += 'HOW TO SOLVE:\n';
        explanation += 'For composition of functions:\n';
        explanation += '1. Write the composition formula: (f ∘ g)(x) = f(g(x))\n';
        explanation += '2. Start with the inner function g(x)\n';
        explanation += '3. Substitute g(x) into f(x)\n';
        explanation += '4. Simplify the result\n';
        explanation += 'Remember: Order matters! (f ∘ g)(x) ≠ (g ∘ f)(x) in general\n';
        explanation += 'Example: f(x) = 2x + 1, g(x) = x - 3, (f ∘ g)(x) = 2x - 5';
    } else if (question.includes('domain')) {
        explanation += 'HOW TO SOLVE:\n';
        explanation += 'To find the domain of combined functions:\n';
        explanation += '1. Find the domain of each individual function\n';
        explanation += '2. For addition/subtraction/multiplication: use intersection of domains\n';
        explanation += '3. For division: exclude values where denominator = 0\n';
        explanation += '4. For composition: ensure inner function output is in outer function domain';
    } else if (question.includes('foil')) {
        explanation += 'HOW TO SOLVE:\n';
        explanation += 'FOIL method for multiplying binomials:\n';
        explanation += 'F - First: Multiply first terms\n';
        explanation += 'O - Outer: Multiply outer terms\n';
        explanation += 'I - Inner: Multiply inner terms\n';
        explanation += 'L - Last: Multiply last terms\n';
        explanation += 'Then combine like terms';
    } else {
        explanation += 'HOW TO SOLVE:\n';
        explanation += '1. Read the question carefully\n';
        explanation += '2. Identify what operation is being asked\n';
        explanation += '3. Apply the correct formula\n';
        explanation += '4. Follow the step-by-step process\n';
        explanation += '5. Check your answer makes sense\n';
        explanation += 'Review the lesson content for more details on this topic.';
    }
    
    return explanation;
}

// Function to take Lesson 5 quiz
function takeLesson5Quiz() {
    if (completedLessons.has(5)) {
        Swal.fire({
            title: 'Already Completed',
            text: 'You have already completed Lesson 5 quiz.',
            icon: 'info',
            confirmButtonText: 'OK'
        });
        return;
    }
    
    runLessonQuiz(lesson5Quiz, 5, () => {
        // After passing Lesson 5, check if all lessons are completed
        setTimeout(() => {
            if (completedLessons.size === totalLessons) {
                // Show performance analysis section after all quizzes are completed
                showPerformanceAnalysisSection();
                showTopicCompletionOption();
            }
        }, 500);
    });
}

// Export functions for global access
window.calculateOperation = calculateOperation;
window.takeLesson5Quiz = takeLesson5Quiz;
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
window.showLesson1Quiz = showLesson1Quiz;
window.runLessonQuiz = runLessonQuiz;
window.storeQuizData = storeQuizData;
window.toggleUserDropdown = toggleUserDropdown;
window.toggleMobileMenu = toggleMobileMenu;
window.confirmLogout = confirmLogout;
window.setSidebarActive = setSidebarActive;
window.updateSidebarProgress = updateSidebarProgress;
window.analyzePerformance = analyzePerformance;
window.showPerformanceAnalysisSection = showPerformanceAnalysisSection;
window.generateExplanation = generateExplanation;