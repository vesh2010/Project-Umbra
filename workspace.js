/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Meeting Companion â€” Workspace Features
   Shares capture state from assistant.js; no API key is persisted.
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

/* â”€â”€ Constants â”€â”€ */
const MAX_HISTORY_CONTEXT_CHARS = 30000;
const MAX_FILE_SIZE_BYTES = 102400;
const MAX_FILE_COUNT = 3;
const MAX_REFERENCE_CHARS = 20000;
const TOAST_DURATION_MS = 3000;

const preferenceIds = ['model', 'audioModel', 'language', 'outputLanguage', 'interval', 'scanInterval', 'autoNotes', 'lightTheme', 'mode', 'customPrompt', 'noteTemplate', 'screenDetect'];
let referenceFiles = [];
let clockInterval = null;

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Storage Helpers
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function readLocal(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    error('Local storage is full or unavailable. Export notes before closing.');
    return false;
  }
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Toast Notifications
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function toast(message) {
  const container = $('toasts');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  container.append(el);
  setTimeout(() => el.remove(), TOAST_DURATION_MS);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Tab Navigation
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function showTab(name) {
  document.querySelectorAll('.tab-panel').forEach(panel => { panel.hidden = panel.id !== name; });
  document.querySelectorAll('[data-tab]').forEach(button => button.classList.toggle('selected', button.dataset.tab === name));
}

document.querySelectorAll('[data-tab]').forEach(button => button.onclick = () => showTab(button.dataset.tab));

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Preferences
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

for (const id of preferenceIds) {
  const value = readLocal('companion-preferences', {})[id];
  if (value !== undefined) {
    if ($(id).type === 'checkbox') $(id).checked = !!value;
    else $(id).value = String(value);
  }
}

function theme() { document.body.classList.toggle('light', $('lightTheme').checked); }
theme();
$('lightTheme').onchange = theme;

function savePreferences() {
  const settings = Object.fromEntries(
    preferenceIds.map(id => [id, $(id).type === 'checkbox' ? $(id).checked : $(id).value])
  );
  if (writeLocal('companion-preferences', settings)) {
    status('Preferences saved on this device.');
    toast('Preferences saved');
  }
}

$('savePreferences').onclick = savePreferences;
$('saveSettings').onclick = savePreferences;

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Quick Actions
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

for (const mode of ['say', 'followup', 'recap', 'email']) {
  $(mode).onclick = () => draft(mode).catch(error);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Screen Question Detection Toggle
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

if ($('screenDetect')) {
  $('screenDetect').onchange = () => {
    if (active && $('screenDetect').checked && $('vision').checked) {
      startScreenScanning();
      toast('Screen question detection enabled');
    } else {
      stopScreenScanning();
    }
  };
}

if ($('vision')) {
  const originalVisionChange = $('vision').onchange;
  $('vision').onchange = () => {
    if (originalVisionChange) originalVisionChange();
    // Stop screen scanning if vision is disabled
    if (!$('vision').checked) stopScreenScanning();
    else if (active && $('screenDetect')?.checked) startScreenScanning();
  };
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Clipboard
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    status('Copied to clipboard.');
    toast('Copied to clipboard');
  } catch {
    error('Clipboard access failed. Select and copy the text manually.');
  }
}

$('copyReply').onclick = () => copy($('reply').textContent);
$('copyTranscript').onclick = () => copy(notes.map(n => `[${n.time}] ${n.text}`).join('\n'));

$('clearChat').onclick = () => {
  if (thinking) return status('Wait for the current answer to finish.');
  answers = [];
  lastAutoAsked = '';
  $('reply').textContent = 'AI conversation cleared. Meeting transcript is retained.';
  $('sources').replaceChildren();
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Click-to-Copy Transcript Entries
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

$('transcript').addEventListener('click', e => {
  const entry = e.target.closest('.entry');
  if (!entry) return;
  const text = entry.querySelector('span')?.textContent;
  if (text) copy(text);
});

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Transcript Word Count
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function updateTranscriptCount() {
  const el = $('transcriptCount');
  if (!el) return;
  if (!notes.length) { el.textContent = ''; return; }
  const totalWords = notes.reduce((sum, n) => sum + n.text.split(/\s+/).filter(Boolean).length, 0);
  el.textContent = `${notes.length} segment${notes.length !== 1 ? 's' : ''} Â· ${totalWords.toLocaleString()} words`;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Reference Files
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

$('contextFiles').onchange = async () => {
  const selected = Array.from($('contextFiles').files);
  if (selected.length > MAX_FILE_COUNT || selected.some(f => f.size > MAX_FILE_SIZE_BYTES || !/\.(txt|md|csv|json)$/i.test(f.name))) {
    return error(`Choose up to ${MAX_FILE_COUNT} text files, each under ${MAX_FILE_SIZE_BYTES / 1024} KB.`);
  }
  try {
    const files = await Promise.all(selected.map(async f => ({ name: f.name, text: await f.text() })));
    if (files.reduce((n, f) => n + f.text.length, 0) > MAX_REFERENCE_CHARS) {
      return error(`Reference files exceed the ${MAX_REFERENCE_CHARS.toLocaleString()} character limit. Use shorter excerpts.`);
    }
    referenceFiles = files;
    $('fileList').textContent = files.map(f => `${f.name} Â· ${f.text.length.toLocaleString()} characters`).join(' / ');
    toast(`${files.length} file${files.length > 1 ? 's' : ''} loaded`);
  } catch (e) { error(e); }
};

$('clearFiles').onclick = () => {
  referenceFiles = [];
  $('contextFiles').value = '';
  $('fileList').textContent = '';
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Meeting Storage
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function meetings() {
  const data = readLocal('companion-meetings', []);
  return Array.isArray(data)
    ? data.filter(m => m && typeof m.id === 'string' && Array.isArray(m.transcript) && Array.isArray(m.answers))
    : [];
}

function busy() {
  return active || starting || pending || finishing || thinking;
}

$('saveMeeting').onclick = () => {
  if (busy()) return status('Stop capture and wait for processing before saving a complete meeting.');
  if (!notes.length && !answers.length && !$('meetingNotes').value) return status('There are no notes to save yet.');
  const id = window.currentMeetingId || crypto.randomUUID();
  const list = meetings();
  const previous = list.find(m => m.id === id);
  const item = {
    id,
    title: $('meetingTitle').value.trim() || 'Untitled meeting',
    created: previous?.created || new Date().toISOString(),
    updated: new Date().toISOString(),
    transcript: notes,
    answers,
    summary: $('meetingNotes').value,
    duration: sessionElapsed
  };
  if (writeLocal('companion-meetings', [item, ...list.filter(m => m.id !== id)])) {
    window.currentMeetingId = id;
    renderMeetings();
    status('Meeting saved on this device.');
    toast('Meeting saved');
  }
};

function loadMeeting(item) {
  if (busy()) return status('Stop capture and wait for processing before opening another meeting.');
  if ((notes.length || answers.length || $('meetingNotes').value) &&
      !confirm('Open this meeting? Save current changes first if you want to keep them.')) return;
  generation++;
  notes = item.transcript.map(n => ({ time: String(n.time), text: String(n.text) }));
  answers = item.answers.map(String);
  sessionElapsed = Number(item.duration) || 0;
  lastAutoAsked = '';
  lastAutoSegment = '';
  window.currentMeetingId = item.id;
  $('meetingTitle').value = item.title;
  $('meetingNotes').value = item.summary || '';
  $('transcript').replaceChildren();
  for (const n of notes) {
    const entry = document.createElement('div');
    entry.className = 'entry';
    const time = document.createElement('time');
    time.textContent = n.time;
    const text = document.createElement('span');
    text.textContent = n.text;
    entry.append(time, text);
    $('transcript').append(entry);
  }
  $('reply').textContent = answers.at(-1) || 'Meeting loaded. Ask a follow-up question or start capture to resume.';
  $('sources').replaceChildren();
  showTab('live');
  status('Meeting loaded. Start session to resume recording.');
  updateTranscriptCount();
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Meeting List
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function renderMeetings() {
  const q = $('historySearch').value.toLowerCase();
  $('meetingList').replaceChildren();
  const list = meetings().filter(m =>
    [m.title, m.summary, ...m.transcript.map(n => n.text)].join(' ').toLowerCase().includes(q)
  );
  if (!list.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No saved meetings found. Save a session from Live assist to see it here.';
    $('meetingList').append(empty);
  }
  for (const item of list) {
    const card = document.createElement('article');
    card.className = 'history-item';

    const title = document.createElement('strong');
    title.textContent = item.title;

    const date = document.createElement('small');
    date.textContent = new Date(item.created).toLocaleString();

    const preview = document.createElement('p');
    preview.textContent = (item.summary || item.transcript.map(n => n.text).join(' ')).slice(0, 240);

    const open = document.createElement('button');
    open.textContent = 'Open / resume';
    open.onclick = () => loadMeeting(item);

    const remove = document.createElement('button');
    remove.textContent = 'Delete';
    remove.className = 'secondary';
    remove.onclick = () => {
      if (confirm(`Delete saved meeting "${item.title}" from this device?`) &&
          writeLocal('companion-meetings', meetings().filter(m => m.id !== item.id))) {
        if (window.currentMeetingId === item.id) window.currentMeetingId = null;
        renderMeetings();
        toast('Meeting deleted');
      }
    };

    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.append(open, remove);
    card.append(title, date, preview, actions);
    $('meetingList').append(card);
  }
}

$('historySearch').oninput = renderMeetings;
renderMeetings();

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Workspace Context
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

window.workspaceContext = () => {
  const history = $('useHistory').checked
    ? meetings()
        .map(m => `Meeting: ${m.title} (${m.created})\nNotes: ${m.summary}\nTranscript: ${m.transcript.map(n => n.text).join('\n')}`)
        .join('\n\n')
        .slice(0, MAX_HISTORY_CONTEXT_CHARS)
    : '';
  return `Reference files:\n${referenceFiles.map(f => `${f.name}:\n${f.text}`).join('\n')}\nSaved meetings (most recent first; limited to ${MAX_HISTORY_CONTEXT_CHARS.toLocaleString()} characters):\n${history}`;
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Source Citations
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

window.renderSources = result => {
  $('sources').replaceChildren();
  const seen = new Set();
  for (const annotation of (result.output || []).flatMap(o => o.content || []).flatMap(c => c.annotations || [])) {
    if (annotation.type !== 'url_citation' || seen.has(annotation.url)) continue;
    let url;
    try { url = new URL(annotation.url); } catch { continue; }
    if (url.protocol !== 'https:') continue;
    seen.add(annotation.url);
    const link = document.createElement('a');
    link.href = url.href;
    link.textContent = annotation.title || url.hostname;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    if (window.meetingDesktop) {
      link.onclick = e => { e.preventDefault(); window.meetingDesktop.openLink(url.href); };
    }
    $('sources').append(link);
  }
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Session Clock
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

clockInterval = setInterval(() => {
  const elapsed = sessionElapsed + (active ? Date.now() - sessionStarted : 0);
  const mins = Math.floor(elapsed / 60000).toString().padStart(2, '0');
  const secs = Math.floor((elapsed / 1000) % 60).toString().padStart(2, '0');
  $('clock').textContent = `${mins}:${secs}`;
  $('recordingDot').classList.toggle('recording', active);
  $('sessionLabel').textContent = active
    ? 'Listening to your conversation'
    : pending || finishing
      ? 'Finishing transcriptâ€¦'
      : 'Ready for your next conversation';
}, 1000);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Desktop Integration
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

if (window.meetingDesktop) {
  document.body.classList.add('desktop');
  $('protection').textContent = 'Capture exclusion on';

  $('hide').onclick = () => window.meetingDesktop.control('hide');
  $('quit').onclick = () => window.meetingDesktop.control('close');

  $('compact').onclick = () => {
    const compact = document.body.classList.toggle('compact');
    $('compact').textContent = compact ? 'Expand' : 'Compact';
    showTab('live');
    window.meetingDesktop.control(compact ? 'compact' : 'expand');
  };

  $('opacity').oninput = () => window.meetingDesktop.setOpacity(Number($('opacity').value) / 100);

  window.meetingDesktop.onAction(action => {
    if (action === 'assist') {
      showTab('live');
      void draft().catch(error);
    }
  });

  window.meetingDesktop.getShortcuts().then(result => {
    $('shortcutStatus').textContent = result.failed.length
      ? `Unavailable shortcuts: ${result.failed.join(', ')}. Another app may have reserved them.`
      : 'Global shortcuts are registered.';
  });
}

