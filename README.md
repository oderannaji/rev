# Shepherd Pro

An independent local scripture and church-presentation studio, built after a static investigation of the Pewbeam installer you supplied. Its working local features are unrestricted. **Full Pewbeam feature parity is not complete**; see [coverage](docs/IMPLEMENTATION_STATUS.md).

## Latest web feature build

Use branch `integration/web` to test the combined web changes; `main` preserves the earlier baseline. Each feature has a separate branch, listed with evidence and remaining work in [the web roadmap](docs/REMAINING_WORK.md). From the existing checkout:

```bash
git fetch origin
git switch integration/web
git pull --ff-only
npm run build
npm start
```

Stop an older app server before restarting. Keep your existing data and models. The Mac desktop installer is deferred while the localhost workflow is completed.

## Start

Requires Node.js 22.12+ (validated with Node 24) and npm.

```bash
npm ci
npm run build
npm start
```

The server listens on loopback port 4173. Open that address in your local browser. Use `PORT` to select another port. `npm run dev` starts Vite for editing; keep `npm start` running in a second terminal for the API. Core search and data work offline after installation.

Use the existing checkout. Do not create another Git worktree unless explicitly requested.

## Workflow

Search a reference, phrase, or topic. Select a result to preview it, then **Take live**. Add scripture, slides, or media to the service queue. Open an output window and place it on your display; Main and Stream mirror live content, Lower third shows an overlay layout, and Stage shows live/next content and presenter notes. Arrow keys navigate the queue; Enter takes preview live; B toggles blackout outside text inputs.

The sidebar contains slide authoring/document import, a local media library, themes, transcripts, a Greek/Hebrew dictionary, and Content Studio. Topic mode uses explicit synonym expansion. Context mode uses a locally built neural index through Ollama. Transcription uses local whisper.cpp after configuration, with browser microphone capture or short audio-file imports. No browser cloud speech service is used.

The included BSB corpus contains 31,086 nonempty verses. Sixteen blank source slots are omitted. Other translations can be imported in Settings using the documented JSON schema. Source and licensing details: [THIRD_PARTY.md](docs/THIRD_PARTY.md).

## First microphone test

Open **Transcripts → Test microphone level** and speak toward the Mac. Choose the built-in microphone using **Audio input**. This level test works before installing any AI model and does not transcribe or save audio.

For actual transcription, keep the existing Whisper setup and saved paths. Choose **Continuous live transcription → Start live listening**, speak a short English sentence, and watch the draft and Scripture suggestions before stopping. Pauses finalize phrases. Listening continues while switching tools. If the new live mode reports that `whisper-server` is missing, run the updated speech-only script to build that component; it reuses your model. See [the step-by-step test](docs/LOCAL_MAC_SETUP.md) and [what remains](docs/REMAINING_WORK.md).

## Save and backup

User data is stored in `.local/` by default, outside tracked source. Set `DATA_DIR` to choose another directory. Service state writes are serialized and atomic. Settings can export/restore JSON state; media files and imported translations are **not** embedded in that export. To back up everything, stop the server and copy the entire data directory. The Electron shell uses its OS application user-data directory.

Only expose this local server to trusted local users. It binds to loopback and rejects cross-origin writes; it is not an authenticated public hosting service.

## Local AI for your M5 / 16 GB Mac

The selected starting stack is EmbeddingGemma search, Qwen3 4B drafting, and Whisper small for English speech. Nigerian English accuracy still needs a representative recording check. See [local Mac setup](docs/LOCAL_MAC_SETUP.md). From the downloaded app folder on the Mac:

```bash
bash scripts/setup-local-mac.sh
```

Then enable Local AI in Settings, paste the Whisper paths printed by the script, and build the BSB neural index. Model files are downloaded separately; the source ZIP does not contain them. Once installed, inference runs locally. Local drafting takes priority when enabled and never falls back automatically to a cloud provider.

See [OBS and EasyWorship setup](docs/BROADCAST_SETUP.md) for OBS browser sources and the proposed DistroAV/NDI bridge. Direct native NDI remains outstanding.

## Optional compatible-provider drafting

Content Studio’s **Structure notes** works locally without AI. With Local AI enabled, **Draft with AI** uses the selected Ollama model. Otherwise, it can use an explicitly configured OpenAI-compatible chat-completions endpoint. Set these in the server process and restart:

- `GATHER_AI_URL`: full HTTPS chat-completions endpoint, or HTTP on localhost for a local provider (for example Ollama’s `/v1/chat/completions`).
- `GATHER_AI_MODEL`: a model installed/available at that provider.
- `GATHER_AI_KEY`: optional provider key; keep it outside source and browser code.

The operator’s selected source notes are sent to that configured endpoint when they click **Draft with AI**. The adapter was tested against a mock provider; no real account, model, credentials or remote provider has been configured. All generated drafts need editorial review.

## Mac desktop (deferred)

The optional shell and build configuration are in `desktop/`. On a Mac:

```bash
npm ci
npm run build
npm --prefix desktop ci
npm run desktop
# Optional unsigned ARM64 build on macOS:
npm run package:mac
```

The Outputs menu can place windows fullscreen on selected monitors. Mac execution, microphone integration, packaging and signing remain unverified in this Linux environment. See [desktop/README.md](desktop/README.md). Native NDI, Syphon and DeckLink remain unimplemented. Offline Whisper integration code is present, but the executable/model must be installed and tested on the Mac.

## Validation

```bash
npm test
npm run build
npm run test:e2e
```

Browser tests use system Chromium when available. Otherwise install Playwright Chromium, or set `CHROMIUM_PATH` to an existing executable. Tests use an isolated temporary user-data directory and port 4174.

## Evidence and implementation map

- [Remaining integrations: models, SDKs and owner inputs](docs/INTEGRATION_REQUIREMENTS.md)
- [How Pewbeam search works, with source evidence](docs/SEARCH_EVIDENCE.md)
- [Free / Plus / Core feature inventory](docs/FEATURE_MATRIX.md)
- [Actual Shepherd Pro coverage and outstanding work](docs/IMPLEMENTATION_STATUS.md)
- [Hashes, offsets, and REA evidence identifiers](docs/evidence/manifest.json)

Application source is in `src/`; local API/search in `server/`; shared validation in `shared/`; the optional Mac shell in `desktop/`. No Pewbeam application assets, commercial Bible texts, proprietary service credentials, or licensing code are used by Shepherd Pro.

The app is now named **Shepherd Pro**. Existing `GATHER_AI_*` environment variables remain supported under their original names so existing provider configuration keeps working. The desktop shell reuses a previous Gather data directory when no Shepherd Pro data directory exists; web `.local` data and existing backups remain compatible.
