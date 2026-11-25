#!/bin/bash
FILE=$(jq -r '.tool_input.file_path // empty')
case "$FILE" in
  "$CLAUDE_PROJECT_DIR"/content/*)
    echo "content/ belongs to the owner. Suggest wording in chat instead." >&2
    exit 2 ;;
  "$CLAUDE_PROJECT_DIR"/tests/*)
    if [ -f "$CLAUDE_PROJECT_DIR/.claude/tests.lock" ]; then
      echo "Tests are locked. Change the site, not the test. If a test is wrong, stop and explain why." >&2
      exit 2
    fi ;;
esac
exit 0