// Verify signup JS
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

    const otpInput = document.getElementById('otpCodePage');
    const verifyBtn = document.getElementById('verifyOtpPageBtn');
    const resendBtn = document.getElementById('resendOtpPageBtn');
    const messageDiv = document.getElementById('otpMessagePage');

    function setMessage(msg, color = '#666') {
        if (messageDiv) {
            messageDiv.textContent = msg;
            messageDiv.style.color = color;
        }
    }

    verifyBtn.addEventListener('click', async function() {
        const code = otpInput.value.trim();
        if (!code || code.length !== 6) {
            setMessage('Please enter the 6-digit code.', '#e74c3c');
            return;
        }
        if (!userId) {
            setMessage('Missing user information. Please register again.', '#e74c3c');
            return;
        }
        verifyBtn.disabled = true;
        verifyBtn.textContent = 'Verifying...';
        try {
            const resp = await fetch('php/verify_email.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ user_id: userId, otp: code }).toString(),
                credentials: 'same-origin'
            });

            const text = await resp.text();
            let data;
            try { data = JSON.parse(text); } catch (e) { data = null; }

            if (resp.ok && data && data.success) {
                setMessage('Verified successfully. Redirecting to login...', '#27ae60');
                localStorage.removeItem('registeredUserId');
                setTimeout(() => { window.location.href = 'login.html'; }, 900);
            } else {
                const msg = data && data.message ? data.message : (text || 'Invalid code. Please try again.');
                setMessage(msg, '#e74c3c');
            }
        } catch (err) {
            console.error('Verify error', err);
            setMessage('An error occurred. Please try again.', '#e74c3c');
        } finally {
            verifyBtn.disabled = false;
            verifyBtn.textContent = 'Verify';
        }
    });

    resendBtn.addEventListener('click', async function() {
        if (!userId) {
            setMessage('Missing user information. Please register again.', '#e74c3c');
            return;
        }
        resendBtn.disabled = true;
        resendBtn.textContent = 'Resending...';
        try {
            const resp = await fetch('php/resend_otp.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ user_id: userId }).toString(),
                credentials: 'same-origin'
            });

            const text = await resp.text();
            let data;
            try { data = JSON.parse(text); } catch (e) { data = null; }

            if (resp.ok && data && data.success) {
                setMessage('A new code has been sent to your email.', '#27ae60');
            } else {
                const msg = data && data.message ? data.message : (text || 'Could not resend code.');
                setMessage(msg, '#e74c3c');
            }
        } catch (err) {
            console.error('Resend error', err);
            setMessage('An error occurred. Please try again.', '#e74c3c');
        } finally {
            resendBtn.disabled = false;
            resendBtn.textContent = 'Resend';
        }
    });

    // If there's a userId but no otp input focus, show helpful message
    if (userId) {
        setMessage('Enter the 6-digit code sent to your email.');
        if (otpInput) otpInput.focus();
    } else {
        setMessage('No user information found. Please register first.', '#e74c3c');
    }
});
