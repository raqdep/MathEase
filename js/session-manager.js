// Session Manager - Handles session conflicts between students and teachers
class SessionManager {
    constructor() {
        this.currentUserType = null;
        this.sessionCheckInterval = null;
        this.maintenanceLogoutTimer = null;
        this.maintenanceCountdownTimer = null;
        this.init();
    }

    init() {
        this.detectUserType();
        this.setupSessionMonitoring();
        this.setupLogoutHandlers();
    }

    // Detect current user type from the page
    detectUserType() {
        const currentPath = (window.location.pathname || '').toLowerCase();

        if (currentPath.includes('teacher-')) {
            this.currentUserType = 'teacher';
        } else if (currentPath.includes('dashboard.html') ||
                   currentPath.includes('dashboard.php') ||
                   currentPath.includes('topics/') ||
                   currentPath.includes('quizzes.html') ||
                   currentPath.includes('quizzes.php') ||
                   currentPath.includes('flashcards.html') ||
                   currentPath.includes('flashcards.php') ||
                   currentPath.includes('achievements.html') ||
                   currentPath.includes('achievements.php') ||
                   currentPath.includes('profile.html') ||
                   currentPath.includes('profile.php') ||
                   currentPath.includes('flashcards/')) {
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
            if (this.currentUserType === 'teacher' || this.currentUserType === 'student') {
                const mRes = await fetch(this.maintenanceStatusUrl(), {
                    credentials: 'same-origin',
                    cache: 'no-store'
                });
                const mData = await mRes.json();
                if (mData && mData.success) {
                    if (mData.maintenance) {
                        this.handleMaintenanceActive(mData);
                        // continue normal session checks during grace period
                    } else {
                        this.clearMaintenanceGrace();
                    }
                }
            }

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

    maintenanceGraceKey(name) {
        return `mathease_maintenance_${name}`;
    }

    getMaintenanceLogoutAtMs() {
        try {
            const raw = sessionStorage.getItem(this.maintenanceGraceKey('logout_at'));
            const n = raw ? parseInt(raw, 10) : 0;
            return Number.isFinite(n) ? n : 0;
        } catch (e) {
            return 0;
        }
    }

    setMaintenanceLogoutAtMs(ts) {
        try {
            sessionStorage.setItem(this.maintenanceGraceKey('logout_at'), String(ts));
        } catch (e) {}
    }

    getMaintenanceNoticeShown() {
        try {
            return sessionStorage.getItem(this.maintenanceGraceKey('notice_shown')) === '1';
        } catch (e) {
            return false;
        }
    }

    setMaintenanceNoticeShown() {
        try {
            sessionStorage.setItem(this.maintenanceGraceKey('notice_shown'), '1');
        } catch (e) {}
    }

    clearMaintenanceGrace() {
        try {
            sessionStorage.removeItem(this.maintenanceGraceKey('logout_at'));
            sessionStorage.removeItem(this.maintenanceGraceKey('notice_shown'));
        } catch (e) {}

        if (this.maintenanceLogoutTimer) {
            clearTimeout(this.maintenanceLogoutTimer);
            this.maintenanceLogoutTimer = null;
        }
        if (this.maintenanceCountdownTimer) {
            clearInterval(this.maintenanceCountdownTimer);
            this.maintenanceCountdownTimer = null;
        }
    }

    formatCountdown(msRemaining) {
        const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(minutes)}:${pad(seconds)}`;
    }

    startMaintenanceLogoutTimer(logoutAtMs) {
        // Reset timer if deadline changed (e.g., tab restored with older timer).
        if (this.maintenanceLogoutTimer) {
            clearTimeout(this.maintenanceLogoutTimer);
            this.maintenanceLogoutTimer = null;
        }
        const delay = Math.max(0, logoutAtMs - Date.now());
        this.maintenanceLogoutTimer = setTimeout(() => {
            window.location.href = this.maintenanceKickUrl();
        }, delay);
    }

    showMaintenanceGraceNotice(mData, logoutAtMs) {
        if (typeof Swal === 'undefined') return;

        const title = mData.title || 'System update in progress';
        const message = mData.message || 'Some services may be temporarily unavailable.';
        const countdownId = 'maintenance-countdown';

        Swal.fire({
            icon: 'warning',
            title: title,
            html: `
                <div style="text-align:left;">
                    <p style="margin:0 0 10px; color:#475569;">${message}</p>
                    <div style="display:flex; gap:10px; align-items:center; padding:10px 12px; border:1px solid #e2e8f0; border-radius:12px; background:#f8fafc;">
                        <i class="fas fa-hourglass-half" style="color:#6366f1;"></i>
                        <div style="flex:1;">
                            <div style="font-weight:700; color:#0f172a;">Auto-logout in</div>
                            <div style="font-size:14px; color:#475569;"><span id="${countdownId}"></span></div>
                        </div>
                    </div>
                    <p style="margin:10px 0 0; font-size:12px; color:#64748b;">You can continue using the system for 10 minutes. After that, you’ll be logged out automatically.</p>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Continue',
            cancelButtonText: 'Logout now',
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#ef4444',
            focusConfirm: true,
            allowOutsideClick: true,
            allowEscapeKey: true,
            didOpen: () => {
                const el = document.getElementById(countdownId);
                const tick = () => {
                    const remaining = logoutAtMs - Date.now();
                    if (el) el.textContent = this.formatCountdown(remaining);
                    if (remaining <= 0) {
                        Swal.close();
                        window.location.href = this.maintenanceKickUrl();
                    }
                };
                tick();
                this.maintenanceCountdownTimer = setInterval(tick, 1000);
            },
            didClose: () => {
                if (this.maintenanceCountdownTimer) {
                    clearInterval(this.maintenanceCountdownTimer);
                    this.maintenanceCountdownTimer = null;
                }
            }
        }).then((result) => {
            if (result.dismiss === Swal.DismissReason.cancel) {
                window.location.href = this.maintenanceKickUrl();
            }
        });
    }

    handleMaintenanceActive(mData) {
        // If already expired, kick immediately.
        const now = Date.now();
        let logoutAtMs = this.getMaintenanceLogoutAtMs();
        if (logoutAtMs && logoutAtMs <= now) {
            window.location.href = this.maintenanceKickUrl();
            return;
        }
        if (!logoutAtMs) {
            logoutAtMs = now + (10 * 60 * 1000);
            this.setMaintenanceLogoutAtMs(logoutAtMs);
        }

        // Ensure redirect happens at deadline.
        this.startMaintenanceLogoutTimer(logoutAtMs);

        // Show notice once per maintenance activation (per tab).
        if (!this.getMaintenanceNoticeShown()) {
            this.setMaintenanceNoticeShown();
            this.showMaintenanceGraceNotice(mData, logoutAtMs);
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

    maintenanceStatusUrl() {
        const p = window.location.pathname || '';
        if (p.includes('/topics/') || p.includes('/quiz/')) {
            return '../php/maintenance-status.php';
        }
        return 'php/maintenance-status.php';
    }

    maintenanceKickUrl() {
        const p = window.location.pathname || '';
        if (p.includes('/topics/') || p.includes('/quiz/')) {
            return '../php/maintenance-kick.php';
        }
        return 'php/maintenance-kick.php';
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
        // If we couldn't detect page/user type reliably, probe both endpoints.
        if (!this.currentUserType) {
            const studentOk = await this.checkLoginStatusByType('student');
            if (studentOk) this.currentUserType = 'student';
            else {
                const teacherOk = await this.checkLoginStatusByType('teacher');
                if (teacherOk) this.currentUserType = 'teacher';
            }
        }

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
                    window.location.href = 'dashboard.php';
                });
            } else {
                alert('You are logged in as a student. Please use the student portal.');
                window.location.href = 'dashboard.php';
            }
            return false;
        }

        return true;
    }

    async checkLoginStatusByType(userType) {
        try {
            let checkUrl = '';

            if (userType === 'teacher') {
                checkUrl = 'php/teacher-user.php';
            } else {
                checkUrl = 'php/user.php';
            }

            const response = await fetch(checkUrl, {
                credentials: 'include',
                cache: 'no-store'
            });

            if (response.status === 200) {
                const result = await response.json();
                return !!result.success;
            }

            return false;
        } catch (error) {
            console.error('Login status check error:', error);
            return false;
        }
    }

    // Cleanup on page unload
    cleanup() {
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
        }
        if (this.maintenanceLogoutTimer) {
            clearTimeout(this.maintenanceLogoutTimer);
            this.maintenanceLogoutTimer = null;
        }
        if (this.maintenanceCountdownTimer) {
            clearInterval(this.maintenanceCountdownTimer);
            this.maintenanceCountdownTimer = null;
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
