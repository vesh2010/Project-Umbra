# Meeting Companion for Chrome

A local, unpacked Manifest V3 extension with a separate assistant window. It transcribes meeting audio in approximately 12-second segments, drafts answers using the transcript and an optional current screen snapshot, summarizes discussions, and exports notes as text. Optional automatic question answering is off by default. Answers are suggestions and can be wrong.

The expanded desktop workspace includes a compact overlay, reply suggestions, follow-up questions, recap, email drafts, editable notes, saved meeting search/resume, custom context, text file attachments, language settings, and optional web research. See [feature inventory and remaining gaps](FEATURES.md). Transcription intervals are configurable; exports are Markdown.

With the assistant window focused, press **Ctrl+Shift+Enter** for a draft answer or **Ctrl+Shift+S** for a summary. These are window shortcuts, not system-wide shortcuts.

## Install

1. Open `chrome://extensions` in Chrome 116 or later.
2. Enable **Developer mode**, select **Load unpacked**, and select this `meeting-assistant` folder (the one containing `manifest.json`).
3. Pin **Meeting Companion** from Chrome's Extensions menu, then click its icon.
4. Enter your own OpenAI API key. Your account must have API billing and access to the configured models. ChatGPT subscriptions do not supply API credits. Model names are editable.
5. Get agreement from participants, check the agreement box, and optionally enable your microphone.
6. Click **Start capture**. Choose the meeting's Chrome tab and turn on **Share tab audio** in Chrome's picker. If no audio track is supplied, the assistant will explain how to retry.
7. Keep the assistant window open. Closing it ends capture and discards unsaved notes. Stop capture, wait for processing, then use **Save meeting locally** or **Export Markdown** before closing.

## Screen sharing

For Windows native capture exclusion during entire-screen sharing, use the [desktop companion](desktop/README.md): open a terminal in `desktop` and run `npm start` after installing its dependencies with `npm install`. This is a separate desktop launch of the same assistant. Validate it in your meeting app; exclusion is not guaranteed for every capture method.

In your meeting app, share only the meeting tab or a specific presentation window. The assistant lives in a separate window and injects nothing into the meeting page. It cannot guarantee invisibility during entire-screen sharing, suppress Chrome's capture indicators, or hide itself from other capture software. Check your meeting's sharing preview. Capturing a minimized source window can freeze its video; keep the source visible when screen context matters.

Choose the screen/window in Chrome's capture picker if you need broader screen context, but available audio varies by OS and source. For desktop meeting apps, system audio support depends on Chrome/Windows; tab capture is the most reliable path. The extension cannot read another application's audio when Chrome provides no audio track.

## Data and credentials

- Audio segments go directly from the extension to OpenAI for transcription. Transcripts and optional current JPEG screen snapshots go to OpenAI for drafting. There is no developer server, telemetry, content script, or automatic sending of replies into meetings.
- The API key is memory-only. Explicitly saved meetings and preferences persist in local app storage; reference files remain in memory. Local meeting storage is not application-encrypted. This is intended for personal local use: a distributed product should use a backend rather than asking users to enter long-lived API keys in a client.
- Responses use `store: false`; provider processing and retention policies still apply. This does not claim zero data retention.
- Disable **Include a screen snapshot** for audio-only assistance. Capture stops immediately on **Stop**, but segments already queued may finish processing. Requests already sent cannot be recalled.
- Audio recording uses independent WebM segments. There can be small gaps at segment boundaries, transcription delay, missing context across segments, and transcription mistakes. It does not identify speakers. If the API falls behind, segments beyond five queued requests are dropped with a warning.
- Summaries and answers use the latest 24,000 transcript characters. Optional saved-meeting context is limited to 30,000 characters. Exports contain the complete in-memory transcript, editable notes, and generated drafts. Save meetings explicitly; they are not saved automatically.

## Validation

`node --check background.js` and `node --check assistant.js` check JavaScript syntax. Live validation requires Chrome, a microphone if enabled, and an API key. Check these manually: picker cancel; missing shared audio; mic denial; stop from Chrome's sharing indicator; stop/restart; transcript and optional screen-based question; export; invalid key handling; sharing preview with a tab versus full screen.

API references: [Chrome screen capture](https://developer.chrome.com/docs/extensions/how-to/web-platform/screen-capture), [OpenAI transcription](https://developers.openai.com/api/reference/resources/audio/subresources/transcriptions/methods/create), [OpenAI Responses](https://developers.openai.com/api/reference/resources/responses/methods/create).

The shortcut workflow was informed by [free-cluely](https://github.com/Prat011/free-cluely), an Apache-2.0 Electron application. Its native overlay and global shortcut implementation were not copied because Chrome extensions do not provide equivalent desktop window controls.

