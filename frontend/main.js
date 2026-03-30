/**
 * Home Page – Upload Logic (API-backed version)
 * Sends PDF to POST /api/analyze, saves result to sessionStorage,
 * then redirects to /dashboard.
 */
(function () {
    const uploadZone     = document.getElementById('uploadZone');
    const fileInput      = document.getElementById('fileInput');
    const uploadBtn      = document.getElementById('uploadBtn');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFileName = document.getElementById('progressFileName');
    const progressBarFill  = document.getElementById('progressBarFill');
    const progressStatus   = document.getElementById('progressStatus');
    const errorToast    = document.getElementById('errorToast');
    const toastMessage  = document.getElementById('toastMessage');
    if (!uploadZone) return;

    // ── Event Listeners ───────────────────────────────────────────

    uploadBtn.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

    // ── File Handler ──────────────────────────────────────────────

    async function handleFile(file) {
        // Validate
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            showToast('Please upload a PDF file.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showToast('File is too large. Max 10MB.');
            return;
        }

        // Show progress UI
        uploadZone.classList.add('uploading');
        uploadProgress.classList.add('active');
        document.querySelector('.upload-zone-inner').style.display = 'none';
        progressFileName.textContent = file.name;
        setProgress(0, 'Uploading...');

        try {
            await animateProgress(20, 300);
            setProgress(20, 'Parsing PDF...');

            const formData = new FormData();
            formData.append('resume', file);

            await animateProgress(40, 400);
            setProgress(40, 'Running AI analysis...');

            const res = await fetch('/api/analyze', { method: 'POST', body: formData });

            await animateProgress(75, 500);
            setProgress(75, 'Scoring & matching jobs...');

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || 'Analysis failed. Please try again.');
            }

            await animateProgress(100, 400);
            setProgress(100, '✓ Done! Redirecting...');

            // Persist current result to sessionStorage for dashboard
            sessionStorage.setItem('resumeResult', JSON.stringify(data));

            setTimeout(() => { window.location.href = '/dashboard'; }, 600);

        } catch (err) {
            showToast(err.message || 'An unexpected error occurred.');
            resetUpload();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────

    function setProgress(pct, status) {
        progressBarFill.style.width = pct + '%';
        progressStatus.textContent = status;
    }

    function animateProgress(target, duration) {
        return new Promise(resolve => {
            progressBarFill.style.width = target + '%';
            setTimeout(resolve, duration);
        });
    }

    function resetUpload() {
        uploadZone.classList.remove('uploading');
        uploadProgress.classList.remove('active');
        document.querySelector('.upload-zone-inner').style.display = '';
        fileInput.value = '';
    }

    function showToast(msg) {
        toastMessage.textContent = msg;
        errorToast.classList.add('visible');
        setTimeout(() => errorToast.classList.remove('visible'), 4500);
    }
})();
