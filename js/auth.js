// Authentication JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    // TEMPORARILY DISABLED: Clear form fields only once on page load to prevent autofill
    // This was causing issues with form submission
    /*
    const clearFormFields = () => {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            // Only clear password fields to prevent autofill, leave other fields alone
            const passwordInputs = form.querySelectorAll('input[type="password"]');
            passwordInputs.forEach(input => {
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

    // Clear only once on page load
    clearFormFields();
    */

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

    // LRN digit-only enforcement
    const lrnInput = document.getElementById('lrn');
    if (lrnInput) {
        lrnInput.addEventListener('input', function(e) {
            // Remove any non-digit characters
            this.value = this.value.replace(/[^0-9]/g, '');
        });
        
        lrnInput.addEventListener('keypress', function(e) {
            // Prevent non-digit characters from being entered
            if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                e.preventDefault();
            }
        });
        
        lrnInput.addEventListener('paste', function(e) {
            // Handle paste events - only allow digits
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const digitsOnly = pastedText.replace(/[^0-9]/g, '');
            const currentValue = this.value;
            const start = this.selectionStart;
            const end = this.selectionEnd;
            
            // Insert digits at cursor position, respecting maxlength
            const newValue = currentValue.substring(0, start) + digitsOnly + currentValue.substring(end);
            this.value = newValue.substring(0, 12); // Respect maxlength of 12
        });
    }

    // Email existence check
    const emailInput = document.getElementById('email');
    if (emailInput) {
        let emailCheckTimeout;
        emailInput.addEventListener('input', function() {
            clearTimeout(emailCheckTimeout);
            const email = this.value.trim();
            
            if (email && email.includes('@')) {
                emailCheckTimeout = setTimeout(() => {
                    checkEmailExistence(email);
                }, 1000); // Wait 1 second after user stops typing
            }
        });
    }

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
    
    // Debug: Log field validation
    console.log(`Validating field ${field.name || field.id}: value='${value}', required=${field.hasAttribute('required')}`);
    
    // Clear previous errors
    clearFieldError(field);
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        console.log(`Field ${field.name || field.id} is required but empty`);
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

// Show field success message (green)
function showFieldSuccess(field, message) {
    const formGroup = field.closest('.form-group') || field.parentNode;
    const inputGroup = field.closest('.input-group') || field.parentNode;

    // Remove any existing error/success first
    const existing = formGroup.querySelector('.field-error, .field-success');
    if (existing) existing.remove();

    const successDiv = document.createElement('div');
    successDiv.className = 'field-success';
    successDiv.textContent = message;
    successDiv.setAttribute('role', 'alert');
    successDiv.style.color = '#28a745';
    successDiv.style.fontSize = '14px';
    successDiv.style.marginTop = '5px';
    successDiv.style.fontWeight = '500';

    // Remove error classes and add success classes
    field.classList.remove('error');
    field.classList.add('success');
    formGroup.classList.remove('has-error');
    formGroup.classList.add('has-success');

    // Place success message directly after the input group for consistent layout
    if (inputGroup && inputGroup.parentNode) {
        inputGroup.parentNode.insertBefore(successDiv, inputGroup.nextSibling);
    } else {
        formGroup.appendChild(successDiv);
    }
}

// Clear field error/success
function clearFieldError(field) {
    const formGroup = field.closest('.form-group') || field.parentNode;
    const errorDiv = formGroup.querySelector('.field-error');
    const successDiv = formGroup.querySelector('.field-success');
    if (errorDiv) errorDiv.remove();
    if (successDiv) successDiv.remove();
    field.classList.remove('error', 'success');
    formGroup.classList.remove('has-error', 'has-success');
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
    
    // Debug: Log form data before validation
    console.log('Form data before validation:');
    const formData = new FormData(form);
    for (let [key, value] of formData.entries()) {
        console.log(key + ': ' + value);
    }
    
    // Check email field specifically
    const emailField = form.querySelector('#email');
    console.log('Email field value:', emailField ? emailField.value : 'Email field not found');
    
    // run client-side validation first
    console.log('Starting form validation...');
    const validationResult = validateForm(form);
    console.log('Form validation result:', validationResult);
    
    if (!validationResult) {
        console.log('Form validation failed - preventing submission');
        showNotification('Please fix the errors in the form before submitting.', 'error');
        return;
    }
    
    console.log('Form validation passed - proceeding with submission');
    
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
            if (data.verification_required) {
                // Store user ID for verification page
                if (data.user_id) {
                    localStorage.setItem('registeredUserId', data.user_id);
                }
                
                // Registration successful but email verification required
                Swal.fire({ 
                    icon: 'success', 
                    title: 'Account Created!', 
                    html: `
                        <p>Registration successful!</p>
                        <p>Please resend verification email.</p>
                        <p><strong>Email sent:</strong> ${data.email_sent ? 'Yes' : 'No (check email logs)'}</p>
                    `,
                    confirmButtonText: 'Go to Verification',
                    showCancelButton: true,
                    cancelButtonText: 'Stay Here'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = 'verify_code_signup.html';
                    }
                });
            } else {
                // Registration successful - redirect to login (legacy flow)
                Swal.fire({ icon: 'success', title: 'Account created', text: 'Registration successful! Redirecting to login...', timer: 1200, showConfirmButton: false });
                setTimeout(() => { window.location.href = 'login.html'; }, 1200);
            }
        } else {
            // Check if this is an unverified email case
            if (data.unverified_email) {
                // Show notification and automatically resend verification email
                Swal.fire({
                    icon: 'info',
                    title: 'Email Already Registered',
                    html: `
                        <p>${data.message}</p>
                        <p><strong>We'll automatically resend the verification email to your Gmail inbox.</strong></p>
                    `,
                    confirmButtonText: 'OK',
                    timer: 5000,
                    timerProgressBar: true
                }).then(async () => {
                    // Automatically resend verification email
                    await resendVerificationEmail(data.email, null);
                });
            } else {
                Swal.fire({ icon: 'error', title: 'Registration failed', text: data.message || 'Please try again.' });
            }
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

// Email existence check function
async function checkEmailExistence(email) {
    try {
        const response = await fetch('php/check-email.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ email: email }),
            credentials: 'same-origin'
        });

        const data = await response.json();
        
        if (data.exists) {
            if (data.verified) {
                showFieldSuccess(document.getElementById('email'), 'Email already registered and verified');
            } else {
                showFieldError(document.getElementById('email'), 'Email already registered but not verified. Please resend verification email.');
                // Show resend verification option
                showResendVerificationOption(email);
            }
        } else {
            clearFieldError(document.getElementById('email'));
            hideResendVerificationOption();
        }
    } catch (error) {
        console.error('Email check error:', error);
        // Don't show error to user for network issues
    }
}

// Show resend verification option
function showResendVerificationOption(email) {
    const emailField = document.getElementById('email');
    const formGroup = emailField.closest('.form-group');
    
    // Remove existing resend option
    hideResendVerificationOption();
    
    // Create resend button
    const resendDiv = document.createElement('div');
    resendDiv.className = 'resend-verification';
    resendDiv.style.marginTop = '10px';
    resendDiv.style.textAlign = 'center';
    
    const resendButton = document.createElement('button');
    resendButton.type = 'button';
    resendButton.className = 'btn btn-outline-primary btn-sm';
    resendButton.innerHTML = '</i> Resend Verification Email';
    resendButton.style.color = '#6d6d6d';
    resendButton.style.fontSize = '14px';
    resendButton.style.padding = '8px 16px';
    
    resendButton.addEventListener('click', async () => {
        await resendVerificationEmail(email, resendButton);
    });
    
    resendDiv.appendChild(resendButton);
    formGroup.appendChild(resendDiv);
}

// Hide resend verification option
function hideResendVerificationOption() {
    const existingResend = document.querySelector('.resend-verification');
    if (existingResend) {
        existingResend.remove();
    }
}

// Resend verification email
async function resendVerificationEmail(email, button) {
    const originalText = button ? button.innerHTML : '';
    if (button) {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        button.disabled = true;
    }
    
    try {
        const response = await fetch('php/resend-verification.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email }),
            credentials: 'same-origin'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Show success notification
            Swal.fire({
                icon: 'success',
                title: 'Email Sent!',
                html: `
                    <p>${data.message}</p>
                    <p><strong>Please check your Gmail inbox</strong> for the verification email.</p>
                    <p>If you don't see it, check your spam folder.</p>
                `,
                confirmButtonText: 'OK',
                timer: 8000,
                timerProgressBar: true
            });
            
            // Update button if provided
            if (button) {
                button.innerHTML = '<i class="fas fa-check"></i> Email Sent!';
                button.style.backgroundColor = '#28a745';
                button.style.borderColor = '#28a745';
                button.style.color = 'white';
                
                // Reset button after 5 seconds
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.style.backgroundColor = '';
                    button.style.borderColor = '';
                    button.style.color = '';
                    button.disabled = false;
                }, 5000);
            }
            
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Failed to Send Email',
                text: data.message,
                confirmButtonText: 'OK'
            });
            if (button) {
                button.innerHTML = originalText;
                button.disabled = false;
            }
        }
        
    } catch (error) {
        console.error('Resend verification error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while sending the verification email. Please try again.',
            confirmButtonText: 'OK'
        });
        if (button) {
            button.innerHTML = originalText;
            button.disabled = false;
        }
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
