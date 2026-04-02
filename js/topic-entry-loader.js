(function () {
    if (window.__mathEaseTopicEntryLoaderInitialized) {
        return;
    }
    window.__mathEaseTopicEntryLoaderInitialized = true;

    var preconnect = function (href) {
        var l = document.createElement('link');
        l.rel = 'preconnect';
        l.href = href;
        l.crossOrigin = 'anonymous';
        document.head.appendChild(l);
    };
    preconnect('https://www.youtube.com');
    preconnect('https://i.ytimg.com');

    var overlay = document.createElement('div');
    overlay.id = 'topicEntryLoaderOverlay';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.style.position = 'fixed';
    overlay.style.top = '1rem';
    overlay.style.right = '1rem';
    overlay.style.left = 'auto';
    overlay.style.bottom = 'auto';
    overlay.style.width = 'auto';
    overlay.style.maxWidth = 'min(320px, calc(100vw - 2rem))';
    overlay.style.zIndex = '999999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.fontFamily = 'Inter, Poppins, Arial, sans-serif';
    overlay.style.padding = '12px 16px';
    overlay.style.borderRadius = '12px';
    overlay.style.boxShadow = '0 10px 40px rgba(15, 23, 42, 0.12)';
    overlay.style.border = '1px solid #e5e7eb';
    overlay.style.background = 'rgba(255, 255, 255, 0.96)';
    overlay.style.backdropFilter = 'blur(8px)';
    overlay.innerHTML = '' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
        '  <div style="flex-shrink:0;width:28px;height:28px;border-radius:9999px;border:3px solid #e5e7eb;border-top-color:#4f46e5;animation:matheaseSpin 1s linear infinite;"></div>' +
        '  <span style="color:#4b5563;font-size:14px;font-weight:500;">Loading lesson…</span>' +
        '</div>';

    var style = document.createElement('style');
    style.textContent = '@keyframes matheaseSpin{to{transform:rotate(360deg);}}';
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    var hidden = false;
    var hideOverlay = function () {
        if (hidden) return;
        hidden = true;
        overlay.style.transition = 'opacity 200ms ease, transform 200ms ease';
        overlay.style.opacity = '0';
        overlay.style.transform = 'translateY(-6px)';
        setTimeout(function () {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 220);
    };

    var fallbackTimer = setTimeout(hideOverlay, 3500);

    var capTimer = setTimeout(function () {
        hideOverlay();
    }, 600);

    fetch('../php/user.php', {
        credentials: 'include',
        cache: 'no-store'
    })
        .then(function (response) {
            if (!response.ok) return null;
            return response.json().catch(function () { return null; });
        })
        .catch(function () {})
        .finally(function () {
            clearTimeout(fallbackTimer);
            clearTimeout(capTimer);
            setTimeout(hideOverlay, 80);
        });
})();

/** Shared topic lesson quiz UI (instructions banner + cancel confirmation). Loaded with topic-entry-loader on topic pages. */
(function () {
    if (window.__mathEaseTopicQuizHelpers) {
        return;
    }
    window.__mathEaseTopicQuizHelpers = true;

    window.mathEaseQuizIntroBanner = function () {
        return '<div class="mb-4 p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-sm text-gray-800 text-left shadow-sm">' +
            '<strong class="text-indigo-900">Instructions:</strong> This quiz has <strong>5</strong> multiple-choice questions. ' +
            'Pass with at least <strong>3 correct</strong> (60%). Questions and answers are shuffled. ' +
            'You cannot return to a previous question.</div>';
    };

    window.mathEaseConfirmTopicQuizCancel = function () {
        if (typeof Swal === 'undefined') {
            return Promise.resolve({ isConfirmed: window.confirm('Cancel quiz? Your progress in this attempt will be lost.') });
        }
        return Swal.fire({
            title: 'Cancel quiz?',
            html: '<p class="text-gray-700 text-center px-1">Are you sure? Your answers in this attempt will be discarded.</p>',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, cancel',
            cancelButtonText: 'No, continue quiz',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#4f46e5',
            reverseButtons: true,
            focusCancel: true
        });
    };
})();
