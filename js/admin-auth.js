// Admin Authentication JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('admin-login-form');
    const togglePasswordBtn = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');

    // Toggle password visibility
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }

    // Handle admin login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
    }

    // Optional: pre-fill admin email for convenience (matches setup-admin.php default)
    // if (document.getElementById('email')) document.getElementById('email').value = 'matheasenc2025@gmail.com';
});

async function handleAdminLogin(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('php/admin-login.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin',
            cache: 'no-store'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store admin session info
            sessionStorage.setItem('admin_id', data.admin_id);
            sessionStorage.setItem('admin_name', data.admin_name);
            sessionStorage.setItem('admin_role', data.admin_role);
            
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: 'Welcome Admin!',
                    text: 'Redirecting to admin dashboard...',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1500);
        } else {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Login Failed',
                    text: data.message || 'Invalid credentials. Please try again.'
                });
            } else {
                alert('Login failed: ' + (data.message || 'Invalid credentials. Please try again.'));
            }
        }
    } catch (error) {
        console.error('Admin login error:', error);
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred. Please try again.'
            });
        } else {
            alert('An error occurred. Please try again.');
        }
    } finally {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Check if admin is logged in
async function checkAdminAuth() {
    // First check sessionStorage (for backward compatibility)
    const adminId = sessionStorage.getItem('admin_id');
    if (adminId) {
        return true;
    }
    
    // If not in sessionStorage, check PHP session via API
    try {
        const response = await fetch('php/check-admin-session.php', {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store'
        });
        
        const data = await response.json();
        
        if (data.success && data.logged_in) {
            // Admin is logged in via PHP session, store in sessionStorage
            sessionStorage.setItem('admin_id', data.admin_id);
            sessionStorage.setItem('admin_name', data.admin_name);
            sessionStorage.setItem('admin_role', data.admin_role);
            sessionStorage.setItem('admin_email', data.admin_email);
            return true;
        } else {
            window.location.href = 'teacher-login.html?from=admin';
            return false;
        }
    } catch (error) {
        console.error('Error checking admin session:', error);
        window.location.href = 'teacher-login.html?from=admin';
        return false;
    }
}

// Admin logout — use unified portal (same page as teachers; admins redirect after login)
function adminLogout() {
    const doLogout = () => {
        sessionStorage.removeItem('admin_id');
        sessionStorage.removeItem('admin_name');
        sessionStorage.removeItem('admin_role');
        sessionStorage.removeItem('admin_email');
        window.location.href = 'php/admin-logout.php';
    };

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'warning',
            title: 'Sign out?',
            text: 'You will be logged out of the admin dashboard.',
            showCancelButton: true,
            confirmButtonText: 'Yes, sign out',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc2626'
        }).then((result) => {
            if (result.isConfirmed) doLogout();
        });
        return;
    }

    if (window.confirm('Sign out of the admin dashboard?')) {
        doLogout();
    }
}

window.adminLogout = adminLogout;
