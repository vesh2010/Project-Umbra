# Windows desktop companion

This runs the same Meeting Companion interface in an Electron window with `setContentProtection(true)` enabled before the window is shown. On Windows 10 version 2004 and later, Electron requests `WDA_EXCLUDEFROMCAPTURE`: supported capture tools omit the window from a full display capture. Older Windows versions can show a black rectangle. This is a best-effort platform feature, not universal invisibility.

From this folder run `npm install`, then `npm start`. Enter your API key, start capture, and choose your display before sharing in the meeting. This version captures **all system audio**, optionally mixed with your microphone. The assistant stays on top. Closing its window stops capture.

Before relying on it, share your full display in the actual meeting app and inspect the remote viewer or sharing preview. Check while moving and resizing the assistant. Native permission/source dialogs and any other windows are not covered. Do not assume a local `isContentProtected()` flag proves what recipients see. Capture implementations and remote desktop software vary.

The Chrome extension itself still cannot exclude its window from entire-screen sharing. Use this desktop entry point for native capture exclusion.

## Local capture verification

Run `npm start -- --capture-test` to compare full-display captures with protection disabled and enabled, using a temporary blank backdrop and a colored marker. The test also focuses the backdrop to check that the assistant remains above it. It writes images and a JSON report to `test-results`, restores protection, and leaves the assistant running. Do not run this diagnostic while sharing: its control phase deliberately disables protection briefly. Taskbar icons remain visible. This verifies the local Electron capture path, not the remote output of Teams, Meet, or Zoom.

For compact mode, close the running app and run `npm start -- --capture-test --compact-test --compact-only`. This tests the real Compact button, window size, and capture exclusion, then leaves the compact overlay open. A fresh launch gives the comparison capture a clean starting state. The report requires a visible control marker while the overlay is unfocused, and no marker after protection is enabled.

Implementation reference: [free-cluely WindowHelper](https://github.com/Prat011/free-cluely/blob/712ddb3474af22886cd47786f7bb0f0a5bf526df/electron/WindowHelper.ts#L102). Documentation: [Electron capture protection](https://www.electronjs.org/docs/latest/api/browser-window#winsetcontentprotectionenable-macos-windows).

