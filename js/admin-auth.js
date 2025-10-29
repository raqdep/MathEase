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

    // Auto-fill admin credentials for testing (remove in production)
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        if (emailInput) emailInput.value = 'matheasenc@gmail.com';
        if (passwordInput) passwordInput.value = 'MathEase123!!!';
    }
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
function checkAdminAuth() {
    const adminId = sessionStorage.getItem('admin_id');
    if (!adminId) {
        window.location.href = 'admin-login.html';
        return false;
    }
    return true;
}

// Admin logout
function adminLogout() {
    sessionStorage.removeItem('admin_id');
    sessionStorage.removeItem('admin_name');
    sessionStorage.removeItem('admin_role');
    window.location.href = 'admin-login.html';
}
