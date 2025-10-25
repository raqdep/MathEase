// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }));
}

// Smooth scrolling for navigation links (skip empty/hash anchors)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        // If href is exactly '#' or empty, do nothing
        if (!href || href === '#') return;
        e.preventDefault();
        try {
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        } catch (err) {
            console.warn('Invalid anchor selector:', href, err);
        }
    });
});

// Navbar background change on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(102, 126, 234, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            navbar.style.backdropFilter = 'none';
        }
    }
});

// Animate elements on scroll
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const observerOptions = {
    threshold: reduceMotion ? 0 : 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all feature cards, topic cards, and quiz categories
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.feature-card, .topic-card, .quiz-category');
    
    animatedElements.forEach(el => {
        if (!reduceMotion) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        }
    });
});

// Progress tracking functionality
class ProgressTracker {
    constructor() {
        this.progress = JSON.parse(localStorage.getItem('mathease-progress')) || {
            topics: {},
            quizzes: {},
            totalScore: 0,
            completedLessons: 0
        };
    }

    updateTopicProgress(topicId, completed) {
        if (!this.progress.topics[topicId]) {
            this.progress.topics[topicId] = {
                completed: false,
                score: 0,
                attempts: 0
            };
        }
        
        this.progress.topics[topicId].completed = completed;
        if (completed) {
            this.progress.completedLessons++;
        }
        
        this.saveProgress();
    }

    updateQuizProgress(quizId, score, totalQuestions) {
        if (!this.progress.quizzes[quizId]) {
            this.progress.quizzes[quizId] = {
                bestScore: 0,
                attempts: 0,
                lastAttempt: null
            };
        }
        
        this.progress.quizzes[quizId].attempts++;
        this.progress.quizzes[quizId].lastAttempt = new Date().toISOString();
        
        if (score > this.progress.quizzes[quizId].bestScore) {
            this.progress.quizzes[quizId].bestScore = score;
            this.progress.totalScore += score;
        }
        
        this.saveProgress();
    }

    getProgress() {
        return this.progress;
    }

    saveProgress() {
        localStorage.setItem('mathease-progress', JSON.stringify(this.progress));
    }

    resetProgress() {
        this.progress = {
            topics: {},
            quizzes: {},
            totalScore: 0,
            completedLessons: 0
        };
        this.saveProgress();
    }
    
    // Enhanced progress tracking with better error handling
    updateTopicProgress(topicId, completed, score = 0) {
        try {
            if (!this.progress.topics[topicId]) {
                this.progress.topics[topicId] = {
                    completed: false,
                    score: 0,
                    attempts: 0,
                    lastAttempt: null,
                    timeSpent: 0
                };
            }
            
            const topic = this.progress.topics[topicId];
            topic.completed = completed;
            topic.score = Math.max(topic.score, score);
            topic.attempts++;
            topic.lastAttempt = new Date().toISOString();
            
            if (completed && !topic.completed) {
                this.progress.completedLessons++;
            }
            
            this.saveProgress();
            return true;
        } catch (error) {
            console.error('Error updating topic progress:', error);
            return false;
        }
    }
    
    // Get progress statistics
    getProgressStats() {
        const topics = Object.values(this.progress.topics);
        const completedTopics = topics.filter(t => t.completed).length;
        const totalTopics = topics.length;
        const averageScore = topics.length > 0 ? 
            topics.reduce((sum, t) => sum + t.score, 0) / topics.length : 0;
        
        return {
            totalTopics,
            completedTopics,
            completionRate: totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0,
            averageScore,
            totalScore: this.progress.totalScore,
            completedLessons: this.progress.completedLessons
        };
    }
}

// Initialize progress tracker
const progressTracker = new ProgressTracker();

// Quiz functionality
class QuizManager {
    constructor() {
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.totalQuestions = 0;
    }

    startQuiz(quizData) {
        this.currentQuiz = quizData;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.totalQuestions = quizData.questions.length;
        this.showQuestion();
    }

    showQuestion() {
        if (this.currentQuestionIndex >= this.totalQuestions) {
            this.endQuiz();
            return;
        }

        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        // Implementation for displaying questions
        console.log('Showing question:', question);
    }

    submitAnswer(answer) {
        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        
        if (answer === question.correctAnswer) {
            this.score++;
        }
        
        this.currentQuestionIndex++;
        this.showQuestion();
    }

    endQuiz() {
        const percentage = (this.score / this.totalQuestions) * 100;
        progressTracker.updateQuizProgress(this.currentQuiz.id, this.score, this.totalQuestions);
        
        // Show results
        this.showResults(percentage);
    }

    showResults(percentage) {
        // Implementation for showing quiz results
        console.log(`Quiz completed! Score: ${this.score}/${this.totalQuestions} (${percentage.toFixed(1)}%)`);
    }
}

// Initialize quiz manager
const quizManager = new QuizManager();

// Form validation
function validateForm(formElement) {
    const inputs = formElement.querySelectorAll('input[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('error');
            isValid = false;
        } else {
            input.classList.remove('error');
        }
    });

    return isValid;
}

// Add form validation to all forms
document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            if (!validateForm(form)) {
                e.preventDefault();
                alert('Please fill in all required fields.');
            }
        });
    });
});

// Loading animation
function showLoading() {
    const existing = document.querySelector('.loader');
    if (existing) return;

    const quotes = [
        { q: 'Mathematics is the language in which God has written the universe.', a: 'Galileo Galilei' },
        { q: 'Pure mathematics is, in its way, the poetry of logical ideas.', a: 'Albert Einstein' },
        { q: 'The only way to learn mathematics is to do mathematics.', a: 'Paul Halmos' },
        { q: 'In mathematics, the art of proposing a question must be held of higher value than solving it.', a: 'Georg Cantor' },
        { q: 'Mathematics compares the most diverse phenomena and discovers the secret analogies that unite them.', a: 'Joseph Fourier' },
        { q: 'There should be no such thing as boring mathematics.', a: 'Edsger Dijkstra' }
    ];

    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.innerHTML = `
        <div class="tw-loader fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div class="tw-card w-full max-w-xl bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200/80 p-6 md:p-8 animate-[fadeIn_300ms_ease]">
                <div class="flex items-center gap-4 mb-4">
                    <div class="tw-spinner w-12 h-12 rounded-full border-4 border-slate-200 border-t-indigo-500 animate-spin"></div>
                    <div>
                        <h3 class="text-slate-900 font-bold text-lg md:text-xl">Preparing your MathEase experience…</h3>
                        <p class="text-slate-600 text-sm">Fetching your progress and lessons. Please wait.</p>
                    </div>
                </div>
                <div class="mt-3">
                    <div class="text-slate-800 text-base md:text-lg font-medium leading-relaxed transition-opacity duration-500" id="quoteText"></div>
                    <div class="text-indigo-600 font-semibold text-sm mt-2" id="quoteAuthor"></div>
                </div>
                <div class="mt-6 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full animate-[indeterminate_1400ms_linear_infinite]"></div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(loader);

    const quoteTextEl = loader.querySelector('#quoteText');
    const quoteAuthorEl = loader.querySelector('#quoteAuthor');
    let i = Math.floor(Math.random() * quotes.length);

    function setQuote(idx) {
        const { q, a } = quotes[idx % quotes.length];
        quoteTextEl.textContent = `“${q}”`;
        quoteAuthorEl.textContent = `— ${a}`;
    }

    function fadeToNextQuote() {
        try {
            quoteTextEl.style.opacity = '0';
            quoteAuthorEl.style.opacity = '0';
            setTimeout(() => {
                setQuote(i++);
                quoteTextEl.style.opacity = '1';
                quoteAuthorEl.style.opacity = '1';
            }, 250);
        } catch (_) {
            // no-op
        }
    }

    // Initial quote
    setQuote(i++);
    quoteTextEl.style.transition = 'opacity 300ms ease';
    quoteAuthorEl.style.transition = 'opacity 300ms ease';

    const intervalId = setInterval(() => {
        // Reduce motion awareness
        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) {
            setQuote(i++);
            return;
        }
        fadeToNextQuote();
    }, 3200);

    loader.dataset.intervalId = String(intervalId);
}

function hideLoading() {
    const loader = document.querySelector('.loader');
    if (loader) {
        const id = loader.dataset.intervalId;
        if (id) {
            clearInterval(Number(id));
        }
        loader.remove();
    }
}

// Add loading styles
const loadingStyles = `
    /* Fallback styles if Tailwind isn't present on page */
    .tw-loader { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(15,23,42,0.6); backdrop-filter: blur(6px); z-index: 9999; padding: 16px; }
    .tw-card { width: 100%; max-width: 640px; background: #fff; border-radius: 16px; box-shadow: 0 20px 60px rgba(2,6,23,0.2); border: 1px solid rgba(226,232,240,0.9); }
    .tw-spinner { border: 4px solid #e2e8f0; border-top-color: #6366f1; border-radius: 9999px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes indeterminate { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
`;

// Inject loading styles
const styleSheet = document.createElement('style');
styleSheet.textContent = loadingStyles;
document.head.appendChild(styleSheet);

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    }
    
    .notification-info {
        background: #667eea;
    }
    
    .notification-success {
        background: #28a745;
    }
    
    .notification-error {
        background: #dc3545;
    }
    
    .notification-warning {
        background: #ffc107;
        color: #333;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;

// Inject notification styles
const notificationStyleSheet = document.createElement('style');
notificationStyleSheet.textContent = notificationStyles;
document.head.appendChild(notificationStyleSheet);

// Export for use in other files
window.MathEase = {
    progressTracker,
    quizManager,
    showNotification,
    showLoading,
    hideLoading
};
