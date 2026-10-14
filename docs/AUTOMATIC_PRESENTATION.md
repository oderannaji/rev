# Optional automatic verse presentation

Feature branch: `feature/automatic-verse-presentation`.

Enable **Auto-show confirmed single-verse references** in Transcripts to publish a detected reference automatically after the speech phrase is finalized. The choice is off by default and is not persisted across page reloads. While speaking, draft suggestions appear first; they do not trigger this automatic output.

Only a completed explicit reference resolving to exactly one verse is eligible. Ranges, chapter-only requests, quotations and meaning matches remain available for preview/queue review. Consecutive duplicate references do not repeatedly overwrite output. Blackout pauses automatic presentation, and the automatic action does not clear blackout. The existing live-state API and synchronized output windows carry the resulting verse.

“Confirmed” means the speech window is finalized and the reference resolves to the Bible corpus; it does not guarantee that speech recognition understood the preacher correctly. Real model recognition still needs evaluation. Automatic slide/deck matching and voice navigation are separate remaining features.
