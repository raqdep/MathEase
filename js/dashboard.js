// Dashboard JavaScript Functions

// Dashboard data management
class DashboardManager {
    constructor() {
        this.userData = null;
        this.progressData = null;
        this.init();
    }

    async init() {
        if (window.MathEase && window.MathEase.showLoading) window.MathEase.showLoading();
        await this.loadUserData();
        await this.loadProgressData();
        this.updateDashboard();
        this.setupEventListeners();
        if (window.MathEase && window.MathEase.hideLoading) window.MathEase.hideLoading();

        // Live refresh when mission pages broadcast progress updates
        window.addEventListener('storage', (e) => {
            if (e.key === 'mathease-progress-broadcast') {
                this.refreshDashboard();
            }
        });
    }

    async loadUserData() {
        try {
            const res = await fetch('php/user.php', { credentials: 'include', cache: 'no-store' });
            if (res.status === 401) {
                window.location.href = 'login.html';
                return;
            }
            const data = await res.json();
            if (!data.success) {
                throw new Error(data.message || 'Failed to load user');
            }
            const u = data.user;
            this.userData = {
                id: u.id,
                firstName: u.first_name,
                lastName: u.last_name,
                email: u.email,
                studentId: u.student_id,
                gradeLevel: u.grade_level,
                strand: u.strand,
                lastLogin: u.last_login
            };
        } catch (error) {
            console.error('Error loading user data:', error);
            this.showNotification('Error loading user data', 'error');
        }
    }

    async loadProgressData() {
        try {
            // Pull richer progress summary from backend
            const res = await fetch('php/get-progress.php', { credentials: 'include', cache: 'no-store' });
            if (res.status === 401) { window.location.href = 'login.html'; return; }
            const data = await res.json();
            if (!data.success) { throw new Error(data.message || 'Failed to load progress'); }
            
            // Use the data structure from our get-progress.php API
            const userStats = data.user_stats || {};
            const topics = data.topics || {};
            
            // Convert topics object to array format for UI
            let topicProgress = Object.keys(topics).map(topicKey => {
                const topic = topics[topicKey];
                return {
                    id: topicKey,
                    name: topicKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    description: `Complete all lessons in ${topicKey.replace(/-/g, ' ')} topic`,
                    bestScore: 0,
                    progress: topic.progress_percentage || 0,
                    completed: topic.completed || false,
                    updatedAt: null
                };
            });

            // Fallback: if backend returned no topics, provide defaults so UI isn't empty
            if (!topicProgress.length) {
                topicProgress = [];
            }

            // Canonical GenMath topics (order + localized descriptions)
            const canonical = [
                {
                    name: 'Functions and Their Graphs',
                    slug: 'functions-and-their-graphs',
                    description: "Pagsusuri at pag-unawa sa konsepto ng functions, pag-e-evaluate, pag-o-operate, at pag-g-graph ng iba't ibang uri ng functions, kasama na ang piecewise functions."
                },
                {
                    name: 'Rational Functions, Equations, and Inequalities',
                    slug: 'rational-functions-equations-and-inequalities',
                    description: 'Pag-aaral sa mga rational expression, kung paano i-solve ang mga rational equation at inequality, at pag-g-graph ng rational functions. Master domain restrictions, asymptotes, and solving rational equations & inequalities.'
                },
                {
                    name: 'Inverse Functions',
                    slug: 'inverse-functions',
                    description: 'Pagkilala at paghahanap ng inverse ng isang function.'
                },
                {
                    name: 'Exponential Functions',
                    slug: 'exponential-functions',
                    description: 'Pag-aaral sa mga exponential function, equation, at inequality, pati na rin ang paglutas ng mga problema gamit ang mga ito.'
                },
                {
                    name: 'Logarithmic Functions',
                    slug: 'logarithmic-functions',
                    description: 'Pag-aaral sa mga logarithmic function, equation, at inequality, kabilang ang paggamit ng mga laws of logarithm.'
                }
            ];

            // Merge backend progress into canonical topics by name (case-insensitive)
            const byName = new Map(topicProgress.map(tp => [String(tp.name||'').toLowerCase(), tp]));
            const mergedTopics = canonical.map(c => {
                const backend = byName.get(c.name.toLowerCase());
                return {
                    id: c.slug,
                    name: c.name,
                    description: c.description,
                    bestScore: backend ? (backend.bestScore||0) : 0,
                    progress: backend ? (backend.progress||0) : 0,
                    completed: backend ? !!backend.completed : false,
                    updatedAt: backend ? (backend.updatedAt||null) : null
                };
            });

            const completedTopics = data.completed_topics || 0;
            const totalTopics = data.total_topics || 5;
            const overallPct = data.overall_progress || 0;

            // Build recent activity from topic timestamps
            const recentActivity = topicProgress
                .filter(tp => !!tp.updatedAt)
                .sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .slice(0, 6)
                .map(tp => ({
                    icon: tp.completed ? 'fas fa-check-circle' : (tp.bestScore > 0 ? 'fas fa-bolt' : 'fas fa-play-circle'),
                    title: tp.completed ? `Completed ${tp.name}` : `Worked on ${tp.name}`,
                    description: tp.completed ? `You completed ${tp.name} mission.` : `Progress updated • Best score: ${tp.progress}%`,
                    time: this.formatTimeAgo(tp.updatedAt)
                }));

            this.progressData = {
                totalScore: userStats.total_score || 0,
                completedLessons: userStats.completed_lessons || 0,
                currentTopic: 'Functions',
                overallProgress: overallPct,
                courseProgress: data.topic_progress || 0,
                completedTopics: completedTopics,
                totalTopics: totalTopics,
                learningStreak: 0,
                badgesEarned: 0,
                averageQuizScore: 0,
                recentActivity,
                topicProgress: mergedTopics,
                genMathTopics: mergedTopics,
                availableQuizzes: [],
                badges: []
            };
        } catch (error) {
            console.error('Error loading progress data:', error);
            this.showNotification('Error loading progress data', 'error');
        }
    }

    updateDashboard() {
        this.updateUserInfo();
        this.updateProgressStats();
        this.updateRecentActivity();
        this.updateTopicRecommendations();
        this.renderPrecalcTopics();
        this.updateAvailableQuizzes();
        this.updateBadges();
        this.animateProgressBars();
    }

    updateUserInfo() {
        if (this.userData) {
            const userName = `${this.userData.firstName} ${this.userData.lastName}`;
            document.getElementById('userName').textContent = userName;
            document.getElementById('welcomeName').textContent = userName;
        }
    }

    updateProgressStats() {
        if (this.progressData) {
            // Update elements that exist in the dashboard
            const completedLessonsEl = document.getElementById('completedLessons');
            if (completedLessonsEl) {
                completedLessonsEl.textContent = this.progressData.completedLessons || 0;
            }
            
            const totalScoreEl = document.getElementById('totalScore');
            if (totalScoreEl) {
                totalScoreEl.textContent = this.progressData.totalScore || 0;
            }
            
            const badgesEarnedEl = document.getElementById('badgesEarned');
            if (badgesEarnedEl) {
                badgesEarnedEl.textContent = this.progressData.badgesEarned || 0;
            }
            
            // Update overall progress
            const overallProgress = document.getElementById('overallProgress');
            const overallProgressText = document.getElementById('overallProgressText');
            if (overallProgress && overallProgressText) {
                const progress = this.progressData.overallProgress || 0;
                overallProgress.style.width = `${progress}%`;
                overallProgressText.textContent = `${progress}%`;
            }
            
            // Update course progress
            const courseProgressBar = document.getElementById('courseProgressBar');
            const courseProgressText = document.getElementById('courseProgressText');
            if (courseProgressBar && courseProgressText) {
                const courseProgress = this.progressData.courseProgress || 0;
                courseProgressBar.style.width = `${courseProgress}%`;
                courseProgressText.textContent = `${this.progressData.completedTopics || 0} of ${this.progressData.totalTopics || 5} Topics Completed`;
            }
        }
    }

    updateRecentActivity() {
        // Check if activity list element exists before trying to update it
        const activityList = document.getElementById('activityList');
        if (!activityList) {
            // Activity list element doesn't exist in current dashboard layout
            return;
        }
        
        if (this.progressData && this.progressData.recentActivity) {
            activityList.innerHTML = '';
            
            this.progressData.recentActivity.forEach((activity, index) => {
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item animate-slide-up';
                activityItem.style.animationDelay = `${index * 0.1}s`;
                activityItem.innerHTML = `
                    <div class="flex items-start space-x-4 p-6 bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200/60 hover:border-indigo-300 hover:bg-white/70 transition-all duration-300 group">
                        <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <i class="${activity.icon} text-white text-sm"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="text-sm font-semibold text-slate-800 mb-2">${activity.title || activity.text}</h4>
                            <p class="text-sm text-slate-600 mb-3 leading-relaxed">${activity.description || 'You completed this activity'}</p>
                            <span class="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-lg">${activity.time}</span>
                        </div>
                    </div>
                `;
                activityList.appendChild(activityItem);
            });
        }
    }

    updateTopicRecommendations() {
        // Check if topic recommendations element exists before trying to update it
        const topicRecommendations = document.getElementById('topicRecommendations');
        if (!topicRecommendations) {
            // Topic recommendations element doesn't exist in current dashboard layout
            return;
        }
        
        if (this.progressData && this.progressData.topicProgress) {
            topicRecommendations.innerHTML = '';
            
            this.progressData.topicProgress.forEach(topic => {
                const topicItem = document.createElement('div');
                topicItem.className = 'topic-item';
                topicItem.innerHTML = `
                    <div class="topic-icon">
                        <i class="fas fa-function"></i>
                    </div>
                    <div class="topic-info">
                        <h4>${topic.name}</h4>
                        <p>${topic.description}</p>
                        <div class="topic-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${topic.progress}%"></div>
                            </div>
                            <span>${topic.progress}%</span>
                        </div>
                    </div>
                    <a href="topics/${topic.name.toLowerCase().replace(' ', '-')}.html" class="btn btn-outline btn-sm">Continue</a>
                `;
                topicRecommendations.appendChild(topicItem);
            });
        }
    }

    // New: Render GenMath Topics grid from backend progress
    renderPrecalcTopics() {
        const grid = document.getElementById('genMathTopicsGrid');
        if (!grid) {
            // GenMath topics grid element doesn't exist in current dashboard layout
            return;
        }
        const tps = (this.progressData && this.progressData.topicProgress) ? this.progressData.topicProgress : [];
        // If merged canonical topics exist (created in loadProgressData), prefer those
        const canonicalMerged = (this.progressData && this.progressData.genMathTopics) ? this.progressData.genMathTopics : null;
        const source = canonicalMerged && canonicalMerged.length ? canonicalMerged : tps;
        if (!source.length) { grid.innerHTML = ''; return; }

        // Show ALL topics as available (no sequential locking)
        // Show both Functions and Rational Functions topics
        let fnTopic = source.find(tp => String(tp.name||'').toLowerCase().includes('functions and their graphs'))
                    || source.find(tp => String(tp.name||'').toLowerCase().includes('functions'))
                    || null;
        if (!fnTopic) {
            fnTopic = { id: 'functions-and-their-graphs', name: 'Functions and Their Graphs', description: 'Domain, range, graphing, and operations; includes piecewise.', progress: 0, completed: false };
        }

        let rfTopic = source.find(tp => String(tp.name||'').toLowerCase().includes('rational functions'))
                    || null;
        if (!rfTopic) {
            rfTopic = { id: 'rational-functions-equations-and-inequalities', name: 'Rational Functions, Equations, and Inequalities', description: 'Master domain restrictions, asymptotes, and solving rational equations & inequalities.', progress: 0, completed: false };
        }

        const items = [
            {
                id: fnTopic.id,
                title: fnTopic.name,
                desc: fnTopic.description || 'Explore this topic',
                icon: fnTopic.completed ? 'fas fa-check-circle' : 'fas fa-book',
                href: 'topics/functions.html',
                unlocked: true,
                progress: Math.max(0, Math.min(100, fnTopic.progress || 0)),
                color: fnTopic.completed ? 'green' : 'primary'
            },
            {
                id: rfTopic.id,
                title: rfTopic.name,
                desc: rfTopic.description || 'Explore this topic',
                icon: rfTopic.completed ? 'fas fa-check-circle' : 'fas fa-book',
                href: 'topics/rational-functions-equations-and-inequalities.html',
                unlocked: true,
                progress: Math.max(0, Math.min(100, rfTopic.progress || 0)),
                color: rfTopic.completed ? 'green' : 'primary'
            }
        ];

        grid.innerHTML = '';
        items.forEach((t, index) => {
            const card = document.createElement('div');
            card.className = `topic-card ${t.unlocked ? '' : 'locked'} animate-scale-in`;
            card.style.animationDelay = `${index * 0.15}s`;
            
            const colorClasses = {
                primary: 'border-indigo-200/60 hover:border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50/80',
                green: 'border-emerald-200/60 hover:border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50/80'
            };
            
            const iconColorClasses = {
                primary: 'text-indigo-600',
                green: 'text-emerald-600'
            };
            
            const gradientClasses = {
                primary: 'from-indigo-500 to-indigo-600',
                green: 'from-emerald-500 to-emerald-600'
            };
            
            const buttonClasses = t.unlocked 
                ? `bg-gradient-to-r ${gradientClasses[t.color]} hover:shadow-lg text-white shadow-md` 
                : 'bg-slate-300 text-slate-500 cursor-not-allowed';
            
            card.innerHTML = `
                <div class="p-8 border rounded-2xl transition-all duration-500 hover:shadow-xl ${colorClasses[t.color]} group">
                    <div class="flex items-start justify-between mb-6">
                        <div class="flex items-center space-x-4">
                            <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <i class="${t.icon} ${iconColorClasses[t.color]} text-xl"></i>
                            </div>
                            <div>
                                <h4 class="text-xl font-bold text-slate-800 mb-2">${t.title}</h4>
                                <p class="text-sm text-slate-600 leading-relaxed">${t.desc}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-3xl font-bold text-slate-800 mb-1">${t.progress}%</div>
                            <div class="text-xs text-slate-500 font-medium">Complete</div>
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <div class="flex justify-between text-sm text-slate-600 mb-3">
                            <span class="font-medium">Progress</span>
                            <span class="font-bold">${t.progress}%</span>
                        </div>
                        <div class="w-full bg-slate-200 rounded-full h-3">
                            <div class="bg-gradient-to-r ${gradientClasses[t.color]} h-3 rounded-full transition-all duration-700 shadow-sm" style="width: ${t.progress}%"></div>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <div class="flex items-center space-x-2 text-sm text-slate-500">
                            <i class="fas fa-clock"></i>
                            <span>~45 min</span>
                        </div>
                        <a ${t.unlocked ? `href="${t.href}"` : ''} 
                           class="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${buttonClasses}">
                            ${t.unlocked ? 'Continue Learning' : 'Locked'}
                        </a>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // Human-friendly time-ago formatter
    formatTimeAgo(isoString) {
        if (!isoString) return '';
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

    estimateTopicProgress(topicId) {
        // Placeholder: can be wired to real progress later
        if (!this.progressData || !this.progressData.topicProgress) return 0;
        const item = this.progressData.topicProgress.find(tp => (tp.id || '').toLowerCase() === topicId);
        return item ? (item.progress || 0) : 0;
    }

    updateAvailableQuizzes() {
        // Check if quiz list element exists before trying to update it
        const quizList = document.getElementById('quizList');
        if (!quizList) {
            // Quiz list element doesn't exist in current dashboard layout
            return;
        }
        
        if (this.progressData && this.progressData.availableQuizzes) {
            quizList.innerHTML = '';
            
            this.progressData.availableQuizzes.forEach((quiz, index) => {
                const quizItem = document.createElement('div');
                quizItem.className = 'quiz-card animate-scale-in';
                quizItem.style.animationDelay = `${index * 0.1}s`;
                quizItem.innerHTML = `
                    <div class="p-5 border border-slate-200/60 rounded-xl hover:border-indigo-300 hover:bg-slate-50/50 transition-all duration-300 group">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <h4 class="font-semibold text-slate-800 mb-2">${quiz.title}</h4>
                                <p class="text-sm text-slate-600 mb-3 leading-relaxed">${quiz.description}</p>
                                <div class="flex items-center space-x-4 text-xs text-slate-500">
                                    <span><i class="fas fa-clock mr-1"></i> ${quiz.timeLimit} min</span>
                                    <span><i class="fas fa-star mr-1"></i> ${quiz.difficulty}</span>
                                </div>
                            </div>
                            <a href="quizzes/${quiz.title.toLowerCase().replace(' ', '-')}.html" 
                               class="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg group-hover:scale-105">
                                Start
                            </a>
                        </div>
                    </div>
                `;
                quizList.appendChild(quizItem);
            });
        }
    }

    updateBadges() {
        // Check if badges grid element exists before trying to update it
        const badgesGrid = document.getElementById('badgesGrid');
        if (!badgesGrid) {
            // Badges grid element doesn't exist in current dashboard layout
            return;
        }
        
        if (this.progressData && this.progressData.badges) {
            badgesGrid.innerHTML = '';
            
            this.progressData.badges.forEach((badge, index) => {
                const badgeItem = document.createElement('div');
                badgeItem.className = `animate-scale-in ${badge.earned ? 'badge-earned' : 'badge-locked'}`;
                badgeItem.style.animationDelay = `${index * 0.1}s`;
                badgeItem.innerHTML = `
                    <div class="flex items-center p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${badge.earned ? 'bg-emerald-50/80 border-emerald-200/60 hover:bg-emerald-100/80' : 'bg-slate-50/80 border-slate-200/60 opacity-60'}">
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${badge.earned ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-slate-400'}">
                            <i class="${badge.icon} text-white text-sm"></i>
                        </div>
                        <div class="flex-1">
                            <h4 class="font-semibold text-slate-800 text-sm mb-1">${badge.name}</h4>
                            <p class="text-xs text-slate-600 leading-relaxed">${badge.description}</p>
                        </div>
                    </div>
                `;
                badgesGrid.appendChild(badgeItem);
            });
        }
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

        // Add hover effects for topic cards
        const topicCards = document.querySelectorAll('.topic-card');
        topicCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.classList.add('card-hover');
            });
            
            card.addEventListener('mouseleave', () => {
                card.classList.remove('card-hover');
            });
        });

        // SweetAlert logout confirm
        const logoutLink = document.getElementById('logoutLink');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                const href = logoutLink.getAttribute('href') || 'php/logout.php';
                if (window.Swal) {
                    Swal.fire({
                        title: 'Logout?',
                        text: 'Are you sure you want to logout?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#6366f1',
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
        if (window.MathEase && window.MathEase.showNotification) {
            window.MathEase.showNotification(message, type);
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
        if (window.MathEase && window.MathEase.showLoading) window.MathEase.showLoading();
        await this.loadProgressData();
        this.updateDashboard();
        this.renderPrecalcTopics();
        this.showNotification('Dashboard refreshed', 'success');
        if (window.MathEase && window.MathEase.hideLoading) window.MathEase.hideLoading();
    }

    // Method to simulate progress update
    simulateProgressUpdate() {
        if (this.progressData) {
            this.progressData.completedLessons += 1;
            this.progressData.totalScore += 50;
            this.progressData.overallProgress = Math.min(100, this.progressData.overallProgress + 5);
            this.updateProgressStats();
            this.showNotification('Progress updated!', 'success');
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    const dashboard = new DashboardManager();
    // Render topics after initial load
    setTimeout(() => dashboard.renderPrecalcTopics(), 300);
    
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            dashboard.refreshDashboard();
        }
    });
    
    // Add auto-refresh every 5 minutes
    setInterval(() => {
        dashboard.refreshDashboard();
    }, 5 * 60 * 1000);
});

// Export for use in other files
window.DashboardManager = DashboardManager;
