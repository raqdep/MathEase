// Shared student notification system (used across student pages)
(function () {
    const DEFAULT_LIMIT = 10;
    const MODAL_LIMIT = 200;

    function safeJsonParse(text) {
        try {
            return text ? JSON.parse(text) : null;
        } catch (_) {
            return null;
        }
    }

    function iconMap() {
        return {
            // Enrollment
            enrollment_approved: { icon: 'fa-check-circle', cls: 'bg-emerald-100 text-emerald-700' },
            enrollment_rejected: { icon: 'fa-times-circle', cls: 'bg-rose-100 text-rose-700' },

            // Topics (open/close)
            topic_opened: { icon: 'fa-unlock', cls: 'bg-emerald-100 text-emerald-700' },
            topic_closed: { icon: 'fa-lock', cls: 'bg-orange-100 text-orange-700' },
            // Backward compatibility with older types (if any exist)
            topic_unlocked: { icon: 'fa-unlock', cls: 'bg-emerald-100 text-emerald-700' },
            topic_locked: { icon: 'fa-lock', cls: 'bg-orange-100 text-orange-700' },

            // Quizzes
            quiz_opened: { icon: 'fa-circle-play', cls: 'bg-indigo-100 text-indigo-700' },
            quiz_closed: { icon: 'fa-circle-xmark', cls: 'bg-slate-100 text-slate-700' },
            quiz_deadline_updated: { icon: 'fa-clock', cls: 'bg-yellow-100 text-yellow-700' },
            quiz_reset: { icon: 'fa-rotate-left', cls: 'bg-violet-100 text-violet-700' },

            // Generic / legacy
            class_created: { icon: 'fa-plus-circle', cls: 'bg-emerald-100 text-emerald-700' },
            class_deleted: { icon: 'fa-exclamation-triangle', cls: 'bg-rose-100 text-rose-700' },
            quiz_assigned: { icon: 'fa-question-circle', cls: 'bg-indigo-100 text-indigo-700' },
            assignment_due: { icon: 'fa-clock', cls: 'bg-yellow-100 text-yellow-700' },
        };
    }

    function pickTypeMeta(type) {
        const m = iconMap();
        return m[type] || { icon: 'fa-bell', cls: 'bg-slate-100 text-slate-700' };
    }

    function parseTime(tsOrString) {
        if (typeof tsOrString === 'number') return new Date(tsOrString * 1000);
        if (typeof tsOrString === 'string') return new Date(tsOrString);
        return new Date(tsOrString);
    }

    function formatTime(tsOrString) {
        const time = parseTime(tsOrString);
        if (isNaN(time.getTime())) return 'Unknown time';

        const now = new Date();
        const diff = now - time;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
        return time.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function escHtml(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function isNotifUnread(n) {
        const v = n && n.is_read;
        return v === 0 || v === '0' || v === false || v === 'false';
    }

    /** @returns {boolean} true if the page was navigated away */
    function tryNavigateForStudentNotification(n) {
        const t = String((n && n.type) || '').toLowerCase();
        if (t.includes('quiz')) {
            window.location.href = 'quizzes.html';
            return true;
        }
        if (t.includes('topic')) {
            window.location.href = 'dashboard.html#learning-path';
            return true;
        }
        if (t.includes('enrollment') || t.includes('class_created') || t.includes('class_deleted')) {
            window.location.href = 'dashboard.html';
            return true;
        }
        return false;
    }

    async function fetchNotificationsForModal(limit) {
        const res = await fetch(
            `php/notifications.php?action=get_notifications&limit=${encodeURIComponent(limit)}`,
            { credentials: 'include', cache: 'no-store' }
        );
        const raw = await res.text();
        const data = safeJsonParse(raw);
        if (!res.ok || !data || !data.success) {
            return { ok: false, list: [] };
        }
        const rawList = Array.isArray(data.notifications) ? data.notifications : [];
        const seen = new Set();
        const list = rawList.filter((row) => {
            const id = Number(row && row.id);
            if (!Number.isFinite(id) || id <= 0) return false;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });
        return { ok: true, list };
    }

    function modalLoadingHtml() {
        return `
            <div class="flex flex-col items-center justify-center gap-3 py-14 px-4">
                <div class="animate-spin rounded-full h-9 w-9 border-2 border-indigo-200 border-t-indigo-600"></div>
                <p class="text-xs text-slate-500 font-medium">Loading notifications…</p>
            </div>`;
    }

    function updateModalHeaderChrome(swalRootEl, list, opts) {
        if (!swalRootEl) return;
        const sub = swalRootEl.querySelector('#studentNotifModalSubline');
        const btn = swalRootEl.querySelector('#studentNotifMarkAllBtn');
        const loading = !!(opts && opts.loading);

        if (loading) {
            if (sub) sub.textContent = 'Updating…';
            if (btn) {
                btn.disabled = true;
                btn.setAttribute('aria-busy', 'true');
            }
            return;
        }

        if (!list || !list.length) {
            if (sub) sub.textContent = 'No notifications yet';
            if (btn) {
                btn.disabled = true;
                btn.removeAttribute('aria-busy');
                btn.classList.add('opacity-50', 'cursor-not-allowed');
            }
            return;
        }

        const unread = list.filter(isNotifUnread).length;
        if (sub) {
            sub.textContent =
                unread > 0
                    ? `${unread} unread · ${list.length} total`
                    : `All read · ${list.length} in history`;
        }
        if (btn) {
            btn.removeAttribute('aria-busy');
            btn.disabled = unread === 0;
            btn.classList.toggle('opacity-50', unread === 0);
            btn.classList.toggle('cursor-not-allowed', unread === 0);
        }
    }

    async function refreshStudentNotificationsModal(swalRootEl) {
        const container = swalRootEl && swalRootEl.querySelector('#studentAllNotificationsContainer');
        if (!container) return;

        container.innerHTML = modalLoadingHtml();
        updateModalHeaderChrome(swalRootEl, null, { loading: true });

        try {
            const { ok, list } = await fetchNotificationsForModal(MODAL_LIMIT);
            if (!ok) {
                updateModalHeaderChrome(swalRootEl, [], { loading: false });
                container.innerHTML = `
                    <div class="text-center py-12 px-5">
                        <div class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-400 mb-3">
                            <i class="fas fa-plug text-xl"></i>
                        </div>
                        <p class="text-sm font-semibold text-slate-800">Couldn’t load notifications</p>
                        <p class="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Check your connection and try again.</p>
                        <button type="button" id="studentNotifRetryBtn" class="mt-4 inline-flex items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-semibold px-4 py-2 hover:bg-indigo-700 transition-colors">
                            Try again
                        </button>
                    </div>`;
                const retry = container.querySelector('#studentNotifRetryBtn');
                if (retry) {
                    retry.addEventListener('click', (e) => {
                        e.preventDefault();
                        refreshStudentNotificationsModal(swalRootEl);
                    });
                }
                return;
            }

            if (!list.length) {
                updateModalHeaderChrome(swalRootEl, [], { loading: false });
                container.innerHTML = `
                    <div class="text-center py-14 px-5">
                        <div class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                            <i class="fas fa-bell-slash text-xl"></i>
                        </div>
                        <p class="text-sm font-semibold text-slate-800">No notifications yet</p>
                        <p class="text-xs text-slate-500 mt-1">When your teacher sends updates, they’ll show up here.</p>
                    </div>`;
                return;
            }

            updateModalHeaderChrome(swalRootEl, list, { loading: false });

            container.innerHTML = list
                .map((n) => {
                    const meta = pickTypeMeta(n.type);
                    const unread = isNotifUnread(n);
                    const created = n.created_timestamp || n.created_at;
                    return `
                        <div
                            class="student-notif-modal-row group px-4 py-3.5 border-b border-slate-100/90 last:border-0 hover:bg-white transition-colors cursor-pointer text-left ${
                                unread ? 'bg-indigo-50/70 border-l-[3px] border-l-indigo-500 pl-[13px]' : 'bg-white/60'
                            }"
                            data-student-notif-id="${Number(n.id)}"
                            role="button"
                            tabindex="0"
                        >
                            <div class="flex items-start gap-3">
                                <div class="flex-shrink-0 mt-0.5">
                                    <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ring-1 ring-black/5 ${meta.cls}">
                                        <i class="fas ${meta.icon} text-sm"></i>
                                    </div>
                                </div>
                                <div class="flex-1 min-w-0 pt-0.5">
                                    <div class="flex items-start justify-between gap-2">
                                        <p class="text-sm font-semibold text-slate-900 leading-snug">${escHtml(n.title || 'Notification')}</p>
                                        ${
                                            unread
                                                ? '<span class="shrink-0 mt-0.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-indigo-100" aria-label="Unread"></span>'
                                                : ''
                                        }
                                    </div>
                                    <p class="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-3">${escHtml(n.message || '')}</p>
                                    <p class="text-[11px] font-medium text-slate-400 mt-2 uppercase tracking-wide">${created ? escHtml(formatTime(created)) : ''}</p>
                                </div>
                            </div>
                        </div>`;
                })
                .join('');

            container.querySelectorAll('.student-notif-modal-row[data-student-notif-id]').forEach((el) => {
                const go = async () => {
                    const id = el.getAttribute('data-student-notif-id');
                    const notif = list.find((x) => String(x.id) === String(id));
                    if (!notif) return;
                    if (typeof window.markNotificationAsRead === 'function') {
                        await window.markNotificationAsRead(notif.id);
                    }
                    if (tryNavigateForStudentNotification(notif)) {
                        if (window.Swal) window.Swal.close();
                    } else {
                        await refreshStudentNotificationsModal(swalRootEl);
                    }
                };
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    go();
                });
                el.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        go();
                    }
                });
            });
        } catch (e) {
            console.error('refreshStudentNotificationsModal:', e);
            updateModalHeaderChrome(swalRootEl, [], { loading: false });
            container.innerHTML = `
                <div class="text-center py-12 px-5">
                    <p class="text-sm font-semibold text-slate-800">Something went wrong</p>
                    <button type="button" id="studentNotifRetryBtn2" class="mt-4 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold px-4 py-2 hover:bg-slate-50 transition-colors">
                        Try again
                    </button>
                </div>`;
            const retry = container.querySelector('#studentNotifRetryBtn2');
            if (retry) {
                retry.addEventListener('click', (e) => {
                    e.preventDefault();
                    refreshStudentNotificationsModal(swalRootEl);
                });
            }
        }
    }

    function ensureStudentNotifModalStyles() {
        if (document.getElementById('studentNotifModalStyles')) return;
        const st = document.createElement('style');
        st.id = 'studentNotifModalStyles';
        st.textContent = `
            .student-notifications-swal { padding: 0 !important; overflow: hidden !important; }
            .student-notifications-swal .swal2-html-container {
                margin: 0 !important;
                padding: 0 !important;
                max-height: none !important;
            }
            .student-notifications-swal .swal2-close {
                top: 0.85rem;
                right: 0.75rem;
                color: rgba(255,255,255,0.9) !important;
                font-size: 1.75rem;
                box-shadow: none;
            }
            .student-notifications-swal .swal2-close:hover { color: #fff !important; }
            .student-notifications-swal #studentNotifMarkAllBtn:disabled {
                pointer-events: none;
            }
        `;
        document.head.appendChild(st);
    }

    async function openStudentNotificationsHistoryModal() {
        if (!window.Swal || typeof window.Swal.fire !== 'function') {
            if (window.notificationSystem) {
                await window.notificationSystem.loadNotifications(MODAL_LIMIT);
                if (!window.notificationSystem.isDropdownOpen) {
                    window.notificationSystem.toggleDropdown();
                }
            }
            return;
        }

        ensureStudentNotifModalStyles();

        const modalHtml = `
            <div class="text-left overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-xl">
                <div class="relative bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-5 pt-5 pb-4 text-white">
                    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 pr-8">
                        <div class="flex items-start gap-3 min-w-0">
                            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                                <i class="fas fa-bell text-lg text-white/95"></i>
                            </div>
                            <div class="min-w-0">
                                <h2 class="text-base font-bold tracking-tight text-white">All notifications</h2>
                                <p id="studentNotifModalSubline" class="text-sm text-indigo-100/95 mt-0.5 leading-snug">Loading…</p>
                            </div>
                        </div>
                        <button type="button" id="studentNotifMarkAllBtn"
                            class="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 shadow-md shadow-indigo-900/10 transition hover:bg-indigo-50 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none">
                            <i class="fas fa-check-double text-[11px] opacity-90"></i>
                            <span id="studentNotifMarkAllLabel">Mark all as read</span>
                        </button>
                    </div>
                    <p class="mt-3 text-[11px] leading-relaxed text-indigo-100/80 border-t border-white/10 pt-3">
                        Newest first. Tap a row to mark it read and jump to the related page when available.
                    </p>
                </div>
                <div id="studentAllNotificationsContainer" class="max-h-[min(58vh,26rem)] overflow-y-auto overscroll-contain bg-slate-50/90">
                    ${modalLoadingHtml()}
                </div>
            </div>`;

        window.Swal.fire({
            title: '',
            html: modalHtml,
            icon: false,
            showConfirmButton: false,
            showCloseButton: true,
            width: 'min(40rem, calc(100vw - 1.5rem))',
            padding: 0,
            customClass: {
                popup: 'rounded-2xl student-notifications-swal',
                htmlContainer: 'm-0 p-0'
            },
            didOpen: () => {
                const root = window.Swal.getHtmlContainer();
                if (!root) return;

                const markAllBtn = root.querySelector('#studentNotifMarkAllBtn');
                const markAllLabel = root.querySelector('#studentNotifMarkAllLabel');
                if (markAllBtn) {
                    markAllBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (markAllBtn.disabled) return;

                        const prevLabel = markAllLabel ? markAllLabel.textContent : '';
                        markAllBtn.disabled = true;
                        if (markAllLabel) markAllLabel.textContent = 'Marking…';
                        updateModalHeaderChrome(root, null, { loading: true });

                        const result = await requestMarkAllNotificationsRead();

                        if (!result.ok) {
                            markAllBtn.disabled = false;
                            if (markAllLabel) markAllLabel.textContent = prevLabel;
                            if (window.Swal && window.Swal.fire) {
                                window.Swal.fire({
                                    toast: true,
                                    position: 'top-end',
                                    icon: 'error',
                                    title: result.message || 'Could not mark all as read',
                                    showConfirmButton: false,
                                    timer: 3500,
                                    timerProgressBar: true
                                });
                            }
                            await refreshStudentNotificationsModal(root);
                            return;
                        }

                        await refreshNotificationShell();
                        if (markAllLabel) markAllLabel.textContent = prevLabel;
                        await refreshStudentNotificationsModal(root);
                    });
                }

                refreshStudentNotificationsModal(root);
            }
        });
    }

    async function requestMarkAllNotificationsRead() {
        const formData = new FormData();
        formData.append('action', 'mark_all_as_read');
        const res = await fetch('php/notifications.php', {
            method: 'POST',
            body: formData,
            credentials: 'include',
            cache: 'no-store'
        });
        const raw = await res.text();
        const data = safeJsonParse(raw);
        if (!res.ok) {
            return {
                ok: false,
                message: (data && data.message) || `Request failed (${res.status})`
            };
        }
        if (data && data.success === false) {
            return { ok: false, message: data.message || 'Could not mark all as read' };
        }
        return { ok: true, data };
    }

    async function refreshNotificationShell() {
        if (!window.notificationSystem) return;
        await Promise.all([
            window.notificationSystem.loadNotifications(window.notificationSystem.limit),
            window.notificationSystem.loadUnreadCount()
        ]);
    }

    class NotificationSystem {
        constructor(opts = {}) {
            this.limit = Number.isFinite(opts.limit) ? opts.limit : DEFAULT_LIMIT;
            this.notifications = [];
            this.unreadCount = 0;
            this.isDropdownOpen = false;
            this._init();
        }

        get els() {
            return {
                dropdown: document.getElementById('notificationsDropdown'),
                list: document.getElementById('notificationsList'),
                dropdownCount: document.getElementById('dropdownNotificationCount'),
            };
        }

        async _init() {
            try {
                await this.loadNotifications(this.limit);
                await this.loadUnreadCount();
                this.updateBadges();
                this._wireCloseOnOutsideClick();

                setInterval(() => {
                    this.loadUnreadCount();
                }, 30000);
            } catch (e) {
                console.error('Notification init failed:', e);
            }
        }

        _wireCloseOnOutsideClick() {
            document.addEventListener('click', (e) => {
                const { dropdown } = this.els;
                const button =
                    e.target.closest('#notificationButton') ||
                    e.target.closest('[data-notification-toggle="1"]') ||
                    e.target.closest('[onclick*="toggleNotifications"]');
                if (e.target.closest('.swal2-container')) {
                    return;
                }
                if (!button && dropdown && !dropdown.contains(e.target)) {
                    this.closeDropdown();
                }
            });
        }

        updateBadges() {
            const count = Number(this.unreadCount) || 0;
            const text = count > 99 ? '99+' : String(count);
            const show = count > 0;

            // Multiple badges can exist (e.g. desktop + mobile); duplicate IDs are invalid HTML but update all matches.
            document.querySelectorAll('#notificationBadge').forEach((el) => {
                el.textContent = text;
                el.classList.toggle('hidden', !show);
            });
            document.querySelectorAll('#mobileNotificationBadge').forEach((el) => {
                el.textContent = text;
                el.classList.toggle('hidden', !show);
            });
        }

        updateList() {
            const { list, dropdownCount } = this.els;
            if (!list) return;

            if (dropdownCount) dropdownCount.textContent = String(this.notifications.length || 0);

            if (!this.notifications.length) {
                list.innerHTML = `
                    <div class="px-4 py-8 text-center text-slate-500">
                        <i class="fas fa-bell-slash text-2xl mb-2"></i>
                        <p class="text-sm">No notifications yet</p>
                    </div>
                `;
                return;
            }

            list.innerHTML = this.notifications.map((n) => {
                const meta = pickTypeMeta(n.type);
                const created = n.created_timestamp || n.created_at;
                const unread = isNotifUnread(n);
                return `
                    <div class="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${unread ? 'bg-blue-50 border-l-4 border-blue-500' : ''}"
                         onclick="markNotificationAsRead(${Number(n.id)})">
                        <div class="flex items-start space-x-3">
                            <div class="flex-shrink-0 mt-1">
                                <div class="w-8 h-8 rounded-full flex items-center justify-center ${meta.cls}">
                                    <i class="fas ${meta.icon} text-xs"></i>
                                </div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-slate-900 truncate">${String(n.title || 'Notification')}</p>
                                <p class="text-xs text-slate-600 mt-1 line-clamp-2">${String(n.message || '')}</p>
                                <p class="text-xs text-slate-400 mt-1">${created ? formatTime(created) : ''}</p>
                            </div>
                            ${unread ? '<div class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>' : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }

        async loadNotifications(limit = DEFAULT_LIMIT) {
            const { list } = this.els;
            if (list) {
                list.innerHTML = '<div class="px-4 py-4 text-sm text-slate-500">Loading...</div>';
            }

            try {
                const res = await fetch(`php/notifications.php?action=get_notifications&limit=${encodeURIComponent(limit)}`, {
                    credentials: 'include',
                    cache: 'no-store'
                });
                const raw = await res.text();
                const data = safeJsonParse(raw);

                if (!res.ok || !data || !data.success) {
                    this.notifications = [];
                    this.updateList();
                    return;
                }

                const rawList = Array.isArray(data.notifications) ? data.notifications : [];
                const seen = new Set();
                this.notifications = rawList.filter((row) => {
                    const id = Number(row && row.id);
                    if (!Number.isFinite(id) || id <= 0) return false;
                    if (seen.has(id)) return false;
                    seen.add(id);
                    return true;
                });
                this.updateList();
            } catch (e) {
                console.error('loadNotifications error:', e);
                this.notifications = [];
                this.updateList();
            }
        }

        async loadUnreadCount() {
            try {
                const res = await fetch('php/notifications.php?action=get_unread_count', {
                    credentials: 'include',
                    cache: 'no-store'
                });
                const raw = await res.text();
                const data = safeJsonParse(raw);

                if (!res.ok || !data || !data.success) {
                    this.unreadCount = 0;
                    this.updateBadges();
                    return;
                }

                this.unreadCount = Number(data.unread_count) || 0;
                this.updateBadges();
            } catch (e) {
                console.error('loadUnreadCount error:', e);
                this.unreadCount = 0;
                this.updateBadges();
            }
        }

        toggleDropdown() {
            const { dropdown } = this.els;
            if (!dropdown) return;

            const willOpen = !this.isDropdownOpen;
            this.isDropdownOpen = willOpen;
            if (willOpen) {
                dropdown.classList.remove('hidden');
                dropdown.classList.remove('opacity-0', 'invisible');
                dropdown.classList.add('opacity-100', 'visible');
                this.loadNotifications(this.limit);
            } else {
                this.closeDropdown();
            }
        }

        closeDropdown() {
            const { dropdown } = this.els;
            if (!dropdown) return;

            dropdown.classList.add('hidden');
            dropdown.classList.add('opacity-0', 'invisible');
            dropdown.classList.remove('opacity-100', 'visible');
            this.isDropdownOpen = false;
        }
    }

    function enrollmentAllowsNotifications() {
        if (!window.studentEnrollmentCheck) return true;
        const es = window.studentEnrollmentCheck.enrollmentStatus;
        return !!(es && es.has_approved_enrollment);
    }

    function promptEnrollmentIfNeeded() {
        if (window.studentEnrollmentCheck && typeof window.studentEnrollmentCheck.showEnrollmentRequiredModal === 'function') {
            window.studentEnrollmentCheck.showEnrollmentRequiredModal();
            return;
        }
        if (window.Swal) {
            window.Swal.fire({
                title: 'Enrollment Required',
                text: 'You need to join a class to access notifications. Please ask your teacher for the class code.',
                icon: 'info',
                confirmButtonText: 'Join Class',
                confirmButtonColor: '#6366f1',
                background: '#ffffff',
                customClass: { popup: 'rounded-2xl', title: 'text-slate-800', content: 'text-slate-600' }
            }).then(function (result) {
                if (result.isConfirmed && typeof window.openJoinClassModal === 'function') {
                    window.openJoinClassModal();
                }
            });
        } else {
            alert('You need to join a class to access notifications.');
        }
    }

    // Global functions expected by existing HTML onclick handlers
    window.toggleNotifications = function toggleNotifications() {
        if (window.studentEnrollmentCheck && !enrollmentAllowsNotifications()) {
            promptEnrollmentIfNeeded();
            return;
        }
        if (window.notificationSystem) {
            window.notificationSystem.toggleDropdown();
        }
    };

    window.markNotificationAsRead = async function markNotificationAsRead(notificationId) {
        try {
            const formData = new FormData();
            formData.append('action', 'mark_as_read');
            formData.append('notification_id', String(notificationId));

            const res = await fetch('php/notifications.php', {
                method: 'POST',
                body: formData,
                credentials: 'include',
                cache: 'no-store'
            });
            const raw = await res.text().catch(() => '');
            const data = safeJsonParse(raw);
            if (!res.ok || (data && data.success === false)) {
                return;
            }

            await refreshNotificationShell();
        } catch (e) {
            console.error('markNotificationAsRead error:', e);
        }
    };

    window.markAllNotificationsAsRead = async function markAllNotificationsAsRead(ev) {
        if (ev && typeof ev.stopPropagation === 'function') {
            ev.stopPropagation();
        }
        if (ev && typeof ev.preventDefault === 'function') {
            ev.preventDefault();
        }
        try {
            const result = await requestMarkAllNotificationsRead();
            if (!result.ok) {
                if (window.Swal && window.Swal.fire) {
                    window.Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'error',
                        title: result.message || 'Could not mark all as read',
                        showConfirmButton: false,
                        timer: 3500,
                        timerProgressBar: true
                    });
                }
                return;
            }
            await refreshNotificationShell();
        } catch (e) {
            console.error('markAllNotificationsAsRead error:', e);
        }
    };

    /**
     * Opens full notification history in a modal (SweetAlert2). Closes the header dropdown first.
     * @param {Event} [ev] pass the click event so the dropdown does not steal the interaction
     */
    window.showAllNotifications = async function showAllNotifications(ev) {
        if (ev && typeof ev.stopPropagation === 'function') {
            ev.stopPropagation();
        }
        if (ev && typeof ev.preventDefault === 'function') {
            ev.preventDefault();
        }
        if (window.studentEnrollmentCheck && !enrollmentAllowsNotifications()) {
            promptEnrollmentIfNeeded();
            return;
        }
        if (window.notificationSystem) {
            window.notificationSystem.closeDropdown();
        }
        await openStudentNotificationsHistoryModal();
    };

    // Boot
    document.addEventListener('DOMContentLoaded', function () {
        if (!window.notificationSystem) {
            window.notificationSystem = new NotificationSystem({ limit: DEFAULT_LIMIT });
        }
    });
})();

