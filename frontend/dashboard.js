/**
 * Dashboard Page – Render Analysis Results
 * Reads data from sessionStorage (set after upload) or
 * fetches from /api/history/:id if ?id= param is present.
 */
(function () {
    const emptyState = document.getElementById('emptyState');
    const content    = document.getElementById('dashboardContent');
    if (!emptyState || !content) return;

    const params = new URLSearchParams(window.location.search);
    const historyId = params.get('id');

    if (historyId) {
        // Loaded from History page — fetch from API
        fetchAndRender(historyId);
    } else {
        // Fresh upload — use sessionStorage
        const raw = sessionStorage.getItem('resumeResult');
        if (!raw) {
            showEmpty(); return;
        }
        renderDashboard(JSON.parse(raw));
    }

    // ── Data Fetching ────────────────────────────────────────────

    async function fetchAndRender(id) {
        try {
            const res = await fetch(`/api/history/${id}`);
            if (!res.ok) { showEmpty(); return; }
            const data = await res.json();
            renderDashboard(data);
        } catch {
            showEmpty();
        }
    }

    function showEmpty() {
        emptyState.style.display = '';
        content.style.display = 'none';
    }

    // ── Main Render ──────────────────────────────────────────────

    function renderDashboard(data) {
        emptyState.style.display = 'none';
        content.style.display    = '';

        // Profile
        setText('dashFilename', data.filename || 'resume.pdf');
        setText('profileName',  data.name    || '—');
        setText('profileEmail', data.email   ? `✉ ${data.email}` : '');
        setText('profilePhone', data.phone   ? `☎ ${data.phone}` : '');
        const avatar = document.getElementById('profileAvatar');
        if (data.name && data.name !== 'Unknown') {
            avatar.textContent = data.name.charAt(0).toUpperCase();
        }

        // Score Ring
        const score    = data.score?.total_score ?? 0;
        const scoreRing  = document.getElementById('scoreRingFill');
        const scoreValue = document.getElementById('scoreValue');
        const svg = scoreRing.closest('svg');
        injectSvgGradient(svg);

        const circumference = 2 * Math.PI * 85;
        const offset = circumference - (score / 100) * circumference;
        setTimeout(() => { scoreRing.style.strokeDashoffset = offset; }, 300);
        animateNumber(scoreValue, 0, score, 1500);

        // Score breakdown
        const breakdown = data.score?.breakdown ?? {};
        const labels = {
            contact_info: '📧 Contact Info',
            skills:       '🛠️ Skills',
            experience:   '💼 Experience',
            education:    '🎓 Education',
            quality:      '✨ Quality',
        };
        document.getElementById('scoreBreakdown').innerHTML =
            Object.entries(breakdown).map(([key, val]) => {
                const pct = (val.score / val.max) * 100;
                return `
                <div class="breakdown-row">
                    <span class="breakdown-label">${labels[key] || key}</span>
                    <div class="breakdown-bar">
                        <div class="breakdown-bar-fill" style="width:0%" data-width="${pct}%"></div>
                    </div>
                    <span class="breakdown-value">${val.score}/${val.max}</span>
                </div>`;
            }).join('');
        setTimeout(() => {
            document.querySelectorAll('.breakdown-bar-fill').forEach(b => { b.style.width = b.dataset.width; });
        }, 500);

        // Skills
        const skills = data.skills || [];
        setText('skillsCount', `${skills.length} skill${skills.length !== 1 ? 's' : ''} detected`);
        const tagColors = ['tag-purple', 'tag-cyan', 'tag-pink', 'tag-green'];
        document.getElementById('skillsTags').innerHTML =
            skills.map((s, i) =>
                `<span class="skill-tag ${tagColors[i % tagColors.length]}" style="animation-delay:${i * 0.06}s">${s}</span>`
            ).join('');

        // Suggestions
        const suggestions = data.suggestions || [];
        document.getElementById('suggestionsList').innerHTML =
            suggestions.length === 0
                ? '<p style="color:var(--text-muted)">No suggestions — your resume looks great! 🎉</p>'
                : suggestions.map((s, i) => `
                    <div class="suggestion-item" style="animation-delay:${i * 0.1}s">
                        <span class="suggestion-icon">${s.icon || '💡'}</span>
                        <div class="suggestion-content">
                            <div class="suggestion-category priority-${s.priority}">${s.category} • ${s.priority}</div>
                            <div class="suggestion-message">${s.message}</div>
                        </div>
                    </div>`).join('');

        // Job Matches
        const jobs = data.job_matches || [];
        document.getElementById('jobsGrid').innerHTML =
            jobs.length === 0
                ? '<p style="color:var(--text-muted)">No job matches found. Add more skills to your resume.</p>'
                : jobs.map((job, i) => {
                    const mc = job.match_percentage >= 60 ? 'match-high' : job.match_percentage >= 30 ? 'match-mid' : 'match-low';
                    const matched = (job.matched_skills || []).map(s => `<span class="job-skill matched">✓ ${s}</span>`).join('');
                    const missing = (job.missing_skills  || []).map(s => `<span class="job-skill missing">✗ ${s}</span>`).join('');
                    return `
                    <div class="job-card" style="animation-delay:${i * 0.12}s">
                        <div class="job-card-header">
                            <div>
                                <div class="job-title">${job.title}</div>
                                <div class="job-company">${job.company}</div>
                            </div>
                            <div class="job-match ${mc}">${job.match_percentage}%</div>
                        </div>
                        <div class="job-meta">
                            <span>📍 ${job.location}</span>
                            <span>💰 ${job.salary}</span>
                        </div>
                        <div class="job-match-bar">
                            <div class="job-match-bar-fill" style="width:0%" data-width="${job.match_percentage}%"></div>
                        </div>
                        <div class="job-skills">${matched}${missing}</div>
                    </div>`;
                }).join('');
        setTimeout(() => {
            document.querySelectorAll('.job-match-bar-fill').forEach(b => { b.style.width = b.dataset.width; });
        }, 800);

        // Education & Experience
        setText('educationText',  data.education  || 'No education section detected.');
        setText('experienceText', data.experience || 'No experience section detected.');
    }

    // ── Utilities ────────────────────────────────────────────────

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function injectSvgGradient(svg) {
        if (svg.querySelector('#scoreGradient')) return;
        const ns = 'http://www.w3.org/2000/svg';
        const defs = document.createElementNS(ns, 'defs');
        const grad = document.createElementNS(ns, 'linearGradient');
        grad.id = 'scoreGradient';
        grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
        grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
        [['0%','#6c5ce7'], ['50%','#a855f7'], ['100%','#06b6d4']].forEach(([offset, color]) => {
            const stop = document.createElementNS(ns, 'stop');
            stop.setAttribute('offset', offset);
            stop.setAttribute('stop-color', color);
            grad.appendChild(stop);
        });
        defs.appendChild(grad);
        svg.insertBefore(defs, svg.firstChild);
    }

    function animateNumber(el, start, end, duration) {
        const range = end - start;
        const startTime = performance.now();
        function step(ts) {
            const eased = 1 - Math.pow(1 - Math.min((ts - startTime) / duration, 1), 3);
            el.textContent = Math.round(start + range * eased);
            if (eased < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }
})();
