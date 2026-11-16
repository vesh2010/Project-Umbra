let opening = false;
chrome.action.onClicked.addListener(async () => {
  if (opening) return;
  opening = true;
  try {
    const url = chrome.runtime.getURL('assistant.html');
    const windows = await chrome.windows.getAll({populate: true});
    const existing = windows.find(w => w.tabs?.some(t => t.url === url));
    if (existing) await chrome.windows.update(existing.id, {focused: true, state: 'normal'});
    else await chrome.windows.create({url, type: 'popup', width: 520, height: 850});
  } finally { opening = false; }
});

