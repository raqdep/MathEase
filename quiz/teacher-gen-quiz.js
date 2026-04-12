/**
 * Teacher-generated quiz — same integration as functions-quiz (quiz-management.php).
 * quiz_type = teacher_gen_{id}
 */
(function () {
    const params = new URLSearchParams(window.location.search);
    const quizId = parseInt(params.get('id') || '0', 10);
    const QUIZ_TYPE = quizId ? 'teacher_gen_' + quizId : '';

    let quizTitle = 'Teacher Quiz';
    let totalQuestions = 0;
    let tgOrder = [];
    let currentAttemptId = null;
    let quizStartTime = null;
    let quizDuration = 0;
    let timerInterval = null;
    let timeLimitMinutes = 60;

    let isQuizActive = false;
    let tabSwitchCount = 0;
    let maxTabSwitches = 3;
    let fullscreenExitCount = 0;
    let maxFullscreenExits = 3;
    let intentionalFsExit = false;

    function esc(s) {
        const d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    async function fetchJson(url, opt) {
        const r = await fetch(url, Object.assign({ credentials: 'include' }, opt || {}));
        return r.json();
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function tickTimer() {
        quizDuration = Math.floor((Date.now() - quizStartTime) / 1000);
        const m = String(Math.floor(quizDuration / 60)).padStart(2, '0');
        const s = String(quizDuration % 60).padStart(2, '0');
        const t = m + ':' + s;
        const el = document.getElementById('quizTimer');
        const mb = document.getElementById('quizTimerMobile');
        if (el) el.textContent = t;
        if (mb) mb.textContent = t;
    }

    function startTimer() {
        quizStartTime = Date.now();
        tickTimer();
        timerInterval = setInterval(tickTimer, 1000);
    }

    function updateProgressUI() {
        let answered = 0;
        for (let i = 1; i <= totalQuestions; i++) {
            const mc = document.querySelector('input[name="q' + i + '"]:checked');
            const txt = document.querySelector('input[name="q' + i + '"].tg-text-answer');
            if (mc || (txt && txt.value.trim() !== '')) answered++;
        }
        const pct = totalQuestions ? Math.round((answered / totalQuestions) * 100) : 0;
        const pt = document.getElementById('progressText');
        const bar = document.getElementById('progressBar');
        if (pt) pt.textContent = answered + '/' + totalQuestions;
        if (bar) bar.style.width = pct + '%';
    }

    function buildQuizUI(data) {
        quizTitle = data.title || 'Quiz';
        tgOrder = data.order || [];
        totalQuestions = (data.questions || []).length;
        document.getElementById('quizTitle').textContent = quizTitle;
        document.getElementById('badgeQuizLabel').textContent = 'Teacher quiz';
        const head = document.getElementById('progressTimerHeader');
        if (head) head.classList.remove('hidden');

        const wrap = document.getElementById('quizContainer');
        wrap.innerHTML = '';
        const qs = data.questions || [];
        qs.forEach(function (q, idx) {
            const num = idx + 1;
            const card = document.createElement('div');
            card.className = 'question-card p-6 sm:p-8 mb-6';
            card.setAttribute('data-question', String(num));
            let inner = '<div class="relative z-10 p-4 sm:p-6 mb-4"><h2 class="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 leading-tight">' + esc(q.question) + '</h2>';
            inner += '<p class="text-sm text-gray-500 mt-2">' + esc(q.cognitive_level || '') + ' · ' + esc(q.difficulty || '') + '</p></div>';
            if (q.type === 'multiple_choice' && (q.choices || []).length) {
                inner += '<div class="relative z-10 space-y-3">';
                q.choices.forEach(function (c, ci) {
                    const letter = String.fromCharCode(97 + ci);
                    inner += '<label class="quiz-option"><input type="radio" name="q' + num + '" value="' + letter + '" class="hidden">';
                    inner += '<div class="option-label">' + letter + '</div><span class="flex-1">' + esc(c) + '</span></label>';
                });
                inner += '</div>';
            } else {
                inner += '<div class="relative z-10"><input type="text" name="q' + num + '" class="tg-text-answer w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg" placeholder="Your answer"></div>';
            }
            card.innerHTML = inner;
            wrap.appendChild(card);
        });

        const submitRow = document.createElement('div');
        submitRow.className = 'text-center mb-8';
        submitRow.id = 'submitButtonContainer';
        submitRow.innerHTML = '<button type="button" id="tgSubmitBtn" class="group relative bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white px-12 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all"><i class="fas fa-paper-plane mr-2"></i> Submit Quiz</button>';
        wrap.appendChild(submitRow);

        wrap.querySelectorAll('input[type="radio"], input.tg-text-answer').forEach(function (el) {
            el.addEventListener('change', function () {
                updateProgressUI();
                if (el.type === 'radio') {
                    const name = el.name;
                    wrap.querySelectorAll('input[name="' + name + '"]').forEach(function (r) {
                        const lb = r.closest('label');
                        if (lb) lb.classList.toggle('selected', r.checked);
                    });
                }
            });
            el.addEventListener('input', updateProgressUI);
        });
        document.getElementById('tgSubmitBtn').addEventListener('click', submitQuiz);
        updateProgressUI();
    }

    async function startQuizInDb() {
        const fd = new FormData();
        fd.append('action', 'start_quiz');
        fd.append('quiz_type', QUIZ_TYPE);
        const res = await fetch('../php/quiz-management.php', { method: 'POST', body: fd, credentials: 'include' });
        const result = await res.json();
        if (result.success) {
            currentAttemptId = result.attempt_id;
            return true;
        }
        if (result.attempt_id && (String(result.message || '').toLowerCase().indexOf('progress') >= 0 || result.attempt_id)) {
            currentAttemptId = result.attempt_id;
            return true;
        }
        throw new Error(result.message || 'Could not start quiz');
    }

    async function tryResumeOrStart() {
        const chk = await fetchJson('../php/quiz-management.php?action=check_existing_attempt&quiz_type=' + encodeURIComponent(QUIZ_TYPE));
        if (!chk.success) {
            throw new Error(chk.message || 'Could not verify quiz status');
        }
        if (chk.attempt && chk.attempt.status === 'completed') {
            throw new Error('You already completed this quiz.');
        }
        if (chk.different_quiz_type && chk.attempt && chk.attempt.quiz_type !== QUIZ_TYPE) {
            throw new Error('Finish your other in-progress quiz first, then return here.');
        }
        if (chk.attempt && chk.attempt.attempt_id && chk.attempt.status === 'in_progress' && chk.attempt.quiz_type === QUIZ_TYPE) {
            currentAttemptId = chk.attempt.attempt_id;
            return;
        }
        await startQuizInDb();
    }

    async function submitQuizToDb(answers, completionTime) {
        const fd = new FormData();
        fd.append('action', 'submit_quiz');
        fd.append('attempt_id', currentAttemptId);
        fd.append('completion_time', String(completionTime));
        Object.keys(answers).forEach(function (k) {
            fd.append('answers[' + k + ']', answers[k]);
        });
        const response = await fetch('../php/quiz-management.php', { method: 'POST', body: fd, credentials: 'include' });
        return response.json();
    }

    async function submitQuiz() {
        if (!currentAttemptId) {
            Swal.fire({ icon: 'error', title: 'No active attempt' });
            return;
        }
        const answers = {};
        answers.tg_order = JSON.stringify(tgOrder);
        for (let i = 1; i <= totalQuestions; i++) {
            const r = document.querySelector('input[name="q' + i + '"]:checked');
            const t = document.querySelector('input[name="q' + i + '"].tg-text-answer');
            if (r) answers['q' + i] = r.value;
            else if (t) answers['q' + i] = t.value.trim();
            else answers['q' + i] = '';
        }
        Swal.fire({ title: 'Submitting…', allowOutsideClick: false, didOpen: function () { Swal.showLoading(); } });
        const result = await submitQuizToDb(answers, quizDuration);
        Swal.close();
        if (!result.success) {
            Swal.fire({ icon: 'error', title: result.message || 'Submit failed' });
            return;
        }
        isQuizActive = false;
        stopTimer();
        stopAntiCheat();
        showResults(result);
    }

    function showResults(result) {
        document.getElementById('tipsContainer').classList.add('hidden');
        document.getElementById('quizContainer').classList.add('hidden');
        document.getElementById('progressTimerHeader').classList.add('hidden');
        const rc = document.getElementById('resultsContainer');
        rc.classList.remove('hidden');
        const pct = result.total_questions ? Math.round((result.score / result.total_questions) * 100) : 0;
        document.getElementById('totalScore').textContent = result.correct_answers + '/' + result.total_questions;
        document.getElementById('overallGrade').textContent = pct + '%';
        document.getElementById('completionTime').textContent = formatTime(quizDuration);
        document.getElementById('gradeProgress').style.width = pct + '%';
        const review = document.getElementById('reviewDetail');
        if (review) review.innerHTML = result.detailedResults || '';
    }

    function formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return m + ':' + String(s).padStart(2, '0');
    }

    async function getLeaderboardFromDatabase() {
        const response = await fetch('../php/quiz-management.php?action=get_leaderboard&quiz_type=' + encodeURIComponent(QUIZ_TYPE) + '&limit=1000&same_class_only=true', { credentials: 'include' });
        const result = await response.json();
        return result.success ? result.leaderboard : [];
    }

    async function getQuizStatisticsFromDatabase() {
        const response = await fetch('../php/quiz-management.php?action=get_statistics&quiz_type=' + encodeURIComponent(QUIZ_TYPE) + '&same_class_only=true', { credentials: 'include' });
        const result = await response.json();
        if (!result.success || !result.statistics) return null;
        return result.statistics[QUIZ_TYPE] || null;
    }

    async function loadLeaderboard() {
        const host = document.getElementById('detailedLeaderboard');
        const podium = document.getElementById('podiumContainer');
        host.innerHTML = '<p class="text-center py-6 text-gray-500">Loading…</p>';
        const data = await getLeaderboardFromDatabase();
        const stats = await getQuizStatisticsFromDatabase();
        if (!data.length) {
            host.innerHTML = '<p class="text-center py-8 text-gray-500">No attempts yet.</p>';
            podium.innerHTML = '';
            return;
        }
        if (stats && stats.total_attempts) {
            document.getElementById('totalParticipants').textContent = stats.total_attempts;
            document.getElementById('averageScore').textContent = Math.round(stats.average_percentage || 0) + '%';
            const ft = document.getElementById('fastestTime');
            if (ft && typeof stats.fastest_time === 'number') {
                ft.textContent = formatTime(stats.fastest_time);
            }
        } else {
            document.getElementById('totalParticipants').textContent = data.length;
            const avg = data.reduce(function (a, b) { return a + parseFloat(b.percentage || 0); }, 0) / data.length;
            document.getElementById('averageScore').textContent = Math.round(avg) + '%';
        }
        const top = data.slice(0, 3);
        podium.innerHTML = top.map(function (s, i) {
            return '<div class="podium-block podium-' + (i + 1) + '"><div class="text-2xl font-bold text-amber-500">' + (i + 1) + '</div><div class="text-sm font-medium mt-2">' + esc(s.student_name) + '</div><div class="text-xs text-gray-600">' + s.score + '/' + s.total_questions + '</div></div>';
        }).join('');
        host.innerHTML = '';
        data.forEach(function (row, idx) {
            const div = document.createElement('div');
            div.className = 'leaderboard-entry' + (row.is_current_user == 1 ? ' you' : '');
            div.innerHTML = '<span class="font-semibold text-gray-700">' + (idx + 1) + '. ' + esc(row.student_name) + '</span><span class="text-indigo-600 font-bold">' + row.score + '/' + row.total_questions + ' (' + row.percentage + '%)</span>';
            host.appendChild(div);
        });
    }

    window.showLeaderboard = async function () {
        document.getElementById('leaderboardContainer').classList.remove('hidden');
        await loadLeaderboard();
        document.getElementById('leaderboardContainer').scrollIntoView({ behavior: 'smooth' });
    };
    window.hideLeaderboard = function () {
        document.getElementById('leaderboardContainer').classList.add('hidden');
    };
    window.goToDashboard = function () {
        window.location.href = '../dashboard.html';
    };

    function initAntiCheat() {
        document.addEventListener('visibilitychange', function () {
            if (!isQuizActive || document.visibilityState === 'visible') return;
            tabSwitchCount++;
            if (tabSwitchCount > maxTabSwitches) markAsCheating('excessive_tab_switches');
        });
        document.addEventListener('fullscreenchange', function () {
            if (!isQuizActive || intentionalFsExit) return;
            if (!document.fullscreenElement) {
                fullscreenExitCount++;
                if (fullscreenExitCount > maxFullscreenExits) markAsCheating('excessive_fullscreen_exits');
            }
        });
    }

    function stopAntiCheat() {
        isQuizActive = false;
    }

    async function markAsCheating(reason) {
        if (!currentAttemptId) return;
        intentionalFsExit = true;
        isQuizActive = false;
        stopTimer();
        await fetch('../php/quiz-management.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=mark_cheating&attempt_id=' + encodeURIComponent(currentAttemptId) + '&reason=' + encodeURIComponent(reason),
            credentials: 'include'
        });
        Swal.fire({ icon: 'error', title: 'Quiz flagged', text: 'Academic integrity policy: this attempt may be scored as zero.' });
        const wrap = document.getElementById('quizContainer');
        if (wrap) {
            wrap.style.pointerEvents = 'none';
            wrap.style.opacity = '0.5';
        }
    }

    window.startQuizFlow = async function () {
        if (!quizId) return;
        try {
            await tryResumeOrStart();
        } catch (e) {
            Swal.fire({ icon: 'warning', title: e.message || 'Could not start', confirmButtonColor: '#6366f1' });
            return;
        }
        document.getElementById('tipsContainer').classList.add('hidden');
        document.getElementById('quizContainer').classList.remove('hidden');
        isQuizActive = true;
        startTimer();
        updateProgressUI();
    };

    async function boot() {
        if (!quizId || !QUIZ_TYPE) {
            Swal.fire({ icon: 'error', title: 'Invalid quiz link' });
            return;
        }
        initAntiCheat();
        try {
            const prof = await fetchJson('../php/get-profile.php');
            if (prof && prof.success && prof.user) {
                const el = document.getElementById('userName');
                if (el) {
                    el.textContent = [prof.user.first_name, prof.user.last_name].filter(Boolean).join(' ') || 'Student';
                }
            }
        } catch (e) { /* optional */ }

        const data = await fetchJson('../php/quiz-generator/student-get-quiz.php?id=' + encodeURIComponent(quizId));
        if (!data.success) {
            Swal.fire({ icon: 'error', title: data.message || 'Cannot load quiz' });
            return;
        }
        buildQuizUI(data);
    }

    document.addEventListener('DOMContentLoaded', boot);
})();
