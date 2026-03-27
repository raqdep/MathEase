(function () {
    if (window.__mathEaseTopicEntryLoaderInitialized) {
        return;
    }
    window.__mathEaseTopicEntryLoaderInitialized = true;

    var overlay = document.createElement('div');
    overlay.id = 'topicEntryLoaderOverlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(248, 250, 252, 0.96)';
    overlay.style.zIndex = '999999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.fontFamily = 'Inter, Poppins, Arial, sans-serif';
    overlay.innerHTML = '' +
        '<div style="text-align:center;padding:24px;">' +
        '  <div style="display:inline-block;width:48px;height:48px;border-radius:9999px;border:4px solid #e5e7eb;border-top-color:#4f46e5;animation:matheaseSpin 1s linear infinite;"></div>' +
        '  <p style="margin-top:12px;color:#4b5563;font-size:16px;font-weight:500;">Loading lesson...</p>' +
        '</div>';

    var style = document.createElement('style');
    style.textContent = '@keyframes matheaseSpin{to{transform:rotate(360deg);}}';
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    var hidden = false;
    var hideOverlay = function () {
        if (hidden) return;
        hidden = true;
        overlay.style.transition = 'opacity 220ms ease';
        overlay.style.opacity = '0';
        setTimeout(function () {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 240);
    };

    var isFullscreenActive = function () {
        return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    };

    var requestFullscreen = function () {
        if (isFullscreenActive()) return;
        var el = document.documentElement;
        try {
            if (el.requestFullscreen) {
                el.requestFullscreen().catch(function () {});
            } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
            } else if (el.msRequestFullscreen) {
                el.msRequestFullscreen();
            }
        } catch (e) {}
    };

    var bindFullscreenOnInteraction = function () {
        var handler = function () {
            requestFullscreen();
            document.removeEventListener('click', handler, true);
            document.removeEventListener('keydown', handler, true);
            document.removeEventListener('touchstart', handler, true);
        };
        document.addEventListener('click', handler, true);
        document.addEventListener('keydown', handler, true);
        document.addEventListener('touchstart', handler, true);
    };

    var fallbackTimer = setTimeout(hideOverlay, 4500);

    fetch('../php/user.php', {
        credentials: 'include',
        cache: 'no-store'
    })
        .then(function (response) {
            if (!response.ok) return null;
            return response.json().catch(function () { return null; });
        })
        .then(function (data) {
            if (data && data.success) {
                requestFullscreen();
                bindFullscreenOnInteraction();
            }
        })
        .catch(function () {})
        .finally(function () {
            clearTimeout(fallbackTimer);
            setTimeout(hideOverlay, 700);
        });
})();
