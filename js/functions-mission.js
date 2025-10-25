// Functions Mission JavaScript
class FunctionsMission {
    constructor() {
        this.currentStep = 'concept';
        this.currentQuestion = 0;
        this.score = 0;
        this.startTime = Date.now();
        this.lessonCompleted = false;
        this.reviewMode = false;
        this.hasSavedAttempt = false;
        this.guidedObjectives = {
            changedSlope: false,
            changedIntercept: false,
            matchedDisplay: false
        };
        this.incorrectQuestions = [];
        this.answeredQuestions = new Set();
        this.userResponses = [];
        
        // Function history and favorites
        this.functionHistory = JSON.parse(localStorage.getItem('mathease-function-history') || '[]');
        this.functionFavorites = JSON.parse(localStorage.getItem('mathease-function-favorites') || '[]');
        this.maxHistorySize = 20;
        // VA graph zoom state
        this.vaScale = 30; // pixels per unit
        this.vaMinScale = 10;
        this.vaMaxScale = 120;
        this.questions = [
            {
                title: "Question 1",
                text: "What is the domain of the function f(x) = √(x - 2)?",
                options: [
                    { text: "x ≥ 2", correct: true },
                    { text: "x ≤ 2", correct: false },
                    { text: "x > 2", correct: false },
                    { text: "All real numbers", correct: false }
                ],
                explanation: "The domain of √(x - 2) is x ≥ 2 because we can't take the square root of a negative number."
            },
            {
                title: "Question 2",
                text: "What is the slope of the line f(x) = 3x + 5?",
                options: [
                    { text: "3", correct: true },
                    { text: "5", correct: false },
                    { text: "-3", correct: false },
                    { text: "0", correct: false }
                ],
                explanation: "In the form f(x) = mx + b, m represents the slope. So for f(x) = 3x + 5, the slope is 3."
            },
            {
                title: "Question 3",
                text: "What is the y-intercept of the function f(x) = -2x + 7?",
                options: [
                    { text: "-2", correct: false },
                    { text: "7", correct: true },
                    { text: "2", correct: false },
                    { text: "-7", correct: false }
                ],
                explanation: "In the form f(x) = mx + b, b represents the y-intercept. So for f(x) = -2x + 7, the y-intercept is 7."
            },
            {
                title: "Question 4",
                text: "Which function represents a horizontal line?",
                options: [
                    { text: "f(x) = x", correct: false },
                    { text: "f(x) = 5", correct: true },
                    { text: "f(x) = 2x + 1", correct: false },
                    { text: "f(x) = x²", correct: false }
                ],
                explanation: "A horizontal line has a slope of 0, so it's in the form f(x) = b where b is a constant. f(x) = 5 is a horizontal line at y = 5."
            },
            {
                title: "Question 5",
                text: "What happens to the graph of f(x) = x² when we change it to f(x) = 2x²?",
                options: [
                    { text: "The graph shifts up", correct: false },
                    { text: "The graph becomes steeper", correct: true },
                    { text: "The graph shifts right", correct: false },
                    { text: "The graph becomes wider", correct: false }
                ],
                explanation: "When we multiply x² by 2, the graph becomes steeper because the rate of change increases."
            }
        ];
        
        this.init();
    }

    async loadLatestAttemptForReview() {
        try {
            const res = await fetch('../php/progress.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ action: 'get_latest_quiz_attempt', topic: 'functions', quiz_title: 'Functions Basics Quiz' })
            });
            if (!res.ok) return;
            const data = await res.json();
            if (!data || !data.success || !data.attempt) return;
            const answers = Array.isArray(data.answers) ? data.answers : [];
            // Map answers into local review state
            this.userResponses = answers.map(a => ({ index: a.index, selected: a.selected, correct: !!a.correct }));
            this.answeredQuestions = new Set(this.userResponses.map(r => r.index));
            // Keep original question-derived metadata for review UI
            this.userResponses = this.userResponses.map(r => {
                const q = this.questions[r.index];
                const correctIndex = q.options.findIndex(o => o.correct);
                return { ...r, correctIndex, questionText: q.text, explanation: q.explanation };
            });
            // Use stored score for XP display during review
            if (typeof data.attempt.score === 'number') {
                this.score = data.attempt.score;
                this.updateXP();
            }
            // Restore incorrect questions for learning summary
            this.incorrectQuestions = this.userResponses.filter(r => !r.correct).map(r => r.index);
            // Set start time for completion time calculation (approximate)
            if (data.attempt.time_taken_minutes) {
                this.startTime = Date.now() - (data.attempt.time_taken_minutes * 60 * 1000);
            }
            // If we're currently on challenge, re-render question with locked answers
            if (this.currentStep === 'challenge') {
                this.currentQuestion = 0;
                this.loadQuestion();
                this.hideFeedback();
            }
            // If we're in reflection, update the final stats with saved data
            if (this.currentStep === 'reflection') {
                this.updateFinalStats();
            }
        } catch(_) {}
    }

    broadcastProgressUpdate() {
        try {
            localStorage.setItem('mathease-progress-broadcast', String(Date.now()));
        } catch(_) {}
    }

    startChallengeTimer() {
        if (this.reviewMode) return;
        try { this.stopChallengeTimer(); } catch(_) {}
        const timerEl = document.getElementById('challengeTimer');
        this.challengeStartMs = Date.now();
        const tick = () => {
            const now = Date.now();
            const elapsed = Math.max(0, Math.floor((now - this.challengeStartMs)/1000));
            const mm = String(Math.floor(elapsed/60)).padStart(2,'0');
            const ss = String(elapsed%60).padStart(2,'0');
            if (timerEl) timerEl.textContent = `${mm}:${ss}`;
        };
        tick();
        this.challengeTimerId = setInterval(tick, 1000);
    }

    stopChallengeTimer() {
        if (this.challengeTimerId) { clearInterval(this.challengeTimerId); this.challengeTimerId = null; }
    }

    async init() {
        this.setupEventListeners();
        this.setupGraphs();
        this.updateProgress();
        this.loadQuestion();
        this.renderExplainers();
        this.initVirtualAids();
        this.bindLessonTryIts();
        this.renderPractice();
        this.bindOutlineLinks();
        this.bindMiniChecks();
        // Enhance in‑depth lesson with interactive modals per step
        this.setupLessonModals();
        // Record visit for this topic in backend and await to avoid race with progress read
        try { await this.recordTopicVisit('functions'); } catch(_) {}
        // Setup guided objectives checklist
        this.initGuidedObjectives();
        // Initialize function history and favorites
        this.initFunctionHistory();
        // Restore any previously saved mission progress so students don't start from scratch
        await this.restoreMissionProgress();
    }

    // Interactive modal for each in‑depth lesson step
    setupLessonModals() {
        try {
            const lesson = document.querySelector('.in-depth-lesson');
            if (!lesson) return;

            // Inject modal container once
            if (!document.getElementById('lessonStepModal')) {
                const modal = document.createElement('div');
                modal.id = 'lessonStepModal';
                modal.setAttribute('aria-hidden', 'true');
                modal.innerHTML = `
                    <div class="lsm-overlay" data-lsm-close></div>
                    <div class="lsm-dialog" role="dialog" aria-modal="true" aria-labelledby="lsmTitle">
                        <div class="lsm-header">
                            <h3 id="lsmTitle"></h3>
                            <button class="lsm-close" title="Close" data-lsm-close>&times;</button>
                        </div>
                        <div class="lsm-body" id="lsmBody"></div>
                        <div class="lsm-footer">
                            <button class="btn btn-secondary btn-sm" id="lsmPrev">Previous</button>
                            <button class="btn btn-primary btn-sm" id="lsmNext">Next</button>
                        </div>
                    </div>`;
                document.body.appendChild(modal);

                // Inject minimal styles once
                if (!document.getElementById('lsm-styles')) {
                    const style = document.createElement('style');
                    style.id = 'lsm-styles';
                    style.textContent = `
                        .lsm-open { overflow: hidden; }
                        #lessonStepModal{position:fixed;inset:0;display:none;z-index:1100}
                        #lessonStepModal[aria-hidden="false"]{display:flex;align-items:center;justify-content:center;padding:4vh 2vw}
                        .lsm-overlay{position:absolute;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(1px)}
                        .lsm-dialog{position:relative;max-width:900px;width:min(92vw,900px);max-height:86vh;background:#fff;border-radius:16px;box-shadow:0 20px 48px rgba(0,0,0,.25);display:flex;flex-direction:column;overflow:hidden}
                        .lsm-header{display:flex;align-items:center;justify-content:space-between;padding:0.9rem 1.1rem;border-bottom:1px solid #e9ecef;background:#ffffff;position:sticky;top:0;z-index:1}
                        .lsm-header h3{margin:0;color:#2c3e50}
                        .lsm-close{background:none;border:none;font-size:1.6rem;line-height:1;color:#6c757d;cursor:pointer;border-radius:8px;padding:.15rem .35rem}
                        .lsm-close:hover{background:#f2f3f7;color:#2c3e50}
                        .lsm-body{padding:1rem;overflow:auto;line-height:1.55}
                        .lsm-body h4,.lsm-body h5{margin:.6rem 0 .35rem 0;color:#2c3e50}
                        .lsm-body p{margin:.4rem 0;color:#2c3e50}
                        .lsm-body ul,.lsm-body ol{margin:.4rem 0 .6rem 1.25rem}
                        .lsm-footer{display:flex;gap:.5rem;justify-content:flex-end;padding:.75rem 1.1rem;border-top:1px solid #e9ecef;background:#fff;position:sticky;bottom:0}
                        /* Make content inside modal breathe */
                        .lsm-body .example{background:#f8f9ff;border:1px dashed #667eea;padding:.75rem;border-radius:10px}
                        .lsm-illustration{margin-bottom:.8rem;text-align:center}
                        .lsm-illustration img{width:100%;max-width:420px;height:auto;border-radius:12px;border:1px solid #e9ecef;box-shadow:0 8px 24px rgba(0,0,0,.08);display:block;margin:0 auto}
                        .lsm-illustration small{display:block;color:#6c757d;margin-top:.35rem}
                        @media (max-width: 520px){
                            .lsm-dialog{border-radius:12px}
                            .lsm-header{padding:.7rem .9rem}
                            .lsm-body{padding:.8rem}
                            .lsm-footer{padding:.6rem .9rem}
                        }
                    `;
                    document.head.appendChild(style);
                }

                // Close handlers
                modal.addEventListener('click', (e)=>{
                    if (e.target?.hasAttribute('data-lsm-close')) this.closeLessonModal();
                });
                document.addEventListener('keydown', (e)=>{
                    const open = document.getElementById('lessonStepModal');
                    if (!open || open.getAttribute('aria-hidden') !== 'false') return;
                    if (e.key === 'Escape') this.closeLessonModal();
                });
                document.getElementById('lsmPrev')?.addEventListener('click', ()=> this.navigateLessonModal(-1));
                document.getElementById('lsmNext')?.addEventListener('click', ()=> this.navigateLessonModal(1));
            }

            // Collect all <details> steps within the in‑depth lesson
            const stepDetails = [...lesson.querySelectorAll('.lesson-steps .step-card details')];
            this.lessonModalSteps = stepDetails;
            this.lessonModalIndex = 0;

            // Add an action button near each summary
            stepDetails.forEach((det, idx) => {
                const summary = det.querySelector('summary');
                if (!summary) return;
                if (summary.querySelector('.open-step-modal')) return; // avoid duplicates
                const btn = document.createElement('button');
                btn.className = 'btn btn-secondary btn-sm open-step-modal';
                btn.style.marginLeft = '.5rem';
                btn.innerHTML = '<i class="fas fa-expand"></i> Open Lesson';
                btn.addEventListener('click', (e)=>{ e.preventDefault(); this.openLessonModal(idx); });
                summary.appendChild(btn);
            });

            // Replace large lesson content with cards; keep original steps hidden as modal source
            if (stepDetails.length > 0 && !document.getElementById('lessonHiddenSource')) {
                const hidden = document.createElement('div');
                hidden.id = 'lessonHiddenSource';
                hidden.style.display = 'none';
                // Move the entire lesson-steps into hidden container
                const stepsWrap = lesson.querySelector('.lesson-steps');
                if (stepsWrap) {
                    hidden.appendChild(stepsWrap);
                    lesson.appendChild(hidden);
                }

                // Capture original title if present
                const origTitle = lesson.querySelector('h3')?.textContent || 'In-Depth Lesson';

                // Build cards grid
                const grid = document.createElement('div');
                grid.className = 'lesson-cards';
                grid.innerHTML = `<div class="lesson-cards-header"><h3>${origTitle}</h3><p style="margin:.25rem 0 0 0;color:#2c3e50">Open a card to learn each step.</p></div>`;

                const gridWrap = document.createElement('div');
                gridWrap.className = 'lesson-cards-grid';

                stepDetails.forEach((det, idx) => {
                    const title = det.querySelector('summary h3')?.textContent || `Step ${idx+1}`;
                    const firstP = [...det.children].find(n => n.tagName && n.tagName.toLowerCase() !== 'summary' && n.querySelector?.('p')) || [...det.children].find(n=> n.tagName && n.tagName.toLowerCase() === 'p');
                    let snippet = '';
                    if (firstP) {
                        const p = firstP.querySelector('p') || firstP;
                        snippet = (p.textContent || '').trim();
                    }
                    if (snippet.length > 140) snippet = snippet.slice(0, 137) + '…';
                    const card = document.createElement('div');
                    card.className = 'lesson-card';
                    card.innerHTML = `
                        <div class="lesson-card-body">
                            <h4 class="lesson-card-title">${title}</h4>
                            <p class="lesson-card-snippet">${snippet || ''}</p>
                        </div>
                        <div class="lesson-card-actions">
                            <button class="btn btn-primary btn-sm" data-open-step="${idx}"><i class="fas fa-book-open"></i> Open Lesson</button>
                        </div>`;
                    gridWrap.appendChild(card);
                });

                grid.appendChild(gridWrap);

                // Clear all children in visible lesson and insert cards grid only
                while (lesson.firstChild) lesson.removeChild(lesson.firstChild);
                lesson.appendChild(grid);

                // Bind open events
                grid.addEventListener('click', (e)=>{
                    const btn = e.target.closest('[data-open-step]');
                    if (!btn) return;
                    const idx = parseInt(btn.getAttribute('data-open-step')||'0', 10);
                    this.openLessonModal(idx);
                });

                // Inject minimal styles for cards once
                if (!document.getElementById('lesson-cards-styles')) {
                    const style = document.createElement('style');
                    style.id = 'lesson-cards-styles';
                    style.textContent = `
                        .lesson-cards-header{margin-bottom:.5rem}
                        .lesson-cards-grid{display:grid;gap:.75rem;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
                        .lesson-card{background:linear-gradient(145deg,#ffffff,#f7f8ff);border:1px solid #e9ecef;border-radius:12px;box-shadow:0 10px 28px rgba(102,126,234,.12);display:flex;flex-direction:column;justify-content:space-between}
                        .lesson-card-body{padding:.9rem}
                        .lesson-card-title{margin:.1rem 0 .35rem 0;color:#2c3e50}
                        .lesson-card-snippet{margin:0;color:#6c757d;min-height:2.4em}
                        .lesson-card-actions{display:flex;justify-content:flex-end;padding:.6rem .9rem;border-top:1px solid #e9ecef}
                    `;
                    document.head.appendChild(style);
                }
            }
        } catch(_) { /* no-op */ }
    }

    openLessonModal(index) {
        const modal = document.getElementById('lessonStepModal');
        const titleEl = document.getElementById('lsmTitle');
        const bodyEl = document.getElementById('lsmBody');
        if (!modal || !titleEl || !bodyEl) return;

        this.lessonModalIndex = Math.max(0, Math.min(index || 0, (this.lessonModalSteps?.length || 1)-1));
        const det = this.lessonModalSteps[this.lessonModalIndex];
        if (!det) return;

        // Title from summary text (strip the Open button label)
        const h = det.querySelector('summary h3');
        const title = h ? h.textContent : 'Lesson Step';
        titleEl.textContent = title;

        // Build content by cloning nodes inside <details>, excluding the <summary>
        const fragment = document.createDocumentFragment();
        [...det.children].forEach((child)=>{
            if (child.tagName && child.tagName.toLowerCase() === 'summary') return;
            fragment.appendChild(child.cloneNode(true));
        });
        bodyEl.innerHTML = '';
        bodyEl.appendChild(fragment);

        // Keep try-it buttons functional inside modal by delegating to existing handlers
        bodyEl.addEventListener('click', (e)=>{
            const t1 = e.target.closest('button.tryit');
            const t2 = e.target.closest('button.tryit-linear');
            if (t1 || t2) {
                // Allow original handlers attached on document.body to process
                // Do nothing here; event will bubble
            }
        }, { once: true });

        // Inject illustration if corresponding image exists (step1..step6). Hide gracefully on 404.
        try {
            const imgIndex = this.lessonModalIndex + 1;
            const src = `../Img/Img for Lesson 1/step${imgIndex}.png`;
            const ill = document.createElement('div');
            ill.className = 'lsm-illustration';
            const img = document.createElement('img');
            img.src = src;
            img.alt = title + ' illustration';
            img.addEventListener('error', () => { try { ill.remove(); } catch(_) {} });
            const cap = document.createElement('small');
            cap.textContent = title;
            ill.appendChild(img);
            ill.appendChild(cap);
            bodyEl.insertBefore(ill, bodyEl.firstChild);
        } catch(_) {}

        // Show modal
        modal.setAttribute('aria-hidden', 'false');
        document.documentElement.classList.add('lsm-open');
        this.updateLessonModalNav();
    }

    closeLessonModal() {
        const modal = document.getElementById('lessonStepModal');
        if (!modal) return;
        modal.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('lsm-open');
    }

    navigateLessonModal(delta) {
        if (!Array.isArray(this.lessonModalSteps) || this.lessonModalSteps.length === 0) return;
        let next = this.lessonModalIndex + (delta || 0);
        next = Math.max(0, Math.min(next, this.lessonModalSteps.length - 1));
        if (next === this.lessonModalIndex) return;
        this.openLessonModal(next);
    }

    updateLessonModalNav() {
        const prev = document.getElementById('lsmPrev');
        const next = document.getElementById('lsmNext');
        if (!prev || !next) return;
        const total = (this.lessonModalSteps?.length || 1);
        prev.disabled = this.lessonModalIndex <= 0;
        next.disabled = this.lessonModalIndex >= total - 1;
        // Update button labels with progress
        next.textContent = this.lessonModalIndex >= total - 1 ? 'Done' : 'Next';
    }

    async restoreMissionProgress() {
        try {
            // 1) Check backend topic completion/best score + last_step
            const res = await fetch('../php/progress.php', { credentials: 'include', cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                const topics = Array.isArray(data.topics) ? data.topics : [];
                const fnRow = topics.find(t => (String(t.name||'').toLowerCase() === 'functions'));
                const completed = !!(fnRow && fnRow.completed);
                const best = fnRow && typeof fnRow.best_score === 'number' ? fnRow.best_score : 0;
                const lastStep = fnRow && fnRow.last_step ? String(fnRow.last_step) : '';
                if (completed || best >= 50) {
                    // Treat as completed lesson for gating; allow full review navigation
                    this.lessonCompleted = true;
                    this.reviewMode = true;
                    const nextBtn = document.getElementById('nextToGuided');
                    if (nextBtn) { nextBtn.disabled = false; nextBtn.classList.remove('btn-disabled'); }
                }
                if (lastStep && ['concept','guided','challenge','reflection'].includes(lastStep)) {
                    this.currentStep = lastStep;
                }
            }

            // 2) Navigate to lastStep if allowed; otherwise default to concept
            const step = this.lessonCompleted && this.currentStep ? this.currentStep : 'concept';
            // Apply UI state for active step
            try { this.goToStep(step); } catch(_) { /* fallback below */ }
            if (!this.lessonCompleted && step !== 'concept') {
                // ensure at concept if not yet completed
                this.goToStep('concept');
            }
            // If lesson is completed, load latest saved quiz attempt for review
            if (this.lessonCompleted) {
                try { await this.loadLatestAttemptForReview(); } catch(_) {}
            }
        } catch(_) {
            // Silent – proceed with defaults
        }
    }

    bindMiniChecks() {
        const wrap = document.getElementById('miniCheck');
        if (!wrap) return;
        wrap.addEventListener('click', (e)=>{
            const btn = e.target.closest('.mini-answer');
            if (!btn) return;
            const q = btn.closest('.q');
            if (!q) return;
            // Prevent double answering the same mini question
            if (q.getAttribute('data-answered') === '1') return;
            // Normalize function to compare logically equivalent strings
            const norm = (s) => {
                return String(s || '')
                    .toLowerCase()
                    .replace(/\u200b|\u200c|\u200d|\uFEFF/g, '') // remove zero-width chars
                    .replace(/[\u2212\u2013\u2014]/g, '-') // unicode minus/en/em dash -> hyphen
                    .replace(/≥/g, '>=')
                    .replace(/≤/g, '<=')
                    .replace(/\s+/g, ' ') // collapse spaces
                    .trim();
            };
            const correct = (q.getAttribute('data-correct')||'').trim().toLowerCase();
            const chosen = (btn.getAttribute('data-answer')||'').trim().toLowerCase();
            const fb = q.querySelector('.mini-feedback');
            const ok = norm(correct) === norm(chosen);
            if (fb){ fb.textContent = ok ? 'Correct! Nice job.' : 'Not quite. Re-read the notes above.'; fb.style.color = ok ? '#27ae60' : '#e74c3c'; }
            // Mark answered to avoid multiple scoring attempts
            q.setAttribute('data-answered', '1');
            if (ok) { this.score++; this.updateXP(); this.burstConfetti(); }
        });
    }

    setupEventListeners() {
        // Mission navigation
        document.querySelectorAll('.mission-step').forEach(step => {
            step.addEventListener('click', (e) => {
                const stepName = e.currentTarget.dataset.step;
                this.goToStep(stepName);
            });
        });

        // Step navigation buttons
        document.getElementById('nextToGuided')?.addEventListener('click', () => this.goToStep('guided'));
        const markBtn = document.getElementById('markLessonComplete');
        if (markBtn) {
            markBtn.addEventListener('click', () => {
                this.lessonCompleted = true;
                const nextBtn = document.getElementById('nextToGuided');
                if (nextBtn) {
                    nextBtn.disabled = false;
                    nextBtn.classList.remove('btn-disabled');
                }
                markBtn.disabled = true;
                this.showNotification('Lesson marked complete! Guided Play unlocked.', 'success');
                try { window.topicsManager?.updateMissionProgress('functions', 25, false); } catch(_) {}
                // Persist partial progress
                this.updateBackendProgress({ topic: 'functions', completed: false, best_score: 25 });
                this.broadcastProgressUpdate();
            });
        }
        document.getElementById('backToConcept')?.addEventListener('click', () => this.goToStep('concept'));
        document.getElementById('nextToChallenge')?.addEventListener('click', () => this.goToStep('challenge'));
        document.getElementById('backToGuided')?.addEventListener('click', () => this.goToStep('guided'));
        document.getElementById('backToChallenge')?.addEventListener('click', () => this.goToStep('challenge'));

        // Challenge navigation
        document.getElementById('nextQuestion')?.addEventListener('click', () => this.nextQuestion());
        document.getElementById('previousQuestion')?.addEventListener('click', () => this.previousQuestion());
        document.getElementById('finishChallenge')?.addEventListener('click', () => this.finishChallenge());

        // Interactive demo controls
        document.getElementById('functionType')?.addEventListener('change', (e) => this.updateFunction(e.target.value));
        document.getElementById('slope')?.addEventListener('input', (e) => this.updateSlope(e.target.value));
        document.getElementById('yIntercept')?.addEventListener('input', (e) => this.updateYIntercept(e.target.value));
        document.getElementById('coefficient')?.addEventListener('input', (e) => this.updateCoefficient(e.target.value));

        // Video play button
        document.getElementById('playVideo')?.addEventListener('click', () => this.playVideo());

        // Reset graph button
        document.getElementById('resetGraph')?.addEventListener('click', () => this.resetGraph());
    }

    setupGraphs() {
        // Setup main function graph
        this.setupMainGraph();
        
        // Setup interactive graph
        this.setupInteractiveGraph();
    }

    setupMainGraph() {
        const canvas = document.getElementById('functionCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        this.drawFunction(ctx, canvas.width, canvas.height, 'linear', 1, 0, 1);
    }

    setupInteractiveGraph() {
        const canvas = document.getElementById('interactiveCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        this.drawInteractiveFunction(ctx, canvas.width, canvas.height);

        // Add mouse tracking
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const cssX = e.clientX - rect.left;
            const cssY = e.clientY - rect.top;
            // Map CSS pixels to canvas pixels (handles DPR / CSS scaling)
            const canvasX = (cssX / rect.width) * canvas.width;
            const canvasY = (cssY / rect.height) * canvas.height;
            // Convert to function coordinates (30px per unit)
            const funcX = (canvasX - canvas.width/2) / 30;
            const funcY = -(canvasY - canvas.height/2) / 30;
            const coords = document.getElementById('mouseCoords');
            if (coords) coords.textContent = `(${funcX.toFixed(1)}, ${funcY.toFixed(1)})`;
        });
    }

    initGuidedObjectives() {
        const guided = document.getElementById('guided');
        if (!guided) return;
        if (!guided.querySelector('.guided-objectives')) {
            const wrap = document.createElement('div');
            wrap.className = 'guided-objectives';
            wrap.innerHTML = `
                <h3>Guided Objectives</h3>
                <ul class="objectives-list">
                    <li data-obj="changedSlope">Adjust the slope (m) slider at least once</li>
                    <li data-obj="changedIntercept">Adjust the y-intercept (b) slider at least once</li>
                    <li data-obj="matchedDisplay">Make the function display show f(x) = 2x + 1</li>
                </ul>
            `;
            const header = guided.querySelector('.step-header');
            if (header && header.parentNode) {
                header.parentNode.insertBefore(wrap, header.nextSibling);
            } else {
                guided.insertBefore(wrap, guided.firstChild);
            }
            if (!document.querySelector('#guided-objectives-style')) {
                const style = document.createElement('style');
                style.id = 'guided-objectives-style';
                style.textContent = `
                    .guided-objectives{background:#f8f9fa;border:1px solid #e9ecef;border-radius:12px;padding:1rem;margin-bottom:1rem}
                    .guided-objectives h3{margin:0 0 .5rem 0;color:#2c3e50}
                    .objectives-list{list-style:none;padding-left:1rem;margin:0}
                    .objectives-list li{position:relative;padding:.35rem 0 .35rem 1.2rem;color:#2c3e50}
                    .objectives-list li::before{content:'•';position:absolute;left:0;color:#667eea}
                    .objectives-list li.done{color:#27ae60}
                    .objectives-list li.done::before{content:'✓';color:#27ae60}
                `;
                document.head.appendChild(style);
            }
        }
        this.updateGuidedObjectivesUI();
    }

    updateGuidedObjectivesUI() {
        const entries = Object.entries(this.guidedObjectives);
        entries.forEach(([key, val]) => {
            const li = document.querySelector(`.objectives-list li[data-obj="${key}"]`);
            if (li) li.classList.toggle('done', !!val);
        });
        const allDone = entries.every(([,v]) => !!v);
        const nextBtn = document.getElementById('nextToChallenge');
        if (nextBtn) nextBtn.disabled = !allDone;
    }

    drawFunction(ctx, width, height, type, m, b, a) {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw enhanced grid
        this.drawInteractiveGrid(ctx, width, height);
        
        // Draw enhanced axes
        this.drawInteractiveAxes(ctx, width, height);
        
        // Draw function with improved algorithm
        this.drawInteractiveFunctionCurve(ctx, width, height, type, m, b, a);
        
        // Add key points and intercepts
        this.drawKeyPoints(ctx, width, height, type, m, b, a);
    }
    
    drawInteractiveGrid(ctx, width, height) {
        const scale = 30;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Major grid lines
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        
        // Vertical lines
        for (let x = centerX % scale; x <= width; x += scale) {
            ctx.beginPath();
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = centerY % scale; y <= height; y += scale) {
            ctx.beginPath();
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(width, y + 0.5);
            ctx.stroke();
        }
    }
    
    drawInteractiveAxes(ctx, width, height) {
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Main axes
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(0, centerY + 0.5);
        ctx.lineTo(width, centerY + 0.5);
        ctx.stroke();
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(centerX + 0.5, 0);
        ctx.lineTo(centerX + 0.5, height);
        ctx.stroke();
        
        // Tick marks and labels
        ctx.fillStyle = '#6c757d';
        ctx.font = '10px Poppins, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const scale = 30;
        for (let t = -5; t <= 5; t++) {
            if (t === 0) continue;
            const px = centerX + t * scale;
            const py = centerY - t * scale;
            
            if (px >= 0 && px <= width) {
                // X-axis ticks
                ctx.strokeStyle = '#2c3e50';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(px, centerY - 3);
                ctx.lineTo(px, centerY + 3);
                ctx.stroke();
                
                ctx.fillText(String(t), px, centerY + 6);
            }
            
            if (py >= 0 && py <= height) {
                // Y-axis ticks
                ctx.strokeStyle = '#2c3e50';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(centerX - 3, py);
                ctx.lineTo(centerX + 3, py);
                ctx.stroke();
                
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(t), centerX - 6, py);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
            }
        }
    }
    
    drawInteractiveFunctionCurve(ctx, width, height, type, m, b, a) {
        const scale = 30;
        const centerX = width / 2;
        const centerY = height / 2;
        
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        
        // Adaptive sampling based on function type
        const samples = this.getSamplesForType(type, width);
        
        ctx.beginPath();
        let firstPoint = true;
        
        for (let i = 0; i < samples.length; i++) {
            const x = samples[i];
            let y;
            
            switch(type) {
                case 'linear':
                    y = m * x + b;
                    break;
                case 'quadratic':
                    y = a * x * x + m * x + b;
                    break;
                case 'cubic':
                    y = a * x * x * x + m * x * x + b * x + 0;
                    break;
                default:
                    y = m * x + b;
            }
            
            const canvasX = centerX + x * scale;
            const canvasY = centerY - y * scale;
            
            if (isFinite(canvasY) && canvasY >= -50 && canvasY <= height + 50) {
                if (firstPoint) {
                ctx.moveTo(canvasX, canvasY);
                    firstPoint = false;
            } else {
                ctx.lineTo(canvasX, canvasY);
                }
            } else if (!firstPoint) {
                ctx.stroke();
                ctx.beginPath();
                firstPoint = true;
            }
        }
        
        if (!firstPoint) {
        ctx.stroke();
        }
    }
    
    getSamplesForType(type, width) {
        const xMin = -width / 60;
        const xMax = width / 60;
        
        let numSamples;
        switch(type) {
            case 'linear':
                numSamples = Math.max(100, width);
                break;
            case 'quadratic':
                numSamples = Math.max(200, width * 1.5);
                break;
            case 'cubic':
                numSamples = Math.max(300, width * 2);
                break;
            default:
                numSamples = width;
        }
        
        const samples = [];
        for (let i = 0; i < numSamples; i++) {
            const t = i / (numSamples - 1);
            samples.push(xMin + t * (xMax - xMin));
        }
        
        return samples;
    }
    
    drawKeyPoints(ctx, width, height, type, m, b, a) {
        const scale = 30;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Y-intercept (always exists for these function types)
        const yIntercept = b;
        const yIntX = centerX;
        const yIntY = centerY - yIntercept * scale;
        
        if (yIntY >= 0 && yIntY <= height) {
            ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
            ctx.arc(yIntX, yIntY, 4, 0, 2 * Math.PI);
            ctx.fill();
            
            // Label
            ctx.fillStyle = '#2c3e50';
            ctx.font = '10px Poppins, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`(0, ${yIntercept.toFixed(1)})`, yIntX + 6, yIntY - 2);
        }
        
        // X-intercept(s)
        const xIntercepts = this.calculateXIntercepts(type, m, b, a);
        xIntercepts.forEach(xInt => {
            const xIntX = centerX + xInt * scale;
            const xIntY = centerY;
            
            if (xIntX >= 0 && xIntX <= width) {
                ctx.fillStyle = '#27ae60';
        ctx.beginPath();
                ctx.arc(xIntX, xIntY, 4, 0, 2 * Math.PI);
                ctx.fill();
                
                // Label
                ctx.fillStyle = '#2c3e50';
                ctx.font = '10px Poppins, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(`(${xInt.toFixed(1)}, 0)`, xIntX, xIntY + 6);
            }
        });
        
        // Vertex for quadratic functions
        if (type === 'quadratic' && a !== 0) {
            const vertexX = -m / (2 * a);
            const vertexY = a * vertexX * vertexX + m * vertexX + b;
            const vertexCanvasX = centerX + vertexX * scale;
            const vertexCanvasY = centerY - vertexY * scale;
            
            if (vertexCanvasX >= 0 && vertexCanvasX <= width && vertexCanvasY >= 0 && vertexCanvasY <= height) {
                ctx.fillStyle = '#f39c12';
        ctx.beginPath();
                ctx.arc(vertexCanvasX, vertexCanvasY, 5, 0, 2 * Math.PI);
                ctx.fill();
                
                // Label
                ctx.fillStyle = '#2c3e50';
                ctx.font = '10px Poppins, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(`Vertex (${vertexX.toFixed(1)}, ${vertexY.toFixed(1)})`, vertexCanvasX, vertexCanvasY - 6);
            }
        }
    }
    
    calculateXIntercepts(type, m, b, a) {
        const intercepts = [];
        
        switch(type) {
            case 'linear':
                if (m !== 0) {
                    intercepts.push(-b / m);
                }
                break;
            case 'quadratic':
                if (a !== 0) {
                    const discriminant = m * m - 4 * a * b;
                    if (discriminant >= 0) {
                        const sqrtDisc = Math.sqrt(discriminant);
                        intercepts.push((-m + sqrtDisc) / (2 * a));
                        if (discriminant > 0) {
                            intercepts.push((-m - sqrtDisc) / (2 * a));
                        }
                    }
                }
                break;
            case 'cubic':
                // Simplified cubic root finding (for basic cases)
                if (a !== 0) {
                    // Try rational root theorem for simple cases
                    const possibleRoots = [-3, -2, -1, 0, 1, 2, 3];
                    possibleRoots.forEach(root => {
                        const value = a * root * root * root + m * root * root + b * root;
                        if (Math.abs(value) < 0.1) {
                            intercepts.push(root);
                        }
                    });
                }
                break;
        }
        
        return intercepts.filter(x => isFinite(x));
    }

    drawInteractiveFunction(ctx, width, height) {
        const m = parseFloat(document.getElementById('slope')?.value || 1);
        const b = parseFloat(document.getElementById('yIntercept')?.value || 0);
        const a = parseFloat(document.getElementById('coefficient')?.value || 1);
        const type = document.getElementById('functionType')?.value || 'linear';
        
        this.drawFunction(ctx, width, height, type, m, b, a);
        this.updateFunctionDisplay(type, m, b, a);
    }


    updateFunctionDisplay(type, m, b, a) {
        const display = document.getElementById('functionDisplay');
        if (!display) return;

        let functionText = 'f(x) = ';
        switch(type) {
            case 'linear':
                functionText += `${m === 1 ? '' : m === -1 ? '-' : m}x${b >= 0 ? ' + ' + b : ' - ' + Math.abs(b)}`;
                break;
            case 'quadratic':
                functionText += `${a === 1 ? '' : a === -1 ? '-' : a}x²${m >= 0 ? ' + ' + m : ' - ' + Math.abs(m)}x${b >= 0 ? ' + ' + b : ' - ' + Math.abs(b)}`;
                break;
            case 'cubic':
                functionText += `${a === 1 ? '' : a === -1 ? '-' : a}x³${m >= 0 ? ' + ' + m : ' - ' + Math.abs(m)}x²${b >= 0 ? ' + ' + b : ' - ' + Math.abs(b)}x`;
                break;
        }
        
        display.textContent = functionText;
    }

    updateFunction(type) {
        const canvas = document.getElementById('interactiveCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        this.drawInteractiveFunction(ctx, canvas.width, canvas.height);
        const display = document.getElementById('functionDisplay');
        if (display && /f\(x\)\s*=\s*2x\s*\+\s*1\b/.test(display.textContent)) {
            this.guidedObjectives.matchedDisplay = true;
            this.updateGuidedObjectivesUI();
        }
    }

    updateSlope(value) {
        document.getElementById('slopeValue').textContent = value;
        this.updateInteractiveGraph();
        this.guidedObjectives.changedSlope = true;
        this.updateGuidedObjectivesUI();
    }

    updateYIntercept(value) {
        document.getElementById('yInterceptValue').textContent = value;
        this.updateInteractiveGraph();
        this.guidedObjectives.changedIntercept = true;
        this.updateGuidedObjectivesUI();
    }

    updateCoefficient(value) {
        document.getElementById('coefficientValue').textContent = value;
        this.updateInteractiveGraph();
    }

    updateInteractiveGraph() {
        const canvas = document.getElementById('interactiveCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        this.drawInteractiveFunction(ctx, canvas.width, canvas.height);
        // also evaluate objective match after redraw
        const display = document.getElementById('functionDisplay');
        if (display && /f\(x\)\s*=\s*2x\s*\+\s*1\b/.test(display.textContent)) {
            this.guidedObjectives.matchedDisplay = true;
            this.updateGuidedObjectivesUI();
        }
    }

    resetGraph() {
        document.getElementById('slope').value = 1;
        document.getElementById('yIntercept').value = 0;
        document.getElementById('coefficient').value = 1;
        document.getElementById('functionType').value = 'linear';
        
        document.getElementById('slopeValue').textContent = '1';
        document.getElementById('yInterceptValue').textContent = '0';
        document.getElementById('coefficientValue').textContent = '1';
        
        this.updateInteractiveGraph();
    }

    playVideo() {
        const button = document.getElementById('playVideo');
        const icon = button.querySelector('i');
        
        if (icon.classList.contains('fa-play')) {
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
            button.innerHTML = '<i class="fas fa-pause"></i> Pause Animation';
            
            // Simulate video playing
            setTimeout(() => {
                this.showNotification('Animation completed! You now understand the basics of functions.', 'success');
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
                button.innerHTML = '<i class="fas fa-play"></i> Replay Animation';
            }, 3000);
        } else {
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            button.innerHTML = '<i class="fas fa-play"></i> Play Animation';
        }
    }

    // Virtual Aids
    initVirtualAids() {
        this.safeParser = this.buildParser();
        this.bindVAControls();
        this.updateVAFromRule();
        this.drawVAGraph();
        this.injectVAPresets();
    }

    buildParser() {
        // Enhanced mathematical expression parser with better support and error handling
        const allowed = /^[0-9xX+\-*/^().,\s|absqrtlncosei]*$/i; // Added ln, cos, sin, e, pi
        
        const normalize = (expr) => {
            let e = String(expr || '').trim();
            if (!e) throw new Error('Empty expression');
            
            // Normalize whitespace and case
            e = e.replace(/\s+/g, ' ');
            e = e.replace(/X/g, 'x');
            
            // Replace ^ with ** for exponentiation
            e = e.replace(/\^/g, '**');
            
            // Handle mathematical constants
            e = e.replace(/\bpi\b/gi, 'Math.PI');
            e = e.replace(/\be\b/gi, 'Math.E');
            
            // Handle mathematical functions
            e = e.replace(/\bln\b/gi, 'Math.log');
            e = e.replace(/\bsqrt\b/gi, 'Math.sqrt');
            e = e.replace(/\babs\b/gi, 'Math.abs');
            e = e.replace(/\bsin\b/gi, 'Math.sin');
            e = e.replace(/\bcos\b/gi, 'Math.cos');
            e = e.replace(/\btan\b/gi, 'Math.tan');
            
            // Convert |...| to abs(...) - handle nested cases
            let prevE = '';
            while (prevE !== e) {
                prevE = e;
            e = e.replace(/\|([^|]+)\|/g, 'abs($1)');
            }
            
            // Insert implicit multiplication with better handling
            // number followed by x, x followed by number
            e = e.replace(/(\d)(x)/gi, '$1*$2');
            e = e.replace(/(x)(\d)/gi, '$1*$2');
            
            // number followed by (, x followed by (, ) followed by number/x
            e = e.replace(/(\d)\(/g, '$1*(');
            e = e.replace(/(x)\(/gi, '$1*(');
            e = e.replace(/\)(\d|x)/gi, ')*$1');
            
            // number/x/) followed by function name
            e = e.replace(/(\d|x|\))(Math\.(sqrt|abs|log|sin|cos|tan))\(/gi, '$1*$2(');
            
            // Handle negative numbers and expressions
            e = e.replace(/\+\-/g, '-');
            e = e.replace(/\-\+/g, '-');
            e = e.replace(/\+\+/g, '+');
            e = e.replace(/\-\-/g, '+');
            
            return e;
        };
        
        const validateExpression = (expr) => {
            const raw = String(expr || '');
            if (!raw.trim()) throw new Error('Empty expression');
            if (!allowed.test(raw)) throw new Error('Invalid characters in expression');
            
            // Check for balanced parentheses
            let parenCount = 0;
            for (const char of raw) {
                if (char === '(') parenCount++;
                if (char === ')') parenCount--;
                if (parenCount < 0) throw new Error('Unbalanced parentheses');
            }
            if (parenCount !== 0) throw new Error('Unbalanced parentheses');
            
            // Check for division by zero patterns
            if (/\/\s*0(?!\.\d)/.test(raw)) throw new Error('Division by zero');
        };
        
        return {
            evalAt(expr, x) {
                try {
                    validateExpression(expr);
                    const normalized = normalize(expr);
                    
                    // Create safe evaluation context
                    const src = `"use strict"; 
                        const sqrt = Math.sqrt, abs = Math.abs, log = Math.log, 
                              sin = Math.sin, cos = Math.cos, tan = Math.tan,
                              PI = Math.PI, E = Math.E;
                        const x = ${x}; 
                        return (${normalized});`;
                    
                // eslint-disable-next-line no-new-func
                const fn = new Function(src);
                const val = fn();
                    
                    if (!isFinite(val)) {
                        if (isNaN(val)) throw new Error('Result is NaN');
                        if (val === Infinity) throw new Error('Result is infinity');
                        if (val === -Infinity) throw new Error('Result is negative infinity');
                    }
                    
                return val;
                } catch (error) {
                    throw new Error(`Evaluation error: ${error.message}`);
                }
            },
            
            // New method to get domain restrictions
            getDomainRestrictions(expr) {
                const restrictions = [];
                const raw = String(expr || '');
                
                // Check for square root restrictions
                const sqrtMatches = raw.match(/sqrt\(([^)]+)\)/gi);
                if (sqrtMatches) {
                    sqrtMatches.forEach(match => {
                        const inner = match.match(/sqrt\(([^)]+)\)/i)[1];
                        restrictions.push({
                            type: 'sqrt',
                            condition: `${inner} >= 0`,
                            description: `Square root requires ${inner} ≥ 0`
                        });
                    });
                }
                
                // Check for division restrictions
                const divMatches = raw.match(/\/([^+\-*/^()]+)/g);
                if (divMatches) {
                    divMatches.forEach(match => {
                        const denominator = match.substring(1);
                        restrictions.push({
                            type: 'division',
                            condition: `${denominator} != 0`,
                            description: `Division by zero: ${denominator} ≠ 0`
                        });
                    });
                }
                
                return restrictions;
            },
            
            // New method to validate expression syntax
            validateSyntax(expr) {
                try {
                    validateExpression(expr);
                    normalize(expr);
                    return { valid: true, error: null };
                } catch (error) {
                    return { valid: false, error: error.message };
                }
            }
        };
    }

    bindVAControls() {
        const rule = document.getElementById('vaRule');
        const input = document.getElementById('vaInput');
        const runBtn = document.getElementById('vaRun');
        const applyBtn = document.getElementById('vaApplyRule');
        const table = document.getElementById('vaTable');
        const grid = document.querySelector('.va-table-controls');
        const canvas = document.getElementById('vaGraph');

        if (runBtn) runBtn.addEventListener('click', () => this.runVAMachine());
        if (applyBtn) applyBtn.addEventListener('click', () => { this.updateVAFromRule(); });
        if (rule) rule.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.updateVAFromRule(); });
        if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.runVAMachine(); });
        if (grid) grid.addEventListener('click', (e) => this.handleVATableSeed(e));
        if (table) table.addEventListener('input', (e) => this.recomputeVATable(e));

        if (canvas) {
            canvas.addEventListener('mousemove', (e) => this.handleVAMouseMove(e));
            // wheel zoom
            canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = Math.sign(e.deltaY);
                const factor = delta > 0 ? 0.9 : 1.1;
                this.vaScale = Math.max(this.vaMinScale, Math.min(this.vaMaxScale, this.vaScale * factor));
                this.drawVAGraph();
            }, { passive: false });
        }

        const tutBtn = document.getElementById('vaStartTutorial');
        if (tutBtn) tutBtn.addEventListener('click', () => this.startVATutorial());

        const missionTourBtn = document.getElementById('missionTour');
        if (missionTourBtn) missionTourBtn.addEventListener('click', () => this.startMissionTour());

        // minimal styles for VA + tutorial enhancements
        if (!document.querySelector('#va-style')) {
            const style = document.createElement('style');
            style.id = 'va-style';
            style.textContent = `
                .virtual-aids{margin-top:1rem}
                .va-grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
                .va-card{background:linear-gradient(145deg,#ffffff,#f7f8ff);border:1px solid #e9ecef;border-radius:16px;padding:1rem;box-shadow:0 12px 32px rgba(102,126,234,.12)}
                .va-row{display:flex;gap:.5rem;align-items:center;margin:.4rem 0;flex-wrap:wrap}
                #vaRule{min-width:160px}
                #vaRule.error{border-color:#e74c3c;background:#fff5f5}
                .va-msg{font-size:.85rem;margin-left:.5rem}
                .va-msg.error{color:#e74c3c}
                .va-msg.success{color:#27ae60}
                .va-io{display:flex;align-items:center;gap:1rem;margin-top:.6rem}
                .va-input,.va-output{width:72px;height:48px;border:2px solid #e1e5ee;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:600}
                .va-gear{color:#667eea}
                .va-gear.spin i{animation:spin 0.8s linear infinite}
                .va-table-wrap{display:flex;gap:1rem;margin-top:.5rem}
                .va-table{border-collapse:collapse;min-width:160px}
                .va-table th,.va-table td{border:1px solid #e1e5ee;padding:.4rem .6rem;text-align:center}
                .va-mapping{flex:1;min-height:120px;border:1px dashed #e1e5ee;border-radius:8px;padding:.5rem;display:flex;flex-wrap:wrap;gap:.4rem;align-content:flex-start}
                .map-chip{background:#f3f4ff;border:1px solid #dfe3ff;border-radius:999px;padding:.2rem .5rem;font-size:.85rem}
                .va-hint{color:#6c757d;font-size:.85rem;margin-top:.4rem}
                .va-presets{display:flex;gap:.4rem;flex-wrap:wrap;margin:.25rem 0}
                .va-presets .btn{padding:.25rem .5rem}
                .va-tour-tip{position:absolute;background:#1f2937;color:#fff;padding:.6rem .75rem;border-radius:10px;box-shadow:0 10px 24px rgba(0,0,0,.2);max-width:260px;z-index:10000}
                .va-tour-tip h5{margin:0 0 .25rem 0;font-size:1rem}
                .va-tour-tip p{margin:0;font-size:.85rem;line-height:1.3}
                .va-tour-controls{display:flex;gap:.4rem;margin-top:.5rem}
                .va-tour-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);backdrop-filter:blur(1px);z-index:9999}
                .va-highlight{position:relative;box-shadow:0 0 0 3px rgba(102,126,234,.6),0 0 0 8px rgba(102,126,234,.2);border-radius:10px;transition:box-shadow .2s ease}
                .va-tip-right::after{content:"";position:absolute;left:-8px;top:16px;width:0;height:0;border-top:8px solid transparent;border-bottom:8px solid transparent;border-right:8px solid #1f2937}
                .va-tip-top::after{content:"";position:absolute;left:16px;bottom:-8px;width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:8px solid #1f2937}
                @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
            `;
            document.head.appendChild(style);
        }

        // Zoom buttons
        const zoomIn = document.getElementById('vaZoomIn');
        const zoomOut = document.getElementById('vaZoomOut');
        const zoomReset = document.getElementById('vaZoomReset');
        if (zoomIn) zoomIn.addEventListener('click', () => { this.vaScale = Math.min(this.vaMaxScale, this.vaScale * 1.1); this.drawVAGraph(); });
        if (zoomOut) zoomOut.addEventListener('click', () => { this.vaScale = Math.max(this.vaMinScale, this.vaScale / 1.1); this.drawVAGraph(); });
        if (zoomReset) zoomReset.addEventListener('click', () => { this.vaScale = 30; this.drawVAGraph(); });
    }

    // Lightweight confetti on rewards
    burstConfetti(x = window.innerWidth - 40, y = 40) {
        try {
            const n = 12; const colors = ['#ffd700','#ffed4e','#667eea','#27ae60'];
            for (let i=0;i<n;i++) {
                const s = document.createElement('span');
                s.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:8px;height:8px;background:${colors[i%colors.length]};transform:translate(-50%,-50%);border-radius:2px;pointer-events:none;z-index:2000;`;
                document.body.appendChild(s);
                const angle = (Math.PI*2*i)/n; const vx = Math.cos(angle)* (4 + Math.random()*3); const vy = Math.sin(angle)* (4 + Math.random()*3);
                let t=0; const dur=40+Math.random()*20;
                const tick=()=>{ t++; s.style.left = (x + vx* t) + 'px'; s.style.top = (y + vy* t + 0.2*t*t) + 'px'; s.style.opacity = String(1 - t/dur); if (t<dur) requestAnimationFrame(tick); else s.remove(); };
                requestAnimationFrame(tick);
            }
        } catch(_) {}
    }

    // Practice renderer: step-by-step problems with reveal/check
    renderPractice() {
        const grid = document.getElementById('practiceGrid');
        if (!grid) return;
        const cards = [
            {
                title: 'Evaluate f(x) = 2x + 1 at x = 4',
                steps: [
                    { tip: 'Write the rule clearly', body: 'f(x) = 2x + 1' },
                    { tip: 'Substitute x = 4', body: 'f(4) = 2(4) + 1' },
                    { tip: 'Multiply then add', body: 'f(4) = 8 + 1 = 9' }
                ],
                answer: '9',
                explain: 'Plug x=4 into 2x+1 → 2·4+1 = 9.',
                va: { rule: '2x+1', input: '4' }
            },
            {
                title: 'Find the domain of g(x) = √(x − 2)',
                steps: [
                    { tip: 'Inside the √ must be ≥ 0', body: 'x − 2 ≥ 0' },
                    { tip: 'Solve the inequality', body: 'x ≥ 2' },
                    { tip: 'Write the domain', body: 'Domain: [2, ∞)' }
                ],
                answer: 'x ≥ 2',
                explain: 'Radical requires inside ≥ 0, so x−2 ≥ 0 → x ≥ 2.',
                va: { rule: 'sqrt(x-2)', input: '2' }
            },
            {
                title: 'Y-intercept of y = -2x + 7',
                steps: [
                    { tip: 'Y-intercept is b in y = mx + b', body: 'b = 7' },
                    { tip: 'Occurs when x = 0', body: 'y = -2(0) + 7 = 7' }
                ],
                answer: '7',
                explain: 'In y=mx+b, b is the y‑intercept. Here b=7.',
                setLinear: { m: -2, b: 7 }
            }
        ];
        // practice state: attempts and completion
        this.practiceState = this.practiceState || { attempts: {}, done: {} };
        const getAttempts = (i)=> (this.practiceState.attempts[i]||0);
        const norm = (s)=> String(s||'')
            .toLowerCase()
            .replace(/\u200b|\u200c|\u200d|\uFEFF/g,'')
            .replace(/[\u2212\u2013\u2014]/g,'-')
            .replace(/≥/g,'>=')
            .replace(/≤/g,'<=')
            .replace(/\s+/g,' ')
            .trim();

        grid.innerHTML = cards.map((c,idx)=>`
            <div class="practice-card" data-pract="${idx}">
                <h4 style="margin:0 0 .25rem 0">${c.title}</h4>
                <div class="practice-progress" aria-hidden="true" style="height:6px;background:#eef1f7;border-radius:6px;overflow:hidden;margin:.25rem 0 .5rem 0">
                    <div class="bar" style="height:100%;width:0;background:#667eea;transition:width .3s ease"></div>
                </div>
                <ol class="practice-steps">
                    ${c.steps.map((s,i)=>`<li><strong>${i+1}.</strong> ${s.tip}<div class="step-body">${s.body}</div></li>`).join('')}
                </ol>
                <div class="practice-actions">
                    <button class="btn btn-outline btn-sm reveal-step">Reveal Next Step</button>
                    <button class="btn btn-outline btn-sm reveal-all">Reveal All Steps</button>
                    <input type="text" class="practice-input" placeholder="Your answer" style="flex:1;min-width:120px">
                    <button class="btn btn-primary btn-sm check-practice">Check</button>
                    <button class="btn btn-secondary btn-sm show-solution" style="display:none">Show solution</button>
                    <button class="btn btn-secondary btn-sm tryit" ${c.va?`data-va-rule="${c.va.rule}" data-va-input="${c.va.input||''}"`:''} ${c.setLinear?`data-linear-m="${c.setLinear.m}" data-linear-b="${c.setLinear.b}"`:''}>Try it</button>
                </div>
                <div class="practice-feedback" aria-live="polite" style="margin-top:.5rem;font-weight:600"></div>
                <div class="practice-explain" style="margin-top:.25rem;color:#6c757d;display:none">${c.explain||''}</div>
            </div>
        `).join('');

        grid.addEventListener('click', (e)=>{
            const card = e.target.closest('.practice-card'); if (!card) return;
            if (e.target.closest('.reveal-step')) {
                const steps = [...card.querySelectorAll('.practice-steps li')];
                const next = steps.find(li=>!li.classList.contains('revealed'));
                if (next) { next.classList.add('revealed'); }
                // update progress bar
                const revealed = steps.filter(li=>li.classList.contains('revealed')).length;
                const bar = card.querySelector('.practice-progress .bar');
                if (bar) bar.style.width = `${Math.round((revealed/steps.length)*100)}%`;
                return;
            }
            if (e.target.closest('.reveal-all')) {
                const steps = card.querySelectorAll('.practice-steps li');
                steps.forEach(li=>li.classList.add('revealed'));
                const bar = card.querySelector('.practice-progress .bar');
                if (bar) bar.style.width = '100%';
                return;
            }
            if (e.target.closest('.show-solution')) {
                const idx = parseInt(card.getAttribute('data-pract')||'0',10);
                const input = card.querySelector('.practice-input');
                const explain = card.querySelector('.practice-explain');
                if (input) input.value = String(cards[idx].answer);
                card.querySelectorAll('.practice-steps li').forEach(li=>li.classList.add('revealed'));
                const bar = card.querySelector('.practice-progress .bar');
                if (bar) bar.style.width = '100%';
                if (explain && cards[idx].explain){ explain.style.display = ''; }
                return;
            }
            if (e.target.closest('.check-practice')) {
                const idx = parseInt(card.getAttribute('data-pract')||'0',10);
                const ans = cards[idx].answer.trim().toLowerCase();
                const input = card.querySelector('.practice-input');
                const val = (input.value||'').trim().toLowerCase();
                const fb = card.querySelector('.practice-feedback');
                // robust compare: numeric tolerance or normalized string
                let ok;
                const numAns = parseFloat(cards[idx].answer);
                const numVal = parseFloat(val);
                if (!isNaN(numAns) && !isNaN(numVal)) {
                    ok = Math.abs(numAns - numVal) < 1e-6;
                } else {
                    ok = norm(ans) === norm(val) || norm(ans.replace('≥','>=')) === norm(val);
                }
                fb.textContent = ok ? 'Correct! +10 XP' : 'Not quite. Reveal steps, check the hint, then try again.';
                fb.style.color = ok ? '#27ae60' : '#e74c3c';
                // attempts handling
                this.practiceState.attempts[idx] = getAttempts(idx) + 1;
                const tries = this.practiceState.attempts[idx];
                const solutionBtn = card.querySelector('.show-solution');
                if (!ok && tries >= 2 && solutionBtn) solutionBtn.style.display = '';
                this.appendPracticeLog(`${cards[idx].title} (try ${tries})`, ok);
                if (ok) {
                    // mark as done, disable inputs
                    this.practiceState.done[idx] = true;
                    input.setAttribute('disabled','disabled');
                    card.querySelectorAll('.btn').forEach(b=>{
                        if (!b.classList.contains('tryit')) b.setAttribute('disabled','disabled');
                    });
                    const explain = card.querySelector('.practice-explain');
                    if (explain && cards[idx].explain){ explain.style.display = ''; }
                    this.score++; this.updateXP(); this.burstConfetti();
                }
            }
        });
    }

    bindOutlineLinks() {
        document.querySelectorAll('.quick-outline .outline-link').forEach(a => {
            a.addEventListener('click', (e)=>{
                const href = a.getAttribute('href');
                if (!href || !href.startsWith('#')) return;
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    try { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch(_) { location.hash = href; }
                }
            });
        });
    }

    appendPracticeLog(title, ok) {
        const log = document.getElementById('practiceLog');
        if (!log) return;
        const row = document.createElement('div');
        row.className = 'practice-log-item';
        row.innerHTML = `<span style="color:${ok?'#27ae60':'#e74c3c'};font-weight:600">${ok?'Correct':'Incorrect'}</span> — ${title}`;
        log.prepend(row);
    }

    startMissionTour() {
        const steps = [
            { anchor: '.mission-nav', title: 'Mission Steps', text: 'Move through Concept → Guided → Challenge → Reflection.' },
            { anchor: '.virtual-aids', title: 'Virtual Aids', text: 'Use the Function Machine, Table, and Graph to explore.' },
            { anchor: '.interactive-demo', title: 'Interactive Graph', text: 'Adjust sliders to see how the function changes.' },
            { anchor: '.challenge-container', title: 'Gamified Quiz', text: 'Answer questions, earn XP, and review explanations.' }
        ];
        this.runVATour(steps);
    }

    // Bind "Try it" buttons in the lesson to Virtual Aids and Interactive Graph
    bindLessonTryIts() {
        // Buttons that target the Function Machine/Table/Graph via rule/input
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('button.tryit');
            if (!btn) return;
            const rule = btn.getAttribute('data-va-rule');
            const input = btn.getAttribute('data-va-input');
            const seed = btn.getAttribute('data-va-seed');
            const ruleInput = document.getElementById('vaRule');
            const inputBox = document.getElementById('vaInput');
            if (rule && ruleInput) {
                ruleInput.value = rule;
                this.updateVAFromRule();
            }
            if (typeof input === 'string' && inputBox) {
                inputBox.value = input;
                this.runVAMachine();
            }
            if (typeof seed === 'string') {
                const seedBtn = document.querySelector(`.va-table-controls button[data-seed="${seed}"]`);
                if (seedBtn) seedBtn.click(); else this.reseedVATable();
            }
            try { document.querySelector('.va-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch(_) {}
        });

        // Buttons that set the Interactive Graph to a specific linear function quickly
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('button.tryit-linear');
            if (!btn) return;
            const m = parseFloat(btn.getAttribute('data-linear-m') || '1');
            const b = parseFloat(btn.getAttribute('data-linear-b') || '0');
            const typeSel = document.getElementById('functionType');
            const slope = document.getElementById('slope');
            const yInt = document.getElementById('yIntercept');
            if (typeSel) typeSel.value = 'linear';
            if (slope) slope.value = String(m);
            if (yInt) yInt.value = String(b);
            const slopeVal = document.getElementById('slopeValue');
            const yIntVal = document.getElementById('yInterceptValue');
            if (slopeVal) slopeVal.textContent = String(m);
            if (yIntVal) yIntVal.textContent = String(b);
            this.updateInteractiveGraph();
            try { document.getElementById('interactiveCanvas')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch(_) {}
        });
    }

    startVATutorial() {
        const steps = [
            {
                anchor: '#vaRule',
                title: 'Write the Rule',
                text: 'Type a function rule using x (e.g., 2x+1, x^2, sqrt(x)). Then click Apply.'
            },
            {
                anchor: '#vaInput',
                title: 'Feed an Input',
                text: 'Enter a value for x and press Run to see f(x). The machine shows input → output.'
            },
            {
                anchor: '#vaTable',
                title: 'Build a Table',
                text: 'Use Fill buttons to generate x values. The table computes f(x) and creates mapping pairs.'
            },
            {
                anchor: '#vaGraph',
                title: 'See the Graph',
                text: 'The graph updates to the rule. Move your mouse to read approximate (x, f(x)) points.'
            }
        ];

        this.runVATour(steps);
    }

    runVATour(steps) {
        let index = 0;
        const overlay = document.createElement('div');
        overlay.className = 'va-tour-overlay';
        document.body.appendChild(overlay);

        const tip = document.createElement('div');
        tip.className = 'va-tour-tip';
        document.body.appendChild(tip);

        let highlightedEl = null;

        const placeTip = () => {
            const step = steps[index];
            const el = document.querySelector(step.anchor);
            if (!el) return;
            // highlight target
            if (highlightedEl) highlightedEl.classList.remove('va-highlight');
            highlightedEl = el;
            el.classList.add('va-highlight');
            // scroll to view
            try { el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' }); } catch(_) {}
            const rect = el.getBoundingClientRect();
            tip.innerHTML = `
                <h5>${step.title}</h5>
                <p>${step.text}</p>
                <div class="va-tour-controls">
                    <button class="btn btn-secondary btn-sm" id="vaTourPrev" ${index===0?'disabled':''}>Back</button>
                    <button class="btn btn-primary btn-sm" id="vaTourNext">${index===steps.length-1?'Finish':'Next'}</button>
                </div>
            `;
            // choose placement: right if space else top
            const viewportW = window.innerWidth;
            const rightSpace = viewportW - (rect.right + 16);
            let top, left;
            if (rightSpace > 260) {
                // place to the right
                top = Math.max(12, rect.top + window.scrollY + 8);
                left = rect.right + window.scrollX + 16;
                tip.classList.remove('va-tip-top');
                tip.classList.add('va-tip-right');
            } else {
                // place above
                top = Math.max(12, rect.top + window.scrollY - tip.offsetHeight - 16);
                left = Math.min(window.scrollX + rect.left, window.scrollX + viewportW - tip.offsetWidth - 12);
                tip.classList.remove('va-tip-right');
                tip.classList.add('va-tip-top');
            }
            tip.style.top = top + 'px';
            tip.style.left = left + 'px';
            document.getElementById('vaTourPrev').onclick = () => { if (index>0){ index--; placeTip(); } };
            document.getElementById('vaTourNext').onclick = () => {
                if (index < steps.length - 1) { index++; placeTip(); } else { cleanup(); }
            };
        };

        const cleanup = () => { if (highlightedEl) highlightedEl.classList.remove('va-highlight'); tip.remove(); overlay.remove(); };
        placeTip();
    }

    injectVAPresets() {
        const ruleInput = document.getElementById('vaRule');
        if (!ruleInput) return;
        const row = ruleInput.closest('.va-row');
        if (!row) return;
        
        // add inline message span for validation
        if (!document.getElementById('vaRuleMsg')){
            const msg = document.createElement('span');
            msg.id = 'vaRuleMsg';
            msg.className = 'va-msg';
            row.appendChild(msg);
        }
        
        // add presets under the rule row
        if (!document.querySelector('.va-presets')){
            const presets = document.createElement('div');
            presets.className = 'va-presets';
            presets.innerHTML = `
                <div class="preset-category">
                    <strong>Linear:</strong>
                <button class="btn btn-outline btn-sm" data-rule="2x+1">2x+1</button>
                    <button class="btn btn-outline btn-sm" data-rule="-x+3">-x+3</button>
                    <button class="btn btn-outline btn-sm" data-rule="0.5x-2">0.5x-2</button>
                </div>
                <div class="preset-category">
                    <strong>Quadratic:</strong>
                <button class="btn btn-outline btn-sm" data-rule="x^2">x^2</button>
                <button class="btn btn-outline btn-sm" data-rule="x^2-4x+3">x^2-4x+3</button>
                    <button class="btn btn-outline btn-sm" data-rule="-x^2+2x+1">-x^2+2x+1</button>
                </div>
                <div class="preset-category">
                    <strong>Special:</strong>
                <button class="btn btn-outline btn-sm" data-rule="|x|">|x|</button>
                <button class="btn btn-outline btn-sm" data-rule="sqrt(x)">sqrt(x)</button>
                <button class="btn btn-outline btn-sm" data-rule="1/(x-2)">1/(x-2)</button>
                </div>
                <div class="preset-category">
                    <strong>Trigonometric:</strong>
                    <button class="btn btn-outline btn-sm" data-rule="sin(x)">sin(x)</button>
                    <button class="btn btn-outline btn-sm" data-rule="cos(x)">cos(x)</button>
                    <button class="btn btn-outline btn-sm" data-rule="sin(2*x)">sin(2x)</button>
                </div>
            `;
            row.parentElement.insertBefore(presets, row.nextSibling);
            
            // Add styles for preset categories
            if (!document.querySelector('#preset-styles')) {
                const style = document.createElement('style');
                style.id = 'preset-styles';
                style.textContent = `
                    .va-presets { display: flex; flex-direction: column; gap: 0.5rem; margin: 0.5rem 0; }
                    .preset-category { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
                    .preset-category strong { min-width: 80px; font-size: 0.85rem; color: #2c3e50; }
                `;
                document.head.appendChild(style);
            }
            
            presets.addEventListener('click', (e)=>{
                const btn = e.target.closest('button[data-rule]');
                if (!btn) return;
                ruleInput.value = btn.getAttribute('data-rule');
                this.updateVAFromRule();
                
                // Add visual feedback
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => btn.style.transform = '', 150);
            });
        }
        
        // (Removed) Function Comparison feature
    }
    
    initFunctionHistory() {
        const vaCard = document.querySelector('.va-card:first-child');
        if (!vaCard || document.getElementById('functionHistory')) return;
        
        const history = document.createElement('div');
        history.id = 'functionHistory';
        history.className = 'function-history';
        history.innerHTML = `
            <h4><i class="fas fa-history"></i> Function History & Favorites</h4>
            <div class="history-tabs">
                <button class="tab-btn active" data-tab="history">History</button>
                <button class="tab-btn" data-tab="favorites">Favorites</button>
            </div>
            <div class="tab-content">
                <div class="tab-panel active" id="historyPanel">
                    <div class="history-list" id="historyList"></div>
                    <button class="btn btn-outline btn-sm" id="clearHistory">Clear History</button>
                </div>
                <div class="tab-panel" id="favoritesPanel">
                    <div class="favorites-list" id="favoritesList"></div>
                </div>
            </div>
        `;
        
        vaCard.appendChild(history);
        
        // Add styles
        if (!document.querySelector('#history-styles')) {
            const style = document.createElement('style');
            style.id = 'history-styles';
            style.textContent = `
                .function-history { margin-top: 1rem; padding: 1rem; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 12px; }
                .function-history h4 { margin: 0 0 0.5rem 0; color: #2c3e50; display: flex; align-items: center; gap: 0.5rem; }
                .history-tabs { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
                .tab-btn { padding: 0.4rem 0.8rem; border: 1px solid #e9ecef; background: #fff; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
                .tab-btn.active { background: #667eea; color: white; border-color: #667eea; }
                .tab-btn:hover:not(.active) { background: #f8f9fa; }
                .tab-panel { display: none; }
                .tab-panel.active { display: block; }
                .history-list, .favorites-list { max-height: 200px; overflow-y: auto; margin-bottom: 0.5rem; }
                .history-item, .favorite-item { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; background: #fff; border: 1px solid #e9ecef; border-radius: 6px; margin-bottom: 0.25rem; }
                .history-item:hover, .favorite-item:hover { background: #f8f9fa; }
                .function-text { font-family: monospace; font-size: 0.9rem; flex: 1; }
                .function-actions { display: flex; gap: 0.25rem; }
                .function-actions button { padding: 0.25rem 0.5rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
                .btn-use { background: #667eea; color: white; }
                .btn-favorite { background: #f39c12; color: white; }
                .btn-unfavorite { background: #e74c3c; color: white; }
                .btn-remove { background: #95a5a6; color: white; }
            `;
            document.head.appendChild(style);
        }
        
        // Bind tab functionality
        history.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                
                // Update active tab
                history.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                history.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(`${tab}Panel`).classList.add('active');
            });
        });
        
        // Bind clear history
        document.getElementById('clearHistory').addEventListener('click', () => {
            this.functionHistory = [];
            this.saveFunctionHistory();
            this.renderFunctionHistory();
        });
        
        // Render initial data
        this.renderFunctionHistory();
        this.renderFunctionFavorites();
    }
    
    addToFunctionHistory(expression) {
        if (!expression || !expression.trim()) return;
        
        const timestamp = new Date().toISOString();
        const historyItem = {
            expression: expression.trim(),
            timestamp,
            id: Date.now()
        };
        
        // Remove if already exists
        this.functionHistory = this.functionHistory.filter(item => item.expression !== expression.trim());
        
        // Add to beginning
        this.functionHistory.unshift(historyItem);
        
        // Limit size
        if (this.functionHistory.length > this.maxHistorySize) {
            this.functionHistory = this.functionHistory.slice(0, this.maxHistorySize);
        }
        
        this.saveFunctionHistory();
        this.renderFunctionHistory();
    }
    
    toggleFunctionFavorite(expression) {
        const index = this.functionFavorites.indexOf(expression);
        if (index > -1) {
            this.functionFavorites.splice(index, 1);
        } else {
            this.functionFavorites.push(expression);
        }
        
        this.saveFunctionFavorites();
        this.renderFunctionFavorites();
        this.renderFunctionHistory(); // Update history view to show favorite status
    }
    
    saveFunctionHistory() {
        localStorage.setItem('mathease-function-history', JSON.stringify(this.functionHistory));
    }
    
    saveFunctionFavorites() {
        localStorage.setItem('mathease-function-favorites', JSON.stringify(this.functionFavorites));
    }
    
    renderFunctionHistory() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;
        
        if (this.functionHistory.length === 0) {
            historyList.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 1rem;">No functions in history yet.</div>';
            return;
        }
        
        historyList.innerHTML = this.functionHistory.map(item => {
            const isFavorite = this.functionFavorites.includes(item.expression);
            const timeAgo = this.getTimeAgo(item.timestamp);
            
            return `
                <div class="history-item">
                    <div class="function-text">f(x) = ${item.expression}</div>
                    <div class="function-actions">
                        <button class="btn-use" onclick="window.functionsMission.useFunction('${item.expression}')">Use</button>
                        <button class="btn-${isFavorite ? 'unfavorite' : 'favorite'}" onclick="window.functionsMission.toggleFunctionFavorite('${item.expression}')">
                            ${isFavorite ? '★' : '☆'}
                        </button>
                        <button class="btn-remove" onclick="window.functionsMission.removeFromHistory('${item.id}')">×</button>
                    </div>
                    <div style="font-size: 0.7rem; color: #6c757d; margin-left: 0.5rem;">${timeAgo}</div>
                </div>
            `;
        }).join('');
    }
    
    renderFunctionFavorites() {
        const favoritesList = document.getElementById('favoritesList');
        if (!favoritesList) return;
        
        if (this.functionFavorites.length === 0) {
            favoritesList.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 1rem;">No favorite functions yet.</div>';
            return;
        }
        
        favoritesList.innerHTML = this.functionFavorites.map(expression => {
            return `
                <div class="favorite-item">
                    <div class="function-text">f(x) = ${expression}</div>
                    <div class="function-actions">
                        <button class="btn-use" onclick="window.functionsMission.useFunction('${expression}')">Use</button>
                        <button class="btn-unfavorite" onclick="window.functionsMission.toggleFunctionFavorite('${expression}')">★</button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    useFunction(expression) {
        const ruleInput = document.getElementById('vaRule');
        if (ruleInput) {
            ruleInput.value = expression;
            this.updateVAFromRule();
            this.showNotification(`Loaded function: f(x) = ${expression}`, 'success');
        }
    }
    
    removeFromHistory(id) {
        this.functionHistory = this.functionHistory.filter(item => item.id !== id);
        this.saveFunctionHistory();
        this.renderFunctionHistory();
    }
    
    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return time.toLocaleDateString();
    }
    
    /* addFunctionComparison() {
        const vaCard = document.querySelector('.va-card:first-child');
        if (!vaCard || document.getElementById('functionComparison')) return;
        
        const comparison = document.createElement('div');
        comparison.id = 'functionComparison';
        comparison.className = 'function-comparison';
        comparison.innerHTML = `
            <h4><i class="fas fa-balance-scale"></i> Function Comparison</h4>
            <div class="comparison-controls">
                <div class="comparison-input">
                    <label>f(x) = </label>
                    <input type="text" id="compareRule1" placeholder="e.g., x^2" />
                </div>
                <div class="comparison-input">
                    <label>g(x) = </label>
                    <input type="text" id="compareRule2" placeholder="e.g., 2x+1" />
                </div>
                <button class="btn btn-primary btn-sm" id="compareFunctions">Compare</button>
            </div>
            <div class="comparison-results" id="comparisonResults"></div>
        `;
        
        vaCard.appendChild(comparison);
        
        // Add styles
        if (!document.querySelector('#comparison-styles')) {
            const style = document.createElement('style');
            style.id = 'comparison-styles';
            style.textContent = `
                .function-comparison { margin-top: 1rem; padding: 1rem; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 12px; }
                .function-comparison h4 { margin: 0 0 0.5rem 0; color: #2c3e50; display: flex; align-items: center; gap: 0.5rem; }
                .comparison-controls { display: flex; flex-direction: column; gap: 0.5rem; }
                .comparison-input { display: flex; align-items: center; gap: 0.5rem; }
                .comparison-input label { min-width: 40px; font-weight: 500; }
                .comparison-input input { flex: 1; padding: 0.4rem 0.6rem; border: 1px solid #e1e5ee; border-radius: 6px; }
                .comparison-results { margin-top: 0.5rem; padding: 0.5rem; background: #fff; border: 1px solid #e9ecef; border-radius: 8px; }
            `;
            document.head.appendChild(style);
        }
        
        // Bind comparison functionality
        document.getElementById('compareFunctions').addEventListener('click', () => {
            this.compareFunctions();
        });
    }
    
    compareFunctions() {
        const rule1 = document.getElementById('compareRule1').value.trim();
        const rule2 = document.getElementById('compareRule2').value.trim();
        const results = document.getElementById('comparisonResults');
        
        if (!rule1 || !rule2) {
            results.innerHTML = '<div style="color: #e74c3c;">Please enter both functions to compare.</div>';
            return;
        }
        
        try {
            // Validate both functions
            const val1 = this.safeParser.validateSyntax(rule1);
            const val2 = this.safeParser.validateSyntax(rule2);
            
            if (!val1.valid || !val2.valid) {
                results.innerHTML = `<div style="color: #e74c3c;">Invalid function(s): ${val1.error || val2.error}</div>`;
                return;
            }
            
            // Compare at specific points
            const testPoints = [-2, -1, 0, 1, 2];
            let comparison = '<div class="comparison-table">';
            comparison += '<div class="comparison-header"><strong>x</strong><strong>f(x)</strong><strong>g(x)</strong><strong>f(x) vs g(x)</strong></div>';
            
            testPoints.forEach(x => {
                try {
                    const y1 = this.safeParser.evalAt(rule1, x);
                    const y2 = this.safeParser.evalAt(rule2, x);
                    const comparison_text = y1 > y2 ? 'f(x) > g(x)' : y1 < y2 ? 'f(x) < g(x)' : 'f(x) = g(x)';
                    const color = y1 > y2 ? '#27ae60' : y1 < y2 ? '#e74c3c' : '#3498db';
                    
                    comparison += `<div class="comparison-row">`;
                    comparison += `<span>${x}</span>`;
                    comparison += `<span>${y1.toFixed(2)}</span>`;
                    comparison += `<span>${y2.toFixed(2)}</span>`;
                    comparison += `<span style="color: ${color};">${comparison_text}</span>`;
                    comparison += `</div>`;
                } catch (e) {
                    comparison += `<div class="comparison-row"><span>${x}</span><span>Error</span><span>Error</span><span>N/A</span></div>`;
                }
            });
            
            comparison += '</div>';
            results.innerHTML = comparison;
            
            // Add table styles
            if (!document.querySelector('#comparison-table-styles')) {
                const style = document.createElement('style');
                style.id = 'comparison-table-styles';
                style.textContent = `
                    .comparison-table { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.5rem; }
                    .comparison-header { font-weight: bold; padding: 0.5rem; background: #e9ecef; border-radius: 6px; }
                    .comparison-row { display: contents; }
                    .comparison-row span { padding: 0.4rem; background: #f8f9fa; border-radius: 4px; text-align: center; }
                `;
                document.head.appendChild(style);
            }
            
        } catch (error) {
            results.innerHTML = `<div style="color: #e74c3c;">Error comparing functions: ${error.message}</div>`;
        }
    } */

    updateVAFromRule() {
        const rule = document.getElementById('vaRule');
        if (!rule) return;
        
        const validation = this.safeParser.validateSyntax(rule.value);
        const msg = document.getElementById('vaRuleMsg');
        
        if (validation.valid) {
        try {
                // Test evaluation
            this.safeParser.evalAt(rule.value, 0);
            rule.classList.remove('error');
                if (msg) {
                    msg.textContent = 'Rule OK'; 
                    msg.className = 'va-msg success';
                }
                
                // Get domain restrictions
                const restrictions = this.safeParser.getDomainRestrictions(rule.value);
                this.showDomainInfo(restrictions);
                
            this.reseedVATable();
            this.runVAMachine();
            this.drawVAGraph();
                
                // Update function analysis
                this.updateFunctionAnalysis(rule.value);
                
                // Add to function history
                this.addToFunctionHistory(rule.value);
                
        } catch (e) {
            rule.classList.add('error');
                if (msg) {
                    msg.textContent = `Evaluation error: ${e.message}`; 
                    msg.className = 'va-msg error';
                }
            }
        } else {
            rule.classList.add('error');
            if (msg) {
                msg.textContent = `Syntax error: ${validation.error}`; 
                msg.className = 'va-msg error';
            }
        }
    }
    
    showDomainInfo(restrictions) {
        let domainInfo = document.getElementById('domainInfo');
        if (!domainInfo) {
            domainInfo = document.createElement('div');
            domainInfo.id = 'domainInfo';
            domainInfo.className = 'domain-info';
            const ruleRow = document.getElementById('vaRule').closest('.va-row');
            ruleRow.parentNode.insertBefore(domainInfo, ruleRow.nextSibling);
        }
        
        if (restrictions.length === 0) {
            domainInfo.innerHTML = '<div class="domain-item"><i class="fas fa-check-circle"></i> Domain: All real numbers</div>';
        } else {
            domainInfo.innerHTML = restrictions.map(r => 
                `<div class="domain-item"><i class="fas fa-exclamation-triangle"></i> ${r.description}</div>`
            ).join('');
        }
    }
    
    updateFunctionAnalysis(expression) {
        let analysisPanel = document.getElementById('functionAnalysis');
        if (!analysisPanel) {
            analysisPanel = document.createElement('div');
            analysisPanel.id = 'functionAnalysis';
            analysisPanel.className = 'function-analysis';
            const vaCard = document.querySelector('.va-card:last-child');
            if (vaCard) vaCard.appendChild(analysisPanel);
        }
        
        const analysis = this.analyzeFunction(expression);
        analysisPanel.innerHTML = `
            <h4><i class="fas fa-chart-line"></i> Function Analysis</h4>
            <div class="analysis-grid">
                <div class="analysis-item">
                    <strong>Type:</strong> ${analysis.type}
                </div>
                <div class="analysis-item">
                    <strong>Degree:</strong> ${analysis.degree}
                </div>
                <div class="analysis-item">
                    <strong>Symmetry:</strong> ${analysis.symmetry}
                </div>
                <div class="analysis-item">
                    <strong>Range:</strong> ${analysis.range}
                </div>
            </div>
        `;
    }
    
    analyzeFunction(expression) {
        const analysis = {
            type: 'Unknown',
            degree: 'N/A',
            symmetry: 'None',
            range: 'All real numbers'
        };
        
        // Determine function type
        if (expression.includes('sin') || expression.includes('cos') || expression.includes('tan')) {
            analysis.type = 'Trigonometric';
            analysis.range = '[-1, 1] (for sin/cos)';
        } else if (expression.includes('log') || expression.includes('ln')) {
            analysis.type = 'Logarithmic';
            analysis.range = 'All real numbers';
        } else if (expression.includes('sqrt')) {
            analysis.type = 'Radical';
            analysis.range = '[0, ∞)';
        } else if (expression.includes('^') || expression.includes('**')) {
            const degree = this.getPolynomialDegree(expression);
            analysis.type = 'Polynomial';
            analysis.degree = degree;
            if (degree === 1) {
                analysis.range = 'All real numbers';
            } else if (degree === 2) {
                analysis.range = 'Depends on leading coefficient';
            }
        } else if (expression.includes('x')) {
            analysis.type = 'Linear';
            analysis.degree = 1;
            analysis.range = 'All real numbers';
        } else {
            analysis.type = 'Constant';
            analysis.degree = 0;
        }
        
        // Check for symmetry
        if (this.isEvenFunction(expression)) {
            analysis.symmetry = 'Even (y-axis)';
        } else if (this.isOddFunction(expression)) {
            analysis.symmetry = 'Odd (origin)';
        }
        
        return analysis;
    }
    
    getPolynomialDegree(expression) {
        const matches = expression.match(/x\^?(\d+)/g);
        if (!matches) return 1;
        
        let maxDegree = 1;
        matches.forEach(match => {
            const degree = parseInt(match.split('^')[1]) || 1;
            maxDegree = Math.max(maxDegree, degree);
        });
        
        return maxDegree;
    }
    
    isEvenFunction(expression) {
        try {
            const testX = 2;
            const y1 = this.safeParser.evalAt(expression, testX);
            const y2 = this.safeParser.evalAt(expression, -testX);
            return Math.abs(y1 - y2) < 0.001;
        } catch {
            return false;
        }
    }
    
    isOddFunction(expression) {
        try {
            const testX = 2;
            const y1 = this.safeParser.evalAt(expression, testX);
            const y2 = this.safeParser.evalAt(expression, -testX);
            return Math.abs(y1 + y2) < 0.001;
        } catch {
            return false;
        }
    }

    runVAMachine() {
        const input = document.getElementById('vaInput');
        const rule = document.getElementById('vaRule');
        const out = document.getElementById('vaOutput');
        const gear = document.querySelector('.va-gear');
        if (!input || !rule || !out) return;
        try {
            const x = parseFloat(input.value);
            if (isNaN(x)) { out.textContent = '—'; return; }
            if (gear) gear.classList.add('spin');
            const y = this.safeParser.evalAt(rule.value, x);
            out.textContent = String(+y.toFixed(4));
            this.appendToMapping(x, y);
            if (gear) setTimeout(()=> gear.classList.remove('spin'), 400);
        } catch (e) {
            out.textContent = '—';
            if (gear) gear.classList.remove('spin');
        }
    }

    handleVATableSeed(e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        const tbody = document.querySelector('#vaTable tbody');
        if (!tbody) return;
        if (btn.hasAttribute('data-clear')) { tbody.innerHTML=''; document.getElementById('vaMapping').innerHTML=''; return; }
        const seed = parseFloat(btn.getAttribute('data-seed'));
        tbody.innerHTML = '';
        const start = isNaN(seed) ? 0 : seed;
        const end = start + 4;
        for (let x = start; x <= end; x++) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td contenteditable="true">${x}</td><td class="fx"></td>`;
            tbody.appendChild(tr);
        }
        this.recomputeVATable();
    }

    recomputeVATable() {
        const tbody = document.querySelector('#vaTable tbody');
        const rule = document.getElementById('vaRule');
        const mapping = document.getElementById('vaMapping');
        if (!tbody || !rule || !mapping) return;
        mapping.innerHTML = '';
        [...tbody.querySelectorAll('tr')].forEach(tr => {
            const xCell = tr.children[0];
            const fCell = tr.querySelector('.fx');
            const x = parseFloat((xCell.textContent || '').trim());
            if (isNaN(x)) { fCell.textContent = '—'; return; }
            try {
                const y = this.safeParser.evalAt(rule.value, x);
                fCell.textContent = String(+y.toFixed(4));
                this.appendChip(mapping, x, y);
            } catch (e) {
                fCell.textContent = '—';
            }
        });
    }

    appendToMapping(x, y) {
        const mapping = document.getElementById('vaMapping');
        if (!mapping) return;
        this.appendChip(mapping, x, y);
    }

    appendChip(container, x, y) {
        const chip = document.createElement('div');
        chip.className = 'map-chip';
        chip.textContent = `(${x}, ${+y.toFixed(3)})`;
        container.appendChild(chip);
    }

    reseedVATable() {
        const fillBtn = document.querySelector('.va-table-controls button[data-seed]');
        if (fillBtn) fillBtn.click();
    }

    drawVAGraph() {
        const canvas = document.getElementById('vaGraph');
        const rule = document.getElementById('vaRule');
        if (!canvas || !rule) return;
        
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        
        // Clear canvas with better performance
        ctx.clearRect(0, 0, W, H);
        
        // Enhanced grid system with adaptive scaling
        this.drawEnhancedGrid(ctx, W, H);
        
        // Enhanced axes with better styling
        this.drawEnhancedAxes(ctx, W, H);
        
        // Plot function with improved algorithm
        this.plotFunction(ctx, W, H, rule.value);
        
        // Add coordinate system labels
        this.drawCoordinateLabels(ctx, W, H);
    }
    
    drawEnhancedGrid(ctx, W, H) {
        const scale = this.vaScale || 30; // pixels per unit
        const centerX = W / 2;
        const centerY = H / 2;
        
        // Major grid lines (every unit)
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        
        // Vertical lines
        for (let x = centerX % scale; x <= W; x += scale) {
            ctx.beginPath();
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, H);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = centerY % scale; y <= H; y += scale) {
            ctx.beginPath();
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(W, y + 0.5);
            ctx.stroke();
        }
        
        // Minor grid lines (every 0.5 units)
        ctx.strokeStyle = '#f8f9fa';
        ctx.lineWidth = 0.5;
        
        for (let x = (centerX + scale/2) % scale; x <= W; x += scale) {
            ctx.beginPath();
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, H);
            ctx.stroke();
        }
        
        for (let y = (centerY + scale/2) % scale; y <= H; y += scale) {
            ctx.beginPath();
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(W, y + 0.5);
            ctx.stroke();
        }
    }
    
    drawEnhancedAxes(ctx, W, H) {
        const centerX = W / 2;
        const centerY = H / 2;
        
        // Main axes
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(0, centerY + 0.5);
        ctx.lineTo(W, centerY + 0.5);
        ctx.stroke();
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(centerX + 0.5, 0);
        ctx.lineTo(centerX + 0.5, H);
        ctx.stroke();
        
        // Arrow heads
        const arrowSize = 8;
        
        // X-axis arrow
        ctx.beginPath();
        ctx.moveTo(W - arrowSize, centerY - arrowSize/2);
        ctx.lineTo(W, centerY);
        ctx.lineTo(W - arrowSize, centerY + arrowSize/2);
        ctx.stroke();
        
        // Y-axis arrow
        ctx.beginPath();
        ctx.moveTo(centerX - arrowSize/2, arrowSize);
        ctx.lineTo(centerX, 0);
        ctx.lineTo(centerX + arrowSize/2, arrowSize);
        ctx.stroke();
    }
    
    drawCoordinateLabels(ctx, W, H) {
        const scale = this.vaScale || 30;
        const centerX = W / 2;
        const centerY = H / 2;
        
        ctx.fillStyle = '#6c757d';
        ctx.font = '11px Poppins, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // X-axis labels
        for (let t = -6; t <= 6; t++) {
            if (t === 0) continue;
            const px = centerX + t * scale;
            if (px >= 0 && px <= W) {
                // Tick mark
                ctx.strokeStyle = '#2c3e50';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(px, centerY - 4);
                ctx.lineTo(px, centerY + 4);
                ctx.stroke();
                
                // Label
                ctx.fillText(String(t), px, centerY + 8);
            }
        }
        
        // Y-axis labels
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        for (let t = -6; t <= 6; t++) {
            if (t === 0) continue;
            const py = centerY - t * scale;
            if (py >= 0 && py <= H) {
                // Tick mark
                ctx.strokeStyle = '#2c3e50';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(centerX - 4, py);
                ctx.lineTo(centerX + 4, py);
                ctx.stroke();
                
                // Label
                ctx.fillText(String(t), centerX - 8, py);
            }
        }
        
        // Origin label
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 12px Poppins, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('O', centerX + 4, centerY + 4);
    }
    
    plotFunction(ctx, W, H, expression) {
        if (!expression || !expression.trim()) return;
        
        const scale = 30;
        const centerX = W / 2;
        const centerY = H / 2;
        
        // Validate expression first
        const validation = this.safeParser.validateSyntax(expression);
        if (!validation.valid) {
            this.drawErrorIndicator(ctx, W, H, validation.error);
            return;
        }
        
        // Adaptive sampling for better performance and quality
        const samples = this.calculateOptimalSamples(W, expression);
        
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        
        // Plot with adaptive sampling
        ctx.beginPath();
        let firstPoint = true;
        let lastValidY = null;
        
        for (let i = 0; i < samples.length; i++) {
            const x = samples[i];
            let y;
            
            try {
                y = this.safeParser.evalAt(expression, x);
            } catch (error) {
                // Handle discontinuities
                if (firstPoint) continue;
                ctx.stroke();
                ctx.beginPath();
                firstPoint = true;
                lastValidY = null;
                continue;
            }
            
            const px = centerX + x * scale;
            const py = centerY - y * scale;
            
            // Check if point is within canvas bounds
            if (isFinite(py) && py >= -50 && py <= H + 50) {
                if (firstPoint) {
                    ctx.moveTo(px, py);
                    firstPoint = false;
                } else {
                    // Check for large jumps (discontinuities)
                    if (lastValidY !== null && Math.abs(py - lastValidY) > H) {
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(px, py);
                    } else {
                        ctx.lineTo(px, py);
                    }
                }
                lastValidY = py;
            } else if (!firstPoint) {
                // End current path if point is out of bounds
                ctx.stroke();
                ctx.beginPath();
                firstPoint = true;
                lastValidY = null;
            }
        }
        
        if (!firstPoint) {
            ctx.stroke();
        }
        
        // Add function label
        this.drawFunctionLabel(ctx, W, H, expression);
    }
    
    calculateOptimalSamples(width, expression) {
        // Adaptive sampling based on function complexity
        const baseSamples = width * 2; // 2 samples per pixel
        const samples = [];
        
        // Determine function complexity
        const complexity = this.assessFunctionComplexity(expression);
        const multiplier = Math.max(1, complexity / 2);
        const totalSamples = Math.min(baseSamples * multiplier, width * 4);
        
        const xMin = -width / 60; // -6 for 360px width
        const xMax = width / 60;  // 6 for 360px width
        
        for (let i = 0; i < totalSamples; i++) {
            const t = i / (totalSamples - 1);
            const x = xMin + t * (xMax - xMin);
            samples.push(x);
        }
        
        return samples;
    }
    
    assessFunctionComplexity(expression) {
        let complexity = 1;
        
        // Count trigonometric functions
        complexity += (expression.match(/sin|cos|tan/g) || []).length * 3;
        
        // Count logarithmic functions
        complexity += (expression.match(/log|ln/g) || []).length * 2;
        
        // Count square roots
        complexity += (expression.match(/sqrt/g) || []).length * 2;
        
        // Count powers
        complexity += (expression.match(/\^|\*\*/g) || []).length * 1.5;
        
        // Count divisions
        complexity += (expression.match(/\//g) || []).length * 2;
        
        return Math.max(1, complexity);
    }
    
    drawErrorIndicator(ctx, W, H, error) {
        ctx.fillStyle = '#e74c3c';
        ctx.font = '14px Poppins, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const lines = error.split(' ');
        const lineHeight = 18;
        const startY = H / 2 - (lines.length * lineHeight) / 2;
        
        lines.forEach((line, index) => {
            ctx.fillText(line, W / 2, startY + index * lineHeight);
        });
    }
    
    drawFunctionLabel(ctx, W, H, expression) {
        ctx.fillStyle = '#667eea';
        ctx.font = 'bold 12px Poppins, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        const label = `f(x) = ${expression}`;
        ctx.fillText(label, 10, 10);
    }

    handleVAMouseMove(e) {
        const canvas = e.currentTarget;
        const rule = document.getElementById('vaRule');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - canvas.width/2)/30;
        let y;
        try { y = this.safeParser.evalAt(rule.value, x); } catch(_) { y = NaN; }
        
        // Update coordinate display
        const coordsDisplay = document.getElementById('vaCoords');
        if (coordsDisplay) {
            coordsDisplay.textContent = isFinite(y) ? 
                `(${x.toFixed(2)}, ${y.toFixed(2)})` : 
                'undefined';
        }
        
        // Show crosshair on graph
        this.drawCrosshair(canvas, e.clientX - rect.left, e.clientY - rect.top, x, y);
        
        canvas.title = isFinite(y) ? `(${x.toFixed(2)}, ${y.toFixed(2)})` : 'undefined';
    }
    
    drawCrosshair(canvas, mouseX, mouseY, funcX, funcY) {
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        
        // Redraw the graph first
        this.drawVAGraph();
        
        // Draw crosshair
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        // Vertical line
        ctx.beginPath();
        ctx.moveTo(mouseX + 0.5, 0);
        ctx.lineTo(mouseX + 0.5, H);
        ctx.stroke();
        
        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(0, mouseY + 0.5);
        ctx.lineTo(W, mouseY + 0.5);
        ctx.stroke();
        
        // Point on function
        if (isFinite(funcY)) {
            const centerX = W / 2;
            const centerY = H / 2;
            const s = this.vaScale || 30;
            const pointX = centerX + funcX * s;
            const pointY = centerY - funcY * s;
            
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(pointX, pointY, 4, 0, 2 * Math.PI);
            ctx.fill();
            
            // Label
            ctx.fillStyle = '#2c3e50';
            ctx.font = '10px Poppins, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`(${funcX.toFixed(2)}, ${funcY.toFixed(2)})`, pointX + 6, pointY - 2);
        }
        
        ctx.setLineDash([]);
    }

    // CodeChum-like explainers: example -> try-it -> hint -> check
    renderExplainers() {
        const container = document.getElementById('codechumExplainers');
        if (!container) return;

        const explainers = [
            {
                title: 'Identify Domain from a Square Root Function',
                example: 'For f(x) = √(x - 2), values under the root must be non-negative: x - 2 ≥ 0 ⇒ x ≥ 2.',
                prompt: 'Enter the domain in inequality form (e.g., x ≥ 2):',
                answer: (val) => /^\s*x\s*[≥>=]\s*2\s*$/i.test(val.replace('>=', '≥')),
                hint: 'Set x - 2 ≥ 0 and solve for x.'
            },
            {
                title: 'Find Slope from Linear Function',
                example: 'In f(x) = mx + b, m is the slope. For f(x) = 3x + 5, slope is 3.',
                prompt: 'What is the slope of f(x) = -4x + 1?',
                answer: (val) => /^\s*-?4\s*$/.test(val) && parseFloat(val) === -4,
                hint: 'Match to f(x) = mx + b and read m.'
            },
            {
                title: 'Transformation: Vertical Stretch',
                example: 'Changing f(x) = x² to g(x) = 2x² makes the parabola steeper (vertical stretch).',
                prompt: 'Does multiplying by 0.5 make it steeper or wider? Type steeper or wider:',
                answer: (val) => /wider/i.test(val.trim()),
                hint: 'Multiplying by a between 0 and 1 compresses vertically → wider.'
            }
        ];

        container.innerHTML = '';
        explainers.forEach((ex, idx) => {
            const card = document.createElement('div');
            card.className = 'explainer-card';
            card.innerHTML = `
                <div class="explainer-header">
                    <h4>${idx + 1}. ${ex.title}</h4>
                </div>
                <div class="explainer-body">
                    <div class="explainer-example">
                        <strong>Example:</strong>
                        <p>${ex.example}</p>
                    </div>
                    <label class="explainer-prompt">${ex.prompt}</label>
                    <div class="explainer-input">
                        <input type="text" class="try-input" placeholder="Type your answer here" />
                        <button class="btn btn-secondary btn-sm hint-btn">Hint</button>
                        <button class="btn btn-primary btn-sm check-btn">Check</button>
                    </div>
                    <div class="explainer-feedback" aria-live="polite"></div>
                </div>`;

            const input = card.querySelector('.try-input');
            const hintBtn = card.querySelector('.hint-btn');
            const checkBtn = card.querySelector('.check-btn');
            const feedback = card.querySelector('.explainer-feedback');

            hintBtn.addEventListener('click', () => {
                feedback.textContent = ex.hint;
                feedback.className = 'explainer-feedback hint';
            });

            checkBtn.addEventListener('click', () => {
                const val = (input.value || '').trim();
                const correct = ex.answer(val);
                feedback.textContent = correct ? 'Correct! Great job.' : 'Not quite. Try again or click Hint.';
                feedback.className = 'explainer-feedback ' + (correct ? 'correct' : 'incorrect');
                if (correct) {
                    this.score++;
                    this.updateXP();
                }
            });

            container.appendChild(card);
        });

        // minimal styles injection to align with existing theme and engagement
        if (!document.querySelector('#explainers-style')) {
            const style = document.createElement('style');
            style.id = 'explainers-style';
            style.textContent = `
                .concept-explainers { margin-top: 1.5rem; display: grid; gap: 1rem; }
                .explainer-card { background: linear-gradient(145deg,#ffffff,#f7f8ff); border: 1px solid #e9ecef; border-radius: 16px; padding: 1rem; box-shadow: 0 12px 32px rgba(102,126,234,.18); transition: transform .15s ease }
                .explainer-card:hover { transform: translateY(-2px); }
                .explainer-header h4 { margin: 0 0 .5rem 0; color: #2c3e50; }
                .explainer-example { background: #f8f9ff; border: 1px dashed #667eea; padding: .75rem; border-radius: 8px; margin-bottom: .75rem; }
                .explainer-input { display: flex; gap: .5rem; margin-top: .5rem; }
                .explainer-input input { flex: 1; padding: .6rem .75rem; border: 1px solid #e1e5ee; border-radius: 8px; }
                .explainer-feedback { margin-top: .5rem; font-weight: 500; }
                .explainer-feedback.correct { color: #27ae60; }
                .explainer-feedback.incorrect { color: #e74c3c; }
                .explainer-feedback.hint { color: #856404; }
                #markLessonComplete { margin-right: .5rem; }
            `;
            document.head.appendChild(style);
        }
    }

    goToStep(stepName) {
        if (stepName !== 'concept' && !this.lessonCompleted) {
            this.showNotification('Please complete the lesson first to proceed.', 'warning');
            return;
        }
        // Update active step in navigation
        document.querySelectorAll('.mission-step').forEach(step => {
            step.classList.remove('active');
        });
        document.querySelector(`[data-step="${stepName}"]`).classList.add('active');

        // Update active content
        document.querySelectorAll('.mission-step-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(stepName).classList.add('active');

        this.currentStep = stepName;
        this.updateProgress();
        // Persist last viewed step to backend so returning students resume for review
        try {
            this.updateBackendProgress({ topic: 'functions', completed: stepName === 'reflection', best_score: undefined, last_step: stepName });
        } catch(_) {}

        // Push step-based progress to backend so Dashboard reflects live state
        try {
            const stepScores = { concept: 25, guided: 50, challenge: 75, reflection: 100 };
            const best = stepScores[stepName] || 0;
            const completed = stepName === 'reflection';
            // Avoid overriding a higher score if already completed by quiz
            this.updateBackendProgress({ topic: 'functions', completed, best_score: best });
            this.broadcastProgressUpdate();
        } catch(_) {}

        // Start/stop visible timer in Boss Challenge
        if (stepName === 'challenge') {
            this.startChallengeTimer();
        } else {
            this.stopChallengeTimer();
        }

        // Update final stats when going to reflection (if we have saved data)
        if (stepName === 'reflection' && this.userResponses && this.userResponses.length > 0) {
            this.updateFinalStats();
        }
    }

    updateProgress() {
        // Scope to mission header progress elements only
        const progressFill = document.querySelector('.mission-progress .progress-fill');
        const progressText = document.querySelector('.mission-progress .progress-text');
        
        if (!progressFill || !progressText) return;

        let progress = 0;
        if (this.lessonCompleted || this.reviewMode) {
            progress = 100;
            progressFill.style.width = progress + '%';
            progressText.textContent = progress + '% Complete';
            return;
        }
        switch(this.currentStep) {
            case 'concept':
                progress = 25;
                break;
            case 'guided':
                progress = 50;
                break;
            case 'challenge':
                progress = 75;
                break;
            case 'reflection':
                progress = 100;
                break;
        }
        
        progressFill.style.width = progress + '%';
        progressText.textContent = progress + '% Complete';
    }

    loadQuestion() {
        if (this.currentQuestion >= this.questions.length) return;

        const question = this.questions[this.currentQuestion];
        document.getElementById('questionTitle').textContent = question.title;
        document.getElementById('questionText').textContent = question.text;
        
        const optionsContainer = document.getElementById('questionOptions');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option-item';
            optionElement.innerHTML = `
                <div class="option-radio"></div>
                <span>${option.text}</span>
            `;
            
            optionElement.addEventListener('click', () => this.selectOption(index));
            optionsContainer.appendChild(optionElement);
        });

        // Update navigation buttons
        document.getElementById('previousQuestion').disabled = this.currentQuestion === 0;
        document.getElementById('nextQuestion').style.display = this.currentQuestion === this.questions.length - 1 ? 'none' : 'inline-flex';
        document.getElementById('finishChallenge').style.display = this.currentQuestion === this.questions.length - 1 ? 'inline-flex' : 'none';

        // If already answered, lock selection and show state
        if (this.answeredQuestions.has(this.currentQuestion)) {
            const resp = this.userResponses.find(r => r.index === this.currentQuestion);
            const options = optionsContainer.querySelectorAll('.option-item');
            if (resp && options[resp.selected] ) {
                options[resp.selected].classList.add('selected');
                options[resp.selected].classList.add(resp.correct ? 'correct' : 'incorrect');
            }
            optionsContainer.style.pointerEvents = 'none';
        } else {
            optionsContainer.style.pointerEvents = '';
        }
    }

    selectOption(optionIndex) {
        if (this.reviewMode) return;
        const question = this.questions[this.currentQuestion];
        const options = document.querySelectorAll('.option-item');
        // Enforce one answer per question
        if (this.answeredQuestions.has(this.currentQuestion)) {
            return;
        }
        
        // Remove previous selections
        options.forEach(option => {
            option.classList.remove('selected', 'correct', 'incorrect');
        });
        
        // Mark selected option
        options[optionIndex].classList.add('selected');
        
        // Check if correct
        const isCorrect = !!question.options[optionIndex].correct;
        if (isCorrect) {
            options[optionIndex].classList.add('correct');
            this.score++;
            this.showNotification('Correct! +10 XP', 'success');
        } else {
            options[optionIndex].classList.add('incorrect');
            this.showNotification('Incorrect. Try again!', 'error');
            if (!this.incorrectQuestions.includes(this.currentQuestion)) {
                this.incorrectQuestions.push(this.currentQuestion);
            }
        }
        // Record response and lock further changes for this question
        const correctIndex = question.options.findIndex(o => o.correct);
        this.userResponses = this.userResponses.filter(r => r.index !== this.currentQuestion);
        this.userResponses.push({
            index: this.currentQuestion,
            selected: optionIndex,
            correct: isCorrect,
            correctIndex,
            questionText: question.text,
            explanation: question.explanation
        });
        this.answeredQuestions.add(this.currentQuestion);
        const optionsContainer = document.getElementById('questionOptions');
        if (optionsContainer) optionsContainer.style.pointerEvents = 'none';
        
        // Show feedback reflecting correctness
        this.showFeedback(isCorrect);
        
        // Update XP display
        this.updateXP();
    }

    showFeedback(isCorrect) {
        const question = this.questions[this.currentQuestion];
        const feedback = document.getElementById('questionFeedback');
        const feedbackText = document.getElementById('feedbackText');
        const explanationText = document.getElementById('explanationText');
        if (!feedback || !feedbackText || !explanationText) return;

        const iconEl = feedback.querySelector('.feedback-content i');
        const titleEl = feedback.querySelector('.feedback-content h4');

        if (isCorrect) {
            if (iconEl) { iconEl.classList.remove('fa-times-circle'); iconEl.classList.add('fa-check-circle'); iconEl.style.color = '#27ae60'; }
            if (titleEl) { titleEl.textContent = 'Correct!'; titleEl.style.color = '#27ae60'; }
            feedbackText.textContent = 'Great job! You understand this concept.';
            feedback.style.borderLeftColor = '#27ae60';
        } else {
            if (iconEl) { iconEl.classList.remove('fa-check-circle'); iconEl.classList.add('fa-times-circle'); iconEl.style.color = '#e74c3c'; }
            if (titleEl) { titleEl.textContent = 'Incorrect'; titleEl.style.color = '#e74c3c'; }
            feedbackText.textContent = 'Not quite right. See the explanation below and try the next one.';
            feedback.style.borderLeftColor = '#e74c3c';
        }

            explanationText.textContent = question.explanation;
            feedback.style.display = 'block';
    }

    updateXP() {
        const xpDisplay = document.getElementById('currentXP');
        if (xpDisplay) {
            xpDisplay.textContent = this.score * 10;
        }
    }

    nextQuestion() {
        if (this.currentQuestion < this.questions.length - 1) {
            this.currentQuestion++;
            this.loadQuestion();
            this.hideFeedback();
        }
    }

    previousQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.loadQuestion();
            this.hideFeedback();
        }
    }

    hideFeedback() {
        const feedback = document.getElementById('questionFeedback');
        if (feedback) {
            feedback.style.display = 'none';
        }
    }

    finishChallenge() {
        if (this.reviewMode || this.hasSavedAttempt) {
            return;
        }
        const minCorrect = 3;
        if (this.score < minCorrect) {
            this.showNotification(`Try to get at least ${minCorrect}/${this.questions.length} correct. Review Guided Play for a hint.`, 'warning');
            return;
        }
        this.goToStep('reflection');
        this.updateFinalStats();
        this.stopChallengeTimer();
        // Persist topic completion and best score approximation
        const bestScore = Math.round((this.score / this.questions.length) * 100);
        this.updateBackendProgress({ topic: 'functions', completed: true, best_score: bestScore });
        try { this.updateBackendProgress({ topic: 'functions', completed: true, best_score: bestScore, last_step: 'reflection' }); } catch(_) {}
        // Save quiz attempt (with per-question answers)
        const elapsedSec = Math.floor((Date.now() - this.startTime) / 1000);
        const timeMin = Math.max(1, Math.round(elapsedSec / 60));
        fetch('../php/progress.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                action: 'save_quiz_attempt',
                topic: 'functions',
                quiz_title: 'Functions Basics Quiz',
                score: this.score,
                total_questions: this.questions.length,
                time_taken_minutes: timeMin,
                answers: this.userResponses.map(r => ({ index: r.index, selected: r.selected, correct: !!r.correct }))
            })
        }).catch(() => {});
        this.hasSavedAttempt = true;
        this.reviewMode = true;
        try { window.topicsManager?.updateMissionProgress('functions', 100, true); window.topicsManager?.unlockNextMission('functions'); } catch(_) {}
    }

    updateFinalStats() {
        const finalScore = document.getElementById('finalScore');
        const totalXP = document.getElementById('totalXP');
        const completionTime = document.getElementById('completionTime');
        const learningListContainer = document.querySelector('.learning-summary ul');
        const summaryContainer = document.querySelector('#reflection .mission-summary');
        
        if (finalScore) {
            finalScore.textContent = `${this.score}/${this.questions.length}`;
        }
        
        if (totalXP) {
            totalXP.textContent = this.score * 10;
        }
        
        if (completionTime) {
            const timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(timeElapsed / 60);
            const seconds = timeElapsed % 60;
            completionTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        // Tailored learning summary based on incorrect questions
        if (learningListContainer) {
            const items = [];
            const incorrectSet = new Set(this.incorrectQuestions);
            if (incorrectSet.has(0)) items.push('Revisit: Domain restrictions for square roots (x ≥ 2 for √(x−2)).');
            if (incorrectSet.has(1)) items.push('Remember: In f(x)=mx+b, m is slope, b is y-intercept.');
            if (incorrectSet.has(2)) items.push('Y-intercept is b in f(x)=mx+b; reads at x=0.');
            if (incorrectSet.has(3)) items.push('Horizontal lines have slope 0: f(x)=b.');
            if (incorrectSet.has(4)) items.push('Multiplying x² by a>1 stretches vertically (steeper).');
            if (items.length === 0) items.push('Great work! You mastered the key concepts.');
            learningListContainer.innerHTML = items.map(t => `<li>${t}</li>`).join('');
        }

        // Detailed quiz review (right/wrong per question)
        if (summaryContainer) {
            let review = document.getElementById('quizReview');
            if (!review) {
                review = document.createElement('div');
                review.id = 'quizReview';
                review.style.marginTop = '1.5rem';
                review.style.borderTop = '2px solid #e9ecef';
                review.style.paddingTop = '1rem';
                summaryContainer.appendChild(review);
            }
            const rows = this.userResponses
                .sort((a,b) => a.index - b.index)
                .map(r => {
                    const q = this.questions[r.index];
                    const correctText = q.options[r.correctIndex]?.text || '';
                    const chosenText = q.options[r.selected]?.text || '';
                    return `
                        <div style="background:#f8f9fa;border:1px solid #e9ecef;border-radius:10px;padding:0.75rem;margin-bottom:0.5rem">
                            <div style="font-weight:600;color:${r.correct ? '#27ae60' : '#e74c3c'}">${r.correct ? 'Correct' : 'Incorrect'} — Q${r.index+1}: ${q.title}</div>
                            <div style="margin-top:0.25rem;color:#2c3e50">Your answer: ${chosenText}</div>
                            <div style="color:#2c3e50">Correct answer: ${correctText}</div>
                            <div style="margin-top:0.25rem;color:#6c757d">Explanation: ${q.explanation}</div>
                        </div>
                    `;
                }).join('');
            review.innerHTML = `<h3 style="margin:0 0 .5rem 0;color:#2c3e50">Quiz Review</h3>${rows}`;
        }
    }

    async recordTopicVisit(topic) {
        try {
            await fetch('../php/progress.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ action: 'record_visit', topic })
            });
        } catch (_) { /* no-op */ }
    }

    async updateBackendProgress(payload) {
        try {
            await fetch('../php/progress.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ action: 'update_progress', ...payload })
            });
        } catch (_) { /* no-op */ }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Add icon based on type
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="${icons[type] || icons.info}"></i>
                </div>
                <div class="notification-body">
                <span class="notification-message">${message}</span>
                </div>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Add enhanced styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
            color: white;
            padding: 0;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            z-index: 1000;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
            overflow: hidden;
        `;
        
        // Add content styles
        const content = notification.querySelector('.notification-content');
        content.style.cssText = `
            display: flex;
            align-items: center;
            padding: 1rem;
            gap: 0.75rem;
        `;
        
        const icon = notification.querySelector('.notification-icon');
        icon.style.cssText = `
            font-size: 1.2rem;
            opacity: 0.9;
        `;
        
        const body = notification.querySelector('.notification-body');
        body.style.cssText = `
            flex: 1;
        `;
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s;
        `;
        
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.backgroundColor = 'rgba(255,255,255,0.2)';
        });
        
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.backgroundColor = 'transparent';
        });
        
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 4000);
        
        // Add to page
        document.body.appendChild(notification);
        
        // Add animation styles if not already present
        if (!document.querySelector('#notification-animations')) {
            const style = document.createElement('style');
            style.id = 'notification-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Initialize the mission when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.functionsMission = new FunctionsMission();
});
