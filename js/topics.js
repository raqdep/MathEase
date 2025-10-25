// Topics Page JavaScript
class TopicsManager {
    constructor() {
        this.missions = {
            'functions-and-their-graphs': { completed: false, unlocked: true, progress: 0 },
            'rational-functions-equations-and-inequalities': { completed: false, unlocked: false, progress: 0 },
            'inverse-functions': { completed: false, unlocked: false, progress: 0 },
            'exponential-functions': { completed: false, unlocked: false, progress: 0 },
            'logarithmic-functions': { completed: false, unlocked: false, progress: 0 }
        };
        
        this.init();
    }

    init() {
        this.loadProgress();
        this.setupEventListeners();
        this.updateMissionCards();
        this.updateProgressSummary();
        this.setupFloatingElements();
    }

    setupEventListeners() {
        // Mission card clicks
        document.querySelectorAll('.mission-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const missionName = e.currentTarget.dataset.mission;
                this.handleMissionClick(missionName);
            });
        });

        // Add hover effects
        document.querySelectorAll('.mission-card').forEach(card => {
            card.addEventListener('mouseenter', this.handleCardHover);
            card.addEventListener('mouseleave', this.handleCardLeave);
        });
    }

    handleMissionClick(missionName) {
        const mission = this.missions[missionName];
        
        if (!mission.unlocked) {
            this.showNotification('Complete the previous mission to unlock this one!', 'warning');
            return;
        }

        if (mission.completed) {
            this.showNotification('Mission completed! Great job!', 'success');
            return;
        }

        // Navigate to mission
        switch(missionName) {
            case 'functions-and-their-graphs':
                window.location.href = 'topics/functions.html';
                break;
            case 'rational-functions-equations-and-inequalities':
                this.showNotification('Rational Functions, Equations, and Inequalities mission coming soon!', 'info');
                break;
            case 'inverse-functions':
                this.showNotification('Inverse Functions mission coming soon!', 'info');
                break;
            case 'exponential-functions':
                this.showNotification('Exponential Functions mission coming soon!', 'info');
                break;
            case 'logarithmic-functions':
                this.showNotification('Logarithmic Functions mission coming soon!', 'info');
                break;
            default:
                this.showNotification('This mission is under development!', 'info');
        }
    }

    handleCardHover(e) {
        const card = e.currentTarget;
        if (card.classList.contains('available')) {
            card.style.transform = 'translateY(-8px) scale(1.02)';
            card.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.3)';
        }
    }

    handleCardLeave(e) {
        const card = e.currentTarget;
        card.style.transform = 'translateY(0) scale(1)';
        card.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
    }

    loadProgress() {
        // Load from localStorage (in a real app, this would come from the database)
        const savedProgress = localStorage.getItem('mathease_progress');
        if (savedProgress) {
            try {
                const progress = JSON.parse(savedProgress);
                Object.keys(progress).forEach(mission => {
                    if (this.missions[mission]) {
                        this.missions[mission] = { ...this.missions[mission], ...progress[mission] };
                    }
                });
            } catch (e) {
                console.error('Error loading progress:', e);
            }
        }

        // Ensure first GenMath topic is unlocked
        if (this.missions['functions-and-their-graphs']) {
            this.missions['functions-and-their-graphs'].unlocked = true;
        }
    }

    updateMissionCards() {
        Object.keys(this.missions).forEach(missionName => {
            const mission = this.missions[missionName];
            const card = document.querySelector(`[data-mission="${missionName}"]`);
            
            if (!card) return;

            // Update card classes
            card.className = 'mission-card';
            if (mission.completed) {
                card.classList.add('completed');
            } else if (mission.unlocked) {
                card.classList.add('available');
            } else {
                card.classList.add('locked');
            }

            // Update status text and icon
            const statusElement = card.querySelector('.mission-status');
            if (statusElement) {
                if (mission.completed) {
                    statusElement.innerHTML = `
                        <span class="status-text">Completed</span>
                        <i class="fas fa-check-circle"></i>
                    `;
                } else if (mission.unlocked) {
                    statusElement.innerHTML = `
                        <span class="status-text">Start Mission</span>
                        <i class="fas fa-arrow-right"></i>
                    `;
                } else {
                    statusElement.innerHTML = `
                        <span class="status-text">Locked</span>
                        <i class="fas fa-lock"></i>
                    `;
                }
            }

            // Add progress indicator if mission is in progress
            if (mission.progress > 0 && !mission.completed) {
                this.addProgressIndicator(card, mission.progress);
            }
        });
    }

    addProgressIndicator(card, progress) {
        // Remove existing progress indicator
        const existingIndicator = card.querySelector('.progress-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Create progress indicator
        const progressIndicator = document.createElement('div');
        progressIndicator.className = 'progress-indicator';
        progressIndicator.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <span class="progress-text">${progress}%</span>
        `;

        // Add to card
        const missionInfo = card.querySelector('.mission-info');
        if (missionInfo) {
            missionInfo.appendChild(progressIndicator);
        }
    }

    updateProgressSummary() {
        const totalMissions = Object.keys(this.missions).length;
        const completedMissions = Object.values(this.missions).filter(m => m.completed).length;
        const overallProgress = Math.round((completedMissions / totalMissions) * 100);

        // Update mission stats
        const completedSpan = document.querySelector('.mission-stats .stat-item:nth-child(2) span');
        if (completedSpan) {
            completedSpan.textContent = `${completedMissions} Completed`;
        }

        // Update progress circles
        this.updateProgressCircle('overall', overallProgress);
        this.updateProgressCircle('foundation', this.calculateCategoryProgress(['functions-and-their-graphs', 'rational-functions-equations-and-inequalities', 'inverse-functions']));
        this.updateProgressCircle('growth', this.calculateCategoryProgress(['exponential-functions', 'logarithmic-functions']));
    }

    calculateCategoryProgress(missionNames) {
        const categoryMissions = missionNames.filter(name => this.missions[name]);
        if (categoryMissions.length === 0) return 0;
        
        const totalProgress = categoryMissions.reduce((sum, name) => {
            const mission = this.missions[name];
            return sum + (mission.completed ? 100 : mission.progress);
        }, 0);
        
        return Math.round(totalProgress / categoryMissions.length);
    }

    updateProgressCircle(category, percentage) {
        const progressItem = document.querySelector(`.progress-item:nth-child(${this.getProgressItemIndex(category)})`);
        if (!progressItem) return;

        const svg = progressItem.querySelector('svg');
        const progressPath = svg.querySelector('path:last-child');
        const percentageText = progressItem.querySelector('.progress-percentage');

        if (progressPath && percentageText) {
            const circumference = 2 * Math.PI * 15.9155; // Based on SVG viewBox
            const dashArray = `${(percentage / 100) * circumference}, ${circumference}`;
            progressPath.style.strokeDasharray = dashArray;
            percentageText.textContent = `${percentage}%`;
        }
    }

    getProgressItemIndex(category) {
        const categoryMap = {
            'overall': 1,
            'foundation': 2,
            'growth': 3
        };
        return categoryMap[category] || 1;
    }

    setupFloatingElements() {
        const floatingElements = document.querySelectorAll('.floating-element');
        
        floatingElements.forEach((element, index) => {
            // Add animation delay
            element.style.animationDelay = `${index * 0.5}s`;
            
            // Add click interaction
            element.addEventListener('click', () => {
                this.animateFloatingElement(element);
            });
        });
    }

    animateFloatingElement(element) {
        element.style.animation = 'none';
        element.offsetHeight; // Trigger reflow
        
        element.style.animation = 'floatBounce 0.6s ease';
        
        // Add CSS animation if not exists
        if (!document.querySelector('#floating-animations')) {
            const style = document.createElement('style');
            style.id = 'floating-animations';
            style.textContent = `
                @keyframes floatBounce {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    25% { transform: translateY(-20px) rotate(5deg); }
                    50% { transform: translateY(-10px) rotate(-5deg); }
                    75% { transform: translateY(-15px) rotate(3deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        // Add animation keyframes if not exists
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }
        }, 4000);
        
        // Add to page
        document.body.appendChild(notification);
    }

    // Method to update mission progress (called from mission pages)
    updateMissionProgress(missionName, progress, completed = false) {
        if (this.missions[missionName]) {
            this.missions[missionName].progress = progress;
            this.missions[missionName].completed = completed;
            
            // Save to localStorage
            localStorage.setItem('mathease_progress', JSON.stringify(this.missions));
            
            // Update UI
            this.updateMissionCards();
            this.updateProgressSummary();
        }
    }

    // Method to unlock next mission
    unlockNextMission(completedMissionName) {
        const missionOrder = [
            'functions-and-their-graphs',
            'rational-functions-equations-and-inequalities',
            'inverse-functions',
            'exponential-functions',
            'logarithmic-functions'
        ];
        
        const currentIndex = missionOrder.indexOf(completedMissionName);
        if (currentIndex !== -1 && currentIndex < missionOrder.length - 1) {
            const nextMission = missionOrder[currentIndex + 1];
            if (this.missions[nextMission]) {
                this.missions[nextMission].unlocked = true;
                this.showNotification(`🎉 New mission unlocked: ${nextMission.replace('-', ' ')}!`, 'success');
                this.updateMissionCards();
            }
        }
    }
}

// Initialize the topics manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.topicsManager = new TopicsManager();
});

// Add CSS for progress indicators
const progressStyles = `
    .progress-indicator {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #e9ecef;
    }
    
    .progress-indicator .progress-bar {
        width: 100%;
        height: 6px;
        background: #e9ecef;
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }
    
    .progress-indicator .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea, #764ba2);
        border-radius: 3px;
        transition: width 0.5s ease;
    }
    
    .progress-indicator .progress-text {
        font-size: 0.8rem;
        color: #667eea;
        font-weight: 500;
    }
    
    .mission-card.completed {
        border-color: #27ae60;
        background: linear-gradient(135deg, #f8fff9, #f0fff4);
    }
    
    .mission-card.completed .mission-icon i {
        color: #27ae60;
    }
    
    .mission-card.completed .status-text {
        color: #27ae60;
    }
    
    .mission-card.locked {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .mission-card.locked:hover {
        transform: none !important;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
    }
    
    .difficulty {
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
    }
    
    .difficulty.easy {
        background: #d4edda;
        color: #155724;
    }
    
    .difficulty.medium {
        background: #fff3cd;
        color: #856404;
    }
    
    .difficulty.hard {
        background: #f8d7da;
        color: #721c24;
    }
    
    .duration {
        color: #6c757d;
        font-size: 0.8rem;
    }
    
    .mission-meta {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }
`;

// Add styles to document
if (!document.querySelector('#progress-styles')) {
    const style = document.createElement('style');
    style.id = 'progress-styles';
    style.textContent = progressStyles;
    document.head.appendChild(style);
}
