# Scripture navigation and spoken commands

Feature branch: `feature/scripture-navigation`.

Preview or present Scripture to reveal previous/next verse and chapter controls, a verse-number jump and an installed-translation selector. They update the live verse when Scripture is live; otherwise they update the preview. Verse navigation crosses chapter and book boundaries using the installed corpus. Chapter navigation selects the first available verse of the adjacent chapter. Missing verses/translations produce an error and preserve output. Blackout remains under operator control.

With voice commands enabled, say “Shepherd, next verse”, “Shepherd, previous verse”, “Shepherd, next chapter”, “Shepherd, previous chapter”, “Shepherd, go to verse seventeen”, or “Shepherd, switch to BSB”. Translation IDs, spaced letters such as “B S B”, and installed translation names are recognized. Verse numbers support digits or English words from one to two hundred. Say the whole command as a separate phrase. No Scripture on screen means no navigation action.

These fixed Scripture commands take priority over custom queue phrases with the same text. They share the existing live-only, finalized-phrase and session opt-in requirements. Requests that become stale after a newer navigation command or a different displayed item are discarded.

Evidence: the retained Pewbeam 2.6.14 bundle's handlers at `index-readable.js:56955`–`57055` handle translation switching, next/previous verse and verse jumps. This independent implementation additionally exposes chapter voice commands. The original REA evidence IDs and artifact digests are in [the manifest](evidence/manifest.json); native timing and recognition parity are still unverified.
