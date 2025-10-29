// Teacher Dashboard JavaScript Functions

// Teacher Dashboard data management
class TeacherDashboardManager {
    constructor() {
        this.teacherData = null;
        this.progressData = null;
        this.init();
    }

    async init() {
        await this.loadTeacherData();
        await this.loadProgressData();
        await this.loadClassManagementData();
        this.updateDashboard();
        this.setupEventListeners();

        // Live refresh when student progress updates
        window.addEventListener('storage', (e) => {
            if (e.key === 'mathease-teacher-progress-broadcast') {
                this.refreshDashboard();
            }
        });
    }

    async loadTeacherData() {
        try {
            const res = await fetch('php/teacher-user.php', { credentials: 'include', cache: 'no-store' });
            if (res.status === 401) {
                window.location.href = 'teacher-login.html';
                return;
            }
            const data = await res.json();
            if (!data.success) {
                throw new Error(data.message || 'Failed to load teacher data');
            }
            const t = data.teacher;
            const p = data.profile;
            const c = data.class_stats;
            
            this.teacherData = {
                id: t.id,
                firstName: t.first_name,
                lastName: t.last_name,
                email: t.email,
                teacherId: t.teacher_id,
                department: t.department,
                subject: t.subject,
                experience: t.experience,
                lastLogin: t.last_login,
                profile: p,
                classStats: c
            };
        } catch (error) {
            console.error('Error loading teacher data:', error);
            this.showNotification('Error loading teacher data', 'error');
        }
    }

    async loadProgressData() {
        try {
            const res = await fetch('php/teacher-progress.php', { credentials: 'include', cache: 'no-store' });
            if (res.status === 401) { window.location.href = 'teacher-login.html'; return; }
            const data = await res.json();
            if (!data.success) { throw new Error(data.message || 'Failed to load progress data'); }
            
            const s = data.summary || {};
            const activities = data.student_activity || [];
            const topics = data.topic_performance || [];

            this.progressData = {
                totalStudents: s.total_students || 0,
                activeStudents: s.active_students || 0,
                averageScore: s.average_score || 0,
                totalCompletedLessons: s.total_completed_lessons || 0,
                studentActivity: activities,
                topicPerformance: topics
            };
        } catch (error) {
            console.error('Error loading progress data:', error);
            this.showNotification('Error loading progress data', 'error');
        }
    }

    async loadClassManagementData() {
        try {
            // Load teacher classes
            const classesRes = await fetch('php/class-management.php?action=get_teacher_classes', { 
                credentials: 'include', 
                cache: 'no-store' 
            });
            if (classesRes.status === 401) { 
                window.location.href = 'teacher-login.html'; 
                return; 
            }
            const classesData = await classesRes.json();
            
            // Load pending enrollments
            const pendingRes = await fetch('php/class-management.php?action=get_pending_enrollments', { 
                credentials: 'include', 
                cache: 'no-store' 
            });
            if (pendingRes.status === 401) { 
                window.location.href = 'teacher-login.html'; 
                return; 
            }
            const pendingData = await pendingRes.json();

            this.classManagementData = {
                classes: classesData.success ? classesData.classes || [] : [],
                pendingEnrollments: pendingData.success ? pendingData.enrollments || [] : []
            };
        } catch (error) {
            console.error('Error loading class management data:', error);
            this.classManagementData = {
                classes: [],
                pendingEnrollments: []
            };
        }
    }

    updateDashboard() {
        this.updateTeacherInfo();
        this.updateProgressStats();
        this.updateClassPerformance();
        this.updateQuickActions();
        this.animateProgressBars();
    }

    updateTeacherInfo() {
        if (this.teacherData) {
            const teacherName = `${this.teacherData.firstName} ${this.teacherData.lastName}`;
            const teacherNameEl = document.getElementById('teacherName');
            const welcomeNameEl = document.getElementById('welcomeName');
            
            if (teacherNameEl) teacherNameEl.textContent = teacherName;
            if (welcomeNameEl) welcomeNameEl.textContent = teacherName;
        }
    }

    updateProgressStats() {
        // Update main stats
        if (this.classManagementData) {
            const enrolledStudents = this.classManagementData.classes.reduce((total, classItem) => {
                return total + (classItem.approved_students || 0);
            }, 0);
            
            const pendingRequests = this.classManagementData.pendingEnrollments.length;
            const activeClasses = this.classManagementData.classes.length;

            const enrolledStudentsEl = document.getElementById('enrolledStudents');
            const pendingRequestsEl = document.getElementById('pendingRequests');
            const totalClassesEl = document.getElementById('totalClasses');
            
            if (enrolledStudentsEl) enrolledStudentsEl.textContent = enrolledStudents;
            if (pendingRequestsEl) pendingRequestsEl.textContent = pendingRequests;
            if (totalClassesEl) totalClassesEl.textContent = activeClasses;
        }

        // Update sidebar stats
        if (this.classManagementData) {
            const enrolledStudents = this.classManagementData.classes.reduce((total, classItem) => {
                return total + (classItem.approved_students || 0);
            }, 0);
            
            const pendingRequests = this.classManagementData.pendingEnrollments.length;
            const activeClasses = this.classManagementData.classes.length;

            const enrolledStudentsEl = document.getElementById('sidebarEnrolledStudents');
            const pendingRequestsEl = document.getElementById('sidebarPendingRequests');
            const activeClassesEl = document.getElementById('sidebarActiveClasses');
            
            if (enrolledStudentsEl) enrolledStudentsEl.textContent = enrolledStudents;
            if (pendingRequestsEl) pendingRequestsEl.textContent = pendingRequests;
            if (activeClassesEl) activeClassesEl.textContent = activeClasses;
        }
    }


    updateClassPerformance() {
        // This function is now handled by the comprehensive class performance system
        // The new system loads data via loadClassPerformanceData() in the main HTML file
        // This function is kept for backward compatibility but redirects to the new system
        if (typeof loadClassPerformanceData === 'function') {
            loadClassPerformanceData();
        }
    }


    updateQuickActions() {
        const quickActionsGrid = document.getElementById('quickActionsGrid');
        if (quickActionsGrid) {
            const actions = [
                {
                    title: 'View Students',
                    description: 'Manage your class roster',
                    icon: 'fas fa-users',
                    href: 'teacher-students.html',
                    color: 'emerald'
                },
                {
                    title: 'Create Assignment',
                    description: 'Assign new tasks to students',
                    icon: 'fas fa-plus-circle',
                    href: 'teacher-assignments.html',
                    color: 'indigo'
                },
                {
                    title: 'View Analytics',
                    description: 'Analyze student performance',
                    icon: 'fas fa-chart-line',
                    href: 'teacher-analytics.html',
                    color: 'violet'
                },
                {
                    title: 'Teaching Resources',
                    description: 'Access lesson plans and materials',
                    icon: 'fas fa-book',
                    href: 'teacher-resources.html',
                    color: 'amber'
                },
                {
                    title: 'Grade Assignments',
                    description: 'Review and grade student work',
                    icon: 'fas fa-check-square',
                    href: 'teacher-grading.html',
                    color: 'blue'
                },
                {
                    title: 'Send Announcements',
                    description: 'Communicate with your class',
                    icon: 'fas fa-bullhorn',
                    href: 'teacher-announcements.html',
                    color: 'red'
                }
            ];

            quickActionsGrid.innerHTML = '';
            actions.forEach((action, index) => {
                const actionItem = document.createElement('div');
                actionItem.className = 'action-item animate-scale-in';
                actionItem.style.animationDelay = `${index * 0.1}s`;
                
                const colorClasses = {
                    emerald: 'from-emerald-500 to-emerald-600',
                    indigo: 'from-indigo-500 to-indigo-600',
                    violet: 'from-violet-500 to-violet-600',
                    amber: 'from-amber-500 to-amber-600',
                    blue: 'from-blue-500 to-blue-600',
                    red: 'from-red-500 to-red-600'
                };
                
                actionItem.innerHTML = `
                    <a href="${action.href}" class="block p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 hover:border-${action.color}-300 hover:bg-white/90 hover:shadow-xl transition-all duration-300 group">
                        <div class="flex items-center space-x-4 mb-4">
                            <div class="w-12 h-12 bg-gradient-to-br ${colorClasses[action.color]} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <i class="${action.icon} text-white text-lg"></i>
                            </div>
                            <div class="flex-1">
                                <h4 class="text-lg font-semibold text-slate-800 mb-1">${action.title}</h4>
                                <p class="text-sm text-slate-600">${action.description}</p>
                            </div>
                        </div>
                        <div class="flex items-center text-sm text-${action.color}-600 font-medium">
                            <span>Get Started</span>
                            <i class="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform duration-200"></i>
                        </div>
                    </a>
                `;
                quickActionsGrid.appendChild(actionItem);
            });
        }
    }


    // Human-friendly time-ago formatter
    formatTimeAgo(isoString) {
        if (!isoString) return 'Recently';
        const then = new Date(isoString);
        const now = new Date();
        const diff = Math.max(0, (now - then) / 1000);
        if (diff < 60) return 'Just now';
        const mins = Math.floor(diff / 60);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return then.toLocaleDateString();
    }

    animateProgressBars() {
        const progressBars = document.querySelectorAll('[style*="width:"]');
        progressBars.forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0%';
            bar.classList.add('progress-bar-animate');
            setTimeout(() => {
                bar.style.width = width;
            }, 500);
        });
    }

    setupEventListeners() {
        // Add click event listeners to dashboard cards
        const dashboardCards = document.querySelectorAll('.bg-white.rounded-xl');
        dashboardCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on interactive elements
                if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a, button')) {
                    return;
                }
                
                // Add click effect
                card.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    card.style.transform = '';
                }, 150);
            });
        });

        // SweetAlert logout confirm
        const logoutLink = document.getElementById('logoutLink');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                const href = logoutLink.getAttribute('href') || 'php/teacher-logout.php';
                if (window.Swal) {
                    Swal.fire({
                        title: 'Logout?',
                        text: 'Are you sure you want to logout?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#f59e0b',
                        cancelButtonColor: '#6b7280',
                        confirmButtonText: 'Yes, logout',
                        cancelButtonText: 'Cancel'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = href;
                        }
                    });
                } else {
                    const ok = confirm('Are you sure you want to logout?');
                    if (ok) window.location.href = href;
                }
            });
        }
    }

    showNotification(message, type = 'info') {
        if (window.Swal) {
            const iconMap = {
                success: 'success',
                error: 'error',
                warning: 'warning',
                info: 'info'
            };
            
            Swal.fire({
                icon: iconMap[type] || 'info',
                title: type.charAt(0).toUpperCase() + type.slice(1),
                text: message,
                timer: 3000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } else {
            // Fallback notification with Tailwind classes
            const notification = document.createElement('div');
            const typeClasses = {
                success: 'bg-green-500 text-white',
                error: 'bg-red-500 text-white',
                warning: 'bg-yellow-500 text-white',
                info: 'bg-blue-500 text-white'
            };
            
            notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-up ${typeClasses[type] || typeClasses.info}`;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 3000);
        }
    }

    // Method to refresh dashboard data
    async refreshDashboard() {
        await this.loadProgressData();
        await this.loadClassManagementData();
        this.updateDashboard();
        this.showNotification('Dashboard refreshed', 'success');
    }

    // Method to simulate progress update
    simulateProgressUpdate() {
        if (this.progressData) {
            this.progressData.totalCompletedLessons += 1;
            this.progressData.averageScore = Math.min(100, this.progressData.averageScore + 2);
            this.updateProgressStats();
            this.showNotification('Progress updated!', 'success');
        }
    }
}

// Initialize teacher dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    const teacherDashboard = new TeacherDashboardManager();
    
    // Store in window for global access
    window.teacherDashboard = teacherDashboard;
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            teacherDashboard.refreshDashboard();
        }
    });
    
    // Add auto-refresh every 5 minutes
    setInterval(() => {
        teacherDashboard.refreshDashboard();
    }, 5 * 60 * 1000);
});

// Export for use in other files
window.TeacherDashboardManager = TeacherDashboardManager;
