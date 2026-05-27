#!/bin/bash
set -euo pipefail

# Install subconverter as a launchd socket-activated service.
# When a connection arrives on port 25500, launchd starts the server automatically.
# The server stays alive for subsequent requests (KeepAlive=true).

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PLIST_SRC="$SCRIPT_DIR/com.subconverter.service.plist"
PLIST_DST="$HOME/Library/LaunchAgents/com.subconverter.service.plist"
PLIST_LABEL="com.subconverter.service"

echo "=== subconverter launchd service installer ==="
echo ""

# 1. Find node
NODE_PATH="$(which node 2>/dev/null || true)"
if [ -z "$NODE_PATH" ]; then
  echo "ERROR: node not found in PATH. Install Node.js first."
  exit 1
fi
echo "Node: $NODE_PATH"
echo "Project: $PROJECT_DIR"

# 2. Check build exists
if [ ! -f "$PROJECT_DIR/dist/index.js" ]; then
  echo ""
  echo "No dist/index.js found. Building project..."
  cd "$PROJECT_DIR"
  npm run build
  echo "Build complete."
fi

# 3. Unload existing service if running
if launchctl list "$PLIST_LABEL" &>/dev/null; then
  echo ""
  echo "Unloading existing service..."
  launchctl bootout gui/$(id -u) "$PLIST_DST" 2>/dev/null || true
fi

# 4. Generate plist from template
mkdir -p "$HOME/Library/LaunchAgents"

sed \
  -e "s|__NODE_PATH__|$NODE_PATH|g" \
  -e "s|__PROJECT_DIR__|$PROJECT_DIR|g" \
  "$PLIST_SRC" > "$PLIST_DST"

echo "Plist installed: $PLIST_DST"

# 5. Load the service
launchctl bootstrap gui/$(id -u) "$PLIST_DST"
echo "Service loaded. launchd is now listening on port 25500."

# 6. Verify
echo ""
echo "=== Service status ==="
launchctl print "gui/$(id -u)/$PLIST_LABEL" 2>/dev/null | head -20 || true

echo ""
echo "=== Done ==="
echo "launchd is now listening on 127.0.0.1:25500 (TCP)."
echo "The subconverter server will start automatically on the first request."
echo ""
echo "To check logs: tail -f $PROJECT_DIR/subconverter.log"
echo "To uninstall:   ./scripts/uninstall-service.sh"
echo "To test:        curl http://127.0.0.1:25500/version"
