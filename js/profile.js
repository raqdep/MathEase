// Profile Page JavaScript

let profileData = null;

// Initialize profile page
document.addEventListener('DOMContentLoaded', async function() {
    await loadProfileData();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Change password form
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
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
        displayProfilePicture(profileResult.user.profile_picture);
        displayBadges(profileResult.badges);
        displayLessons(profileResult.lessons);
        displayQuizzes(profileResult.quizzes);
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
                <p class="text-gray-500 text-lg">No lessons completed yet</p>
                <a href="topics/functions.html" class="text-primary hover:underline mt-2 inline-block">Start Learning</a>
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

// Display quizzes
function displayQuizzes(quizzes) {
    const container = document.getElementById('quizzesContainer');
    
    if (!quizzes || quizzes.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-clipboard-check text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">No quizzes taken yet</p>
                <a href="quizzes.html" class="text-primary hover:underline mt-2 inline-block">Take a Quiz</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = quizzes.map(quiz => {
        const percentage = quiz.total_questions > 0 ? Math.round((quiz.score / quiz.total_questions) * 100) : 0;
        const colorClass = percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600';
        const bgClass = percentage >= 80 ? 'bg-green-50 border-green-500' : percentage >= 60 ? 'bg-yellow-50 border-yellow-500' : 'bg-red-50 border-red-500';
        
        return `
            <div class="flex items-center justify-between p-4 ${bgClass} rounded-lg border-l-4">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <i class="fas fa-clipboard-check text-white"></i>
                    </div>
                    <div>
                        <h3 class="font-semibold text-gray-800">${formatQuizType(quiz.quiz_type)}</h3>
                        <p class="text-sm text-gray-600">Score: ${quiz.score}/${quiz.total_questions}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-bold ${colorClass}">${percentage}%</p>
                    <p class="text-xs text-gray-400">${formatDate(quiz.completed_at)}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Display statistics
function displayStatistics(data) {
    const badges = data.badges || [];
    const lessons = data.lessons || [];
    const quizzes = data.quizzes || [];
    
    document.getElementById('totalBadges').textContent = badges.length;
    document.getElementById('completedLessons').textContent = lessons.length;
    document.getElementById('completedQuizzes').textContent = quizzes.length;
    
    // Calculate total score
    const totalScore = quizzes.reduce((sum, q) => sum + (q.score || 0), 0);
    document.getElementById('totalScore').textContent = totalScore;
    
    // Calculate average score
    if (quizzes.length > 0) {
        const totalQuestions = quizzes.reduce((sum, q) => sum + (q.total_questions || 0), 0);
        const averagePercentage = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
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
            if (result.profile_picture) {
                displayProfilePicture(result.profile_picture + '?t=' + Date.now());
            }
            // Reset file input so same file can be selected again
            event.target.value = '';
            // Notify other pages (dashboard, topics) to refresh profile icons
            localStorage.setItem('mathease-profile-updated', Date.now().toString());
            
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
    if (newPassword.length < 6) {
        Swal.fire({
            title: 'Invalid Password',
            text: 'Password must be at least 6 characters long.',
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
    Swal.fire({
        title: 'Edit Personal Information',
        text: 'This feature is coming soon! Contact your administrator to update your information.',
        icon: 'info',
        confirmButtonText: 'OK'
    });
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
