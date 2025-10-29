// Topic logic for Interest, Maturity, Future, and Present Values (Simple & Compound)

let sc_currentLesson = 1;
const sc_totalLessons = 5;
let sc_completedLessons = new Set(JSON.parse(localStorage.getItem('sc_completed_lessons') || '[]'));

function sc_saveCompleted() {
    localStorage.setItem('sc_completed_lessons', JSON.stringify(Array.from(sc_completedLessons)));
}

function sc_setCompleteButtonState(lessonNum) {
    const sec = document.getElementById(`lesson${lessonNum}`);
    if (!sec) return;
    const btn = sec.querySelector('button[onclick="completeLesson(' + lessonNum + ')"]');
    if (!btn) return;
    if (sc_completedLessons.has(lessonNum)) {
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

function sc_updateControlsForActiveSection() {
    const sec = document.querySelector('.lesson-section.active');
    if (!sec) return;
    const prev = sec.querySelector('#prevLessonBtn');
    const next = sec.querySelector('#nextLessonBtn');
    const num = sec.querySelector('#currentLessonNum');
    const bar = sec.querySelector('#lessonProgressBar');
    if (prev) prev.disabled = sc_currentLesson <= 1;
    if (next) next.disabled = sc_currentLesson >= sc_totalLessons;
    if (num) num.textContent = String(sc_currentLesson);
    if (bar) bar.style.width = ((sc_currentLesson / sc_totalLessons) * 100) + '%';
}

function showLesson(lessonNum) {
    sc_currentLesson = lessonNum;
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

    for (let i = 1; i <= sc_totalLessons; i++) { sc_setCompleteButtonState(i); }
    sc_updateControlsForActiveSection();
}

function navigateLesson(dir) {
    const next = sc_currentLesson + dir;
    if (next >= 1 && next <= sc_totalLessons) showLesson(next);
}

function completeLesson(lessonNum) {
    sc_completedLessons.add(lessonNum);
    sc_saveCompleted();
    sc_setCompleteButtonState(lessonNum);
    if (lessonNum < sc_totalLessons) navigateLesson(1);
}

function showTopicOverview() {
    Swal.fire({
        title: 'Topic Overview',
        html: `
            <div class="text-left">
                <p class="mb-2"><strong>Simple Interest:</strong> Is = Prt, F = P(1+rt) = P + Is</p>
                <p class="mb-2"><strong>Compound Interest:</strong> F = P(1 + r/n)^(nt), Ic = F − P</p>
                <p class="mb-2"><strong>Present Value:</strong> P = F / (1 + r/n)^(nt)</p>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'Start',
        confirmButtonColor: '#8b5cf6',
        background: '#ffffff',
        customClass: { popup: 'rounded-2xl', title: 'text-slate-800', content: 'text-slate-600' }
    }).then((result) => { if (result.isConfirmed) { showLesson(1); } });
}

// Simple Interest calculator
function calculateSimpleInterest() {
    const P = parseFloat(document.getElementById('siP')?.value) || 0;
    const rPct = parseFloat(document.getElementById('siR')?.value) || 0;
    const t = parseFloat(document.getElementById('siT')?.value) || 0;
    const r = rPct / 100;
    const Is = P * r * t;
    const F = P + Is;

    const siInterest = document.getElementById('siInterest');
    const siFuture = document.getElementById('siFuture');
    const siExample = document.getElementById('siExample');
    if (siInterest) siInterest.textContent = '₱ ' + Is.toFixed(2);
    if (siFuture) siFuture.textContent = '₱ ' + F.toFixed(2);
    if (siExample) siExample.textContent = `Is = ${P}×${r.toFixed(3)}×${t} = ${(Is).toFixed(2)} → F = ${(F).toFixed(2)}`;
}

// Compound interactive
function calculateCompoundInteractive() {
    const P = parseFloat(document.getElementById('ciP')?.value) || 0;
    const rPct = parseFloat(document.getElementById('ciR')?.value) || 0;
    const t = parseFloat(document.getElementById('ciT')?.value) || 0;
    const n = parseInt(document.getElementById('ciN')?.value) || 1;
    const r = rPct / 100;
    const F = P * Math.pow(1 + r / n, n * t);
    const Ic = F - P;

    const fEl = document.getElementById('ciF');
    const iEl = document.getElementById('ciIc');
    const formula = document.getElementById('ciFormula');
    if (fEl) fEl.textContent = '₱ ' + F.toFixed(2);
    if (iEl) iEl.textContent = '₱ ' + Ic.toFixed(2);
    if (formula) formula.textContent = `F = ${P}(1 + ${(r).toFixed(4)}/${n})^(${n}×${t})`;
}

function computePVFromF() {
    const F = parseFloat(document.getElementById('pvF')?.value) || 0;
    const rPct = parseFloat(document.getElementById('ciR')?.value) || 0;
    const t = parseFloat(document.getElementById('ciT')?.value) || 0;
    const n = parseInt(document.getElementById('ciN')?.value) || 1;
    const r = rPct / 100;
    const PV = F / Math.pow(1 + r / n, n * t);
    const pvEl = document.getElementById('ciPV');
    if (pvEl) pvEl.textContent = '₱ ' + PV.toFixed(2);
}

// Initialize
document.querySelectorAll('.lesson-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showLesson(parseInt(btn.dataset.lesson)));
});

showLesson(1);
calculateSimpleInterest();
calculateCompoundInteractive();

// Load user name
document.addEventListener('DOMContentLoaded', function () {
    fetch('../php/user.php', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.user) {
                const nameEl = document.getElementById('userName');
                if (nameEl) nameEl.textContent = data.user.first_name;
            }
        })
        .catch(() => {});
});


