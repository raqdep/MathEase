(() => {
    /**
     * Matches topics/*.html: first dropdown = lesson (module), second = topic within that lesson.
     * API still uses keys `topic` (slug) + `lesson` (1-based topic index).
     */
    const topicLessonConfig = {
        functions: {
            lessonTitle: 'Functions',
            topics: [
                'Introduction to Functions',
                'Domain and Range',
                'Function Operations',
                'Function Composition & Inverses'
            ]
        },
        'evaluating-functions': {
            lessonTitle: 'Evaluating Functions',
            topics: [
                'Introduction to Function Evaluation',
                'Types of Functions',
                'The Evaluation Process',
                'How to Solve Function Evaluation Problems'
            ]
        },
        'operations-on-functions': {
            lessonTitle: 'Operations on Functions',
            topics: [
                'Addition & Subtraction',
                'Multiplication',
                'Division',
                'Composition',
                'Applications'
            ]
        },
        'solving-real-life-problems': {
            lessonTitle: 'Solving Real-Life Problems',
            topics: [
                'Real-World Models',
                'Business & Econ',
                'Sci & Tech',
                'Complex Solving'
            ]
        },
        'rational-functions': {
            lessonTitle: 'Rational Functions',
            topics: [
                'Rational Functions',
                'Graphs & Asymptotes',
                'Rational Equations',
                'Rational Inequalities'
            ]
        },
        'solving-rational-equations-inequalities': {
            lessonTitle: 'Solving Rational Equations and Inequalities',
            topics: [
                'Solving Rational Equations',
                'Solving Rational Inequalities',
                'Graphical Solutions',
                'Real-World Applications'
            ]
        },
        'representations-of-rational-functions': {
            lessonTitle: 'Representations of Rational Functions',
            topics: [
                'Understanding Rational Functions',
                'Graphical Representation of Rational Functions',
                'Analyzing Asymptotes and Intercepts',
                'Real-World Applications of Rational Functions'
            ]
        },
        'domain-range-rational-functions': {
            lessonTitle: 'Domain and Range of Rational Functions',
            topics: [
                'Understanding Domain',
                'Understanding Range',
                'Finding Domain & Range',
                'Applications & Problem Solving'
            ]
        },
        'one-to-one-functions': {
            lessonTitle: 'One-to-One Functions',
            topics: [
                'Understanding One-to-One Functions',
                'Testing for One-to-One',
                'Inverse Functions',
                'Applications & Problem Solving'
            ]
        },
        'domain-range-inverse-functions': {
            lessonTitle: 'Domain and Range of Inverse Functions',
            topics: [
                'Understanding Inverse Functions',
                'Finding Domain of Inverse Functions',
                'Finding Range of Inverse Functions',
                'Applications & Problem Solving'
            ]
        },
        'simple-interest': {
            lessonTitle: 'Simple Interest',
            topics: [
                'Introduction to Simple Interest',
                'Using I = P × R × T',
                'Solving for Unknowns',
                'Real-World Applications'
            ]
        },
        'compound-interest': {
            lessonTitle: 'Compound Interest',
            topics: [
                'Introduction to Compound Interest',
                'Compound Interest Formula',
                'Compounding Frequencies',
                'Present Value and Future Value',
                'Advanced Applications'
            ]
        },
        'simple-and-compound-values': {
            lessonTitle: 'Interest, Maturity, Future, and Present Values',
            topics: [
                'Context and Motivation',
                'Simple Interest (Is = Prt)',
                'Activities on Simple Interest',
                'Compound Interest & Time Value',
                'Activities & Decision-Making'
            ]
        },
        'solving-interest-problems': {
            lessonTitle: 'Solving Problems: Simple and Compound Interest',
            topics: [
                'Introduction & DepEd MELCs',
                'Simple Interest Problem Solver',
                'Present and Maturity Value (Simple)',
                'Compound Interest Problem Solver',
                'Applications & Proposal'
            ]
        }
    };

    function getLessonModuleCfg(slug) {
        return topicLessonConfig[slug] || null;
    }

    function topicCountForSlug(slug) {
        const t = getLessonModuleCfg(slug)?.topics;
        return Array.isArray(t) ? t.length : 0;
    }

    function topicTitleFor(slug, lessonIndex1) {
        const topics = getLessonModuleCfg(slug)?.topics;
        if (!Array.isArray(topics) || topics.length === 0) return '';
        const i = Math.max(0, Math.min(topics.length - 1, (lessonIndex1 || 1) - 1));
        return topics[i] || '';
    }

    const state = {
        topic: 'functions',
        lesson: 1,
        flashcards: [], // [{front, back, explanation}] length 10
        cardOrder: [], // array of card indices, length 10
        currentDisplayIndex: 0 // 0..9
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

        shuffleBtn: document.getElementById('shuffleCardsBtn'),

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

    function setLockUI(isLocked, message) {
        if (!els.lockHint) return;
        if (isLocked) {
            els.lockHintText.textContent = message || 'This lesson is currently locked.';
            els.lockHint.classList.remove('hidden');

            if (els.generateBtn) els.generateBtn.disabled = true;
            els.generateBtn?.classList.add('opacity-60', 'cursor-not-allowed');

            if (els.prevBtn) els.prevBtn.disabled = true;
            if (els.nextBtn) els.nextBtn.disabled = true;
        } else {
            els.lockHint.classList.add('hidden');

            if (els.generateBtn) {
                els.generateBtn.disabled = false;
                els.generateBtn.classList.remove('opacity-60', 'cursor-not-allowed');
            }
        }
    }

    function setLoading(isLoading) {
        if (els.generateBtn) {
            els.generateBtn.disabled = isLoading;
            els.generateBtn.classList.toggle('opacity-60', isLoading);
        }
        if (els.prevBtn) els.prevBtn.disabled = isLoading;
        if (els.nextBtn) els.nextBtn.disabled = isLoading;

        if (els.loadingWrap) els.loadingWrap.classList.toggle('hidden', !isLoading);
    }

    function populateTopics() {
        if (!els.topicSelect) return;
        els.topicSelect.innerHTML = Object.entries(topicLessonConfig)
            .map(([slug, cfg]) => {
                const title = cfg.lessonTitle || slug;
                return `<option value="${slug}">${title}</option>`;
            })
            .join('');
        els.topicSelect.value = state.topic;
    }

    function populateLessons() {
        if (!els.lessonSelect) return;
        const n = topicCountForSlug(state.topic) || 4;
        const topics = getLessonModuleCfg(state.topic)?.topics || [];
        els.lessonSelect.innerHTML = Array.from({ length: n }, (_, i) => {
            const num = i + 1;
            const name = topics[i] ? topics[i] : `Topic ${num}`;
            const label = `${num}. ${name}`;
            return `<option value="${num}">${label}</option>`;
        }).join('');
        if (state.lesson < 1 || state.lesson > n) state.lesson = 1;
        els.lessonSelect.value = String(state.lesson);
        if (els.totalCardNumber) els.totalCardNumber.textContent = '10';
    }

    function setHeader() {
        const cfg = getLessonModuleCfg(state.topic);
        const lessonTitle = cfg?.lessonTitle || 'Lesson';
        const subTopic = topicTitleFor(state.topic, state.lesson);
        if (els.headerTitle) els.headerTitle.textContent = `Flashcards — ${lessonTitle}`;
        if (els.headerSubtitle) {
            els.headerSubtitle.textContent = subTopic
                ? `${subTopic} • Flip to study`
                : `Flip to study`;
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
    }

    function createCardElement(card, displayIndex) {
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
        actions.className = 'mt-3 flex items-center justify-end gap-3 flashcard-actions';

        const revealHint = document.createElement('div');
        revealHint.className = 'text-xs text-slate-600';
        revealHint.textContent = 'Tap to flip';

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
            els.stageInner.appendChild(createCardElement(card, state.currentDisplayIndex));
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
                throw new Error('Please select a lesson and topic before generating flashcards.');
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

            setHeader();
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

    function clearFlashcardSession() {
        state.flashcards = [];
        state.cardOrder = [];
        state.currentDisplayIndex = 0;
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
            setLockUI(true, result?.message || 'This lesson is currently locked by your teacher.');
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
                clearFlashcardSession();
                const locked = !!(els.lockHint && !els.lockHint.classList.contains('hidden'));
                if (locked) {
                    renderEmptyStage('This lesson is locked by your teacher.');
                } else {
                    renderEmptyStage('Generate flashcards to start studying.');
                }
            });
        }

        if (els.lessonSelect) {
            els.lessonSelect.addEventListener('change', async (e) => {
                state.lesson = parseInt(e.target.value, 10) || 1;
                setHeader();
                await checkTopicLockForCurrentSelection();
                clearFlashcardSession();
                const locked = !!(els.lockHint && !els.lockHint.classList.contains('hidden'));
                if (locked) {
                    renderEmptyStage('This lesson is locked by your teacher.');
                } else {
                    renderEmptyStage('Generate flashcards to start studying.');
                }
            });
        }

        if (els.generateBtn) {
            els.generateBtn.addEventListener('click', () => generateFlashcards());
        }

        if (els.shuffleBtn) {
            els.shuffleBtn.addEventListener('click', shuffleOrder);
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
            const locked = !!(els.lockHint && !els.lockHint.classList.contains('hidden'));
            if (locked) {
                renderEmptyStage('This lesson is locked by your teacher.');
            } else {
                renderEmptyStage('Generate flashcards to start studying.');
            }
        } else {
            setLockUI(false);
            renderEmptyStage('Join a class to unlock Flashcards.');
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();

