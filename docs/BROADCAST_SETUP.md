# OBS and EasyWorship connections

## OBS on the same Mac

Open Shepherd Pro's **Settings → OBS & EasyWorship**. Copy the full-screen or lower-third URL. In OBS, add a **Browser** source, paste that URL, and set width/height to 1920 × 1080. Keep Shepherd Pro open. Take a verse live and confirm OBS updates.

The lower-third route has a transparent page background. Clearing live content or applying blackout hides that overlay; full-screen output still blacks out to black. Place the lower-third Browser source above your camera source. This path uses OBS's browser renderer, not native NDI in Shepherd Pro. URLs are local to the same computer; do not paste a loopback URL into a different computer. Desktop ports can change after restart, requiring an updated OBS source URL.

## Proposed bridge to EasyWorship

```mermaid
flowchart LR
    S[Shepherd Pro output] --> B[OBS Browser source on the Mac]
    B --> D[DistroAV NDI output]
    D --> N[Local network]
    N --> E[EasyWorship NDI input on its presentation PC]
```

Use this when your EasyWorship version supports receiving NDI. The owner reports EasyWorship 8.0.49. The receiving computer/OS remains unconfirmed; no receiver test or native Mac support verification has been performed. Intel is a processor family, not an operating system. This is a proposed video transport bridge, not schedule synchronization, editing EasyWorship presentations, or controlling its Next/Go Live buttons.

1. Install OBS and a compatible **DistroAV** plugin on the Mac, plus its required NDI runtime. Match their versions. The upstream DistroAV README retrieved 14 October 2026 specifies OBS 31.1.1+ and NDI Runtime 6.3+ for its current release; older combinations need their matching documentation.
2. Bring Shepherd Pro into OBS as described above.
3. Use DistroAV's dedicated source/filter output if you want only the scripture output, or its main output to send the complete OBS program. Give the source a recognizable name such as `Shepherd Pro Scripture`.
4. In a compatible EasyWorship version, add/select the NDI source from the Mac. Both machines need network reachability and discovery. Wired networking is preferable for testing.
5. Check resolution, frame rate, latency, blackout and recovery after restart. Verify alpha/transparency through the actual receiver; do not assume a transparent OBS source guarantees end-to-end transparent video. An opaque full-frame feed is the fallback.

Avoid feeding EasyWorship back into the same OBS scene that sends to EasyWorship, which creates a visual feedback loop. Audio sending/receiving and synchronization require a separate test with the actual mixer/receiver; the current Shepherd Pro presentation videos are muted.

## Evidence and limits

- OBS Browser documentation: https://github.com/obsproject/obs-browser — browser sources and background transparency configuration. Retrieved successfully through GitHub raw content.
- DistroAV documentation: https://github.com/DistroAV/DistroAV — explicitly documents NDI Source, NDI Output, and NDI Dedicated Output, including macOS installation and runtime requirements. Retrieved successfully through GitHub raw content.
- EasyWorship support: https://support.easyworship.com — access was blocked by the cloud network proxy. Current EasyWorship compatibility and menu labels are not verified here.

Shepherd Pro itself still has no direct native NDI sender/receiver. The OBS bridge is a practical separate integration path; it does not establish native NDI feature parity with Pewbeam. Adding a direct sender still requires the official SDK and Mac/receiver tests.

## Behringer X32 audio input

The owner has an X32. Its expansion card is still unknown. For a USB-capable card such as X-USB or X-LIVE, the intended path is preacher microphone → X32 → card USB audio → Mac → Shepherd Pro. Use the expansion card's computer-audio port, not the console's recording USB socket.

Have the sound operator prepare a preacher-only USB feed without changing house-speaker routing. The app can select an exposed audio input device, but it requests mono capture and cannot choose arbitrary X32 card channels. Confirm which USB channels the Mac/browser supplies before a service; routing to the first USB channel is a starting point, not a verified channel mapping. Use the input meter, then transcribe a known spoken reference. Built-in microphone testing needs none of this hardware.
