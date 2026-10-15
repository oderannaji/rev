# Shepherd Pro — web completion roadmap

Updated 15 October 2026. **Current priority: localhost web app and local backend. Mac desktop packaging is deferred by the owner.** Continue the existing checkout and retained REA evidence; do not repeat onboarding, installer extraction or model downloads already completed.

The owner has run both Mac setup commands and reports that the app looks good. Hardware: **M5 / 16 GB / Tahoe 26.4**, English (Nigerian English in services), Behringer X32, OBS and EasyWorship 8.0.49. Actual recognition output, delay, X32 expansion card and EasyWorship receiver OS remain unverified.

## Published feature branches

Each feature has its own branch. `main` preserves the baseline; `integration/web` combines the tested features below for localhost testing. These are implemented and tested with synthetic audio/fixture speech, **not certified real-model or full Pewbeam parity**.

| Feature | Branch | Acceptance evidence |
| --- | --- | --- |
| Additional Bible translations | `feature/additional-bible-translations` | Downloaded public-domain ASV and YLT, validated full corpus counts/digests, search and displayed-translation switching |
| Continuous local transcription | `feature/live-transcription` | Persistent Whisper HTTP process contract; partial text before Stop; final text committed on pause/window completion |
| Automatic Scripture suggestions | `feature/automatic-scripture-detection` | Spoken references, corrections, ranges, follow-up verse numbers, quotations and fixture meaning matches; suggestion before Stop |
| Optional automatic verse display | `feature/automatic-verse-presentation` | Final single-verse reference goes live while capture continues; defaults off |
| Voice controls and custom phrases | `feature/voice-commands` | Finalized live commands control the queue; drafts do not; opt-in does not replay old commands; custom phrases persist |
| Spoken slide matching | `feature/speech-slide-matching` | Phrase matching, duplicate/weak-match rejection, suggestion before Stop and optional final display |
| Listening across tool navigation | `feature/persistent-web-listening` | Switch to Slides while listening, detect/display Scripture, stop from shared control and retain transcript |
| Speech action priority | `feature/speech-action-priority` | Recognized voice commands bypass content matching so they cannot trigger competing automatic output |
| Verse/chapter/translation navigation | `feature/scripture-navigation` | Cross-chapter/book boundaries, missing-verse handling, installed translations, spoken verse jumps and narrow-screen layout |

## Still required for the requested web parity

These are planned branch names, not empty branches or completed features. Split a row further when implementation needs separate reviewable changes.

| Remaining work | Planned branch | What completion must demonstrate |
| --- | --- | --- |
| Real speech quality and delay | `feature/speech-quality` | Representative English sermon audio, measured draft/final delay, phrase-boundary corrections, long-session stability and recovery from slow/failed inference |
| Neural retrieval quality | `feature/neural-search-quality` | Real EmbeddingGemma index and paraphrase evaluation; compare retrieval/reranking choices with evidence rather than claiming identical ranking |
| Local drafting quality | `feature/local-drafting-quality` | Real Qwen3 output, memory use alongside speech/search, editorial checks and offline operation on 16 GB |
| Transcript history tools | `feature/transcript-history` | Search, select/combine sessions, timestamped segments and timestamp-aware exports |
| Full presentation editor | `feature/slide-editor` | Deck/page organization, text/image layers, positioning, resizing, per-slide backgrounds and usable editing controls |
| Visual document import/export | `feature/presentation-import-export` | Preserve PDF page appearance and PPTX images/layout where supported; meaningful round-trip tests; current import is text extraction |
| Theme library and layout | `feature/theme-library` | Save/duplicate/import/export themes, reference positioning, richer lower thirds and motion controls |
| Independent output channels | `feature/independent-outputs` | Separate content/layout per channel, synchronized controls and reconnection tests; current stream mirrors main |
| Greek/Hebrew alignment | `feature/original-language-alignment` | Licensed verse/word alignment data, highlighted original-language display and speech-triggered study; current lexicon is dictionary lookup |
| Translation/language packs | `feature/translation-packs` | Validated install/update/remove flow and licensed corpora; BSB/ASV/YLT are bundled and imported JSON is supported. MSG/TPT still need authorized digital sources |
| Audio routing controls | `feature/audio-routing` | Gain/input behavior, X32 channel routing, reconnect tests and supported system/NDI audio sources; microphone selection/meter already exist |
| Remote/device operation | `feature/remote-control` | Defined OSC/remote actions, authenticated device connection, reconnect and concurrency behavior |
| Hosted/multiple-device services | `feature/multi-device` | Explicit synchronization and access model with tests; no hosted backend or device administration currently exists |
| OBS/EasyWorship interoperability | `feature/broadcast-interop` | Actual browser-source capture and receiver tests on EasyWorship 8.0.49; current OBS/DistroAV bridge is documented, not verified |

## Native work retained for later

`feature/native-ndi`, `feature/native-syphon`, `feature/native-decklink`, and `feature/mac-delivery` remain separate native work. They require appropriate SDKs, supported operating systems and hardware/receiver tests. A web control alone cannot establish those capabilities. The desktop installer, signing and notarization are explicitly deferred; the local web app still uses the Mac microphone and local model services for real-world testing.

## Evidence boundaries and product choices

The [Pewbeam inventory](FEATURE_MATRIX.md) and [search evidence](SEARCH_EVIDENCE.md) remain the comparison baseline. Explorer/Free, Plus and Core are tier names; Premium labels themes. All implemented Shepherd Pro features are unrestricted. Vendor billing, artificial quotas, license locks and priority support are not being added to this independent app. “Advanced AI” in a tier entitlement does not reveal a specific algorithm; it remains unresolved instead of being represented by a placeholder. The vendor's Song section includes an explicit placeholder and is not evidence of a complete song library.

Current speech is repeated inference on growing audio windows, with drafts about every two seconds plus inference time; it is not token-by-token decoder streaming. Maximum windows are 12 seconds, and boundary/accuracy evaluation remains open. Slide matching currently compares phrases, not semantic deck matching. Real recognition can still produce a wrong reference even when it resolves to an existing verse.

## Test the integrated web build

From your existing repository folder, fetch and switch to `integration/web`, build with `npm run build`, then restart `npm start`. Keep existing `.local` data and model installations. In Transcripts choose continuous mode, start listening and speak “Today we read John chapter three, verse sixteen.” Expect a draft and Scripture suggestion before pressing Stop. Pause and check the committed transcript. Try switching to Slides while listening and stopping with the shared control.

If live mode specifically reports missing `whisper-server`, the updated speech-only script builds that additional executable beside `whisper-cli` and reuses the installed model. Do not repeat full model setup simply to update the web app.

Full remaining parity is a multi-week project, not an hours-only update. A dependable completion date still requires actual model benchmarks and the external integration tests above; the completed branch milestones do not establish that date.
