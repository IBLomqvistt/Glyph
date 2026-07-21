#!/usr/bin/env bash

set -u

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
failures=0

pass() {
  printf 'PASS  %s\n' "$1"
}

fail() {
  printf 'FAIL  %s\n' "$1"
  failures=$((failures + 1))
}

require_file() {
  if [ -f "$repo_root/$1" ]; then
    pass "$1 exists"
  else
    fail "$1 is missing"
  fi
}

required_files=(
  "README.md"
  "submission/DEVPOST.md"
  "submission/DEMO_SCRIPT.md"
  "submission/VIDEO.md"
  "submission/REPO_ACCESS.md"
  "submission/EVIDENCE.md"
  "submission/FINAL_CHECKLIST.md"
)

for required_file in "${required_files[@]}"; do
  require_file "$required_file"
done

if git -C "$repo_root" rev-parse --verify HEAD >/dev/null 2>&1; then
  pass "repository has at least one commit"
else
  fail "repository has no commits"
fi

if git -C "$repo_root" remote get-url origin >/dev/null 2>&1; then
  pass "origin remote is configured"
else
  fail "origin remote is not configured"
fi

if rg -q 'Codex' "$repo_root/README.md" && rg -q 'GPT-5\.6' "$repo_root/README.md"; then
  pass "README mentions Codex and GPT-5.6"
else
  fail "README must document Codex and GPT-5.6"
fi

if rg -q '\[VERIFY(?::|\])' "$repo_root/submission"; then
  fail "submission package still contains VERIFY markers"
else
  pass "submission package contains no VERIFY markers"
fi

if rg -q -- '- \[ \]' "$repo_root/submission/FINAL_CHECKLIST.md"; then
  fail "final checklist still has open gates"
else
  pass "final checklist has no open gates"
fi

if rg -q 'https://(www\.)?youtube\.com/watch|https://youtu\.be/' "$repo_root/submission/EVIDENCE.md"; then
  pass "YouTube URL is recorded"
else
  fail "YouTube URL is not recorded"
fi

if rg -q '/feedback.*[A-Za-z0-9_-]{8,}' "$repo_root/submission/EVIDENCE.md" && ! rg -q '/feedback.*\[VERIFY' "$repo_root/submission/EVIDENCE.md"; then
  pass "/feedback Session ID appears to be recorded"
else
  fail "/feedback Session ID is not recorded"
fi

if [ "$failures" -eq 0 ]; then
  printf '\nSUBMISSION AUDIT: PASS\n'
  exit 0
fi

printf '\nSUBMISSION AUDIT: FAIL (%s open gate%s)\n' "$failures" "$([ "$failures" -eq 1 ] && printf '' || printf 's')"
exit 1
