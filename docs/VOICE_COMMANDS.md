# Voice controls

Feature branch: `feature/voice-commands`.

In Transcripts, enable **Voice commands for this session**, start continuous listening, and say one command as its own phrase, followed by a pause. The default phrases are “Shepherd, next slide”, “Shepherd, previous slide”, “Shepherd, take live”, “Shepherd, blackout”, “Shepherd, resume output” and “Shepherd, clear output”.

Only finalized live-microphone phrases are eligible. Draft text, imported audio, pasted notes and an ordinary sentence containing a command do not activate controls. The entire recognized phrase must match. Command recognition depends on Whisper's actual transcript; it is not speaker identification. Commands remain in the transcript for review.

Next and previous move through the service queue and preserve blackout. Take live presents the current preview and clears blackout. Resume clears blackout without changing the live item. Navigation stops at queue boundaries.

Custom phrases can be saved in this panel and are included in state backups. Every action requires a distinct phrase. “Shepherd” remains the fixed wake word. The enabled switch resets on reload or leaving Transcripts. Stay on Transcripts while listening; navigating away releases the microphone.
