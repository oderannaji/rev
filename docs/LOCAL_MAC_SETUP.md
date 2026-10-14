# Local setup for your M5 Mac with 16 GB RAM

Target supplied by the owner: M5, 16 GB RAM, macOS Tahoe 26.4, English speech (Nigerian English in services), Behringer X32 mixer, OBS and EasyWorship 8.0.49. The EasyWorship receiver OS and X32 expansion card are still unconfirmed. Compatibility and performance on this Mac have not yet been tested. This setup script has been syntax-checked in Linux, not executed on a Mac.

## First test: speak directly to the Mac

You do not need the X32 for this test.

1. Start the built app with `npm start` (Node 22.12+), open **Transcripts**, and choose **System default microphone** or the built-in Mac microphone under **Audio input**. If names are hidden, permit microphone access and the list will refresh.
2. Click **Test microphone level**, grant microphone permission, and speak. The level should move and the app should say **Audio is reaching the app**. This test works without Whisper or Ollama and sends no audio to the transcription endpoint. It does not save audio or create text. Click **Stop microphone test** when finished.
3. If Whisper is not installed, run the smaller setup:

   ```bash
   bash scripts/setup-local-mac.sh --speech-only
   ```

   This installs missing CMake/Whisper components and the speech model; it skips Ollama, EmbeddingGemma and Qwen. Homebrew and Apple's Command Line Tools are prerequisites as below. Existing files are reused.
4. In **Settings → Local AI**, enable local AI, paste the two Whisper paths printed by the script, and save. An Ollama-unavailable message is expected with speech-only setup; it does not prevent Whisper transcription.
5. Return to **Transcripts** and click **Refresh audio setup** if needed. Click **Use offline microphone** and say: “Today we are reading John chapter three, verse sixteen.” Click **Stop recording** to submit the final captured section. Wait for the local result and review the text. A level meter alone is not proof of transcription success.
6. Choose **Find related Scripture** separately. The current app does not automatically take detected verses live. Topic expansion works without a neural index; choose Context only after installing the search model and building its index.

Later, run the script without `--speech-only` to install the remaining local models. It reuses the Whisper installation.

## Selected starting models

- **Search:** `embeddinggemma:latest` in Ollama. Shepherd Pro uses it to embed the query and every verse, then combines cosine-ranked results with local lexical results using reciprocal rank fusion. Explicit scripture references keep priority. This is our own retrieval implementation, not Pewbeam's exact algorithm. Build the verse index once in Settings; changes to the model digest require rebuilding it. The float32 vector index is stored in the app's local data directory.
- **Drafts:** `qwen3:4b` in Ollama, with thinking disabled, an 8,192-token context, bounded output, and model unload after generation. This is a starting choice for 16 GB, not a measured throughput or quality guarantee. Maximum source notes: 16,000 characters. It can help draft and edit, but scripture references, theology and factual claims need review. Cloud drafting remains optional and is never used as an automatic fallback when local AI is enabled.
- **Speech:** multilingual **Whisper small** through whisper.cpp with Metal enabled. The language code is `en`; Nigerian English is an accent evaluation target, not a separate Whisper language code or a claim of accent-specific fine-tuning. Test this first before downloading a larger model such as large-v3-turbo. Quantized turbo is a possible later accuracy/speed comparison.

The model files require several GB of disk space. Downloads need internet; after installation and indexing, these paths perform inference locally. Models are not bundled in the source ZIP. Public model licenses/terms apply independently: review the Gemma terms for EmbeddingGemma, the selected Qwen model's license and Whisper/whisper.cpp notices before redistribution. The setup script downloads them directly for local use.

## Install once

1. Install Apple's Command Line Tools (`xcode-select --install`) and Homebrew from https://brew.sh if needed.
2. Open Terminal in your unzipped Shepherd Pro folder and run:

   ```bash
   bash scripts/setup-local-mac.sh
   ```

   The script installs missing Ollama/CMake tools, pulls missing Ollama models, builds whisper.cpp v1.7.6 with Metal, and downloads Whisper small. Existing models/builds are reused. It does not reinstall the app, re-extract Pewbeam, or overwrite saved services.
3. Start Shepherd Pro with `npm start` (Node 22.12+). For its desktop wrapper, follow [desktop setup](../desktop/README.md).
4. In **Settings → Local AI**, enable local AI. Paste the two absolute Whisper paths printed by the setup script. Leave the selected model names as above, save, and check status.
5. Click **Build index** for BSB. Wait until the full verse count is complete. Other translations need their own index.

The script starts an Ollama server if none is already running. After a Mac restart, start Ollama again. For a terminal-managed instance with no cloud support and one loaded model at a time:

```bash
OLLAMA_NO_CLOUD=1 OLLAMA_MAX_LOADED_MODELS=1 OLLAMA_HOST=127.0.0.1:11434 ollama serve
```

If an Ollama instance is already running, configure its cloud setting separately; the setup script preserves existing processes. Shepherd Pro only accepts loopback Ollama endpoints and rejects cloud-labelled models and returned remote-model entries. Do not use custom model aliases that proxy to a cloud service. No API key is needed for these selected local models.

## Use and check

- **Scripture → Context:** try paraphrases and review the suggested verses. Reference, Smart, Phrase and Topic modes still work without models. Topic remains synonym expansion; Context is the neural mode.
- **Content → Draft with AI:** the UI must say it runs locally with your model. Try a short set of your own notes first. Do not use generated quotes without checking the Bible text.
- **Transcripts:** use the offline microphone or import a browser-decodable audio file lasting 0.5–120 seconds. Audio is converted to mono 16 kHz PCM WAV and sent only to this app's local server. Temporary WAV and result files are removed after transcription. Save the reviewed transcript explicitly.
- Live microphone capture processes 20-second sections, so it is delayed transcription, not word-by-word streaming. If inference falls behind, capture pauses to finish the queued sections. Section boundaries can split a phrase. Suggested verses are operator-triggered and never automatically taken live.
- Perform a brief offline check after models and index are installed: disconnect internet, search a paraphrase, transcribe a recording and generate a short draft. OBS and the app need to remain running. NDI needs the local network even when internet is disconnected.

To evaluate Nigerian English, start with two or three minutes of speech you have permission to use, split into clips of at most two minutes. Include normal sermon delivery, names, spoken Bible references and your usual microphone/mixer. Compare the transcript with a manually corrected version; measure transcription delay and any wrong scripture references. We have not performed this accuracy or M5 memory/latency evaluation yet.

## What was tested here

Cloud tests exercise saved settings, the real local HTTP adapter against a fixture Ollama server, vector indexing/ranking/restart/model-change handling, bounded speech CLI invocation with fixture output, actual PCM audio validation, and browser workflows. They do **not** measure real model inference or Nigerian English recognition. This environment blocks the Ollama model registry and Hugging Face downloads, so the actual model files could not be installed here. Mac hardware testing remains required.
