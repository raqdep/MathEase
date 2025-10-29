// Session Manager - Handles session conflicts between students and teachers
class SessionManager {
    constructor() {
        this.currentUserType = null;
        this.sessionCheckInterval = null;
        this.init();
    }

    init() {
        this.detectUserType();
        this.setupSessionMonitoring();
        this.setupLogoutHandlers();
    }

    // Detect current user type from the page
    detectUserType() {
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('teacher-')) {
            this.currentUserType = 'teacher';
        } else if (currentPath.includes('dashboard.html') || 
                   currentPath.includes('topics/') || 
                   currentPath.includes('quizzes.html')) {
            this.currentUserType = 'student';
        }
        
        console.log('Detected user type:', this.currentUserType);
    }

    // Setup session monitoring to detect conflicts
    setupSessionMonitoring() {
        // Check session status every 30 seconds
        this.sessionCheckInterval = setInterval(() => {
            this.checkSessionStatus();
        }, 30000);
    }

    // Check if session is still valid
    async checkSessionStatus() {
        try {
            let checkUrl = '';
            
            if (this.currentUserType === 'teacher') {
                checkUrl = 'php/teacher-user.php';
            } else if (this.currentUserType === 'student') {
                checkUrl = 'php/user.php';
            } else {
                return; // Unknown user type
            }

            const response = await fetch(checkUrl, {
                credentials: 'include',
                cache: 'no-store'
            });

            if (response.status === 401) {
                this.handleSessionExpired();
            } else if (response.status === 200) {
                const result = await response.json();
                if (!result.success) {
                    this.handleSessionExpired();
                }
            }
        } catch (error) {
            console.error('Session check error:', error);
        }
    }

    // Handle session expiration
    handleSessionExpired() {
        clearInterval(this.sessionCheckInterval);
        
        // Show session expired message
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Session Expired',
                text: 'Your session has expired. Please log in again.',
                icon: 'warning',
                confirmButtonText: 'Log In',
                confirmButtonColor: '#6366f1',
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then(() => {
                this.redirectToLogin();
            });
        } else {
            alert('Your session has expired. Please log in again.');
            this.redirectToLogin();
        }
    }

    // Redirect to appropriate login page
    redirectToLogin() {
        if (this.currentUserType === 'teacher') {
            window.location.href = 'teacher-login.html';
        } else {
            window.location.href = 'login.html';
        }
    }

    // Setup logout handlers to prevent conflicts
    setupLogoutHandlers() {
        // Override logout links to use proper logout handlers
        const logoutLinks = document.querySelectorAll('a[href*="logout.php"]');
        logoutLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        });
    }

    // Handle logout with proper session management
    async handleLogout() {
        try {
            // Show confirmation
            if (typeof Swal !== 'undefined') {
                const result = await Swal.fire({
                    title: 'Logout Confirmation',
                    text: 'Are you sure you want to logout?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, Logout',
                    cancelButtonText: 'Cancel',
                    confirmButtonColor: '#ef4444',
                    cancelButtonColor: '#6b7280'
                });

                if (!result.isConfirmed) {
                    return;
                }
            }

            // Determine correct logout URL
            let logoutUrl = '';
            if (this.currentUserType === 'teacher') {
                logoutUrl = 'php/smart-logout.php?type=teacher';
            } else {
                logoutUrl = 'php/smart-logout.php?type=student';
            }

            // Perform logout
            const response = await fetch(logoutUrl, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                // Clear any local storage or session storage
                this.clearLocalData();
                
                // Redirect to appropriate page
                if (this.currentUserType === 'teacher') {
                    window.location.href = 'teacher-login.html';
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'Logout Error',
                    text: 'There was an error during logout. Please try again.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#6366f1'
                });
            } else {
                alert('There was an error during logout. Please try again.');
            }
        }
    }

    // Clear local data
    clearLocalData() {
        // Clear any quiz-related data
        if (window.quizSessionManager) {
            window.quizSessionManager.cleanup();
        }
        
        // Clear any other local data
        localStorage.removeItem('quiz_progress');
        localStorage.removeItem('user_preferences');
        sessionStorage.clear();
    }

    // Check if user is logged in
    async checkLoginStatus() {
        try {
            let checkUrl = '';
            
            if (this.currentUserType === 'teacher') {
                checkUrl = 'php/teacher-user.php';
            } else if (this.currentUserType === 'student') {
                checkUrl = 'php/user.php';
            } else {
                return false;
            }

            const response = await fetch(checkUrl, {
                credentials: 'include',
                cache: 'no-store'
            });

            if (response.status === 200) {
                const result = await response.json();
                return result.success;
            }
            
            return false;
        } catch (error) {
            console.error('Login status check error:', error);
            return false;
        }
    }

    // Prevent access to wrong user type pages
    async validatePageAccess() {
        const isLoggedIn = await this.checkLoginStatus();
        
        if (!isLoggedIn) {
            this.redirectToLogin();
            return false;
        }

        // Check if user is on the correct page type
        const currentPath = window.location.pathname;
        
        if (this.currentUserType === 'teacher' && !currentPath.includes('teacher-')) {
            // Teacher trying to access student page
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'Access Denied',
                    text: 'You are logged in as a teacher. Please use the teacher portal.',
                    icon: 'warning',
                    confirmButtonText: 'Go to Teacher Portal',
                    confirmButtonColor: '#6366f1'
                }).then(() => {
                    window.location.href = 'teacher-dashboard.html';
                });
            } else {
                alert('You are logged in as a teacher. Please use the teacher portal.');
                window.location.href = 'teacher-dashboard.html';
            }
            return false;
        } else if (this.currentUserType === 'student' && currentPath.includes('teacher-')) {
            // Student trying to access teacher page
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'Access Denied',
                    text: 'You are logged in as a student. Please use the student portal.',
                    icon: 'warning',
                    confirmButtonText: 'Go to Student Portal',
                    confirmButtonColor: '#6366f1'
                }).then(() => {
                    window.location.href = 'dashboard.html';
                });
            } else {
                alert('You are logged in as a student. Please use the student portal.');
                window.location.href = 'dashboard.html';
            }
            return false;
        }

        return true;
    }

    // Cleanup on page unload
    cleanup() {
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
        }
    }
}

// Initialize session manager
window.sessionManager = new SessionManager();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.sessionManager) {
        window.sessionManager.cleanup();
    }
});

// Validate page access on load
document.addEventListener('DOMContentLoaded', () => {
    if (window.sessionManager) {
        window.sessionManager.validatePageAccess();
    }
});
