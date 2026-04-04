// Create Class Modal JavaScript
class CreateClassModal {
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
            <div id="createClassModal" class="fixed inset-0 z-50 hidden bg-slate-900/35 backdrop-blur-sm">
                <div class="flex items-center justify-center min-h-screen p-4 overflow-y-auto">
                    <div class="bg-white rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.08),0_2px_8px_rgba(15,23,42,0.06)] max-w-lg w-full mx-4 my-8 max-h-[90vh] transform transition-all duration-300 scale-95 opacity-0 flex flex-col border border-slate-100/80" id="createClassModalContent">
                        <!-- Header: clean card style (matches account verification aesthetic) -->
                        <div class="p-6 pb-4 flex-shrink-0 flex items-start justify-between gap-3">
                            <div class="text-left min-w-0">
                                <h3 class="text-xl font-bold text-gray-900 tracking-tight">Create New Class</h3>
                                <p class="text-sm text-gray-500 mt-1">Set up a new class for your students</p>
                            </div>
                            <button type="button" id="closeCreateClassModal" class="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors flex-shrink-0" aria-label="Close">
                                <i class="fas fa-times text-lg"></i>
                            </button>
                        </div>

                        <!-- Modal Body -->
                        <div class="px-6 pb-4 overflow-y-auto flex-1">
                            <form id="createClassForm" class="space-y-4">
                                <!-- Class Name -->
                                <div>
                                    <label for="className" class="block text-sm font-semibold text-gray-800 mb-2">
                                        Class Name *
                                    </label>
                                    <input 
                                        type="text" 
                                        id="className" 
                                        name="class_name"
                                        class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 transition shadow-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-300 focus:border-sky-400"
                                        placeholder="e.g., Grade 11 STEM - General Mathematics"
                                        required
                                    >
                                </div>

                                <!-- Fixed Info Grid -->
                                <div class="grid grid-cols-2 gap-3">
                                    <!-- Subject (Fixed) -->
                                    <div>
                                        <label for="subject" class="block text-xs font-semibold text-gray-700 mb-1">
                                            Subject
                                        </label>
                                        <input 
                                            type="text" 
                                            id="subject" 
                                            name="subject"
                                            class="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed"
                                            value="General Mathematics"
                                            readonly
                                        >
                                    </div>

                                    <!-- Grade Level (auto: Grade 11) -->
                                    <div>
                                        <label for="gradeLevel" class="block text-xs font-semibold text-gray-700 mb-1">
                                            Grade Level
                                        </label>
                                        <input type="hidden" name="grade_level" value="11">
                                        <input type="text" id="gradeLevel" class="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed" value="Grade 11" readonly>
                                    </div>
                                    <!-- Strand (auto: STEM) -->
                                    <div>
                                        <label for="strand" class="block text-xs font-semibold text-gray-700 mb-1">
                                            Strand
                                        </label>
                                        <input type="hidden" name="strand" value="STEM">
                                        <input type="text" id="strand" class="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed" value="STEM" readonly>
                                    </div>
                                </div>

                                <!-- Description -->
                                <div>
                                    <label for="description" class="block text-sm font-semibold text-gray-800 mb-2">
                                        Description
                                    </label>
                                    <textarea 
                                        id="description" 
                                        name="description"
                                        rows="2"
                                        class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 transition shadow-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-300 focus:border-sky-400 resize-y min-h-[4rem]"
                                        placeholder="Brief description of your class..."
                                    ></textarea>
                                </div>

                                <!-- Info Box -->
                                <div class="bg-sky-50 border border-sky-100 rounded-xl p-3">
                                    <div class="flex items-start space-x-2">
                                        <div class="w-7 h-7 bg-sky-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-sky-500/20">
                                            <i class="fas fa-info text-white text-xs"></i>
                                        </div>
                                        <div>
                                            <h4 class="font-semibold text-gray-900 text-xs mb-1">What happens next?</h4>
                                            <p class="text-xs text-gray-600 leading-relaxed">
                                                You'll get a unique class code for students to join. Approve requests from your dashboard.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Loading State -->
                                <div id="createClassLoading" class="hidden">
                                    <div class="flex items-center justify-center space-x-3 py-4">
                                        <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-sky-500"></div>
                                        <span class="text-gray-600 font-medium">Creating class...</span>
                                    </div>
                                </div>

                                <!-- Success State -->
                                <div id="createClassSuccess" class="hidden">
                                <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                                        <div class="flex items-center space-x-2">
                                        <div class="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
                                                <i class="fas fa-check text-white text-sm"></i>
                                            </div>
                                            <div>
                                            <h4 class="font-semibold text-emerald-900 text-sm">Class created successfully</h4>
                                            <p class="text-xs text-emerald-800">Class code: <span id="generatedClassCode" class="font-mono font-bold"></span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Error State -->
                                <div id="createClassError" class="hidden">
                                    <div class="bg-red-50 border border-red-200 rounded-xl p-3">
                                        <div class="flex items-center space-x-2">
                                            <div class="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center shadow-sm">
                                                <i class="fas fa-exclamation-triangle text-white text-sm"></i>
                                            </div>
                                            <div>
                                                <h4 class="font-semibold text-red-900 text-sm">Error</h4>
                                                <p id="createClassErrorMessage" class="text-xs text-red-800"></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </form>
                        </div>

                        <!-- Action Buttons -->
                        <div class="p-6 pt-2 flex-shrink-0 border-t border-gray-100">
                            <div class="flex flex-col-reverse sm:flex-row gap-3">
                                <button 
                                    type="button" 
                                    id="cancelCreateClass" 
                                    class="flex-1 px-4 py-3.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    id="submitCreateClass"
                                    class="flex-1 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-sky-500/30 hover:shadow-sky-500/40"
                                >
                                    <i class="fas fa-plus text-sm"></i>
                                    Create Class
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('createClassModal');
    }

    setupEventListeners() {
        // Close modal events
        document.getElementById('closeCreateClassModal').addEventListener('click', () => this.close());
        document.getElementById('cancelCreateClass').addEventListener('click', () => this.close());
        
        // Close on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Form submission
        document.getElementById('createClassForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateClass();
        });

        // Submit button click (since it's outside the form now)
        document.getElementById('submitCreateClass').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleCreateClass();
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    async handleCreateClass() {
        const formData = new FormData(document.getElementById('createClassForm'));
        const classData = {
            className: formData.get('class_name'),
            description: formData.get('description'),
            subject: formData.get('subject'),
            gradeLevel: formData.get('grade_level'),
            strand: formData.get('strand'),
            // Kept as a fixed default since the UI no longer asks max students.
            maxStudents: 50
        };

        // Validate required fields
        if (!classData.className || !classData.subject || !classData.gradeLevel || !classData.strand) {
            this.showError('Please fill in all required fields');
            return;
        }

        this.showLoading();

        try {
            if (window.teacherClassManagement) {
                const result = await window.teacherClassManagement.createClass(classData);
                
                if (result.success) {
                    this.showSuccess(result.classCode);
                    // Reset form after success
                    setTimeout(() => {
                        this.resetForm();
                        this.close();
                    }, 3000);
                } else {
                    this.showError(result.message);
                }
            } else {
                this.showError('Class management system not available');
            }
        } catch (error) {
            console.error('Error creating class:', error);
            this.showError('Network error. Please try again.');
        }
    }

    showLoading() {
        document.getElementById('createClassLoading').classList.remove('hidden');
        document.getElementById('createClassSuccess').classList.add('hidden');
        document.getElementById('createClassError').classList.add('hidden');
        document.getElementById('submitCreateClass').disabled = true;
    }

    showSuccess(classCode) {
        document.getElementById('createClassLoading').classList.add('hidden');
        document.getElementById('createClassSuccess').classList.remove('hidden');
        document.getElementById('createClassError').classList.add('hidden');
        document.getElementById('generatedClassCode').textContent = classCode;
    }

    showError(message) {
        document.getElementById('createClassLoading').classList.add('hidden');
        document.getElementById('createClassSuccess').classList.add('hidden');
        document.getElementById('createClassError').classList.remove('hidden');
        document.getElementById('createClassErrorMessage').textContent = message;
        document.getElementById('submitCreateClass').disabled = false;
    }

    resetForm() {
        document.getElementById('createClassForm').reset();
        document.getElementById('createClassLoading').classList.add('hidden');
        document.getElementById('createClassSuccess').classList.add('hidden');
        document.getElementById('createClassError').classList.add('hidden');
        document.getElementById('submitCreateClass').disabled = false;
    }

    open() {
        this.isOpen = true;
        this.modal.classList.remove('hidden');
        
        // Animate modal in
        setTimeout(() => {
            const content = document.getElementById('createClassModalContent');
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }, 10);

        // Focus on first editable input
        setTimeout(() => {
            document.getElementById('className').focus();
        }, 300);
    }

    close() {
        this.isOpen = false;
        const content = document.getElementById('createClassModalContent');
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
    window.createClassModal = new CreateClassModal();
});

// Export for use in other files
window.CreateClassModal = CreateClassModal;
