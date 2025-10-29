// Verify signup JS - Updated for email link verification
document.addEventListener('DOMContentLoaded', function() {
    const getQueryParam = (name) => {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    };

    const userId = getQueryParam('user_id') || window.__registeredUserId || localStorage.getItem('registeredUserId');
    if (userId) {
        // persist for refreshes
        localStorage.setItem('registeredUserId', userId);
    }

    const resendBtn = document.getElementById('resendEmailBtn');
    const checkEmailBtn = document.getElementById('checkEmailBtn');
    const resendLink = document.getElementById('resendLink');
    const messageDiv = document.getElementById('verificationMessage');

    function setMessage(msg, color = '#666') {
        if (messageDiv) {
            messageDiv.textContent = msg;
            messageDiv.style.color = color;
        }
    }

    // Function to resend verification email
    async function resendVerificationEmail() {
        if (!userId) {
            setMessage('Missing user information. Please register again.', '#e74c3c');
            return;
        }
        
        const button = event.target;
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Sending...';
        
        try {
            const resp = await fetch('php/resend-verification.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ user_id: userId }).toString(),
                credentials: 'same-origin'
            });

            const text = await resp.text();
            let data;
            try { data = JSON.parse(text); } catch (e) { data = null; }

            if (resp.ok && data && data.success) {
                setMessage('Verification email sent! Please check your inbox and spam folder.', '#27ae60');
            } else {
                const msg = data && data.message ? data.message : (text || 'Could not resend email.');
                setMessage(msg, '#e74c3c');
            }
        } catch (err) {
            console.error('Resend error', err);
            setMessage('An error occurred. Please try again.', '#e74c3c');
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    // Function to check if email is verified
    async function checkEmailVerification() {
        if (!userId) {
            setMessage('Missing user information. Please register again.', '#e74c3c');
            return;
        }
        
        const button = event.target;
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Checking...';
        
        try {
            const resp = await fetch('php/check-email.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ user_id: userId }).toString(),
                credentials: 'same-origin'
            });

            const text = await resp.text();
            let data;
            try { data = JSON.parse(text); } catch (e) { data = null; }

            if (resp.ok && data && data.success) {
                setMessage('Email verified successfully! Redirecting to login...', '#27ae60');
                localStorage.removeItem('registeredUserId');
                setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            } else {
                const msg = data && data.message ? data.message : 'Email not yet verified. Please check your email and click the verification link.';
                setMessage(msg, '#f39c12');
            }
        } catch (err) {
            console.error('Check verification error', err);
            setMessage('An error occurred. Please try again.', '#e74c3c');
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    // Event listeners
    if (resendBtn) {
        resendBtn.addEventListener('click', resendVerificationEmail);
    }
    
    if (checkEmailBtn) {
        checkEmailBtn.addEventListener('click', checkEmailVerification);
    }
    
    if (resendLink) {
        resendLink.addEventListener('click', function(e) {
            e.preventDefault();
            resendVerificationEmail();
        });
    }

    // Initial message
    if (userId) {
        setMessage('Please check your email and click the verification link to activate your account.');
    } else {
        setMessage('No user information found. Please register first.', '#e74c3c');
    }
});
