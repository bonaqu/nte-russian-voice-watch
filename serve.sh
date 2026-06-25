#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
echo "NTE Russian Voice Watch: http://localhost:8080"
python3 -m http.server 8080
