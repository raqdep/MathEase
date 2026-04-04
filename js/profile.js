// Profile Page JavaScript

let profileData = null;
let isEditingPersonalInfo = false;

// Initialize profile page
document.addEventListener('DOMContentLoaded', async function() {
    await loadProfileData();
    setupEventListeners();
    startProfileIconSync();
});

// Setup event listeners
function setupEventListeners() {
    // Change password form
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }

    const mobileNavSelect = document.getElementById('mobileNavSelect');
    if (mobileNavSelect && !mobileNavSelect.dataset.bound) {
        mobileNavSelect.dataset.bound = '1';
        mobileNavSelect.addEventListener('change', function (e) {
            if (e.target.value) window.location.href = e.target.value;
        });
    }
}

// Load all profile data
async function loadProfileData() {
    try {
        // Show loading state
        showLoadingState();
        
        // Load user data
        const userResponse = await fetch('php/user.php', {
            credentials: 'include',
            cache: 'no-store'
        });
        
        if (userResponse.status === 401) {
            window.location.href = 'login.html';
            return;
        }
        
        const userData = await userResponse.json();
        if (!userData.success) {
            throw new Error('Failed to load user data');
        }
        applyNavProfile(userData.user);
        
        const userId = userData.user.id;
        
        // Load complete profile data
        const profileResponse = await fetch(`php/get-profile.php?user_id=${userId}`, {
            credentials: 'include'
        });
        
        if (!profileResponse.ok) {
            throw new Error('Failed to load profile data');
        }
        
        const profileResult = await profileResponse.json();
        if (!profileResult.success) {
            throw new Error(profileResult.message || 'Failed to load profile');
        }
        
        profileData = profileResult;
        
        // Display all data
        displayPersonalInfo(profileResult.user);
        displayProfilePicture(profileResult.user.profile_picture_url || profileResult.user.profile_picture);
        applyNavProfile(profileResult.user);
        displayBadges(profileResult.badges);
        displayLessons(profileResult.lessons);
        displayQuizzesSplit(profileResult.quizzes);
        displayStatistics(profileResult);
        
    } catch (error) {
        console.error('Error loading profile data:', error);
        Swal.fire({
            title: 'Error',
            text: 'Failed to load profile data. Please refresh the page.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Show loading state
function showLoadingState() {
    // Loading states are already in HTML
}

// Display personal information
function displayPersonalInfo(user) {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    
    document.getElementById('studentName').textContent = fullName || 'Student';
    document.getElementById('studentEmail').textContent = user.email || 'N/A';
    // Student ID field removed - no longer needed
    document.getElementById('gradeLevel').textContent = user.grade_level ? `Grade ${user.grade_level}` : 'N/A';
    document.getElementById('strand').textContent = user.strand || 'N/A';
    
    // Display in personal info section
    document.getElementById('displayFullName').textContent = fullName || 'N/A';
    document.getElementById('displayEmail').textContent = user.email || 'N/A';
    // Student ID field removed - no longer needed
    document.getElementById('displayGradeLevel').textContent = user.grade_level ? `Grade ${user.grade_level}` : 'N/A';
    document.getElementById('displayStrand').textContent = user.strand || 'N/A';

    const editFirstName = document.getElementById('editFirstName');
    const editLastName = document.getElementById('editLastName');
    if (editFirstName) editFirstName.value = user.first_name || '';
    if (editLastName) editLastName.value = user.last_name || '';
}

// Display profile picture (path from API: uploads/profiles/filename or null)
function displayProfilePicture(profilePicture) {
    const img = document.getElementById('profilePicture');
    const placeholder = document.getElementById('profilePicturePlaceholder');
    if (!img || !placeholder) return;
    
    if (profilePicture && profilePicture.trim() !== '') {
        img.src = profilePicture;
        img.classList.remove('hidden');
        placeholder.classList.add('hidden');
    } else {
        img.src = '';
        img.classList.add('hidden');
        placeholder.classList.remove('hidden');
    }
}

function applyNavProfile(user, bustCache = false) {
    if (!user) return;
    const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Student';
    const rawPicture = user.profile_picture_url || user.profile_picture || '';
    const profilePicture = rawPicture && rawPicture.trim() !== ''
        ? rawPicture + (bustCache ? `?t=${Date.now()}` : '')
        : '';

    const userNameElement = document.getElementById('userName');
    if (userNameElement) userNameElement.textContent = userName;

    const profileIconImage = document.getElementById('profileIconImage');
    const profileIconPlaceholder = document.getElementById('profileIconPlaceholder');
    const profileIconContainer = document.getElementById('profileIconContainer');

    if (!profileIconImage || !profileIconPlaceholder) return;

    if (profilePicture) {
        profileIconImage.src = profilePicture;
        profileIconImage.classList.remove('hidden');
        profileIconPlaceholder.classList.add('hidden');
        if (profileIconContainer) {
            profileIconContainer.classList.remove('bg-gradient-to-br', 'from-indigo-500', 'to-violet-600');
            profileIconContainer.classList.add('bg-slate-200');
        }
    } else {
        profileIconImage.classList.add('hidden');
        profileIconPlaceholder.classList.remove('hidden');
        if (profileIconContainer) {
            profileIconContainer.classList.add('bg-gradient-to-br', 'from-indigo-500', 'to-violet-600');
            profileIconContainer.classList.remove('bg-slate-200');
        }
    }
}

// Display badges
function displayBadges(badges) {
    const container = document.getElementById('badgesContainer');
    
    if (!badges || badges.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-8">
                <i class="fas fa-trophy text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">No badges earned yet</p>
                <p class="text-gray-400 text-sm mt-2">Complete lessons and quizzes to earn badges!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = badges.map(badge => `
        <div class="badge-card bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200 text-center">
            <div class="text-4xl mb-2">${badge.icon_url || '🏆'}</div>
            <h3 class="font-bold text-gray-800 text-sm mb-1">${badge.name || 'Badge'}</h3>
            <p class="text-xs text-gray-600">${badge.description || ''}</p>
            <p class="text-xs text-gray-400 mt-2">Earned: ${formatDate(badge.earned_at)}</p>
        </div>
    `).join('');
}

// Display lessons
function displayLessons(lessons) {
    const container = document.getElementById('lessonsContainer');
    
    if (!lessons || lessons.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-book-open text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">No topics completed yet</p>
                <a href="dashboard.php#learning-path" class="text-primary hover:underline mt-2 inline-block">Go to learning path</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = lessons.map(lesson => `
        <div class="flex items-center justify-between p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
            <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <i class="fas fa-check text-white"></i>
                </div>
                <div>
                    <h3 class="font-semibold text-gray-800">${lesson.topic_name || 'Lesson'}</h3>
                    <p class="text-sm text-gray-600">Topic ${lesson.lesson_number || ''}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-sm text-gray-500">Completed</p>
                <p class="text-xs text-gray-400">${formatDate(lesson.completed_at)}</p>
            </div>
        </div>
    `).join('');
}

/** Topic/lesson pages use quiz_type like *_topic_N, *_lesson_N, or *-lesson-N; /quiz pages use short slugs. */
function isTopicLessonQuiz(quizType) {
    if (!quizType || typeof quizType !== 'string') return false;
    const t = quizType.trim();
    return /_topic_\d+$/i.test(t) || /_lesson_\d+$/i.test(t) || /-lesson-\d+$/i.test(t);
}

function renderQuizCards(quizzes) {
    return quizzes.map((quiz) => {
        const percentage = quiz.total_questions > 0 ? Math.round((quiz.score / quiz.total_questions) * 100) : 0;
        const colorClass = percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600';
        const bgClass = percentage >= 80 ? 'bg-green-50 border-green-500' : percentage >= 60 ? 'bg-yellow-50 border-yellow-500' : 'bg-red-50 border-red-500';

        return `
            <div class="flex items-center justify-between p-4 ${bgClass} rounded-lg border-l-4">
                <div class="flex items-center space-x-4 min-w-0">
                    <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-clipboard-check text-white"></i>
                    </div>
                    <div class="min-w-0">
                        <h3 class="font-semibold text-gray-800 break-words">${formatQuizType(quiz.quiz_type)}</h3>
                        <p class="text-sm text-gray-600">${quiz.score}/${quiz.total_questions} correct</p>
                    </div>
                </div>
                <div class="text-right flex-shrink-0 ml-2">
                    <p class="font-bold ${colorClass}">${percentage}%</p>
                    <p class="text-xs text-gray-400">${formatDate(quiz.completed_at)}</p>
                </div>
            </div>
        `;
    }).join('');
}

function displayQuizzesSplit(quizzes) {
    const list = Array.isArray(quizzes) ? quizzes : [];
    const topicQuizzes = list.filter((q) => isTopicLessonQuiz(q.quiz_type));
    const standaloneQuizzes = list.filter((q) => !isTopicLessonQuiz(q.quiz_type));

    const topicEl = document.getElementById('topicQuizzesContainer');
    const standaloneEl = document.getElementById('standaloneQuizzesContainer');

    if (topicEl) {
        if (topicQuizzes.length === 0) {
            topicEl.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-layer-group text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg">No topic quizzes yet</p>
                    <a href="dashboard.php#learning-path" class="text-primary hover:underline mt-2 inline-block">Open a topic</a>
                </div>
            `;
        } else {
            topicEl.innerHTML = renderQuizCards(topicQuizzes);
        }
    }

    if (standaloneEl) {
        if (standaloneQuizzes.length === 0) {
            standaloneEl.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-clipboard-check text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg">No course quizzes yet</p>
                    <a href="quizzes.php" class="text-primary hover:underline mt-2 inline-block">Take a quiz</a>
                </div>
            `;
        } else {
            standaloneEl.innerHTML = renderQuizCards(standaloneQuizzes);
        }
    }
}

// Display statistics
function displayStatistics(data) {
    const badges = data.badges || [];
    const lessons = data.lessons || [];
    const quizzes = data.quizzes || [];
    const topicQuizzes = quizzes.filter((q) => isTopicLessonQuiz(q.quiz_type));
    const standaloneQuizzes = quizzes.filter((q) => !isTopicLessonQuiz(q.quiz_type));

    document.getElementById('totalBadges').textContent = badges.length;
    document.getElementById('completedLessons').textContent = lessons.length;

    const topicCountEl = document.getElementById('topicQuizCount');
    const standaloneCountEl = document.getElementById('standaloneQuizCount');
    if (topicCountEl) topicCountEl.textContent = topicQuizzes.length;
    if (standaloneCountEl) standaloneCountEl.textContent = standaloneQuizzes.length;

    const totalCorrect = quizzes.reduce((sum, q) => sum + (q.score || 0), 0);
    if (quizzes.length > 0) {
        const totalQuestions = quizzes.reduce((sum, q) => sum + (q.total_questions || 0), 0);
        const averagePercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
        document.getElementById('averageScore').textContent = averagePercentage + '%';
    } else {
        document.getElementById('averageScore').textContent = '0%';
    }
    
    // Display last login
    if (data.user && data.user.last_login) {
        document.getElementById('lastLogin').textContent = formatDate(data.user.last_login);
    }
    
    // Display total study time (if available)
    if (data.study_time) {
        const hours = Math.floor(data.study_time / 3600);
        const minutes = Math.floor((data.study_time % 3600) / 60);
        if (hours > 0) {
            document.getElementById('totalStudyTime').textContent = `${hours}h ${minutes}m`;
        } else {
            document.getElementById('totalStudyTime').textContent = `${minutes}m`;
        }
    }
}

// Upload profile picture
async function uploadProfilePicture(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        Swal.fire({
            title: 'Invalid File',
            text: 'Please select an image file.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
            title: 'File Too Large',
            text: 'Please select an image smaller than 5MB.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return;
    }
    
    // Show loading
    Swal.fire({
        title: 'Uploading...',
        text: 'Please wait while we upload your profile picture.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        const formData = new FormData();
        formData.append('profile_picture', file);
        
        const response = await fetch('php/upload-profile-picture.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update profile picture display (path from server: uploads/profiles/filename)
            const uploadedProfilePicture = result.profile_picture_url || result.profile_picture;
            if (uploadedProfilePicture) {
                displayProfilePicture(uploadedProfilePicture + '?t=' + Date.now());
                profileData = profileData || {};
                profileData.user = profileData.user || {};
                profileData.user.profile_picture = uploadedProfilePicture;
                profileData.user.profile_picture_url = uploadedProfilePicture;
                applyNavProfile(profileData.user, true);
            }
            // Reset file input so same file can be selected again
            event.target.value = '';
            
            Swal.fire({
                title: 'Success!',
                text: 'Profile picture uploaded and saved. It will appear in the header on other pages.',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        } else {
            throw new Error(result.message || 'Upload failed');
        }
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        Swal.fire({
            title: 'Upload Failed',
            text: error.message || 'Failed to upload profile picture. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Handle change password
async function handleChangePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords
    if (!isStrongPassword(newPassword)) {
        Swal.fire({
            title: 'Invalid Password',
            text: 'Use 8-30 chars with uppercase, lowercase, number, and special character.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return;
    }

    if (currentPassword === newPassword) {
        Swal.fire({
            title: 'Invalid Password',
            text: 'New password must be different from current password.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return;
    }
    
    if (newPassword !== confirmPassword) {
        Swal.fire({
            title: 'Password Mismatch',
            text: 'New password and confirm password do not match.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return;
    }
    
    // Show loading
    Swal.fire({
        title: 'Changing Password...',
        text: 'Please wait.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        const response = await fetch('php/change-password.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            }),
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            Swal.fire({
                title: 'Success!',
                text: 'Password changed successfully.',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                // Clear form
                document.getElementById('changePasswordForm').reset();
            });
        } else {
            throw new Error(result.message || 'Failed to change password');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        Swal.fire({
            title: 'Error',
            text: error.message || 'Failed to change password. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Edit personal info (placeholder - can be expanded)
function editPersonalInfo() {
    isEditingPersonalInfo = true;
    togglePersonalInfoEdit(true);
}

function cancelEditPersonalInfo() {
    isEditingPersonalInfo = false;
    togglePersonalInfoEdit(false);
    if (profileData && profileData.user) {
        displayPersonalInfo(profileData.user);
    }
}

async function savePersonalInfo() {
    const firstName = (document.getElementById('editFirstName')?.value || '').trim();
    const lastName = (document.getElementById('editLastName')?.value || '').trim();

    if (!firstName || !lastName) {
        Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'First name and last name are required.' });
        return;
    }

    try {
        const response = await fetch('php/update-profile.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName
            })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Failed to update profile');

        profileData = profileData || {};
        profileData.user = result.user;
        displayPersonalInfo(result.user);
        applyNavProfile(result.user);
        isEditingPersonalInfo = false;
        togglePersonalInfoEdit(false);

        Swal.fire({
            title: 'Saved',
            text: 'Personal information updated successfully.',
            icon: 'success',
            confirmButtonText: 'OK'
        });
    } catch (error) {
        Swal.fire({
            title: 'Update Failed',
            text: error.message || 'Could not update profile.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Format quiz type
function formatQuizType(quizType) {
    if (!quizType) return 'Quiz';
    
    // Convert quiz_type to readable format
    const formatted = quizType
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    
    return formatted;
}

function togglePasswordVisibility(inputId, buttonEl) {
    const input = document.getElementById(inputId);
    if (!input || !buttonEl) return;
    const icon = buttonEl.querySelector('i');
    const hidden = input.type === 'password';
    input.type = hidden ? 'text' : 'password';
    if (icon) {
        icon.classList.toggle('fa-eye', !hidden);
        icon.classList.toggle('fa-eye-slash', hidden);
    }
}

function isStrongPassword(password) {
    if (!password || password.length < 8 || password.length > 30) return false;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    return hasLower && hasUpper && hasNumber && hasSpecial;
}

function togglePersonalInfoEdit(show) {
    const ids = ['editNameRow', 'editActions'];
    ids.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle('hidden', !show);
    });
}

function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    const icon = document.getElementById('profileDropdownIcon');
    if (!dropdown) return;
    const isHidden = dropdown.classList.contains('hidden');
    dropdown.classList.toggle('hidden', !isHidden);
    if (icon) icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
}

// Logout: js/logout-confirm.js (confirmLogout)

function startProfileIconSync() {
    setInterval(async () => {
        try {
            const response = await fetch('php/user.php', {
                credentials: 'include',
                cache: 'no-store'
            });
            if (!response.ok) return;
            const data = await response.json();
            if (!data.success || !data.user) return;
            applyNavProfile(data.user, true);
        } catch (e) {
            console.error('Profile icon sync failed:', e);
        }
    }, 15000);
}

window.addEventListener('click', function (e) {
    const container = document.getElementById('profileDropdownContainer');
    const dropdown = document.getElementById('profileDropdown');
    if (!container || !dropdown) return;
    if (!container.contains(e.target)) {
        dropdown.classList.add('hidden');
        const icon = document.getElementById('profileDropdownIcon');
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
});
