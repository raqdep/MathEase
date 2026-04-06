// Maintenance notice popup (SweetAlert2) for auth pages.
(function () {
    var REAPPEAR_MS = 15000;
    var STORAGE_KEY = 'maintenance_notice_next_at';
    var STORAGE_LAST_ACTIVE = 'mathease_maintenance_last_active';
    var STORAGE_FROM_KICK = 'mathease_maintenance_from_kick';
    var lastPayload = null;
    var completeToastShown = false;

    function stripMaintenanceQueryParam() {
        try {
            var u = new URL(window.location.href);
            if (u.searchParams.get('maintenance') !== '1') return;
            sessionStorage.setItem(STORAGE_FROM_KICK, '1');
            u.searchParams.delete('maintenance');
            var q = u.searchParams.toString();
            var clean = u.pathname + (q ? '?' + q : '') + u.hash;
            if (history.replaceState) {
                history.replaceState({}, '', clean);
            }
        } catch (e) {}
    }

    function showMaintenanceCompleteToast() {
        if (completeToastShown || typeof Swal === 'undefined') return;
        completeToastShown = true;
        Swal.fire({
            icon: 'success',
            title: 'Maintenance complete',
            html:
                '<p style="margin:0 0 8px;">System maintenance has ended. MathEase is available again.</p>' +
                '<p style="margin:0;font-size:0.95em;opacity:0.9;">You can sign in now.</p>',
            confirmButtonText: 'OK',
            allowOutsideClick: true,
            allowEscapeKey: true
        });
    }

    function checkMaintenanceResolved(d) {
        if (!d || !d.success) return;
        var now = !!(d.maintenance || d.upcoming);
        var hadPrior = sessionStorage.getItem(STORAGE_LAST_ACTIVE) === '1';
        var fromKick = sessionStorage.getItem(STORAGE_FROM_KICK) === '1';
        if (now) {
            sessionStorage.setItem(STORAGE_LAST_ACTIVE, '1');
            completeToastShown = false;
            return;
        }
        if (hadPrior || fromKick) {
            sessionStorage.removeItem(STORAGE_FROM_KICK);
            if (typeof Swal !== 'undefined' && Swal.isVisible && Swal.isVisible()) {
                Swal.close();
            }
            window.setTimeout(function () {
                showMaintenanceCompleteToast();
            }, 250);
        }
        sessionStorage.setItem(STORAGE_LAST_ACTIVE, '0');
    }

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

    function escapeHtml(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatMessageBodyHtml(text) {
        var t = String(text || '').trim();
        if (!t) return '';
        return escapeHtml(t).replace(/\r\n|\r|\n/g, '<br>');
    }

    function buildHtml(d, opts) {
        opts = opts || {};
        var rawTitle = (d.title && String(d.title).trim()) || '';
        var displayTitle = rawTitle || (d.upcoming ? 'Scheduled system maintenance' : 'System maintenance in progress');
        var bodySource = (d.public_message && String(d.public_message).trim()) || (d.message && String(d.message).trim()) || '';
        var defaultBody;
        if (d.upcoming) {
            defaultBody = isTeacherPage()
                ? 'A maintenance window is scheduled. Review the times below. Teacher and student login stay available until maintenance begins.'
                : 'A maintenance window is scheduled. Review the times below. You can still sign in until maintenance begins; after that, student login will be unavailable.';
        } else {
            defaultBody = isTeacherPage()
                ? 'MathEase is undergoing maintenance. Teacher sign-in is disabled for non-admin accounts until maintenance ends. Details from your administrator are below.'
                : 'MathEase is undergoing maintenance. Student login is paused until maintenance ends. Details from your administrator are below.';
        }
        var messageHtml = formatMessageBodyHtml(bodySource) || formatMessageBodyHtml(defaultBody);
        var statusText = d.upcoming ? 'SCHEDULED' : 'ACTIVE';
        var windowKind = d.upcoming ? 'Scheduled maintenance window' : 'Active maintenance';

        var schedStart = d.scheduled_start_at;
        var schedEnd = d.scheduled_end_at;
        var eta = d.estimated_end_at;
        var began = d.started_at;

        var startLabel;
        var startValue;
        if (d.upcoming) {
            startLabel = 'Maintenance starts';
            startValue = formatDate(schedStart);
        } else if (began) {
            startLabel = 'Maintenance began';
            startValue = formatDate(began);
        } else {
            startLabel = 'Window start (planned)';
            startValue = formatDate(schedStart);
        }

        var endLabel = 'Expected completion (estimate)';
        var endValue = formatDate(schedEnd || eta);

        var advanceMin = parseInt(d.advance_notice_minutes, 10);
        if (isNaN(advanceMin) || advanceMin < 1) advanceMin = 30;

        var extra = '';
        if (d.upcoming) {
            if (isTeacherPage()) {
                extra +=
                    '<div class="maintenance-popup__note"><i class="fas fa-info-circle" aria-hidden="true"></i>' +
                    '<span>Teachers and students can still sign in until the start time. Administrators can always use this page.</span></div>';
            } else {
                extra +=
                    '<div class="maintenance-popup__note"><i class="fas fa-info-circle" aria-hidden="true"></i>' +
                    '<span>You can still sign in until maintenance begins. After that, student login will be unavailable until maintenance ends.</span></div>';
            }
            extra +=
                '<div class="maintenance-popup__meta">' +
                '<i class="fas fa-bell" aria-hidden="true"></i> ' +
                '<span>Advance notice: at least <strong>' + escapeHtml(String(advanceMin)) + '</strong> minutes before start (if email notices are enabled).</span>' +
                '</div>';
        } else {
            if (isTeacherPage()) {
                extra =
                    '<div class="maintenance-popup__note"><i class="fas fa-shield-alt" aria-hidden="true"></i>' +
                    '<span>Administrators can still sign in here with their admin account during maintenance.</span></div>';
            }
        }

        var secondStartRow = '';
        if (!d.upcoming && began && schedStart && String(began) !== String(schedStart)) {
            secondStartRow =
                '<div class="maintenance-popup__meta">' +
                '<i class="fas fa-calendar-alt" aria-hidden="true"></i> ' +
                '<span>Originally planned start: <strong>' + escapeHtml(formatDate(schedStart)) + '</strong></span>' +
                '</div>';
        }

        return (
            '<div class="maintenance-popup" role="dialog" aria-label="System maintenance notice">' +
                '<div class="maintenance-popup__header">' +
                    '<div class="maintenance-popup__icon" aria-hidden="true"><i class="fas fa-screwdriver-wrench"></i></div>' +
                    '<div class="maintenance-popup__heading">' +
                        '<div class="maintenance-popup__title">' + escapeHtml(displayTitle) + '</div>' +
                        '<div class="maintenance-popup__subtitle">' +
                            '<span class="maintenance-popup__pill ' + (d.upcoming ? 'is-upcoming' : 'is-active') + '">' + statusText + '</span>' +
                            '<span class="maintenance-popup__subtitleText">' + escapeHtml(windowKind) + '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="maintenance-popup__sectionLabel">Message from administrator</div>' +
                '<div class="maintenance-popup__message">' + messageHtml + '</div>' +
                secondStartRow +
                '<div class="maintenance-popup__sectionLabel">Schedule</div>' +
                '<div class="maintenance-popup__grid">' +
                    '<div class="maintenance-popup__card">' +
                        '<div class="maintenance-popup__cardIcon" aria-hidden="true"><i class="fas fa-play-circle"></i></div>' +
                        '<div class="maintenance-popup__cardBody">' +
                            '<div class="maintenance-popup__cardLabel">' + escapeHtml(startLabel) + '</div>' +
                            '<div class="maintenance-popup__cardValue">' + escapeHtml(startValue) + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="maintenance-popup__card">' +
                        '<div class="maintenance-popup__cardIcon" aria-hidden="true"><i class="fas fa-flag-checkered"></i></div>' +
                        '<div class="maintenance-popup__cardBody">' +
                            '<div class="maintenance-popup__cardLabel">' + escapeHtml(endLabel) + '</div>' +
                            '<div class="maintenance-popup__cardValue">' + escapeHtml(endValue) + '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                extra +
                '<div class="maintenance-popup__hint">' +
                (opts.loginAttemptHint
                    ? 'You can close this dialog and try again after maintenance ends. The maintenance notice also appears on this page while sign-in is blocked.'
                    : 'This notice will reappear after 15 seconds if closed.') +
                '</div>' +
            '</div>'
        );
    }

    /**
     * Rich alert when login API returns error_type maintenance (same layout as the proactive popup).
     */
    window.mathEaseMaintenanceLoginAlert = function (data) {
        if (typeof Swal === 'undefined') return;
        var m = data && data.maintenance;
        var d;
        if (m && typeof m === 'object') {
            d = {
                maintenance: true,
                upcoming: false,
                title: m.title || '',
                message: m.public_message || data.message || '',
                public_message: m.public_message || '',
                scheduled_start_at: m.scheduled_start_at || null,
                scheduled_end_at: m.scheduled_end_at || null,
                estimated_end_at: m.estimated_end_at || null,
                started_at: m.started_at || null,
                advance_notice_minutes: m.advance_notice_minutes
            };
        } else {
            d = {
                maintenance: true,
                upcoming: false,
                title: '',
                message: (data && data.message) || '',
                public_message: '',
                scheduled_start_at: null,
                scheduled_end_at: null,
                estimated_end_at: null,
                started_at: null
            };
        }
        Swal.fire({
            icon: 'info',
            title: 'Sign-in paused — maintenance',
            html: buildHtml(d, { loginAttemptHint: true }),
            width: 'min(520px, 94vw)',
            confirmButtonText: 'OK',
            confirmButtonColor: '#6366f1',
            customClass: { popup: 'maintenance-swal', htmlContainer: 'maintenance-swal-html' }
        });
    };

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
            width: 'min(520px, 94vw)',
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
                checkMaintenanceResolved(d);
                if (shouldShow(d)) showPopup(d);
                if (d && d.success && !d.maintenance && !d.upcoming) {
                    setNextAt(0);
                }
            });
        }, wait || REAPPEAR_MS);
    }

    stripMaintenanceQueryParam();

    // Initial load.
    fetchStatus().then(function (d) {
        checkMaintenanceResolved(d);
        if (shouldShow(d)) showPopup(d);
        // Keep checking occasionally so if it turns ON, users get notified.
        window.setInterval(function () {
            fetchStatus().then(function (next) {
                checkMaintenanceResolved(next);
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

