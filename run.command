#!/bin/bash
# Double-clickable macOS launcher — just runs run.sh in a Terminal window.
cd "$(dirname "$0")"
./run.sh
echo ""
read -n 1 -s -r -p "Press any key to close this window..."
