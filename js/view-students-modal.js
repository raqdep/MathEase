// View Students Modal JavaScript
class ViewStudentsModal {
    constructor() {
        this.modal = null;
        this.isOpen = false;
        this.currentClassId = null;
        this.students = [];
        this.init();
    }

    init() {
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        // Create modal HTML
        const modalHTML = `
            <div id="viewStudentsModal" class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 hidden">
                <div class="flex items-center justify-center min-h-screen p-4 overflow-y-auto">
                    <div class="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] transform transition-all duration-300 scale-95 opacity-0 flex flex-col" id="viewStudentsModalContent">
                        <!-- Modal Header -->
                        <div class="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 rounded-t-2xl text-white">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3">
                                    <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <i class="fas fa-users text-2xl"></i>
                                    </div>
                                    <div>
                                        <h3 class="text-xl font-bold">Class Students</h3>
                                        <p class="text-emerald-100 text-sm" id="viewStudentsClassInfo">Loading class information...</p>
                                    </div>
                                </div>
                                <button id="closeViewStudentsModal" class="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200">
                                    <i class="fas fa-times text-lg"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Modal Body -->
                        <div class="p-6 flex-1 overflow-y-auto">
                            <!-- Loading State -->
                            <div id="viewStudentsLoading" class="hidden">
                                <div class="flex items-center justify-center space-x-3 py-8">
                                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                                    <span class="text-slate-600 font-medium">Loading students...</span>
                                </div>
                            </div>

                            <!-- Empty State -->
                            <div id="viewStudentsEmpty" class="hidden">
                                <div class="text-center py-8">
                                    <div class="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <i class="fas fa-user-friends text-emerald-500 text-2xl"></i>
                                    </div>
                                    <h3 class="text-lg font-semibold text-slate-700 mb-2">No Students Yet</h3>
                                    <p class="text-slate-500 text-sm">No students have joined this class yet</p>
                                </div>
                            </div>

                            <!-- Students List -->
                            <div id="viewStudentsList" class="space-y-4 max-h-96 overflow-y-auto">
                                <!-- Students will be populated by JavaScript -->
                            </div>

                            <!-- Statistics -->
                            <div id="viewStudentsStats" class="hidden mt-6 pt-6 border-t border-slate-200">
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div class="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                                                <i class="fas fa-users text-white text-sm"></i>
                                            </div>
                                            <div>
                                                <div class="text-2xl font-bold text-emerald-600" id="totalStudents">0</div>
                                                <div class="text-xs text-emerald-500">Total Students</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                                <i class="fas fa-check-circle text-white text-sm"></i>
                                            </div>
                                            <div>
                                                <div class="text-2xl font-bold text-blue-600" id="activeStudents">0</div>
                                                <div class="text-xs text-blue-500">Active Students</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                                                <i class="fas fa-clock text-white text-sm"></i>
                                            </div>
                                            <div>
                                                <div class="text-2xl font-bold text-amber-600" id="recentEnrollments">0</div>
                                                <div class="text-xs text-amber-500">Recent (7 days)</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <div class="flex justify-end space-x-3 mt-6 pt-6 border-t border-slate-200 flex-shrink-0">
                                <button 
                                    id="closeViewStudents" 
                                    class="px-6 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-medium transition-all duration-200"
                                >
                                    Close
                                </button>
                                <button 
                                    id="refreshViewStudents" 
                                    class="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    <i class="fas fa-refresh mr-2"></i>
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('viewStudentsModal');
        
        // Add custom styles for better scrolling
        const style = document.createElement('style');
        style.textContent = `
            #viewStudentsList {
                scrollbar-width: thin;
                scrollbar-color: #10b981 #f3f4f6;
            }
            
            #viewStudentsList::-webkit-scrollbar {
                width: 6px;
            }
            
            #viewStudentsList::-webkit-scrollbar-track {
                background: #f3f4f6;
                border-radius: 3px;
            }
            
            #viewStudentsList::-webkit-scrollbar-thumb {
                background: #10b981;
                border-radius: 3px;
            }
            
            #viewStudentsList::-webkit-scrollbar-thumb:hover {
                background: #059669;
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Close modal events
        document.getElementById('closeViewStudentsModal').addEventListener('click', () => this.close());
        document.getElementById('closeViewStudents').addEventListener('click', () => this.close());
        
        // Close on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Refresh button
        document.getElementById('refreshViewStudents').addEventListener('click', () => {
            if (this.currentClassId) {
                this.loadClassStudents(this.currentClassId);
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    async loadClassStudents(classId) {
        this.currentClassId = classId;
        this.showLoading();
        
        console.log('Loading students for class ID:', classId);
        
        try {
            const response = await fetch(`php/class-management.php?action=get_class_students&class_id=${classId}`, {
                credentials: 'include',
                cache: 'no-store'
            });
            
            console.log('Response status:', response.status);
            
            if (response.status === 401) {
                window.location.href = 'teacher-login.html';
                return;
            }
            
            const data = await response.json();
            console.log('Class students data:', data);
            
            if (data.success) {
                this.students = data.students || [];
                console.log('Students loaded:', this.students.length);
                this.updateStudentsList();
                this.updateClassInfo(data.class_info);
                this.updateStatistics();
            } else {
                console.error('Error loading class students:', data.message);
                this.showError('Failed to load students: ' + data.message);
            }
        } catch (error) {
            console.error('Error loading class students:', error);
            this.showError('Network error. Please try again.');
        }
    }

    updateClassInfo(classInfo) {
        const classInfoElement = document.getElementById('viewStudentsClassInfo');
        if (classInfo && classInfoElement) {
            classInfoElement.textContent = `${classInfo.class_name} • ${classInfo.subject} • ${classInfo.grade_level} ${classInfo.strand}`;
        }
    }

    updateStudentsList() {
        const studentsList = document.getElementById('viewStudentsList');
        const emptyState = document.getElementById('viewStudentsEmpty');
        const loadingState = document.getElementById('viewStudentsLoading');
        
        // Hide loading
        loadingState.classList.add('hidden');
        
        if (this.students.length === 0) {
            studentsList.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        studentsList.classList.remove('hidden');
        studentsList.innerHTML = '';

        this.students.forEach((student, index) => {
            const studentCard = document.createElement('div');
            studentCard.className = 'bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-200/60 hover:shadow-lg transition-all duration-300';
            studentCard.innerHTML = `
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                            <i class="fas fa-user text-white text-sm"></i>
                        </div>
                        <div>
                            <h4 class="text-base font-semibold text-slate-800">${student.first_name} ${student.last_name}</h4>
                            <p class="text-xs text-slate-600">${student.email} • ID: ${student.student_number}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                            ${student.enrollment_status === 'approved' ? 'Active' : 'Pending'}
                        </div>
                        <div class="text-xs text-slate-500 mt-1">
                            Joined ${new Date(student.enrolled_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
                
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="text-xs text-slate-500">
                            <i class="fas fa-calendar mr-1"></i>
                            Enrolled: ${this.formatTimeAgo(student.enrolled_at)}
                        </div>
                        ${student.last_activity ? `
                            <div class="text-xs text-slate-500">
                                <i class="fas fa-clock mr-1"></i>
                                Last active: ${this.formatTimeAgo(student.last_activity)}
                            </div>
                        ` : ''}
                    </div>
                    <div class="flex items-center space-x-2">
                        ${student.enrollment_status === 'pending' ? `
                            <button 
                                onclick="approveStudentEnrollment(${student.enrollment_id})"
                                class="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200"
                            >
                                <i class="fas fa-check mr-1"></i>
                                Approve
                            </button>
                            <button 
                                onclick="rejectStudentEnrollment(${student.enrollment_id})"
                                class="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200"
                            >
                                <i class="fas fa-times mr-1"></i>
                                Reject
                            </button>
                        ` : `
                            <span class="text-xs text-slate-500">
                                <i class="fas fa-check-circle mr-1"></i>
                                Approved
                            </span>
                        `}
                    </div>
                </div>
            `;
            studentsList.appendChild(studentCard);
        });
    }

    updateStatistics() {
        const totalStudents = this.students.length;
        const activeStudents = this.students.filter(s => s.enrollment_status === 'approved').length;
        const recentEnrollments = this.students.filter(s => {
            const enrollmentDate = new Date(s.enrolled_at);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return enrollmentDate >= weekAgo;
        }).length;

        document.getElementById('totalStudents').textContent = totalStudents;
        document.getElementById('activeStudents').textContent = activeStudents;
        document.getElementById('recentEnrollments').textContent = recentEnrollments;
        
        // Show statistics if there are students
        if (totalStudents > 0) {
            document.getElementById('viewStudentsStats').classList.remove('hidden');
        }
    }

    async approveStudentEnrollment(enrollmentId) {
        console.log('Approving enrollment ID:', enrollmentId);
        if (window.teacherClassManagement) {
            const result = await window.teacherClassManagement.updateEnrollmentStatus(enrollmentId, 'approved');
            console.log('Approval result:', result);
            if (result.success) {
                this.loadClassStudents(this.currentClassId);
                if (window.teacherClassManagement.showNotification) {
                    window.teacherClassManagement.showNotification('Student enrollment approved!', 'success');
                }
            } else {
                if (window.teacherClassManagement.showNotification) {
                    window.teacherClassManagement.showNotification(result.message || 'Failed to approve enrollment', 'error');
                }
            }
        }
    }

    async rejectStudentEnrollment(enrollmentId) {
        console.log('Rejecting enrollment ID:', enrollmentId);
        if (window.teacherClassManagement) {
            const result = await window.teacherClassManagement.updateEnrollmentStatus(enrollmentId, 'rejected');
            console.log('Rejection result:', result);
            if (result.success) {
                this.loadClassStudents(this.currentClassId);
                if (window.teacherClassManagement.showNotification) {
                    window.teacherClassManagement.showNotification('Student enrollment rejected', 'info');
                }
            } else {
                if (window.teacherClassManagement.showNotification) {
                    window.teacherClassManagement.showNotification(result.message || 'Failed to reject enrollment', 'error');
                }
            }
        }
    }

    showLoading() {
        document.getElementById('viewStudentsLoading').classList.remove('hidden');
        document.getElementById('viewStudentsEmpty').classList.add('hidden');
        document.getElementById('viewStudentsList').classList.add('hidden');
        document.getElementById('viewStudentsStats').classList.add('hidden');
    }

    showError(message) {
        console.error('Error:', message);
        
        // Hide loading and show error
        document.getElementById('viewStudentsLoading').classList.add('hidden');
        document.getElementById('viewStudentsEmpty').classList.add('hidden');
        document.getElementById('viewStudentsList').classList.add('hidden');
        
        // Create error display
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-center py-8';
        errorDiv.innerHTML = `
            <div class="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
            </div>
            <h3 class="text-lg font-semibold text-slate-700 mb-2">Error Loading Students</h3>
            <p class="text-slate-500 text-sm">${message}</p>
        `;
        
        // Clear any existing content and show error
        const modalBody = document.querySelector('#viewStudentsModal .p-6');
        const existingError = modalBody.querySelector('.error-display');
        if (existingError) {
            existingError.remove();
        }
        
        errorDiv.classList.add('error-display');
        modalBody.appendChild(errorDiv);
    }

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

    open(classId) {
        this.isOpen = true;
        this.modal.classList.remove('hidden');
        
        // Animate modal in
        setTimeout(() => {
            const content = document.getElementById('viewStudentsModalContent');
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }, 10);

        // Load class students
        this.loadClassStudents(classId);
    }

    close() {
        this.isOpen = false;
        const content = document.getElementById('viewStudentsModalContent');
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');
        
        setTimeout(() => {
            this.modal.classList.add('hidden');
        }, 300);
    }
}

// Global functions for student enrollment actions
function approveStudentEnrollment(enrollmentId) {
    if (window.viewStudentsModal) {
        window.viewStudentsModal.approveStudentEnrollment(enrollmentId);
    }
}

function rejectStudentEnrollment(enrollmentId) {
    if (window.viewStudentsModal) {
        window.viewStudentsModal.rejectStudentEnrollment(enrollmentId);
    }
}

// Initialize modal when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.viewStudentsModal = new ViewStudentsModal();
});

// Export for use in other files
window.ViewStudentsModal = ViewStudentsModal;

