// Representations of Rational Functions - Interactive JavaScript

// ------------------------------
// Lesson Navigation & Completion
// ------------------------------
let rprfCurrentLesson = 1;
let rprfCompletedLessons = new Set();
const rprfTotalLessons = 4;

document.addEventListener('DOMContentLoaded', function() {
    const lessonNavBtns = document.querySelectorAll('.lesson-nav-btn');
    const lessonSections = document.querySelectorAll('.lesson-section');

    // Inject completion + nav controls
    rprfInjectLessonControls();

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

            // Update state
            rprfCurrentLesson = parseInt(lessonNum, 10);
            rprfUpdateNavigationButtons();
            rprfUpdateProgressIndicators();
            rprfUpdateLessonCompletionStatus();

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

    // Load server completion and sync buttons
    rprfLoadCompletedLessons();
    rprfUpdateCompletionButtonsUI();

    // Initialize authentication guard and user progress
    initializeAuthGuard();
    loadUserProgress();

    // Initialize interactive tools
    try { initializeCalculators(); } catch (_) {}
});

function rprfInjectLessonControls() {
    const sections = document.querySelectorAll('.lesson-section');
    sections.forEach((section, index) => {
        const lessonNum = index + 1;
        if (section.querySelector('[data-rprf-controls]')) return;

        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-rprf-controls', 'true');
        wrapper.innerHTML = `
            <div class="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 mb-8">
                <h3 class="text-xl font-semibold text-gray-800 mb-4 text-center">
                    <i class="fas fa-check-circle text-emerald-500 mr-2"></i>Complete This Lesson
                </h3>
                <p class="text-gray-600 text-center mb-6">Mark this lesson as completed to track your progress and unlock the next lesson.</p>
                <div class="text-center">
                    <button onclick="rprfCompleteLesson(${lessonNum})" class="bg-emerald-500 text-white px-8 py-3 rounded-lg hover:bg-emerald-600 transition-colors font-semibold" data-rprf-complete-btn="${lessonNum}">
                        <i class="fas fa-check mr-2"></i>Mark as Complete
                    </button>
                </div>
            </div>

            <div class="flex justify-between items-center mb-8">
                <button onclick="rprfNavigateLesson(-1)" class="flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" data-rprf-prev>
                    <i class="fas fa-chevron-left mr-2"></i>Previous Lesson
                </button>
                <div class="flex items-center space-x-4">
                    <div class="text-center">
                        <div class="text-lg font-semibold text-primary"><span id="rprfCurrentLessonNum">${rprfCurrentLesson}</span> of ${rprfTotalLessons}</div>
                    </div>
                    <div class="w-32 bg-gray-200 rounded-full h-2">
                        <div id="rprfLessonProgressBar" class="bg-primary h-2 rounded-full transition-all duration-300" style="width: ${(rprfCurrentLesson / rprfTotalLessons) * 100}%"></div>
                    </div>
                </div>
                <button onclick="rprfNavigateLesson(1)" class="flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" data-rprf-next>
                    Next Lesson<i class="fas fa-chevron-right ml-2"></i>
                </button>
            </div>
        `;

        section.appendChild(wrapper);
    });

    rprfUpdateNavigationButtons();
}

function rprfNavigateLesson(direction) {
    const newLesson = rprfCurrentLesson + direction;
    if (newLesson >= 1 && newLesson <= rprfTotalLessons) {
        rprfShowLesson(newLesson, true);
    }
}

function rprfShowLesson(lessonNum, scrollToTop = false) {
    const lessonSections = document.querySelectorAll('.lesson-section');
    rprfCurrentLesson = lessonNum;
    lessonSections.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`lesson${lessonNum}`);
    if (target) target.classList.add('active');
    rprfUpdateNavigationButtons();
    rprfUpdateProgressIndicators();
    rprfUpdateLessonCompletionStatus();
    if (scrollToTop) {
        const lessonContent = document.querySelector('.lesson-content');
        if (lessonContent) lessonContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function rprfUpdateNavigationButtons() {
    const prev = document.querySelector('[data-rprf-prev]');
    const next = document.querySelector('[data-rprf-next]');
    if (prev) prev.disabled = rprfCurrentLesson === 1;
    if (next) next.disabled = rprfCurrentLesson === rprfTotalLessons;
}

function rprfUpdateProgressIndicators() {
    const numEls = document.querySelectorAll('#rprfCurrentLessonNum');
    numEls.forEach(el => el.textContent = String(rprfCurrentLesson));
    const bars = document.querySelectorAll('#rprfLessonProgressBar');
    bars.forEach(bar => bar.style.width = `${(rprfCurrentLesson / rprfTotalLessons) * 100}%`);
}

function rprfUpdateLessonCompletionStatus() {
    const navBtns = document.querySelectorAll('.lesson-nav-btn');
    navBtns.forEach(btn => {
        const lesson = parseInt(btn.getAttribute('data-lesson') || '0', 10);
        btn.classList.toggle('completed', rprfCompletedLessons.has(lesson));
        const icon = btn.querySelector('.w-16');
        if (icon && rprfCompletedLessons.has(lesson)) {
            icon.classList.add('bg-green-500', 'text-white');
            icon.classList.remove('bg-gray-300', 'text-gray-600');
        }
    });
    rprfUpdateCompletionButtonsUI();
    
    // Check if all lessons are completed and show topic completion option
    if (rprfCompletedLessons.size === rprfTotalLessons) {
        rprfShowTopicCompletionOption();
    }
}

function rprfGetCompleteButtonForLesson(lessonNum) {
    const section = document.getElementById(`lesson${lessonNum}`);
    if (!section) return null;
    return section.querySelector(`[data-rprf-complete-btn="${lessonNum}"]`);
}

function rprfSetCompleteButtonState(lessonNum, { completed = false, loading = false } = {}) {
    const btn = rprfGetCompleteButtonForLesson(lessonNum);
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

function rprfUpdateCompletionButtonsUI() {
    for (let i = 1; i <= rprfTotalLessons; i++) {
        rprfSetCompleteButtonState(i, { completed: rprfCompletedLessons.has(i) });
    }
}

async function rprfCompleteLesson(lessonNum) {
    try {
        console.log('Attempting to complete lesson:', lessonNum);
        
        if (rprfCompletedLessons.has(lessonNum)) { 
            rprfSetCompleteButtonState(lessonNum, { completed: true }); 
            return; 
        }
        
        rprfSetCompleteButtonState(lessonNum, { loading: true });
        
        const requestData = {
            topic: 'Representations of Rational Functions',
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
                        <p><strong>Topic:</strong> Representations of Rational Functions</p>
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
            
            rprfSetCompleteButtonState(lessonNum, { completed: false });
            return;
        }
        
        if (data && data.success) {
            await rprfLoadCompletedLessons();
            rprfSetCompleteButtonState(lessonNum, { completed: true });
            rprfUpdateLessonCompletionStatus();
            
            // Show success modal
            await Swal.fire({
                icon: 'success',
                title: 'Lesson Completed!',
                html: `
                    <div class="text-center">
                        <p class="text-lg mb-4">Great job completing <strong>Lesson ${lessonNum}</strong>!</p>
                        <p class="text-gray-600 mb-4">You're making excellent progress in Representations of Rational Functions.</p>
                        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <p class="text-green-800 font-semibold">Progress Update:</p>
                            <p class="text-green-700">${rprfCompletedLessons.size} of ${rprfTotalLessons} lessons completed</p>
                        </div>
                        ${rprfCompletedLessons.size === rprfTotalLessons ? 
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
            rprfSetCompleteButtonState(lessonNum, { completed: false });
            
            await Swal.fire({
                icon: 'error',
                title: 'Failed to Complete Lesson',
                html: `
                    <div class="text-left">
                        <p><strong>Error:</strong> ${data && data.message ? data.message : 'Unknown error occurred'}</p>
                        <p><strong>Lesson:</strong> ${lessonNum}</p>
                        <p><strong>Topic:</strong> Representations of Rational Functions</p>
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
        rprfSetCompleteButtonState(lessonNum, { completed: false });
        
        await Swal.fire({
            icon: 'error',
            title: 'Network Error',
            html: `
                <div class="text-left">
                    <p><strong>Error:</strong> ${e.message}</p>
                    <p><strong>Lesson:</strong> ${lessonNum}</p>
                    <p><strong>Topic:</strong> Representations of Rational Functions</p>
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

async function rprfLoadCompletedLessons() {
    try {
        console.log('Loading completed lessons for Representations of Rational Functions...');
        
        const requestData = {
            action: 'get_completed',
            topic: 'Representations of Rational Functions'
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
            rprfCompletedLessons = new Set(list);
            rprfUpdateLessonCompletionStatus();
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
            
            const topicKey = 'representations-of-rational-functions';
            const count = (data2 && data2.topics && data2.topics[topicKey] && data2.topics[topicKey].lessons_completed) || 0;
            const approx = Array.from({ length: Math.max(0, Math.min(count, rprfTotalLessons)) }, (_, i) => i + 1);
            rprfCompletedLessons = new Set(approx);
            rprfUpdateLessonCompletionStatus();
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

// Topic Completion Functions
function rprfShowTopicCompletionOption() {
    if (rprfCompletedLessons.size === rprfTotalLessons) {
        // Check if topic completion button already exists
        if (document.getElementById('rprfTopicCompletionBtn')) return;
        
        // Create topic completion section
        const completionSection = document.createElement('div');
        completionSection.id = 'rprfTopicCompletionSection';
        completionSection.className = 'bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-8 mb-8 border-2 border-emerald-200';
        completionSection.innerHTML = `
            <div class="text-center">
                <div class="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-trophy text-3xl"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-800 mb-4">🎉 Congratulations!</h3>
                <p class="text-lg text-gray-600 mb-6">You've completed all lessons in <strong>Representations of Rational Functions</strong>!</p>
                <p class="text-gray-700 mb-8">You can now mark this entire topic as completed and move on to the next topic.</p>
                <button id="rprfTopicCompletionBtn" onclick="rprfCompleteTopic()" 
                        class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                    <i class="fas fa-check-circle mr-2"></i>Complete Topic
                </button>
            </div>
        `;
        
        // Insert after the last lesson section
        const lastLesson = document.getElementById(`lesson${rprfTotalLessons}`);
        if (lastLesson) {
            lastLesson.parentNode.insertBefore(completionSection, lastLesson.nextSibling);
        }
    }
}

async function rprfCompleteTopic() {
    try {
        console.log('Attempting to complete topic: Representations of Rational Functions');
        
        const requestData = {
            topic: 'Representations of Rational Functions',
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
                        <p><strong>Topic:</strong> Representations of Rational Functions</p>
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
                        <p class="text-lg text-gray-600 mb-6">You've successfully completed <strong>Representations of Rational Functions</strong>!</p>
                        <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-6">
                            <p class="text-emerald-800 font-semibold mb-2">What you've accomplished:</p>
                            <ul class="text-emerald-700 text-left space-y-1">
                                <li>✅ Mastered rational function concepts</li>
                                <li>✅ Learned graphical representations</li>
                                <li>✅ Analyzed asymptotes and intercepts</li>
                                <li>✅ Applied knowledge to real-world problems</li>
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
                        <p><strong>Topic:</strong> Representations of Rational Functions</p>
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
                    <p><strong>Topic:</strong> Representations of Rational Functions</p>
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

// Expose functions for onclick
window.rprfNavigateLesson = rprfNavigateLesson;
window.rprfShowLesson = rprfShowLesson;
window.rprfCompleteLesson = rprfCompleteLesson;
window.rprfCompleteTopic = rprfCompleteTopic;

// Global fallbacks for virtual-aid preset handlers (ensure availability even if initializers haven't run yet)
window.rprfSetExplorer = function(num, den) {
    try {
        const n = document.getElementById('numeratorInput');
        const d = document.getElementById('denominatorInput');
        if (n) n.value = num;
        if (d) d.value = den;
        if (n && d) analyzeRationalFunction();
    } catch (_) {}
};
window.rprfSetGraphFunction = function(expr) {
    try {
        const f = document.getElementById('graphFunctionInput');
        if (f) {
            f.value = expr;
            graphRationalFunction();
        }
    } catch (_) {}
};
window.rprfSetGraphWindow = function(preset) {
    try {
        const xMin = document.getElementById('xMin');
        const xMax = document.getElementById('xMax');
        const yMin = document.getElementById('yMin');
        const yMax = document.getElementById('yMax');
        if (!xMin || !xMax || !yMin || !yMax) return;
        if (preset === 'std') { xMin.value = -10; xMax.value = 10; yMin.value = -10; yMax.value = 10; }
        else if (preset === 'zoomIn') { xMin.value = -5; xMax.value = 5; yMin.value = -5; yMax.value = 5; }
        else if (preset === 'wide') { xMin.value = -20; xMax.value = 20; yMin.value = -20; yMax.value = 20; }
        graphRationalFunction();
    } catch (_) {}
};
window.rprfSetAnalyzeFunction = function(expr) {
    try {
        const a = document.getElementById('analyzeFunctionInput');
        if (a) {
            a.value = expr;
            analyzeAsymptotesAndIntercepts();
        }
    } catch (_) {}
};

// Initialize all calculators and interactive tools
function initializeCalculators() {
    // Initialize Rational Function Explorer
    initializeRationalFunctionExplorer();
    
    // Initialize Rational Function Grapher
    initializeRationalFunctionGrapher();
    
    // Initialize Asymptote Analyzer
    initializeAsymptoteAnalyzer();
    
    // Initialize Real-World Problem Solver
    initializeRealWorldProblemSolver();
}

// Rational Function Explorer
function initializeRationalFunctionExplorer() {
    const numeratorInput = document.getElementById('numeratorInput');
    const denominatorInput = document.getElementById('denominatorInput');
    
    if (numeratorInput && denominatorInput) {
        // Add real-time updates with debouncing
        let timeout;
        [numeratorInput, denominatorInput].forEach(input => {
            input.addEventListener('input', function() {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    analyzeRationalFunction();
                }, 500);
            });
        });
    }
}

// Analyze Rational Function
function analyzeRationalFunction() {
    const numerator = document.getElementById('numeratorInput').value.trim();
    const denominator = document.getElementById('denominatorInput').value.trim();
    
    if (!numerator || !denominator) {
        showFunctionDisplay('f(x) = ', 'Enter both numerator and denominator', 'Enter both numerator and denominator', 'Enter both numerator and denominator');
        return;
    }
    
    try {
        // Display the function
        const functionDisplay = `f(x) = (${numerator})/(${denominator})`;
        document.getElementById('functionDisplay').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Function:</h4>
            <div class="text-lg font-mono text-primary">${functionDisplay}</div>
        `;
        
        // Analyze domain
        const domainAnalysis = analyzeDomain(denominator);
        document.getElementById('domainDisplay').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Domain:</h4>
            <div class="text-gray-700">${domainAnalysis}</div>
        `;
        
        // Analyze asymptotes
        const asymptotesAnalysis = analyzeAsymptotes(numerator, denominator);
        document.getElementById('asymptotesDisplay').innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Asymptotes:</h4>
            <div class="text-gray-700">Vertical: <span class="text-red-600">${asymptotesAnalysis.vertical}</span></div>
            <div class="text-gray-700">Horizontal: <span class="text-blue-600">${asymptotesAnalysis.horizontal}</span></div>
        `;
        // Copy summary helper
        window.rprfCopyExplorerSummary = function() {
            const text = `Function: ${functionDisplay}\nDomain: ${domainAnalysis}\nVertical Asymptotes: ${asymptotesAnalysis.vertical}\nHorizontal Asymptotes: ${asymptotesAnalysis.horizontal}`;
            navigator.clipboard.writeText(text)
                .then(() => showSuccess('Summary copied to clipboard'))
                .catch(() => showError('Copy failed'));
        };
        
    } catch (error) {
        console.error('Error analyzing function:', error);
        showError('Invalid function format. Please check your input.');
    }
}

// Analyze Domain
function analyzeDomain(denominator) {
    // Simple domain analysis for common cases
    if (denominator.includes('x')) {
        if (denominator === 'x') {
            return 'All real numbers except x = 0';
        } else if (denominator === 'x - 2') {
            return 'All real numbers except x = 2';
        } else if (denominator === 'x + 1') {
            return 'All real numbers except x = -1';
        } else if (denominator.includes('x²')) {
            return 'All real numbers except where denominator equals zero';
        } else {
            return 'All real numbers except where denominator equals zero';
        }
    }
    return 'All real numbers';
}

// Analyze Asymptotes
function analyzeAsymptotes(numerator, denominator) {
    const verticalAsymptotes = [];
    const horizontalAsymptotes = [];
    
    // Simple vertical asymptote analysis
    if (denominator === 'x') {
        verticalAsymptotes.push('x = 0');
    } else if (denominator === 'x - 2') {
        verticalAsymptotes.push('x = 2');
    } else if (denominator === 'x + 1') {
        verticalAsymptotes.push('x = -1');
    } else if (denominator.includes('x²')) {
        verticalAsymptotes.push('Multiple vertical asymptotes');
    }
    
    // Simple horizontal asymptote analysis
    if (numerator.includes('x²') && denominator.includes('x²')) {
        horizontalAsymptotes.push('y = ratio of leading coefficients');
    } else if (denominator.includes('x²') && !numerator.includes('x²')) {
        horizontalAsymptotes.push('y = 0');
    } else if (numerator.includes('x') && denominator.includes('x')) {
        horizontalAsymptotes.push('y = ratio of leading coefficients');
    } else {
        horizontalAsymptotes.push('y = 0');
    }
    
    return {
        vertical: verticalAsymptotes.length > 0 ? verticalAsymptotes.join(', ') : 'None',
        horizontal: horizontalAsymptotes.length > 0 ? horizontalAsymptotes.join(', ') : 'None'
    };
}

// Rational Function Grapher
function initializeRationalFunctionGrapher() {
    const graphFunctionInput = document.getElementById('graphFunctionInput');
    
    if (graphFunctionInput) {
        // Preset setters for function and window
        window.rprfSetGraphFunction = function(expr) {
            graphFunctionInput.value = expr;
            graphRationalFunction();
        };
        window.rprfSetGraphWindow = function(preset) {
            const xMin = document.getElementById('xMin');
            const xMax = document.getElementById('xMax');
            const yMin = document.getElementById('yMin');
            const yMax = document.getElementById('yMax');
            if (!xMin || !xMax || !yMin || !yMax) return;
            if (preset === 'std') {
                xMin.value = -10; xMax.value = 10; yMin.value = -10; yMax.value = 10;
            } else if (preset === 'zoomIn') {
                xMin.value = -5; xMax.value = 5; yMin.value = -5; yMax.value = 5;
            } else if (preset === 'wide') {
                xMin.value = -20; xMax.value = 20; yMin.value = -20; yMax.value = 20;
            }
            graphRationalFunction();
        };
    }
}

// Graph Rational Function
function graphRationalFunction() {
    const functionInput = document.getElementById('graphFunctionInput').value.trim();
    const canvas = document.getElementById('rationalGraphCanvas');
    
    if (!functionInput || !canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set up coordinate system
    const xMin = parseFloat(document.getElementById('xMin').value) || -10;
    const xMax = parseFloat(document.getElementById('xMax').value) || 10;
    const yMin = parseFloat(document.getElementById('yMin').value) || -10;
    const yMax = parseFloat(document.getElementById('yMax').value) || 10;
    
    // Draw grid, axes, and asymptotes
    drawGrid(ctx, width, height, xMin, xMax, yMin, yMax);
    drawAxes(ctx, width, height, xMin, xMax, yMin, yMax);
    const verticalXs = detectVerticalAsymptotes(functionInput, xMin, xMax);
    drawAsymptotes(ctx, width, height, xMin, xMax, yMin, yMax, verticalXs);
    
    // Draw function
    drawFunction(ctx, width, height, xMin, xMax, yMin, yMax, functionInput);
    
    // Update asymptotes and intercepts info and mark intercepts
    updateGraphInfoAdvanced(functionInput, xMin, xMax, verticalXs);
    const xZeros = findXIntercepts(functionInput, xMin, xMax);
    const yInt = getYIntercept(functionInput);
    ctx.fillStyle = '#16a34a';
    xZeros.forEach(x0 => {
        const xPos = (x0 - xMin) / (xMax - xMin) * width;
        const yPos = height - (0 - yMin) / (yMax - yMin) * height;
        if (isFinite(xPos) && isFinite(yPos)) {
            ctx.beginPath();
            ctx.arc(xPos, yPos, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    if (isFinite(yInt)) {
        ctx.fillStyle = '#7c3aed';
        const xPos = (0 - xMin) / (xMax - xMin) * width;
        const yPos = height - (yInt - yMin) / (yMax - yMin) * height;
        if (isFinite(xPos) && isFinite(yPos)) {
            ctx.beginPath();
            ctx.arc(xPos, yPos, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Draw Axes
function drawAxes(ctx, width, height, xMin, xMax, yMin, yMax) {
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#374151';
    ctx.font = '11px Arial';
    // X-axis
    const xAxisY = height - (0 - yMin) / (yMax - yMin) * height;
    if (xAxisY >= 0 && xAxisY <= height) {
        ctx.beginPath();
        ctx.moveTo(0, xAxisY);
        ctx.lineTo(width, xAxisY);
        ctx.stroke();
        const stepX = Math.max(1, Math.floor((xMax - xMin) / 10));
        for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += stepX) {
            const xPos = (x - xMin) / (xMax - xMin) * width;
            ctx.beginPath();
            ctx.moveTo(xPos, xAxisY - 4);
            ctx.lineTo(xPos, xAxisY + 4);
            ctx.stroke();
            if (Math.abs(x) > 1e-9) ctx.fillText(String(x), xPos - 6, xAxisY + 14);
        }
    }
    // Y-axis
    const yAxisX = (0 - xMin) / (xMax - xMin) * width;
    if (yAxisX >= 0 && yAxisX <= width) {
        ctx.beginPath();
        ctx.moveTo(yAxisX, 0);
        ctx.lineTo(yAxisX, height);
        ctx.stroke();
        const stepY = Math.max(1, Math.floor((yMax - yMin) / 10));
        for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += stepY) {
            const yPos = height - (y - yMin) / (yMax - yMin) * height;
            ctx.beginPath();
            ctx.moveTo(yAxisX - 4, yPos);
            ctx.lineTo(yAxisX + 4, yPos);
            ctx.stroke();
            if (Math.abs(y) > 1e-9) ctx.fillText(String(y), yAxisX + 6, yPos + 4);
        }
    }
}

// Draw Grid
function drawGrid(ctx, width, height, xMin, xMax, yMin, yMax) {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
        const xPos = (x - xMin) / (xMax - xMin) * width;
        ctx.beginPath();
        ctx.moveTo(xPos, 0);
        ctx.lineTo(xPos, height);
        ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
        const yPos = height - (y - yMin) / (yMax - yMin) * height;
        ctx.beginPath();
        ctx.moveTo(0, yPos);
        ctx.lineTo(width, yPos);
        ctx.stroke();
    }
}

// Draw Asymptotes
function drawAsymptotes(ctx, width, height, xMin, xMax, yMin, yMax, verticalXs) {
    if (!Array.isArray(verticalXs) || !verticalXs.length) return;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    verticalXs.forEach(xa => {
        const xPos = (xa - xMin) / (xMax - xMin) * width;
        if (xPos >= 0 && xPos <= width) {
            ctx.beginPath();
            ctx.moveTo(xPos, 0);
            ctx.lineTo(xPos, height);
            ctx.stroke();
        }
    });
    ctx.setLineDash([]);
}

// Draw Function
function drawFunction(ctx, width, height, xMin, xMax, yMin, yMax, functionInput) {
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    let firstPoint = true;
    
    for (let x = xMin; x <= xMax; x += (xMax - xMin) / width) {
        try {
            const y = evaluateFunction(functionInput, x);
            
            if (isFinite(y) && y >= yMin && y <= yMax) {
                const xPos = (x - xMin) / (xMax - xMin) * width;
                const yPos = height - (y - yMin) / (yMax - yMin) * height;
                
                if (firstPoint) {
                    ctx.moveTo(xPos, yPos);
                    firstPoint = false;
                } else {
                    // Break on large jumps to handle asymptotes
                    const prevY = evaluateFunction(functionInput, x - (xMax - xMin) / width);
                    if (isFinite(prevY) && Math.abs(prevY - y) > (yMax - yMin) * 0.5) {
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(xPos, yPos);
                    } else {
                        ctx.lineTo(xPos, yPos);
                    }
                }
            } else {
                if (!firstPoint) {
                    ctx.stroke();
                    ctx.beginPath();
                    firstPoint = true;
                }
            }
        } catch (error) {
            // Skip invalid points
        }
    }
    
    if (!firstPoint) {
        ctx.stroke();
    }
}

// Evaluate Function (simplified)
function evaluateFunction(functionInput, x) {
    // Lightweight safe evaluator: supports + - * / ^, parentheses, and x
    try {
        const expr = functionInput
            .replace(/\^/g, '**')
            .replace(/\s+/g, '')
            .replace(/([0-9x\)])\(/g, '$1*('); // implicit multiply
        const body = `const x=${x}; return (${expr});`;
        // eslint-disable-next-line no-new-func
        const fn = new Function(body);
        const val = fn();
        if (!isFinite(val)) return NaN;
        return val;
    } catch (_) {
        return NaN;
    }
}

// Update Graph Info
function updateGraphInfo(functionInput) {
    // Better text hints based on simple pattern checks
    let verticalAsymptotes = 'None';
    if (/(x\s*[-+]\s*2)\)?/.test(functionInput)) verticalAsymptotes = verticalAsymptotes === 'None' ? 'x = 2' : verticalAsymptotes + ', x = 2';
    if (/(x\s*[+]\s*1)\)?/.test(functionInput)) verticalAsymptotes = verticalAsymptotes === 'None' ? 'x = -1' : verticalAsymptotes + ', x = -1';
    let horizontalAsymptotes = functionInput.includes('x^2') || functionInput.includes('x²') ? 'Depends on degrees' : 'y = 0';
    
    document.getElementById('asymptotesInfo').innerHTML = `
        <div>Vertical: <span class="text-red-600">${verticalAsymptotes}</span></div>
        <div>Horizontal: <span class="text-blue-600">${horizontalAsymptotes}</span></div>
    `;
    
    // Update intercepts info (very basic hints)
    let xIntercepts = functionInput.includes('x+1') ? 'x = -1' : 'Depends on numerator';
    let yIntercept = functionInput.includes('1/x') ? 'None (undefined at x=0)' : 'Depends on function';
    
    document.getElementById('interceptsInfo').innerHTML = `
        <div>X-intercepts: <span class="text-green-600">${xIntercepts}</span></div>
        <div>Y-intercept: <span class="text-purple-600">${yIntercept}</span></div>
    `;
}

// Advanced graph info using numeric sampling
function updateGraphInfoAdvanced(functionInput, xMin, xMax, verticalXs) {
    try {
        const vText = (Array.isArray(verticalXs) && verticalXs.length)
            ? verticalXs.map(x => `x = ${round2(x)}`).join(', ')
            : 'None';
        // Estimate horizontal behavior near edges
        const leftY = evaluateFunction(functionInput, xMin + 0.001);
        const rightY = evaluateFunction(functionInput, xMax - 0.001);
        const hVal = (isFinite(leftY) && isFinite(rightY)) ? round2((leftY + rightY) / 2) : 'Depends on degrees';
        const hText = typeof hVal === 'number' ? `y = ${hVal}` : String(hVal);
        const asyEl = document.getElementById('asymptotesInfo');
        if (asyEl) {
            asyEl.innerHTML = `
                <div>Vertical: <span class="text-red-600">${vText}</span></div>
                <div>Horizontal: <span class="text-blue-600">${hText}</span></div>
            `;
        }
        // X intercepts and Y intercept
        const zeros = findXIntercepts(functionInput, xMin, xMax);
        const xText = zeros.length ? zeros.map(z => `x = ${round2(z)}`).join(', ') : 'None';
        const yInt = getYIntercept(functionInput);
        const yText = isFinite(yInt) ? `y = ${round2(yInt)}` : 'None (undefined at x = 0)';
        const intEl = document.getElementById('interceptsInfo');
        if (intEl) {
            intEl.innerHTML = `
                <div>X-intercepts: <span class="text-green-600">${xText}</span></div>
                <div>Y-intercept: <span class="text-purple-600">${yText}</span></div>
            `;
        }
    } catch (_) {
        // Fallback to simple updater
        updateGraphInfo(functionInput);
    }
}

function detectVerticalAsymptotes(funcStr, xMin, xMax) {
    const xs = [];
    const steps = 600;
    let prevY = evaluateFunction(funcStr, xMin);
    for (let i = 1; i <= steps; i++) {
        const x = xMin + (i / steps) * (xMax - xMin);
        const y = evaluateFunction(funcStr, x);
        if (!isFinite(y) || Math.abs(y) > 1e6) {
            xs.push(x);
        } else if (isFinite(prevY) && Math.abs(y - prevY) > 1000) {
            xs.push(x);
        }
        prevY = y;
    }
    // Deduplicate close values
    const dedup = [];
    xs.sort((a, b) => a - b).forEach(v => {
        if (!dedup.length || Math.abs(dedup[dedup.length - 1] - v) > (xMax - xMin) / 50) dedup.push(v);
    });
    return dedup.map(round2);
}

function findXIntercepts(funcStr, xMin, xMax) {
    const roots = [];
    const steps = 400;
    let prevX = xMin;
    let prevY = evaluateFunction(funcStr, prevX);
    for (let i = 1; i <= steps; i++) {
        const x = xMin + (i / steps) * (xMax - xMin);
        const y = evaluateFunction(funcStr, x);
        if (isFinite(prevY) && isFinite(y)) {
            if (prevY === 0) roots.push(prevX);
            if (prevY * y < 0) {
                // bisection refine
                let a = prevX, b = x, fa = prevY, fb = y;
                for (let k = 0; k < 20; k++) {
                    const m = (a + b) / 2;
                    const fm = evaluateFunction(funcStr, m);
                    if (!isFinite(fm)) break;
                    if (fa * fm <= 0) { b = m; fb = fm; } else { a = m; fa = fm; }
                }
                roots.push((a + b) / 2);
            }
        }
        prevX = x; prevY = y;
    }
    // Deduplicate close roots
    const out = [];
    roots.sort((a, b) => a - b).forEach(r => {
        if (!out.length || Math.abs(out[out.length - 1] - r) > (xMax - xMin) / 100) out.push(r);
    });
    return out;
}

function getYIntercept(funcStr) {
    return evaluateFunction(funcStr, 0);
}

function round2(v) { return Math.round(v * 100) / 100; }

// Asymptote Analyzer
function initializeAsymptoteAnalyzer() {
    const analyzeFunctionInput = document.getElementById('analyzeFunctionInput');
    
    if (analyzeFunctionInput) {
        window.rprfSetAnalyzeFunction = function(expr) {
            analyzeFunctionInput.value = expr;
            analyzeAsymptotesAndIntercepts();
        };
    }
}

// Analyze Asymptotes and Intercepts
function analyzeAsymptotesAndIntercepts() {
    const functionInput = document.getElementById('analyzeFunctionInput').value.trim();
    
    if (!functionInput) {
        resetAnalysisResults();
        return;
    }
    
    try {
        // Analyze vertical asymptotes
        const verticalAsymptotes = analyzeVerticalAsymptotes(functionInput);
        document.getElementById('verticalAsymptotes').innerHTML = verticalAsymptotes;
        
        // Analyze horizontal asymptotes
        const horizontalAsymptotes = analyzeHorizontalAsymptotes(functionInput);
        document.getElementById('horizontalAsymptotes').innerHTML = horizontalAsymptotes;
        
        // Analyze x-intercepts
        const xIntercepts = analyzeXIntercepts(functionInput);
        document.getElementById('xIntercepts').innerHTML = xIntercepts;
        
        // Analyze y-intercept
        const yIntercept = analyzeYIntercept(functionInput);
        document.getElementById('yIntercept').innerHTML = yIntercept;
        
    } catch (error) {
        console.error('Error analyzing function:', error);
        showError('Invalid function format. Please check your input.');
    }
}

// Analyze Vertical Asymptotes
function analyzeVerticalAsymptotes(functionInput) {
    if (functionInput.includes('x - 2')) {
        return '<span class="text-red-600 font-semibold">x = 2</span><br><small class="text-gray-600">Denominator equals zero when x = 2</small>';
    } else if (functionInput.includes('x + 1')) {
        return '<span class="text-red-600 font-semibold">x = -1</span><br><small class="text-gray-600">Denominator equals zero when x = -1</small>';
    } else if (functionInput.includes('x² - 9')) {
        return '<span class="text-red-600 font-semibold">x = 3, x = -3</span><br><small class="text-gray-600">Denominator equals zero when x² = 9</small>';
    } else {
        return '<span class="text-gray-600">Enter a function to analyze</span>';
    }
}

// Analyze Horizontal Asymptotes
function analyzeHorizontalAsymptotes(functionInput) {
    if (functionInput.includes('x²') && functionInput.includes('x²')) {
        return '<span class="text-blue-600 font-semibold">y = ratio of leading coefficients</span><br><small class="text-gray-600">Degrees of numerator and denominator are equal</small>';
    } else if (functionInput.includes('x²') && !functionInput.includes('x²')) {
        return '<span class="text-blue-600 font-semibold">y = 0</span><br><small class="text-gray-600">Degree of denominator is greater</small>';
    } else if (functionInput.includes('x') && functionInput.includes('x')) {
        return '<span class="text-blue-600 font-semibold">y = ratio of leading coefficients</span><br><small class="text-gray-600">Degrees of numerator and denominator are equal</small>';
    } else {
        return '<span class="text-blue-600 font-semibold">y = 0</span><br><small class="text-gray-600">Degree of denominator is greater</small>';
    }
}

// Analyze X-intercepts
function analyzeXIntercepts(functionInput) {
    if (functionInput.includes('x² - 1')) {
        return '<span class="text-green-600 font-semibold">x = 1, x = -1</span><br><small class="text-gray-600">Numerator equals zero when x² = 1</small>';
    } else if (functionInput.includes('x + 1')) {
        return '<span class="text-green-600 font-semibold">x = -1</span><br><small class="text-gray-600">Numerator equals zero when x = -1</small>';
    } else {
        return '<span class="text-gray-600">Enter a function to analyze</span>';
    }
}

// Analyze Y-intercept
function analyzeYIntercept(functionInput) {
    if (functionInput.includes('1/x')) {
        return '<span class="text-purple-600 font-semibold">None (undefined at x = 0)</span><br><small class="text-gray-600">Function is undefined when x = 0</small>';
    } else if (functionInput.includes('x² - 1')) {
        return '<span class="text-purple-600 font-semibold">y = -0.5</span><br><small class="text-gray-600">f(0) = -1/2</small>';
    } else {
        return '<span class="text-gray-600">Enter a function to analyze</span>';
    }
}

// Reset Analysis Results
function resetAnalysisResults() {
    document.getElementById('verticalAsymptotes').innerHTML = 'Enter a function to analyze';
    document.getElementById('horizontalAsymptotes').innerHTML = 'Enter a function to analyze';
    document.getElementById('xIntercepts').innerHTML = 'Enter a function to analyze';
    document.getElementById('yIntercept').innerHTML = 'Enter a function to analyze';
}

// Real-World Problem Solver
function initializeRealWorldProblemSolver() {
    const problemTypeSelect = document.getElementById('problemType');
    
    if (problemTypeSelect) {
        problemTypeSelect.addEventListener('change', function() {
            updateProblemInputs(this.value);
        });
    }
}

// Update Problem Inputs
function updateProblemInputs(problemType) {
    const problemInputs = document.getElementById('problemInputs');
    const problemDescription = document.getElementById('problemDescription');
    
    if (!problemInputs || !problemDescription) return;
    
    switch (problemType) {
        case 'resistance':
            problemInputs.innerHTML = `
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
            problemDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Problem Description:</h4>
                <div class="text-gray-700">Three resistors with resistances R₁, R₂, and R₃ are connected in parallel. Find the total resistance using the formula: 1/R_total = 1/R₁ + 1/R₂ + 1/R₃</div>
            `;
            break;
            
        case 'lens':
            problemInputs.innerHTML = `
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
            problemDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Problem Description:</h4>
                <div class="text-gray-700">Using the lens equation 1/f = 1/d₀ + 1/dᵢ, find the image distance when given the focal length and object distance.</div>
            `;
            break;
            
        case 'cost':
            problemInputs.innerHTML = `
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
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Number of Units:</label>
                    <input type="number" id="units" placeholder="e.g., 100" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                </div>
            `;
            problemDescription.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">Problem Description:</h4>
                <div class="text-gray-700">Calculate the average cost per unit using the formula AC(x) = C(x)/x, where C(x) = Fixed Cost + (Variable Cost × x).</div>
            `;
            break;
            
        default:
            problemInputs.innerHTML = '<div class="text-gray-600">Select a problem type to see inputs</div>';
            problemDescription.innerHTML = '<div class="text-gray-600">Select a problem type to see the description</div>';
    }
}

// Solve Real-World Problem
function solveRealWorldProblem() {
    const problemType = document.getElementById('problemType').value;
    
    if (!problemType) {
        showError('Please select a problem type first.');
        return;
    }
    
    try {
        let solution;
        
        switch (problemType) {
            case 'resistance':
                solution = solveResistanceProblem();
                break;
            case 'lens':
                solution = solveLensProblem();
                break;
            case 'cost':
                solution = solveCostProblem();
                break;
            default:
                showError('Unknown problem type.');
                return;
        }
        
        displaySolution(solution);
        
    } catch (error) {
        console.error('Error solving problem:', error);
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
    
    const reciprocalSum = (1/r1) + (1/r2) + (1/r3);
    const totalResistance = 1 / reciprocalSum;
    
    return {
        steps: [
            `Given: R₁ = ${r1}Ω, R₂ = ${r2}Ω, R₃ = ${r3}Ω`,
            `Formula: 1/R_total = 1/R₁ + 1/R₂ + 1/R₃`,
            `1/R_total = 1/${r1} + 1/${r2} + 1/${r3}`,
            `1/R_total = ${(1/r1).toFixed(4)} + ${(1/r2).toFixed(4)} + ${(1/r3).toFixed(4)}`,
            `1/R_total = ${reciprocalSum.toFixed(4)}`,
            `R_total = 1/${reciprocalSum.toFixed(4)}`,
            `R_total = ${totalResistance.toFixed(2)}Ω`
        ],
        answer: `Total resistance = ${totalResistance.toFixed(2)}Ω`
    };
}

// Solve Lens Problem
function solveLensProblem() {
    const focalLength = parseFloat(document.getElementById('focalLength').value);
    const objectDistance = parseFloat(document.getElementById('objectDistance').value);
    
    if (!focalLength || !objectDistance) {
        throw new Error('Please enter both focal length and object distance.');
    }
    
    const imageDistance = 1 / ((1/focalLength) - (1/objectDistance));
    
    return {
        steps: [
            `Given: f = ${focalLength}cm, d₀ = ${objectDistance}cm`,
            `Formula: 1/f = 1/d₀ + 1/dᵢ`,
            `1/${focalLength} = 1/${objectDistance} + 1/dᵢ`,
            `1/dᵢ = 1/${focalLength} - 1/${objectDistance}`,
            `1/dᵢ = ${(1/focalLength).toFixed(4)} - ${(1/objectDistance).toFixed(4)}`,
            `1/dᵢ = ${((1/focalLength) - (1/objectDistance)).toFixed(4)}`,
            `dᵢ = ${imageDistance.toFixed(2)}cm`
        ],
        answer: `Image distance = ${imageDistance.toFixed(2)}cm`
    };
}

// Solve Cost Problem
function solveCostProblem() {
    const fixedCost = parseFloat(document.getElementById('fixedCost').value);
    const variableCost = parseFloat(document.getElementById('variableCost').value);
    const units = parseFloat(document.getElementById('units').value);
    
    if (!fixedCost || !variableCost || !units) {
        throw new Error('Please enter all cost values.');
    }
    
    const totalCost = fixedCost + (variableCost * units);
    const averageCost = totalCost / units;
    
    return {
        steps: [
            `Given: Fixed Cost = $${fixedCost}, Variable Cost = $${variableCost}/unit, Units = ${units}`,
            `Total Cost: C(x) = Fixed Cost + (Variable Cost × x)`,
            `C(${units}) = $${fixedCost} + ($${variableCost} × ${units})`,
            `C(${units}) = $${fixedCost} + $${variableCost * units}`,
            `C(${units}) = $${totalCost}`,
            `Average Cost: AC(x) = C(x)/x`,
            `AC(${units}) = $${totalCost}/${units}`,
            `AC(${units}) = $${averageCost.toFixed(2)}`
        ],
        answer: `Average cost per unit = $${averageCost.toFixed(2)}`
    };
}

// Display Solution
function displaySolution(solution) {
    const solutionSteps = document.getElementById('solutionSteps');
    const finalAnswer = document.getElementById('finalAnswer');
    
    if (solutionSteps) {
        solutionSteps.innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Solution Steps:</h4>
            <ol class="list-decimal list-inside space-y-1 text-gray-700">
                ${solution.steps.map(step => `<li>${step}</li>`).join('')}
            </ol>
        `;
    }
    
    if (finalAnswer) {
        finalAnswer.innerHTML = `
            <h4 class="font-semibold text-gray-800 mb-2">Final Answer:</h4>
            <div class="text-lg font-semibold text-green-600">${solution.answer}</div>
        `;
    }
}

// Utility Functions
function showFunctionDisplay(functionText, domainText, verticalAsymptotes, horizontalAsymptotes) {
    document.getElementById('functionDisplay').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Function:</h4>
        <div class="text-lg font-mono text-primary">${functionText}</div>
    `;
    document.getElementById('domainDisplay').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Domain:</h4>
        <div class="text-gray-700">${domainText}</div>
    `;
    document.getElementById('asymptotesDisplay').innerHTML = `
        <h4 class="font-semibold text-gray-800 mb-2">Asymptotes:</h4>
        <div class="text-gray-700">Vertical: <span class="text-red-600">${verticalAsymptotes}</span></div>
        <div class="text-gray-700">Horizontal: <span class="text-blue-600">${horizontalAsymptotes}</span></div>
    `;
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
    const savedProgress = localStorage.getItem('representationsOfRationalFunctionsProgress');
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
    const progress = JSON.parse(localStorage.getItem('representationsOfRationalFunctionsProgress') || '{}');
    progress[lessonId] = {
        completed: completed,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('representationsOfRationalFunctionsProgress', JSON.stringify(progress));
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

// Auto-save functionality
function autoSave() {
    const currentLesson = localStorage.getItem('currentLesson') || '1';
    const progress = JSON.parse(localStorage.getItem('representationsOfRationalFunctionsProgress') || '{}');
    
    // Mark current lesson as in progress
    progress[`lesson${currentLesson}`] = {
        completed: false,
        inProgress: true,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('representationsOfRationalFunctionsProgress', JSON.stringify(progress));
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
