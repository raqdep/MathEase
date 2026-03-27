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
        flashcards: [], // [{front, back, explanation}] length 10
        setId: null,
        cardOrder: [], // array of card indices, length 10
        currentDisplayIndex: 0, // 0..9
        // Learned status per card index (0..9), loaded from DB
        learnedByCard: Array(10).fill(false)
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

        shuffleBtn: document.getElementById('shuffleCardsBtn'),
        resetLearnedBtn: document.getElementById('resetLearnedBtn'),

        saveBtn: document.getElementById('saveFlashcardsBtn'),

        stageSkeleton: document.getElementById('flashcardStageSkeleton'),
        stageInner: document.getElementById('flashcardStageInner'),

        prevBtn: document.getElementById('prevCardBtn'),
        nextBtn: document.getElementById('nextCardBtn'),

        currentCardNumber: document.getElementById('currentCardNumber'),
        totalCardNumber: document.getElementById('totalCardNumber')
    };

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function safeText(v) {
        return typeof v === 'string' ? v : '';
    }

    function getLearnedCount() {
        return state.learnedByCard.reduce((acc, v) => acc + (v ? 1 : 0), 0);
    }

    function updateLearnedProgressUI() {
        const learned = getLearnedCount();
        if (els.learnedCount) els.learnedCount.textContent = String(learned);
        if (els.learnedProgressText) els.learnedProgressText.textContent = `${learned}/10`;

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

            if (els.saveBtn) els.saveBtn.disabled = true;
            els.saveBtn?.classList.add('opacity-60', 'cursor-not-allowed');

            if (els.prevBtn) els.prevBtn.disabled = true;
            if (els.nextBtn) els.nextBtn.disabled = true;
        } else {
            els.lockHint.classList.add('hidden');

            if (els.generateBtn) {
                els.generateBtn.disabled = false;
                els.generateBtn.classList.remove('opacity-60', 'cursor-not-allowed');
            }
            if (els.saveBtn) {
                const hasCards = state.flashcards?.length === 10;
                els.saveBtn.disabled = !hasCards || !!state.setId;
                els.saveBtn.classList.toggle('opacity-60', els.saveBtn.disabled);
                els.saveBtn.classList.toggle('cursor-not-allowed', els.saveBtn.disabled);
            }
        }
    }

    function setLoading(isLoading) {
        if (els.generateBtn) {
            els.generateBtn.disabled = isLoading;
            els.generateBtn.classList.toggle('opacity-60', isLoading);
        }
        if (els.saveBtn) {
            els.saveBtn.disabled = isLoading;
            els.saveBtn.classList.toggle('opacity-60', isLoading);
            els.saveBtn.classList.toggle('cursor-not-allowed', isLoading);
        }
        if (els.prevBtn) els.prevBtn.disabled = isLoading;
        if (els.nextBtn) els.nextBtn.disabled = isLoading;

        if (els.loadingWrap) els.loadingWrap.classList.toggle('hidden', !isLoading);
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
        if (els.totalCardNumber) els.totalCardNumber.textContent = '10';
    }

    function setHeader() {
        const cfg = topicLessonConfig[state.topic];
        if (els.headerTitle) els.headerTitle.textContent = `Flashcards - ${cfg?.label || 'Topic'}`;
        if (els.headerSubtitle) {
            els.headerSubtitle.textContent = `Lesson ${state.lesson} • Flip • Mark learned`;
        }
    }

    function renderSkeletonStage() {
        if (els.stageSkeleton) els.stageSkeleton.classList.remove('hidden');
        if (els.stageInner) els.stageInner.classList.add('hidden');
        if (els.prevBtn) els.prevBtn.disabled = true;
        if (els.nextBtn) els.nextBtn.disabled = true;
    }

    function renderEmptyStage(message) {
        if (els.stageSkeleton) els.stageSkeleton.classList.add('hidden');
        if (els.stageInner) {
            els.stageInner.classList.remove('hidden');
            els.stageInner.innerHTML = `<div class="text-center text-slate-500 py-10">${message || 'Generate flashcards to start studying.'}</div>`;
        }
        if (els.prevBtn) els.prevBtn.disabled = true;
        if (els.nextBtn) els.nextBtn.disabled = true;
        if (els.saveBtn) {
            els.saveBtn.disabled = true;
        }
    }

    function createCardElement(card, cardIndex, displayIndex) {
        const wrap = document.createElement('div');
        wrap.className = 'flashcard';
        wrap.setAttribute('role', 'button');
        wrap.setAttribute('tabindex', '0');

        const inner = document.createElement('div');
        inner.className = 'flashcard-inner';

        const front = document.createElement('div');
        front.className = 'flashcard-front';

        const frontTitle = document.createElement('div');
        frontTitle.className = 'text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide text-center';
        frontTitle.textContent = `Card ${displayIndex + 1} of 10`;

        const frontText = document.createElement('div');
        frontText.className = 'flashcard-text font-semibold text-slate-900 text-center';
        frontText.style.fontSize = '1.65rem';
        frontText.textContent = safeText(card.front);

        const questionWrap = document.createElement('div');
        questionWrap.className = 'flashcard-front-question';

        questionWrap.appendChild(frontTitle);
        questionWrap.appendChild(frontText);

        front.appendChild(questionWrap);

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

        const learned = !!state.learnedByCard[cardIndex];

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
            (async () => {
                if (state.setId == null) {
                    const ok = await saveFlashcardsToDb({ silent: true, showSwal: false });
                    if (!ok) return;
                }

                const newLearned = !state.learnedByCard[cardIndex];
                try {
                    const payload = {
                        action: 'toggle_learned',
                        topic: state.topic,
                        lesson: state.lesson,
                        set_id: state.setId,
                        card_index: cardIndex,
                        learned: newLearned ? 1 : 0
                    };

                    const res = await fetch('php/flashcards-storage.php', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    const data = await res.json();
                    if (!data?.success) {
                        throw new Error(data?.message || 'Failed to update learned state.');
                    }

                    state.learnedByCard[cardIndex] = newLearned;
                    updateLearnedProgressUI();
                    // Rerender to update button label/state.
                    renderCurrentCard();
                } catch (err) {
                    console.error(err);
                    Swal.fire({
                        title: 'Update Failed',
                        text: err?.message || 'Could not update learned state.',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            })();
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

    function updateNavigationButtons() {
        const hasCards = Array.isArray(state.flashcards) && state.flashcards.length === 10;
        if (els.prevBtn) els.prevBtn.disabled = !hasCards || state.currentDisplayIndex <= 0;
        if (els.nextBtn) els.nextBtn.disabled = !hasCards || state.currentDisplayIndex >= 9;

        // Save button should be available when we have flashcards + not locked.
        if (els.saveBtn) {
            const locked = !!(els.lockHint && !els.lockHint.classList.contains('hidden'));
            // Disable Save once already saved (setId exists), to avoid creating a new empty set.
            els.saveBtn.disabled = !hasCards || locked || !!state.setId;
            els.saveBtn.classList.toggle('opacity-60', els.saveBtn.disabled);
            els.saveBtn.classList.toggle('cursor-not-allowed', els.saveBtn.disabled);
        }
    }

    function renderCurrentCard() {
        const cards = state.flashcards || [];
        if (!cards.length || cards.length !== 10) {
            renderEmptyStage('Generate flashcards to start studying.');
            return;
        }

        if (!state.cardOrder.length) state.cardOrder = cards.map((_, i) => i);

        const cardIndex = state.cardOrder[state.currentDisplayIndex] ?? 0;
        const card = cards[cardIndex];
        if (!card) {
            renderEmptyStage('Flashcards are not available.');
            return;
        }

        if (els.stageSkeleton) els.stageSkeleton.classList.add('hidden');
        if (els.stageInner) {
            els.stageInner.classList.remove('hidden');
            els.stageInner.innerHTML = '';
            els.stageInner.appendChild(createCardElement(card, cardIndex, state.currentDisplayIndex));
        }

        if (els.currentCardNumber) els.currentCardNumber.textContent = String(state.currentDisplayIndex + 1);
        if (els.totalCardNumber) els.totalCardNumber.textContent = '10';

        updateNavigationButtons();
    }

    function shuffleOrder() {
        if (!state.flashcards?.length) return;
        state.cardOrder = state.cardOrder.length ? [...state.cardOrder] : state.flashcards.map((_, i) => i);
        for (let i = state.cardOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [state.cardOrder[i], state.cardOrder[j]] = [state.cardOrder[j], state.cardOrder[i]];
        }
        state.currentDisplayIndex = 0;
        renderCurrentCard();
    }

    async function resetLearned() {
        if (!state.flashcards?.length || !state.setId) return;
        setLoading(true);
        try {
            const payload = {
                action: 'reset_progress',
                topic: state.topic,
                lesson: state.lesson,
                set_id: state.setId
            };

            const res = await fetch('php/flashcards-storage.php', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!data?.success) {
                throw new Error(data?.message || 'Failed to reset learned progress.');
            }

            state.learnedByCard = Array(10).fill(false);
            updateLearnedProgressUI();
            renderCurrentCard();
        } catch (err) {
            console.error(err);
            Swal.fire({
                title: 'Reset Failed',
                text: err?.message || 'Could not reset learned progress.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } finally {
            setLoading(false);
        }
    }

    async function generateFlashcards() {
        setLoading(true);
        renderSkeletonStage();

        try {
            // Read latest values from controls to avoid stale state.
            const selectedTopic = (els.topicSelect?.value || state.topic || '').trim();
            const selectedLesson = parseInt(els.lessonSelect?.value || state.lesson, 10) || 0;
            state.topic = selectedTopic || state.topic;
            state.lesson = selectedLesson || state.lesson;

            const payload = {
                action: 'generate',
                topic: selectedTopic,
                lesson: selectedLesson
            };

            if (!payload.topic || !payload.lesson) {
                throw new Error('Please select a topic and lesson before generating flashcards.');
            }

            const res = await fetch('php/flashcards.php', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const raw = await res.text();
            let data = null;
            try {
                data = raw ? JSON.parse(raw) : null;
            } catch (_e) {
                throw new Error('Server returned an invalid response while generating flashcards.');
            }
            if (!data?.success) {
                throw new Error(data?.message || 'Failed to generate flashcards.');
            }

            const cards = Array.isArray(data.flashcards) ? data.flashcards : [];
            if (cards.length !== 10) {
                throw new Error('AI must return exactly 10 flashcards.');
            }

            state.flashcards = cards;
            state.cardOrder = cards.map((_, i) => i);
            state.currentDisplayIndex = 0;
            state.setId = null;
            state.learnedByCard = Array(10).fill(false);

            setHeader();
            updateLearnedProgressUI();
            renderCurrentCard();
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

    async function saveFlashcardsToDb({ silent = false, showSwal = true } = {}) {
        if (!state.flashcards?.length || state.flashcards.length !== 10) return;

        setLoading(true);

        try {
            const payload = {
                action: 'save',
                topic: state.topic,
                lesson: state.lesson,
                flashcards: state.flashcards
            };

            const res = await fetch('php/flashcards-storage.php', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!data?.success) {
                throw new Error(data?.message || 'Failed to save flashcards.');
            }

            state.setId = data?.set_id ?? null;
            state.learnedByCard = Array(10).fill(false);

            if (!silent && showSwal) {
                Swal.fire({
                    title: 'Saved!',
                    text: 'Your flashcards were saved to the database.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
            }

            return true;
        } catch (err) {
            console.error(err);
            if (!silent && showSwal) {
                Swal.fire({
                    title: 'Save Failed',
                    text: err?.message || 'Something went wrong while saving.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
            return false;
        } finally {
            setLoading(false);
        }
    }

    async function loadFlashcardsFromDbIfExists() {
        const isLocked = !!(els.lockHint && !els.lockHint.classList.contains('hidden'));
        if (isLocked) {
            state.flashcards = [];
            state.cardOrder = [];
            state.currentDisplayIndex = 0;
            state.setId = null;
            state.learnedByCard = Array(10).fill(false);
            renderEmptyStage('This topic is locked by your teacher.');
            return;
        }

        // If we are locked, backend will deny too; UI should already show lock.
        renderSkeletonStage();
        try {
            const payload = {
                action: 'load',
                topic: state.topic,
                lesson: state.lesson
            };

            const res = await fetch('php/flashcards-storage.php', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!data?.success) {
                state.flashcards = [];
                state.cardOrder = [];
                state.currentDisplayIndex = 0;
                state.setId = null;
                state.learnedByCard = Array(10).fill(false);
                renderEmptyStage(data?.message || 'No saved flashcards yet. Generate to begin.');
                updateLearnedProgressUI();
                return;
            }

            const cards = Array.isArray(data.flashcards) ? data.flashcards : [];
            if (cards.length !== 10) {
                throw new Error('Saved flashcards are incomplete.');
            }

            state.flashcards = cards;
            state.cardOrder = cards.map((_, i) => i);
            state.currentDisplayIndex = 0;
            state.setId = data?.set_id ?? null;
            state.learnedByCard = Array.isArray(data?.learned) && data.learned.length === 10
                ? data.learned.map(v => !!v)
                : Array(10).fill(false);
            updateLearnedProgressUI();
            renderCurrentCard();
        } catch (err) {
            console.error(err);
            state.flashcards = [];
            state.cardOrder = [];
            state.currentDisplayIndex = 0;
            state.setId = null;
            state.learnedByCard = Array(10).fill(false);
            renderEmptyStage('Could not load saved flashcards.');
        }
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
        if (!window.studentEnrollmentCheck?.checkTopicLock) {
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

    function wireUI() {
        if (els.topicSelect) {
            els.topicSelect.addEventListener('change', async (e) => {
                state.topic = e.target.value;
                state.lesson = 1;
                populateLessons();
                setHeader();
                await checkTopicLockForCurrentSelection();
                state.flashcards = [];
                state.cardOrder = [];
                state.currentDisplayIndex = 0;
                state.setId = null;
                state.learnedByCard = Array(10).fill(false);
                await loadFlashcardsFromDbIfExists();
            });
        }

        if (els.lessonSelect) {
            els.lessonSelect.addEventListener('change', async (e) => {
                state.lesson = parseInt(e.target.value, 10) || 1;
                setHeader();
                await checkTopicLockForCurrentSelection();
                state.flashcards = [];
                state.cardOrder = [];
                state.currentDisplayIndex = 0;
                state.setId = null;
                state.learnedByCard = Array(10).fill(false);
                await loadFlashcardsFromDbIfExists();
            });
        }

        if (els.generateBtn) {
            els.generateBtn.addEventListener('click', () => generateFlashcards());
        }

        if (els.saveBtn) {
            els.saveBtn.addEventListener('click', () => saveFlashcardsToDb());
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

        if (els.prevBtn) {
            els.prevBtn.addEventListener('click', () => {
                if (state.currentDisplayIndex <= 0) return;
                state.currentDisplayIndex--;
                renderCurrentCard();
            });
        }

        if (els.nextBtn) {
            els.nextBtn.addEventListener('click', () => {
                if (state.currentDisplayIndex >= 9) return;
                state.currentDisplayIndex++;
                renderCurrentCard();
            });
        }
    }

    async function init() {
        populateTopics();
        populateLessons();
        setHeader();
        wireUI();

        await waitForEnrollmentReady();
        if (window.studentEnrollmentCheck?.enrollmentStatus?.has_approved_enrollment) {
            await checkTopicLockForCurrentSelection();
            await loadFlashcardsFromDbIfExists();
        } else {
            setLockUI(false);
            renderEmptyStage('Join a class to unlock Flashcards.');
        }

        updateLearnedProgressUI();
    }

    document.addEventListener('DOMContentLoaded', init);
})();

