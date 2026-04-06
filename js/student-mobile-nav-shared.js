// Shared student mobile navigation — hamburger, drawer, links (all student .html pages).
(function () {
    var PAGE_MAP = {
        dashboard: 'dashboard.html',
        topics: 'dashboard.html#learning-path',
        quizzes: 'quizzes.html',
        flashcards: 'flashcards.html',
        achievements: 'achievements.html',
        progress: 'dashboard.html#progress',
        profile: 'profile.html'
    };

    function getActivePageKey() {
        var p = (window.location.pathname || '').toLowerCase();
        if (p.indexOf('quizzes') !== -1) return 'quizzes';
        if (p.indexOf('flashcards') !== -1) return 'flashcards';
        if (p.indexOf('achievements') !== -1) return 'achievements';
        if (p.indexOf('profile') !== -1) return 'profile';
        return 'dashboard';
    }

    function ensureStylesFallback() {
        if (document.querySelector('link[href*="student-mobile-nav.css"]')) return;
        if (document.getElementById('sharedStudentMobileNavStyles')) return;
        var style = document.createElement('style');
        style.id = 'sharedStudentMobileNavStyles';
        style.textContent =
            '.mobile-menu-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.45);opacity:0;visibility:hidden;transition:opacity .25s;z-index:998}' +
            '.mobile-menu-backdrop.active{opacity:1;visibility:visible}' +
            '.mobile-nav-menu{position:fixed;top:0;right:-100%;width:min(300px,88vw);height:100vh;transition:right .28s;z-index:999;' +
            'background:linear-gradient(180deg,#4f46e5,#7c3aed);display:flex;flex-direction:column;overflow:hidden}' +
            '.mobile-nav-menu.active{right:0}';
        document.head.appendChild(style);
    }

    function getMenuEls() {
        return {
            menu: document.getElementById('mobileMenu'),
            backdrop: document.getElementById('mobileMenuBackdrop'),
            hamburger: document.getElementById('mobileMenuButton'),
            body: document.body
        };
    }

    function setMenuOpen(open) {
        var els = getMenuEls();
        if (!els.menu || !els.hamburger) return;
        if (open) {
            els.menu.classList.add('active');
            if (els.backdrop) els.backdrop.classList.add('active');
            els.hamburger.classList.add('active');
            els.body.classList.add('menu-open');
        } else {
            els.menu.classList.remove('active');
            if (els.backdrop) els.backdrop.classList.remove('active');
            els.hamburger.classList.remove('active');
            els.body.classList.remove('menu-open');
        }
    }

    function closeMenu() {
        setMenuOpen(false);
    }

    function toggleMenu() {
        var els = getMenuEls();
        if (!els.menu || !els.hamburger) return;
        setMenuOpen(!els.menu.classList.contains('active'));
    }

    window.toggleMobileMenu = toggleMenu;
    window.closeMobileMenu = closeMenu;

    function normalizeHamburgerButton() {
        var btn = document.getElementById('mobileMenuButton');
        if (!btn) return;
        if (!btn.classList.contains('hamburger')) {
            btn.classList.add('hamburger', 'transition-all', 'duration-200');
            btn.setAttribute('aria-label', 'Toggle menu');
            btn.innerHTML = '<span class="bar"></span><span class="bar"></span><span class="bar"></span>';
        }
        btn.removeAttribute('onclick');
    }

    function syncMobileDrawerFromHeader() {
        var mn = document.getElementById('mobileUserName');
        var me = document.getElementById('mobileUserEmail');
        var un = document.getElementById('userName');
        var se = document.getElementById('studentEmail');
        if (mn && un) mn.textContent = (un.textContent || '').trim() || 'Student';
        if (me) {
            var em = '';
            if (se && (se.textContent || '').trim()) em = (se.textContent || '').trim();
            else if (un && un.getAttribute('data-email')) em = un.getAttribute('data-email');
            me.textContent = em || 'Student';
        }
        var pi = document.getElementById('profileIconImage');
        var mpi = document.getElementById('mobileProfileIconImage');
        var mpp = document.getElementById('mobileProfileIconPlaceholder');
        if (pi && mpi && pi.src && !pi.classList.contains('hidden')) {
            mpi.src = pi.src;
            mpi.classList.remove('hidden');
            if (mpp) mpp.classList.add('hidden');
        }
    }

    function drawerHtml(activeKey) {
        var a = function (key) {
            return activeKey === key ? ' active' : '';
        };
        return (
            '<div class="mobile-nav-header">' +
            '<div class="flex items-center space-x-3">' +
            '<div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">' +
            '<img src="Img/logo/logo-white.png" alt="" class="h-6 w-6 object-contain">' +
            '</div>' +
            '<span class="text-xl font-bold text-white">MathEase</span>' +
            '</div></div>' +
            '<div class="mobile-nav-profile">' +
            '<div class="flex items-center space-x-3">' +
            '<div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-white/30" id="mobileProfileIconContainer">' +
            '<img id="mobileProfileIconImage" src="" alt="" class="w-full h-full object-cover hidden">' +
            '<i class="fas fa-user text-white text-base" id="mobileProfileIconPlaceholder"></i>' +
            '</div>' +
            '<div class="flex-1 min-w-0">' +
            '<div class="text-white font-semibold text-sm truncate" id="mobileUserName">Student</div>' +
            '<div class="text-white/70 text-xs truncate" id="mobileUserEmail">Loading...</div>' +
            '</div></div></div>' +
            '<div class="mobile-nav-content">' +
            '<a href="' +
            PAGE_MAP.dashboard +
            '" class="mobile-nav-item' +
            a('dashboard') +
            '" data-mobile-nav><i class="fas fa-home"></i><span class="mobile-nav-label">Dashboard</span></a>' +
            '<a href="' +
            PAGE_MAP.topics +
            '" id="topicsNavLinkMobile" class="mobile-nav-item" data-mobile-nav><i class="fas fa-book"></i><span class="mobile-nav-label">Topics</span></a>' +
            '<a href="' +
            PAGE_MAP.quizzes +
            '" id="quizzesNavLinkMobile" class="mobile-nav-item' +
            a('quizzes') +
            '" data-mobile-nav><i class="fas fa-question-circle"></i><span class="mobile-nav-label">Quizzes</span></a>' +
            '<a href="' +
            PAGE_MAP.flashcards +
            '" id="flashcardsNavLinkMobile" class="mobile-nav-item' +
            a('flashcards') +
            '" data-mobile-nav><i class="fas fa-book-open"></i><span class="mobile-nav-label">Flashcards</span></a>' +
            '<a href="' +
            PAGE_MAP.achievements +
            '" id="achievementsNavLinkMobile" class="mobile-nav-item' +
            a('achievements') +
            '" data-mobile-nav><i class="fas fa-medal"></i><span class="mobile-nav-label">Achievements</span></a>' +
            '<a href="' +
            PAGE_MAP.progress +
            '" id="progressNavLinkMobile" class="mobile-nav-item" data-mobile-nav><i class="fas fa-chart-line"></i><span class="mobile-nav-label">Progress</span></a>' +
            '<div class="mobile-nav-divider"></div>' +
            '<div class="mobile-nav-footer">' +
            '<a href="#" class="mobile-nav-item" id="mobileNotificationLink" data-mobile-nav data-mobile-nav-action="notifications">' +
            '<i class="fas fa-bell"></i><span class="mobile-nav-label">Notifications</span>' +
            '<span id="mobileNotificationBadge" class="mobile-nav-badge hidden">0</span></a>' +
            '<a href="' +
            PAGE_MAP.profile +
            '" class="mobile-nav-item' +
            a('profile') +
            '" data-mobile-nav><i class="fas fa-user-circle"></i><span class="mobile-nav-label">Profile</span></a>' +
            '<a href="#" class="mobile-nav-item mobile-nav-item-danger" data-mobile-nav data-mobile-nav-action="logout">' +
            '<i class="fas fa-sign-out-alt"></i><span class="mobile-nav-label">Logout</span></a>' +
            '</div></div>'
        );
    }

    function buildDrawerIfMissing(activeKey) {
        if (document.getElementById('mobileMenu') && document.getElementById('mobileMenuBackdrop')) return;

        var backdrop = document.createElement('div');
        backdrop.id = 'mobileMenuBackdrop';
        backdrop.className = 'mobile-menu-backdrop md:hidden';

        var menu = document.createElement('div');
        menu.id = 'mobileMenu';
        menu.className = 'mobile-nav-menu md:hidden';
        menu.innerHTML = drawerHtml(activeKey);

        document.body.appendChild(backdrop);
        document.body.appendChild(menu);
    }

    function ensureHamburgerSlot() {
        var btn = document.getElementById('mobileMenuButton');
        if (btn) return btn;

        var select = document.getElementById('mobileNavSelect');
        if (select && select.parentElement) {
            var wrap = select.parentElement;
            select.style.display = 'none';
            var holder = document.createElement('div');
            holder.className = 'student-nav-hamburger md:hidden flex-shrink-0';
            btn = document.createElement('button');
            btn.type = 'button';
            btn.id = 'mobileMenuButton';
            holder.appendChild(btn);
            wrap.appendChild(holder);
            return btn;
        }

        var row = document.querySelector('nav .max-w-7xl > div');
        if (row) {
            var d = document.createElement('div');
            d.className = 'student-nav-hamburger md:hidden flex-shrink-0';
            btn = document.createElement('button');
            btn.type = 'button';
            btn.id = 'mobileMenuButton';
            d.appendChild(btn);
            row.appendChild(d);
            return btn;
        }
        return null;
    }

    function bindNavLinkClicks() {
        var menu = document.getElementById('mobileMenu');
        if (!menu || menu.dataset.navLinksBound === '1') return;
        menu.dataset.navLinksBound = '1';

        menu.addEventListener('click', function (e) {
            var link = e.target.closest('a[data-mobile-nav]');
            if (!link) return;
            if (link.style.pointerEvents === 'none' || link.classList.contains('pointer-events-none')) return;

            var href = (link.getAttribute('href') || '').trim();
            var action = link.getAttribute('data-mobile-nav-action');
            var isDashboard = (window.location.pathname || '').toLowerCase().indexOf('dashboard') !== -1;

            if (action === 'notifications') {
                e.preventDefault();
                closeMenu();
                if (typeof toggleNotifications === 'function') toggleNotifications();
                return;
            }
            if (action === 'logout') {
                e.preventDefault();
                closeMenu();
                if (typeof confirmLogout === 'function') confirmLogout(e);
                else window.location.href = 'php/smart-logout.php?type=student';
                return;
            }
            if (href === '#' || href === '#!') {
                e.preventDefault();
                return;
            }
            if (href.charAt(0) === '#' && href.length > 1) {
                e.preventDefault();
                var target = document.querySelector(href);
                if (target) {
                    closeMenu();
                    setTimeout(function () {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        try {
                            history.pushState(null, '', href);
                        } catch (_) {}
                    }, 350);
                }
                return;
            }
            if (href.indexOf('dashboard.html#progress') !== -1 && isDashboard) {
                e.preventDefault();
                var prog = document.getElementById('progress');
                if (prog) {
                    closeMenu();
                    setTimeout(function () {
                        prog.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        try {
                            history.pushState(null, '', '#progress');
                        } catch (_) {}
                    }, 350);
                } else {
                    closeMenu();
                    setTimeout(function () {
                        window.location.href = href;
                    }, 100);
                }
                return;
            }
            if (href === 'dashboard.html' && isDashboard) {
                e.preventDefault();
                closeMenu();
                return;
            }
            closeMenu();
        });
    }

    function bindGlobalChrome() {
        if (document.documentElement.dataset.studentMobileNavGlobal === '1') return;
        document.documentElement.dataset.studentMobileNavGlobal = '1';

        document.addEventListener('click', function (event) {
            var backdrop = document.getElementById('mobileMenuBackdrop');
            if (backdrop && event.target === backdrop) closeMenu();
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                var m = document.getElementById('mobileMenu');
                if (m && m.classList.contains('active')) closeMenu();
            }
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth >= 768) closeMenu();
        });
    }

    function bindHamburger() {
        var btn = document.getElementById('mobileMenuButton');
        if (!btn || btn.dataset.sharedHamburgerBound === '1') return;
        btn.dataset.sharedHamburgerBound = '1';
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            toggleMenu();
        });
    }

    function init() {
        ensureStylesFallback();
        var activeKey = getActivePageKey();
        ensureHamburgerSlot();
        normalizeHamburgerButton();
        buildDrawerIfMissing(activeKey);
        bindHamburger();
        bindNavLinkClicks();
        bindGlobalChrome();
        syncMobileDrawerFromHeader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.syncStudentMobileNavProfile = syncMobileDrawerFromHeader;
})();
