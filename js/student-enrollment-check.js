// Student Enrollment Check JavaScript
class StudentEnrollmentCheck {
    constructor() {
        this.enrollmentStatus = null;
        this.approvedClasses = [];
        this.init();
    }

    async init() {
        await this.checkEnrollmentStatus();
        this.updateDashboard();
        this.setupEventListeners();
    }

    async checkEnrollmentStatus() {
        try {
            const response = await fetch('php/student-enrollment.php?action=check_enrollment', {
                credentials: 'include',
                cache: 'no-store'
            });
            
            if (response.status === 401) {
                window.location.href = 'login.html';
                return;
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.enrollmentStatus = data;
                this.approvedClasses = data.enrollments.filter(e => e.enrollment_status === 'approved');
            } else {
                console.error('Error checking enrollment:', data.message);
                this.enrollmentStatus = { has_approved_enrollment: false, enrollments: [] };
            }
        } catch (error) {
            console.error('Error checking enrollment:', error);
            this.enrollmentStatus = { has_approved_enrollment: false, enrollments: [] };
        }
    }

    updateDashboard() {
        this.updateEnrollmentStatus();
        this.updateNavigation();
        this.updateContentAccess();
        this.updateEnrollmentBanner();
        this.toggleDashboardGate();
        this.renderEnrollmentGateList();
        
        // Also call the dashboard's navigation update function if it exists
        if (typeof updateNavigationState === 'function') {
            console.log('Calling dashboard updateNavigationState from enrollment check');
            updateNavigationState();
        }
    }

    updateEnrollmentStatus() {
        const enrollmentBanner = document.getElementById('enrollmentStatusBanner');
        if (!enrollmentBanner) return;

        if (this.enrollmentStatus && this.enrollmentStatus.has_approved_enrollment) {
            // Student is enrolled - show success banner
            enrollmentBanner.innerHTML = `
                <div class="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 mb-6">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                            <i class="fas fa-check text-white"></i>
                        </div>
                        <div>
                            <h4 class="font-semibold text-emerald-800">Enrolled in Class</h4>
                            <p class="text-sm text-emerald-700">You have access to all learning materials and topics.</p>
                        </div>
                    </div>
                </div>
            `;
        } else if (this.enrollmentStatus && this.enrollmentStatus.enrollments.length > 0) {
            // Student has pending enrollments
            const pendingEnrollments = this.enrollmentStatus.enrollments.filter(e => e.enrollment_status === 'pending');
            if (pendingEnrollments.length > 0) {
                enrollmentBanner.innerHTML = `
                    <div class="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                                <i class="fas fa-clock text-white"></i>
                            </div>
                            <div>
                                <h4 class="font-semibold text-amber-800">Enrollment Pending</h4>
                                <p class="text-sm text-amber-700">Your enrollment request is waiting for teacher approval.</p>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // No enrollments
                this.showNoEnrollmentBanner();
            }
        } else {
            // No enrollments
            this.showNoEnrollmentBanner();
        }
    }

    showNoEnrollmentBanner() {
        const enrollmentBanner = document.getElementById('enrollmentStatusBanner');
        if (!enrollmentBanner) return;

        enrollmentBanner.innerHTML = `
            <div class="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 mb-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <i class="fas fa-users text-white text-lg"></i>
                        </div>
                        <div>
                            <h4 class="text-lg font-semibold text-slate-800">Join a Class to Start Learning</h4>
                            <p class="text-sm text-slate-600">You need to join a class to access topics and quizzes.</p>
                        </div>
                    </div>
                    <button onclick="openJoinClassModal()" class="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
                        <i class="fas fa-plus mr-2"></i>
                        Join Class
                    </button>
                </div>
            </div>
        `;
    }

    updateNavigation() {
        // Update navigation links based on enrollment status
        const topicLinks = document.querySelectorAll('a[href*="topics/"]');
        const quizLinks = document.querySelectorAll('a[href*="quiz"]');
        
        const canAccess = this.enrollmentStatus && this.enrollmentStatus.has_approved_enrollment;
        
        topicLinks.forEach(link => {
            if (!canAccess) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showEnrollmentRequiredModal();
                });
                link.style.opacity = '0.6';
                link.style.cursor = 'not-allowed';
            }
        });
        
        quizLinks.forEach(link => {
            if (!canAccess) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showEnrollmentRequiredModal();
                });
                link.style.opacity = '0.6';
                link.style.cursor = 'not-allowed';
            }
        });
    }

    updateContentAccess() {
        const canAccess = this.enrollmentStatus && this.enrollmentStatus.has_approved_enrollment;
        
        // Update topic cards
        const topicCards = document.querySelectorAll('[onclick*="topics/"]');
        topicCards.forEach(card => {
            if (!canAccess) {
                card.style.opacity = '0.6';
                card.style.cursor = 'not-allowed';
                card.onclick = (e) => {
                    e.preventDefault();
                    this.showEnrollmentRequiredModal();
                };
            }
        });
        
        // Update quiz cards
        const quizCards = document.querySelectorAll('[onclick*="quiz"]');
        quizCards.forEach(card => {
            if (!canAccess) {
                card.style.opacity = '0.6';
                card.style.cursor = 'not-allowed';
                card.onclick = (e) => {
                    e.preventDefault();
                    this.showEnrollmentRequiredModal();
                };
            }
        });
    }

    toggleDashboardGate() {
        const canAccess = this.enrollmentStatus && this.enrollmentStatus.has_approved_enrollment;
        const gate = document.getElementById('enrollmentGate');
        const main = document.getElementById('dashboardMainContent');
        const heroJoinBtn = document.getElementById('heroJoinClassBtn');
        const banner = document.getElementById('enrollmentStatusBanner');
        if (!gate || !main) return;
        if (canAccess) {
            gate.classList.add('hidden');
            main.classList.remove('hidden');
            if (heroJoinBtn) heroJoinBtn.classList.remove('hidden');
            if (banner) banner.classList.remove('hidden');
        } else {
            main.classList.add('hidden');
            gate.classList.remove('hidden');
            if (heroJoinBtn) heroJoinBtn.classList.add('hidden');
            if (banner) banner.classList.add('hidden');
        }
    }

    renderEnrollmentGateList() {
        const list = document.getElementById('enrollmentClassList');
        const emptyMsg = document.getElementById('noEnrollmentMsg');
        if (!list || !emptyMsg) return;
        list.innerHTML = '';
        const enrollments = (this.enrollmentStatus && Array.isArray(this.enrollmentStatus.enrollments)) ? this.enrollmentStatus.enrollments : [];
        if (!enrollments.length) {
            emptyMsg.classList.remove('hidden');
            return;
        }
        emptyMsg.classList.add('hidden');
        enrollments.forEach((e) => {
            const status = e.enrollment_status;
            const color = status === 'approved' ? 'emerald' : (status === 'pending' ? 'amber' : 'slate');
            const card = document.createElement('div');
            card.className = 'border border-slate-200 rounded-2xl p-4 bg-white shadow-sm';
            card.innerHTML = `
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-slate-800 font-semibold">${e.class_name || 'Class'}</div>
                        <div class="text-sm text-slate-500">Teacher: ${(e.teacher_first_name && e.teacher_last_name) ? `${e.teacher_first_name} ${e.teacher_last_name}` : (e.teacher_name || 'Unknown')}</div>
                    </div>
                    <span class="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-${color}-100 text-${color}-700 border border-${color}-200 capitalize">${status}</span>
                </div>
            `;
            list.appendChild(card);
        });
    }

    updateEnrollmentBanner() {
        // This will be called by the main dashboard to show enrollment status
        if (this.enrollmentStatus && this.enrollmentStatus.has_approved_enrollment) {
            // Show enrolled status
            this.showEnrolledStatus();
        } else {
            // Show not enrolled status
            this.showNotEnrolledStatus();
        }
    }

    showEnrolledStatus() {
        const statusElement = document.getElementById('enrollmentStatus');
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="flex items-center space-x-2 text-emerald-600">
                    <i class="fas fa-check-circle"></i>
                    <span class="text-sm font-medium">Enrolled in Class</span>
                </div>
            `;
        }
    }

    showNotEnrolledStatus() {
        const statusElement = document.getElementById('enrollmentStatus');
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="flex items-center space-x-2 text-amber-600">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span class="text-sm font-medium">Not Enrolled</span>
                </div>
            `;
        }
    }

    showEnrollmentRequiredModal() {
        if (window.Swal) {
            Swal.fire({
                title: 'Class Enrollment Required',
                html: `
                    <div class="text-center">
                        <div class="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-users text-white text-2xl"></i>
                        </div>
                        <p class="text-slate-600 mb-4">You need to join a class to access topics and quizzes.</p>
                        <p class="text-sm text-slate-500">Ask your teacher for the class code to get started.</p>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Join Class',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#6366f1',
                cancelButtonColor: '#6b7280',
                customClass: {
                    popup: 'rounded-2xl',
                    title: 'text-slate-800',
                    content: 'text-slate-600'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    if (window.openJoinClassModal) {
                        window.openJoinClassModal();
                    }
                }
            });
        } else {
            alert('You need to join a class to access topics and quizzes. Please ask your teacher for the class code.');
        }
    }

    setupEventListeners() {
        // Listen for enrollment updates
        window.addEventListener('storage', (e) => {
            if (e.key === 'mathease-enrollment-update') {
                this.checkEnrollmentStatus().then(() => {
                    this.updateDashboard();
                });
            }
        });
    }

    // Method to refresh enrollment status
    async refreshEnrollmentStatus() {
        await this.checkEnrollmentStatus();
        this.updateDashboard();
    }

    // Method to check if a specific topic is locked
    async checkTopicLock(topicId) {
        try {
            const response = await fetch(`php/student-topic-check.php?topic_id=${topicId}`, {
                credentials: 'include',
                cache: 'no-store'
            });
            
            if (response.status === 401) {
                window.location.href = 'login.html';
                return { is_locked: true, message: 'Not authenticated' };
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error checking topic lock:', error);
            return { is_locked: true, message: 'Error checking topic status' };
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.studentEnrollmentCheck = new StudentEnrollmentCheck();
});

// Export for use in other files
window.StudentEnrollmentCheck = StudentEnrollmentCheck;
