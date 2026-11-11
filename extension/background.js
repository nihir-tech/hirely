/**
 * Hirely LinkedIn Copilot — Background Service Worker (Manifest V3)
 * Handles cross-origin API calls, resume sync state, pending action queue,
 * and tab coordination between LinkedIn and hirelly.vercel.app.
 */

importScripts('lib/matcher.js');

const DEFAULT_ORIGIN = 'https://hirelly.vercel.app';

const STORAGE_KEYS = {
  ANALYSES: 'hirely_analyses',
  MANUAL_RESUME: 'hirely_manual_resume',
  ACTIVE_ID: 'hirely_active_resume_id',
  SAVED_JOBS: 'hirely_saved_jobs',
  PENDING_ACTIONS: 'hirely_pending_actions',
  API_ORIGIN: 'hirely_api_origin',
  WIDGET_MINIMIZED: 'hirely_widget_minimized',
  APPLICATIONS: 'hirely_applications',
};

async function getStorage(keys) {
  return chrome.storage.local.get(keys);
}

async function setStorage(obj) {
  return chrome.storage.local.set(obj);
}

async function resolveActiveResume() {
  const data = await getStorage([
    STORAGE_KEYS.ANALYSES,
    STORAGE_KEYS.MANUAL_RESUME,
    STORAGE_KEYS.ACTIVE_ID,
  ]);
  const analyses = Array.isArray(data[STORAGE_KEYS.ANALYSES]) ? data[STORAGE_KEYS.ANALYSES] : [];
  const manual = data[STORAGE_KEYS.MANUAL_RESUME] || null;
  const activeId = data[STORAGE_KEYS.ACTIVE_ID];

  const allResumes = manual ? [...analyses, manual] : [...analyses];
  if (!allResumes.length) {
    return { activeResume: null, analyses: [] };
  }

  const found = allResumes.find((r) => r.id === activeId) || allResumes[0];
  return { activeResume: found, analyses: allResumes };
}

async function getOrigin() {
  const data = await getStorage([STORAGE_KEYS.API_ORIGIN]);
  return data[STORAGE_KEYS.API_ORIGIN] || DEFAULT_ORIGIN;
}

async function callHirelyApi(endpoint, payload) {
  const origin = await getOrigin();
  const candidates = [origin];
  if (origin !== DEFAULT_ORIGIN) candidates.push(DEFAULT_ORIGIN);

  let lastErr = null;
  for (const base of candidates) {
    try {
      const res = await fetch(`${base}/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || `API status ${res.status}`);
      }
      return { ok: true, data: json };
    } catch (err) {
      lastErr = err;
    }
  }
  return { ok: false, error: lastErr ? lastErr.message : 'Unable to reach Hirely API' };
}

async function broadcastResumeUpdate() {
  const state = await resolveActiveResume();
  const tabs = await chrome.tabs.query({ url: 'https://www.linkedin.com/*' });
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'HIRELY_RESUME_UPDATED',
        activeResume: state.activeResume,
        analyses: state.analyses,
      }).catch(() => {});
    }
  }
}

async function findHirelyTabs() {
  const tabs = await chrome.tabs.query({
    url: [
      'https://hirelly.vercel.app/*',
      'https://*.vercel.app/*',
      'http://localhost/*',
    ],
  });
  return tabs.filter((t) => t.url && /^https?:\/\/(localhost|127\.0\.0\.1|hirel{1,2}y)/i.test(t.url));
}

async function deliverPendingToOpenTabs() {
  const tabs = await findHirelyTabs();
  if (!tabs.length) return false;

  const data = await getStorage([STORAGE_KEYS.PENDING_ACTIONS]);
  const pending = data[STORAGE_KEYS.PENDING_ACTIONS] || [];
  if (!pending.length) return true;

  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'PROCESS_PENDING_ACTIONS',
        actions: pending,
      }).catch(() => {});
    }
  }
  return true;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      switch (msg.type) {
        case 'HIRELY_SYNC_FROM_SITE': {
          const updates = {};
          if (Array.isArray(msg.analyses)) {
            updates[STORAGE_KEYS.ANALYSES] = msg.analyses;
          }
          if (Array.isArray(msg.applications)) {
            updates[STORAGE_KEYS.APPLICATIONS] = msg.applications;
          }
          if (msg.origin && typeof msg.origin === 'string') {
            updates[STORAGE_KEYS.API_ORIGIN] = msg.origin;
          }
          await setStorage(updates);
          await broadcastResumeUpdate();
          sendResponse({ ok: true });
          break;
        }

        case 'GET_EXTENSION_STATE': {
          const { activeResume, analyses } = await resolveActiveResume();
          const data = await getStorage([
            STORAGE_KEYS.SAVED_JOBS,
            STORAGE_KEYS.API_ORIGIN,
            STORAGE_KEYS.WIDGET_MINIMIZED,
            STORAGE_KEYS.APPLICATIONS,
          ]);
          sendResponse({
            ok: true,
            activeResume,
            analyses,
            savedJobs: data[STORAGE_KEYS.SAVED_JOBS] || [],
            applications: data[STORAGE_KEYS.APPLICATIONS] || [],
            apiOrigin: data[STORAGE_KEYS.API_ORIGIN] || DEFAULT_ORIGIN,
            widgetMinimized: Boolean(data[STORAGE_KEYS.WIDGET_MINIMIZED]),
          });
          break;
        }

        case 'SET_ACTIVE_RESUME': {
          await setStorage({ [STORAGE_KEYS.ACTIVE_ID]: msg.resumeId });
          await broadcastResumeUpdate();
          sendResponse({ ok: true });
          break;
        }

        case 'SET_WIDGET_MINIMIZED': {
          await setStorage({ [STORAGE_KEYS.WIDGET_MINIMIZED]: Boolean(msg.minimized) });
          sendResponse({ ok: true });
          break;
        }

        case 'SAVE_MANUAL_RESUME': {
          const text = String(msg.resumeText || '').trim();
          const skills = HirelyMatcher.extractSkillsFromText(text);
          const firstLine = text.split(/\r?\n/).map((l) => l.trim()).find(Boolean) || 'Extension Resume';
          const manualObj = {
            id: 'ext-manual-resume',
            fileName: `${firstLine.slice(0, 28)} (Extension Paste)`,
            isManual: true,
            resumeText: text,
            scores: { overall: 78 },
            ats: { score: 80 },
            skills: { detected: skills, recommended: [] },
            extracted: { name: firstLine.slice(0, 40), skills, experience: [], location: '' },
            updatedAt: new Date().toISOString(),
          };
          await setStorage({
            [STORAGE_KEYS.MANUAL_RESUME]: manualObj,
            [STORAGE_KEYS.ACTIVE_ID]: manualObj.id,
          });
          await broadcastResumeUpdate();
          sendResponse({ ok: true, resume: manualObj });
          break;
        }

        case 'SAVE_JOB_AND_QUEUE': {
          const job = msg.job || {};
          const data = await getStorage([STORAGE_KEYS.SAVED_JOBS, STORAGE_KEYS.PENDING_ACTIONS]);
          const savedJobs = Array.isArray(data[STORAGE_KEYS.SAVED_JOBS]) ? data[STORAGE_KEYS.SAVED_JOBS] : [];
          const pending = Array.isArray(data[STORAGE_KEYS.PENDING_ACTIONS]) ? data[STORAGE_KEYS.PENDING_ACTIONS] : [];

          const normKey = `${(job.company || '').toLowerCase()}::${(job.title || '').toLowerCase()}`;
          const existingIdx = savedJobs.findIndex(
            (j) => (job.url && j.url === job.url) || `${(j.company || '').toLowerCase()}::${(j.position || '').toLowerCase()}` === normKey
          );

          const entry = {
            id: existingIdx >= 0 ? savedJobs[existingIdx].id : `ext-job-${Date.now()}`,
            company: job.company || 'Company',
            position: job.title || 'Open Role',
            location: job.location || 'LinkedIn',
            url: job.url || '',
            description: (job.description || '').slice(0, 5000),
            matchScore: job.matchScore || 0,
            matchedSkills: job.matchedSkills || [],
            missingSkills: job.missingSkills || [],
            resumeId: job.resumeId || '',
            savedAt: new Date().toISOString(),
            syncedToWeb: false,
          };

          if (existingIdx >= 0) {
            savedJobs[existingIdx] = { ...savedJobs[existingIdx], ...entry };
          } else {
            savedJobs.unshift(entry);
          }

          const action = {
            id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'EXT_SAVE_APPLICATION',
            payload: entry,
            createdAt: Date.now(),
          };

          await setStorage({
            [STORAGE_KEYS.SAVED_JOBS]: savedJobs.slice(0, 100),
            [STORAGE_KEYS.PENDING_ACTIONS]: [...pending, action],
          });

          await deliverPendingToOpenTabs();
          sendResponse({ ok: true, entry });
          break;
        }

        case 'REMOVE_SAVED_JOB': {
          const data = await getStorage([STORAGE_KEYS.SAVED_JOBS]);
          const filtered = (data[STORAGE_KEYS.SAVED_JOBS] || []).filter((j) => j.id !== msg.jobId);
          await setStorage({ [STORAGE_KEYS.SAVED_JOBS]: filtered });
          sendResponse({ ok: true, savedJobs: filtered });
          break;
        }

        case 'SEND_ACTION_TO_HIRELY': {
          const origin = await getOrigin();
          const data = await getStorage([STORAGE_KEYS.PENDING_ACTIONS]);
          const pending = Array.isArray(data[STORAGE_KEYS.PENDING_ACTIONS]) ? data[STORAGE_KEYS.PENDING_ACTIONS] : [];

          const action = {
            id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: msg.actionType,
            payload: msg.payload || {},
            createdAt: Date.now(),
          };

          // Replace previous same navigation action so only latest intentional click opens
          const filteredPending = pending.filter((a) => a.type === 'EXT_SAVE_APPLICATION');
          filteredPending.push(action);

          await setStorage({ [STORAGE_KEYS.PENDING_ACTIONS]: filteredPending });

          const routeMap = {
            EXT_TAILOR_JOB: '/dashboard?ext=tailor',
            EXT_OPEN_JOB_MODAL: `/jobs?extModal=${encodeURIComponent(msg.payload?.modalType || 'interview')}`,
            EXT_IMPORT_PROFILE: '/upload?extImport=1',
            EXT_OPEN_DASHBOARD: '/dashboard',
          };
          const targetPath = msg.targetPath || routeMap[msg.actionType] || '/dashboard';
          const targetUrl = `${origin}${targetPath}`;

          const existingTabs = await findHirelyTabs();
          if (existingTabs.length > 0 && existingTabs[0].id) {
            const tab = existingTabs[0];
            await chrome.tabs.update(tab.id, { active: true });
            if (tab.windowId) {
              await chrome.windows.update(tab.windowId, { focused: true }).catch(() => {});
            }
            // Deliver message directly + navigate if requested
            chrome.tabs.sendMessage(tab.id, {
              type: 'PROCESS_PENDING_ACTIONS',
              actions: filteredPending,
            }).catch(() => {
              chrome.tabs.update(tab.id, { url: targetUrl });
            });
          } else {
            await chrome.tabs.create({ url: targetUrl });
          }

          sendResponse({ ok: true });
          break;
        }

        case 'GET_PENDING_ACTIONS': {
          const data = await getStorage([STORAGE_KEYS.PENDING_ACTIONS]);
          sendResponse({ ok: true, actions: data[STORAGE_KEYS.PENDING_ACTIONS] || [] });
          break;
        }

        case 'ACK_PENDING_ACTIONS': {
          const ackIds = new Set(msg.ids || []);
          const data = await getStorage([STORAGE_KEYS.PENDING_ACTIONS, STORAGE_KEYS.SAVED_JOBS]);
          const remaining = (data[STORAGE_KEYS.PENDING_ACTIONS] || []).filter((a) => !ackIds.has(a.id));
          const savedJobs = (data[STORAGE_KEYS.SAVED_JOBS] || []).map((j) => ({
            ...j,
            syncedToWeb: true,
          }));
          await setStorage({
            [STORAGE_KEYS.PENDING_ACTIONS]: remaining,
            [STORAGE_KEYS.SAVED_JOBS]: savedJobs,
          });
          sendResponse({ ok: true });
          break;
        }

        case 'CALL_HIRELY_API': {
          const result = await callHirelyApi(msg.endpoint, msg.payload);
          sendResponse(result);
          break;
        }

        case 'GENERATE_RECRUITER_NOTE': {
          const { job, resume, matchResult } = msg;
          const hitSkills = (matchResult?.matchedSkills || []).slice(0, 3).join(', ') || 'relevant domain experience';
          const candidateName = resume?.extracted?.name || '';

          const prompt = `Write TWO short, punchy, ready-to-send LinkedIn messages for a candidate applying to "${job.title}" at "${job.company}".
Candidate top matched skills: ${hitSkills}.
Job snippet: ${(job.description || '').slice(0, 1200)}

Format strictly as:
1) CONNECTION NOTE (under 290 characters, warm and direct)
2) RECRUITER INMAIL / COVER NOTE (3-4 crisp sentences highlighting impact & skills matching the role)

Do not add generic filler or brackets.`;

          const res = await callHirelyApi('coach', {
            message: prompt,
            resumeContext: resume
              ? {
                  name: resume.extracted?.name,
                  title: resume.jobTarget?.title,
                  skills: resume.skills?.detected || [],
                  atsScore: resume.ats?.score,
                  targetJob: `${job.title} at ${job.company}`,
                  resumeSnippet: (resume.resumeText || '').slice(0, 1800),
                }
              : undefined,
          });

          if (res.ok && res.data && res.data.reply) {
            sendResponse({ ok: true, text: res.data.reply });
          } else {
            // Instant high-quality deterministic fallback
            const fallback = `CONNECTION NOTE (<300 chars):
Hi! I noticed the ${job.title} opening at ${job.company}. With hands-on experience in ${hitSkills}, I'd love to connect and learn more about the team!${candidateName ? ' — ' + candidateName.split(' ')[0] : ''}

RECRUITER / COVER NOTE:
Hi Hiring Team at ${job.company},

I recently applied for the ${job.title} role and wanted to share why my background is a strong fit. Across my recent work, I've built production projects leveraging ${hitSkills}, aligning directly with what your team is seeking. I'd welcome the chance to discuss how I can contribute quickly to ${job.company}.

Best regards${candidateName ? ',\n' + candidateName : ''}`;
            sendResponse({ ok: true, text: fallback, offlineFallback: true });
          }
          break;
        }

        default:
          sendResponse({ ok: false, error: 'Unknown message type' });
      }
    } catch (err) {
      sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  })();
  return true; // keep channel open for async response
});

