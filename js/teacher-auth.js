// Teacher Authentication JavaScript functionality
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

    // Form validation - only for non-teacher forms
    const forms = document.querySelectorAll('form:not(#teacher-register-form):not(#teacher-login-form)');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateTeacherForm(this)) {
                e.preventDefault();
                showNotification('Please fix the errors in the form.', 'error');
            }
        });
    });

    // Teacher ID digit-only enforcement
    const teacherIdInput = document.getElementById('teacherId');
    if (teacherIdInput) {
        teacherIdInput.addEventListener('input', function(e) {
            // Remove any non-digit characters
            this.value = this.value.replace(/[^0-9]/g, '');
        });
        
        teacherIdInput.addEventListener('keypress', function(e) {
            // Prevent non-digit characters from being entered
            if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                e.preventDefault();
            }
        });
        
        teacherIdInput.addEventListener('paste', function(e) {
            // Handle paste events - only allow digits
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const digitsOnly = pastedText.replace(/[^0-9]/g, '');
            const currentValue = this.value;
            const start = this.selectionStart;
            const end = this.selectionEnd;
            
            // Insert digits at cursor position
            const newValue = currentValue.substring(0, start) + digitsOnly + currentValue.substring(end);
            this.value = newValue;
        });
    }

    // Real-time validation
    const inputs = document.querySelectorAll('input[required], select[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });

    // Teacher login form submission
    const teacherLoginForm = document.getElementById('teacher-login-form');
    if (teacherLoginForm) {
        teacherLoginForm.addEventListener('submit', handleTeacherLogin);
    }

    // Teacher register form submission
    const teacherRegisterForm = document.getElementById('teacher-register-form');
    if (teacherRegisterForm) {
        teacherRegisterForm.addEventListener('submit', handleTeacherRegister);
        
        // Also add click handler to button for debugging
        const submitBtn = teacherRegisterForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.addEventListener('click', function(e) {
                // Don't prevent default here, let the form submit handler take care of it
            });
        }
    }


    // Modal functionality
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
    const requirements = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^a-zA-Z0-9]/.test(password)
    };
    
    // Count met requirements
    Object.values(requirements).forEach(met => {
        if (met) score++;
    });
    
    let strength;
    if (score <= 2) strength = 'weak';
    else if (score === 3) strength = 'medium';
    else if (score === 4) strength = 'strong';
    else strength = 'very-strong';
    
    return { strength, requirements };
}

// Update password strength indicator
function updatePasswordStrength(indicator, strengthData) {
    const strength = typeof strengthData === 'string' ? strengthData : strengthData.strength;
    const requirements = strengthData.requirements || {};
    
    const strengthText = indicator.querySelector('.strength-text');
    
    // Remove existing strength classes
    indicator.className = 'password-strength';
    indicator.classList.add(`strength-${strength}`);
    
    // Update text
    const strengthLabels = {
        'weak': 'Weak Password',
        'medium': 'Fair Password',
        'strong': 'Strong Password',
        'very-strong': 'Very Strong Password'
    };
    
    strengthText.textContent = strengthLabels[strength];
    
    // Update requirements indicators
    const requirementElements = indicator.querySelectorAll('.requirement');
    requirementElements.forEach(elem => {
        const reqType = elem.getAttribute('data-requirement');
        if (requirements[reqType]) {
            elem.classList.add('met');
        } else {
            elem.classList.remove('met');
        }
    });
}

// Teacher-specific form validation
function validateTeacherForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    // Special validation for teacher registration form
    if (form.id === 'teacher-register-form') {
        const password = form.querySelector('#password');
        const confirmPassword = form.querySelector('#confirmPassword');
        const email = form.querySelector('#email');
        const teacherId = form.querySelector('#teacherId');
        
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
        
        // Teacher ID format validation (assuming alphanumeric format)
        if (teacherId && !isValidTeacherId(teacherId.value)) {
            showFieldError(teacherId, 'Teacher ID should be alphanumeric');
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
        // Special handling for checkboxes
        if (field.type === 'checkbox') {
            if (!field.checked) {
                showFieldError(field, 'This field is required');
                return false;
            }
        } else {
            showFieldError(field, 'This field is required');
            return false;
        }
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

// Teacher ID validation - more flexible to allow common formats
function isValidTeacherId(teacherId) {
    // Allow alphanumeric characters, hyphens, underscores, and spaces
    // Common teacher ID formats: T001, T-001, T_001, T 001, etc.
    return /^[A-Za-z0-9\s\-_]+$/.test(teacherId) && teacherId.trim().length >= 2;
}

// Handle teacher login form submission
async function handleTeacherLogin(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('php/teacher-login.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin',
            cache: 'no-store'
        });
        
        const data = await response.json();
        
        if (data.success) {
            const redirectUrl = data.redirect ? data.redirect.replace('..\\/', '').replace('../', '') : 'teacher-dashboard.html';
            Swal.fire({ icon: 'success', title: 'Login successful', text: 'Redirecting to teacher dashboard...', timer: 900, showConfirmButton: false });
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 500);
        } else {
            Swal.fire({ icon: 'error', title: 'Login failed', text: data.message || 'Please try again.' });
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred. Please try again.' });
        console.error('Teacher login error:', error);
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Handle teacher register form submission
async function handleTeacherRegister(e) {
    e.preventDefault();
    
    const form = e.target;
    
    // Check terms checkbox specifically
    const termsCheckbox = form.querySelector('#terms');
    
    if (termsCheckbox && !termsCheckbox.checked) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({ 
                icon: 'warning', 
                title: 'Terms Required', 
                text: 'Please agree to the Terms of Service and Privacy Policy to continue.' 
            });
        } else {
            showNotification('Please agree to the Terms of Service and Privacy Policy to continue.', 'warning');
        }
        return;
    }
    
    // Validate form before submission
    if (!validateTeacherForm(form)) {
        showNotification('Please fix the errors in the form.', 'error');
        return;
    }
    
    const formData = new FormData(form);
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('php/teacher-register.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin',
            cache: 'no-store'
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({ icon: 'success', title: 'Account created', text: 'Redirecting to teacher login...', timer: 1200, showConfirmButton: false });
                setTimeout(() => {
                    window.location.href = 'teacher-login.html';
                }, 1200);
            } else {
                alert('Account created successfully! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'teacher-login.html';
                }, 1000);
            }
        } else {
            if (typeof Swal !== 'undefined') {
                Swal.fire({ icon: 'error', title: 'Registration failed', text: data.message || 'Please try again.' });
            } else {
                alert('Registration failed: ' + (data.message || 'Please try again.'));
            }
        }
    } catch (error) {
        console.error('Teacher registration error:', error);
        if (typeof Swal !== 'undefined') {
            Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred. Please try again.' });
        } else {
            alert('An error occurred. Please try again.');
        }
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
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
        color: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.4;
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
            .notification-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                margin-left: 10px;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .notification-close:hover {
                opacity: 0.8;
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
    
    return notification;
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
window.TeacherModalUtils = {
    openModal,
    closeModal,
    initializeModals
};

// Also make openModal globally available for direct calls
window.openModal = openModal;
window.closeModal = closeModal;
