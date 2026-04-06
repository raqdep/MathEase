// Admin Dashboard JavaScript
let currentTeacherId = null;
let pendingTeachers = [];

function escapeHtml(s) {
    if (s == null || s === undefined) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', async function() {
    // Check admin authentication (async)
    const isAuthenticated = await checkAdminAuth();
    if (!isAuthenticated) {
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
    
    const nameEl = document.getElementById('admin-name');
    if (nameEl) nameEl.textContent = adminName || 'Admin User';
    const roleEl = document.getElementById('admin-role');
    if (roleEl) roleEl.textContent = adminRole || 'Super Admin';
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
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => {
        section.classList.add('hidden');
    });

    const targetSection = document.getElementById(sectionName + '-section') || document.getElementById(sectionName);

    if (targetSection) {
        targetSection.classList.remove('hidden');
        currentSection = sectionName;
        updatePageTitle(getSectionTitle(sectionName));
        loadSectionData(sectionName);
        updateNavigationActive(sectionName);
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
        'activity-log': 'Activity Log',
        'teacher-archive': 'Archived Teachers',
        'system-update': 'System maintenance'
    };
    return titles[sectionName] || 'Admin Dashboard';
}

function updateNavigationActive(sectionName) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const navItem = document.querySelector(`[href="#${sectionName}"]`);
    if (navItem) {
        navItem.classList.add('active');
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
        case 'teacher-archive':
                loadArchivedTeachers();
            break;
        case 'students':
                loadStudents();
            break;
        case 'activity-log':
                loadActivityLog();
            break;
        case 'system-update':
                loadMaintenancePanel();
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
            const pendingCount = data.stats.pending_teachers || 0;
            const verifiedCount = data.stats.pending_verified_teachers || 0;
            const unverifiedCount = pendingCount - verifiedCount;
            
            document.getElementById('pending-teachers-count').textContent = pendingCount;
            document.getElementById('approved-teachers-count').textContent = data.stats.approved_teachers || 0;
            document.getElementById('rejected-teachers-count').textContent = data.stats.rejected_teachers || 0;
            document.getElementById('total-students-count').textContent = data.stats.total_students || 0;
            document.getElementById('pending-count').textContent = pendingCount;
            
            // Update verification info
            const verifiedInfo = document.getElementById('pending-verified-info');
            if (verifiedInfo) {
                if (pendingCount === 0) {
                    verifiedInfo.textContent = 'No pending teachers';
                } else if (unverifiedCount > 0) {
                    verifiedInfo.innerHTML = `<span class="text-yellow-600"><i class="fas fa-exclamation-circle"></i> ${unverifiedCount} need email verification</span>`;
                } else {
                    verifiedInfo.innerHTML = `<span class="text-green-600"><i class="fas fa-check-circle"></i> All verified</span>`;
                }
            }
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
    
    tableBody.innerHTML = teachers.map(teacher => {
        const isEmailVerified = teacher.email_verified === 1 || teacher.is_email_verified === 1;
        const emailStatusBadge = isEmailVerified
            ? '<span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"><i class="fas fa-check-circle mr-1"></i>Email verified</span>'
            : '<span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200"><i class="fas fa-exclamation-circle mr-1"></i>Email not verified</span>';
        const approveTitle = isEmailVerified
            ? 'Approve teacher account'
            : 'Approve (email not verified — you can still approve)';

        return `
        <tr class="hover:bg-slate-50 border-b border-slate-100 ${!isEmailVerified ? 'bg-amber-50/40' : ''}">
            <td class="px-4 py-3 whitespace-nowrap align-top">
                <div class="flex items-center">
                    <div class="h-10 w-10 ${isEmailVerified ? 'bg-slate-700' : 'bg-amber-600'} rounded-full flex items-center justify-center flex-shrink-0">
                        <span class="text-white font-medium text-sm">${escapeHtml(String(teacher.first_name || '').charAt(0))}${escapeHtml(String(teacher.last_name || '').charAt(0))}</span>
                    </div>
                    <div class="ml-3 min-w-0">
                        <div class="text-sm font-semibold text-slate-900">${escapeHtml(teacher.first_name)} ${escapeHtml(teacher.last_name)}</div>
                        ${teacher.teacher_id ? `<div class="text-xs text-slate-500">ID: ${escapeHtml(String(teacher.teacher_id))}</div>` : ''}
                    </div>
                </div>
            </td>
            <td class="px-4 py-3 whitespace-nowrap align-top">
                <div class="text-sm text-slate-800">${escapeHtml(teacher.email)}</div>
                <div class="mt-1">${emailStatusBadge}</div>
            </td>
            <td class="px-4 py-3 text-sm text-slate-700 align-top">${escapeHtml(teacher.department || '—')}</td>
            <td class="px-4 py-3 text-sm text-slate-700 align-top">${escapeHtml(teacher.subject || '—')}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-600 align-top">${formatDate(teacher.created_at)}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-right align-top">
                <button type="button" onclick="viewTeacherDetails(${teacher.id})" class="inline-flex items-center px-2 py-1 rounded text-indigo-700 hover:bg-indigo-50 font-medium" title="View details">
                    <i class="fas fa-eye mr-1"></i> View
                </button>
                <button type="button" onclick="approveTeacher(${teacher.id})" class="inline-flex items-center px-2 py-1 rounded text-emerald-700 hover:bg-emerald-50 font-medium ml-1" title="${approveTitle}">
                    <i class="fas fa-check mr-1"></i> Approve
                </button>
                <button type="button" onclick="showRejectionModal(${teacher.id})" class="inline-flex items-center px-2 py-1 rounded text-red-700 hover:bg-red-50 font-medium ml-1" title="Reject application">
                    <i class="fas fa-times mr-1"></i> Reject
                </button>
            </td>
        </tr>
    `;
    }).join('');
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
            viewTeacherActivity(teacherId);
        }
    } catch (error) {
        console.error('Error loading teacher details:', error);
        Swal.fire('Error', 'Failed to load teacher details', 'error');
    }
}

function displayTeacherDetails(teacher) {
    const content = document.getElementById('teacher-details-content');
    content.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div class="flex items-start gap-4">
                <div class="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
                    <span class="text-white font-semibold">${escapeHtml(String(teacher.first_name || '').charAt(0))}${escapeHtml(String(teacher.last_name || '').charAt(0))}</span>
                </div>
                <div class="min-w-0">
                    <h4 class="text-lg font-semibold text-slate-900 truncate">${escapeHtml(teacher.first_name)} ${escapeHtml(teacher.last_name)}</h4>
                    <p class="text-sm text-slate-600 truncate">${escapeHtml(teacher.email || '—')}</p>
                    <div class="mt-2 flex flex-wrap gap-2">
                        <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold border ${
                            teacher.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            teacher.status === 'rejected' ? 'bg-red-50 text-red-800 border-red-200' :
                            'bg-amber-50 text-amber-900 border-amber-200'
                        }">
                            <i class="fas ${teacher.status === 'approved' ? 'fa-check-circle' : teacher.status === 'rejected' ? 'fa-times-circle' : 'fa-hourglass-half'} mr-1"></i>
                            ${escapeHtml(teacher.status || 'pending')}
                        </span>
                        ${teacher.teacher_id ? `
                            <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                <i class="fas fa-id-badge mr-1 text-slate-500"></i>
                                ID: ${escapeHtml(String(teacher.teacher_id))}
                            </span>
                        ` : ''}
                        <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                            <i class="fas fa-calendar-alt mr-1 text-slate-500"></i>
                            Registered: ${escapeHtml(formatDate(teacher.created_at))}
                        </span>
                    </div>
                </div>
            </div>

            <div class="flex gap-2">
                <button type="button" onclick="viewTeacherActivity(${teacher.id})" class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors" title="Reload audit trail from server">
                    <i class="fas fa-rotate mr-2"></i>
                    Refresh audit trail
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="border border-slate-200 rounded-xl p-4 bg-white">
                <div class="flex items-center gap-2 mb-3">
                    <i class="fas fa-user text-indigo-600"></i>
                    <h5 class="text-sm font-semibold text-slate-900">Personal</h5>
                </div>
                <dl class="space-y-3">
                    <div>
                        <dt class="text-xs font-medium text-slate-500">Full name</dt>
                        <dd class="text-sm text-slate-900">${escapeHtml(teacher.first_name)} ${escapeHtml(teacher.last_name)}</dd>
                    </div>
                    <div>
                        <dt class="text-xs font-medium text-slate-500">Email</dt>
                        <dd class="text-sm text-slate-900 break-all">${escapeHtml(teacher.email || '—')}</dd>
                    </div>
                </dl>
            </div>

            <div class="border border-slate-200 rounded-xl p-4 bg-white">
                <div class="flex items-center gap-2 mb-3">
                    <i class="fas fa-briefcase text-indigo-600"></i>
                    <h5 class="text-sm font-semibold text-slate-900">Professional</h5>
                </div>
                <dl class="space-y-3">
                    <div>
                        <dt class="text-xs font-medium text-slate-500">Department</dt>
                        <dd class="text-sm text-slate-900">${escapeHtml(teacher.department || '—')}</dd>
                    </div>
                    <div>
                        <dt class="text-xs font-medium text-slate-500">Subject</dt>
                        <dd class="text-sm text-slate-900">${escapeHtml(teacher.subject || '—')}</dd>
                    </div>
                </dl>
            </div>
        </div>
        <div id="teacher-activity-section" class="mt-8 pt-6 border-t border-slate-200">
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div class="flex items-start gap-3">
                    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200/80">
                        <i class="fas fa-clipboard-list"></i>
                    </span>
                    <div>
                        <h4 class="text-base font-bold text-slate-900">Audit trail</h4>
                        <p class="text-xs text-slate-500 mt-0.5 max-w-xl">Chronological record: sign-in/out, class and enrollment actions, lessons (create, publish, view), topic access, quiz settings, and admin events.</p>
                    </div>
                </div>
            </div>
            <div id="teacher-activity-content" class="space-y-2">
                <div class="text-center py-8 text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50/80">
                    <i class="fas fa-spinner fa-spin text-2xl mb-2 text-indigo-500"></i>
                    <p class="text-sm font-medium">Loading audit trail…</p>
                </div>
            </div>
        </div>
    `;
}

/** Last payload from admin-teacher-activity.php for filter re-renders */
let __teacherAuditCache = null;
let __teacherAuditFilter = 'all';

function teacherAuditActionMeta(action) {
    const a = String(action || '').toLowerCase();
    const map = {
        login: { label: 'Signed in', icon: 'fa-right-to-bracket', color: 'indigo', known: true },
        logout: { label: 'Signed out', icon: 'fa-right-from-bracket', color: 'slate', known: true },
        email_verified: { label: 'Email verified', icon: 'fa-envelope-circle-check', color: 'emerald', known: true },
        account_approved: { label: 'Account approved (admin)', icon: 'fa-user-check', color: 'emerald', known: true },
        account_archived: { label: 'Account archived (admin)', icon: 'fa-box-archive', color: 'red', known: true },
        account_restored: { label: 'Account restored (admin)', icon: 'fa-rotate-left', color: 'emerald', known: true },
        class_created: { label: 'Class created', icon: 'fa-chalkboard', color: 'violet', known: true },
        class_removed: { label: 'Class removed', icon: 'fa-chalkboard-user-slash', color: 'red', known: true },
        lesson_created: { label: 'Lesson created', icon: 'fa-file-lines', color: 'violet', known: true },
        lesson_viewed: { label: 'Lesson opened (editor)', icon: 'fa-eye', color: 'indigo', known: true },
        lesson_published: { label: 'Lesson published', icon: 'fa-upload', color: 'emerald', known: true },
        lesson_unpublished: { label: 'Lesson unpublished', icon: 'fa-eye-slash', color: 'amber', known: true },
        lesson_deleted: { label: 'Lesson deleted', icon: 'fa-trash-can', color: 'red', known: true },
        topic_opened: { label: 'Topic opened for class', icon: 'fa-unlock', color: 'emerald', known: true },
        topic_closed: { label: 'Topic closed for class', icon: 'fa-lock', color: 'amber', known: true },
        quiz_opened: { label: 'Quiz opened', icon: 'fa-circle-play', color: 'emerald', known: true },
        quiz_closed: { label: 'Quiz closed', icon: 'fa-circle-xmark', color: 'amber', known: true },
        quiz_settings_saved: { label: 'Quiz deadline / settings updated', icon: 'fa-sliders', color: 'indigo', known: true },
        student_enrollment_approved: { label: 'Student enrollment approved', icon: 'fa-user-check', color: 'emerald', known: true },
        student_enrollment_rejected: { label: 'Student enrollment rejected', icon: 'fa-user-xmark', color: 'red', known: true }
    };
    if (map[a]) return map[a];
    return {
        label: a ? a.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'Activity',
        icon: 'fa-circle',
        color: 'slate',
        known: false
    };
}

function teacherAuditCategory(action) {
    const a = String(action || '').toLowerCase();
    if (['login', 'logout', 'email_verified'].includes(a)) return 'access';
    if (a.startsWith('account_')) return 'admin';
    if (a.startsWith('class_') || a.includes('enrollment')) return 'classes';
    if (a.startsWith('lesson_') || a.startsWith('topic_')) return 'lessons';
    if (a.startsWith('quiz_')) return 'quizzes';
    return 'other';
}

function teacherAuditColorClasses(c) {
    switch (c) {
        case 'emerald':
            return { badge: 'bg-emerald-50 border-emerald-100 text-emerald-700', icon: 'bg-emerald-50 border-emerald-100 text-emerald-700' };
        case 'violet':
            return { badge: 'bg-violet-50 border-violet-100 text-violet-700', icon: 'bg-violet-50 border-violet-100 text-violet-700' };
        case 'red':
            return { badge: 'bg-red-50 border-red-100 text-red-700', icon: 'bg-red-50 border-red-100 text-red-700' };
        case 'indigo':
            return { badge: 'bg-indigo-50 border-indigo-100 text-indigo-700', icon: 'bg-indigo-50 border-indigo-100 text-indigo-700' };
        case 'amber':
            return { badge: 'bg-amber-50 border-amber-100 text-amber-800', icon: 'bg-amber-50 border-amber-100 text-amber-800' };
        default:
            return { badge: 'bg-slate-50 border-slate-200 text-slate-700', icon: 'bg-slate-50 border-slate-200 text-slate-700' };
    }
}

function teacherAuditStripColor(meta) {
    if (meta.color === 'emerald') return 'bg-emerald-500';
    if (meta.color === 'red') return 'bg-red-500';
    if (meta.color === 'violet') return 'bg-violet-500';
    if (meta.color === 'amber') return 'bg-amber-500';
    if (meta.color === 'indigo') return 'bg-indigo-500';
    return 'bg-slate-400';
}

function formatTeacherAuditDayLabel(isoOrSql) {
    const d = new Date(isoOrSql);
    if (Number.isNaN(d.getTime())) return 'Date unknown';
    const today = new Date();
    const yest = new Date(today);
    yest.setDate(yest.getDate() - 1);
    const sameDay = (x, y) =>
        x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
    if (sameDay(d, today)) return 'Today';
    if (sameDay(d, yest)) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function setTeacherAuditFilter(filter) {
    __teacherAuditFilter = filter;
    if (__teacherAuditCache) {
        renderTeacherAuditTrail(__teacherAuditCache);
    }
}

async function viewTeacherActivity(teacherId) {
    const activityContent = document.getElementById('teacher-activity-content');

    if (!activityContent) {
        Swal.fire('Error', 'Activity section not found', 'error');
        return;
    }

    activityContent.innerHTML = `
        <div class="text-center py-8 text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50/80">
            <i class="fas fa-spinner fa-spin text-2xl mb-2 text-indigo-500"></i>
            <p class="text-sm font-medium">Loading audit trail…</p>
        </div>
    `;

    try {
        const response = await fetch(`php/admin-teacher-activity.php?teacher_id=${teacherId}`, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store'
        });

        const data = await response.json();

        if (data.success) {
            __teacherAuditCache = data;
            __teacherAuditFilter = 'all';
            renderTeacherAuditTrail(data);
        } else {
            throw new Error(data.message || 'Failed to load activity');
        }
    } catch (error) {
        console.error('Error loading teacher activity:', error);
        activityContent.innerHTML = `
            <div class="text-center py-8 text-red-600 border border-red-100 rounded-xl bg-red-50/80">
                <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
                <p class="text-sm font-medium">Could not load audit trail</p>
                <p class="text-xs mt-1 text-red-700/90">${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}

function displayTeacherActivity(data) {
    __teacherAuditCache = data;
    renderTeacherAuditTrail(data);
}

function renderTeacherAuditTrail(data) {
    const activityContent = document.getElementById('teacher-activity-content');
    if (!activityContent) return;

    const filter = __teacherAuditFilter || 'all';
    const allActivities = Array.isArray(data.activities) ? data.activities : [];

    const filterPills = [
        { id: 'all', label: 'All events' },
        { id: 'access', label: 'Sign-in & email' },
        { id: 'admin', label: 'Admin / account' },
        { id: 'classes', label: 'Classes & enrollments' },
        { id: 'lessons', label: 'Lessons & topics' },
        { id: 'quizzes', label: 'Quizzes' },
        { id: 'other', label: 'Other' }
    ];

    const matchesFilter = (activity) => {
        if (filter === 'all') return true;
        return teacherAuditCategory(activity.action) === filter;
    };

    const activities = allActivities.filter(matchesFilter);

    if (!allActivities.length) {
        activityContent.innerHTML = `
            <div class="text-center py-12 text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                <i class="fas fa-clipboard-list text-3xl mb-3 text-slate-400"></i>
                <p class="font-semibold text-slate-800">No audit events yet</p>
                <p class="text-sm mt-1 max-w-sm mx-auto">When this teacher uses the portal (login, classes, lessons, quizzes), events will appear here.</p>
            </div>
        `;
        return;
    }

    const statsSorted = [...(data.statistics || [])].sort((a, b) => (b.count || 0) - (a.count || 0));

    let html = `
        <div class="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Filter audit trail">
            ${filterPills
                .map(
                    (p) => `
                <button type="button" role="tab" aria-selected="${filter === p.id ? 'true' : 'false'}"
                    onclick="setTeacherAuditFilter('${p.id}')"
                    class="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        filter === p.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-800'
                    }">
                    ${escapeHtml(p.label)}
                </button>
            `
                )
                .join('')}
        </div>
        <p class="text-xs text-slate-500 mb-4">${filter === 'all' ? `Showing all <strong>${allActivities.length}</strong> events.` : `Showing <strong>${activities.length}</strong> of <strong>${allActivities.length}</strong> events (filtered).`} Summary below uses the full history.</p>

        <div class="mb-5 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50/50 p-4 shadow-sm">
            <div class="flex items-center gap-2 mb-3">
                <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                    <i class="fas fa-chart-pie text-sm"></i>
                </span>
                <div>
                    <h5 class="text-sm font-bold text-slate-900">Summary by event type</h5>
                    <p class="text-xs text-slate-500">Counts for every recorded action type</p>
                </div>
            </div>
            <div class="flex flex-wrap items-center gap-2 mb-3">
                <span class="inline-flex items-center rounded-lg bg-slate-900 text-white text-xs font-bold px-3 py-2">
                    <i class="fas fa-layer-group mr-2 opacity-90"></i>
                    Total ${data.total_activities ?? allActivities.length}
                </span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto overscroll-contain pr-1">
                ${statsSorted
                    .map((stat) => {
                        const meta = teacherAuditActionMeta(stat.action);
                        const cls = teacherAuditColorClasses(meta.color);
                        return `
                        <div class="bg-white border border-slate-200 rounded-lg p-2.5 min-w-0">
                            <div class="flex items-start justify-between gap-1">
                                <div class="min-w-0 flex-1">
                                    <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide leading-tight line-clamp-2">${escapeHtml(meta.label)}</p>
                                    <p class="text-lg font-bold text-slate-900 mt-0.5">${stat.count}</p>
                                </div>
                                <span class="h-7 w-7 rounded-md border ${cls.badge} flex items-center justify-center flex-shrink-0">
                                    <i class="fas ${meta.icon} text-[10px]"></i>
                                </span>
                            </div>
                        </div>`;
                    })
                    .join('')}
            </div>
        </div>
    `;

    if (!activities.length) {
        html += `
            <div class="text-center py-10 text-slate-600 border border-dashed border-amber-200 rounded-xl bg-amber-50/50">
                <i class="fas fa-filter text-2xl mb-2 text-amber-600"></i>
                <p class="font-semibold text-slate-800">No events in this category</p>
                <p class="text-sm mt-1">Choose another filter or <button type="button" class="text-indigo-600 font-semibold underline" onclick="setTeacherAuditFilter('all')">show all events</button>.</p>
            </div>
        `;
        activityContent.innerHTML = html;
        return;
    }

    const byDay = new Map();
    for (const activity of activities) {
        const dayKey = formatTeacherAuditDayLabel(activity.created_at);
        if (!byDay.has(dayKey)) byDay.set(dayKey, []);
        byDay.get(dayKey).push(activity);
    }

    for (const [, rows] of byDay) {
        rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    html += `<div class="space-y-8">`;

    for (const [dayLabel, rows] of byDay) {
        html += `
            <div>
                <div class="flex items-center gap-3 mb-3">
                    <span class="text-xs font-bold uppercase tracking-wider text-indigo-700 whitespace-nowrap">${escapeHtml(dayLabel)}</span>
                    <div class="h-px flex-1 bg-gradient-to-r from-indigo-200 to-transparent"></div>
                    <span class="text-[10px] font-medium text-slate-400">${rows.length} event${rows.length === 1 ? '' : 's'}</span>
                </div>
                <div class="space-y-2 pl-0 sm:pl-1">
        `;

        for (const activity of rows) {
            const meta = teacherAuditActionMeta(activity.action);
            const cls = teacherAuditColorClasses(meta.color);
            const strip = teacherAuditStripColor(meta);
            const showTechnical = !meta.known;

            html += `
            <div class="flex items-start gap-3 p-3.5 sm:p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all relative overflow-hidden">
                <div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${strip}"></div>
                <div class="flex-shrink-0 pl-2">
                    <div class="h-10 w-10 rounded-xl border ${cls.icon} flex items-center justify-center shadow-sm">
                        <i class="fas ${meta.icon} text-sm"></i>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-x-3">
                        <div class="min-w-0">
                            <p class="text-sm font-semibold text-slate-900">${escapeHtml(meta.label)}</p>
                            ${
                                showTechnical
                                    ? `<p class="text-[10px] font-mono text-slate-400 mt-0.5">${escapeHtml(String(activity.action || ''))}</p>`
                                    : `<p class="text-[10px] text-slate-400 mt-0.5"><span class="inline-flex items-center rounded px-1.5 py-0.5 bg-slate-100 text-slate-600 font-medium">${escapeHtml(teacherAuditCategory(activity.action))}</span></p>`
                            }
                        </div>
                        <time class="text-xs text-slate-500 whitespace-nowrap tabular-nums sm:text-right" datetime="${escapeHtml(String(activity.created_at || ''))}">${escapeHtml(formatDate(activity.created_at))}</time>
                    </div>
                    ${activity.details ? `<p class="text-sm text-slate-600 mt-2 leading-relaxed">${escapeHtml(String(activity.details))}</p>` : ''}
                    <div class="flex flex-wrap items-center mt-2 text-[11px] text-slate-500 gap-x-3 gap-y-1">
                        ${activity.ip_address ? `<span class="inline-flex items-center"><i class="fas fa-network-wired mr-1 text-slate-400"></i>${escapeHtml(String(activity.ip_address))}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
        }

        html += `</div></div>`;
    }

    html += `</div>`;
    activityContent.innerHTML = html;
}

window.setTeacherAuditFilter = setTeacherAuditFilter;

function closeTeacherDetailsModal() {
    document.getElementById('teacher-details-modal').classList.add('hidden');
    currentTeacherId = null;
}

async function approveTeacher(teacherId = null) {
    const id = teacherId || currentTeacherId;
    if (!id) return;

    const teacher = pendingTeachers.find(t => String(t.id) === String(id));
    const verified = teacher && (teacher.email_verified === 1 || teacher.is_email_verified === 1);
    if (teacher && !verified) {
        const proceed = await Swal.fire({
            title: 'Email not verified',
            text: 'This teacher has not verified their email. You can still approve the account.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Approve anyway',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#059669'
        });
        if (!proceed.isConfirmed) return;
    }

    // Confirm approval
    const result = await Swal.fire({
        title: 'Approve Teacher Account?',
        text: 'Are you sure you want to approve this teacher account?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, Approve',
        cancelButtonText: 'Cancel'
    });
    
    if (!result.isConfirmed) {
        return;
    }
    
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
        
        // Read response as text first to handle non-JSON responses
        const textResponse = await response.text();
        let data;
        
        try {
            data = JSON.parse(textResponse);
        } catch (jsonError) {
            console.error('Failed to parse JSON response:', jsonError);
            console.error('Response text:', textResponse);
            Swal.fire('Error', 'Invalid response from server. Please check the console for details.', 'error');
            return;
        }
        
        if (data.success) {
            Swal.fire({
                title: 'Success!',
                text: data.message || 'Teacher account approved successfully!',
                icon: 'success',
                timer: 3000,
                showConfirmButton: false
            });
            closeTeacherDetailsModal();
            loadDashboardStats();
            loadPendingTeachers();
            loadAllTeachers();
        } else {
            Swal.fire('Error', data.message || 'Failed to approve teacher', 'error');
        }
    } catch (error) {
        console.error('Error approving teacher:', error);
        Swal.fire('Error', 'An error occurred while approving the teacher: ' + error.message, 'error');
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
let teacherDirectoryPage = 1;
const teacherDirectoryPageSize = 10;
let teacherDirectoryView = 'approved'; // 'approved' | 'rejected' | 'all'
let teacherDirectoryTeachers = [];

// Archived teachers view (separate list + pagination)
let archivedTeachers = [];
let archivedTeachersPage = 1;
const archivedTeachersPageSize = 10;

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function setTeacherDirectoryPage(page) {
    teacherDirectoryPage = page;
    renderTeacherDirectory();
}

window.setTeacherDirectoryPage = setTeacherDirectoryPage;

function setArchivedTeachersPage(page) {
    archivedTeachersPage = page;
    renderArchivedTeachers();
}

window.setArchivedTeachersPage = setArchivedTeachersPage;

async function loadArchivedTeachers() {
    try {
        const response = await fetch('php/admin-all-teachers.php?archived=1', {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store'
        });
        const data = await response.json();
        if (data.success) {
            archivedTeachers = data.teachers || [];
            archivedTeachersPage = 1;
            renderArchivedTeachers();
        } else {
            throw new Error(data.message || 'Failed to load archived teachers');
        }
    } catch (error) {
        console.error('Error loading archived teachers:', error);
        if (typeof Swal !== 'undefined') {
            Swal.fire('Error', 'An error occurred while loading archived teachers', 'error');
        }
    }
}

function refreshArchivedTeachers() {
    loadArchivedTeachers();
    loadDashboardStats();
}

window.refreshArchivedTeachers = refreshArchivedTeachers;

function renderArchivedTeachersPagination(total) {
    const wrap = document.getElementById('archived-teachers-pagination');
    if (!wrap) return;

    if (total <= archivedTeachersPageSize) {
        wrap.innerHTML = '';
        return;
    }

    const totalPages = Math.max(1, Math.ceil(total / archivedTeachersPageSize));
    const page = clamp(archivedTeachersPage, 1, totalPages);
    archivedTeachersPage = page;
    const startIdx = (page - 1) * archivedTeachersPageSize;
    const endIdx = Math.min(total, startIdx + archivedTeachersPageSize);

    const btn = (label, target, disabled, active = false) => `
        <button type="button"
            class="px-3 py-2 text-sm font-medium rounded-lg border ${active ? 'bg-slate-800 text-white border-slate-800 hover:bg-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'} disabled:opacity-50 disabled:cursor-not-allowed"
            ${disabled ? 'disabled' : ''}
            onclick="setArchivedTeachersPage(${target})">
            ${label}
        </button>
    `;

    const pages = [];
    const windowSize = 2;
    const addEllipsis = () => pages.push(`<span class="px-2 text-slate-400 select-none">…</span>`);
    const addPage = (p) => pages.push(btn(String(p), p, false, p === page));

    if (totalPages <= 7) {
        for (let p = 1; p <= totalPages; p++) addPage(p);
    } else {
        addPage(1);
        if (page > 1 + windowSize + 1) addEllipsis();
        for (let p = Math.max(2, page - windowSize); p <= Math.min(totalPages - 1, page + windowSize); p++) addPage(p);
        if (page < totalPages - windowSize - 1) addEllipsis();
        addPage(totalPages);
    }

    wrap.innerHTML = `
        <div class="text-sm text-slate-600">
            Showing <span class="font-semibold text-slate-800">${startIdx + 1}</span>–<span class="font-semibold text-slate-800">${endIdx}</span>
            of <span class="font-semibold text-slate-800">${total}</span>
        </div>
        <div class="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
            ${btn('Prev', page - 1, page <= 1)}
            <div class="flex items-center gap-1">${pages.join('')}</div>
            ${btn('Next', page + 1, page >= totalPages)}
        </div>
    `;
}

function renderArchivedTeachers() {
    const tableBody = document.getElementById('archived-teachers-table');
    const empty = document.getElementById('no-archived-teachers');
    if (!tableBody || !empty) return;

    const total = Array.isArray(archivedTeachers) ? archivedTeachers.length : 0;
    if (total === 0) {
        tableBody.innerHTML = '';
        empty.classList.remove('hidden');
        renderArchivedTeachersPagination(0);
        return;
    }

    empty.classList.add('hidden');
    const totalPages = Math.max(1, Math.ceil(total / archivedTeachersPageSize));
    const page = clamp(archivedTeachersPage, 1, totalPages);
    archivedTeachersPage = page;
    const startIdx = (page - 1) * archivedTeachersPageSize;
    const endIdx = Math.min(total, startIdx + archivedTeachersPageSize);
    const pageItems = archivedTeachers.slice(startIdx, endIdx);

    tableBody.innerHTML = pageItems.map(t => `
        <tr class="hover:bg-slate-50">
            <td class="px-4 py-3 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="h-10 w-10 bg-slate-700 rounded-full flex items-center justify-center">
                        <span class="text-white font-medium text-sm">${escapeHtml(String(t.first_name || '').charAt(0))}${escapeHtml(String(t.last_name || '').charAt(0))}</span>
                    </div>
                    <div class="ml-3 min-w-0">
                        <div class="text-sm font-semibold text-slate-900">${escapeHtml(t.first_name || '')} ${escapeHtml(t.last_name || '')}</div>
                        <div class="text-xs text-slate-500 truncate">${escapeHtml(t.email || '')}</div>
                    </div>
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-slate-700 align-top">${escapeHtml(t.department || '—')}</td>
            <td class="px-4 py-3 text-sm text-slate-700 align-top">${escapeHtml(t.subject || '—')}</td>
            <td class="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">${escapeHtml(formatDate(t.archived_at || t.created_at || ''))}</td>
            <td class="px-4 py-3 text-sm whitespace-nowrap">
                <button type="button" onclick="restoreTeacherAccount(${t.id})" class="inline-flex items-center px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg hover:bg-emerald-100/70">
                    <i class="fas fa-rotate-left mr-2"></i> Restore
                </button>
            </td>
        </tr>
    `).join('');

    renderArchivedTeachersPagination(total);
}

async function archiveTeacherAccount(teacherId) {
    const teacher = (Array.isArray(allTeachers) ? allTeachers : []).find(t => String(t.id) === String(teacherId));
    const teacherName = teacher ? `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() : 'this teacher';
    const teacherEmail = teacher ? (teacher.email || '') : '';

    if (typeof Swal === 'undefined') {
        const ok = window.confirm(`Remove ${teacherName}? Type DELETE in the next prompt to confirm.`);
        if (!ok) return;
        const typed = window.prompt('Type DELETE to confirm');
        if (typed !== 'DELETE') return;
    }

    const result = await Swal.fire({
        title: 'Remove teacher account?',
        icon: 'warning',
        html: `
            <div style="text-align:left;">
                <p class="text-sm text-slate-600">This will move the teacher to <strong>Archive</strong> and remove access.</p>
                <p class="text-sm text-slate-600 mt-2"><strong>${escapeHtml(teacherName)}</strong> ${teacherEmail ? `(${escapeHtml(teacherEmail)})` : ''}</p>
                <p class="text-sm text-slate-600 mt-4">Type <strong>DELETE</strong> to confirm.</p>
            </div>
        `,
        input: 'text',
        inputPlaceholder: 'Type DELETE',
        inputAttributes: { autocapitalize: 'off', autocorrect: 'off' },
        showCancelButton: true,
        confirmButtonText: 'Remove',
        confirmButtonColor: '#dc2626',
        cancelButtonText: 'Cancel',
        preConfirm: (value) => {
            if (String(value || '').trim() !== 'DELETE') {
                Swal.showValidationMessage('Please type DELETE to confirm.');
                return false;
            }
            return true;
        }
    });

    if (!result.isConfirmed) return;

    try {
        const res = await fetch('php/admin-teacher-archive.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'archive', teacher_id: teacherId })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to archive');
        await Swal.fire({ icon: 'success', title: 'Removed', text: 'Teacher account moved to archive.' });
        await loadAllTeachers();
        await loadArchivedTeachers();
        await loadDashboardStats();
    } catch (error) {
        console.error('archiveTeacherAccount', error);
        Swal.fire('Error', String(error.message || error), 'error');
    }
}

window.archiveTeacherAccount = archiveTeacherAccount;

async function restoreTeacherAccount(teacherId) {
    if (typeof Swal === 'undefined') return;
    const confirm = await Swal.fire({
        title: 'Restore teacher account?',
        text: 'This will restore access for this teacher.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Restore',
        confirmButtonColor: '#059669',
        cancelButtonText: 'Cancel'
    });
    if (!confirm.isConfirmed) return;

    try {
        const res = await fetch('php/admin-teacher-archive.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'restore', teacher_id: teacherId })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to restore');
        await Swal.fire({ icon: 'success', title: 'Restored', text: 'Teacher account restored.' });
        await loadArchivedTeachers();
        await loadAllTeachers();
        await loadDashboardStats();
    } catch (error) {
        console.error('restoreTeacherAccount', error);
        Swal.fire('Error', String(error.message || error), 'error');
    }
}

window.restoreTeacherAccount = restoreTeacherAccount;

function getTeacherDirectoryPaginationMeta(total) {
    const totalPages = Math.max(1, Math.ceil(total / teacherDirectoryPageSize));
    const page = clamp(teacherDirectoryPage, 1, totalPages);
    teacherDirectoryPage = page;
    const startIdx = (page - 1) * teacherDirectoryPageSize;
    const endIdx = Math.min(total, startIdx + teacherDirectoryPageSize);
    return { page, totalPages, startIdx, endIdx };
}

function renderTeacherDirectoryPagination(total) {
    const wrap = document.getElementById('all-teachers-pagination');
    if (!wrap) return;

    if (total <= teacherDirectoryPageSize) {
        wrap.innerHTML = '';
        return;
    }

    const { page, totalPages, startIdx, endIdx } = getTeacherDirectoryPaginationMeta(total);

    const info = `
        <div class="text-sm text-slate-600">
            Showing <span class="font-semibold text-slate-800">${startIdx + 1}</span>–<span class="font-semibold text-slate-800">${endIdx}</span>
            of <span class="font-semibold text-slate-800">${total}</span>
        </div>
    `;

    const makeBtn = (label, targetPage, disabled, extraClass = '') => `
        <button type="button"
            class="px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed ${extraClass}"
            ${disabled ? 'disabled' : ''}
            onclick="setTeacherDirectoryPage(${targetPage})">
            ${label}
        </button>
    `;

    const prevBtn = makeBtn('Prev', page - 1, page <= 1);
    const nextBtn = makeBtn('Next', page + 1, page >= totalPages);

    // Page number buttons (compact)
    const pages = [];
    const windowSize = 2;
    const addPage = (p) => pages.push(makeBtn(String(p), p, false, p === page ? 'bg-slate-800 text-white border-slate-800 hover:bg-slate-900' : ''));
    const addEllipsis = () => pages.push(`<span class="px-2 text-slate-400 select-none">…</span>`);

    if (totalPages <= 7) {
        for (let p = 1; p <= totalPages; p++) addPage(p);
    } else {
        addPage(1);
        if (page > 1 + windowSize + 1) addEllipsis();
        for (let p = Math.max(2, page - windowSize); p <= Math.min(totalPages - 1, page + windowSize); p++) addPage(p);
        if (page < totalPages - windowSize - 1) addEllipsis();
        addPage(totalPages);
    }

    wrap.innerHTML = `
        ${info}
        <div class="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
            ${prevBtn}
            <div class="flex items-center gap-1">
                ${pages.join('')}
            </div>
            ${nextBtn}
        </div>
    `;
}

function renderTeacherDirectory() {
    const list = Array.isArray(teacherDirectoryTeachers) ? teacherDirectoryTeachers : [];
    const total = list.length;
    const tableBody = document.getElementById('all-teachers-table');
    const noTeachersDiv = document.getElementById('no-all-teachers');

    if (!tableBody || !noTeachersDiv) return;

    if (total === 0) {
        tableBody.innerHTML = '';
        noTeachersDiv.classList.remove('hidden');
        renderTeacherDirectoryPagination(0);
        return;
    }

    noTeachersDiv.classList.add('hidden');

    const { startIdx, endIdx } = getTeacherDirectoryPaginationMeta(total);
    const pageItems = list.slice(startIdx, endIdx);

    // Use the existing row templates, but on sliced items.
    if (teacherDirectoryView === 'approved') {
        displayApprovedTeachers(pageItems, { skipPagination: true });
    } else {
        displayAllTeachers(pageItems, { skipPagination: true });
    }

    renderTeacherDirectoryPagination(total);
}

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
            teacherDirectoryView = 'approved';
            teacherDirectoryTeachers = approvedTeachers;
            teacherDirectoryPage = 1;
            renderTeacherDirectory();
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

function displayApprovedTeachers(teachers, opts = {}) {
    const tableBody = document.getElementById('all-teachers-table');
    const noTeachersDiv = document.getElementById('no-all-teachers');
    
    if (teachers.length === 0) {
        tableBody.innerHTML = '';
        noTeachersDiv.classList.remove('hidden');
        if (!opts.skipPagination) renderTeacherDirectoryPagination(0);
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
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="viewTeacherDetails(${teacher.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <i class="fas fa-eye"></i> View
                </button>
                <button onclick="manageTeacherClasses(${teacher.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-chalkboard-teacher"></i> Classes
                </button>
                <button type="button" onclick="archiveTeacherAccount(${teacher.id})" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </td>
        </tr>
    `).join('');

    if (!opts.skipPagination) renderTeacherDirectoryPagination(teachers.length);
}

function viewAllTeachers() {
    console.log('Viewing all teachers:', allTeachers.length); // Debug log
    teacherDirectoryView = 'approved';
    teacherDirectoryTeachers = allTeachers.filter(t => t.status === 'approved' || t.status_text === 'Approved');
    teacherDirectoryPage = 1;
    renderTeacherDirectory();
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
    teacherDirectoryView = 'rejected';
    teacherDirectoryTeachers = rejectedTeachers;
    teacherDirectoryPage = 1;
    renderTeacherDirectory();
    updatePageTitle('Rejected Teachers');
}

async function viewApprovedTeachers() {
    currentFilter = 'approved';
    const approvedTeachers = allTeachers.filter(teacher => {
        return teacher.status === 'approved' || teacher.status_text === 'Approved';
    });
    teacherDirectoryView = 'approved';
    teacherDirectoryTeachers = approvedTeachers;
    teacherDirectoryPage = 1;
    renderTeacherDirectory();
    updatePageTitle('Approved Teachers');
}

function refreshAllTeachers() {
    loadAllTeachers();
    loadDashboardStats();
    currentFilter = 'all';
    updatePageTitle('All Teachers');
}

function displayAllTeachers(teachers, opts = {}) {
    const tableBody = document.getElementById('all-teachers-table');
    const noTeachersDiv = document.getElementById('no-all-teachers');
    
    console.log('Displaying teachers:', teachers.length); // Debug log
    
    if (teachers.length === 0) {
        tableBody.innerHTML = '';
        noTeachersDiv.classList.remove('hidden');
        if (!opts.skipPagination) renderTeacherDirectoryPagination(0);
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
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="viewTeacherDetails(${teacher.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <i class="fas fa-eye"></i> View
                </button>
                ${teacher.status === 'approved' ? `
                    <button onclick="manageTeacherClasses(${teacher.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                        <i class="fas fa-chalkboard-teacher"></i> Classes
                    </button>
                    <button type="button" onclick="archiveTeacherAccount(${teacher.id})" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                ` : teacher.status === 'pending' ? `
                    <button onclick="approveTeacher(${teacher.id})" class="text-green-600 hover:text-green-900 mr-3">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button onclick="showRejectionModal(${teacher.id})" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    <button type="button" onclick="archiveTeacherAccount(${teacher.id})" class="text-red-600 hover:text-red-900 ml-3">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');

    if (!opts.skipPagination) renderTeacherDirectoryPagination(teachers.length);
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
        <div class="flex items-start justify-between gap-4 mb-6">
            <div class="min-w-0">
                <h4 class="text-lg font-semibold text-slate-900 truncate">${escapeHtml(teacher.first_name)} ${escapeHtml(teacher.last_name)}</h4>
                <p class="text-sm text-slate-600 mt-1 truncate">${escapeHtml(teacher.department || '—')} • ${escapeHtml(teacher.subject || '—')}</p>
            </div>
            <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                <i class="fas fa-chalkboard-teacher mr-2 text-slate-500"></i>
                ${classes.length} class${classes.length === 1 ? '' : 'es'}
            </span>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Classes Section -->
            <div>
                <div class="flex items-center gap-2 mb-4">
                    <i class="fas fa-chalkboard text-indigo-600"></i>
                    <h5 class="text-sm font-semibold text-slate-900">Classes</h5>
                </div>
                <div class="space-y-3">
                    ${classes.length > 0 ? classes.map(cls => `
                        <div class="border border-slate-200 rounded-xl p-4 bg-white">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h6 class="font-semibold text-slate-900">${escapeHtml(cls.class_name || 'Unnamed Class')}</h6>
                                    <p class="text-xs text-slate-500 mt-1">Class ID: ${escapeHtml(String(cls.id))}</p>
                                    <div class="mt-2 flex flex-wrap gap-2">
                                        ${cls.grade_level ? `<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200"><i class="fas fa-layer-group mr-1 text-slate-500"></i> Grade ${escapeHtml(String(cls.grade_level))}</span>` : ''}
                                        ${cls.strand ? `<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200"><i class="fas fa-stream mr-1 text-slate-500"></i> ${escapeHtml(String(cls.strand))}</span>` : ''}
                                    </div>
                                </div>
                                <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    <i class="fas fa-user-check mr-1"></i>
                                    ${enrolledStudents.filter(s => s.class_id == cls.id).length} enrolled
                                </span>
                            </div>
                            <div class="mt-3 flex items-center justify-between gap-3">
                                <button type="button" onclick="viewClassStudents(${cls.id})" class="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100/70">
                                    <i class="fas fa-users mr-2"></i>View students
                                </button>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="text-center py-10 text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                            <i class="fas fa-chalkboard-teacher text-3xl mb-3 text-slate-400"></i>
                            <p class="font-semibold text-slate-700">No classes yet</p>
                            <p class="text-sm mt-1">This teacher hasn’t created any classes.</p>
                        </div>
                    `}
                </div>
            </div>
            
            <!-- Students Section -->
            <div>
                <div class="flex items-center gap-2 mb-4">
                    <i class="fas fa-graduation-cap text-indigo-600"></i>
                    <h5 class="text-sm font-semibold text-slate-900">Students</h5>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div class="border border-slate-200 rounded-xl bg-white p-4">
                        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total enrolled</p>
                        <p class="text-2xl font-bold text-slate-900 mt-1">${enrolledStudents.length}</p>
                        <p class="text-xs text-slate-500 mt-1">Across all classes</p>
                    </div>
                    <div class="border border-slate-200 rounded-xl bg-white p-4">
                        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Available list</p>
                        <p class="text-2xl font-bold text-slate-900 mt-1">${potentialStudents.length}</p>
                        <p class="text-xs text-slate-500 mt-1">Not enrolled (if provided)</p>
                    </div>
                </div>

                <div class="border border-slate-200 rounded-xl bg-slate-50 p-4">
                    <div class="flex items-start gap-3">
                        <div class="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 flex-shrink-0">
                            <i class="fas fa-info-circle"></i>
                        </div>
                        <div class="min-w-0">
                            <p class="text-sm font-semibold text-slate-900">View enrolled students per class</p>
                            <p class="text-sm text-slate-600 mt-1">Click <span class="font-semibold">View students</span> on a class card to open the full enrolled list with pagination.</p>
                        </div>
                    </div>
                </div>
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
        <div class="flex items-start justify-between gap-4 mb-6">
            <div class="min-w-0">
                <h4 class="text-lg font-semibold text-slate-900 truncate">Progress & analytics</h4>
                <p class="text-sm text-slate-600 mt-1 truncate">${escapeHtml(teacher.first_name)} ${escapeHtml(teacher.last_name)} • ${escapeHtml(teacher.subject || '—')}</p>
            </div>
            <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                <i class="fas fa-users mr-2 text-slate-500"></i>
                ${students.length} student${students.length === 1 ? '' : 's'}
            </span>
        </div>
        
        <!-- Analytics Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="border border-slate-200 bg-slate-50 p-4 rounded-xl">
                <div class="flex items-center">
                    <i class="fas fa-graduation-cap text-indigo-600 text-2xl mr-3"></i>
                    <div>
                        <p class="text-sm text-slate-600">Total students</p>
                        <p class="text-xl font-bold text-slate-900">${analytics.total_students || 0}</p>
                    </div>
                </div>
            </div>
            <div class="border border-slate-200 bg-slate-50 p-4 rounded-xl">
                <div class="flex items-center">
                    <i class="fas fa-chart-line text-emerald-600 text-2xl mr-3"></i>
                    <div>
                        <p class="text-sm text-slate-600">Avg progress</p>
                        <p class="text-xl font-bold text-slate-900">${analytics.avg_progress || 0}%</p>
                    </div>
                </div>
            </div>
            <div class="border border-slate-200 bg-slate-50 p-4 rounded-xl">
                <div class="flex items-center">
                    <i class="fas fa-trophy text-violet-600 text-2xl mr-3"></i>
                    <div>
                        <p class="text-sm text-slate-600">Achievements</p>
                        <p class="text-xl font-bold text-slate-900">${analytics.total_achievements || 0}</p>
                    </div>
                </div>
            </div>
            <div class="border border-slate-200 bg-slate-50 p-4 rounded-xl">
                <div class="flex items-center">
                    <i class="fas fa-star text-amber-600 text-2xl mr-3"></i>
                    <div>
                        <p class="text-sm text-slate-600">Avg quiz score</p>
                        <p class="text-xl font-bold text-slate-900">${analytics.avg_quiz_score || 0}%</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Students Table -->
        <div class="overflow-x-auto border border-slate-200 rounded-xl">
            <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Quiz score</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Achievements</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ranking</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-slate-100">
                    ${students.map(student => `
                        <tr class="hover:bg-slate-50">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <div class="h-9 w-9 bg-slate-900 rounded-full flex items-center justify-center">
                                        <span class="text-white text-xs font-medium">${student.first_name.charAt(0)}${student.last_name.charAt(0)}</span>
                                    </div>
                                    <div class="ml-3">
                                        <div class="text-sm font-semibold text-slate-900">${escapeHtml(student.first_name)} ${escapeHtml(student.last_name)}</div>
                                        <div class="text-xs text-slate-500">${escapeHtml(student.student_id || '—')}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0 w-24 bg-slate-200 rounded-full h-2">
                                        <div class="bg-emerald-600 h-2 rounded-full" style="width: ${student.progress_percentage || 0}%"></div>
                                    </div>
                                    <span class="ml-2 text-sm text-slate-600">${student.progress_percentage || 0}%</span>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreBadgeClass(student.avg_quiz_score)}">
                                    ${student.avg_quiz_score || 0}%
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
                                    <i class="fas fa-trophy mr-1"></i>
                                    ${student.achievements_count || 0}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRankingBadgeClass(student.ranking)}">
                                    #${student.ranking || 'N/A'}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button type="button" onclick="viewStudentDetails(${student.id})" class="inline-flex items-center text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 px-2 py-1 rounded-lg">
                                    <i class="fas fa-eye mr-2"></i> Details
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

// Enrolled students modal (admin class management)
let enrolledStudentsModalState = {
    open: false,
    teacher: null,
    classId: null,
    className: '',
    students: [],
    page: 1,
    pageSize: 10
};

function closeEnrolledStudentsModal() {
    const modal = document.getElementById('enrolled-students-modal');
    if (modal) modal.classList.add('hidden');
    enrolledStudentsModalState.open = false;
}

window.closeEnrolledStudentsModal = closeEnrolledStudentsModal;

function setEnrolledStudentsPage(page) {
    enrolledStudentsModalState.page = page;
    renderEnrolledStudentsTable();
}

window.setEnrolledStudentsPage = setEnrolledStudentsPage;

function renderEnrolledStudentsPagination(total) {
    const wrap = document.getElementById('enrolled-students-pagination');
    if (!wrap) return;

    if (total <= enrolledStudentsModalState.pageSize) {
        wrap.innerHTML = '';
        return;
    }

    const totalPages = Math.max(1, Math.ceil(total / enrolledStudentsModalState.pageSize));
    const page = Math.max(1, Math.min(totalPages, enrolledStudentsModalState.page));
    enrolledStudentsModalState.page = page;

    const startIdx = (page - 1) * enrolledStudentsModalState.pageSize;
    const endIdx = Math.min(total, startIdx + enrolledStudentsModalState.pageSize);

    const makeBtn = (label, targetPage, disabled, extraClass = '') => `
        <button type="button"
            class="px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed ${extraClass}"
            ${disabled ? 'disabled' : ''}
            onclick="setEnrolledStudentsPage(${targetPage})">
            ${label}
        </button>
    `;

    const prevBtn = makeBtn('Prev', page - 1, page <= 1);
    const nextBtn = makeBtn('Next', page + 1, page >= totalPages);

    const pages = [];
    const windowSize = 2;
    const addPage = (p) => pages.push(makeBtn(String(p), p, false, p === page ? 'bg-slate-800 text-white border-slate-800 hover:bg-slate-900' : ''));
    const addEllipsis = () => pages.push(`<span class="px-2 text-slate-400 select-none">…</span>`);

    if (totalPages <= 7) {
        for (let p = 1; p <= totalPages; p++) addPage(p);
    } else {
        addPage(1);
        if (page > 1 + windowSize + 1) addEllipsis();
        for (let p = Math.max(2, page - windowSize); p <= Math.min(totalPages - 1, page + windowSize); p++) addPage(p);
        if (page < totalPages - windowSize - 1) addEllipsis();
        addPage(totalPages);
    }

    wrap.innerHTML = `
        <div class="text-sm text-slate-600">
            Showing <span class="font-semibold text-slate-800">${startIdx + 1}</span>–<span class="font-semibold text-slate-800">${endIdx}</span>
            of <span class="font-semibold text-slate-800">${total}</span>
        </div>
        <div class="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
            ${prevBtn}
            <div class="flex items-center gap-1">
                ${pages.join('')}
            </div>
            ${nextBtn}
        </div>
    `;
}

function renderEnrolledStudentsTable() {
    const tbody = document.getElementById('enrolled-students-table');
    const empty = document.getElementById('enrolled-students-empty');
    if (!tbody || !empty) return;

    const list = Array.isArray(enrolledStudentsModalState.students) ? enrolledStudentsModalState.students : [];
    const total = list.length;

    if (total === 0) {
        tbody.innerHTML = '';
        empty.classList.remove('hidden');
        renderEnrolledStudentsPagination(0);
        return;
    }

    empty.classList.add('hidden');

    const totalPages = Math.max(1, Math.ceil(total / enrolledStudentsModalState.pageSize));
    const page = Math.max(1, Math.min(totalPages, enrolledStudentsModalState.page));
    enrolledStudentsModalState.page = page;

    const startIdx = (page - 1) * enrolledStudentsModalState.pageSize;
    const endIdx = Math.min(total, startIdx + enrolledStudentsModalState.pageSize);
    const pageItems = list.slice(startIdx, endIdx);

    tbody.innerHTML = pageItems.map(s => `
        <tr class="hover:bg-slate-50">
            <td class="px-4 py-3 text-sm text-slate-900">
                <div class="flex items-center gap-3">
                    <div class="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                        <span class="text-white text-xs font-semibold">${escapeHtml(String(s.first_name || '').charAt(0))}${escapeHtml(String(s.last_name || '').charAt(0))}</span>
                    </div>
                    <div class="min-w-0">
                        <div class="font-semibold truncate">${escapeHtml(s.first_name || '')} ${escapeHtml(s.last_name || '')}</div>
                    </div>
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-slate-700 break-all">${escapeHtml(s.email || '—')}</td>
            <td class="px-4 py-3 text-sm text-slate-600">${escapeHtml(formatDate(s.enrollment_date || s.enrolled_at || s.created_at || ''))}</td>
        </tr>
    `).join('');

    renderEnrolledStudentsPagination(total);
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
            const classes = Array.isArray(data.classes) ? data.classes : [];
            const cls = classes.find(c => String(c.id) === String(classId));

            // Filter students for the specific class (handle both string and number)
            const classStudents = (data.students || []).filter(student => {
                return student.class_id == classId ||
                    student.class_id === classId ||
                    parseInt(student.class_id) === parseInt(classId);
            });

            const enrolled = classStudents.filter(student => student.enrollment_date);

            // Update modal header text
            const titleEl = document.getElementById('enrolled-students-title');
            const subEl = document.getElementById('enrolled-students-subtitle');
            if (titleEl) titleEl.textContent = 'Enrolled students';
            if (subEl) {
                const className = cls && cls.class_name ? String(cls.class_name) : `Class ${classId}`;
                subEl.textContent = `${className} • ${enrolled.length} enrolled`;
            }

            // Store state + render
            enrolledStudentsModalState.teacher = data.teacher || null;
            enrolledStudentsModalState.classId = classId;
            enrolledStudentsModalState.className = cls && cls.class_name ? String(cls.class_name) : '';
            enrolledStudentsModalState.students = enrolled;
            enrolledStudentsModalState.page = 1;

            const modal = document.getElementById('enrolled-students-modal');
            if (modal) modal.classList.remove('hidden');
            enrolledStudentsModalState.open = true;
            renderEnrolledStudentsTable();
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

async function loadMaintenancePanel() {
    try {
        const res = await fetch('php/admin-maintenance.php', { credentials: 'same-origin', cache: 'no-store' });
        const data = await res.json();
        if (data.success && data.data) {
            applyMaintenanceForm(data.data);
        }
    } catch (e) {
        console.error('loadMaintenancePanel', e);
    }
}

function applyMaintenanceForm(d) {
    const titleEl = document.getElementById('maintenance-title');
    const msgEl = document.getElementById('maintenance-message');
    const startEl = document.getElementById('maintenance-start-at');
    const endEl = document.getElementById('maintenance-end-at');
    const label = document.getElementById('maintenance-status-label');
    const dot = document.getElementById('maintenance-status-dot');
    const badge = document.getElementById('maintenance-status-badge');
    if (titleEl) titleEl.value = d.title || '';
    if (msgEl) msgEl.value = d.public_message || '';
    if (startEl) startEl.value = d.scheduled_start_at ? isoToDatetimeLocal(d.scheduled_start_at) : '';
    if (endEl) endEl.value = (d.scheduled_end_at || d.estimated_end_at) ? isoToDatetimeLocal(d.scheduled_end_at || d.estimated_end_at) : '';
    if (label && dot && badge) {
        const badgeBase = 'inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium';
        if (d.is_active) {
            label.textContent = 'Maintenance ON — students/teachers cannot log in';
            dot.className = 'w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse';
            badge.className = `${badgeBase} bg-amber-50 text-amber-900 border border-amber-200`;
        } else if (d.is_upcoming) {
            label.textContent = 'Maintenance scheduled — login block starts at the configured time';
            dot.className = 'w-2 h-2 rounded-full bg-violet-500 mr-2';
            badge.className = `${badgeBase} bg-violet-50 text-violet-800 border border-violet-200`;
        } else {
            label.textContent = 'Normal — logins allowed';
            dot.className = 'w-2 h-2 rounded-full bg-emerald-500 mr-2';
            badge.className = `${badgeBase} bg-emerald-50 text-emerald-800 border border-emerald-200`;
        }
    }
    syncMaintenanceScheduleUi(d);
}

function syncMaintenanceScheduleUi(d) {
    const notice = document.getElementById('maintenance-admin-notice');
    const startBtn = document.getElementById('maintenance-start-btn');
    if (notice) {
        if (d && d.admin_notice) {
            notice.textContent = d.admin_notice;
            notice.classList.remove('hidden');
        } else {
            notice.textContent = '';
            notice.classList.add('hidden');
        }
    }
    const cannotNew = !!(d && (d.cannot_schedule_new != null ? d.cannot_schedule_new : (d.is_active || d.is_upcoming)));
    if (startBtn) {
        // Allow scheduling only when no window is active or upcoming; save/end stay available when blocked.
        startBtn.disabled = cannotNew;
        startBtn.title = cannotNew
            ? 'A maintenance window is already active or scheduled. End it or wait for it to pass before starting a new one.'
            : '';
    }
}

function isoToDatetimeLocal(s) {
    if (!s) return '';
    const normalized = String(s).replace(' ', 'T');
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return '';
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local values (YYYY-MM-DDTHH:mm). Returns true if end is strictly before start. */
function isMaintenanceEndBeforeStart(scheduledStart, scheduledEnd) {
    if (!scheduledStart || !scheduledEnd) return false;
    const s = new Date(scheduledStart);
    const e = new Date(scheduledEnd);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return false;
    return e.getTime() < s.getTime();
}

function setMaintenanceActionBusy(isBusy, message) {
    const startBtn = document.getElementById('maintenance-start-btn');
    const saveBtn = document.getElementById('maintenance-save-btn');
    const endBtn = document.getElementById('maintenance-end-btn');
    const resultEl = document.getElementById('maintenance-email-result');
    [startBtn, saveBtn, endBtn].forEach((btn) => {
        if (!btn) return;
        btn.disabled = !!isBusy;
    });
    if (resultEl) {
        resultEl.textContent = isBusy && message ? message : '';
    }
}

async function startSystemMaintenance() {
    const title = document.getElementById('maintenance-title')?.value?.trim() || '';
    const public_message = document.getElementById('maintenance-message')?.value?.trim() || '';
    const scheduled_start_at = document.getElementById('maintenance-start-at')?.value || '';
    const scheduled_end_at = document.getElementById('maintenance-end-at')?.value || '';
    const estimated_end_at = scheduled_end_at || '';
    if (!scheduled_start_at) {
        Swal.fire('Required', 'Start date is required', 'warning');
        return;
    }
    if (!scheduled_end_at) {
        Swal.fire('Required', 'End date is required', 'warning');
        return;
    }
    if (isMaintenanceEndBeforeStart(scheduled_start_at, scheduled_end_at)) {
        Swal.fire('Invalid dates', 'End date and time must be on or after the start date and time.', 'warning');
        return;
    }
    const confirm = await Swal.fire({
        title: 'Save maintenance?',
        text: 'If the start time is in the future, student and teacher logins stay open until then. If the start time is now or in the past, maintenance begins immediately.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, save',
        confirmButtonColor: '#d97706'
    });
    if (!confirm.isConfirmed) return;
    try {
        setMaintenanceActionBusy(true, 'Saving maintenance schedule...');
        const res = await fetch('php/admin-maintenance.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'start',
                title,
                public_message,
                scheduled_start_at,
                scheduled_end_at,
                estimated_end_at
            })
        });
        const raw = await res.text();
        let data;
        try {
            data = JSON.parse(raw);
        } catch (parseErr) {
            throw new Error('Server returned non-JSON response. Check PHP error logs.');
        }
        if (data.success) {
            const d = data.data || {};
            let successTitle = 'Saved';
            if (d.is_upcoming) successTitle = 'Maintenance scheduled';
            else if (d.maintenance || d.is_active) successTitle = 'Maintenance active';
            Swal.fire({ icon: 'success', title: successTitle, text: data.message || '' });
            applyMaintenanceForm(data.data);
        } else {
            Swal.fire('Error', data.message || 'Failed', 'error');
        }
    } catch (e) {
        Swal.fire('Error', String(e.message || e), 'error');
    } finally {
        setMaintenanceActionBusy(false);
    }
}

async function saveMaintenanceDraft() {
    const title = document.getElementById('maintenance-title')?.value?.trim() || '';
    const public_message = document.getElementById('maintenance-message')?.value?.trim() || '';
    const scheduled_start_at = document.getElementById('maintenance-start-at')?.value || '';
    const scheduled_end_at = document.getElementById('maintenance-end-at')?.value || '';
    const estimated_end_at = scheduled_end_at || '';
    if (scheduled_start_at && !scheduled_end_at) {
        Swal.fire('Required', 'End date is required', 'warning');
        return;
    }
    if (!scheduled_start_at && scheduled_end_at) {
        Swal.fire('Required', 'Start date is required', 'warning');
        return;
    }
    if (scheduled_start_at && scheduled_end_at && isMaintenanceEndBeforeStart(scheduled_start_at, scheduled_end_at)) {
        Swal.fire('Invalid dates', 'End date and time must be on or after the start date and time.', 'warning');
        return;
    }
    try {
        setMaintenanceActionBusy(true, 'Saving maintenance details...');
        const res = await fetch('php/admin-maintenance.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update',
                title,
                public_message,
                scheduled_start_at,
                scheduled_end_at,
                estimated_end_at
            })
        });
        const raw = await res.text();
        let data;
        try {
            data = JSON.parse(raw);
        } catch (parseErr) {
            throw new Error('Server returned non-JSON response. Please check PHP logs.');
        }
        if (data.success) {
            Swal.fire({ icon: 'success', title: 'Saved', text: data.message || 'Details updated.' });
            applyMaintenanceForm(data.data);
        } else {
            Swal.fire('Error', data.message || 'Failed (is maintenance active?)', 'error');
        }
    } catch (e) {
        Swal.fire('Error', String(e.message || e), 'error');
    } finally {
        setMaintenanceActionBusy(false);
    }
}

async function endSystemMaintenance() {
    const title = document.getElementById('maintenance-title')?.value?.trim() || '';
    const public_message = document.getElementById('maintenance-message')?.value?.trim() || '';
    const estimated_end_at = document.getElementById('maintenance-end-at')?.value || '';
    const scheduled_start_at = document.getElementById('maintenance-start-at')?.value || '';
    if (estimated_end_at && scheduled_start_at && isMaintenanceEndBeforeStart(scheduled_start_at, estimated_end_at)) {
        Swal.fire('Invalid dates', 'End date and time must be on or after the start date and time.', 'warning');
        return;
    }
    const confirm = await Swal.fire({
        title: 'End maintenance?',
        text: 'Students and teachers will be able to log in again.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, complete',
        confirmButtonColor: '#059669'
    });
    if (!confirm.isConfirmed) return;
    try {
        setMaintenanceActionBusy(true, 'Ending maintenance...');
        const res = await fetch('php/admin-maintenance.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'end', title, public_message, estimated_end_at })
        });
        const raw = await res.text();
        let data;
        try {
            data = JSON.parse(raw);
        } catch (parseErr) {
            throw new Error('Server returned non-JSON response. Check PHP error logs.');
        }
        if (data.success) {
            Swal.fire({ icon: 'success', title: 'Maintenance ended', text: data.message || '' });
            applyMaintenanceForm(data.data);
        } else {
            Swal.fire('Error', data.message || 'Failed', 'error');
        }
    } catch (e) {
        Swal.fire('Error', String(e.message || e), 'error');
    } finally {
        setMaintenanceActionBusy(false);
    }
}

window.startSystemMaintenance = startSystemMaintenance;
window.saveMaintenanceDraft = saveMaintenanceDraft;
window.endSystemMaintenance = endSystemMaintenance;
