#!/usr/bin/env bash
# T23 token grep + K15/X26 local-fixture / build-slug guards (review-queue spec).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mode="${1:-all}"

fail() {
  echo "::error::$*"
  exit 1
}

check_local_fixtures() {
  local d files
  for d in src/fixtures/local src/fixtures/github/_local; do
    [ -d "$d" ] || continue
    files="$(find "$d" -type f ! -name '.gitkeep' 2>/dev/null || true)"
    if [ -n "$files" ]; then
      printf '%s\n' "$files"
      fail "$d must not contain files in a production build (real captures are gitignored; use npm run dev)"
    fi
  done
}

check_tokens() {
  local target="$1"
  [ -e "$target" ] || return 0
  if grep -R -n -E --binary-files=without-match 'github_pat_|ghp_|ghs_|gho_' "$target"; then
    fail "T23: GitHub token pattern found under $target"
  fi
}

check_build_slugs() {
  local build_dir="${1:-build}"
  [ -d "$build_dir" ] || return 0
  local hits slug owner repo bad=0
  if grep -R -n -E --binary-files=without-match 'k-dot-greyz/dev-master' "$build_dir"; then
    fail "${build_dir}/ contains k-dot-greyz/dev-master (private captures must never ship)"
  fi
  hits="$(grep -R -n -E --binary-files=without-match 'github\.com/k-dot-greyz/' "$build_dir" || true)"
  if [ -n "$hits" ] && printf '%s\n' "$hits" | grep -v 'k-dot-greyz/glitchworks-tarot' >/dev/null; then
    printf '%s\n' "$hits"
    fail "${build_dir}/ contains github.com/k-dot-greyz/ slugs other than glitchworks-tarot"
  fi
  hits="$(grep -R -o -E --binary-files=without-match 'github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+' "$build_dir" | sed 's/.*github\.com/github.com/' | sort -u || true)"
  while IFS= read -r slug; do
    [ -z "$slug" ] && continue
    owner="${slug#github.com/}"
    repo="${owner#*/}"
    owner="${owner%%/*}"
    repo="${repo%.git}"
    case "$owner" in
      example-org | users | repos | orgs | settings | o) continue ;;
    esac
    echo "non-allowlisted slug in ${build_dir}: $slug"
    bad=1
  done <<< "$hits"
  [ "$bad" -eq 0 ] || fail "${build_dir}/ contains GitHub slugs outside the synthetic allowlist (example-org/*)"
}

case "$mode" in
  pre)
    check_local_fixtures
    check_tokens src
    ;;
  post)
    check_tokens build
    check_build_slugs build
    ;;
  all)
    check_local_fixtures
    check_tokens src
    check_tokens build
    check_build_slugs build
    ;;
  *)
    echo "usage: $0 [pre|post|all]" >&2
    exit 2
    ;;
esac

echo "ci-review-guards ($mode): ok"
