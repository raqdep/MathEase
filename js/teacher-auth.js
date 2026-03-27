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

    // Teacher ID field removed - no longer needed

    // First Name / Last Name: auto-capitalize first letter on blur
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    [firstNameInput, lastNameInput].forEach(input => {
        if (!input) return;
        input.addEventListener('blur', function() {
            const raw = this.value.trim();
            if (!raw) return;
            this.value = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
        });
    });

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

// Password strength calculation (8–30 chars, lowercase, uppercase, number, special)
function calculatePasswordStrength(password) {
    let score = 0;
    const requirements = {
        length: password.length >= 8 && password.length <= 30,
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

// Get password requirements (same rules: 8–30 chars + lowercase, uppercase, number, special)
function getPasswordRequirements(password) {
    return {
        length: password.length >= 8 && password.length <= 30,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^a-zA-Z0-9]/.test(password)
    };
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
        // Teacher ID field removed - no longer needed
        
        // Password: must meet ALL requirements (8–30 chars, lowercase, uppercase, number, special)
        if (password && password.value) {
            const req = getPasswordRequirements(password.value);
            const allMet = Object.values(req).every(Boolean);
            if (!allMet) {
                showFieldError(password, 'Password must meet all requirements above (8–30 characters, lowercase, uppercase, number, special character).');
                isValid = false;
            }
        }
        
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
        
        // Teacher ID validation removed - field no longer exists
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
    
    // Password validation (8–30 characters)
    if (field.type === 'password' && field.id === 'password' && value) {
        if (value.length < 8) {
            showFieldError(field, 'Password must be at least 8 characters');
            return false;
        }
        if (value.length > 30) {
            showFieldError(field, 'Password must be at most 30 characters');
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

// Teacher ID validation removed - field no longer exists

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
        
        // Check if response is ok
        if (!response.ok) {
            console.error('Response not OK:', response.status, response.statusText);
        }
        
        // Get response as text first to check if it's valid JSON
        const responseText = await response.text();
        let data;
        
        try {
            data = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('Failed to parse JSON response:', jsonError);
            console.error('Response text:', responseText);
            
            // Check if it's an HTML error page
            if (responseText.includes('<br />') || responseText.includes('<b>')) {
                Swal.fire({ 
                    icon: 'error', 
                    title: 'Server Error', 
                    html: '<p>A PHP error occurred on the server.</p><p>Please check server logs or contact administrator.</p><p style="font-size: 0.8em; color: #666;">Error details logged to console.</p>',
                    confirmButtonText: 'OK'
                });
            } else {
                Swal.fire({ 
                    icon: 'error', 
                    title: 'Server Error', 
                    text: 'Invalid response from server. Please try again.' 
                });
            }
            
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }
        
        if (data.success) {
            // Clean up redirect URL - handle both ../ and ..\/
            let redirectUrl = data.redirect || 'teacher-dashboard.html';
            redirectUrl = redirectUrl.replace(/^\.\.\/+/, '').replace(/^\.\.\\\/+/, '');
            
            const userType = data.user_type || 'teacher';
            const dashboardType = userType === 'admin' ? 'admin dashboard' : 'teacher dashboard';
            
            // If admin login, also set sessionStorage for admin dashboard compatibility
            if (userType === 'admin') {
                sessionStorage.setItem('admin_id', data.admin_id || '');
                sessionStorage.setItem('admin_name', data.admin_name || data.message.split(' ').slice(-1)[0] || 'Admin');
                sessionStorage.setItem('admin_role', data.admin_role || 'super_admin');
                sessionStorage.setItem('admin_email', data.admin_email || '');
            }
            
            Swal.fire({ 
                icon: 'success', 
                title: 'Login successful', 
                text: `Redirecting to ${dashboardType}...`, 
                timer: 900, 
                showConfirmButton: false 
            });
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 500);
        } else {
            if (data.error_type === 'maintenance') {
                Swal.fire({
                    icon: 'info',
                    title: 'System update',
                    text: data.message || 'MathEase is temporarily unavailable.',
                    confirmButtonColor: '#6366f1'
                });
                return;
            }
            // Show specific error on the correct field
            const errorField = data.field || 'email';
            const fieldElement = form.querySelector(`#${errorField}`);

            if (fieldElement && data.error_type) {
                // Show error on specific field
                showFieldError(fieldElement, data.message || 'Please check this field.');

                // Focus on the error field
                fieldElement.focus();
                
                // Also show a general notification
                Swal.fire({ 
                    icon: 'error', 
                    title: 'Login failed', 
                    text: data.message || 'Please try again.',
                    timer: 3000,
                    showConfirmButton: true
                });
            } else {
                // Fallback to general error message
                Swal.fire({ icon: 'error', title: 'Login failed', text: data.message || 'Please try again.' });
            }
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

// Show notification using SweetAlert2
function showNotification(message, type = 'info') {
    const icon = type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info';
    const title = type === 'error' ? 'Error' : type === 'success' ? 'Success' : type === 'warning' ? 'Notice' : 'Info';
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: icon,
            title: title,
            text: message,
            confirmButtonText: 'OK',
            customClass: { confirmButton: 'swal-confirm-btn' }
        });
    } else {
        alert(message);
    }
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
