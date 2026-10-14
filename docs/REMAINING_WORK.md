# Shepherd Pro — remaining work

Updated 14 October 2026. Continue from the existing app; no repeated Pewbeam extraction or cloud onboarding is needed.

Owner's setup: **Apple M5 / 16 GB / macOS Tahoe 26.4**, English speech, **Behringer X32**, OBS, **EasyWorship 8.0.49**. The X32 expansion card and EasyWorship receiver operating system are unknown. The first test uses the Mac's built-in microphone.

| Next step | Already available | Still needs to happen |
| --- | --- | --- |
| Hear the built-in microphone | Input selector, live level meter, standalone test without AI installation | Run on the Mac and permit microphone access; confirm the meter responds |
| Transcribe an English sentence | Offline Whisper adapter, 20-second sections or stop-to-process, speech-only setup script | Install Whisper on the Mac, save paths, speak and compare actual text; no real recognition accuracy/performance test has passed yet |
| Neural Scripture search | Local embedding adapter, persistent verse index, reference priority, combined meaning/keyword ranking | Install EmbeddingGemma, build BSB index, check paraphrases and response time with real inference |
| Local drafting | Qwen3 4B/Ollama adapter, bounded notes/context, editable reviewed output | Install model and evaluate a real draft on 16 GB RAM; check operation without internet |
| OBS output | Copyable browser-source URLs, full-screen output and transparent lower thirds | Confirm actual OBS capture, resolution, blackout and reconnect on the Mac |
| X32 preacher feed | Audio device selection and level test | Identify USB expansion card, route a preacher-only feed, verify the channels supplied to browser/desktop mono capture; arbitrary card-channel selection is not implemented |
| EasyWorship connection | Documented OBS → DistroAV/NDI → EasyWorship proposal | Confirm receiver OS and 8.0.49 NDI input support; test discovery, frame rate and transparency. No schedule/slide-control integration exists |
| Direct native broadcast | Existing browser/display outputs | Native NDI sender/receiver, Syphon and DeckLink are still unimplemented; official SDKs and hardware validation required |
| Mac delivery | Source/build ZIP and Electron packaging configuration | Actual Tahoe launch, microphone/display tests, then build/sign/notarize a Mac installer for distribution |

Other full-parity gaps remain: real-time automatic scripture detection/projection, word-aligned Greek/Hebrew display, independent output compositions, freeform slide-layer editing, and multi-device/hosted services. The app's implemented features have no paid-tier restrictions; this is not a claim that every Pewbeam feature is finished.

## Immediate acceptance test

Follow [the microphone test guide](LOCAL_MAC_SETUP.md). First verify the input meter without any model. Then install only speech, transcribe “Today we are reading John chapter three, verse sixteen,” and inspect the actual result. This separates permission/input problems from model installation or recognition problems.

Tests in this cloud use synthetic microphone audio and fixture inference responses. They establish the app's data flow, not successful English transcription by a real model. Mac models are not contained in the ZIP; their download hosts are blocked from this cloud environment.
