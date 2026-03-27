// Maintenance notice popup (SweetAlert2) for auth pages.
(function () {
    var REAPPEAR_MS = 15000;
    var STORAGE_KEY = 'maintenance_notice_next_at';
    var lastPayload = null;

    function getStatusUrl() {
        // Supports pages under /topics/ or /quiz/ too (keeps older logic).
        var p = window.location.pathname || '';
        return (p.indexOf('/topics/') !== -1 || p.indexOf('/quiz/') !== -1) ? '../php/maintenance-status.php' : 'php/maintenance-status.php';
    }

    function parseDate(value) {
        if (!value) return null;
        var d = new Date(String(value).replace(' ', 'T'));
        return isNaN(d.getTime()) ? null : d;
    }

    function formatDate(value) {
        if (!value) return 'TBA';
        var d = parseDate(value);
        if (!d) return String(value);
        return d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    function nowMs() {
        return Date.now ? Date.now() : new Date().getTime();
    }

    function getNextAt() {
        try {
            var raw = sessionStorage.getItem(STORAGE_KEY);
            var n = raw ? parseInt(raw, 10) : 0;
            return isNaN(n) ? 0 : n;
        } catch (e) {
            return 0;
        }
    }

    function setNextAt(ts) {
        try {
            sessionStorage.setItem(STORAGE_KEY, String(ts));
        } catch (e) {}
    }

    function isTeacherPage() {
        return /teacher-login\.html/i.test(location.pathname) || /teacher-register\.html/i.test(location.pathname);
    }

    function buildHtml(d) {
        var title = d.title || (d.upcoming ? 'Scheduled system update' : 'System update in progress');
        var message = d.message || (d.upcoming
            ? 'A maintenance schedule is set. Some services may be unavailable during the update window.'
            : 'We’re improving the platform. Some services may be temporarily unavailable.');

        var startAt = formatDate(d.scheduled_start_at || d.started_at);
        var endAt = formatDate(d.scheduled_end_at || d.estimated_end_at);
        var statusText = d.upcoming ? 'UPCOMING' : 'ACTIVE';

        var extra = '';
        if (isTeacherPage()) {
            extra = '<div class="maintenance-popup__note"><i class="fas fa-shield-alt" aria-hidden="true"></i><span>Admins can still sign in on the teacher login page.</span></div>';
        }

        return (
            '<div class="maintenance-popup" role="dialog" aria-label="System update notice">' +
                '<div class="maintenance-popup__header">' +
                    '<div class="maintenance-popup__icon" aria-hidden="true"><i class="fas fa-screwdriver-wrench"></i></div>' +
                    '<div class="maintenance-popup__heading">' +
                        '<div class="maintenance-popup__title">' + title + '</div>' +
                        '<div class="maintenance-popup__subtitle">' +
                            '<span class="maintenance-popup__pill ' + (d.upcoming ? 'is-upcoming' : 'is-active') + '">' + statusText + '</span>' +
                            '<span class="maintenance-popup__subtitleText">' + (d.upcoming ? 'Scheduled window' : 'Maintenance window') + '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="maintenance-popup__message">' + message + '</div>' +
                '<div class="maintenance-popup__grid">' +
                    '<div class="maintenance-popup__card">' +
                        '<div class="maintenance-popup__cardIcon" aria-hidden="true"><i class="fas fa-play-circle"></i></div>' +
                        '<div class="maintenance-popup__cardBody">' +
                            '<div class="maintenance-popup__cardLabel">Start</div>' +
                            '<div class="maintenance-popup__cardValue">' + startAt + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="maintenance-popup__card">' +
                        '<div class="maintenance-popup__cardIcon" aria-hidden="true"><i class="fas fa-flag-checkered"></i></div>' +
                        '<div class="maintenance-popup__cardBody">' +
                            '<div class="maintenance-popup__cardLabel">End</div>' +
                            '<div class="maintenance-popup__cardValue">' + endAt + '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                extra +
                '<div class="maintenance-popup__hint">This notice will reappear after 15 seconds if closed.</div>' +
            '</div>'
        );
    }

    function shouldShow(d) {
        if (!d || !d.success) return false;
        if (!d.maintenance && !d.upcoming) return false;
        // Avoid duplicate opens.
        if (typeof Swal !== 'undefined' && Swal.isVisible && Swal.isVisible()) return false;
        // Throttle re-appearance after close.
        return nowMs() >= getNextAt();
    }

    function showPopup(d) {
        if (typeof Swal === 'undefined') return;
        lastPayload = d;
        Swal.fire({
            html: buildHtml(d),
            showConfirmButton: false,
            showCloseButton: true,
            allowOutsideClick: true,
            allowEscapeKey: true,
            customClass: { popup: 'maintenance-swal', htmlContainer: 'maintenance-swal-html' },
            didClose: function () {
                setNextAt(nowMs() + REAPPEAR_MS);
                scheduleReappear();
            }
        });
    }

    function fetchStatus() {
        return fetch(getStatusUrl(), { credentials: 'same-origin', cache: 'no-store' })
            .then(function (r) { return r.json(); })
            .catch(function () { return null; });
    }

    function scheduleReappear() {
        var wait = Math.max(0, getNextAt() - nowMs());
        window.setTimeout(function () {
            fetchStatus().then(function (d) {
                if (shouldShow(d)) showPopup(d);
            });
        }, wait || REAPPEAR_MS);
    }

    // Initial load.
    fetchStatus().then(function (d) {
        if (shouldShow(d)) showPopup(d);
        // Keep checking occasionally so if it turns ON, users get notified.
        window.setInterval(function () {
            fetchStatus().then(function (next) {
                // Only pop if a notice is relevant and we're past throttle.
                if (shouldShow(next)) showPopup(next);
                // If maintenance ended, clear throttle so next time it starts, it shows immediately.
                if (next && next.success && !next.maintenance && !next.upcoming) {
                    setNextAt(0);
                }
            });
        }, 30000);
    });
})();

