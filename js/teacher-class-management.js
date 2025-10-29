// Teacher Class Management JavaScript
class TeacherClassManagement {
    constructor() {
        this.classes = [];
        this.pendingEnrollments = [];
        this.init();
    }

    async init() {
        await this.loadTeacherClasses();
        await this.loadPendingEnrollments();
        this.updateClassesList();
        this.setupEventListeners();
    }

    async loadTeacherClasses() {
        try {
            const response = await fetch('php/class-management.php?action=get_teacher_classes', {
                credentials: 'include',
                cache: 'no-store'
            });
            
            if (response.status === 401) {
                window.location.href = 'teacher-login.html';
                return;
            }
            
            const data = await response.json();
            if (data.success) {
                this.classes = data.classes || [];
            } else {
                console.error('Error loading classes:', data.message);
            }
        } catch (error) {
            console.error('Error loading classes:', error);
        }
    }

    async loadPendingEnrollments() {
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
            if (data.success) {
                this.pendingEnrollments = data.enrollments || [];
            } else {
                console.error('Error loading pending enrollments:', data.message);
            }
        } catch (error) {
            console.error('Error loading pending enrollments:', error);
        }
    }

    updateClassesList() {
        const classesList = document.getElementById('myClassesList');
        if (!classesList) return;

        if (this.classes.length === 0) {
            classesList.innerHTML = `
                <div class="text-center py-8">
                    <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-chalkboard text-slate-400 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-slate-700 mb-2">No Classes Yet</h3>
                    <p class="text-slate-500 text-sm mb-4">Create your first class to get started</p>
                    <button onclick="openCreateClassModal()" class="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
                        <i class="fas fa-plus mr-2"></i>
                        Create Your First Class
                    </button>
                </div>
            `;
            return;
        }

        classesList.innerHTML = '';
        this.classes.forEach((classItem, index) => {
            const classCard = document.createElement('div');
            classCard.className = 'bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300 mb-4';
            classCard.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <i class="fas fa-chalkboard text-white text-lg"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-slate-800">${classItem.class_name}</h3>
                            <p class="text-sm text-slate-600">${classItem.subject} • ${classItem.grade_level} ${classItem.strand}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-indigo-600">${classItem.approved_students || 0}</div>
                        <div class="text-xs text-slate-500">Students</div>
                    </div>
                </div>
                
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-4">
                        <div class="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                            <i class="fas fa-key mr-1"></i>
                            ${classItem.class_code}
                        </div>
                        <div class="text-sm text-slate-600">
                            <i class="fas fa-users mr-1"></i>
                            ${classItem.total_enrollments || 0} total enrollments
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="viewClassStudents(${classItem.id})" class="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                            <i class="fas fa-eye mr-1"></i>
                            View Students
                        </button>
                        <button onclick="showTopicManagement(${classItem.id}, '${classItem.class_name}')" class="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                            <i class="fas fa-book-open mr-1"></i>
                            Manage Topics
                        </button>
                        <button onclick="copyClassCode('${classItem.class_code}')" class="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                            <i class="fas fa-copy mr-1"></i>
                            Copy Code
                        </button>
                        <button onclick="deleteClass(${classItem.id}, '${classItem.class_name}')" class="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                            <i class="fas fa-trash mr-1"></i>
                            Delete
                        </button>
                    </div>
                </div>
                
                ${classItem.description ? `<p class="text-sm text-slate-600 mb-4">${classItem.description}</p>` : ''}
                
                <div class="flex items-center justify-between text-xs text-slate-500">
                    <span>Created ${new Date(classItem.created_at).toLocaleDateString()}</span>
                    <span>${classItem.pending_students || 0} pending requests</span>
                </div>
            `;
            classesList.appendChild(classCard);
        });
    }

    setupEventListeners() {
        // Auto-refresh every 30 seconds
        setInterval(() => {
            this.loadPendingEnrollments();
        }, 30000);
    }

    async createClass(classData) {
        try {
            const formData = new FormData();
            formData.append('action', 'create_class');
            formData.append('class_name', classData.className);
            formData.append('description', classData.description);
            formData.append('subject', classData.subject);
            formData.append('grade_level', classData.gradeLevel);
            formData.append('strand', classData.strand);
            formData.append('max_students', classData.maxStudents);

            const response = await fetch('php/class-management.php', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            // Check if response is ok and content type is JSON
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Server returned non-JSON response');
            }

            const result = await response.json();
            
            if (result.success) {
                await this.loadTeacherClasses();
                this.updateClassesList();
                return { success: true, classCode: result.class_code };
            } else {
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('Error creating class:', error);
            return { success: false, message: 'Network error. Please try again.' };
        }
    }

    async updateEnrollmentStatus(enrollmentId, status, notes = '') {
        try {
            const formData = new FormData();
            formData.append('action', 'update_enrollment');
            formData.append('enrollment_id', enrollmentId);
            formData.append('status', status);
            formData.append('notes', notes);

            const response = await fetch('php/class-management.php', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            // Check if response is ok and content type is JSON
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Server returned non-JSON response');
            }

            const result = await response.json();
            
            if (result.success) {
                await this.loadPendingEnrollments();
                await this.loadTeacherClasses();
                this.updateClassesList();
                return { success: true };
            } else {
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('Error updating enrollment:', error);
            return { success: false, message: 'Network error. Please try again.' };
        }
    }

    async deleteClass(classId, className) {
        try {
            // Show confirmation dialog
            const result = await Swal.fire({
                title: 'Delete Class',
                html: `
                    <div class="text-left">
                        <p class="mb-4">Are you sure you want to delete the class <strong>"${className}"</strong>?</p>
                        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <div class="flex items-start">
                                <div class="flex-shrink-0">
                                    <i class="fas fa-exclamation-triangle text-red-400 text-lg"></i>
                                </div>
                                <div class="ml-3">
                                    <h3 class="text-sm font-medium text-red-800">Warning</h3>
                                    <div class="mt-2 text-sm text-red-700">
                                        <ul class="list-disc list-inside space-y-1">
                                            <li>All enrolled students will be removed from this class</li>
                                            <li>Students will be notified about the class deletion</li>
                                            <li>This action cannot be undone</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p class="text-sm text-gray-600">Type <strong>DELETE</strong> to confirm:</p>
                        <input type="text" id="confirmDelete" class="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder="Type DELETE here">
                    </div>
                `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Delete Class',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                allowOutsideClick: false,
                preConfirm: () => {
                    const confirmInput = document.getElementById('confirmDelete');
                    if (confirmInput.value !== 'DELETE') {
                        Swal.showValidationMessage('Please type DELETE to confirm');
                        return false;
                    }
                    return true;
                }
            });

            if (result.isConfirmed) {
                // Show loading
                Swal.fire({
                    title: 'Deleting Class...',
                    text: 'Please wait while we delete the class and notify students.',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                const formData = new FormData();
                formData.append('action', 'delete_class');
                formData.append('class_id', classId);

                const response = await fetch('php/class-management.php', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await response.text();
                    console.error('Non-JSON response:', text);
                    throw new Error('Server returned non-JSON response');
                }

                const deleteResult = await response.json();
                
                if (deleteResult.success) {
                    // Close loading dialog
                    Swal.close();
                    
                    // Show success message
                    Swal.fire({
                        title: 'Class Deleted',
                        html: `
                            <div class="text-center">
                                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="fas fa-check text-green-600 text-2xl"></i>
                                </div>
                                <p class="text-lg font-medium text-gray-900 mb-2">Class deleted successfully!</p>
                                <p class="text-sm text-gray-600">${deleteResult.notified_students} students have been notified.</p>
                            </div>
                        `,
                        icon: 'success',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#10b981'
                    });

                    // Reload classes
                    await this.loadTeacherClasses();
                    this.updateClassesList();
                } else {
                    Swal.close();
                    Swal.fire({
                        title: 'Error',
                        text: deleteResult.message || 'Failed to delete class',
                        icon: 'error',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#ef4444'
                    });
                }
            }
        } catch (error) {
            console.error('Error deleting class:', error);
            Swal.close();
            Swal.fire({
                title: 'Error',
                text: 'Network error. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#ef4444'
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
        }
    }
}

// Global functions for teacher class management
function openCreateClassModal() {
    if (window.createClassModal) {
        window.createClassModal.open();
    }
}

function openPendingRequestsModal() {
    if (window.pendingRequestsModal) {
        window.pendingRequestsModal.open();
    }
}

function copyClassCode(classCode) {
    navigator.clipboard.writeText(classCode).then(() => {
        if (window.teacherClassManagement) {
            window.teacherClassManagement.showNotification('Class code copied to clipboard!', 'success');
        }
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = classCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (window.teacherClassManagement) {
            window.teacherClassManagement.showNotification('Class code copied to clipboard!', 'success');
        }
    });
}

function viewClassStudents(classId) {
    if (window.viewStudentsModal) {
        window.viewStudentsModal.open(classId);
    } else {
        // Try to initialize it manually
        if (window.ViewStudentsModal) {
            window.viewStudentsModal = new window.ViewStudentsModal();
            window.viewStudentsModal.open(classId);
        } else {
            alert('View Students modal is not available. Please refresh the page.');
        }
    }
}

function deleteClass(classId, className) {
    if (window.teacherClassManagement) {
        window.teacherClassManagement.deleteClass(classId, className);
    } else {
        alert('Class management is not available. Please refresh the page.');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.teacherClassManagement = new TeacherClassManagement();
});

// Export for use in other files
window.TeacherClassManagement = TeacherClassManagement;
