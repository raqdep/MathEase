// Lesson navigation and completion (mirrors operations-on-functions behavior)
let sip_currentLesson = 1;
const sip_totalLessons = 5;
let sip_completedLessons = new Set(JSON.parse(localStorage.getItem('sip_completed_lessons') || '[]'));

function sip_saveCompleted() {
    localStorage.setItem('sip_completed_lessons', JSON.stringify(Array.from(sip_completedLessons)));
}

function sip_setCompleteButtonState(lessonNum) {
    const sec = document.getElementById(`lesson${lessonNum}`);
    if (!sec) return;
    const btn = sec.querySelector('button[onclick="sip_completeLesson(' + lessonNum + ')"]');
    if (!btn) return;
    if (sip_completedLessons.has(lessonNum)) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-check mr-2"></i>Completed';
        btn.classList.remove('bg-emerald-500', 'hover:bg-emerald-600');
        btn.classList.add('bg-gray-400');
    } else {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check mr-2"></i>Mark as Complete';
        btn.classList.add('bg-emerald-500');
        btn.classList.remove('bg-gray-400');
    }
}

function sip_updateControls() {
    const sec = document.querySelector('.lesson-section.active');
    if (!sec) return;
    const prev = sec.querySelector('#prevLessonBtn');
    const next = sec.querySelector('#nextLessonBtn');
    const num = sec.querySelector('#currentLessonNum');
    const bar = sec.querySelector('#lessonProgressBar');
    if (prev) prev.disabled = sip_currentLesson <= 1;
    if (next) next.disabled = sip_currentLesson >= sip_totalLessons;
    if (num) num.textContent = String(sip_currentLesson);
    if (bar) bar.style.width = ((sip_currentLesson / sip_totalLessons) * 100) + '%';
}

function sip_showLesson(lessonNum) {
    sip_currentLesson = lessonNum;
    document.querySelectorAll('.lesson-section').forEach(s => s.classList.remove('active'));
    const act = document.getElementById(`lesson${lessonNum}`);
    if (act) act.classList.add('active');

    document.querySelectorAll('.lesson-nav-btn').forEach(btn => {
        const n = parseInt(btn.dataset.lesson);
        const icon = btn.querySelector('.w-16');
        btn.classList.remove('border-primary', 'bg-primary');
        btn.classList.add('border-transparent');
        icon?.classList.remove('bg-primary', 'text-white');
        icon?.classList.add('bg-gray-300', 'text-gray-600');
        if (n === lessonNum) {
            btn.classList.add('border-primary', 'bg-primary');
            btn.classList.remove('border-transparent');
            icon?.classList.add('bg-primary', 'text-white');
            icon?.classList.remove('bg-gray-300', 'text-gray-600');
        }
    });

    for (let i = 1; i <= sip_totalLessons; i++) { sip_setCompleteButtonState(i); }
    sip_updateControls();
}

function sip_navigateLesson(dir) {
    const next = sip_currentLesson + dir;
    if (next >= 1 && next <= sip_totalLessons) sip_showLesson(next);
}

function sip_completeLesson(lessonNum) {
    sip_completedLessons.add(lessonNum);
    sip_saveCompleted();
    sip_setCompleteButtonState(lessonNum);
    if (lessonNum < sip_totalLessons) sip_navigateLesson(1);
}

// Simple interest solver
function sip_calculateSimpleInterest() {
    const P = parseFloat(document.getElementById('sip_siP')?.value) || 0;
    const rPct = parseFloat(document.getElementById('sip_siR')?.value) || 0;
    const t = parseFloat(document.getElementById('sip_siT')?.value) || 0;
    const r = rPct / 100;
    const Is = P * r * t;
    const F = P + Is;
    const isEl = document.getElementById('sip_siIs');
    const fEl = document.getElementById('sip_siF');
    if (isEl) isEl.textContent = '₱ ' + Is.toFixed(2);
    if (fEl) fEl.textContent = '₱ ' + F.toFixed(2);
}

// Simple interest relations
function sip_solveSimpleRelations() {
    const IsInput = parseFloat(document.getElementById('sip_is')?.value) || 0;
    let P = parseFloat(document.getElementById('sip_p')?.value) || 0;
    const rPct = parseFloat(document.getElementById('sip_r')?.value) || 0;
    const t = parseFloat(document.getElementById('sip_t')?.value) || 0;
    const r = rPct / 100;

    let Is = IsInput > 0 ? IsInput : P * r * t;
    let F = P + Is;

    const isEl = document.getElementById('sip_rel_is');
    const pEl = document.getElementById('sip_rel_p');
    const rtEl = document.getElementById('sip_rel_rt');
    const fEl = document.getElementById('sip_rel_f');
    if (isEl) isEl.textContent = '₱ ' + Is.toFixed(2);
    if (fEl) fEl.textContent = '₱ ' + F.toFixed(2);

    // If P is missing but F and Is provided, compute P = F - Is
    if (!P && IsInput > 0) {
        P = F - Is;
    }
    if (pEl) pEl.textContent = '₱ ' + (P || 0).toFixed(2);

    // Show r or t if one of them is missing and enough info exists
    let rtText = '–';
    if (P > 0 && Is > 0) {
        if (r > 0 && t > 0) {
            rtText = `r = ${(r).toFixed(3)}, t = ${t}`;
        } else if (r > 0 && t === 0) {
            const tSolved = Is / (P * r);
            rtText = `t = ${tSolved.toFixed(3)} year(s)`;
        } else if (t > 0 && r === 0) {
            const rSolved = Is / (P * t);
            rtText = `r = ${(rSolved * 100).toFixed(2)}%`;
        }
    }
    if (rtEl) rtEl.textContent = rtText;
}

// Compound interest solver
function sip_calculateCompound() {
    const P = parseFloat(document.getElementById('sip_ciP')?.value) || 0;
    const rPct = parseFloat(document.getElementById('sip_ciR')?.value) || 0;
    const t = parseFloat(document.getElementById('sip_ciT')?.value) || 0;
    const n = parseInt(document.getElementById('sip_ciN')?.value) || 1;
    const r = rPct / 100;
    const F = P * Math.pow(1 + r / n, n * t);
    const Ic = F - P;
    const fEl = document.getElementById('sip_ciF');
    const iEl = document.getElementById('sip_ciIc');
    if (fEl) fEl.textContent = '₱ ' + F.toFixed(2);
    if (iEl) iEl.textContent = '₱ ' + Ic.toFixed(2);
}

function sip_computePVFromF() {
    const F = parseFloat(document.getElementById('sip_ciFInput')?.value) || 0;
    const rPct = parseFloat(document.getElementById('sip_ciR')?.value) || 0;
    const t = parseFloat(document.getElementById('sip_ciT')?.value) || 0;
    const n = parseInt(document.getElementById('sip_ciN')?.value) || 1;
    const r = rPct / 100;
    const PV = F / Math.pow(1 + r / n, n * t);
    const pvEl = document.getElementById('sip_ciPV');
    if (pvEl) pvEl.textContent = '₱ ' + PV.toFixed(2);
}

// Wire up
document.querySelectorAll('.lesson-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => sip_showLesson(parseInt(btn.dataset.lesson)));
});

sip_showLesson(1);
sip_calculateSimpleInterest();
sip_calculateCompound();


