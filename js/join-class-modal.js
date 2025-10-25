// Join Class Modal JavaScript
class JoinClassModal {
    constructor() {
        this.modal = null;
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        // Create modal HTML
        const modalHTML = `
            <div id="joinClassModal" class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 hidden">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-95 opacity-0" id="joinClassModalContent">
                        <!-- Modal Header -->
                        <div class="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 rounded-t-2xl text-white">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3">
                                    <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <i class="fas fa-users text-2xl"></i>
                                    </div>
                                    <div>
                                        <h3 class="text-xl font-bold">Join a Class</h3>
                                        <p class="text-indigo-100 text-sm">Enter your class code to join</p>
                                    </div>
                                </div>
                                <button id="closeJoinClassModal" class="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200">
                                    <i class="fas fa-times text-lg"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Modal Body -->
                        <div class="p-6">
                            <form id="joinClassForm" class="space-y-6">
                                <div>
                                    <label for="classCode" class="block text-sm font-semibold text-slate-700 mb-2">
                                        Class Code
                                    </label>
                                    <div class="relative">
                                        <input 
                                            type="text" 
                                            id="classCode" 
                                            name="class_code"
                                            class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-center text-lg font-mono tracking-wider"
                                            placeholder="Enter class code"
                                            maxlength="8"
                                            required
                                        >
                                        <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                                            <i class="fas fa-key text-slate-400"></i>
                                        </div>
                                    </div>
                                    <p class="text-xs text-slate-500 mt-2">
                                        <i class="fas fa-info-circle mr-1"></i>
                                        Ask your teacher for the class code
                                    </p>
                                </div>

                                <div class="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                                    <div class="flex items-start space-x-3">
                                        <div class="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i class="fas fa-lightbulb text-white text-sm"></i>
                                        </div>
                                        <div>
                                            <h4 class="font-semibold text-slate-800 text-sm mb-1">How to get a class code?</h4>
                                            <p class="text-xs text-slate-700 leading-relaxed">
                                                Your teacher will provide you with a unique class code. 
                                                Enter it exactly as given to join the class.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Loading State -->
                                <div id="joinClassLoading" class="hidden">
                                    <div class="flex items-center justify-center space-x-3 py-4">
                                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                                        <span class="text-slate-600 font-medium">Joining class...</span>
                                    </div>
                                </div>

                                <!-- Success State -->
                                <div id="joinClassSuccess" class="hidden">
                                    <div class="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                                                <i class="fas fa-check text-white"></i>
                                            </div>
                                            <div>
                                                <h4 class="font-semibold text-emerald-800">Request Sent!</h4>
                                                <p class="text-sm text-emerald-700">Your teacher will review your request and approve it.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Error State -->
                                <div id="joinClassError" class="hidden">
                                    <div class="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                                                <i class="fas fa-exclamation-triangle text-white"></i>
                                            </div>
                                            <div>
                                                <h4 class="font-semibold text-red-800">Error</h4>
                                                <p id="joinClassErrorMessage" class="text-sm text-red-700"></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Action Buttons -->
                                <div class="flex space-x-3">
                                    <button 
                                        type="button" 
                                        id="cancelJoinClass" 
                                        class="flex-1 px-4 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-medium transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        id="submitJoinClass"
                                        class="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        <i class="fas fa-plus mr-2"></i>
                                        Join Class
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('joinClassModal');
    }

    setupEventListeners() {
        // Close modal events
        document.getElementById('closeJoinClassModal').addEventListener('click', () => this.close());
        document.getElementById('cancelJoinClass').addEventListener('click', () => this.close());
        
        // Close on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Form submission
        document.getElementById('joinClassForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleJoinClass();
        });

        // Class code input formatting
        document.getElementById('classCode').addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    async handleJoinClass() {
        const classCode = document.getElementById('classCode').value.trim();
        
        if (!classCode) {
            this.showError('Please enter a class code');
            return;
        }

        if (classCode.length < 4) {
            this.showError('Class code must be at least 4 characters');
            return;
        }

        this.showLoading();

        try {
            const formData = new FormData();
            formData.append('action', 'join_class');
            formData.append('class_code', classCode);

            const response = await fetch('php/class-management.php', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(result.message);
                // Reset form after success
                setTimeout(() => {
                    this.resetForm();
                    this.close();
                    // Refresh enrollment status
                    if (window.studentEnrollmentCheck) {
                        window.studentEnrollmentCheck.refreshEnrollmentStatus();
                    }
                    // Refresh page or update UI
                    window.location.reload();
                }, 2000);
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            console.error('Error joining class:', error);
            this.showError('Network error. Please try again.');
        }
    }

    showLoading() {
        document.getElementById('joinClassLoading').classList.remove('hidden');
        document.getElementById('joinClassSuccess').classList.add('hidden');
        document.getElementById('joinClassError').classList.add('hidden');
        document.getElementById('submitJoinClass').disabled = true;
    }

    showSuccess(message) {
        document.getElementById('joinClassLoading').classList.add('hidden');
        document.getElementById('joinClassSuccess').classList.remove('hidden');
        document.getElementById('joinClassError').classList.add('hidden');
    }

    showError(message) {
        document.getElementById('joinClassLoading').classList.add('hidden');
        document.getElementById('joinClassSuccess').classList.add('hidden');
        document.getElementById('joinClassError').classList.remove('hidden');
        document.getElementById('joinClassErrorMessage').textContent = message;
        document.getElementById('submitJoinClass').disabled = false;
    }

    resetForm() {
        document.getElementById('joinClassForm').reset();
        document.getElementById('joinClassLoading').classList.add('hidden');
        document.getElementById('joinClassSuccess').classList.add('hidden');
        document.getElementById('joinClassError').classList.add('hidden');
        document.getElementById('submitJoinClass').disabled = false;
    }

    open() {
        this.isOpen = true;
        this.modal.classList.remove('hidden');
        
        // Animate modal in
        setTimeout(() => {
            const content = document.getElementById('joinClassModalContent');
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }, 10);

        // Focus on input
        setTimeout(() => {
            document.getElementById('classCode').focus();
        }, 300);
    }

    close() {
        this.isOpen = false;
        const content = document.getElementById('joinClassModalContent');
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');
        
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.resetForm();
        }, 300);
    }
}

// Initialize modal when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.joinClassModal = new JoinClassModal();
});

// Function to open modal (can be called from anywhere)
function openJoinClassModal() {
    if (window.joinClassModal) {
        window.joinClassModal.open();
    }
}

// Export for use in other files
window.JoinClassModal = JoinClassModal;
