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

            <!-- Mobile menu (simple select) -->
            <div class="md:hidden">
                <select id="mobileNavSelect" class="w-44 px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700">
                    <option value="dashboard.php" <?= $activePage === 'dashboard' ? 'selected' : '' ?>>Dashboard</option>
                    <option value="dashboard.php#learning-path">Topics</option>
                    <option value="quizzes.php" <?= $activePage === 'quizzes' ? 'selected' : '' ?>>Quizzes</option>
                    <option value="flashcards.php" <?= $activePage === 'flashcards' ? 'selected' : '' ?>>Flashcards</option>
                    <option value="achievements.php" <?= $activePage === 'achievements' ? 'selected' : '' ?>>Achievements</option>
                    <option value="dashboard.php#progress">Progress</option>
                </select>
            </div>
        </div>
    </div>
</nav>

<script>
    (function () {
        const mobileNavSelect = document.getElementById('mobileNavSelect');
        if (mobileNavSelect && !mobileNavSelect.dataset.bound) {
            mobileNavSelect.dataset.bound = '1';
            mobileNavSelect.addEventListener('change', (e) => {
                const v = e.target.value;
                if (v) window.location.href = v;
            });
        }
    })();
</script>

