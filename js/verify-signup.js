document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const accountType = params.get('type') === 'teacher' ? 'teacher' : 'student';
    const accountId = params.get('id') || localStorage.getItem(accountType === 'teacher' ? 'registeredTeacherId' : 'registeredUserId');

    const resendBtn = document.getElementById('resendEmailBtn');
    const verifyBtn = document.getElementById('checkEmailBtn');
    const resendLink = document.getElementById('resendLink');
    const messageDiv = document.getElementById('verificationMessage');
    const otpInput = document.getElementById('otpCode');
    const otpLabel = document.getElementById('otpLabel');

    if (accountType === 'teacher' && otpLabel) {
        otpLabel.textContent = 'Enter Teacher OTP';
    }

    function setMessage(msg, color = '#666') {
        if (!messageDiv) return;
        messageDiv.textContent = msg;
        messageDiv.style.color = color;
    }

    async function resendOtp(button) {
        if (!accountId) {
            setMessage('Missing account information. Please register again.', '#e74c3c');
            return;
        }

        const originalText = button ? button.textContent : '';
        if (button) {
            button.disabled = true;
            button.textContent = 'Sending...';
        }

        try {
            const resp = await fetch('php/resend-signup-otp.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ account_type: accountType, id: accountId }).toString(),
                credentials: 'same-origin'
            });
            const data = await resp.json();
            if (data.success) {
                setMessage('OTP sent. Check your email inbox/spam.', '#27ae60');
            } else {
                setMessage(data.message || 'Could not resend OTP.', '#e74c3c');
            }
        } catch (err) {
            console.error('Resend OTP error', err);
            setMessage('An error occurred while resending OTP.', '#e74c3c');
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = originalText;
            }
        }
    }

    async function verifyOtp() {
        if (!accountId) {
            setMessage('Missing account information. Please register again.', '#e74c3c');
            return;
        }

        const otp = otpInput ? otpInput.value.trim() : '';
        if (!/^\d{6}$/.test(otp)) {
            setMessage('Please enter a valid 6-digit OTP.', '#e74c3c');
            return;
        }

        const originalText = verifyBtn ? verifyBtn.textContent : '';
        if (verifyBtn) {
            verifyBtn.disabled = true;
            verifyBtn.textContent = 'Verifying...';
        }

        try {
            const resp = await fetch('php/verify-signup-otp.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ account_type: accountType, id: accountId, otp }).toString(),
                credentials: 'same-origin'
            });
            const data = await resp.json();
            if (data.success) {
                setMessage('OTP verified successfully. Redirecting to login...', '#27ae60');
                localStorage.removeItem('registeredUserId');
                localStorage.removeItem('registeredTeacherId');
                setTimeout(() => {
                    window.location.href = accountType === 'teacher' ? 'teacher-login.html' : 'login.html';
                }, 1200);
            } else {
                setMessage(data.message || 'Invalid OTP.', '#e74c3c');
            }
        } catch (err) {
            console.error('Verify OTP error', err);
            setMessage('An error occurred while verifying OTP.', '#e74c3c');
        } finally {
            if (verifyBtn) {
                verifyBtn.disabled = false;
                verifyBtn.textContent = originalText;
            }
        }
    }

    if (resendBtn) {
        resendBtn.addEventListener('click', function() { resendOtp(resendBtn); });
    }
    if (verifyBtn) {
        verifyBtn.addEventListener('click', verifyOtp);
    }
    if (resendLink) {
        resendLink.addEventListener('click', function(e) {
            e.preventDefault();
            resendOtp(resendBtn);
        });
    }
    if (otpInput) {
        otpInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                verifyOtp();
            }
        });
    }

    if (accountId) {
        setMessage('Enter the 6-digit OTP sent to your email.');
    } else {
        setMessage('No account information found. Please register first.', '#e74c3c');
    }
});
