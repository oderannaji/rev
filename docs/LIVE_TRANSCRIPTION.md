# Continuous transcription in the localhost web app

Feature branch: `feature/live-transcription`. The Mac desktop wrapper/installer is deferred; this runs in the browser with the local Node backend.

The new mode captures continuously and sends replaceable draft windows approximately every two seconds during speech. A pause of roughly 0.7 seconds commits the phrase; long speech is divided at a maximum of 12 seconds. Stop commits the remaining phrase. An energy threshold suppresses quiet input. This is windowed Whisper inference, not token-by-token decoder streaming or a guaranteed two-second total delay.

The Node backend starts `whisper-server` on a private loopback port and keeps the model loaded for subsequent requests. Only the latest queued draft for each phrase is kept. Final phrases are processed in order. If the machine falls behind enough to queue five phrases, the UI explicitly pauses capture rather than allowing an unbounded backlog. A failed inference stops the child; the next attempt starts a fresh engine. App shutdown also stops the child.

## Enable

Existing model downloads and configuration remain usable. The additional executable is `whisper-server`, beside the configured `whisper-cli`. Run the **updated** `scripts/setup-local-mac.sh --speech-only` once to compile this missing target; it reuses installed tools/model files. This installs a localhost backend component, not a Mac desktop app.

In Settings, check that the continuous speech engine is available. Open Transcripts, select **Continuous live transcription**, and click **Start live listening**. Wait for model loading, then speak. The **Hearing now · Draft** area should update without stopping; finalized phrases appear in the transcript. The older batch mode remains explicitly selectable for comparison.

## Validation and limits

Unit tests cover partial/final window sequencing and reuse/shutdown of a real subprocess running a fixture HTTP server. Chromium synthetic microphone tests verify that a draft appears while recording continues and that Stop commits the final phrase. No real Whisper model inference or latency was measured in this cloud. Recognition corrections, boundary errors, silence hallucinations and throughput still require a microphone run with the installed model. Automatic Scripture suggestions are developed on their own feature branch.
