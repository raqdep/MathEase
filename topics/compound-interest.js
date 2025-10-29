// Compound Interest Topic Logic (extracted from HTML)

// Compound Interest Calculator
function calculateCompoundInterest() {
    const principal = parseFloat(document.getElementById('principal')?.value) || 0;
    const rate = parseFloat(document.getElementById('rate')?.value) || 0;
    const time = parseFloat(document.getElementById('time')?.value) || 0;
    const frequency = parseInt(document.getElementById('frequency')?.value) || 1;

    const r = rate / 100;
    const amount = principal * Math.pow(1 + r / frequency, frequency * time);
    const interest = amount - principal;

    const amountEl = document.getElementById('compoundAmountResult');
    const interestEl = document.getElementById('compoundInterestResult');
    const formulaEl = document.getElementById('calculationFormula');
    if (amountEl) amountEl.textContent = '₱ ' + amount.toFixed(2);
    if (interestEl) interestEl.textContent = '₱ ' + interest.toFixed(2);
    if (formulaEl) formulaEl.textContent = `A = ₱${principal}(1 + ${r.toFixed(3)}/${frequency})^(${frequency}×${time})`;

    // Update year-by-year amounts (first 3 years)
    const year1 = principal * Math.pow(1 + r / frequency, frequency * 1);
    const year2 = principal * Math.pow(1 + r / frequency, frequency * 2);
    const year3 = principal * Math.pow(1 + r / frequency, frequency * 3);
    const y1 = document.getElementById('year1Amount');
    const y2 = document.getElementById('year2Amount');
    const y3 = document.getElementById('year3Amount');
    if (y1) y1.textContent = '₱' + year1.toFixed(0);
    if (y2) y2.textContent = '₱' + year2.toFixed(0);
    if (y3) y3.textContent = '₱' + year3.toFixed(0);
}

// Lesson navigation + completion (localStorage-based)
let currentLesson = 1;
const totalLessons = 5;
let completedLessons = new Set(JSON.parse(localStorage.getItem('ci_completed_lessons') || '[]'));

function saveCompleted() {
    localStorage.setItem('ci_completed_lessons', JSON.stringify(Array.from(completedLessons)));
}

function setCompleteButtonState(lessonNum) {
    const sec = document.getElementById(`lesson${lessonNum}`);
    if (!sec) return;
    const btn = sec.querySelector('button[onclick="completeLesson(' + lessonNum + ')"]');
    if (!btn) return;
    if (completedLessons.has(lessonNum)) {
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

function updateLessonCompletionStatus() {
    document.querySelectorAll('.lesson-nav-btn').forEach(btn => {
        const n = parseInt(btn.dataset.lesson);
        const icon = btn.querySelector('.w-16');
        if (!icon) return;
        if (completedLessons.has(n)) {
            icon.innerHTML = '<i class="fas fa-check text-lg"></i>';
            icon.classList.remove('bg-gray-300', 'text-gray-600');
            icon.classList.add('bg-green-500', 'text-white');
        } else {
            if (n === currentLesson) {
                icon.innerHTML = icon.innerHTML || '<i class="fas fa-book-open text-2xl"></i>';
                icon.classList.remove('bg-gray-300', 'text-gray-600', 'bg-green-500');
                icon.classList.add('bg-primary', 'text-white');
            } else {
                icon.classList.remove('bg-primary', 'text-white', 'bg-green-500');
                icon.classList.add('bg-gray-300', 'text-gray-600');
            }
        }
    });
}

function updateControlsForActiveSection() {
    const sec = document.querySelector('.lesson-section.active');
    if (!sec) return;
    const prev = sec.querySelector('#prevLessonBtn');
    const next = sec.querySelector('#nextLessonBtn');
    const num = sec.querySelector('#currentLessonNum');
    const bar = sec.querySelector('#lessonProgressBar');
    if (prev) prev.disabled = currentLesson <= 1;
    if (next) next.disabled = currentLesson >= totalLessons;
    if (num) num.textContent = String(currentLesson);
    if (bar) bar.style.width = ((currentLesson / totalLessons) * 100) + '%';
}

function showLesson(lessonNum) {
    currentLesson = lessonNum;
    document.querySelectorAll('.lesson-section').forEach(s => s.classList.remove('active'));
    const act = document.getElementById(`lesson${lessonNum}`);
    if (act) act.classList.add('active');
    updateControlsForActiveSection();
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
    for (let i = 1; i <= totalLessons; i++) { setCompleteButtonState(i); }
    updateLessonCompletionStatus();
}

function navigateLesson(dir) {
    const next = currentLesson + dir;
    if (next >= 1 && next <= totalLessons) showLesson(next);
}

function completeLesson(lessonNum) {
    completedLessons.add(lessonNum);
    saveCompleted();
    setCompleteButtonState(lessonNum);
    updateLessonCompletionStatus();
    if (lessonNum < totalLessons) navigateLesson(1);
}

function showTopicOverview() {
    Swal.fire({
        title: 'Compound Interest Overview',
        html: `
            <div class="text-left">
                <p class="mb-4"><strong>Compound Interest</strong> is interest calculated on the initial principal and the accumulated interest of previous periods.</p>
                <p class="mb-4"><strong>Formula:</strong> A = P(1 + r/n)^(nt)</p>
                <p class="mb-4">Where:</p>
                <ul class="list-disc list-inside mb-4 space-y-1">
                    <li>A = Final amount</li>
                    <li>P = Principal (initial amount)</li>
                    <li>r = Annual interest rate (decimal)</li>
                    <li>n = Number of times interest is compounded per year</li>
                    <li>t = Time in years</li>
                </ul>
                <p class="mb-2"><strong>Key Difference:</strong> Compound interest grows exponentially, while simple interest grows linearly.</p>
                <p>This topic covers 5 comprehensive lessons aligned with DepEd MELCs 2025-2026.</p>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'Start Learning',
        confirmButtonColor: '#8b5cf6',
        background: '#ffffff',
        customClass: {
            popup: 'rounded-2xl',
            title: 'text-slate-800',
            content: 'text-slate-600'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            showLesson(1);
        }
    });
}

// Wire up events and initialize
document.querySelectorAll('.lesson-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showLesson(parseInt(btn.dataset.lesson)));
});

showLesson(1);
calculateCompoundInterest();

// Load user
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


