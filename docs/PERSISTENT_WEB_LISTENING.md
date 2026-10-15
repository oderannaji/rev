# Listening while using other tools

Feature branch: `feature/persistent-web-listening`.

Start listening in Transcripts, then switch to Scripture, Slides, Media, Themes, Study, Content or Settings. The microphone, transcription, detection and enabled automatic output continue. Your in-progress transcript and session choices remain in memory while switching tools.

A shared status bar shows recording, microphone testing, startup and pending transcription. **Stop listening** is available from every tool and finishes the current phrase. **Open transcript** returns to the transcript panel. Closing or reloading the browser page still releases the microphone; save the transcript to preserve it across reloads. This is continuity between tools inside the app, not a guarantee that the browser will keep running while the computer sleeps.

Automated verification uses Chromium's synthetic microphone and fixture speech text. It switches to Slides while recording, checks automatic Scripture output before stopping, stops from the shared control, and checks the retained transcript and session option.
