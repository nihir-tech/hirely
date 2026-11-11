/**
 * Hirely LinkedIn Copilot — Toolbar Popup Controller
 */

(() => {
  let state = {
    activeResume: null,
    analyses: [],
    savedJobs: [],
    apiOrigin: 'https://hirelly.vercel.app',
  };
  let activeLinkedInContext = null;

  const els = {
    syncStatusText: document.getElementById('syncStatusText'),
    savedCountBadge: document.getElementById('savedCountBadge'),
    activeLinkedInCard: document.getElementById('activeLinkedInCard'),
    kwInput: document.getElementById('kwInput'),
    locInput: document.getElementById('locInput'),
    chkRemote: document.getElementById('chkRemote'),
    chkEasyApply: document.getElementById('chkEasyApply'),
    chkPast24h: document.getElementById('chkPast24h'),
    resumeDetails: document.getElementById('resumeDetails'),
    manualResumeInput: document.getElementById('manualResumeInput'),
    manualSaveMsg: document.getElementById('manualSaveMsg'),
    savedJobsList: document.getElementById('savedJobsList'),
    coachMessages: document.getElementById('coachMessages'),
    coachInput: document.getElementById('coachInput'),
    coachSendBtn: document.getElementById('coachSendBtn'),
    coachCtxBadge: document.getElementById('coachCtxBadge'),
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Tabs
  document.querySelectorAll('.tab').forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));
      tabBtn.classList.add('active');
      const target = document.getElementById(`tab-${tabBtn.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });

  function renderResumeSection() {
    const r = state.activeResume;
    if (!r) {
      els.syncStatusText.textContent = 'No resume synced yet';
      els.resumeDetails.innerHTML = `<p class="helper-txt">Visit <strong>hirelly.vercel.app</strong> or paste your resume below to start scoring LinkedIn jobs live.</p>`;
      return;
    }

    els.syncStatusText.textContent = `Active: ${r.fileName || 'Resume'}`;
    if (!els.kwInput.value.trim()) {
      els.kwInput.value = HirelyMatcher.suggestSearchKeywords(r);
    }
    if (r.extracted?.location && els.locInput.value === 'Worldwide') {
      els.locInput.value = r.extracted.location;
    }

    const skills = (r.skills?.detected || []).slice(0, 8);
    const options = state.analyses
      .map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === r.id ? 'selected' : ''}>${escapeHtml(item.fileName)} (${item.scores?.overall ?? '--'} pts)</option>`)
      .join('');

    els.resumeDetails.innerHTML = `
      <div class="form-group">
        <label>Active Resume Version</label>
        <select id="popupResumeSelect">${options}</select>
      </div>
      <div class="helper-txt" style="margin-top:6px;">
        Score: <strong style="color:#fff;">${r.scores?.overall ?? '--'}/100</strong> · ATS: <strong style="color:#34d399;">${r.ats?.score ?? '--'}%</strong>
      </div>
      <div class="skill-tags">
        ${skills.map((s) => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('')}
      </div>
    `;

    document.getElementById('popupResumeSelect')?.addEventListener('change', (e) => {
      chrome.runtime.sendMessage({ type: 'SET_ACTIVE_RESUME', resumeId: e.target.value }, () => {
        loadState();
      });
    });

    if (r.isManual && r.resumeText) {
      els.manualResumeInput.value = r.resumeText;
    }
  }

  function renderSavedJobs() {
    const jobs = state.savedJobs || [];
    els.savedCountBadge.textContent = String(jobs.length);

    if (!jobs.length) {
      els.savedJobsList.innerHTML = `<div class="card"><p class="helper-txt">No saved jobs yet. Click <strong>"Save to Pipeline"</strong> on any LinkedIn job post using the floating Hirely Copilot widget.</p></div>`;
      return;
    }

    els.savedJobsList.innerHTML = jobs
      .map(
        (j) => `
      <div class="saved-item">
        <div class="saved-item-top">
          <div>
            <h4>${escapeHtml(j.position)}</h4>
            <p>@ ${escapeHtml(j.company)} · ${escapeHtml(j.location)}</p>
          </div>
          ${j.matchScore ? `<span class="score-pill">${j.matchScore}% Match</span>` : ''}
        </div>
        <div class="saved-actions">
          <a href="${escapeHtml(j.url || 'https://www.linkedin.com/jobs/')}" target="_blank" rel="noreferrer">View on LinkedIn →</a>
          <button class="del-btn" data-del-id="${escapeHtml(j.id)}">Remove</button>
        </div>
      </div>`
      )
      .join('');

    document.querySelectorAll('[data-del-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'REMOVE_SAVED_JOB', jobId: btn.dataset.delId }, (res) => {
          if (res?.savedJobs) {
            state.savedJobs = res.savedJobs;
            renderSavedJobs();
          }
        });
      });
    });
  }

  function detectActiveLinkedInTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.id || !activeTab.url?.includes('linkedin.com')) {
        els.activeLinkedInCard.classList.add('hidden');
        return;
      }

      chrome.tabs.sendMessage(activeTab.id, { type: 'GET_CURRENT_LINKEDIN_PAGE' }, (res) => {
        if (chrome.runtime.lastError || !res) return;
        activeLinkedInContext = res;

        if (res.kind === 'job' && res.job) {
          const scoreText = res.match?.hasResume ? ` · ${res.match.score}% Match` : '';
          els.coachCtxBadge.textContent = `Context: ${res.job.title} @ ${res.job.company}`;
          els.activeLinkedInCard.classList.remove('hidden');
          els.activeLinkedInCard.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong style="color:#fff;">Viewing Job${escapeHtml(scoreText)}</strong>
              <span class="score-pill">${escapeHtml(res.match?.fitBadge || 'LinkedIn')}</span>
            </div>
            <div style="color:#cbd5e1;font-size:11.5px;">${escapeHtml(res.job.title)} @ ${escapeHtml(res.job.company)}</div>
            <div class="btn-row" style="margin-top:4px;">
              <button class="btn btn-secondary btn-sm" id="popSaveJobBtn">
                <svg class="ico" viewBox="0 0 24 24"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                <span>Save Job</span>
              </button>
              <button class="btn btn-primary btn-sm" id="popTailorBtn">
                <svg class="ico" viewBox="0 0 24 24"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/></svg>
                <span>Tailor Resume</span>
              </button>
            </div>
          `;

          document.getElementById('popSaveJobBtn')?.addEventListener('click', () => {
            chrome.runtime.sendMessage(
              {
                type: 'SAVE_JOB_AND_QUEUE',
                job: {
                  ...res.job,
                  matchScore: res.match?.score || 0,
                  matchedSkills: res.match?.matchedSkills || [],
                  missingSkills: res.match?.missingSkills || [],
                  resumeId: state.activeResume?.id || '',
                },
              },
              () => loadState()
            );
          });

          document.getElementById('popTailorBtn')?.addEventListener('click', () => {
            chrome.runtime.sendMessage({
              type: 'SEND_ACTION_TO_HIRELY',
              actionType: 'EXT_TAILOR_JOB',
              payload: {
                title: res.job.title,
                company: res.job.company,
                location: res.job.location,
                jobDescription: res.job.description,
                jobUrl: res.job.url,
                resumeId: state.activeResume?.id || '',
              },
            });
          });
        } else if (res.kind === 'profile' && res.profile) {
          els.activeLinkedInCard.classList.remove('hidden');
          els.activeLinkedInCard.innerHTML = `
            <strong style="color:#fff;">LinkedIn Profile Detected</strong>
            <div style="color:#cbd5e1;font-size:11.5px;">${escapeHtml(res.profile.name)} (${res.profile.sectionsCount} sections)</div>
            <button class="btn btn-primary btn-sm btn-full" id="popImportProfBtn">
              <svg class="ico" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>Import Profile to Hirely</span>
            </button>
          `;
          document.getElementById('popImportProfBtn')?.addEventListener('click', () => {
            chrome.runtime.sendMessage({
              type: 'SEND_ACTION_TO_HIRELY',
              actionType: 'EXT_IMPORT_PROFILE',
              payload: {
                markdown: res.profile.markdown,
                sourceName: res.profile.name,
                url: res.profile.url,
              },
            });
          });
        }
      });
    });
  }

  function loadState() {
    chrome.runtime.sendMessage({ type: 'GET_EXTENSION_STATE' }, (res) => {
      if (chrome.runtime.lastError || !res?.ok) return;
      state = res;
      renderResumeSection();
      renderSavedJobs();
      detectActiveLinkedInTab();
    });
  }

  // LinkedIn Job Search Launchers
  function openLinkedInSearch(preset = 'best-match') {
    const url = HirelyMatcher.buildLinkedInSearchUrl({
      keywords: els.kwInput.value || HirelyMatcher.suggestSearchKeywords(state.activeResume),
      location: els.locInput.value,
      preset,
      remoteOnly: els.chkRemote.checked,
      easyApply: els.chkEasyApply.checked,
      past24h: els.chkPast24h.checked,
    });
    chrome.tabs.create({ url });
  }

  document.getElementById('searchLinkedInBtn').addEventListener('click', () => openLinkedInSearch('best-match'));

  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => openLinkedInSearch(btn.dataset.preset));
  });

  // Web app links
  document.getElementById('openWebBtn').addEventListener('click', () => chrome.tabs.create({ url: state.apiOrigin }));
  document.getElementById('openFeedBtn').addEventListener('click', () => chrome.tabs.create({ url: `${state.apiOrigin}/jobs` }));
  document.getElementById('uploadWebBtn').addEventListener('click', () => chrome.tabs.create({ url: `${state.apiOrigin}/upload` }));
  document.getElementById('openPipelineBtn').addEventListener('click', () => chrome.tabs.create({ url: `${state.apiOrigin}/dashboard` }));

  document.getElementById('syncNowBtn').addEventListener('click', () => {
    chrome.tabs.query(
      { url: ['https://hirelly.vercel.app/*', 'https://*.vercel.app/*', 'http://localhost/*'] },
      (tabs) => {
        const hirelyTabs = tabs.filter(
          (t) => t.url && /^https?:\/\/(localhost|127\.0\.0\.1|hirel{1,2}y)/i.test(t.url)
        );
        if (hirelyTabs.length && hirelyTabs[0].id) {
          chrome.tabs.sendMessage(hirelyTabs[0].id, { type: 'REQUEST_IMMEDIATE_SYNC' }, () => {
            setTimeout(loadState, 250);
          });
        } else {
          chrome.tabs.create({ url: `${state.apiOrigin}/dashboard` });
        }
      }
    );
  });

  document.getElementById('saveManualBtn').addEventListener('click', () => {
    const text = els.manualResumeInput.value.trim();
    if (text.length < 30) {
      els.manualSaveMsg.textContent = 'Please paste at least 30 characters of resume text.';
      els.manualSaveMsg.style.color = '#f87171';
      els.manualSaveMsg.classList.remove('hidden');
      return;
    }
    chrome.runtime.sendMessage({ type: 'SAVE_MANUAL_RESUME', resumeText: text }, (res) => {
      if (res?.ok) {
        els.manualSaveMsg.textContent = 'Resume activated! LinkedIn pages will now auto-score against it.';
        els.manualSaveMsg.style.color = '#34d399';
        els.manualSaveMsg.classList.remove('hidden');
        loadState();
      }
    });
  });

  // Coach Chat
  function appendMessage(text, isUser) {
    const div = document.createElement('div');
    div.className = `msg ${isUser ? 'msg-user' : 'msg-coach'}`;
    div.textContent = text;
    els.coachMessages.appendChild(div);
    els.coachMessages.scrollTop = els.coachMessages.scrollHeight;
  }

  function askCoachQuery(query) {
    if (!query.trim()) return;
    appendMessage(query, true);
    els.coachInput.value = '';
    els.coachSendBtn.disabled = true;
    els.coachSendBtn.textContent = '...';

    const r = state.activeResume;
    const jobCtx = activeLinkedInContext?.job
      ? `Currently viewing job: ${activeLinkedInContext.job.title} at ${activeLinkedInContext.job.company}. Description snippet: ${(activeLinkedInContext.job.description || '').slice(0, 900)}`
      : '';

    const fullMsg = jobCtx ? `${query}\n\n[LinkedIn Context: ${jobCtx}]` : query;

    chrome.runtime.sendMessage(
      {
        type: 'CALL_HIRELY_API',
        endpoint: 'coach',
        payload: {
          message: fullMsg,
          resumeContext: r
            ? {
                name: r.extracted?.name,
                title: r.jobTarget?.title,
                skills: r.skills?.detected || [],
                atsScore: r.ats?.score,
                targetJob: activeLinkedInContext?.job ? `${activeLinkedInContext.job.title} @ ${activeLinkedInContext.job.company}` : undefined,
                resumeSnippet: (r.resumeText || '').slice(0, 2000),
              }
            : undefined,
        },
      },
      (res) => {
        els.coachSendBtn.disabled = false;
        els.coachSendBtn.textContent = 'Send';
        const reply = res?.ok && res.data?.reply ? res.data.reply : `Advice: Focus on aligning quantifiable project impact with the job's core skills!`;
        appendMessage(reply, false);
      }
    );
  }

  document.getElementById('coachForm').addEventListener('submit', (e) => {
    e.preventDefault();
    askCoachQuery(els.coachInput.value);
  });

  document.querySelectorAll('.q-chip').forEach((chip) => {
    chip.addEventListener('click', () => askCoachQuery(chip.dataset.q));
  });

  loadState();
})();

