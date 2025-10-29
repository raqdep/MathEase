// Quiz Session Manager
// Handles quiz session recovery, authentication, and data persistence

class QuizSessionManager {
    constructor() {
        this.currentAttemptId = null;
        this.quizType = null;
        this.isRecovering = false;
        this.autoSaveInterval = null;
        this.autoSaveDelay = 30000; // 30 seconds
    }

    // Initialize quiz session
    async initializeQuiz(quizType) {
        try {
            this.quizType = quizType;
            
            // Check for existing attempts
            const response = await fetch(`php/quiz-management.php?action=check_existing_attempt&quiz_type=${quizType}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.handleAuthenticationError();
                    return false;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Handle authentication errors
            if (result.error_code === 'AUTH_REQUIRED') {
                this.handleAuthenticationError(result.redirect);
                return false;
            }

            if (result.success && result.attempt) {
                // Found existing attempt - offer recovery
                this.currentAttemptId = result.attempt.attempt_id;
                this.isRecovering = true;
                return await this.offerRecovery(result.attempt);
            } else {
                // No existing attempt - start new quiz
                return await this.startNewQuiz();
            }
        } catch (error) {
            console.error('Error initializing quiz:', error);
            this.showError('Failed to initialize quiz. Please try again.');
            return false;
        }
    }

    // Start a new quiz
    async startNewQuiz() {
        try {
            const formData = new FormData();
            formData.append('action', 'start_quiz');
            formData.append('quiz_type', this.quizType);

            const response = await fetch('php/quiz-management.php', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.handleAuthenticationError();
                    return false;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Handle authentication errors
            if (result.error_code === 'AUTH_REQUIRED') {
                this.handleAuthenticationError(result.redirect);
                return false;
            }

            if (result.success) {
                this.currentAttemptId = result.attempt_id;
                this.isRecovering = false;
                this.startAutoSave();
                return true;
            } else {
                this.showError(result.message || 'Failed to start quiz');
                return false;
            }
        } catch (error) {
            console.error('Error starting new quiz:', error);
            this.showError('Failed to start quiz. Please try again.');
            return false;
        }
    }

    // Offer recovery for existing attempt
    async offerRecovery(attempt) {
        return new Promise((resolve) => {
            Swal.fire({
                title: 'Resume Quiz?',
                html: `
                    <div class="text-left">
                        <p class="mb-4">You have an unfinished quiz attempt. Would you like to resume it?</p>
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <p class="text-sm text-blue-700">
                                <strong>Quiz:</strong> ${this.getQuizTitle(this.quizType)}<br>
                                <strong>Started:</strong> ${new Date(attempt.started_at).toLocaleString()}<br>
                                <strong>Time Elapsed:</strong> ${this.formatTime(attempt.completion_time)}
                            </p>
                        </div>
                    </div>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Resume Quiz',
                cancelButtonText: 'Start New Quiz',
                confirmButtonColor: '#6366f1',
                cancelButtonColor: '#6b7280',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                    // Resume existing attempt
                    this.startAutoSave();
                    resolve(true);
                } else {
                    // Start new quiz (abandon old attempt)
                    this.abandonCurrentAttempt().then(() => {
                        this.startNewQuiz().then(resolve);
                    });
                }
            });
        });
    }

    // Abandon current attempt
    async abandonCurrentAttempt() {
        if (!this.currentAttemptId) return;

        try {
            const formData = new FormData();
            formData.append('action', 'mark_abandoned_attempts');

            await fetch('php/quiz-management.php', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
        } catch (error) {
            console.error('Error abandoning attempt:', error);
        }
    }

    // Save quiz progress
    async saveProgress(answers, completionTime) {
        if (!this.currentAttemptId) return false;

        try {
            const formData = new FormData();
            formData.append('action', 'save_quiz_progress');
            formData.append('attempt_id', this.currentAttemptId);
            formData.append('completion_time', completionTime);
            formData.append('answers', JSON.stringify(answers));

            const response = await fetch('php/quiz-management.php', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.handleAuthenticationError();
                    return false;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Handle authentication errors
            if (result.error_code === 'AUTH_REQUIRED') {
                this.handleAuthenticationError(result.redirect);
                return false;
            }

            return result.success;
        } catch (error) {
            console.error('Error saving progress:', error);
            return false;
        }
    }

    // Submit quiz
    async submitQuiz(answers, completionTime) {
        if (!this.currentAttemptId) return false;

        try {
            const formData = new FormData();
            formData.append('action', 'submit_quiz');
            formData.append('attempt_id', this.currentAttemptId);
            formData.append('answers', JSON.stringify(answers));
            formData.append('completion_time', completionTime);

            const response = await fetch('php/quiz-management.php', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.handleAuthenticationError();
                    return false;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Handle authentication errors
            if (result.error_code === 'AUTH_REQUIRED') {
                this.handleAuthenticationError(result.redirect);
                return false;
            }

            if (result.success) {
                this.stopAutoSave();
                this.currentAttemptId = null;
                return result;
            } else {
                this.showError(result.message || 'Failed to submit quiz');
                return false;
            }
        } catch (error) {
            console.error('Error submitting quiz:', error);
            this.showError('Failed to submit quiz. Please try again.');
            return false;
        }
    }

    // Get saved answers
    async getSavedAnswers() {
        if (!this.currentAttemptId) return null;

        try {
            const response = await fetch(`php/quiz-management.php?action=get_quiz_answers&attempt_id=${this.currentAttemptId}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.handleAuthenticationError();
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Handle authentication errors
            if (result.error_code === 'AUTH_REQUIRED') {
                this.handleAuthenticationError(result.redirect);
                return null;
            }

            return result.success ? result.answers : null;
        } catch (error) {
            console.error('Error getting saved answers:', error);
            return null;
        }
    }

    // Start auto-save
    startAutoSave() {
        this.stopAutoSave(); // Clear any existing interval
        
        this.autoSaveInterval = setInterval(() => {
            // This will be called by the quiz implementation
            if (window.quizInstance && window.quizInstance.getCurrentAnswers) {
                const answers = window.quizInstance.getCurrentAnswers();
                const completionTime = window.quizInstance.getCompletionTime();
                this.saveProgress(answers, completionTime);
            }
        }, this.autoSaveDelay);
    }

    // Stop auto-save
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    // Handle authentication errors
    handleAuthenticationError(redirectUrl = 'login.html') {
        this.stopAutoSave();
        
        Swal.fire({
            title: 'Session Expired',
            text: 'Your session has expired. Please log in again to continue.',
            icon: 'warning',
            confirmButtonText: 'Log In',
            confirmButtonColor: '#6366f1',
            allowOutsideClick: false,
            allowEscapeKey: false
        }).then(() => {
            window.location.href = redirectUrl;
        });
    }

    // Show error message
    showError(message) {
        Swal.fire({
            title: 'Error',
            text: message,
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#6366f1'
        });
    }

    // Get quiz title
    getQuizTitle(quizType) {
        const titles = {
            'functions': 'Functions Quiz',
            'evaluating-functions': 'Evaluating Functions Quiz',
            'operations-on-functions': 'Operations on Functions Quiz',
            'real-life-problems': 'Real-Life Problems Quiz',
            'rational-functions': 'Rational Functions Quiz'
        };
        return titles[quizType] || 'Quiz';
    }

    // Format time
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Cleanup on page unload
    cleanup() {
        this.stopAutoSave();
        
        // Mark attempt as abandoned if still in progress
        if (this.currentAttemptId && this.isRecovering) {
            this.abandonCurrentAttempt();
        }
    }
}

// Initialize global quiz session manager
window.quizSessionManager = new QuizSessionManager();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.quizSessionManager) {
        window.quizSessionManager.cleanup();
    }
});

// Handle page visibility changes (tab switching)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.quizSessionManager && window.quizSessionManager.currentAttemptId) {
        // Page is hidden, save progress
        if (window.quizInstance && window.quizInstance.getCurrentAnswers) {
            const answers = window.quizInstance.getCurrentAnswers();
            const completionTime = window.quizInstance.getCompletionTime();
            window.quizSessionManager.saveProgress(answers, completionTime);
        }
    }
});
