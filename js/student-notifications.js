// Shared student notification system (used across student pages)
(function () {
    const DEFAULT_LIMIT = 10;

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
                const unread = Number(n.is_read) === 0;
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
                this.updateBadges();
            } catch (e) {
                console.error('loadNotifications error:', e);
                this.notifications = [];
                this.updateList();
                this.updateBadges();
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

            this.isDropdownOpen = !this.isDropdownOpen;
            if (this.isDropdownOpen) {
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
            await res.text().catch(() => '');
            if (!res.ok) return;

            if (window.notificationSystem) {
                await window.notificationSystem.loadNotifications(window.notificationSystem.limit);
                await window.notificationSystem.loadUnreadCount();
            }
        } catch (e) {
            console.error('markNotificationAsRead error:', e);
        }
    };

    window.markAllNotificationsAsRead = async function markAllNotificationsAsRead() {
        try {
            const formData = new FormData();
            formData.append('action', 'mark_all_as_read');

            const res = await fetch('php/notifications.php', {
                method: 'POST',
                body: formData,
                credentials: 'include',
                cache: 'no-store'
            });
            await res.text().catch(() => '');
            if (!res.ok) return;

            if (window.notificationSystem) {
                await window.notificationSystem.loadNotifications(window.notificationSystem.limit);
                await window.notificationSystem.loadUnreadCount();
            }
        } catch (e) {
            console.error('markAllNotificationsAsRead error:', e);
        }
    };

    // Optional: older pages call this
    window.showAllNotifications = async function showAllNotifications() {
        if (window.studentEnrollmentCheck && !enrollmentAllowsNotifications()) {
            promptEnrollmentIfNeeded();
            return;
        }
        if (window.notificationSystem) {
            await window.notificationSystem.loadNotifications(100);
            if (!window.notificationSystem.isDropdownOpen) {
                window.notificationSystem.toggleDropdown();
            }
        }
    };

    // Boot
    document.addEventListener('DOMContentLoaded', function () {
        if (!window.notificationSystem) {
            window.notificationSystem = new NotificationSystem({ limit: DEFAULT_LIMIT });
        }
    });
})();

