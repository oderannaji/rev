# Implementation coverage

This is a working independent local presentation studio, not a verified full replacement for every Pewbeam tier. All implemented local features are unrestricted. No billing or vendor license bypass is involved.

| Area | Shepherd Pro implementation | Limits / outstanding work |
|---|---|---|
| Reference search | Book aliases, Roman/numeric book prefixes, spoken numbers, chapters, verse ranges | Different parser from Pewbeam; English reference grammar |
| Phrase/keyword search | Exact normalized phrase, lexical ranking, single-edit/transposition typo tolerance | Independent ranking; not identical result ordering |
| Context search | Local Ollama embeddings, persisted float32 verse index, cosine ranking plus lexical rank fusion, reference priority; Topic remains synonym expansion | Integration tested with fixture embeddings; real models and quality need Mac validation. No cross-encoder; not Pewbeam ranking parity |
| Bible translations | Bundled BSB, ASV and YLT; validated JSON imports, Unicode text search and displayed-translation switching | Download/update/remove pack manager remains open. MSG/TPT are not bundled; an authorized digital source/license is required. Neural indices are built per translation |
| Presentation | Independent preview/live state, service queue, reorder, blackout, clear, alerts; verse/chapter navigation, verse jumps and displayed-translation switching | Long text should be split into slides; no automatic pagination engine |
| Outputs | Main, mirrored stream, transparent lower third, stage/notes; live SSE; copyable OBS source URLs and documented OBS/DistroAV bridge | Same local live source; independent channel composition, native NDI/Syphon/DeckLink, OSC and remote device control are not implemented |
| Desktop (deferred) | Electron wrapper, monitor placement menu, sandboxed renderer, local backend, Mac build config; Linux operator/output launch tested | Mac execution, signing, notarization and hardware verification outstanding |
| Slides | Create/edit/delete, paragraph-to-slide, TXT/MD/PDF/DOCX/PPTX text import, editable-text PPTX export, print/PDF | Import extracts text, not original layout/graphics; PDF scans require OCR outside this app; print dialog is browser-provided |
| Themes | Six original themes, font/size/alignment/colors, two CSS motion options, lower-third route | No freeform layer editor; theme applies immediately to all live outputs |
| Media | Validated image/video upload, preview, queue and output | 20 MB upload cap; muted video playback; no transcoding, audio mixer or media packaging in backups |
| Transcripts | Persistent local Whisper service; continuous draft/final updates; microphone selection/meter; automatic references/quotations/meaning suggestions; optional final single-verse presentation; spoken slide matches; queue and Scripture voice commands; listening across tools; short audio import, editing/history and exports | Synthetic audio and fixture inference tested; real Nigerian English accuracy/delay, boundary recovery, transcript search/merge/timestamps and NDI audio remain open. Automatic output is opt-in; phrase-based slide matching is not neural |
| Original languages | 14,197 searchable Greek/Hebrew dictionary entries | Lexical lookup, not aligned original-language verse rendering |
| Content Studio | Five document types, editable local outlines, transcript/doc import, exports, draft-to-slides | Local outline is not AI. Local Qwen3/Ollama adapter and optional compatible-provider adapter require model/service setup; fixture providers tested, real inference pending |
| Persistence | Serialized atomic writes, local media/translation storage, JSON service/backup export and restore | One trusted local operator workflow; no hosted accounts, team sync or billing |
| Core services | No artificial feature quota or device-license lock on this independent app | Vendor support, hosted publishing, advanced proprietary AI and entitlement services cannot be reproduced by local UI |

Additional features are extensions to Shepherd Pro, not evidence about Pewbeam. In particular, Shepherd Pro’s stage view is its own design; a Pewbeam template label did not prove a dedicated stage-monitor service.

## Required for full requested parity

The owner reports running the setup scripts. Remaining validation needs actual model inference on the M5/16 GB Mac, Nigerian English accuracy/latency evaluation, and receiver tests for OBS/EasyWorship. The local stack is selected and its adapters implemented; the cloud environment cannot download the model artifacts. Direct native broadcast integration still needs the official SDK and hardware tests. None of those integrations should be marked complete based on this browser implementation or static installer evidence. Current commercial plan policy and server behavior remain unverified.

The next acceptance checks for the owner’s M5/Tahoe 26.4, X32 and EasyWorship 8.0.49 are listed in [REMAINING_WORK.md](REMAINING_WORK.md).
