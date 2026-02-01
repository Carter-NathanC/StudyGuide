#!/bin/sh

# This script runs at container startup.
# It injects environment variables into the static web server files.

# 1. Target the location where Nginx serves files
ROOT_DIR=/usr/share/nginx/html

# 2. Create a JS file that sets window.env
echo "window.env = {" > "$ROOT_DIR/env-config.js"

# 3. Read specific environment variables and write them to the JS object
#    Note: We only expose variables explicitly listed here to prevent leaking sensitive system envs.
if [ -n "$GEMINI_API_KEY" ]; then
  echo "  GEMINI_API_KEY: \"$GEMINI_API_KEY\"," >> "$ROOT_DIR/env-config.js"
fi

echo "};" >> "$ROOT_DIR/env-config.js"

# 4. Start Nginx (execute the CMD from the Dockerfile)
exec "$@"