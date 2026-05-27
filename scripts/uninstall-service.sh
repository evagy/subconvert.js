#!/bin/bash
set -euo pipefail

PLIST_DST="$HOME/Library/LaunchAgents/com.subconverter.service.plist"
PLIST_LABEL="com.subconverter.service"

echo "=== subconverter launchd service uninstaller ==="

# Unload
if [ -f "$PLIST_DST" ]; then
  launchctl bootout "gui/$(id -u)/$PLIST_LABEL" 2>/dev/null || true
  rm -f "$PLIST_DST"
  echo "Service unloaded and plist removed."
else
  echo "Service plist not found at $PLIST_DST"
fi

echo "Done."
