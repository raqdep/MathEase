// Admin Dashboard JavaScript
let currentTeacherId = null;
let pendingTeachers = [];

document.addEventListener('DOMContentLoaded', function() {
    // Check admin authentication
    if (!checkAdminAuth()) {
        return;
    }
    
    // Load admin info
    loadAdminInfo();
    
    // Load dashboard data
    loadDashboardStats();
    
    // Show dashboard by default
    showSection('dashboard');
    
    // Fallback: ensure dashboard is visible
    setTimeout(() => {
        const dashboardSection = document.getElementById('dashboard-section');
        if (dashboardSection && dashboardSection.classList.contains('hidden')) {
            console.log('Fallback: Making dashboard visible');
            dashboardSection.classList.remove('hidden');
        }
    }, 100);
    
    // Update time
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // Setup navigation
    setupNavigation();
});

function loadAdminInfo() {
    const adminName = sessionStorage.getItem('admin_name');
    const adminRole = sessionStorage.getItem('admin_role');
    
    document.getElementById('admin-name').textContent = adminName || 'Admin User';
    document.getElementById('admin-role').textContent = adminRole || 'Super Admin';
}

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: 'numeric', 
        minute: '2-digit' 
    });
    document.getElementById('current-time').textContent = timeString;
}

// Section Management
let currentSection = 'dashboard';

function showSection(sectionName) {
    console.log('Showing section:', sectionName); // Debug log
    
    // Hide all sections
    const sections = document.querySelectorAll('.dashboard-section');
    console.log('Found sections:', sections.length); // Debug log
    sections.forEach(section => {
        section.classList.add('hidden');
        console.log('Hiding section:', section.id); // Debug log
    });
    
    // Show the selected section
    const targetSection = document.getElementById(sectionName + '-section') || document.getElementById(sectionName);
    console.log('Target section:', targetSection); // Debug log
    
    if (targetSection) {
        targetSection.classList.remove('hidden');
        currentSection = sectionName;
        console.log('Showing section:', sectionName, 'Element:', targetSection.id); // Debug log
            
            // Update page title
        updatePageTitle(getSectionTitle(sectionName));
        
        // Load section-specific data
        loadSectionData(sectionName);
        
        // Update navigation active state
        updateNavigationActive(sectionName);
    } else {
        console.error('Section not found:', sectionName); // Debug log
    }
}

// Make showSection globally accessible
window.showSection = showSection;

function getSectionTitle(sectionName) {
    const titles = {
        'dashboard': 'Admin Dashboard',
        'pending-teachers': 'Pending Teachers',
        'all-teachers': 'All Teachers',
        'students': 'Student Management',
        'activity-log': 'Activity Log'
    };
    return titles[sectionName] || 'Admin Dashboard';
}

function updateNavigationActive(sectionName) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active', 'bg-indigo-50', 'text-indigo-700');
        item.classList.add('text-gray-700');
    });
    
    // Find and activate the corresponding nav item
    const navItem = document.querySelector(`[href="#${sectionName}"]`);
    if (navItem) {
        navItem.classList.add('active', 'bg-indigo-50', 'text-indigo-700');
        navItem.classList.remove('text-gray-700');
    }
}

function loadSectionData(sectionName) {
    switch (sectionName) {
        case 'dashboard':
            // Dashboard summary is already loaded
            break;
        case 'pending-teachers':
                loadPendingTeachers();
            break;
        case 'all-teachers':
                loadAllTeachers();
            break;
        case 'students':
                loadStudents();
            break;
        case 'activity-log':
                loadActivityLog();
            break;
    }
}

// Updated navigation setup
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const href = this.getAttribute('href');
            const sectionName = href.replace('#', '');
            
            console.log('Navigation clicked:', sectionName); // Debug log
            showSection(sectionName);
        });
    });
}

async function loadDashboardStats() {
    try {
        const response = await fetch('php/admin-stats.php', {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store'
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('pending-teachers-count').textContent = data.stats.pending_teachers || 0;
            document.getElementById('approved-teachers-count').textContent = data.stats.approved_teachers || 0;
            document.getElementById('rejected-teachers-count').textContent = data.stats.rejected_teachers || 0;
            document.getElementById('total-students-count').textContent = data.stats.total_students || 0;
            document.getElementById('pending-count').textContent = data.stats.pending_teachers || 0;
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadPendingTeachers() {
    try {
        const response = await fetch('php/admin-pending-teachers.php', {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store'
        });
        
        const data = await response.json();
        
        if (data.success) {
            pendingTeachers = data.teachers || [];
            displayPendingTeachers(pendingTeachers);
        }
    } catch (error) {
        console.error('Error loading pending teachers:', error);
    }
}

function displayPendingTeachers(teachers) {
    const tableBody = document.getElementById('pending-teachers-table');
    const noTeachersDiv = document.getElementById('no-pending-teachers');
    
    if (teachers.length === 0) {
        tableBody.innerHTML = '';
        noTeachersDiv.classList.remove('hidden');
        return;
    }
    
    noTeachersDiv.classList.add('hidden');
    
    tableBody.innerHTML = teachers.map(teacher => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="h-10 w-10 bg-indigo-500 rounded-full flex items-center justify-center">
                        <span class="text-white font-medium text-sm">${teacher.first_name.charAt(0)}${teacher.last_name.charAt(0)}</span>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${teacher.first_name} ${teacher.last_name}</div>
                        <div class="text-sm text-gray-500">ID: ${teacher.teacher_id}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${teacher.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${teacher.department}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${teacher.subject}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(teacher.created_at)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="viewTeacherDetails(${teacher.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <i class="fas fa-eye"></i> View
                </button>
                <button onclick="approveTeacher(${teacher.id})" class="text-green-600 hover:text-green-900 mr-3">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button onclick="showRejectionModal(${teacher.id})" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-times"></i> Reject
                </button>
            </td>
        </tr>
    `).join('');
}

async function viewTeacherDetails(teacherId) {
    try {
        const response = await fetch(`php/admin-teacher-details.php?id=${teacherId}`, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store'
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentTeacherId = teacherId;
            displayTeacherDetails(data.teacher);
            document.getElementById('teacher-details-modal').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading teacher details:', error);
        Swal.fire('Error', 'Failed to load teacher details', 'error');
    }
}

function displayTeacherDetails(teacher) {
    const content = document.getElementById('teacher-details-content');
    content.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 class="text-lg font-semibold text-gray-900 mb-4">Personal Information</h4>
                <div class="space-y-3">
                    <div>
                        <label class="text-sm font-medium text-gray-500">Full Name</label>
                        <p class="text-gray-900">${teacher.first_name} ${teacher.last_name}</p>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-gray-500">Email</label>
                        <p class="text-gray-900">${teacher.email}</p>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-gray-500">Teacher ID</label>
                        <p class="text-gray-900">${teacher.teacher_id}</p>
                    </div>
                </div>
            </div>
            
            <div>
                <h4 class="text-lg font-semibold text-gray-900 mb-4">Professional Information</h4>
                <div class="space-y-3">
                    <div>
                        <label class="text-sm font-medium text-gray-500">Department</label>
                        <p class="text-gray-900">${teacher.department}</p>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-gray-500">Subject</label>
                        <p class="text-gray-900">${teacher.subject}</p>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-gray-500">Registration Date</label>
                        <p class="text-gray-900">${formatDate(teacher.created_at)}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function closeTeacherDetailsModal() {
    document.getElementById('teacher-details-modal').classList.add('hidden');
    currentTeacherId = null;
}

async function approveTeacher(teacherId = null) {
    const id = teacherId || currentTeacherId;
    if (!id) return;
    
    try {
        const response = await fetch('php/admin-approve-teacher.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ teacher_id: id }),
            credentials: 'same-origin',
            cache: 'no-store'
        });
        
        const data = await response.json();
        
        if (data.success) {
            Swal.fire('Success', 'Teacher account approved successfully!', 'success');
            closeTeacherDetailsModal();
            loadDashboardStats();
            loadPendingTeachers();
            loadAllTeachers();
        } else {
            Swal.fire('Error', data.message || 'Failed to approve teacher', 'error');
        }
    } catch (error) {
        console.error('Error approving teacher:', error);
        Swal.fire('Error', 'An error occurred while approving the teacher', 'error');
    }
}

function showRejectionModal(teacherId) {
    currentTeacherId = teacherId;
    document.getElementById('rejection-modal').classList.remove('hidden');
    document.getElementById('rejection-reason').value = '';
}

function closeRejectionModal() {
    document.getElementById('rejection-modal').classList.add('hidden');
    currentTeacherId = null;
}

async function confirmRejection() {
    const reason = document.getElementById('rejection-reason').value.trim();
    
    if (!reason) {
        Swal.fire('Error', 'Please provide a reason for rejection', 'error');
        return;
    }
    
    try {
        const response = await fetch('php/admin-reject-teacher.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                teacher_id: currentTeacherId,
                reason: reason
            }),
            credentials: 'same-origin',
            cache: 'no-store'
        });
        
        const data = await response.json();
        
        if (data.success) {
            Swal.fire('Success', 'Teacher application rejected', 'success');
            closeRejectionModal();
            loadDashboardStats();
            loadPendingTeachers();
            loadAllTeachers();
        } else {
            Swal.fire('Error', data.message || 'Failed to reject teacher', 'error');
        }
    } catch (error) {
        console.error('Error rejecting teacher:', error);
        Swal.fire('Error', 'An error occurred while rejecting the teacher', 'error');
    }
}

function refreshPendingTeachers() {
    loadPendingTeachers();
    loadDashboardStats();
}

// Comprehensive enrollment debug
async function debugComprehensiveEnrollment() {
    try {
        console.log('Running comprehensive enrollment debug...');
        const response = await fetch('php/debug-comprehensive-enrollment.php', {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store'
        });
        
        const data = await response.json();
        console.log('Comprehensive enrollment data:', data);
        
        if (data.success) {
            let info = `=== COMPREHENSIVE ENROLLMENT DEBUG ===\n\n`;
            info += `Teacher: ${data.teacher.first_name} ${data.teacher.last_name} (ID: ${data.teacher.id})\n`;
            info += `Class: ${data.try_class.class_name} (ID: ${data.try_class.id})\n`;
            info += `Kim: ${data.kim_student.first_name} ${data.kim_student.last_name} (ID: ${data.kim_student.id})\n`;
            info += `Kim Email: ${data.kim_student.email}\n`;
            info += `Kim Student ID: ${data.kim_student.student_id}\n\n`;
            
            info += `=== ENROLLMENT CHECKS ===\n\n`;
            
            // Direct enrollment checks
            info += `1. Direct student_class_enrollments check:\n`;
            info += `   Records: ${data.enrollment_checks.student_class_enrollments_direct.length}\n`;
            data.enrollment_checks.student_class_enrollments_direct.forEach(record => {
                info += `   - Class ID: ${record.class_id}, Student ID: ${record.student_id}\n`;
            });
            
            info += `\n2. Direct class_enrollments check:\n`;
            info += `   Records: ${data.enrollment_checks.class_enrollments_direct.length}\n`;
            data.enrollment_checks.class_enrollments_direct.forEach(record => {
                info += `   - Class ID: ${record.class_id}, Student ID: ${record.student_id}\n`;
            });
            
            // All Kim's enrollments
            info += `\n3. All Kim's student_class_enrollments:\n`;
            info += `   Records: ${data.enrollment_checks.kim_all_student_class_enrollments.length}\n`;
            data.enrollment_checks.kim_all_student_class_enrollments.forEach(record => {
                info += `   - Class ID: ${record.class_id}, Student ID: ${record.student_id}\n`;
            });
            
            info += `\n4. All Kim's class_enrollments:\n`;
            info += `   Records: ${data.enrollment_checks.kim_all_class_enrollments.length}\n`;
            data.enrollment_checks.kim_all_class_enrollments.forEach(record => {
                info += `   - Class ID: ${record.class_id}, Student ID: ${record.student_id}\n`;
            });
            
            // All try class enrollments
            info += `\n5. All try class student_class_enrollments:\n`;
            info += `   Records: ${data.enrollment_checks.try_class_all_student_class_enrollments.length}\n`;
            data.enrollment_checks.try_class_all_student_class_enrollments.forEach(record => {
                info += `   - Class ID: ${record.class_id}, Student ID: ${record.student_id}\n`;
            });
            
            info += `\n6. All try class class_enrollments:\n`;
            info += `   Records: ${data.enrollment_checks.try_class_all_class_enrollments.length}\n`;
            data.enrollment_checks.try_class_all_class_enrollments.forEach(record => {
                info += `   - Class ID: ${record.class_id}, Student ID: ${record.student_id}\n`;
            });
            
            // Join check
            info += `\n7. Kim in try class via JOIN:\n`;
            info += `   Records: ${data.enrollment_checks.kim_try_class_via_join.length}\n`;
            data.enrollment_checks.kim_try_class_via_join.forEach(record => {
                info += `   - Class: ${record.class_name}, Class ID: ${record.class_id}, Student ID: ${record.student_id}\n`;
            });
            
            info += `\n=== AVAILABLE ENROLLMENT TABLES ===\n`;
            data.enrollment_tables.forEach(table => {
                info += `- ${table}\n`;
            });
            
            info += `\n=== ALL TEACHER CLASSES ===\n`;
            if (data.all_teacher_classes) {
                info += `Total classes: ${data.all_teacher_classes.length}\n`;
                data.all_teacher_classes.forEach(cls => {
                    info += `- ID: ${cls.id}, Name: "${cls.class_name}", Teacher ID: ${cls.teacher_id}\n`;
                });
            }
            
            Swal.fire({
                title: 'Comprehensive Enrollment Debug',
                text: info,
                html: `<pre style="text-align: left; font-size: 10px; max-height: 80vh; overflow-y: auto;">${info}</pre>`,
                width: '90%'
            });
        } else {
            Swal.fire('Error', 'Comprehensive enrollment debug failed: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Comprehensive enrollment debug error:', error);
        Swal.fire('Error', 'Comprehensive enrollment debug failed: ' + error.message, 'error');
    }
}

// Make functions globally accessible
window.refreshPendingTeachers = refreshPendingTeachers;
window.viewAllTeachers = viewAllTeachers;
window.viewRejectedTeachers = viewRejectedTeachers;
window.refreshAllTeachers = refreshAllTeachers;
window.refreshStudents = refreshStudents;
window.refreshActivityLog = refreshActivityLog;

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Debug function to check database structure
async function debugDatabase() {
    try {
        console.log('=== DEBUGGING DATABASE ===');
        
        // Check table structure
        const structureResponse = await fetch('php/debug-teachers-table.php', {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store'
        });
        const structureData = await structureResponse.json();
        console.log('Table structure:', structureData);
        console.log('Available columns:', structureData.columns.map(col => col.Field));
        
        // Check actual data
        const dataResponse = await fetch('php/debug-teachers-data.php', {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store'
        });
        const dataData = await dataResponse.json();
        console.log('Actual teacher data:', dataData);
        console.log('Teachers with status details:', dataData.teachers.map(t => ({
            id: t.id,
            name: t.first_name + ' ' + t.last_name,
            status: t.status || t.approval_status,
            all_status_fields: {
                status: t.status,
                approval_status: t.approval_status
            }
        })));
        
        // Show detailed status for each teacher
        dataData.teachers.forEach((teacher, index) => {
            console.log(`Teacher ${index + 1}:`, {
                id: teacher.id,
                name: teacher.first_name + ' ' + teacher.last_name,
                email: teacher.email,
                approval_status: teacher.approval_status,
                status: teacher.status,
                verified: teacher.email_verified
            });
        });
        
        // Check stats
        const statsResponse = await fetch('php/admin-stats.php', {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store'
        });
        const statsData = await statsResponse.json();
        console.log('Dashboard stats:', statsData);
        console.log('Stats breakdown:', {
            pending: statsData.stats.pending_teachers,
            approved: statsData.stats.approved_teachers,
            rejected: statsData.stats.rejected_teachers
        });
        
        console.log('=== END DEBUG ===');
        
    } catch (error) {
        console.error('Debug error:', error);
    }
}

// All Teachers Management Functions
let allTeachers = [];
let currentFilter = 'all'; // 'all', 'approved', 'rejected'

async function loadAllTeachers() {
    try {
        console.log('Loading all teachers...'); // Debug log
        const response = await fetch('php/admin-all-teachers.php', {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store'
        });
        
        const data = await response.json();
        console.log('All teachers response:', data); // Debug log
        
        if (data.success) {
            allTeachers = data.teachers || [];
            console.log('Loaded all teachers:', allTeachers.length); // Debug log
            
            // Show only approved teachers by default
            const approvedTeachers = allTeachers.filter(teacher => {
                const isApproved = teacher.status === 'approved' || teacher.status_text === 'Approved';
                console.log(`Teacher: ${teacher.first_name} ${teacher.last_name} - Status: ${teacher.status}, Status Text: ${teacher.status_text}, Is Approved: ${isApproved}`);
                return isApproved;
            });
            
            console.log('Approved teachers:', approvedTeachers.length); // Debug log
            displayApprovedTeachers(approvedTeachers);
        } else {
            console.error('Failed to load teachers:', data);
            console.error('Error details:', data.debug || 'No debug info');
            Swal.fire('Error', 'Failed to load teachers: ' + (data.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error loading all teachers:', error);
        Swal.fire('Error', 'An error occurred while loading teachers', 'error');
    }
}

function displayApprovedTeachers(teachers) {
    const tableBody = document.getElementById('all-teachers-table');
    const noTeachersDiv = document.getElementById('no-all-teachers');
    
    if (teachers.length === 0) {
        tableBody.innerHTML = '';
        noTeachersDiv.classList.remove('hidden');
        return;
    }
    
    noTeachersDiv.classList.add('hidden');
    
    tableBody.innerHTML = teachers.map(teacher => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                        <span class="text-white font-medium text-sm">${teacher.first_name.charAt(0)}${teacher.last_name.charAt(0)}</span>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${teacher.first_name} ${teacher.last_name}</div>
                        <div class="text-sm text-gray-500">${teacher.email}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${teacher.department}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${teacher.subject}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <i class="fas fa-chalkboard-teacher mr-1"></i>
                        ${teacher.classes_count || 0} Classes
                    </span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <i class="fas fa-graduation-cap mr-1"></i>
                        ${teacher.students_count || 0} Students
                    </span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 w-16 bg-gray-200 rounded-full h-2">
                        <div class="bg-green-600 h-2 rounded-full" style="width: ${teacher.performance_score || 0}%"></div>
                    </div>
                    <span class="ml-2 text-sm text-gray-600">${teacher.performance_score || 0}%</span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="viewTeacherDetails(${teacher.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <i class="fas fa-eye"></i> View
                </button>
                <button onclick="manageTeacherClasses(${teacher.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-chalkboard-teacher"></i> Classes
                </button>
                <button onclick="viewStudentProgress(${teacher.id})" class="text-green-600 hover:text-green-900">
                    <i class="fas fa-chart-line"></i> Progress
                </button>
            </td>
        </tr>
    `).join('');
}

function viewAllTeachers() {
    console.log('Viewing all teachers:', allTeachers.length); // Debug log
    displayAllTeachers(allTeachers);
    updatePageTitle('All Teachers');
}

function viewRejectedTeachers() {
    console.log('Viewing rejected teachers...'); // Debug log
    const rejectedTeachers = allTeachers.filter(teacher => {
        const isRejected = teacher.status === 'rejected' || teacher.status_text === 'Rejected';
        console.log(`Teacher: ${teacher.first_name} ${teacher.last_name} - Status: ${teacher.status}, Is Rejected: ${isRejected}`);
        return isRejected;
    });
    console.log('Rejected teachers found:', rejectedTeachers.length); // Debug log
    displayAllTeachers(rejectedTeachers);
    updatePageTitle('Rejected Teachers');
}

async function viewApprovedTeachers() {
    currentFilter = 'approved';
    const approvedTeachers = allTeachers.filter(teacher => {
        return teacher.status === 'approved' || teacher.status_text === 'Approved';
    });
    displayAllTeachers(approvedTeachers);
    updatePageTitle('Approved Teachers');
}

function refreshAllTeachers() {
    loadAllTeachers();
    loadDashboardStats();
    currentFilter = 'all';
    updatePageTitle('All Teachers');
}

function displayAllTeachers(teachers) {
    const tableBody = document.getElementById('all-teachers-table');
    const noTeachersDiv = document.getElementById('no-all-teachers');
    
    console.log('Displaying teachers:', teachers.length); // Debug log
    
    if (teachers.length === 0) {
        tableBody.innerHTML = '';
        noTeachersDiv.classList.remove('hidden');
        return;
    }
    
    noTeachersDiv.classList.add('hidden');
    
    tableBody.innerHTML = teachers.map(teacher => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="h-10 w-10 ${teacher.status === 'approved' ? 'bg-green-500' : teacher.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'} rounded-full flex items-center justify-center">
                        <span class="text-white font-medium text-sm">${teacher.first_name.charAt(0)}${teacher.last_name.charAt(0)}</span>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${teacher.first_name} ${teacher.last_name}</div>
                        <div class="text-sm text-gray-500">${teacher.email}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${teacher.department}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${teacher.subject}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <i class="fas fa-chalkboard-teacher mr-1"></i>
                        ${teacher.classes_count || 0} Classes
                    </span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <i class="fas fa-graduation-cap mr-1"></i>
                        ${teacher.students_count || 0} Students
                    </span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 w-16 bg-gray-200 rounded-full h-2">
                        <div class="bg-green-600 h-2 rounded-full" style="width: ${teacher.performance_score || 0}%"></div>
                    </div>
                    <span class="ml-2 text-sm text-gray-600">${teacher.performance_score || 0}%</span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="viewTeacherDetails(${teacher.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <i class="fas fa-eye"></i> View
                </button>
                ${teacher.status === 'approved' ? `
                    <button onclick="manageTeacherClasses(${teacher.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                        <i class="fas fa-chalkboard-teacher"></i> Classes
                    </button>
                    <button onclick="viewStudentProgress(${teacher.id})" class="text-green-600 hover:text-green-900">
                        <i class="fas fa-chart-line"></i> Progress
                    </button>
                ` : teacher.status === 'pending' ? `
                    <button onclick="approveTeacher(${teacher.id})" class="text-green-600 hover:text-green-900 mr-3">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button onclick="showRejectionModal(${teacher.id})" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-times"></i> Reject
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'approved':
            return 'bg-green-100 text-green-800';
        case 'rejected':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function updatePageTitle(title) {
    document.getElementById('page-title').textContent = title;
}

// Placeholder functions for other sections
async function loadApprovedTeachers() {
    await viewApprovedTeachers();
}

async function loadRejectedTeachers() {
    await viewRejectedTeachers();
}

async function loadStudents() {
    // Implementation for students
    console.log('Loading students...');
    // Student management features coming soon
}

async function loadActivityLog() {
    // Implementation for activity log
    console.log('Loading activity log...');
    // Activity log features coming soon
}

function refreshStudents() {
    loadStudents();
}

function refreshActivityLog() {
    loadActivityLog();
}

// Class Management Functions

async function manageTeacherClasses(teacherId) {
    currentTeacherId = teacherId;
    try {
        // Load teacher classes and students
        const response = await fetch(`php/admin-teacher-classes.php?teacher_id=${teacherId}`, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store'
        });
        
        const data = await response.json();
        
        console.log('Class management data:', data);
        if (data.success) {
            console.log('Teacher:', data.teacher);
            console.log('Classes:', data.classes);
            console.log('Students:', data.students);
            console.log('Debug info:', data.debug);
            displayClassManagement(data.teacher, data.classes, data.students);
            document.getElementById('class-management-modal').classList.remove('hidden');
        } else {
            Swal.fire('Error', 'Failed to load teacher classes', 'error');
        }
    } catch (error) {
        console.error('Error loading teacher classes:', error);
        Swal.fire('Error', 'An error occurred while loading classes', 'error');
    }
}

function displayClassManagement(teacher, classes, students) {
    const content = document.getElementById('class-management-content');
    
    // Separate enrolled students from potential students
    const enrolledStudents = students.filter(s => s.enrollment_date);
    const potentialStudents = students.filter(s => !s.enrollment_date);
    
    content.innerHTML = `
        <div class="mb-6">
            <h4 class="text-lg font-semibold text-gray-900 mb-2">${teacher.first_name} ${teacher.last_name}</h4>
            <p class="text-gray-600">${teacher.department} - ${teacher.subject}</p>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Classes Section -->
            <div>
                <h5 class="text-md font-semibold text-gray-900 mb-4">Classes Created</h5>
                <div class="space-y-3">
                    ${classes.length > 0 ? classes.map(cls => `
                        <div class="border border-gray-200 rounded-lg p-4">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h6 class="font-medium text-gray-900">${cls.class_name || 'Unnamed Class'}</h6>
                                    <p class="text-sm text-gray-600">Class ID: ${cls.id}</p>
                                    ${cls.grade_level ? `<p class="text-sm text-gray-500">Grade: ${cls.grade_level}</p>` : ''}
                                    ${cls.strand ? `<p class="text-sm text-gray-500">Strand: ${cls.strand}</p>` : ''}
                                </div>
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    ${enrolledStudents.filter(s => s.class_id == cls.id).length} Enrolled
                                </span>
                            </div>
                            <div class="mt-3">
                                <button onclick="viewClassStudents(${cls.id})" class="text-blue-600 hover:text-blue-800 text-sm mr-3">
                                    <i class="fas fa-users mr-1"></i>View Enrolled Students
                                </button>
                                <button onclick="manageClassEnrollment(${cls.id})" class="text-green-600 hover:text-green-800 text-sm">
                                    <i class="fas fa-user-plus mr-1"></i>Manage Enrollment
                                </button>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="text-center py-8 text-gray-500">
                            <i class="fas fa-chalkboard-teacher text-4xl mb-4"></i>
                            <p class="text-lg">No classes created yet</p>
                            <p class="text-sm">This teacher hasn't created any classes</p>
                        </div>
                    `}
                </div>
            </div>
            
            <!-- Students Section -->
            <div>
                <h5 class="text-md font-semibold text-gray-900 mb-4">Students</h5>
                
                <!-- Enrolled Students -->
                ${enrolledStudents.length > 0 ? `
                    <div class="mb-4">
                        <h6 class="text-sm font-medium text-green-700 mb-2">Enrolled Students (${enrolledStudents.length})</h6>
                        <div class="space-y-2">
                            ${enrolledStudents.slice(0, 3).map(student => `
                                <div class="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                                    <div class="flex items-center">
                                        <div class="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                                            <span class="text-white text-xs font-medium">${student.first_name.charAt(0)}${student.last_name.charAt(0)}</span>
                                        </div>
                                        <div class="ml-2">
                                            <p class="text-sm font-medium text-gray-900">${student.first_name} ${student.last_name}</p>
                                            <p class="text-xs text-gray-500">${student.student_id || student.email}</p>
                                        </div>
                                    </div>
                                    <span class="text-xs text-green-600">Enrolled</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Potential Students -->
                ${potentialStudents.length > 0 ? `
                    <div>
                        <h6 class="text-sm font-medium text-gray-700 mb-2">Available Students (${potentialStudents.length})</h6>
                        <div class="space-y-2">
                            ${potentialStudents.slice(0, 3).map(student => `
                                <div class="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <div class="flex items-center">
                                        <div class="h-6 w-6 bg-gray-400 rounded-full flex items-center justify-center">
                                            <span class="text-white text-xs font-medium">${student.first_name.charAt(0)}${student.last_name.charAt(0)}</span>
                                        </div>
                                        <div class="ml-2">
                                            <p class="text-sm font-medium text-gray-900">${student.first_name} ${student.last_name}</p>
                                            <p class="text-xs text-gray-500">${student.student_id || student.email}</p>
                                        </div>
                                    </div>
                                    <span class="text-xs text-gray-500">Not Enrolled</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-graduation-cap text-4xl mb-4"></i>
                        <p class="text-lg">No students found</p>
                        <p class="text-sm">No students are available for enrollment</p>
                    </div>
                `}
                
                ${students.length > 6 ? `
                    <div class="text-center mt-4">
                        <button onclick="viewAllStudents(${teacher.id})" class="text-blue-600 hover:text-blue-800 text-sm">
                            View all ${students.length} students
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Student Progress Functions
async function viewStudentProgress(teacherId) {
    currentTeacherId = teacherId;
    try {
        const response = await fetch(`php/admin-student-progress.php?teacher_id=${teacherId}`, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store'
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayStudentProgress(data.teacher, data.students, data.analytics);
            document.getElementById('student-progress-modal').classList.remove('hidden');
        } else {
            Swal.fire('Error', 'Failed to load student progress', 'error');
        }
    } catch (error) {
        console.error('Error loading student progress:', error);
        Swal.fire('Error', 'An error occurred while loading progress', 'error');
    }
}

function displayStudentProgress(teacher, students, analytics) {
    const content = document.getElementById('student-progress-content');
    content.innerHTML = `
        <div class="mb-6">
            <h4 class="text-lg font-semibold text-gray-900 mb-2">Student Progress & Analytics</h4>
            <p class="text-gray-600">${teacher.first_name} ${teacher.last_name} - ${teacher.subject}</p>
        </div>
        
        <!-- Analytics Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-blue-50 p-4 rounded-lg">
                <div class="flex items-center">
                    <i class="fas fa-graduation-cap text-blue-600 text-2xl mr-3"></i>
                    <div>
                        <p class="text-sm text-gray-600">Total Students</p>
                        <p class="text-xl font-bold text-gray-900">${analytics.total_students || 0}</p>
                    </div>
                </div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
                <div class="flex items-center">
                    <i class="fas fa-chart-line text-green-600 text-2xl mr-3"></i>
                    <div>
                        <p class="text-sm text-gray-600">Avg Progress</p>
                        <p class="text-xl font-bold text-gray-900">${analytics.avg_progress || 0}%</p>
                    </div>
                </div>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg">
                <div class="flex items-center">
                    <i class="fas fa-trophy text-purple-600 text-2xl mr-3"></i>
                    <div>
                        <p class="text-sm text-gray-600">Achievements</p>
                        <p class="text-xl font-bold text-gray-900">${analytics.total_achievements || 0}</p>
                    </div>
                </div>
            </div>
            <div class="bg-yellow-50 p-4 rounded-lg">
                <div class="flex items-center">
                    <i class="fas fa-star text-yellow-600 text-2xl mr-3"></i>
                    <div>
                        <p class="text-sm text-gray-600">Avg Quiz Score</p>
                        <p class="text-xl font-bold text-gray-900">${analytics.avg_quiz_score || 0}%</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Students Table -->
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz Scores</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Achievements</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ranking</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${students.map(student => `
                        <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <div class="h-8 w-8 bg-purple-500 rounded-full flex items-center justify-center">
                                        <span class="text-white text-xs font-medium">${student.first_name.charAt(0)}${student.last_name.charAt(0)}</span>
                                    </div>
                                    <div class="ml-3">
                                        <div class="text-sm font-medium text-gray-900">${student.first_name} ${student.last_name}</div>
                                        <div class="text-sm text-gray-500">${student.student_id}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0 w-16 bg-gray-200 rounded-full h-2">
                                        <div class="bg-green-600 h-2 rounded-full" style="width: ${student.progress_percentage || 0}%"></div>
                                    </div>
                                    <span class="ml-2 text-sm text-gray-600">${student.progress_percentage || 0}%</span>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreBadgeClass(student.avg_quiz_score)}">
                                    ${student.avg_quiz_score || 0}%
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <i class="fas fa-trophy mr-1"></i>
                                    ${student.achievements_count || 0}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRankingBadgeClass(student.ranking)}">
                                    #${student.ranking || 'N/A'}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button onclick="viewStudentDetails(${student.id})" class="text-indigo-600 hover:text-indigo-900">
                                    <i class="fas fa-eye"></i> Details
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Helper functions
function getScoreBadgeClass(score) {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 80) return 'bg-blue-100 text-blue-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
}

function getRankingBadgeClass(ranking) {
    if (ranking <= 3) return 'bg-yellow-100 text-yellow-800';
    if (ranking <= 10) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
}

// Modal functions
function closeClassManagementModal() {
    document.getElementById('class-management-modal').classList.add('hidden');
    currentTeacherId = null;
}

function closeStudentProgressModal() {
    document.getElementById('student-progress-modal').classList.add('hidden');
    currentTeacherId = null;
}

function viewClassStudents(classId) {
    // Implementation for viewing students in a specific class
    console.log('Viewing students for class:', classId);
}

function viewAllStudents(teacherId) {
    // Implementation for viewing all students
    console.log('Viewing all students for teacher:', teacherId);
}

function viewStudentDetails(studentId) {
    // Implementation for viewing individual student details
    console.log('Viewing student details:', studentId);
}

// Enrollment management functions
function manageClassEnrollment(classId) {
    console.log('Managing enrollment for class:', classId);
    Swal.fire({
        title: 'Enrollment Management',
        text: 'Enrollment management feature coming soon!',
        icon: 'info',
        confirmButtonText: 'OK'
    });
}

function viewClassStudents(classId) {
    console.log('Viewing students for class:', classId);
    
    // Get the current teacher and class data
    const teacherId = currentTeacherId;
    if (!teacherId) {
        Swal.fire('Error', 'No teacher selected', 'error');
        return;
    }
    
    // Fetch class students data
    fetch(`php/admin-teacher-classes.php?teacher_id=${teacherId}`, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store'
    })
    .then(response => response.json())
    .then(data => {
        console.log('ViewClassStudents - Raw data:', data);
        console.log('ViewClassStudents - Looking for classId:', classId, 'Type:', typeof classId);
        console.log('ViewClassStudents - All students:', data.students);
        
        // Debug: Check each student's class_id
        data.students.forEach((student, index) => {
            console.log(`Student ${index}: class_id = ${student.class_id} (${typeof student.class_id}), enrollment_date = ${student.enrollment_date}`);
        });
        
        if (data.success) {
            // Filter students for the specific class (handle both string and number)
            const classStudents = data.students.filter(student => {
                const matches = student.class_id == classId || 
                               student.class_id === classId || 
                               parseInt(student.class_id) === parseInt(classId);
                console.log(`Student ${student.first_name} ${student.last_name}: class_id=${student.class_id}, classId=${classId}, matches=${matches}`);
                return matches;
            });
            console.log('ViewClassStudents - Students for class', classId, ':', classStudents);
            
            const enrolledStudents = classStudents.filter(student => student.enrollment_date);
            console.log('ViewClassStudents - Enrolled students:', enrolledStudents);
            
            if (enrolledStudents.length > 0) {
                let studentList = `Enrolled Students in Class ${classId}:\n\n`;
                enrolledStudents.forEach(student => {
                    studentList += `• ${student.first_name} ${student.last_name}\n`;
                    studentList += `  Email: ${student.email}\n`;
                    studentList += `  Student ID: ${student.student_id || 'N/A'}\n`;
                    studentList += `  Enrolled: ${student.enrollment_date || 'Unknown'}\n\n`;
                });
                
                Swal.fire({
                    title: 'Enrolled Students',
                    text: studentList,
                    html: `<pre style="text-align: left; font-size: 12px;">${studentList}</pre>`,
                    width: '60%'
                });
            } else {
                // Fallback: Show all enrolled students for this teacher
                const allEnrolledStudents = data.students.filter(student => student.enrollment_date);
                console.log('ViewClassStudents - Fallback: All enrolled students:', allEnrolledStudents);
                
                if (allEnrolledStudents.length > 0) {
                    let studentList = `All Enrolled Students for Teacher:\n\n`;
                    allEnrolledStudents.forEach(student => {
                        studentList += `• ${student.first_name} ${student.last_name}\n`;
                        studentList += `  Email: ${student.email}\n`;
                        studentList += `  Student ID: ${student.student_id || 'N/A'}\n`;
                        studentList += `  Class ID: ${student.class_id || 'N/A'}\n`;
                        studentList += `  Enrolled: ${student.enrollment_date || 'Unknown'}\n\n`;
                    });
                    
                    Swal.fire({
                        title: 'All Enrolled Students',
                        text: studentList,
                        html: `<pre style="text-align: left; font-size: 12px;">${studentList}</pre>`,
                        width: '60%'
                    });
                } else {
                    Swal.fire('Info', 'No students enrolled in this class', 'info');
                }
            }
        } else {
            Swal.fire('Error', 'Failed to load class data', 'error');
        }
    })
    .catch(error => {
        console.error('Error loading class students:', error);
        Swal.fire('Error', 'An error occurred while loading students', 'error');
    });
}

// Make modal functions globally accessible
window.closeClassManagementModal = closeClassManagementModal;
window.closeStudentProgressModal = closeStudentProgressModal;
window.viewClassStudents = viewClassStudents;
window.viewAllStudents = viewAllStudents;
window.viewStudentDetails = viewStudentDetails;
window.manageClassEnrollment = manageClassEnrollment;
