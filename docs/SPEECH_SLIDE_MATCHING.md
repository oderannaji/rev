# Speech-to-slide matching

Feature branch: `feature/speech-slide-matching`.

Create or import text slides, open Transcripts, and start continuous listening. **Suggest slides from the words I speak** compares transcript updates with saved text slides and shows up to three matching slides for preview or queueing. It searches slide bodies, not images, video, or slide titles. The first 512 words / 12,000 characters of each slide are indexed for this purpose; each speech update is capped at 1,500 characters.

This matcher uses continuous phrases, not neural paraphrases. Suggestions require at least six matching consecutive words. **Auto-show a unique strong slide match** is off by default. It requires a finalized live-microphone phrase, exactly one matching slide, at least eight consecutive matching words and at least 80% coverage of the recognized phrase. Duplicate slide text, weaker phrases and multiple candidates require review. Blackout pauses automatic display and is never cleared by it. Consecutive matches for the same slide do not republish it.

Automatic Scripture display and automatic slide display are mutually exclusive choices so two listeners cannot compete over the output. Voice commands remain separate, opt-in controls. Real speech accuracy still depends on the installed Whisper model; fixture tests demonstrate matching and output behavior only.
