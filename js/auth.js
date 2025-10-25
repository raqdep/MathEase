// Authentication JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    // Clear all form fields on page load to prevent autofill
    const clearFormFields = () => {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            // Only clear editable input fields, not readonly ones
            const inputs = form.querySelectorAll('input[type="text"]:not([readonly]), input[type="email"]:not([readonly]), input[type="password"]:not([readonly])');
            inputs.forEach(input => {
                input.value = '';
            });
            
            // Reset select elements to their default selected option
            const selects = form.querySelectorAll('select');
            selects.forEach(select => {
                const defaultOption = select.querySelector('option[selected]');
                if (defaultOption) {
                    select.value = defaultOption.value;
                } else {
                    select.selectedIndex = 0; // Select first option (usually placeholder)
                }
            });
        });
    };

    // Clear immediately and after a short delay to catch any browser autofill
    clearFormFields();
    setTimeout(clearFormFields, 100);
    setTimeout(clearFormFields, 500);

    // Password visibility toggle
    const passwordToggles = document.querySelectorAll('.toggle-password, .password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const container = this.closest('.input-group') || this.parentElement;
            const input = container.querySelector('input[type="password"], input[type="text"]');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
            } else {
                input.type = 'password';
                if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
            }
        });
    });

    // Password strength indicator
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        if (input.id === 'password' || input.id === 'confirmPassword') {
            input.addEventListener('input', function() {
                const strengthIndicator = document.querySelector('.password-strength');
                if (strengthIndicator && this.id === 'password') {
                    const strength = calculatePasswordStrength(this.value);
                    updatePasswordStrength(strengthIndicator, strength);
                }
            });
        }
    });

    // Form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
                showNotification('Please fix the errors in the form.', 'error');
            }
        });
    });

    // Real-time validation
    const inputs = document.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });

    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Register form submission
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Google Sign-In handlers
    const googleButtons = document.querySelectorAll('.btn-google');
    if (googleButtons.length) {
        googleButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                await handleGoogleAuth();
            });
        });
    }

    // Modal functionality - simplified approach
    initializeModals();
    
    // Fallback: Re-initialize modals after a short delay to catch any dynamically loaded content
    setTimeout(() => {
        initializeModals();
    }, 100);
});

// Global password toggle for inline onclick handlers
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const group = input.closest('.input-group') || input.parentElement;
    const button = group ? group.querySelector('.toggle-password') : null;
    const icon = button ? button.querySelector('i') : null;
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
    } else {
        input.type = 'password';
        if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
    }
}
window.togglePassword = togglePassword;

// Password strength calculation
function calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.match(/[a-z]/)) score++;
    if (password.match(/[A-Z]/)) score++;
    if (password.match(/[0-9]/)) score++;
    if (password.match(/[^a-zA-Z0-9]/)) score++;
    
    if (score <= 2) return 'weak';
    if (score <= 3) return 'medium';
    if (score <= 4) return 'strong';
    return 'very-strong';
}

// Update password strength indicator
function updatePasswordStrength(indicator, strength) {
    const strengthText = indicator.querySelector('.strength-text');
    const strengthBar = indicator.querySelector('.strength-bar');
    
    // Remove existing strength classes
    indicator.className = 'password-strength';
    indicator.classList.add(`strength-${strength}`);
    
    // Update text and bar
    const strengthLabels = {
        'weak': 'Weak',
        'medium': 'Medium',
        'strong': 'Strong',
        'very-strong': 'Very Strong'
    };
    
    strengthText.textContent = strengthLabels[strength];
    
    // Update progress bar
    const strengthValues = {
        'weak': 25,
        'medium': 50,
        'strong': 75,
        'very-strong': 100
    };
    
    strengthBar.style.width = strengthValues[strength] + '%';
}

// Form validation
function validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    // Special validation for registration form
    if (form.id === 'register-form') {
        const password = form.querySelector('#password');
        const confirmPassword = form.querySelector('#confirmPassword');
        const email = form.querySelector('#email');
        const studentId = form.querySelector('#lrn');
        
        // Password confirmation validation
        if (password && confirmPassword && password.value !== confirmPassword.value) {
            showFieldError(confirmPassword, 'Passwords do not match');
            isValid = false;
        }
        
        // Email format validation
        if (email && !isValidEmail(email.value)) {
            showFieldError(email, 'Please enter a valid email address');
            isValid = false;
        }
        
        // LRN format validation (12-digit format)
        if (studentId && !isValidLRN(studentId.value)) {
            showFieldError(studentId, 'LRN should be 12 digits');
            isValid = false;
        }
    }
    
    return isValid;
}

// Field validation
function validateField(field) {
    const value = field.value.trim();
    
    // Clear previous errors
    clearFieldError(field);
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Email validation
    if (field.type === 'email' && value && !isValidEmail(value)) {
        showFieldError(field, 'Please enter a valid email address');
        return false;
    }
    
    // Password validation
    if (field.type === 'password' && value) {
        if (value.length < 8) {
            showFieldError(field, 'Password must be at least 8 characters long');
            return false;
        }
    }
    
    return true;
}

// Show field error
function showFieldError(field, message) {
    const formGroup = field.closest('.form-group') || field.parentNode;
    const inputGroup = field.closest('.input-group') || field.parentNode;

    // Remove any existing error first
    const existing = formGroup.querySelector('.field-error');
    if (existing) existing.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.setAttribute('role', 'alert');

    // Highlight
    field.classList.add('error');
    formGroup.classList.add('has-error');

    // Place error directly after the input group for consistent layout
    if (inputGroup && inputGroup.parentNode) {
        inputGroup.parentNode.insertBefore(errorDiv, inputGroup.nextSibling);
    } else {
        formGroup.appendChild(errorDiv);
    }
}

// Clear field error
function clearFieldError(field) {
    const formGroup = field.closest('.form-group') || field.parentNode;
    const errorDiv = formGroup.querySelector('.field-error');
    if (errorDiv) errorDiv.remove();
    field.classList.remove('error');
    formGroup.classList.remove('has-error');
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// LRN validation (12-digit format)
function isValidLRN(lrn) {
    return /^\d{12}$/.test(lrn);
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('php/login.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin',
            cache: 'no-store'
        });
        
        // Read response text first, then try to parse JSON. This avoids "body stream already read" errors.
        let data;
        const respText = await response.text();
        try {
            data = JSON.parse(respText);
        } catch (parseErr) {
            console.error('Registration server response (non-JSON):', respText);
            Swal.fire({ icon: 'error', title: 'Server error', html: '<pre style="white-space:pre-wrap;">' + escapeHtml(respText) + '</pre>' });
            return;
        }

        if (data.success) {
            const redirectUrl = data.redirect ? data.redirect.replace('..\\/', '').replace('../', '') : 'dashboard.html';
            Swal.fire({ icon: 'success', title: 'Login successful', text: 'Redirecting to dashboard...', timer: 900, showConfirmButton: false });
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 500);
        } else {
            Swal.fire({ icon: 'error', title: 'Login failed', text: data.message || 'Please try again.' });
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred. Please try again.' });
        console.error('Login error:', error);
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Handle register form submission
async function handleRegister(e) {
    e.preventDefault();
    
    const form = e.target;
    // run client-side validation first
    if (!validateForm(form)) {
        showNotification('Please fix the errors in the form before submitting.', 'error');
        return;
    }
    const formData = new FormData(form);
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('php/register.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin',
            cache: 'no-store'
        });

        // Read the response body once, then attempt to parse JSON. This avoids
        // "body stream already read" errors when the server returns non-JSON.
        let data = null;
        const respText = await response.text();
        try {
            data = JSON.parse(respText);
        } catch (parseErr) {
            console.error('Registration server response (non-JSON):', respText);
            Swal.fire({ icon: 'error', title: 'Server error', html: '<pre style="white-space:pre-wrap;">' + escapeHtml(respText) + '</pre>' });
            return;
        }
        
        if (data.success) {
            // Registration successful - redirect to login
            Swal.fire({ icon: 'success', title: 'Account created', text: 'Registration successful! Redirecting to login...', timer: 1200, showConfirmButton: false });
            setTimeout(() => { window.location.href = 'login.html'; }, 1200);
        } else {
            Swal.fire({ icon: 'error', title: 'Registration failed', text: data.message || 'Please try again.' });
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred. Please try again.' });
        console.error('Registration error:', error);
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}



// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    // Add animation keyframes
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
    
    // Add to page
    document.body.appendChild(notification);
}

// Escape HTML for safe display
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Social login handlers (placeholder functions)
function handleGoogleLogin() {
    showNotification('Google login functionality coming soon!', 'info');
}

function handleFacebookLogin() {
    showNotification('Facebook login functionality coming soon!', 'info');
}

// Export functions for global access
window.authUtils = {
    showNotification,
    validateForm,
    validateField,
    calculatePasswordStrength
};

// Google Auth + OTP Flow
async function handleGoogleAuth() {
    try {
        if (!window.google || !google.accounts || !google.accounts.id) {
            Swal.fire({ icon: 'error', title: 'Google not ready', text: 'Please try again in a moment.' });
            return;
        }

        const idToken = await getGoogleIdToken();
        if (!idToken) return;

        const verifyResp = await fetch('php/google_login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ id_token: idToken }).toString(),
            credentials: 'same-origin',
            cache: 'no-store'
        });

        const data = await verifyResp.json();
        if (!data.success) {
            Swal.fire({ icon: 'error', title: 'Google sign-in failed', text: data.message || 'Please try again.' });
            return;
        }

        if (data.requireOtp) {
            const { value: code } = await Swal.fire({
                title: 'Enter OTP',
                input: 'text',
                inputLabel: 'We sent a 6-digit code to your email',
                inputPlaceholder: '123456',
                inputAttributes: { maxlength: 6, autocapitalize: 'off', autocorrect: 'off' },
                confirmButtonText: 'Verify',
                showCancelButton: true,
                allowOutsideClick: false
            });

            if (!code) return;

            const otpResp = await fetch('php/verify_otp.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ code: code }).toString(),
                credentials: 'same-origin',
                cache: 'no-store'
            });

            const otpData = await otpResp.json();
            if (otpData.success) {
                const redirectUrl = (otpData.redirect || 'dashboard.html').replace('..\/', '').replace('../', '');
                Swal.fire({ icon: 'success', title: 'Verified', text: 'Redirecting...', timer: 900, showConfirmButton: false });
                setTimeout(() => { window.location.href = redirectUrl; }, 600);
            } else {
                Swal.fire({ icon: 'error', title: 'Invalid code', text: otpData.message || 'Please try again.' });
            }
        } else {
            const redirectUrl = (data.redirect || 'dashboard.html').replace('..\/', '').replace('../', '');
            window.location.href = redirectUrl;
        }
    } catch (err) {
        console.error('Google auth error:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred. Please try again.' });
    }
}

function getGoogleIdToken() {
    return new Promise((resolve) => {
        try {
            const clientId = window.GOOGLE_CLIENT_ID || document.querySelector('meta[name="google-client-id"]')?.content;
            if (!clientId) {
                console.warn('Missing GOOGLE_CLIENT_ID');
            }

            google.accounts.id.initialize({
                client_id: clientId || 'REPLACE_WITH_YOUR_GOOGLE_CLIENT_ID',
                callback: (response) => {
                    resolve(response && response.credential ? response.credential : null);
                }
            });
            // Use One Tap prompt to obtain token
            google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    // Fallback to a popup button
                    google.accounts.id.renderButton(document.body, { theme: 'outline', size: 'large' });
                }
            });
        } catch (e) {
            console.error('GIS error:', e);
            resolve(null);
        }
    });
}

// Modal functionality
function initializeModals() {
    // Get all modal links
    const modalLinks = document.querySelectorAll('.modal-link');
    
    // Get all modals
    const modals = document.querySelectorAll('.modal');
    
    // Add click event listeners to modal links
    modalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const modalId = this.getAttribute('data-modal');
            if (modalId) {
                // Add a small delay to prevent immediate closing
                setTimeout(() => {
                    openModal(modalId);
                }, 10);
            }
        });
    });
    
    // Add click event listeners to close buttons
    const closeButtons = document.querySelectorAll('.modal .close, .modal [data-modal]');
    closeButtons.forEach(button => {
        if (button.getAttribute('data-modal')) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const modalId = this.getAttribute('data-modal');
                closeModal(modalId);
            });
        }
    });
    
    // Close modal when clicking outside of it
    modals.forEach(modal => {
        // Prevent modal from closing when clicking inside modal content
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    });
    
    // Disable closing modal with Escape key
    // (No-op to prevent auto close)
    // document.addEventListener('keydown', function(e) {
    //     if (e.key === 'Escape') {
    //         const openModal = document.querySelector('.modal.show');
    //         if (openModal) {
    //             closeModal(openModal.id);
    //         }
    //     }
    // });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    
    if (!modal) {
        return;
    }
    
    // Close any other open modals first
    const openModals = document.querySelectorAll('.modal.show');
    openModals.forEach(openModal => {
        if (openModal.id !== modalId) {
            closeModal(openModal.id);
        }
    });
    
    // Show the modal
    modal.style.display = 'flex';
    modal.style.opacity = '0';
    modal.classList.add('show');
    
    // Force a reflow to ensure the display change takes effect
    modal.offsetHeight;
    
    // Add the show class to trigger the animation
    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);
    
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    
    // Add a flag to prevent immediate closing
    modal.setAttribute('data-opening', 'true');
    setTimeout(() => {
        modal.removeAttribute('data-opening');
    }, 100);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        // Don't close if modal is still opening
        if (modal.getAttribute('data-opening') === 'true') {
            return;
        }
        
        modal.classList.remove('show');
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300); // Wait for animation to complete
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Export modal functions for global access
window.ModalUtils = {
    openModal,
    closeModal,
    initializeModals
};

// Also make openModal globally available for direct calls
window.openModal = openModal;
window.closeModal = closeModal;
