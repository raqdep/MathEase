document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const accountType = params.get('type') === 'teacher' ? 'teacher' : 'student';
    let accountId = params.get('id') || localStorage.getItem(accountType === 'teacher' ? 'registeredTeacherId' : 'registeredUserId');
    const emailParam = (params.get('email') || '').trim();

    const resendBtn = document.getElementById('resendEmailBtn');
    const resendLink = document.getElementById('resendLink');
    const verifyBtn = document.getElementById('checkEmailBtn');
    const messageDiv = document.getElementById('verificationMessage');
    const otpHidden = document.getElementById('otpCode');
    const emailInput = document.getElementById('verifyEmail');
    const emailBlock = document.getElementById('emailBlock');

    const otpDigits = document.querySelectorAll('#otpInputs .otp-digit');

    function getOtpValue() {
        if (otpDigits.length === 6) {
            return Array.from(otpDigits).map(function(el) { return (el.value || '').replace(/\D/g, ''); }).join('');
        }
        return otpHidden ? (otpHidden.value || '').trim() : '';
    }

    function syncHiddenOtp() {
        if (otpHidden) otpHidden.value = getOtpValue();
    }

    function initOtpBoxes() {
        if (otpDigits.length !== 6) return;

        otpDigits.forEach(function(box, i) {
            box.addEventListener('input', function(e) {
                let v = (e.target.value || '').replace(/\D/g, '');
                if (v.length > 1) v = v.slice(-1);
                e.target.value = v;
                syncHiddenOtp();
                if (v && i < otpDigits.length - 1) {
                    otpDigits[i + 1].focus();
                }
            });

            box.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && !e.target.value && i > 0) {
                    otpDigits[i - 1].focus();
                    otpDigits[i - 1].value = '';
                    syncHiddenOtp();
                    e.preventDefault();
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    verifyOtp();
                }
            });

            box.addEventListener('paste', function(e) {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text') || '';
                const digits = text.replace(/\D/g, '').slice(0, 6);
                if (!digits) return;
                digits.split('').forEach(function(ch, j) {
                    if (otpDigits[j]) otpDigits[j].value = ch;
                });
                const next = Math.min(digits.length, 5);
                otpDigits[next].focus();
                syncHiddenOtp();
            });
        });
    }

    function setMessage(msg, color) {
        if (color === undefined) color = '#666';
        if (!messageDiv) return;
        messageDiv.textContent = msg;
        messageDiv.style.color = color;
    }

    async function ensureAccountIdFromEmail() {
        if (accountId) return true;

        const email = (emailParam || (emailInput ? emailInput.value.trim() : '')).trim();
        if (!email) return false;

        try {
            const resp = await fetch('php/lookup-signup-account.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ account_type: accountType, email: email }).toString(),
                credentials: 'same-origin'
            });
            const data = await resp.json();
            if (data && data.success && data.id) {
                accountId = String(data.id);
                if (accountType === 'teacher') {
                    localStorage.setItem('registeredTeacherId', accountId);
                } else {
                    localStorage.setItem('registeredUserId', accountId);
                }
                return true;
            }
        } catch (e) {
            console.error('Lookup account error', e);
        }
        return false;
    }

    async function resendOtp(button) {
        if (!accountId) {
            const ok = await ensureAccountIdFromEmail();
            if (!ok) {
                setMessage('Enter your email first, then resend the code.', '#e74c3c');
                if (emailInput) emailInput.focus();
                return;
            }
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
                body: new URLSearchParams({
                    account_type: accountType,
                    id: accountId,
                    email: (emailParam || (emailInput ? emailInput.value.trim() : '')) || ''
                }).toString(),
                credentials: 'same-origin'
            });
            const data = await resp.json();
            if (data.success) {
                setMessage('Code sent. Check your inbox or spam folder.', '#27ae60');
            } else {
                setMessage(data.message || 'Could not resend code.', '#e74c3c');
            }
        } catch (err) {
            console.error('Resend OTP error', err);
            setMessage('An error occurred while resending the code.', '#e74c3c');
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = originalText;
            }
        }
    }

    async function verifyOtp() {
        syncHiddenOtp();

        if (!accountId) {
            const ok = await ensureAccountIdFromEmail();
            if (!ok) {
                setMessage('Enter your email first, then enter the 6-digit code.', '#e74c3c');
                if (emailInput) emailInput.focus();
                return;
            }
        }

        const otp = getOtpValue();
        if (!/^\d{6}$/.test(otp)) {
            setMessage('Please enter the full 6-digit code.', '#e74c3c');
            if (otpDigits[0]) otpDigits[0].focus();
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
                body: new URLSearchParams({ account_type: accountType, id: accountId, otp: otp }).toString(),
                credentials: 'same-origin'
            });
            const data = await resp.json();
            if (data.success) {
                setMessage('Verified successfully. Redirecting to sign in...', '#27ae60');
                localStorage.removeItem('registeredUserId');
                localStorage.removeItem('registeredTeacherId');
                setTimeout(function() {
                    window.location.href = accountType === 'teacher' ? 'teacher-login.html' : 'login.html';
                }, 1200);
            } else {
                setMessage(data.message || 'Invalid code. Try again.', '#e74c3c');
            }
        } catch (err) {
            console.error('Verify OTP error', err);
            setMessage('An error occurred while verifying.', '#e74c3c');
        } finally {
            if (verifyBtn) {
                verifyBtn.disabled = false;
                verifyBtn.textContent = originalText;
            }
        }
    }

    initOtpBoxes();
    syncHiddenOtp();

    if (resendBtn) {
        resendBtn.addEventListener('click', function() { resendOtp(resendBtn); });
    }
    if (resendLink) {
        resendLink.addEventListener('click', function(e) {
            e.preventDefault();
            resendOtp(resendBtn);
        });
    }
    if (verifyBtn) {
        verifyBtn.addEventListener('click', verifyOtp);
    }

    if (!accountId && emailInput && emailBlock) {
        emailBlock.style.display = 'block';
        if (emailParam) emailInput.value = emailParam;
        setMessage('Enter your email and the 6-digit code sent to you.', '#666');
    } else {
        setMessage('Enter the 6-digit code sent to your email.', '#666');
        if (otpDigits[0]) otpDigits[0].focus();
    }
});
