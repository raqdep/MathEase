/**
 * 3D-style floating math symbols on orbital paths — hero background (dashboard, landing, etc.).
 * Mount: [data-math-orbits-hero] with nested [data-math-orbits-canvas].
 * Respects prefers-reduced-motion (static frame). Pauses when tab is hidden.
 */
(function () {
    'use strict';

    var SYMBOLS = ['+', '−', '×', '÷', '√', '∑', '∫', 'π', '^', '∞', '%', 'θ', 'Δ'];

    function rotateX(x, y, z, angle) {
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        return { x: x, y: y * cos - z * sin, z: y * sin + z * cos };
    }

    function rotateY(x, y, z, angle) {
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        return { x: x * cos + z * sin, y: y, z: -x * sin + z * cos };
    }

    function buildOrbits(numOrbits, scale) {
        var orbits = [];
        var i;
        for (i = 1; i <= numOrbits; i++) {
            var radius = (48 + i * 72) * scale;
            var speed = 0.006 + Math.random() * 0.012;
            var tiltSpeedX = 0.0008 + Math.random() * 0.0015;
            var tiltSpeedY = 0.0008 + Math.random() * 0.0015;
            var symbolCount = 2 + Math.floor(Math.random() * 4);
            var orbitSymbols = [];
            var j;
            for (j = 0; j < symbolCount; j++) {
                var sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
                var size = Math.round((14 + Math.random() * 22) * Math.max(0.85, scale));
                var angle = Math.random() * Math.PI * 2;
                var bubbleOpacity = 0.35 + Math.random() * 0.4;
                orbitSymbols.push({ sym: sym, size: size, angle: angle, bubbleOpacity: bubbleOpacity });
            }
            orbits.push({
                radius: radius,
                speed: speed,
                tiltSpeedX: tiltSpeedX,
                tiltSpeedY: tiltSpeedY,
                orbitSymbols: orbitSymbols,
                rotation: Math.random() * Math.PI * 2,
                tiltX: Math.random() * Math.PI * 0.2 - 0.1,
                tiltY: Math.random() * Math.PI * 0.2 - 0.1
            });
        }
        return orbits;
    }

    function resizeCanvas(canvas, hero) {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var w = hero.clientWidth;
        var h = hero.clientHeight;
        if (w < 1 || h < 1) return;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        var ctx = canvas.getContext('2d');
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function heroSymbolFont(hero) {
        try {
            var f = window.getComputedStyle(hero).fontFamily;
            if (f && f.trim()) return f;
        } catch (e) { /* ignore */ }
        return 'Inter, ui-sans-serif, system-ui, sans-serif';
    }

    /** Orbit origin: center (default), top-left / upper-left, or bottom-left (data-math-orbits-anchor) */
    function getOrbitCenter(cw, ch, hero) {
        var anchor = '';
        try {
            anchor = (hero.getAttribute('data-math-orbits-anchor') || 'center').trim().toLowerCase().replace(/\s+/g, '-');
        } catch (e) { /* ignore */ }
        if (anchor === 'top-left' || anchor === 'upper-left') {
            return { x: cw * 0.2, y: ch * 0.2 };
        }
        if (anchor === 'bottom-left') {
            return { x: cw * 0.2, y: ch * 0.86 };
        }
        return { x: cw * 0.5, y: ch * 0.5 };
    }

    function drawFrame(ctx, canvas, orbits, center, frozen, symbolFont, hero) {
        var cw = canvas.clientWidth;
        var ch = canvas.clientHeight;
        if (!cw || !ch) return;

        ctx.clearRect(0, 0, cw, ch);

        var cpos = getOrbitCenter(cw, ch, hero);
        center.x = cpos.x;
        center.y = cpos.y;

        orbits.forEach(function (orbit) {
            if (!frozen) {
                orbit.rotation += orbit.speed;
                orbit.tiltX += orbit.tiltSpeedX;
                orbit.tiltY += orbit.tiltSpeedY;
            }

            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 1;

            var steps = 80;
            var i;
            for (i = 0; i <= steps; i++) {
                var angle = (i / steps) * Math.PI * 2;
                var x = orbit.radius * Math.cos(angle);
                var y = orbit.radius * Math.sin(angle);
                var z = 0;
                var rotated = rotateX(x, y, z, orbit.tiltX);
                rotated = rotateY(rotated.x, rotated.y, rotated.z, orbit.tiltY);
                var screenX = center.x + rotated.x;
                var screenY = center.y + rotated.y;
                if (i === 0) ctx.moveTo(screenX, screenY);
                else ctx.lineTo(screenX, screenY);
            }
            ctx.stroke();

            orbit.orbitSymbols.forEach(function (item) {
                var sx = orbit.radius * Math.cos(item.angle + orbit.rotation);
                var sy = orbit.radius * Math.sin(item.angle + orbit.rotation);
                var sz = 0;
                var r = rotateX(sx, sy, sz, orbit.tiltX);
                r = rotateY(r.x, r.y, r.z, orbit.tiltY);
                var px = center.x + r.x;
                var py = center.y + r.y;

                ctx.save();
                ctx.font = '600 ' + item.size + 'px ' + symbolFont;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                var metrics = ctx.measureText(item.sym);
                var tw = metrics.width;
                var th = item.size * 0.92;
                var bubbleR = Math.max(tw, th) * 0.52 + 7;

                var bo = typeof item.bubbleOpacity === 'number' ? item.bubbleOpacity : 0.5;
                var strokeA = Math.min(0.55, bo * 0.55 + 0.08);

                ctx.beginPath();
                ctx.arc(px, py, bubbleR, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, ' + bo + ')';
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, ' + strokeA + ')';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(30, 27, 75, 0.92)';
                ctx.fillText(item.sym, px, py);
                ctx.restore();
            });
        });
    }

    function init() {
        var hero = document.querySelector('[data-math-orbits-hero]');
        var canvas = hero ? hero.querySelector('[data-math-orbits-canvas]') : null;
        if (!canvas || !hero) return;

        var ctx = canvas.getContext('2d');
        if (!ctx) return;

        var symbolFont = heroSymbolFont(hero);
        var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var center = { x: 0, y: 0 };
        var orbits = [];
        var rafId = null;
        var running = false;

        function syncOrbits() {
            var cw = hero.clientWidth;
            var ch = hero.clientHeight;
            var scale = Math.min(cw, ch) / 720;
            if (scale < 0.45) scale = 0.45;
            if (scale > 1.15) scale = 1.15;
            var num = cw < 640 ? 4 : 6;
            orbits = buildOrbits(num, scale);
        }

        function loop() {
            if (!running || document.hidden) {
                rafId = null;
                return;
            }
            drawFrame(ctx, canvas, orbits, center, false, symbolFont, hero);
            rafId = requestAnimationFrame(loop);
        }

        function start() {
            if (reduced) return;
            running = true;
            if (rafId == null) rafId = requestAnimationFrame(loop);
        }

        function stop() {
            running = false;
            if (rafId != null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }

        function onResize() {
            symbolFont = heroSymbolFont(hero);
            resizeCanvas(canvas, hero);
            syncOrbits();
            drawFrame(ctx, canvas, orbits, center, reduced, symbolFont, hero);
        }

        resizeCanvas(canvas, hero);
        syncOrbits();
        drawFrame(ctx, canvas, orbits, center, reduced, symbolFont, hero);

        if (!reduced) {
            start();
            document.addEventListener('visibilitychange', function () {
                if (document.hidden) stop();
                else start();
            });
        }

        if (typeof ResizeObserver !== 'undefined') {
            var ro = new ResizeObserver(function () {
                onResize();
                if (!reduced && !document.hidden) {
                    stop();
                    start();
                }
            });
            ro.observe(hero);
        } else {
            window.addEventListener('resize', onResize);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
