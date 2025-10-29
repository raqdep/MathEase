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
            <div id="createClassModal" class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 hidden">
                <div class="flex items-center justify-center min-h-screen p-4 overflow-y-auto">
                    <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 my-8 max-h-[90vh] transform transition-all duration-300 scale-95 opacity-0 flex flex-col" id="createClassModalContent">
                        <!-- Modal Header -->
                        <div class="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 rounded-t-2xl text-white flex-shrink-0">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3">
                                    <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <i class="fas fa-chalkboard text-2xl"></i>
                                    </div>
                                    <div>
                                        <h3 class="text-xl font-bold">Create New Class</h3>
                                        <p class="text-indigo-100 text-sm">Set up a new class for your students</p>
                                    </div>
                                </div>
                                <button id="closeCreateClassModal" class="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200">
                                    <i class="fas fa-times text-lg"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Modal Body -->
                        <div class="p-6 overflow-y-auto flex-1">
                            <form id="createClassForm" class="space-y-4">
                                <!-- Class Name -->
                                <div>
                                    <label for="className" class="block text-sm font-semibold text-slate-700 mb-2">
                                        Class Name *
                                    </label>
                                    <input 
                                        type="text" 
                                        id="className" 
                                        name="class_name"
                                        class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                        placeholder="e.g., Grade 11 STEM - General Mathematics"
                                        required
                                    >
                                </div>

                                <!-- Fixed Info Grid -->
                                <div class="grid grid-cols-2 gap-3">
                                    <!-- Subject (Fixed) -->
                                    <div>
                                        <label for="subject" class="block text-xs font-semibold text-slate-700 mb-1">
                                            Subject
                                        </label>
                                        <input 
                                            type="text" 
                                            id="subject" 
                                            name="subject"
                                            class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-100 text-slate-600 cursor-not-allowed"
                                            value="General Mathematics"
                                            readonly
                                        >
                                    </div>

                                    <!-- Grade Level (Fixed) -->
                                    <div>
                                        <label for="gradeLevel" class="block text-xs font-semibold text-slate-700 mb-1">
                                            Grade Level
                                        </label>
                                        <input 
                                            type="text" 
                                            id="gradeLevel" 
                                            name="grade_level"
                                            class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-100 text-slate-600 cursor-not-allowed"
                                            value="Grade 11"
                                            readonly
                                        >
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-3">
                                    <!-- Strand (Fixed) -->
                                    <div>
                                        <label for="strand" class="block text-xs font-semibold text-slate-700 mb-1">
                                            Strand
                                        </label>
                                        <input 
                                            type="text" 
                                            id="strand" 
                                            name="strand"
                                            class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-100 text-slate-600 cursor-not-allowed"
                                            value="STEM"
                                            readonly
                                        >
                                    </div>

                                    <!-- Max Students -->
                                    <div>
                                        <label for="maxStudents" class="block text-xs font-semibold text-slate-700 mb-1">
                                            Max Students
                                        </label>
                                        <input 
                                            type="number" 
                                            id="maxStudents" 
                                            name="max_students"
                                            class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                            placeholder="50"
                                            min="1"
                                            max="100"
                                            value="50"
                                        >
                                    </div>
                                </div>

                                <!-- Description -->
                                <div>
                                    <label for="description" class="block text-sm font-semibold text-slate-700 mb-2">
                                        Description
                                    </label>
                                    <textarea 
                                        id="description" 
                                        name="description"
                                        rows="2"
                                        class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                        placeholder="Brief description of your class..."
                                    ></textarea>
                                </div>

                                <!-- Info Box -->
                                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                                    <div class="flex items-start space-x-2">
                                        <div class="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <i class="fas fa-info text-white text-xs"></i>
                                        </div>
                                        <div>
                                            <h4 class="font-semibold text-slate-800 text-xs mb-1">What happens next?</h4>
                                            <p class="text-xs text-slate-700 leading-relaxed">
                                                You'll get a unique class code for students to join. Approve requests from your dashboard.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Loading State -->
                                <div id="createClassLoading" class="hidden">
                                    <div class="flex items-center justify-center space-x-3 py-4">
                                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                                        <span class="text-slate-600 font-medium">Creating class...</span>
                                    </div>
                                </div>

                                <!-- Success State -->
                                <div id="createClassSuccess" class="hidden">
                                    <div class="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-3">
                                        <div class="flex items-center space-x-2">
                                            <div class="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                                                <i class="fas fa-check text-white text-sm"></i>
                                            </div>
                                            <div>
                                                <h4 class="font-semibold text-emerald-800 text-sm">Class Created Successfully!</h4>
                                                <p class="text-xs text-emerald-700">Class code: <span id="generatedClassCode" class="font-mono font-bold"></span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Error State -->
                                <div id="createClassError" class="hidden">
                                    <div class="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-3">
                                        <div class="flex items-center space-x-2">
                                            <div class="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                                                <i class="fas fa-exclamation-triangle text-white text-sm"></i>
                                            </div>
                                            <div>
                                                <h4 class="font-semibold text-red-800 text-sm">Error</h4>
                                                <p id="createClassErrorMessage" class="text-xs text-red-700"></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </form>
                        </div>

                        <!-- Action Buttons -->
                        <div class="p-6 pt-0 flex-shrink-0 border-t border-gray-100">
                            <div class="flex space-x-3">
                                <button 
                                    type="button" 
                                    id="cancelCreateClass" 
                                    class="flex-1 px-4 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-medium transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    id="submitCreateClass"
                                    class="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    <i class="fas fa-plus mr-2"></i>
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
            maxStudents: parseInt(formData.get('max_students')) || 50
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
