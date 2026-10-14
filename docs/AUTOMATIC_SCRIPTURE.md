# Automatic Scripture suggestions

Feature branch: `feature/automatic-scripture-detection`, based on the web integration branch after continuous transcription.

Transcripts now checks each draft/final speech update automatically. It prioritizes references embedded in normal speech, including spoken chapter/verse numbers, ranges and subsequent “verse seventeen” callouts using the previous book/chapter. Incomplete references wait for more words. Invalid references return no fabricated text.

If no reference is present, the detector checks lexical candidates for at least six consecutive quoted words. Optional meaning search uses the installed neural index and labels results as suggestions for review. Its cosine cutoff is a provisional heuristic, not a calibrated probability or a guarantee of accuracy. Missing neural setup does not block reference/quotation detection.

The browser serializes requests and retains the latest pending speech update, ignoring results from superseded text. A small bounded cache avoids repeated identical meaning queries. Results can be previewed and added to the service queue. This branch does not automatically take verses live.

Tests cover reference corrections, ranges, numbered books, follow-up callouts, incomplete/impossible references, quoted text, fixture semantic results, request validation and cross-origin protection. A Chromium synthetic microphone test verifies that John 3:16 appears as a suggestion before pressing Stop, using the real detector and a fixture speech response. A first test exposed ambiguity in “Romans eight twenty eight”; the book-scoped number parser was corrected and all nine detection/search tests then passed. Real speech/model latency and recognition quality remain unmeasured in this environment.
