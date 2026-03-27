<?php
// Shared student navigation (include in student pages)
// Usage: set $activePage = 'dashboard' | 'quizzes' | 'flashcards' | 'achievements' | 'profile' (optional)
if (!isset($activePage) || !is_string($activePage)) {
    $script = strtolower(basename($_SERVER['SCRIPT_NAME'] ?? ''));
    if (str_contains($script, 'quiz')) $activePage = 'quizzes';
    elseif (str_contains($script, 'flash')) $activePage = 'flashcards';
    elseif (str_contains($script, 'achieve')) $activePage = 'achievements';
    elseif (str_contains($script, 'profile')) $activePage = 'profile';
    else $activePage = 'dashboard';
}

$linkBase = 'text-slate-600 hover:text-slate-800 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200';
$linkActive = 'bg-indigo-50 text-indigo-600 font-medium px-4 py-2 rounded-lg text-sm transition-all duration-200';

function navCls(string $key, string $activePage, string $base, string $active): string {
    return $key === $activePage ? $active : $base;
}
?>

<nav class="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 gap-3">
            <!-- Logo -->
            <a href="dashboard.php" class="flex items-center gap-2 min-w-0">
                <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <img src="css/nav-logo/nav-logo.png" alt="MathEase Logo" class="h-6 w-6 object-contain">
                </div>
                <span class="text-xl font-bold text-slate-800 truncate">MathEase</span>
            </a>

            <!-- Desktop Navigation -->
            <div class="hidden md:flex items-center space-x-1">
                <a href="dashboard.php" class="<?= htmlspecialchars(navCls('dashboard', $activePage, $linkBase, $linkActive)) ?>">Dashboard</a>
                <a href="dashboard.php#learning-path" class="<?= htmlspecialchars($linkBase) ?>">Topics</a>
                <a href="quizzes.php" class="<?= htmlspecialchars(navCls('quizzes', $activePage, $linkBase, $linkActive)) ?>">Quizzes</a>
                <a href="flashcards.php" class="<?= htmlspecialchars(navCls('flashcards', $activePage, $linkBase, $linkActive)) ?>">Flashcards</a>
                <a href="achievements.php" class="<?= htmlspecialchars(navCls('achievements', $activePage, $linkBase, $linkActive)) ?>">Achievements</a>
                <a href="dashboard.php#progress" class="<?= htmlspecialchars($linkBase) ?>">Progress</a>
            </div>

            <!-- Desktop user menu -->
            <div class="hidden md:flex items-center space-x-4">
                <!-- Notifications -->
                <div class="relative group">
                    <button onclick="toggleNotifications()" id="notificationButton" class="relative p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center">
                        <i class="fas fa-bell text-lg"></i>
                        <span id="notificationBadge" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center hidden">0</span>
                    </button>
                    <div id="notificationsDropdown" class="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200/60 py-2 z-50 opacity-0 invisible transition-all duration-200 hidden">
                        <div class="px-4 py-2 border-b border-slate-200/60">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-2">
                                    <h3 class="text-sm font-semibold text-slate-800">Notifications</h3>
                                    <span id="dropdownNotificationCount" class="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">0</span>
                                </div>
                                <button onclick="markAllNotificationsAsRead()" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Mark all read</button>
                            </div>
                        </div>
                        <div id="notificationsList" class="max-h-64 overflow-y-auto">
                            <div class="px-4 py-4 text-sm text-slate-500">Loading...</div>
                        </div>
                        <div class="px-4 py-2 border-t border-slate-200/60">
                            <a href="#" onclick="showAllNotifications(); return false;" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">View all notifications</a>
                        </div>
                    </div>
                </div>

                <!-- Profile Dropdown -->
                <div class="relative group" id="profileDropdownContainer">
                    <button onclick="toggleProfileDropdown()" class="flex items-center space-x-2 text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 min-h-[44px]">
                        <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center overflow-hidden" id="profileIconContainer">
                            <img id="profileIconImage" src="" alt="Profile" class="w-full h-full object-cover hidden">
                            <i class="fas fa-user text-white text-xs" id="profileIconPlaceholder"></i>
                        </div>
                        <span id="userName">Student</span>
                        <i class="fas fa-chevron-down text-xs transition-transform duration-200" id="profileDropdownIcon"></i>
                    </button>
                    <div id="profileDropdown" class="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200/60 py-2 z-50 hidden">
                        <a href="profile.php" class="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                            <i class="fas fa-user-circle mr-3 text-indigo-500"></i>
                            Profile
                        </a>
                        <div class="border-t border-slate-200 my-1"></div>
                        <a href="#" onclick="confirmLogout(event)" class="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors" id="logoutLink">
                            <i class="fas fa-sign-out-alt mr-3 text-red-500"></i>
                            Logout
                        </a>
                    </div>
                </div>
            </div>

            <!-- Mobile hamburger -->
            <div class="md:hidden flex-shrink-0">
                <button type="button" id="mobileMenuButton" class="text-slate-600 hover:text-slate-800 hover:bg-slate-50 p-2 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px]">
                    <i class="fas fa-bars text-lg"></i>
                </button>
            </div>
        </div>
    </div>
</nav>

<script>
    (function () {
        if (document.getElementById('sharedStudentMobileNavStyles')) return;

        const styles = document.createElement('style');
        styles.id = 'sharedStudentMobileNavStyles';
        styles.textContent = `
            .mobile-nav-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, 0.45);
                opacity: 0;
                visibility: hidden;
                transition: opacity .25s ease, visibility .25s ease;
                z-index: 60;
            }
            .mobile-nav-backdrop.active { opacity: 1; visibility: visible; }
            .mobile-nav-menu {
                position: fixed;
                top: 0;
                right: 0;
                width: min(320px, 82vw);
                height: 100vh;
                transform: translateX(100%);
                transition: transform .28s ease;
                z-index: 70;
                background: linear-gradient(145deg, #6366f1, #7c3aed);
                color: #fff;
                box-shadow: -12px 0 28px rgba(0,0,0,.25);
                overflow-y: auto;
            }
            .mobile-nav-menu.active { transform: translateX(0); }
            .mobile-nav-header { padding: 1rem 1rem .75rem; border-bottom: 1px solid rgba(255,255,255,.2); }
            .mobile-nav-brand { display: flex; align-items: center; gap: .75rem; font-weight: 700; }
            .mobile-nav-profile { padding: .75rem 1rem; border-bottom: 1px solid rgba(255,255,255,.2); }
            .mobile-nav-profile .name { font-weight: 600; line-height: 1.2; }
            .mobile-nav-profile .email { font-size: .75rem; opacity: .85; max-width: 190px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .mobile-nav-content { padding: .75rem; }
            .mobile-nav-item {
                display: flex; align-items: center; gap: .75rem;
                color: rgba(255,255,255,.95);
                border-radius: .65rem;
                padding: .75rem .8rem;
                text-decoration: none;
                font-size: .95rem;
                margin-bottom: .15rem;
            }
            .mobile-nav-item:hover, .mobile-nav-item.active { background: rgba(255,255,255,.16); }
            .mobile-nav-item-danger { color: #ffe5e5; }
            .mobile-nav-divider { height: 1px; background: rgba(255,255,255,.2); margin: .5rem 0; }
            .mobile-nav-badge {
                margin-left: auto;
                background: #ef4444; color: #fff; border-radius: 9999px;
                min-width: 20px; height: 20px; padding: 0 6px; font-size: .72rem;
                display: inline-flex; align-items: center; justify-content: center;
            }
            .mobile-nav-badge.hidden { display: none; }
        `;
        document.head.appendChild(styles);

        const page = <?= json_encode($activePage) ?>;
        const active = (k) => page === k ? 'active' : '';
        const existingMenu = document.getElementById('mobileMenu');
        const existingBackdrop = document.getElementById('mobileMenuBackdrop');

        if (!existingMenu) {
            const backdrop = document.createElement('div');
            backdrop.id = 'mobileMenuBackdrop';
            backdrop.className = 'mobile-nav-backdrop';

            const menu = document.createElement('div');
            menu.id = 'mobileMenu';
            menu.className = 'mobile-nav-menu';
            menu.innerHTML = `
                <div class="mobile-nav-header">
                    <div class="mobile-nav-brand">
                        <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <img src="css/nav-logo/nav-logo.png" alt="MathEase Logo" class="h-6 w-6 object-contain">
                        </div>
                        <span>MathEase</span>
                    </div>
                </div>
                <div class="mobile-nav-profile">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center overflow-hidden" id="mobileProfileIconContainer">
                            <img id="mobileProfileIconImage" src="" alt="Profile" class="w-full h-full object-cover hidden">
                            <i class="fas fa-user text-white text-sm" id="mobileProfileIconPlaceholder"></i>
                        </div>
                        <div>
                            <div class="name" id="mobileUserName">Student</div>
                            <div class="email" id="mobileUserEmail">student@mathease.local</div>
                        </div>
                    </div>
                </div>
                <div class="mobile-nav-content">
                    <a href="dashboard.php" class="mobile-nav-item ${active('dashboard')}"><i class="fas fa-home"></i><span>Dashboard</span></a>
                    <a href="dashboard.php#learning-path" class="mobile-nav-item"><i class="fas fa-book"></i><span>Topics</span></a>
                    <a href="quizzes.php" class="mobile-nav-item ${active('quizzes')}"><i class="fas fa-question-circle"></i><span>Quizzes</span></a>
                    <a href="flashcards.php" class="mobile-nav-item ${active('flashcards')}"><i class="fas fa-book-open"></i><span>Flashcards</span></a>
                    <a href="achievements.php" class="mobile-nav-item ${active('achievements')}"><i class="fas fa-medal"></i><span>Achievements</span></a>
                    <a href="dashboard.php#progress" class="mobile-nav-item"><i class="fas fa-chart-line"></i><span>Progress</span></a>
                    <div class="mobile-nav-divider"></div>
                    <a href="#" class="mobile-nav-item" id="mobileNotificationLink"><i class="fas fa-bell"></i><span>Notifications</span><span id="mobileNotificationBadge" class="mobile-nav-badge hidden">0</span></a>
                    <a href="profile.php" class="mobile-nav-item"><i class="fas fa-user-circle"></i><span>Profile</span></a>
                    <a href="#" class="mobile-nav-item mobile-nav-item-danger" id="mobileLogoutLink"><i class="fas fa-sign-out-alt"></i><span>Logout</span></a>
                </div>
            `;

            document.body.appendChild(backdrop);
            document.body.appendChild(menu);
        }

        const button = document.getElementById('mobileMenuButton');
        const menu = document.getElementById('mobileMenu');
        const backdrop = document.getElementById('mobileMenuBackdrop');
        if (!button || !menu || !backdrop || button.dataset.bound === '1') return;

        const openMenu = () => {
            menu.classList.add('active');
            backdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
        };
        const closeMenu = () => {
            menu.classList.remove('active');
            backdrop.classList.remove('active');
            document.body.style.overflow = '';
        };

        button.dataset.bound = '1';
        button.addEventListener('click', openMenu);
        backdrop.addEventListener('click', closeMenu);
        menu.addEventListener('click', (e) => {
            const action = e.target.closest('a');
            if (!action) return;
            if (action.id === 'mobileNotificationLink') {
                e.preventDefault();
                if (typeof toggleNotifications === 'function') toggleNotifications();
                closeMenu();
                return;
            }
            if (action.id === 'mobileLogoutLink') {
                e.preventDefault();
                if (typeof confirmLogout === 'function') confirmLogout(e);
                else window.location.href = 'php/smart-logout.php?type=student';
                return;
            }
            closeMenu();
        });
    })();
</script>

