// View Students Modal JavaScript
class ViewStudentsModal {
    constructor() {
        this.modal = null;
        this.isOpen = false;
        this.currentClassId = null;
        this.students = [];
        this.currentPage = 1;
        this.pageSize = 10;
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
                        <div class="bg-purple-600 p-6 rounded-t-2xl text-white">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3">
                                    <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <i class="fas fa-users text-2xl"></i>
                                    </div>
                                    <div>
                                        <h3 class="text-xl font-bold">Class Students</h3>
                                        <p class="text-indigo-100 text-sm" id="viewStudentsClassInfo">Loading class information...</p>
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
                                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                                    <span class="text-slate-600 font-medium">Loading students...</span>
                                </div>
                            </div>

                            <!-- Empty State -->
                            <div id="viewStudentsEmpty" class="hidden">
                                <div class="text-center py-8">
                                    <div class="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <i class="fas fa-users text-purple-600 text-2xl"></i>
                                    </div>
                                    <h3 class="text-lg font-semibold text-slate-700 mb-2">No Students Yet</h3>
                                    <p class="text-slate-500 text-sm">No students have joined this class yet</p>
                                </div>
                            </div>

                            <!-- Summary (above roster) -->
                            <div id="viewStudentsStats" class="hidden mb-5">
                                <div class="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-indigo-50/80 p-4 sm:p-5 shadow-sm">
                                    <p class="text-xs font-semibold uppercase tracking-wide text-purple-800/80 mb-3">Class summary</p>
                                    <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                        <span class="text-sm font-medium text-slate-600">Total students</span>
                                        <span class="text-2xl sm:text-3xl font-bold text-purple-800 tabular-nums leading-tight" id="totalStudents">0</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Student roster: table + pagination -->
                            <div id="viewStudentsList" class="hidden space-y-3">
                                <div class="flex items-baseline justify-between gap-2 flex-wrap">
                                    <h4 class="text-sm font-semibold text-slate-800">Student roster</h4>
                                    <span class="text-xs text-slate-500 sm:hidden">Swipe horizontally to see all columns.</span>
                                </div>
                                <div class="overflow-x-auto max-h-[min(28rem,52vh)] overflow-y-auto rounded-xl border border-purple-200/70 bg-white shadow-sm">
                                    <table class="w-full min-w-[520px] text-left text-sm">
                                        <thead class="bg-purple-50 sticky top-0 z-10 border-b border-purple-100">
                                            <tr>
                                                <th scope="col" class="px-3 py-3 font-semibold text-slate-700 whitespace-nowrap">#</th>
                                                <th scope="col" class="px-3 py-3 font-semibold text-slate-700 whitespace-nowrap">Name</th>
                                                <th scope="col" class="px-3 py-3 font-semibold text-slate-700 whitespace-nowrap">Email</th>
                                                <th scope="col" class="px-3 py-3 font-semibold text-slate-700 whitespace-nowrap">Enrolled</th>
                                                <th scope="col" class="px-3 py-3 font-semibold text-slate-700 text-right whitespace-nowrap">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody id="viewStudentsTableBody" class="divide-y divide-slate-100">
                                        </tbody>
                                    </table>
                                </div>
                                <div id="viewStudentsPagination" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                                    <p class="text-sm text-slate-600" id="viewStudentsPageInfo"></p>
                                    <div class="flex items-center gap-2">
                                        <button type="button" id="viewStudentsPrev" class="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors">
                                            Previous
                                        </button>
                                        <button type="button" id="viewStudentsNext" class="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors">
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <div class="flex justify-end space-x-3 mt-5 pt-5 border-t border-slate-200 flex-shrink-0">
                                <button 
                                    id="closeViewStudents" 
                                    class="px-6 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-medium transition-all duration-200"
                                >
                                    Close
                                </button>
                                <button 
                                    id="refreshViewStudents" 
                                    class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
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
            #viewStudentsList .overflow-x-auto {
                scrollbar-width: thin;
                scrollbar-color: #9333ea #f3f4f6;
            }
            #viewStudentsList .overflow-x-auto::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
            #viewStudentsList .overflow-x-auto::-webkit-scrollbar-track {
                background: #f3f4f6;
                border-radius: 3px;
            }
            #viewStudentsList .overflow-x-auto::-webkit-scrollbar-thumb {
                background: #9333ea;
                border-radius: 3px;
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

        document.getElementById('viewStudentsPrev').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.updateStudentsList();
            }
        });
        document.getElementById('viewStudentsNext').addEventListener('click', () => {
            const totalPages = Math.max(1, Math.ceil(this.students.length / this.pageSize));
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.updateStudentsList();
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
                this.currentPage = 1;
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

    escapeHtml(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    updateStudentsList() {
        const studentsList = document.getElementById('viewStudentsList');
        const tableBody = document.getElementById('viewStudentsTableBody');
        const paginationEl = document.getElementById('viewStudentsPagination');
        const pageInfo = document.getElementById('viewStudentsPageInfo');
        const btnPrev = document.getElementById('viewStudentsPrev');
        const btnNext = document.getElementById('viewStudentsNext');
        const emptyState = document.getElementById('viewStudentsEmpty');
        const loadingState = document.getElementById('viewStudentsLoading');

        loadingState.classList.add('hidden');

        if (this.students.length === 0) {
            studentsList.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        studentsList.classList.remove('hidden');

        const total = this.students.length;
        const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
        if (this.currentPage > totalPages) this.currentPage = totalPages;
        const start = (this.currentPage - 1) * this.pageSize;
        const pageRows = this.students.slice(start, start + this.pageSize);

        tableBody.innerHTML = pageRows.map((student, i) => {
            const globalIndex = start + i + 1;
            const name = this.escapeHtml(`${student.first_name || ''} ${student.last_name || ''}`.trim() || '—');
            const email = this.escapeHtml(student.email || '—');
            const enrolled = student.enrolled_at
                ? new Date(student.enrolled_at).toLocaleDateString()
                : '—';
            const eid = Number(student.enrollment_id);
            const actions = student.enrollment_status === 'pending'
                ? `<button type="button" onclick="approveStudentEnrollment(${eid})" class="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-md text-xs font-medium mr-1">Approve</button>
                   <button type="button" onclick="rejectStudentEnrollment(${eid})" class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-md text-xs font-medium">Reject</button>`
                : student.enrollment_status === 'approved'
                ? `<span class="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-full inline-block mr-1"><i class="fas fa-check-circle mr-1"></i>Approved</span>
                   <button type="button" onclick="removeApprovedStudentFromClass(${eid})" class="border border-red-200 text-red-700 hover:bg-red-50 px-2 py-1 rounded-md text-xs font-medium">Remove from class</button>`
                : `<span class="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-full inline-block">${this.escapeHtml(student.enrollment_status || '—')}</span>`;

            return `<tr class="hover:bg-purple-50/40">
                <td class="px-3 py-2.5 text-slate-500">${globalIndex}</td>
                <td class="px-3 py-2.5 font-medium text-slate-800">${name}</td>
                <td class="px-3 py-2.5 text-slate-600 max-w-[200px] break-all">${email}</td>
                <td class="px-3 py-2.5 text-slate-600 whitespace-nowrap">${enrolled}</td>
                <td class="px-3 py-2.5 text-right whitespace-nowrap">${actions}</td>
            </tr>`;
        }).join('');

        const from = total === 0 ? 0 : start + 1;
        const to = Math.min(start + pageRows.length, total);
        pageInfo.textContent = `Showing ${from}–${to} of ${total} students · Page ${this.currentPage} of ${totalPages}`;
        btnPrev.disabled = this.currentPage <= 1;
        btnNext.disabled = this.currentPage >= totalPages;
        paginationEl.classList.toggle('hidden', totalPages <= 1);
    }

    updateStatistics() {
        const totalStudents = this.students.length;

        document.getElementById('totalStudents').textContent = totalStudents;

        const statsEl = document.getElementById('viewStudentsStats');
        if (statsEl) {
            statsEl.classList.toggle('hidden', totalStudents === 0);
        }
    }

    async approveStudentEnrollment(enrollmentId) {
        console.log('Approving enrollment ID:', enrollmentId);
        const id = Number(enrollmentId);
        if (!Number.isFinite(id) || id <= 0) {
            if (window.teacherClassManagement && window.teacherClassManagement.showNotification) {
                window.teacherClassManagement.showNotification('Invalid enrollment. Refresh the page and try again.', 'error');
            }
            return;
        }
        const mgr = window.teacherClassManagement;
        if (!mgr || typeof mgr.updateEnrollmentStatus !== 'function') {
            if (mgr && mgr.showNotification) {
                mgr.showNotification('Class management is still loading. Please try again in a moment.', 'warning');
            }
            return;
        }
        const result = await mgr.updateEnrollmentStatus(id, 'approved');
        console.log('Approval result:', result);
        if (result.success) {
            this.loadClassStudents(this.currentClassId);
            if (mgr.showNotification) {
                mgr.showNotification('Student enrollment approved!', 'success');
            }
        } else if (mgr.showNotification) {
            mgr.showNotification(result.message || 'Failed to approve enrollment', 'error');
        }
    }

    async rejectStudentEnrollment(enrollmentId) {
        console.log('Rejecting enrollment ID:', enrollmentId);
        const id = Number(enrollmentId);
        if (!Number.isFinite(id) || id <= 0) {
            if (window.teacherClassManagement && window.teacherClassManagement.showNotification) {
                window.teacherClassManagement.showNotification('Invalid enrollment. Refresh the page and try again.', 'error');
            }
            return;
        }
        const mgr = window.teacherClassManagement;
        if (!mgr || typeof mgr.updateEnrollmentStatus !== 'function') {
            if (mgr && mgr.showNotification) {
                mgr.showNotification('Class management is still loading. Please try again in a moment.', 'warning');
            }
            return;
        }
        const result = await mgr.updateEnrollmentStatus(id, 'rejected');
        console.log('Rejection result:', result);
        if (result.success) {
            this.loadClassStudents(this.currentClassId);
            if (mgr.showNotification) {
                mgr.showNotification('Student enrollment rejected', 'info');
            }
        } else if (mgr.showNotification) {
            mgr.showNotification(result.message || 'Failed to reject enrollment', 'error');
        }
    }

    async removeApprovedStudentFromClass(enrollmentId) {
        const id = Number(enrollmentId);
        if (!Number.isFinite(id) || id <= 0) {
            if (window.teacherClassManagement && window.teacherClassManagement.showNotification) {
                window.teacherClassManagement.showNotification('Invalid enrollment. Refresh the page and try again.', 'error');
            }
            return;
        }

        const doRemove = async () => {
            const mgr = window.teacherClassManagement;
            if (!mgr || typeof mgr.removeStudentFromClass !== 'function') {
                if (mgr && mgr.showNotification) {
                    mgr.showNotification('Class management is still loading. Please try again in a moment.', 'warning');
                }
                return;
            }
            const result = await mgr.removeStudentFromClass(id);
            if (result.success) {
                this.loadClassStudents(this.currentClassId);
                if (mgr.showNotification) {
                    mgr.showNotification(result.message || 'Student removed from class.', 'success');
                }
            } else if (mgr.showNotification) {
                mgr.showNotification(result.message || 'Failed to remove student', 'error');
            }
        };

        if (typeof Swal !== 'undefined' && Swal.fire) {
            const res = await Swal.fire({
                title: 'Remove from class?',
                html: '<p class="text-left text-gray-600 text-sm">This removes the student from this class only. <strong>Their lesson and quiz progress stays on their account</strong>—if they join this class again and you approve them, they pick up where they left off.</p>',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Remove from class',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#dc2626',
                focusCancel: true
            });
            if (res.isConfirmed) {
                await doRemove();
            }
        } else if (window.confirm('Remove this student from the class? Their progress will be saved if they rejoin later.')) {
            await doRemove();
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
        const statsEl = document.getElementById('viewStudentsStats');
        if (statsEl) statsEl.classList.add('hidden');

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

function removeApprovedStudentFromClass(enrollmentId) {
    if (window.viewStudentsModal) {
        window.viewStudentsModal.removeApprovedStudentFromClass(enrollmentId);
    }
}

// Initialize modal when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.viewStudentsModal = new ViewStudentsModal();
});

// Export for use in other files
window.ViewStudentsModal = ViewStudentsModal;

