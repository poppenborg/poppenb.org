#!/bin/bash
[ -f "$CLAUDE_PROJECT_DIR/.claude/tests.lock" ] || exit 0
cd "$CLAUDE_PROJECT_DIR"
if ! npm run check > /tmp/site-check.log 2>&1; then
  echo "Checks are failing. Keep working. Last output:" >&2
  tail -n 40 /tmp/site-check.log >&2
  exit 2
fi
exit 0