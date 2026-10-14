#!/usr/bin/env bash
set -euo pipefail

shepherd_mode="${1:---all}"
if [[ "$#" -gt 1 || ( "$shepherd_mode" != --all && "$shepherd_mode" != --speech-only ) ]]; then
  echo 'Usage: bash scripts/setup-local-mac.sh [--all|--speech-only]' >&2
  exit 1
fi

# Run on the owner's Mac. Downloads public tools/models, never vendor assets.
if [[ "$(uname -s)" != Darwin || "$(uname -m)" != arm64 ]]; then
  echo 'This setup targets an Apple-silicon Mac. See docs/LOCAL_MAC_SETUP.md.' >&2
  exit 1
fi
if ! command -v brew >/dev/null 2>&1; then
  echo 'Install Homebrew from https://brew.sh, then run this script again.' >&2
  exit 1
fi
if ! xcode-select -p >/dev/null 2>&1; then
  echo 'Install Apple Command Line Tools with xcode-select --install, then rerun.' >&2
  exit 1
fi

shepherd_tools="${SHEPHERD_TOOLS_DIR:-$HOME/Library/Application Support/Shepherd Pro/local-tools}"
mkdir -p "$shepherd_tools"
shepherd_formulas=(cmake)
if [[ "$shepherd_mode" == --all ]]; then shepherd_formulas+=(ollama); fi
for formula in "${shepherd_formulas[@]}"; do
  if ! brew list --formula "$formula" >/dev/null 2>&1; then brew install "$formula"; fi
done

if [[ "$shepherd_mode" == --all ]]; then
# Local-only server, at most one loaded Ollama model at a time on a 16 GB Mac.
# If Ollama is already running, preserve it. The owner should also disable its
# cloud support as described in the setup guide.
if ! curl --fail --silent --max-time 3 http://127.0.0.1:11434/api/tags >/dev/null; then
  OLLAMA_HOST=127.0.0.1:11434 OLLAMA_NO_CLOUD=1 OLLAMA_MAX_LOADED_MODELS=1 nohup "$(brew --prefix)/bin/ollama" serve >"$shepherd_tools/ollama.log" 2>&1 &
  shepherd_ready=0
  for attempt in {1..30}; do
    if curl --fail --silent --max-time 2 http://127.0.0.1:11434/api/tags >/dev/null; then shepherd_ready=1; break; fi
    sleep 1
  done
  if [[ "$shepherd_ready" != 1 ]]; then echo "Ollama did not start. Read $shepherd_tools/ollama.log" >&2; exit 1; fi
fi
for model in embeddinggemma:latest qwen3:4b; do
  if ! ollama show "$model" >/dev/null 2>&1; then ollama pull "$model"; fi
done

fi

shepherd_whisper="$shepherd_tools/whisper.cpp-v1.7.6"
if [[ ! -d "$shepherd_whisper" ]]; then
  git clone --depth 1 --branch v1.7.6 https://github.com/ggml-org/whisper.cpp.git "$shepherd_whisper"
fi
if [[ ! -x "$shepherd_whisper/build/bin/whisper-cli" || ! -x "$shepherd_whisper/build/bin/whisper-server" ]]; then
  cmake -S "$shepherd_whisper" -B "$shepherd_whisper/build" -DCMAKE_BUILD_TYPE=Release -DGGML_METAL=ON
  cmake --build "$shepherd_whisper/build" --config Release -j 4 --target whisper-cli whisper-server whisper-server
fi
shepherd_model="$shepherd_whisper/models/ggml-small.bin"
if [[ ! -s "$shepherd_model" ]]; then
  curl --fail --location --retry 3 https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin --output "$shepherd_model.download"
  mv "$shepherd_model.download" "$shepherd_model"
fi

printf '\nOpen Shepherd Pro → Settings → Local AI. Enable local AI, then paste:\n\nWhisper executable:\n%s\n\nWhisper model file:\n%s\n\n' "$shepherd_whisper/build/bin/whisper-cli" "$shepherd_model"
if [[ "$shepherd_mode" == --all ]]; then
  echo 'Save settings, check status, then build the BSB neural index.'
else
  echo 'Save settings, then open Transcripts. Test the microphone level and start offline transcription.'
  echo 'Ollama is not required for speech. Search and drafting models were skipped; run with --all later if wanted.'
fi
echo 'No app data or existing model files were replaced. See docs/LOCAL_MAC_SETUP.md for testing.'
