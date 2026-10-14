# Implementation coverage

This is a working independent local presentation studio, not a verified full replacement for every Pewbeam tier. All implemented local features are unrestricted. No billing or vendor license bypass is involved.

| Area | Shepherd Pro implementation | Limits / outstanding work |
|---|---|---|
| Reference search | Book aliases, Roman/numeric book prefixes, spoken numbers, chapters, verse ranges | Different parser from Pewbeam; English reference grammar |
| Phrase/keyword search | Exact normalized phrase, lexical ranking, single-edit/transposition typo tolerance | Independent ranking; not identical result ordering |
| Context search | Local Ollama embeddings, persisted float32 verse index, cosine ranking plus lexical rank fusion, reference priority; Topic remains synonym expansion | Integration tested with fixture embeddings; real models and quality need Mac validation. No cross-encoder; not Pewbeam ranking parity |
| Bible translations | 31,086 nonempty BSB verses; validated JSON imports, Unicode text search | Commercial translations require separately supplied licensed data |
| Presentation | Independent preview/live state, service queue, reorder, next/previous, blackout, clear, alerts | Long text should be split into slides; no automatic pagination engine |
| Outputs | Main, mirrored stream, transparent lower third, stage/notes; live SSE; copyable OBS source URLs and documented OBS/DistroAV bridge | Same local live source; independent channel composition, native NDI/Syphon/DeckLink, OSC and remote device control are not implemented |
| Desktop | Electron wrapper, monitor placement menu, sandboxed renderer, local backend, Mac build config; Linux operator/output launch tested | Mac execution, signing, notarization and hardware verification outstanding |
| Slides | Create/edit/delete, paragraph-to-slide, TXT/MD/PDF/DOCX/PPTX text import, editable-text PPTX export, print/PDF | Import extracts text, not original layout/graphics; PDF scans require OCR outside this app; print dialog is browser-provided |
| Themes | Six original themes, font/size/alignment/colors, two CSS motion options, lower-third route | No freeform layer editor; theme applies immediately to all live outputs |
| Media | Validated image/video upload, preview, queue and output | 20 MB upload cap; muted video playback; no transcoding, audio mixer or media packaging in backups |
| Transcripts | Offline whisper.cpp adapter, input-device selector, independent level test, microphone PCM capture, short audio import, editing/history, selectable topic/neural Scripture suggestions, exports | Whisper binary/model required; fixture CLI and synthetic microphone tested. No real Nigerian English accuracy test, NDI audio input, or automatic live scripture projection |
| Original languages | 14,197 searchable Greek/Hebrew dictionary entries | Lexical lookup, not aligned original-language verse rendering |
| Content Studio | Five document types, editable local outlines, transcript/doc import, exports, draft-to-slides | Local outline is not AI. Local Qwen3/Ollama adapter and optional compatible-provider adapter require model/service setup; fixture providers tested, real inference pending |
| Persistence | Serialized atomic writes, local media/translation storage, JSON service/backup export and restore | One trusted local operator workflow; no hosted accounts, team sync or billing |
| Core services | No artificial feature quota or device-license lock on this independent app | Vendor support, hosted publishing, advanced proprietary AI and entitlement services cannot be reproduced by local UI |

Additional features are extensions to Shepherd Pro, not evidence about Pewbeam. In particular, Shepherd Pro’s stage view is its own design; a Pewbeam template label did not prove a dedicated stage-monitor service.

## Required for full requested parity

The remaining work needs actual model installation and inference on the M5/16 GB Mac, Nigerian English accuracy/latency evaluation, and receiver tests for OBS/EasyWorship. The local stack is selected and its adapters implemented; the cloud environment cannot download the model artifacts. Direct native broadcast integration still needs the official SDK and hardware tests. None of those integrations should be marked complete based on this browser implementation or static installer evidence. Current commercial plan policy and server behavior remain unverified.

The next acceptance checks for the owner’s M5/Tahoe 26.4, X32 and EasyWorship 8.0.49 are listed in [REMAINING_WORK.md](REMAINING_WORK.md).
