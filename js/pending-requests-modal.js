// Pending Requests Modal JavaScript
class PendingRequestsModal {
    constructor() {
        this.modal = null;
        this.isOpen = false;
        this.pendingEnrollments = [];
        this.init();
    }

    init() {
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        // Create modal HTML
        const modalHTML = `
            <div id="pendingRequestsModal" class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 hidden">
                <div class="flex items-center justify-center min-h-screen p-4 overflow-y-auto">
                    <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] transform transition-all duration-300 scale-95 opacity-0 flex flex-col" id="pendingRequestsModalContent">
                        <!-- Modal Header -->
                        <div class="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-6 rounded-t-2xl text-white">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3">
                                    <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <i class="fas fa-user-plus text-2xl"></i>
                                    </div>
                                    <div>
                                        <h3 class="text-xl font-bold">Pending Enrollment Requests</h3>
                                        <p class="text-amber-100 text-sm">Review and approve student requests to join your classes</p>
                                    </div>
                                </div>
                                <button id="closePendingRequestsModal" class="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200">
                                    <i class="fas fa-times text-lg"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Modal Body -->
                        <div class="p-6 flex-1 overflow-y-auto">
                            <!-- Loading State -->
                            <div id="pendingRequestsLoading" class="hidden">
                                <div class="flex items-center justify-center space-x-3 py-8">
                                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                                    <span class="text-slate-600 font-medium">Loading requests...</span>
                                </div>
                            </div>

                            <!-- Empty State -->
                            <div id="pendingRequestsEmpty" class="hidden">
                                <div class="text-center py-8">
                                    <div class="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <i class="fas fa-check-circle text-amber-500 text-2xl"></i>
                                    </div>
                                    <h3 class="text-lg font-semibold text-slate-700 mb-2">No Pending Requests</h3>
                                    <p class="text-slate-500 text-sm">All enrollment requests have been processed</p>
                                </div>
                            </div>

                            <!-- Requests List -->
                            <div id="pendingRequestsList" class="space-y-4 max-h-96 overflow-y-auto">
                                <!-- Requests will be populated by JavaScript -->
                            </div>

                            <!-- Action Buttons -->
                            <div class="flex justify-end space-x-3 mt-6 pt-6 border-t border-slate-200 flex-shrink-0">
                                <button 
                                    id="closePendingRequests" 
                                    class="px-6 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-medium transition-all duration-200"
                                >
                                    Close
                                </button>
                                <button 
                                    id="refreshPendingRequests" 
                                    class="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
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
        this.modal = document.getElementById('pendingRequestsModal');
        
        // Add custom styles for better scrolling
        const style = document.createElement('style');
        style.textContent = `
            #pendingRequestsList {
                scrollbar-width: thin;
                scrollbar-color: #f59e0b #f3f4f6;
            }
            
            #pendingRequestsList::-webkit-scrollbar {
                width: 6px;
            }
            
            #pendingRequestsList::-webkit-scrollbar-track {
                background: #f3f4f6;
                border-radius: 3px;
            }
            
            #pendingRequestsList::-webkit-scrollbar-thumb {
                background: #f59e0b;
                border-radius: 3px;
            }
            
            #pendingRequestsList::-webkit-scrollbar-thumb:hover {
                background: #d97706;
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Close modal events
        document.getElementById('closePendingRequestsModal').addEventListener('click', () => this.close());
        document.getElementById('closePendingRequests').addEventListener('click', () => this.close());
        
        // Close on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Refresh button
        document.getElementById('refreshPendingRequests').addEventListener('click', () => {
            this.loadPendingEnrollments();
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    async loadPendingEnrollments() {
        this.showLoading();
        
        try {
            const response = await fetch('php/class-management.php?action=get_pending_enrollments', {
                credentials: 'include',
                cache: 'no-store'
            });
            
            if (response.status === 401) {
                window.location.href = 'teacher-login.html';
                return;
            }
            
            const data = await response.json();
            console.log('Pending enrollments data:', data);
            if (data.success) {
                this.pendingEnrollments = data.enrollments || [];
                console.log('Loaded enrollments:', this.pendingEnrollments);
                this.updateRequestsList();
            } else {
                console.error('Error loading pending enrollments:', data.message);
                this.showError('Failed to load pending requests');
            }
        } catch (error) {
            console.error('Error loading pending enrollments:', error);
            this.showError('Network error. Please try again.');
        }
    }

    updateRequestsList() {
        const requestsList = document.getElementById('pendingRequestsList');
        const emptyState = document.getElementById('pendingRequestsEmpty');
        const loadingState = document.getElementById('pendingRequestsLoading');
        
        // Hide loading
        loadingState.classList.add('hidden');
        
        if (this.pendingEnrollments.length === 0) {
            requestsList.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        requestsList.classList.remove('hidden');
        requestsList.innerHTML = '';

        this.pendingEnrollments.forEach((enrollment, index) => {
            const requestCard = document.createElement('div');
            requestCard.className = 'bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-200/60 hover:shadow-lg transition-all duration-300';
            requestCard.innerHTML = `
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <i class="fas fa-user text-white text-sm"></i>
                        </div>
                        <div>
                            <h4 class="text-base font-semibold text-slate-800">${enrollment.first_name} ${enrollment.last_name}</h4>
                            <p class="text-xs text-slate-600">${enrollment.email} • ID: ${enrollment.student_number}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                            Pending
                        </div>
                        <div class="text-xs text-slate-500 mt-1">
                            ${new Date(enrollment.enrolled_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
                
                <div class="mb-3">
                    <div class="flex items-center space-x-2 mb-1">
                        <i class="fas fa-chalkboard text-slate-400 text-xs"></i>
                        <span class="text-xs font-medium text-slate-700">Requesting to join:</span>
                    </div>
                    <div class="bg-white rounded-lg p-3 border border-slate-200">
                        <h5 class="text-sm font-semibold text-slate-800">${enrollment.class_name}</h5>
                        <p class="text-xs text-slate-600">Code: <span class="font-mono font-medium">${enrollment.class_code}</span></p>
                    </div>
                </div>
                
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <button 
                            onclick="approveEnrollment(${enrollment.enrollment_id})"
                            class="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <i class="fas fa-check mr-1"></i>
                            Approve
                        </button>
                        <button 
                            onclick="rejectEnrollment(${enrollment.enrollment_id})"
                            class="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <i class="fas fa-times mr-1"></i>
                            Reject
                        </button>
                    </div>
                    <div class="text-xs text-slate-500">
                        <i class="fas fa-clock mr-1"></i>
                        ${this.formatTimeAgo(enrollment.enrolled_at)}
                    </div>
                </div>
            `;
            requestsList.appendChild(requestCard);
        });
    }

    async approveEnrollment(enrollmentId) {
        console.log('Approving enrollment ID:', enrollmentId);
        
        // Find the enrollment to get student name
        const enrollment = this.pendingEnrollments.find(e => e.enrollment_id == enrollmentId);
        const studentName = enrollment ? `${enrollment.first_name} ${enrollment.last_name}` : 'Student';
        
        if (window.teacherClassManagement) {
            const result = await window.teacherClassManagement.updateEnrollmentStatus(enrollmentId, 'approved');
            console.log('Approval result:', result);
            if (result.success) {
                this.loadPendingEnrollments();
                
                // Show success notification with student name
                Swal.fire({
                    title: 'Enrollment Approved!',
                    text: `${studentName} has been approved and notified.`,
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
            } else {
                Swal.fire({
                    title: 'Error',
                    text: result.message || 'Failed to approve enrollment',
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
        }
    }

    async rejectEnrollment(enrollmentId) {
        console.log('Rejecting enrollment ID:', enrollmentId);
        
        // Find the enrollment to get student name
        const enrollment = this.pendingEnrollments.find(e => e.enrollment_id == enrollmentId);
        const studentName = enrollment ? `${enrollment.first_name} ${enrollment.last_name}` : 'Student';
        
        // Show confirmation dialog for rejection
        const { value: notes } = await Swal.fire({
            title: 'Reject Enrollment?',
            text: `Are you sure you want to reject ${studentName}'s enrollment request?`,
            input: 'textarea',
            inputLabel: 'Reason for rejection (optional)',
            inputPlaceholder: 'Enter reason for rejection...',
            inputAttributes: {
                'aria-label': 'Reason for rejection'
            },
            showCancelButton: true,
            confirmButtonText: 'Reject',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            background: '#ffffff',
            customClass: {
                popup: 'rounded-2xl',
                title: 'text-slate-800',
                content: 'text-slate-600'
            }
        });
        
        // If user cancelled, return
        if (notes === undefined) {
            return;
        }
        
        if (window.teacherClassManagement) {
            const result = await window.teacherClassManagement.updateEnrollmentStatus(enrollmentId, 'rejected', notes || '');
            console.log('Rejection result:', result);
            if (result.success) {
                this.loadPendingEnrollments();
                
                // Show success notification with student name
                Swal.fire({
                    title: 'Enrollment Rejected',
                    text: `${studentName} has been rejected and notified.`,
                    icon: 'info',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#6b7280',
                    background: '#ffffff',
                    customClass: {
                        popup: 'rounded-2xl',
                        title: 'text-slate-800',
                        content: 'text-slate-600'
                    }
                });
            } else {
                Swal.fire({
                    title: 'Error',
                    text: result.message || 'Failed to reject enrollment',
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
        }
    }

    showLoading() {
        document.getElementById('pendingRequestsLoading').classList.remove('hidden');
        document.getElementById('pendingRequestsEmpty').classList.add('hidden');
        document.getElementById('pendingRequestsList').classList.add('hidden');
    }

    showError(message) {
        // You could implement an error state here
        console.error('Error:', message);
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

    open() {
        this.isOpen = true;
        this.modal.classList.remove('hidden');
        
        // Animate modal in
        setTimeout(() => {
            const content = document.getElementById('pendingRequestsModalContent');
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }, 10);

        // Load pending enrollments
        this.loadPendingEnrollments();
    }

    close() {
        this.isOpen = false;
        const content = document.getElementById('pendingRequestsModalContent');
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');
        
        setTimeout(() => {
            this.modal.classList.add('hidden');
        }, 300);
    }
}

// Global functions for enrollment actions
function approveEnrollment(enrollmentId) {
    if (window.pendingRequestsModal) {
        window.pendingRequestsModal.approveEnrollment(enrollmentId);
    }
}

function rejectEnrollment(enrollmentId) {
    if (window.pendingRequestsModal) {
        window.pendingRequestsModal.rejectEnrollment(enrollmentId);
    }
}

// Initialize modal when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.pendingRequestsModal = new PendingRequestsModal();
});

// Export for use in other files
window.PendingRequestsModal = PendingRequestsModal;
