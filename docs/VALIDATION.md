# Validation record

Validation was performed in the cloud Linux workspace with Node.js 24.19.0 and system Chromium 154. No installer analysis was repeated after the initial extraction; tests were rerun only for changed behavior or a failed selector.

## Passed

- Production Vite build, including lazy PDF.js worker and PowerPoint-export bundles.
- **10 Node tests**: full corpus inventory, aliases/ranges/spoken references, phrase matching, typo tolerance, bounded negative search, Unicode imports, API validation, state persistence/restart, SSE output updates, and configured AI-adapter request/response handling against a mock provider.
- **9 distinct Chromium scenarios across targeted runs**: search/preview/live/blackout/reload; rapid queue changes/reordering/notes; slide authoring and PPTX round-trip; dictionary/theme changes; transcript persistence and DOCX export; local content outlines and draft-to-slides; media upload/preview; malformed-backup rejection; PDF/DOCX text import.
- Desktop and 390-pixel browser layout inspection: no browser page errors or horizontal overflow in the captured workflow. The sampled output content fits its 1280×720 frame (468-pixel content height). See [shepherd-pro-studio.png](shepherd-pro-studio.png).
- Current server health and representative scripture request. The server listens on loopback and reports `Shepherd Pro`.
- Desktop shell launched successfully under Linux Electron with a virtual display: operator window loaded, John 3:16 went live, and a separately opened output window synchronized the same reference. The process closed after the check. Desktop dependency installation and lockfile were validated.

The first browser run passed 7 of 8 tests; the final test used an exact navigation-button name that included a keyboard hint. The locator was corrected, and that test passed on its targeted retry. Two later focused checks (presentation after text-fit changes and new PDF/DOCX import) completed with the runner's saved status `passed`.

The Linux desktop launch initially could not open a window without a display. Using Xvfb resolved the host display prerequisite; the same operator/output smoke flow then passed. Mac behavior is still distinct from this Linux check.

## Not verified / not implemented

- No Pewbeam runtime was executed: all Pewbeam findings are static and bounded by the evidence report.
- No Mac hardware, microphone, fullscreen external display, signed/notarized DMG, or native broadcast provider was tested.
- No real AI provider was configured or called. The integration test uses a local mock, and the app reports that AI is unconfigured.
- Microphone capture depends on user/OS permission. Local Whisper executable/model installation and real-audio accuracy remain unverified.
- Neural and offline speech integration code is present; real model inference and Pewbeam parity remain unverified. Direct native NDI/Syphon/DeckLink are not implemented.
- No cloud draft was published, and restoration in a fresh task has not been verified.

Tests intentionally use isolated temporary state. The screenshot was captured from a separate temporary service so the user's live data was not overwritten.

## Shepherd Pro rename — 14 October 2026

Rebuilt the production bundle after changing app branding, export names and desktop package metadata. Targeted Chromium inspection verified the new page title, desktop and mobile layouts, zero page errors and fitting presentation output. A Linux Electron launch verified the Shepherd Pro identity, reuse of an existing Gather data directory, scripture presentation and synchronized output. No full test suite or installer extraction was repeated for the rename. Mac hardware testing remains outstanding.

## Local AI and OBS integration — 14 October 2026

- **13 Node tests passed**, including three new local-integration cases: persisted/validated configuration; neural index build, paraphrase ranking with fixture vectors, restart and model-digest invalidation; local drafting HTTP contract; PCM validation, silence handling, bounded Whisper CLI arguments and temporary-file cleanup.
- **12 Chromium scenarios passed in one run**, including all nine existing workflows plus transparent OBS overlay/blackout, unavailable-model setup messaging, and an actual AudioWorklet microphone path using Chromium synthetic audio. Speech responses in that browser test are fixtures, not neural recognition.
- Production build passed. The Mac setup shell script passed Bash syntax checking. No dependencies or original installer analysis were rerun.
- The model registry and Hugging Face downloads returned proxy 403. Thus no real EmbeddingGemma, Qwen3 or Whisper model ran here. No M5 performance, Nigerian English accuracy, OBS/DistroAV runtime, or EasyWorship receiver success is claimed.

Research used existing installer evidence and public GitHub documentation for Ollama, whisper.cpp, OBS Browser and DistroAV. EasyWorship support pages were blocked; installed EasyWorship version/receiver compatibility still needs confirmation.

The updated desktop shell also passed a Linux Electron operator/output smoke check and retained the legacy data profile even when the new local-tools directory already existed. Desktop and mobile Settings layout checks found no horizontal overflow or browser page errors.

## Built-in microphone testing update — 14 October 2026

Production build and Bash syntax check passed. Four targeted Chromium checks passed: missing-model guidance; microphone PCM capture and returned transcript; the new input-device selection and level-only test with no transcription request; transcript persistence, related Scripture and export. Tests use Chromium synthetic audio and fixture recognition responses, not a real speech model. The level-only test also verified that stopping resets the meter and releases the input selector.

No completed installer analysis, dependency installation, full test suite or cloud onboarding was repeated. The new speech-only setup branch was syntax-checked but has not been executed on macOS. Desktop/mobile microphone-screen checks found no overflow or page errors. See [microphone test screen](shepherd-pro-microphone-test.png).

## Continuous web workflow — 14–15 October 2026

Eight feature branches were implemented and merged into `integration/web`, leaving `main` as the preserved baseline. Production builds passed for all source changes. Targeted checks cover:

- Persistent Whisper HTTP service startup/reuse/shutdown and audio-window partial/final handling (2 new Node tests); CLI/PCM/configuration checks also passed. The service test uses a fixture subprocess, not a Whisper model.
- Automatic reference/range/correction/follow-up detection, invalid/incomplete references, quotation/fixture-meaning suggestions and same-origin API validation (4 new Node tests). A spoken-number failure was corrected; all 9 detection/search tests then passed.
- Queue command matching/customization and navigation limits (2 Node tests); phrase-based slide matching and ambiguity rejection (2 Node tests); Scripture navigation and spoken verse/translation parsing (2 Node tests).
- Chromium checks show a Scripture suggestion before Stop, finalized automatic Scripture output while recording continues, opt-in voice actions, spoken slide suggestions/display, continued listening after switching tools, shared stopping, retained transcript and spoken verse jumps. These are six new browser scenarios across targeted runs.
- Existing missing-model, batch PCM, level-only microphone and transcript persistence scenarios were checked during the relevant changes. No synthetic response is reported as successful real recognition.
- The last Scripture-navigation browser check also passed at a 390-pixel viewport without horizontal overflow.

The voice-control check exposed that utterance IDs restarted at zero per microphone session. Capture IDs now include a unique session prefix, and the restart scenario passed. A slide test's expected word count was corrected from 11 to the actual 10; the matcher and browser checks passed. The two selected slide/automatic-presentation browser checks completed with saved runner status `passed` at 2026-10-14 18:56 UTC before the tool session expired.

Existing REA 6.4.0 and the saved 2.6.14 artifact evidence were reused. A focused `trace-application-feature` query for `transcription_update` returned no graph seed match; that bounded result is not evidence that the event is absent. The retained formatted source at lines 71034–71092 directly shows its partial/final handling, and lines 56955–57055 show voice navigation. No installer re-extraction or full analysis was repeated.

No real Whisper, EmbeddingGemma or Qwen model ran in this cloud environment. M5 latency/memory, Nigerian English accuracy, long-service recovery, OBS and EasyWorship reception remain unverified. Full Pewbeam parity is not claimed; see the current roadmap.

Explicit command priority was verified by the spoken verse-jump scenario: no automatic detection request was made for the recognized command phrase. Both the queue-command and Scripture-command browser scenarios passed after sharing the session enable state.

The integrated server was restarted on port 4173. Health identity, John 3:16 reference retrieval, navigation to verse 17 and automatic detection of a spoken John 3:16 reference all passed against the running backend. The updated Mac setup script passed Bash syntax checking; no Mac execution is implied. The reusable environment `start_skill` was updated to Shepherd Pro/current branches and saved as a draft; publication is separate.

## Additional translations — 15 October 2026

Downloaded ASV and YLT plus explicit public-domain notices from a pinned Scrollmapper revision. A new corpus/API test verifies normalized hashes, valid unique verse references, 66 books, opening/closing book coverage, translation discovery, John 3:16 search and swapping the displayed translation. It and three existing server tests passed (4 total). The browser check switches search to ASV, presents John 3:16 and switches the live verse to YLT. No model installation, original-app extraction or unrelated full-suite run was repeated. No frontend source changed, so the retained production bundle is reused.

MSG/TPT publisher permissions pages and API.Bible were blocked by proxy 403. No publisher agreement or authorized offline text was established and neither requested copyrighted edition was downloaded. A WEB mirror was inspected but not bundled; its book naming/text formatting was unsuitable for direct import. The user’s app now has actual ASV/YLT data, not placeholder entries.
