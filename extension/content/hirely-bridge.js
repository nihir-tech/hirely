/**
 * Hirely Web Bridge Content Script
 * Runs on hirelly.vercel.app (and localhost during dev) to sync resumes/applications
 * with Chrome storage and deliver actions triggered from LinkedIn.
 */

(() => {
  const host = window.location.hostname;
  if (host !== 'localhost' && host !== '127.0.0.1' && !/^hirel{1,2}y/i.test(host)) {
    return;
  }

  const ANALYSIS_KEY = 'hirely:analyses';
  const APPLICATIONS_KEY = 'hirely:applications';

  function readLocalJson(key) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function syncSiteStateToExtension(explicitPayload) {
    const analyses = explicitPayload?.analyses ?? readLocalJson(ANALYSIS_KEY);
    const applications = explicitPayload?.applications ?? readLocalJson(APPLICATIONS_KEY);
    chrome.runtime.sendMessage({
      type: 'HIRELY_SYNC_FROM_SITE',
      analyses,
      applications,
      origin: window.location.origin,
    }).catch(() => {});
  }

  function forwardActionsToApp(actions) {
    if (!Array.isArray(actions) || !actions.length) return;
    window.postMessage(
      {
        source: 'hirely-extension',
        type: 'HIRELY_EXT_ACTIONS',
        actions,
      },
      '*'
    );
  }

  function pullPendingActions() {
    chrome.runtime.sendMessage({ type: 'GET_PENDING_ACTIONS' }, (res) => {
      if (chrome.runtime.lastError) return;
      if (res?.ok && Array.isArray(res.actions) && res.actions.length > 0) {
        forwardActionsToApp(res.actions);
      }
    });
  }

  // Listen for messages from the Hirely React app
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.source !== 'hirely-app') return;

    if (event.data.type === 'HIRELY_APP_READY') {
      syncSiteStateToExtension(event.data.payload);
      pullPendingActions();
    } else if (event.data.type === 'HIRELY_SYNC_STATE') {
      syncSiteStateToExtension(event.data.payload);
    } else if (event.data.type === 'HIRELY_EXT_ACK') {
      const ids = event.data.ids || [];
      if (ids.length) {
        chrome.runtime.sendMessage({ type: 'ACK_PENDING_ACTIONS', ids }).catch(() => {});
      }
    }
  });

  // Listen for live commands from background worker
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === 'PROCESS_PENDING_ACTIONS' && Array.isArray(msg.actions)) {
      forwardActionsToApp(msg.actions);
    } else if (msg?.type === 'REQUEST_IMMEDIATE_SYNC') {
      syncSiteStateToExtension();
    }
  });

  // Initial sync on load + retry pending delivery after React mounts
  syncSiteStateToExtension();
  setTimeout(() => {
    syncSiteStateToExtension();
    pullPendingActions();
  }, 600);
})();

