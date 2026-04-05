/**
 * Student shell: SweetAlert2 logout confirmation.
 * Load after SweetAlert2 and before student-mobile-nav-shared.js (uses confirmLogout).
 */
(function (global) {
    'use strict';

    var LOGOUT_URL = 'php/smart-logout.php?type=student';

    global.confirmLogout = function confirmLogout(event) {
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
        // Avoid duplicate handlers (e.g. dashboard.js) still navigating to href="#".
        if (event && typeof event.stopImmediatePropagation === 'function') {
            event.stopImmediatePropagation();
        }

        function go() {
            global.location.href = LOGOUT_URL;
        }

        if (typeof Swal === 'undefined') {
            if (global.confirm('Are you sure you want to logout?')) go();
            return;
        }

        Swal.fire({
            title: 'Logout?',
            text: 'Are you sure you want to logout?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, logout',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            focusCancel: true
        }).then(function (result) {
            if (result.isConfirmed) go();
        });
    };
})(typeof window !== 'undefined' ? window : this);
