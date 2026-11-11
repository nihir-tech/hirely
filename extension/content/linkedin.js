/**
 * Hirely LinkedIn Copilot — Content Script
 * Injects a sleek Shadow-DOM Job Match & AI Copilot panel on LinkedIn Job and Profile pages,
 * plus subtle match badges onto LinkedIn job search result cards.
 */

(() => {
  if (window.__HIRELY_COPILOT_LOADED__) return;
  window.__HIRELY_COPILOT_LOADED__ = true;

  let activeResume = null;
  let allResumes = [];
  let isMinimized = false;
  let currentUrl = window.location.href;
  let lastJobSignature = '';
  let currentJob = null;
  let currentMatch = null;
  let savedJobKeys = new Set();

  // Sub-panel transient states
  let aiMatchState = { loading: false, result: null, error: null };
  let recruiterNoteState = { loading: false, text: null };
  let interviewState = { loading: false, questions: null };

  // ── SHADOW DOM HOST SETUP ────────────────────────────────
  const host = document.createElement('div');
  host.id = 'hirely-copilot-host';
  host.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2147483640;font-family:Inter,system-ui,-apple-system,sans-serif;';
  const shadow = host.attachShadow({ mode: 'open' });

  const STYLE_TEXT = `
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .pill {
      display: inline-flex; align-items: center; gap: 8px;
      background: linear-gradient(135deg, #13111f 0%, #09080f 100%);
      color: #f8fafc; border: 1px solid rgba(139, 92, 246, 0.45);
      border-radius: 999px; padding: 9px 15px; cursor: pointer;
      box-shadow: 0 10px 30px rgba(0,0,0,0.55), 0 0 20px rgba(124, 58, 237, 0.25);
      font-size: 12.5px; font-weight: 700; transition: transform 0.18s ease, box-shadow 0.18s ease;
    }
    .pill:hover { transform: translateY(-2px); box-shadow: 0 14px 34px rgba(0,0,0,0.65), 0 0 26px rgba(124, 58, 237, 0.4); }
    .pill-dot { width: 8px; height: 8px; border-radius: 50%; background: #34d399; box-shadow: 0 0 8px #34d399; }
    .logo-badge {
      width: 22px; height: 22px; border-radius: 7px;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      display: inline-flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 900; font-size: 12px; flex-shrink: 0;
    }
    .panel {
      width: 356px; max-height: 82vh; overflow-y: auto;
      background: rgba(11, 10, 18, 0.96); backdrop-filter: blur(18px);
      color: #f1f5f9; border: 1px solid rgba(139, 92, 246, 0.35);
      border-radius: 18px; box-shadow: 0 22px 60px rgba(0, 0, 0, 0.72), 0 0 0 1px rgba(255,255,255,0.04);
      display: flex; flex-direction: column;
    }
    .panel::-webkit-scrollbar { width: 5px; }
    .panel::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.35); border-radius: 99px; }
    .header {
      padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.08);
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      background: rgba(255,255,255,0.02); position: sticky; top: 0; z-index: 5; backdrop-filter: blur(12px);
    }
    .header-left { display: flex; align-items: center; gap: 9px; min-width: 0; }
    .brand-title { font-size: 13px; font-weight: 800; color: #fff; letter-spacing: 0.01em; }
    .brand-sub { font-size: 11px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 205px; }
    .icon-btn {
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09);
      color: #cbd5e1; border-radius: 8px; width: 26px; height: 26px;
      display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font-size: 13px;
    }
    .icon-btn:hover { background: rgba(139,92,246,0.2); color: #fff; border-color: rgba(139,92,246,0.4); }
    .body { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
    .resume-bar {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px; padding: 7px 10px; font-size: 11px; color: #94a3b8;
    }
    .resume-select {
      background: #171526; color: #e2e8f0; border: 1px solid rgba(139,92,246,0.3);
      border-radius: 6px; padding: 3px 6px; font-size: 11px; max-width: 195px; outline: none;
    }
    .score-card {
      display: flex; align-items: center; gap: 13px; padding: 12px;
      border-radius: 14px; background: linear-gradient(135deg, rgba(124,58,237,0.14), rgba(15,23,42,0.7));
      border: 1px solid rgba(139,92,246,0.28);
    }
    .ring-wrap { position: relative; width: 64px; height: 64px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .ring-wrap svg { transform: rotate(-90deg); width: 64px; height: 64px; }
    .ring-num { position: absolute; font-size: 15px; font-weight: 800; color: #fff; }
    .fit-badge {
      display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10.5px; font-weight: 700; margin-bottom: 4px;
    }
    .badge-best { background: rgba(52,211,153,0.16); color: #34d399; border: 1px solid rgba(52,211,153,0.35); }
    .badge-high { background: rgba(139,92,246,0.2); color: #c4b5fd; border: 1px solid rgba(139,92,246,0.4); }
    .badge-near { background: rgba(251,191,36,0.15); color: #fbbf24; border: 1px solid rgba(251,191,36,0.35); }
    .badge-low { background: rgba(248,113,113,0.15); color: #f87171; border: 1px solid rgba(248,113,113,0.35); }
    .summary-txt { font-size: 11.5px; line-height: 1.45; color: #cbd5e1; }
    .section-lbl { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; }
    .chips { display: flex; flex-wrap: wrap; gap: 5px; }
    .chip { font-size: 11px; padding: 3px 8px; border-radius: 7px; font-weight: 600; }
    .chip-hit { background: rgba(52,211,153,0.12); color: #6ee7b7; border: 1px solid rgba(52,211,153,0.25); }
    .chip-miss { background: rgba(251,191,36,0.12); color: #fcd34d; border: 1px solid rgba(251,191,36,0.25); }
    .actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 5px;
      padding: 8px 10px; border-radius: 10px; font-size: 11.5px; font-weight: 600;
      cursor: pointer; border: 1px solid rgba(255,255,255,0.1); transition: all 0.15s ease;
      background: rgba(255,255,255,0.05); color: #f1f5f9; text-align: center;
    }
    .btn:hover { background: rgba(139,92,246,0.22); border-color: rgba(139,92,246,0.45); color: #fff; }
    .btn-primary {
      background: linear-gradient(135deg, #7c3aed, #6d28d9); border-color: rgba(167,139,250,0.4); color: #fff;
      box-shadow: 0 4px 14px rgba(124,58,237,0.35);
    }
    .btn-primary:hover { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
    .btn-success { background: rgba(16,185,129,0.18); border-color: rgba(52,211,153,0.4); color: #34d399; }
    .btn-full { width: 100%; }
    .sub-box {
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px; padding: 10px; font-size: 11.5px; line-height: 1.5; color: #cbd5e1;
      max-height: 220px; overflow-y: auto; white-space: pre-wrap;
    }
    .link-sm { color: #a78bfa; text-decoration: none; font-size: 11px; cursor: pointer; font-weight: 600; }
    .link-sm:hover { text-decoration: underline; color: #c4b5fd; }
    .q-item { border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; margin-bottom: 8px; }
    .q-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .q-cat { font-size: 10px; color: #a78bfa; font-weight: 700; text-transform: uppercase; }
    .q-txt { font-size: 11.5px; color: #f8fafc; font-weight: 600; margin: 2px 0 4px; }
    .q-ans { font-size: 11px; color: #94a3b8; }
    .empty-box {
      padding: 14px; border-radius: 12px; background: rgba(255,255,255,0.03);
      border: 1px dashed rgba(139,92,246,0.35); text-align: center; font-size: 12px; color: #cbd5e1;
      display: flex; flex-direction: column; gap: 9px;
    }
  `;

  function mountHost() {
    if (!document.body) return;
    if (!document.getElementById('hirely-copilot-host')) {
      document.body.appendChild(host);
    }
  }

  // ── PAGE EXTRACTION HELPERS ──────────────────────────────
  function getCleanText(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim()) {
        return el.innerText.trim();
      }
    }
    return '';
  }

  function getCanonicalJobUrl() {
    const url = new URL(window.location.href);
    const currentJobId = url.searchParams.get('currentJobId');
    if (currentJobId) {
      return `https://www.linkedin.com/jobs/view/${currentJobId}/`;
    }
    return window.location.href.split('?')[0];
  }

  function isJobPage() {
    return window.location.pathname.includes('/jobs/');
  }

  function isProfilePage() {
    return /^\/in\/[^/]+/.test(window.location.pathname);
  }

  function extractCurrentJob() {
    const title = getCleanText([
      '.job-details-jobs-unified-top-card__job-title h1',
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title',
      'h1.t-24',
      '.top-card-layout__title',
      'h1.topcard__title',
    ]);

    const company = getCleanText([
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name',
      '.topcard__org-name-link',
    ]);

    const locationRaw = getCleanText([
      '.job-details-jobs-unified-top-card__primary-description-container .tvm__text',
      '.job-details-jobs-unified-top-card__bullet',
      '.jobs-unified-top-card__bullet',
      '.topcard__flavor--bullet',
    ]);

    const description = getCleanText([
      '#job-details',
      '.jobs-description__content',
      '.jobs-description-content__text',
      '.jobs-box__html-content',
      '.show-more-less-html__markup',
    ]);

    if (!title && !description) return null;

    return {
      title: title || 'LinkedIn Job Opening',
      company: company || 'Company on LinkedIn',
      location: locationRaw || 'LinkedIn',
      description: description || title,
      url: getCanonicalJobUrl(),
    };
  }

  function extractCurrentProfile() {
    const name = getCleanText(['h1.text-heading-xlarge', '.pv-top-card--list h1', 'main h1']);
    const headline = getCleanText(['.text-body-medium.break-words', '.pv-text-details__left-panel .text-body-medium']);
    const location = getCleanText(['.text-body-small.inline.t-black--light.break-words']);

    const sections = [];
    document.querySelectorAll('main section.artdeco-card').forEach((sec) => {
      const heading = sec.querySelector('h2 span[aria-hidden="true"], h2')?.innerText?.trim();
      const text = sec.innerText?.trim();
      if (heading && text) {
        sections.push(`${heading}\n${text.slice(0, 2200)}`);
      }
    });

    const markdown = [
      name || 'LinkedIn Member',
      headline,
      location,
      `LinkedIn: ${window.location.href.split('?')[0]}`,
      '',
      ...sections,
    ]
      .filter(Boolean)
      .join('\n\n');

    return {
      name: name || 'LinkedIn Profile',
      headline,
      location,
      url: window.location.href.split('?')[0],
      sectionsCount: sections.length,
      markdown,
    };
  }

  // ── INJECT BADGES ON JOB SEARCH LIST CARDS ───────────────
  function annotateJobSearchCards() {
    if (!isJobPage() || !activeResume) return;
    const cards = document.querySelectorAll('.jobs-search-results__list-item, li[data-occludable-job-id]');
    cards.forEach((card) => {
      if (card.getAttribute('data-hirely-annotated') === activeResume.id) return;
      const titleEl = card.querySelector('.job-card-list__title, .job-card-container__link, a[href*="/jobs/view/"]');
      if (!titleEl || !titleEl.innerText) return;
      const quick = HirelyMatcher.quickCardScore(titleEl.innerText.trim(), activeResume);
      if (!quick) return;

      card.setAttribute('data-hirely-annotated', activeResume.id);
      let badge = card.querySelector('.hirely-list-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'hirely-list-badge';
        const anchorParent = titleEl.parentElement;
        if (anchorParent) {
          anchorParent.appendChild(badge);
        }
      }

      const bgMap = {
        best: 'background:rgba(16,185,129,0.16);color:#059669;border:1px solid rgba(16,185,129,0.4);',
        good: 'background:rgba(124,58,237,0.14);color:#6d28d9;border:1px solid rgba(124,58,237,0.35);',
        stretch: 'background:rgba(245,158,11,0.12);color:#b45309;border:1px solid rgba(245,158,11,0.3);',
      };
      badge.style.cssText = `display:inline-flex;align-items:center;gap:4px;margin-top:4px;padding:2px 7px;border-radius:999px;font-size:10.5px;font-weight:700;${bgMap[quick.tier]}`;
      badge.textContent = `H · ${quick.pct}% ${quick.label}`;
    });
  }

  // ── RENDER WIDGET ────────────────────────────────────────
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderWidget() {
    mountHost();

    const onJob = isJobPage();
    const onProfile = isProfilePage();

    if (!onJob && !onProfile) {
      host.style.display = 'none';
      return;
    }
    host.style.display = 'block';

    // Recompute current match if on job page
    if (onJob) {
      currentJob = extractCurrentJob();
      currentMatch = currentJob ? HirelyMatcher.scoreJobAgainstResume(currentJob, activeResume) : null;
    }

    if (isMinimized) {
      let pillLabel = 'Hirely Copilot';
      if (onJob && currentMatch && currentMatch.hasResume) {
        pillLabel = `${currentMatch.score}% Match · ${currentMatch.fitBadge}`;
      } else if (onProfile) {
        pillLabel = 'Import Profile to Hirely';
      }

      shadow.innerHTML = `
        <style>${STYLE_TEXT}</style>
        <button class="pill" id="expandBtn" title="Open Hirely LinkedIn Copilot">
          <span class="logo-badge">H</span>
          <span>${escapeHtml(pillLabel)}</span>
          <span class="pill-dot"></span>
        </button>
      `;
      shadow.getElementById('expandBtn')?.addEventListener('click', () => {
        isMinimized = false;
        chrome.runtime.sendMessage({ type: 'SET_WIDGET_MINIMIZED', minimized: false }).catch(() => {});
        renderWidget();
      });
      return;
    }

    // EXPANDED PANEL
    if (onProfile) {
      const prof = extractCurrentProfile();
      shadow.innerHTML = `
        <style>${STYLE_TEXT}</style>
        <div class="panel">
          <div class="header">
            <div class="header-left">
              <span class="logo-badge">H</span>
              <div>
                <div class="brand-title">Hirely Profile Importer</div>
                <div class="brand-sub">${escapeHtml(prof.name)}</div>
              </div>
            </div>
            <button class="icon-btn" id="minBtn" title="Minimize">─</button>
          </div>
          <div class="body">
            <div class="score-card">
              <div style="flex:1">
                <span class="fit-badge badge-high">LinkedIn Profile Ready</span>
                <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:3px;">${escapeHtml(prof.name)}</div>
                <div class="summary-txt">${escapeHtml(prof.headline || 'Ready to convert profile sections into an ATS-scored resume.')}</div>
              </div>
            </div>
            <div class="summary-txt" style="padding:0 2px;">
              Captured <strong>${prof.sectionsCount}</strong> profile sections from this page. Click below to analyze it in Hirely, get an ATS score, and download a PDF resume.
            </div>
            <button class="btn btn-primary btn-full" id="importProfileBtn">
              📥 Import Profile to Hirely
            </button>
          </div>
        </div>
      `;
      shadow.getElementById('minBtn')?.addEventListener('click', () => {
        isMinimized = true;
        chrome.runtime.sendMessage({ type: 'SET_WIDGET_MINIMIZED', minimized: true }).catch(() => {});
        renderWidget();
      });
      shadow.getElementById('importProfileBtn')?.addEventListener('click', () => {
        const freshProf = extractCurrentProfile();
        chrome.runtime.sendMessage({
          type: 'SEND_ACTION_TO_HIRELY',
          actionType: 'EXT_IMPORT_PROFILE',
          payload: { markdown: freshProf.markdown, sourceName: freshProf.name, url: freshProf.url },
        });
      });
      return;
    }

    // ON JOB PAGE
    const job = currentJob;
    const match = currentMatch;
    const jobKey = job ? `${job.company.toLowerCase()}::${job.title.toLowerCase()}` : '';
    const isSaved = jobKey && savedJobKeys.has(jobKey);

    const scoreVal = match && match.hasResume ? match.score : 0;
    const radius = 26;
    const circ = 2 * Math.PI * radius;
    const dashOffset = circ - (circ * scoreVal) / 100;
    const ringColor = scoreVal >= 85 ? '#34d399' : scoreVal >= 72 ? '#8b5cf6' : scoreVal >= 56 ? '#fbbf24' : '#f87171';
    const badgeClass = scoreVal >= 85 ? 'badge-best' : scoreVal >= 72 ? 'badge-high' : scoreVal >= 56 ? 'badge-near' : 'badge-low';

    const resumeOptionsHtml = allResumes.length
      ? allResumes
          .map(
            (r) =>
              `<option value="${escapeHtml(r.id)}" ${activeResume && r.id === activeResume.id ? 'selected' : ''}>${escapeHtml(r.fileName)}</option>`
          )
          .join('')
      : '<option>No Resume Synced</option>';

    shadow.innerHTML = `
      <style>${STYLE_TEXT}</style>
      <div class="panel">
        <div class="header">
          <div class="header-left">
            <span class="logo-badge">H</span>
            <div>
              <div class="brand-title">Hirely Job Copilot</div>
              <div class="brand-sub">${job ? `${escapeHtml(job.title)} · ${escapeHtml(job.company)}` : 'Select a LinkedIn job post'}</div>
            </div>
          </div>
          <button class="icon-btn" id="minBtn" title="Minimize">─</button>
        </div>

        <div class="body">
          ${
            allResumes.length
              ? `<div class="resume-bar">
                   <span>Resume:</span>
                   <select class="resume-select" id="resumeSelect">${resumeOptionsHtml}</select>
                 </div>`
              : `<div class="empty-box">
                   <div><strong>No resume synced yet!</strong><br/>Visit Hirely once or paste your resume inside the Hirely toolbar popup to get instant job match scores.</div>
                   <button class="btn btn-primary btn-full" id="openHirelyUploadBtn">Open Hirely & Upload Resume</button>
                 </div>`
          }

          ${
            job && match && match.hasResume
              ? `
            <div class="score-card">
              <div class="ring-wrap">
                <svg viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="${radius}" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="6"></circle>
                  <circle cx="32" cy="32" r="${radius}" fill="none" stroke="${ringColor}" stroke-width="6"
                    stroke-dasharray="${circ}" stroke-dashoffset="${dashOffset}" stroke-linecap="round"></circle>
                </svg>
                <span class="ring-num">${scoreVal}%</span>
              </div>
              <div style="flex:1;min-width:0;">
                <span class="fit-badge ${badgeClass}">${escapeHtml(match.fitBadge)}</span>
                <p class="summary-txt">${escapeHtml(match.summary)}</p>
              </div>
            </div>

            ${
              match.matchedSkills.length
                ? `<div>
                     <div class="section-lbl"><span>✓ Matched Skills (${match.matchedSkills.length})</span></div>
                     <div class="chips">${match.matchedSkills.slice(0, 8).map((s) => `<span class="chip chip-hit">✓ ${escapeHtml(s)}</span>`).join('')}</div>
                   </div>`
                : ''
            }

            ${
              match.missingSkills.length
                ? `<div>
                     <div class="section-lbl">
                       <span>✕ Missing / Gaps (${match.missingSkills.length})</span>
                       <a class="link-sm" id="roadmapLink">Skill Roadmap →</a>
                     </div>
                     <div class="chips">${match.missingSkills.slice(0, 7).map((s) => `<span class="chip chip-miss">✕ ${escapeHtml(s)}</span>`).join('')}</div>
                   </div>`
                : ''
            }

            <div class="actions-grid">
              <button class="btn ${isSaved ? 'btn-success' : ''}" id="saveJobBtn">
                ${isSaved ? '✓ Saved to Hirely' : '📌 Save to Pipeline'}
              </button>
              <button class="btn btn-primary" id="tailorBtn">
                ✨ Tailor Resume
              </button>
              <button class="btn" id="noteBtn">
                ✉️ Recruiter Note
              </button>
              <button class="btn" id="interviewBtn">
                🎯 Interview Prep
              </button>
            </div>

            <button class="btn btn-full" id="deepAiBtn">
              ${aiMatchState.loading ? '⏳ Running Deep AI Audit...' : '🧠 Deep AI Job Audit'}
            </button>

            ${
              aiMatchState.result
                ? `<div class="sub-box">
                     <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                       <strong style="color:#c4b5fd;">🧠 Deep AI Audit (${aiMatchState.result.score || scoreVal}%)</strong>
                     </div>
                     ${
                       (aiMatchState.result.notes || []).length
                         ? aiMatchState.result.notes.map((n) => `• ${escapeHtml(n)}`).join('\n')
                         : 'Audit complete! Open Tailor Resume to apply suggested edits.'
                     }
                   </div>`
                : ''
            }

            ${
              recruiterNoteState.loading
                ? `<div class="sub-box">✍️ Crafting personalized LinkedIn outreach for ${escapeHtml(job.company)}...</div>`
                : recruiterNoteState.text
                ? `<div class="sub-box" id="noteOutput">
                     <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                       <strong style="color:#34d399;">✉️ Ready-to-Send Pitch</strong>
                       <button class="btn" style="padding:3px 8px;font-size:10.5px;" id="copyNoteBtn">📋 Copy</button>
                     </div>${escapeHtml(recruiterNoteState.text)}</div>`
                : ''
            }

            ${
              interviewState.loading
                ? `<div class="sub-box">🎯 Generating custom interview questions for ${escapeHtml(job.title)}...</div>`
                : interviewState.questions
                ? `<div class="sub-box">
                     <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                       <strong style="color:#fbbf24;">🎯 Top Interview Questions</strong>
                       <a class="link-sm" id="fullPrepLink">Open Full Kit →</a>
                     </div>
                     ${interviewState.questions
                       .slice(0, 3)
                       .map(
                         (q) => `<div class="q-item">
                                   <div class="q-cat">${escapeHtml(q.category)}</div>
                                   <div class="q-txt">${escapeHtml(q.question)}</div>
                                   <div class="q-ans"><strong>Tip:</strong> ${escapeHtml((q.keyPointsToHit || [])[0] || q.whyTheyAsk)}</div>
                                 </div>`
                       )
                       .join('')}
                   </div>`
                : ''
            }
          `
              : job
              ? `<div class="empty-box">
                   <div><strong>Viewing:</strong> ${escapeHtml(job.title)} @ ${escapeHtml(job.company)}</div>
                   <div class="actions-grid">
                     <button class="btn" id="saveJobBtn">📌 Save Job</button>
                     <button class="btn btn-primary" id="noteBtn">✉️ Recruiter Note</button>
                   </div>
                 </div>`
              : `<div class="empty-box">
                   Click any LinkedIn job post from the left list to inspect match score, missing skills, and AI tools.
                 </div>`
          }
        </div>
      </div>
    `;

    // Bind listeners
    shadow.getElementById('minBtn')?.addEventListener('click', () => {
      isMinimized = true;
      chrome.runtime.sendMessage({ type: 'SET_WIDGET_MINIMIZED', minimized: true }).catch(() => {});
      renderWidget();
    });

    shadow.getElementById('resumeSelect')?.addEventListener('change', (e) => {
      const id = e.target.value;
      chrome.runtime.sendMessage({ type: 'SET_ACTIVE_RESUME', resumeId: id }, () => {
        activeResume = allResumes.find((r) => r.id === id) || activeResume;
        renderWidget();
        annotateJobSearchCards();
      });
    });

    shadow.getElementById('openHirelyUploadBtn')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'SEND_ACTION_TO_HIRELY', actionType: 'EXT_OPEN_DASHBOARD', targetPath: '/upload' });
    });

    shadow.getElementById('saveJobBtn')?.addEventListener('click', () => {
      if (!job) return;
      chrome.runtime.sendMessage(
        {
          type: 'SAVE_JOB_AND_QUEUE',
          job: {
            ...job,
            matchScore: match?.score || 0,
            matchedSkills: match?.matchedSkills || [],
            missingSkills: match?.missingSkills || [],
            resumeId: activeResume?.id || '',
          },
        },
        () => {
          savedJobKeys.add(jobKey);
          renderWidget();
        }
      );
    });

    shadow.getElementById('tailorBtn')?.addEventListener('click', () => {
      if (!job) return;
      chrome.runtime.sendMessage({
        type: 'SEND_ACTION_TO_HIRELY',
        actionType: 'EXT_TAILOR_JOB',
        payload: {
          title: job.title,
          company: job.company,
          location: job.location,
          jobDescription: job.description,
          jobUrl: job.url,
          resumeId: activeResume?.id || '',
        },
      });
    });

    shadow.getElementById('roadmapLink')?.addEventListener('click', () => {
      if (!job) return;
      chrome.runtime.sendMessage({
        type: 'SEND_ACTION_TO_HIRELY',
        actionType: 'EXT_OPEN_JOB_MODAL',
        payload: {
          modalType: 'roadmap',
          job: {
            id: `ext-${Date.now()}`,
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            requiredSkills: match?.jobSkills?.length ? match.jobSkills : match?.missingSkills || [],
            linkedInUrl: job.url,
            applyUrl: job.url,
            source: 'LinkedIn',
          },
        },
      });
    });

    shadow.getElementById('fullPrepLink')?.addEventListener('click', () => {
      if (!job) return;
      chrome.runtime.sendMessage({
        type: 'SEND_ACTION_TO_HIRELY',
        actionType: 'EXT_OPEN_JOB_MODAL',
        payload: {
          modalType: 'interview',
          job: {
            id: `ext-${Date.now()}`,
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            requiredSkills: match?.jobSkills?.length ? match.jobSkills : match?.matchedSkills || [],
            linkedInUrl: job.url,
            applyUrl: job.url,
            source: 'LinkedIn',
          },
        },
      });
    });

    shadow.getElementById('noteBtn')?.addEventListener('click', () => {
      if (!job || recruiterNoteState.loading) return;
      recruiterNoteState = { loading: true, text: null };
      renderWidget();
      chrome.runtime.sendMessage(
        { type: 'GENERATE_RECRUITER_NOTE', job, resume: activeResume, matchResult: match },
        (res) => {
          recruiterNoteState = { loading: false, text: res?.text || 'Could not generate note right now.' };
          renderWidget();
        }
      );
    });

    shadow.getElementById('copyNoteBtn')?.addEventListener('click', () => {
      if (recruiterNoteState.text) {
        navigator.clipboard.writeText(recruiterNoteState.text);
        const btn = shadow.getElementById('copyNoteBtn');
        if (btn) btn.textContent = '✓ Copied!';
      }
    });

    shadow.getElementById('interviewBtn')?.addEventListener('click', () => {
      if (!job || interviewState.loading) return;
      interviewState = { loading: true, questions: null };
      renderWidget();
      chrome.runtime.sendMessage(
        {
          type: 'CALL_HIRELY_API',
          endpoint: 'interview',
          payload: {
            jobTitle: job.title,
            company: job.company,
            jobDescription: job.description,
            requiredSkills: match?.jobSkills || [],
            matchingSkills: match?.matchedSkills || [],
            missingSkills: match?.missingSkills || [],
            resumeText: activeResume?.resumeText || '',
          },
        },
        (res) => {
          const qs = res?.ok && Array.isArray(res.data?.questions) && res.data.questions.length
            ? res.data.questions
            : [
                {
                  category: 'Technical & Role Fit',
                  question: `Walk me through a project where you used ${(match?.matchedSkills || ['your core skills']).slice(0, 2).join(' and ')} cleanly under deadline.`,
                  keyPointsToHit: ['Describe scale/metrics achieved and architectural choices clearly.'],
                },
                {
                  category: 'Gap Check',
                  question: `How do you approach ramping up on ${(match?.missingSkills || ['new team tools'])[0]} for ${job.company}?`,
                  keyPointsToHit: ['Show examples of learning adjacent technologies quickly in production.'],
                },
              ];
          interviewState = { loading: false, questions: qs };
          renderWidget();
        }
      );
    });

    shadow.getElementById('deepAiBtn')?.addEventListener('click', () => {
      if (!job || !activeResume || aiMatchState.loading) return;
      aiMatchState = { loading: true, result: null, error: null };
      renderWidget();
      chrome.runtime.sendMessage(
        {
          type: 'CALL_HIRELY_API',
          endpoint: 'job-match',
          payload: {
            resumeText: activeResume.resumeText,
            jobDescription: job.description,
            company: job.company,
            jobTitle: job.title,
          },
        },
        (res) => {
          aiMatchState = {
            loading: false,
            result: res?.ok ? res.data?.jobMatch : { score: match?.score, notes: [res?.error || 'Check network or try Tailor Resume in Hirely.'] },
          };
          renderWidget();
        }
      );
    });
  }

  // ── INITIALIZATION & SPA WATCHER ─────────────────────────
  function refreshStateFromBackground(cb) {
    chrome.runtime.sendMessage({ type: 'GET_EXTENSION_STATE' }, (res) => {
      if (chrome.runtime.lastError || !res?.ok) return;
      activeResume = res.activeResume;
      allResumes = res.analyses || [];
      isMinimized = Boolean(res.widgetMinimized);
      savedJobKeys = new Set(
        (res.savedJobs || []).map((j) => `${(j.company || '').toLowerCase()}::${(j.position || '').toLowerCase()}`)
      );
      if (cb) cb();
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type === 'HIRELY_RESUME_UPDATED') {
      activeResume = msg.activeResume;
      allResumes = msg.analyses || [];
      renderWidget();
      annotateJobSearchCards();
    } else if (msg?.type === 'GET_CURRENT_LINKEDIN_PAGE') {
      if (isJobPage()) {
        const job = extractCurrentJob();
        const match = job ? HirelyMatcher.scoreJobAgainstResume(job, activeResume) : null;
        sendResponse({ kind: 'job', job, match });
      } else if (isProfilePage()) {
        sendResponse({ kind: 'profile', profile: extractCurrentProfile() });
      } else {
        sendResponse({ kind: 'other' });
      }
      return true;
    }
  });

  // Watch LinkedIn SPA changes + DOM mutations lightly (debounced)
  let debounceTimer = null;
  function scheduleScan() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const urlChanged = window.location.href !== currentUrl;
      if (urlChanged) {
        currentUrl = window.location.href;
        aiMatchState = { loading: false, result: null, error: null };
        recruiterNoteState = { loading: false, text: null };
        interviewState = { loading: false, questions: null };
      }

      const job = isJobPage() ? extractCurrentJob() : null;
      const sig = job ? `${job.title}::${job.company}::${job.description.slice(0, 80)}` : window.location.pathname;
      if (sig !== lastJobSignature || urlChanged) {
        lastJobSignature = sig;
        if (urlChanged) {
          aiMatchState = { loading: false, result: null, error: null };
          recruiterNoteState = { loading: false, text: null };
          interviewState = { loading: false, questions: null };
        }
        renderWidget();
      }
      annotateJobSearchCards();
    }, 550);
  }

  refreshStateFromBackground(() => {
    renderWidget();
    annotateJobSearchCards();
    const observer = new MutationObserver(scheduleScan);
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
    setInterval(scheduleScan, 2000);
  });
})();

