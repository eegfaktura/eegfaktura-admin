#!/usr/bin/env bash
# SheetJS (xlsx) comes from the SheetJS CDN, not from npm (see README → Dependencies), so Dependabot does
# not watch it.
#
#   pin     package.json and package-lock.json still pin exactly URL and INTEGRITY below
#   latest  the CDN has no newer release than URL
#
# Updating SheetJS: change URL and INTEGRITY here together with package.json and package-lock.json.
set -euo pipefail

URL='https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz'
INTEGRITY='sha512-oLDq3jw7AcLqKWH2AhCpVTZl8mf6X2YReP+Neh0SJUzV/BdZYjth94tG5toiMB1PPrYtxOCfaoUCkvtuH+3AJA=='
LATEST='https://cdn.sheetjs.com/xlsx-latest/package/package.json'
summary="${GITHUB_STEP_SUMMARY:-/dev/stdout}"

case "${1:-}" in
  pin)
    failed=0
    spec="$(node -p 'require("./package.json").dependencies.xlsx')"
    if [ "$spec" != "$URL" ]; then
      echo "::error file=package.json::xlsx is '$spec', expected $URL"; failed=1
    fi
    lock_spec="$(node -p 'require("./package-lock.json").packages[""].dependencies.xlsx')"
    if [ "$lock_spec" != "$URL" ]; then
      echo "::error file=package-lock.json::the root entry has xlsx '$lock_spec', expected $URL"; failed=1
    fi
    resolved="$(node -p 'require("./package-lock.json").packages["node_modules/xlsx"].resolved')"
    if [ "$resolved" != "$URL" ]; then
      echo "::error file=package-lock.json::xlsx is resolved to '$resolved', expected $URL"; failed=1
    fi
    integrity="$(node -p 'require("./package-lock.json").packages["node_modules/xlsx"].integrity')"
    if [ "$integrity" != "$INTEGRITY" ]; then
      echo "::error file=package-lock.json::the xlsx integrity is '$integrity', expected $INTEGRITY"; failed=1
    fi
    if [ "$failed" = 1 ]; then
      echo "### SheetJS pin broken" >> "$summary"
      echo "package.json and package-lock.json must point to \`$URL\` with integrity \`$INTEGRITY\` (see README → Dependencies)." >> "$summary"
      exit 1
    fi
    echo "SheetJS pin ok: $URL ($INTEGRITY)"
    ;;
  latest)
    ours="$(echo "$URL" | sed -E 's#.*/xlsx-([0-9][^/]*)\.tgz$#\1#')"
    latest="$(curl -fsSL "$LATEST" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).version))')"
    newest="$(printf '%s\n%s\n' "$ours" "$latest" | sort -V | tail -n1)"
    if [ "$latest" != "$ours" ] && [ "$newest" = "$latest" ]; then
      echo "::error::SheetJS $latest is out on the CDN, we use $ours"
      {
        echo "### SheetJS $latest is available (we use $ours)"
        echo "Check its CHANGELOG and tag on git.sheetjs.com, then update URL and integrity as described in README → Dependencies."
      } >> "$summary"
      exit 1
    fi
    echo "SheetJS up to date: $ours (CDN latest: $latest)"
    ;;
  *) echo "usage: $0 pin|latest" >&2; exit 2 ;;
esac
