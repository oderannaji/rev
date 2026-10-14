# Pewbeam feature inventory from the supplied installer

This is static evidence from the extracted production JavaScript, formatted at `/workspace/pewbeam-analysis/index-readable.js`. Line numbers below refer to that file. A visible handler or gate confirms that the supplied build contains that implementation; it does not prove backend success, current commercial terms, or live behavior on a Mac. No embedded credential values or vendor application code/assets are included here.

## Tier names and limits

The application defines **Free, Plus, Core**, ordered in that sequence (8898–8945, 9118–9141). Its pricing UI calls Free **Explorer** and displays Explorer, Plus, Core (67376–67424). **Premium is not a fourth subscription tier in this build**: the word appears in paid theme identifiers, such as premium lower thirds and motion themes (13279, 13424, 13613, 13795).

| Capability | Free / Explorer | Plus | Core | Evidence |
|---|---|---|---|---|
| Transcription | 60 minutes, one-time account/computer allowance | Unlimited | Unlimited | Defaults 54673–54679; usage 54748–54813; pricing 66996–67005; explanatory UI 70408, 70471 |
| Search allowance | Default 200 lifetime allowance for metered semantic search | Unlimited | Unlimited | 54676–54679, 54814–54847; semantic gate 56833–56846. Do not infer that ordinary local reference/keyword search is capped. |
| AI generation | 1 free generation, sign-in required | Unlimited | Unlimited | 54677; 54849–54885; 66396–66445. Counter is reused by Content Studio, despite its name mentioning slides. |
| Output watermark | Present outside active trial | Removed | Removed | Entitlements 8903–8931; render decision 16951–16956 |
| Themes | Pricing advertises 2 built-in; up to 1 user-created theme | All themes; unlimited custom | Same | Pricing 67000–67013; custom count 14440, 14560–14566; paid-theme guard 14637 and 14769 |
| Output channels | Main; second channel available during active trial | 4 | 4 | 25035–25048; paid feature comparison 67013 |
| Offline speech recognition | Blocked | Included | Included | 20046–20052; pricing 67010 |
| Noise suppression | Enabling blocked | Allowed | Allowed | 20035–20042; live audio setting applies only for paid tier 55104 |
| Sermon notes / Content Studio | Signed-in trial eligibility, limited generation | Included | Included | 9177–9184; 66396–66445; entitlements 8903–8931 |
| Greek/Hebrew word study | Trial eligibility or paid entitlement required | Advertised included | Included | Feature checks 37816–37821 and 37844–37849; pricing 67009 |
| Original-language scripture display / downloaded translations | Blocked | Allowed | Allowed | 22437–22449; translation-setting gate 19860–19870 |
| Multiple active devices | No entitlement | No entitlement | Entitled; UI advertises 3 activations and simultaneous machines | 8903–8931; 67015–67019 |
| Priority support / advanced AI | No entitlement | No entitlement | Entitled | 8903–8931; 67018–67019. Specific additional AI behavior is not established by the entitlement label alone. |

The UI advertises four free translations (66999), but a language registry lists six English translation codes (19570–19574). This is a material evidence mismatch: the registry alone does not establish that all six are bundled, usable or free in the native build. Paid/remote translation metadata is loaded dynamically (19617–19645). Server counters can override the default allowance values (54732–54744); treat numbers as defaults in this installer, not immutable policy. Expired licenses and build-time tiers are reconciled by `getEffectiveTier` (9136–9141).

## Presentation and editing

- Scripture preview/live states, queue, previous/next verse, translation switching, clear and blackout controls. Keyboard help lists Tab for search mode, L for live, C for clear, B for blackout, angle brackets for chapter navigation, and double Enter to go live (59857–59865). Native blackout synchronization is present (24299–24342).
- Deck/page creation and persistent local deck library begin at 21339. The deck model supports headings, body, per-page background image, gradient, canvas, and design elements (54178–54195). Text and image layers are reconstructed during PowerPoint import (70711–70732).
- Presentation import accepts PPTX and PDF (70664–70671). PDF pages render to images and are saved using native commands (70675–70708). PPTX import calls the native presentation importer (70711–70732).
- Presentation export writes PPTX and PDF. PPTX includes a rendered slide image plus editable text overlays (54230–54250); PDF writes rendered page images (54253–54271).
- Song and an older Slides section contain explicit “almost here” placeholders (54643–54661). A navigation label does not establish song-library functionality; deck editing/import/export nevertheless has implemented handlers elsewhere.

## Themes, backgrounds and outputs

- Theme creation, duplication, editing, import/export and paid-template checks are present (14559 onward; 14766–14905). Theme import file type is JSON (70294). Theme settings include typography, alignment, spacing, grouped/freeform layout and adjustable verse/reference placement (13230 onward; 14422–14438).
- Paid lower-third and motion templates are enumerated (13279, 13424, 13613, 13795); the paid identifier set is checked by the theme gate at 13985–13990. Built-in lower-third templates include transparent overlay settings (14220 onward).
- Background/layer models support images and video (13060, 13652, 13834, 21976); missing video background handling prompts the user to re-import (77299). These support presentation media, not proof of a standalone media-library product feature.
- Outputs select external displays or NDI, with resolution, frame rate and alpha mode (61186–61231). The app has per-channel gating (25035–25048), monitor availability/error recovery (25371–25460), NDI availability checks (25113–25132), and synchronized blackout (24299–24342).
- “Stage monitor” occurs in a sample theme list (21279), so that string alone should not be represented as proof of a separate confidence-monitor service.

## Speech, language and word study

- Settings include microphone/system device selection, NDI audio source, gain, online/offline STT, language autodetection, voice commands, and suggested/automatic slide matching (19797–19827; 20019–20065).
- Custom voice commands normalize phrases, deduplicate definitions, and cap the list at 50 (19750–19779). Native synchronization exists for both custom commands and slide matching (19781–19794).
- Runtime command handlers switch translation, step scripture forward/backward and jump to a verse (56955–57055). Live deck page navigation is implemented (56854–56873). Commands operate on existing live/preview content and validate available translations.
- Language registry includes English, Spanish and French, with separately named Hausa, Igbo and Yoruba entries (19567–19599). Spanish RV1909/VBL and French LSG/OST are pack metadata; they are not all necessarily preinstalled (19578–19592). Language manifests and installed-pack lists extend this registry (19623 onward).
- Greek/Hebrew word-study packs have entitlement checks, install/load commands, Strong’s identifiers, lemma, transliteration and gloss, lookup, verse alignment, and sending highlighted words to live output (37778–37910). Source checks native entitlement or trial feature availability; availability still depends on installed data.
- Audio reconnect handling can suggest offline mode and distinguish stalled microphone input (77913–78003). This is useful behavior for a new independent implementation.

## Transcripts and generated content

- Live transcript handling receives native `transcription_update` events and final/partial text (71034–71092), supports history and search (66685, 66881–66882), loading/combining selected transcripts (66358, 66514–66521), and deletion (66486–66488).
- Transcript download supports PDF, DOCX and Markdown (61712–61737; format handlers 61842–61851). Timestamp formatting and approximate text-to-duration segmentation are implemented (61800–61839).
- Content Studio types are sermon notes, newsletter, daily devotional, tract material and church publication (40380–40387; UI labels 62616–62642). Generated content exports to PDF, DOCX, Markdown (63551–63553).
- Sermon-note source import accepts TXT, Markdown, PDF and DOCX; PDF extraction uses a PDF client and the other formats use native document extraction (40356–40378).
- AI content requests go through a vendor proxy endpoint (40396–40410) and native/server trial/licensing checks are involved. No vendor endpoint, credential, service entitlement or proprietary content should be carried into a separate app. A new implementation needs its own configured provider or explicitly labeled local generation, plus a clear statement of any missing hosted service.

## Implementation scope guidance

For an independent app, the verified functional groups are: scripture reference/keyword/semantic retrieval; live/preview/queue controls; transcription and voice navigation; presentation authoring/import/export; themes and motion/overlay styling; multi-output delivery; transcript history; content generation/export; word study and language packs; and account/tier/usage administration. A browser implementation can provide local persistence, imported text corpora, keyboard control, browser speech recognition where supported and synchronized presentation windows. It must not claim native NDI, offline speech models, live multi-device licensing, payment processing or proprietary hosted AI unless those integrations are actually built and tested. Full feature parity cannot be established solely from static JavaScript because native command internals and server behavior remain separate evidence sources.
