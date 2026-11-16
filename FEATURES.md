# Public feature review and implementation

Reviewed 14 November 2026. This is an independent Meeting Companion implementation based on publicly described functionality, not Cluely's private code or a claim of feature parity. Some public help pages describe different historical versions; claims were not independently verified in Cluely's paid app.

## Live meeting assistance

Cluely documents a movable meeting widget, on-demand assistance, suggested wording, follow-up questions, recaps, custom questions, and screen context. [Live assistant guide](https://support.cluely.com/en/articles/12294306-how-to-use-cluely).

Implemented here: the same categories of assistance, an editable question composer, optional screen context, system audio plus optional microphone, manual start/stop, elapsed time, and a compact always-on-top desktop view. Audio uses independent 6/12/20-second segments plus API processing time, not low-latency streaming. No speaker identification or automatic meeting detection. The assistant never joins a call as a participant.

## Notes and history

Cluely's dashboard documents saved notes, transcripts, session resumption, editing, next steps, sharing, and calendar briefs. [Dashboard guide](https://support.cluely.com/en/articles/12101340-how-to-use-cluely-s-dashboard-app).

Implemented here: explicit local saving; searchable title, notes and transcript; reopening/resuming; editable summaries; deletion; transcript/answer copying; Markdown export; follow-up email drafts; optionally generating notes after stopping. A checkbox supplies up to 30,000 characters from recent saved meetings to AI. There is no semantic search across unlimited history, cloud sync, public sharing URL, calendar integration, participant research, or automatic meeting reminders. Unsaved work is lost on close.

## Context and research

Cluely describes customizable prompts, mode templates, and uploaded reference documents. [Customization guide](https://support.cluely.com/en/articles/12006358-how-to-customize-cluely).

Implemented here: general, technical, sales and learning presets; custom instructions; editable note template; reference text files (.txt, .md, .csv, .json). Limits: 3 files, 100 KB per file, 20,000 total characters. File text is memory-only. PDF/Word parsing and a persistent document knowledge base remain unimplemented.

Cluely's Smart mode includes web research and more advanced reasoning. [Smart mode guide](https://support.cluely.com/en/articles/12063703-how-to-use-smart-mode).

Implemented here: optional OpenAI web search in Responses requests, with clickable HTTPS citations from returned annotations. It uses the selected answer model; no automatic model routing or performance guarantee. Web search incurs API charges and requires compatible model/account access. Live calls have not been tested with a real key.

## Desktop controls and settings

Cluely documents language choices, keybindings, appearance, auto-launch and calendars. [Settings guide](https://support.cluely.com/en/articles/12418681-how-to-use-cluely-s-settings).

Implemented here: input/output language settings, dark/light appearance, opacity, fixed global assist/hide/move shortcuts, compact/expanded overlay, saved preferences and editable model names. Shortcut conflicts are reported. Custom shortcut editing, auto-launch and automatic updates are not implemented.

## Screen capture protection

Cluely advertises capture exclusion and provides a test page. [Public undetectability page](https://cluely.com/undetectability).

The Windows companion uses Electron's native capture exclusion before showing the window. Local full-display capture was tested with an unprotected control and a protected image. Always-on-top was checked while another window had focus. This does not establish remote Teams/Meet/Zoom behavior or universal invisibility. The taskbar icon and native dialogs can remain visible. The Chrome extension cannot provide native exclusion.

## Account/service features

Cluely also describes service plans, account management and mobile availability. [Pricing](https://cluely.com/pricing), [homepage](https://cluely.com/).

This project is a personal local app with your own API account. Billing tiers, accounts, subscriptions, team administration, mobile clients, and hosted storage were not implemented. No Cluely branding or assets are used.

## Verification

Run `npm start -- --workspace-test` from `desktop` for a separate in-memory test profile. It exercises history save/search/resume, request construction with mocked AI responses, safe citation rendering, notes, clear behavior, compact resizing and reload persistence without saving an API key. This does not test live audio/API quality.

Run `npm start -- --capture-test` for local capture verification. Its control phase temporarily disables exclusion; do not run it during a real screen share. Results go to `desktop/test-results`.

