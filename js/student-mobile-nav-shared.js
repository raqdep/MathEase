// Shared student mobile navigation drawer for .html pages.
// Keeps hamburger menu layout/style consistent across sections.
(function () {
    const PAGE_MAP = {
        dashboard: 'dashboard.html',
        topics: 'dashboard.html#learning-path',
        quizzes: 'quizzes.html',
        flashcards: 'flashcards.html',
        achievements: 'achievements.html',
        progress: 'dashboard.html#progress',
        profile: 'profile.html'
    };

    function getActivePageKey() {
        const p = (window.location.pathname || '').toLowerCase();
        if (p.includes('quizzes')) return 'quizzes';
        if (p.includes('flashcards')) return 'flashcards';
        if (p.includes('achievements')) return 'achievements';
        if (p.includes('profile')) return 'profile';
        return 'dashboard';
    }

    function ensureStyles() {
        if (document.getElementById('sharedStudentMobileNavStyles')) return;
        const style = document.createElement('style');
        style.id = 'sharedStudentMobileNavStyles';
        style.textContent = `
            .mobile-menu-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, 0.45);
                opacity: 0;
                visibility: hidden;
                transition: opacity .25s ease, visibility .25s ease;
                z-index: 60;
            }
            .mobile-menu-backdrop.active { opacity: 1; visibility: visible; }
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
                padding-bottom: 12px;
            }
            .mobile-nav-menu.active { transform: translateX(0); }
            .mobile-nav-header { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,.2); }
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
        document.head.appendChild(style);
    }

    function ensureHamburgerButton() {
        let btn = document.getElementById('mobileMenuButton');
        if (btn) return btn;

        const select = document.getElementById('mobileNavSelect');
        if (select) {
            const parent = select.parentElement;
            select.style.display = 'none';
            btn = document.createElement('button');
            btn.type = 'button';
            btn.id = 'mobileMenuButton';
            btn.className = 'text-slate-600 hover:text-slate-800 hover:bg-slate-50 p-2 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px]';
            btn.innerHTML = '<i class="fas fa-bars text-lg"></i>';
            parent.appendChild(btn);
            return btn;
        }

        const genericMobileBtn = document.querySelector('.md\\:hidden button');
        if (genericMobileBtn) {
            genericMobileBtn.id = 'mobileMenuButton';
            return genericMobileBtn;
        }
        return null;
    }

    function buildDrawerIfMissing(activeKey) {
        if (document.getElementById('mobileMenu') && document.getElementById('mobileMenuBackdrop')) return;

        const backdrop = document.createElement('div');
        backdrop.id = 'mobileMenuBackdrop';
        backdrop.className = 'mobile-menu-backdrop';

        const userName = (document.getElementById('userName')?.textContent || 'Student').trim();
        const userEmail = (document.getElementById('studentEmail')?.textContent || 'student@mathease.local').trim();
        const profileImg = document.getElementById('profileIconImage');
        const profileSrc = profileImg && !profileImg.classList.contains('hidden') ? profileImg.src : '';

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
                    <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                        ${profileSrc ? `<img src="${profileSrc}" alt="Profile" class="w-full h-full object-cover">` : '<i class="fas fa-user text-white text-sm"></i>'}
                    </div>
                    <div>
                        <div class="name">${userName}</div>
                        <div class="email">${userEmail}</div>
                    </div>
                </div>
            </div>
            <div class="mobile-nav-content">
                <a href="${PAGE_MAP.dashboard}" class="mobile-nav-item ${activeKey === 'dashboard' ? 'active' : ''}"><i class="fas fa-home"></i><span>Dashboard</span></a>
                <a href="${PAGE_MAP.topics}" class="mobile-nav-item"><i class="fas fa-book"></i><span>Topics</span></a>
                <a href="${PAGE_MAP.quizzes}" class="mobile-nav-item ${activeKey === 'quizzes' ? 'active' : ''}"><i class="fas fa-question-circle"></i><span>Quizzes</span></a>
                <a href="${PAGE_MAP.flashcards}" class="mobile-nav-item ${activeKey === 'flashcards' ? 'active' : ''}"><i class="fas fa-book-open"></i><span>Flashcards</span></a>
                <a href="${PAGE_MAP.achievements}" class="mobile-nav-item ${activeKey === 'achievements' ? 'active' : ''}"><i class="fas fa-medal"></i><span>Achievements</span></a>
                <a href="${PAGE_MAP.progress}" class="mobile-nav-item"><i class="fas fa-chart-line"></i><span>Progress</span></a>
                <div class="mobile-nav-divider"></div>
                <a href="#" class="mobile-nav-item" id="mobileNotificationLink"><i class="fas fa-bell"></i><span>Notifications</span><span id="mobileNotificationBadge" class="mobile-nav-badge hidden">0</span></a>
                <a href="${PAGE_MAP.profile}" class="mobile-nav-item ${activeKey === 'profile' ? 'active' : ''}"><i class="fas fa-user-circle"></i><span>Profile</span></a>
                <a href="#" class="mobile-nav-item mobile-nav-item-danger" id="mobileLogoutLink"><i class="fas fa-sign-out-alt"></i><span>Logout</span></a>
            </div>
        `;

        document.body.appendChild(backdrop);
        document.body.appendChild(menu);
    }

    function bindInteractions() {
        const button = document.getElementById('mobileMenuButton');
        const menu = document.getElementById('mobileMenu');
        const backdrop = document.getElementById('mobileMenuBackdrop');
        if (!button || !menu || !backdrop || button.dataset.sharedBound === '1') return;

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

        button.dataset.sharedBound = '1';
        button.addEventListener('click', openMenu);
        backdrop.addEventListener('click', closeMenu);

        menu.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;
            if (link.id === 'mobileNotificationLink') {
                e.preventDefault();
                if (typeof toggleNotifications === 'function') toggleNotifications();
                closeMenu();
                return;
            }
            if (link.id === 'mobileLogoutLink') {
                e.preventDefault();
                if (typeof confirmLogout === 'function') confirmLogout(e);
                else window.location.href = 'php/smart-logout.php?type=student';
                return;
            }
            closeMenu();
        });
    }

    function init() {
        ensureStyles();
        const activeKey = getActivePageKey();
        ensureHamburgerButton();
        buildDrawerIfMissing(activeKey);
        bindInteractions();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

