/**
 * Scatter hero floating formulas randomly across the full landing hero (behind main content).
 */
(function () {
    'use strict';

    function scatter() {
        var wrap = document.querySelector('.hero-floating-formulas');
        if (!wrap) return;

        wrap.querySelectorAll('.formula').forEach(function (el) {
            var left = 3 + Math.random() * 84;
            var top = 6 + Math.random() * 78;
            el.style.left = left + '%';
            el.style.top = top + '%';
            el.style.right = 'auto';
            el.style.bottom = 'auto';
            el.style.animationDelay = (Math.random() * 5) + 's';
            el.style.fontSize = (0.95 + Math.random() * 0.55).toFixed(2) + 'rem';
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scatter);
    } else {
        scatter();
    }
})();
