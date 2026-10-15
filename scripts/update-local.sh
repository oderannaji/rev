#!/usr/bin/env bash
set -euo pipefail

# Run from any directory, preserving the checkout's ignored data and models.
cd "$(dirname "$0")/.."
target_branch="${1:-staging}"
if [[ ! "$target_branch" =~ ^(staging|main|feature/[a-zA-Z0-9._/-]+)$ ]] || [[ "$target_branch" == *..* ]]; then
  printf '%s\n' 'Choose staging, main, or a feature/name branch.' >&2
  exit 1
fi
if [[ -n "$(git status --porcelain)" ]]; then
  printf '%s\n' 'Save or commit your checkout changes before updating. No files were changed.' >&2
  exit 1
fi
node --input-type=module <<'JS'
import net from 'node:net';
const [major,minor]=process.versions.node.split('.').map(Number);
if(major<22 || major===22 && minor<12) throw Error('Node.js 22.12 or newer is required.');
const port=Number(process.env.PORT || 4173);
if(!Number.isInteger(port)||port<1||port>65535) throw Error('PORT must be 1–65535.');
const probe=net.createServer();
probe.once('error',()=>{console.error(`Stop the app using port ${port} first (Ctrl+C in its terminal), then run the update again.`);process.exitCode=1;});
probe.listen(port,'127.0.0.1',()=>probe.close());
JS

previous_lock="$(git rev-parse HEAD:package-lock.json)"
git fetch origin "refs/heads/$target_branch:refs/remotes/origin/$target_branch"
if git show-ref --verify --quiet "refs/heads/$target_branch"; then
  git switch "$target_branch"
else
  git switch --track -c "$target_branch" "origin/$target_branch"
fi
git merge --ff-only "origin/$target_branch"
if [[ ! -d node_modules || "$previous_lock" != "$(git rev-parse HEAD:package-lock.json)" ]]; then
  npm ci
fi
npm run build
printf '%s\n' "Updated to $(git rev-parse --short HEAD) on $target_branch. Starting Shepherd Pro."
exec npm start
