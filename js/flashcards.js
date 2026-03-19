(() => {
    const topicLessonConfig = {
        'functions': { label: 'Functions', lessons: 4 },
        'evaluating-functions': { label: 'Evaluating Functions', lessons: 4 },
        'operations-on-functions': { label: 'Operations on Functions', lessons: 5 },
        'solving-real-life-problems': { label: 'Solving Real-Life Problems', lessons: 4 },
        'rational-functions': { label: 'Rational Functions', lessons: 4 },
        'solving-rational-equations-inequalities': { label: 'Solving Rational Equations and Inequalities', lessons: 4 },
        'representations-of-rational-functions': { label: 'Representations of Rational Functions', lessons: 4 },
        'domain-range-rational-functions': { label: 'Domain and Range of Rational Functions', lessons: 4 },
        'one-to-one-functions': { label: 'One-to-One Functions', lessons: 4 },
        'domain-range-inverse-functions': { label: 'Domain and Range of Inverse Functions', lessons: 4 },
        'simple-interest': { label: 'Simple Interest', lessons: 4 },
        'compound-interest': { label: 'Compound Interest', lessons: 5 },
        'simple-and-compound-values': { label: 'Interest, Maturity, Future, and Present Values', lessons: 5 },
        'solving-interest-problems': { label: 'Solving Problems: Simple and Compound Interest', lessons: 5 }
    };

    const state = {
        topic: 'functions',
        lesson: 1,
        flashcards: [],
        cardOrder: [],
        // key: `${topic}|${lesson}|${cardIndex}` -> { learned: boolean }
        progress: {}
    };

    const els = {
        topicSelect: document.getElementById('flashcardTopic'),
        lessonSelect: document.getElementById('flashcardLesson'),
        generateBtn: document.getElementById('generateFlashcardsBtn'),
        loadingWrap: document.getElementById('flashcardLoading'),
        lockHint: document.getElementById('flashcardLockHint'),
        lockHintText: document.getElementById('flashcardLockHintText'),

        headerTitle: document.getElementById('flashcardsHeaderTitle'),
        headerSubtitle: document.getElementById('flashcardsHeaderSubtitle'),
        learnedCount: document.getElementById('learnedCount'),
        learnedProgressBar: document.getElementById('learnedProgressBar'),
        learnedProgressText: document.getElementById('learnedProgressText'),

        searchInput: document.getElementById('flashcardSearchInput'),
        clearSearchBtn: document.getElementById('flashcardClearSearchBtn'),
        grid: document.getElementById('flashcardsGrid'),

        shuffleBtn: document.getElementById('shuffleCardsBtn'),
        resetLearnedBtn: document.getElementById('resetLearnedBtn'),
        downloadBtn: document.getElementById('downloadFlashcardsBtn')
    };

    const PROGRESS_KEY = 'mathease_flashcards_progress_v1';

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function safeText(v) {
        return typeof v === 'string' ? v : '';
    }

    function loadProgress() {
        try {
            const raw = localStorage.getItem(PROGRESS_KEY);
            state.progress = raw ? JSON.parse(raw) : {};
        } catch (e) {
            state.progress = {};
        }
    }

    function saveProgress() {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progress));
    }

    function progressKey(topic, lesson, cardIndex) {
        return `${topic}|${lesson}|${cardIndex}`;
    }

    function getLearnedCount() {
        let count = 0;
        for (let i = 0; i < 10; i++) {
            const key = progressKey(state.topic, state.lesson, i);
            if (state.progress[key]?.learned) count++;
        }
        return count;
    }

    function updateLearnedProgressUI() {
        const learned = getLearnedCount();
        if (els.learnedCount) els.learnedCount.textContent = String(learned);

        if (els.learnedProgressText) {
            els.learnedProgressText.textContent = `${learned}/10`;
        }
        if (els.learnedProgressBar) {
            const pct = Math.max(0, Math.min(100, (learned / 10) * 100));
            els.learnedProgressBar.style.width = pct + '%';
        }
    }

    function setLockUI(isLocked, message) {
        if (!els.lockHint) return;
        if (isLocked) {
            els.lockHintText.textContent = message || 'This topic is currently locked.';
            els.lockHint.classList.remove('hidden');
            if (els.generateBtn) els.generateBtn.disabled = true;
            els.generateBtn?.classList.add('opacity-60', 'cursor-not-allowed');
        } else {
            els.lockHint.classList.add('hidden');
            if (els.generateBtn) els.generateBtn.disabled = false;
            els.generateBtn?.classList.remove('opacity-60', 'cursor-not-allowed');
        }
    }

    function setLoading(isLoading) {
        if (els.loadingWrap) els.loadingWrap.classList.toggle('hidden', !isLoading);
        if (els.generateBtn) {
            els.generateBtn.disabled = isLoading;
            els.generateBtn.classList.toggle('opacity-60', isLoading);
        }
    }

    function populateTopics() {
        if (!els.topicSelect) return;
        els.topicSelect.innerHTML = Object.entries(topicLessonConfig)
            .map(([slug, cfg]) => `<option value="${slug}">${cfg.label}</option>`)
            .join('');
        els.topicSelect.value = state.topic;
    }

    function populateLessons() {
        if (!els.lessonSelect) return;
        const lessons = topicLessonConfig[state.topic]?.lessons || 4;
        els.lessonSelect.innerHTML = Array.from({ length: lessons }, (_, i) => i + 1)
            .map(n => `<option value="${n}">Lesson ${n}</option>`)
            .join('');
        els.lessonSelect.value = String(state.lesson);
    }

    function renderSkeleton() {
        if (!els.grid) return;
        const items = Array.from({ length: 10 }, () => `<div class="skeleton-card"></div>`).join('');
        els.grid.innerHTML = items;
    }

    function createCardElement(card, cardIndex) {
        const wrap = document.createElement('div');
        wrap.className = 'flashcard';

        const inner = document.createElement('div');
        inner.className = 'flashcard-inner';

        const front = document.createElement('div');
        front.className = 'flashcard-front';

        const frontTitle = document.createElement('div');
        frontTitle.className = 'text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide';
        frontTitle.textContent = `Card ${cardIndex + 1} of 10`;

        const frontText = document.createElement('div');
        frontText.className = 'flashcard-text font-semibold text-slate-900 text-base';
        frontText.textContent = safeText(card.front);

        front.appendChild(frontTitle);
        front.appendChild(frontText);

        const back = document.createElement('div');
        back.className = 'flashcard-back';

        const answerLabel = document.createElement('div');
        answerLabel.className = 'text-sm font-bold text-emerald-800 mb-1';
        answerLabel.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Answer';

        const backText = document.createElement('div');
        backText.className = 'flashcard-text flashcard-answer text-slate-900 font-semibold';
        backText.textContent = safeText(card.back);

        const explWrap = document.createElement('div');
        explWrap.className = 'mt-3 pt-3 border-t border-emerald-200 flashcard-explanation';
        const explTitle = document.createElement('div');
        explTitle.className = 'text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1';
        explTitle.textContent = 'Explanation';

        const explText = document.createElement('div');
        explText.className = 'flashcard-text text-slate-700 text-sm';
        explText.textContent = safeText(card.explanation);

        explWrap.appendChild(explTitle);
        explWrap.appendChild(explText);

        const actions = document.createElement('div');
        actions.className = 'mt-3 flex items-center justify-between gap-3 flashcard-actions';

        const learnedKey = progressKey(state.topic, state.lesson, cardIndex);
        const learned = !!state.progress[learnedKey]?.learned;

        const learnedBtn = document.createElement('button');
        learnedBtn.type = 'button';
        learnedBtn.className = learned
            ? 'px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold'
            : 'px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200';
        learnedBtn.innerHTML = learned
            ? '<i class="fas fa-star mr-2"></i>Learned'
            : '<i class="far fa-star mr-2"></i>Mark Learned';

        learnedBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            state.progress[learnedKey] = { learned: !learned };
            saveProgress();
            renderFlashcards(); // re-render learned button states
        });

        const revealHint = document.createElement('div');
        revealHint.className = 'text-xs text-slate-600';
        revealHint.textContent = 'Tap to flip';

        actions.appendChild(learnedBtn);
        actions.appendChild(revealHint);

        back.appendChild(answerLabel);
        back.appendChild(backText);
        back.appendChild(explWrap);
        back.appendChild(actions);

        inner.appendChild(front);
        inner.appendChild(back);
        wrap.appendChild(inner);

        wrap.addEventListener('click', () => {
            wrap.classList.toggle('flipped');
        });

        wrap.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                wrap.classList.toggle('flipped');
            }
        });

        return wrap;
    }

    function renderFlashcards() {
        if (!els.grid) return;

        const cards = state.flashcards || [];
        const order = state.cardOrder.length ? state.cardOrder : cards.map((_, i) => i);

        const term = (els.searchInput?.value || '').toLowerCase().trim();

        const visible = order.filter(cardIndex => {
            const c = cards[cardIndex];
            if (!c) return false;
            if (!term) return true;
            const blob = `${c.front} ${c.back} ${c.explanation}`.toLowerCase();
            return blob.includes(term);
        });

        els.grid.innerHTML = '';
        if (!visible.length) {
            const empty = document.createElement('div');
            empty.className = 'col-span-full text-center text-slate-500 py-8';
            empty.textContent = 'No flashcards match your search.';
            els.grid.appendChild(empty);
            return;
        }

        visible.forEach(cardIndex => {
            const card = cards[cardIndex];
            els.grid.appendChild(createCardElement(card, cardIndex));
        });

        updateLearnedProgressUI();
    }

    async function waitForEnrollmentReady() {
        let tries = 0;
        while ((!window.studentEnrollmentCheck || !window.studentEnrollmentCheck.enrollmentStatus) && tries < 80) {
            tries++;
            await sleep(100);
        }
    }

    async function checkTopicLockForCurrentSelection() {
        const topicSlug = state.topic;
        if (!window.studentEnrollmentCheck || !window.studentEnrollmentCheck.checkTopicLock) {
            setLockUI(false);
            return;
        }
        const result = await window.studentEnrollmentCheck.checkTopicLock(topicSlug);
        const isLocked = !!result?.is_locked;
        if (isLocked) {
            setLockUI(true, result?.message || 'This topic is currently locked by your teacher.');
        } else {
            setLockUI(false);
        }
    }

    function setHeader() {
        const cfg = topicLessonConfig[state.topic];
        if (els.headerTitle) els.headerTitle.textContent = `Flashcards - ${cfg?.label || 'Topic'}`;
        if (els.headerSubtitle) {
            els.headerSubtitle.textContent = `Lesson ${state.lesson} • Click to flip • Mark learned for review`;
        }
    }

    async function generateFlashcards() {
        setLoading(true);
        renderSkeleton();

        try {
            const payload = {
                action: 'generate',
                topic: state.topic,
                lesson: state.lesson
            };

            const res = await fetch('php/flashcards.php', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!data?.success) {
                throw new Error(data?.message || 'Failed to generate flashcards.');
            }

            const cards = Array.isArray(data.flashcards) ? data.flashcards : [];
            if (cards.length !== 10) {
                throw new Error('AI must return exactly 10 flashcards.');
            }

            state.flashcards = cards;
            state.cardOrder = cards.map((_, i) => i);
            setHeader();

            if (els.searchInput) els.searchInput.value = '';
            if (els.clearSearchBtn) els.clearSearchBtn.classList.add('hidden');

            renderFlashcards();
        } catch (err) {
            console.error(err);
            Swal.fire({
                title: 'Flashcard Generation Failed',
                text: err?.message || 'Something went wrong while generating flashcards.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } finally {
            setLoading(false);
        }
    }

    function shuffleOrder() {
        if (!state.flashcards?.length) return;
        state.cardOrder = state.cardOrder.length ? [...state.cardOrder] : state.flashcards.map((_, i) => i);
        for (let i = state.cardOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [state.cardOrder[i], state.cardOrder[j]] = [state.cardOrder[j], state.cardOrder[i]];
        }
        renderFlashcards();
    }

    function resetLearned() {
        if (!state.flashcards?.length) return;
        for (let i = 0; i < 10; i++) {
            const key = progressKey(state.topic, state.lesson, i);
            delete state.progress[key];
        }
        saveProgress();
        renderFlashcards();
    }

    function downloadFlashcards() {
        if (!state.flashcards?.length) return;
        const content = {
            topic: state.topic,
            lesson: state.lesson,
            topic_label: topicLessonConfig[state.topic]?.label || state.topic,
            generated_at: new Date().toISOString(),
            flashcards: state.flashcards
        };

        const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flashcards_${state.topic}_lesson_${state.lesson}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function wireUI() {
        if (els.topicSelect) {
            els.topicSelect.addEventListener('change', async (e) => {
                state.topic = e.target.value;
                state.lesson = 1;
                populateLessons();
                setHeader();
                await checkTopicLockForCurrentSelection();
                // Clear current cards when switching lessons
                state.flashcards = [];
                state.cardOrder = [];
                els.grid.innerHTML = '<div class="text-center text-slate-500 py-8">Select a lesson and generate flashcards.</div>';
                if (els.learnedCount) els.learnedCount.textContent = '0';
            });
        }

        if (els.lessonSelect) {
            els.lessonSelect.addEventListener('change', async (e) => {
                state.lesson = parseInt(e.target.value, 10) || 1;
                setHeader();
                await checkTopicLockForCurrentSelection();
                state.flashcards = [];
                state.cardOrder = [];
                els.grid.innerHTML = '<div class="text-center text-slate-500 py-8">Generating flashcards is required to see your cards.</div>';
                if (els.learnedCount) els.learnedCount.textContent = '0';
            });
        }

        if (els.generateBtn) {
            els.generateBtn.addEventListener('click', () => generateFlashcards());
        }

        if (els.shuffleBtn) {
            els.shuffleBtn.addEventListener('click', shuffleOrder);
        }

        if (els.resetLearnedBtn) {
            els.resetLearnedBtn.addEventListener('click', async () => {
                const ok = await Swal.fire({
                    title: 'Reset learned progress?',
                    text: 'This will clear "Learned" marks for the current topic + lesson (locally on this browser).',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Reset'
                });
                if (ok.isConfirmed) resetLearned();
            });
        }

        if (els.downloadBtn) {
            els.downloadBtn.addEventListener('click', downloadFlashcards);
        }

        if (els.searchInput) {
            els.searchInput.addEventListener('input', () => {
                const v = els.searchInput.value || '';
                if (els.clearSearchBtn) els.clearSearchBtn.classList.toggle('hidden', v.trim() === '');
                renderFlashcards();
            });
        }

        if (els.clearSearchBtn) {
            els.clearSearchBtn.addEventListener('click', () => {
                if (els.searchInput) els.searchInput.value = '';
                els.clearSearchBtn.classList.add('hidden');
                renderFlashcards();
            });
        }
    }

    async function init() {
        loadProgress();
        populateTopics();
        populateLessons();
        setHeader();

        wireUI();

        // Wait for enrollment check to be ready so we can gate by lock.
        await waitForEnrollmentReady();
        if (window.studentEnrollmentCheck?.enrollmentStatus?.has_approved_enrollment) {
            await checkTopicLockForCurrentSelection();
        } else {
            setLockUI(false);
        }

        // Initial empty state
        if (els.grid) {
            els.grid.innerHTML = '<div class="text-center text-slate-500 py-8">Generate flashcards to start studying.</div>';
        }
        updateLearnedProgressUI();
    }

    document.addEventListener('DOMContentLoaded', init);
})();

