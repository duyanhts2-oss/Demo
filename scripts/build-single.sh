#!/usr/bin/env bash
# Gộp index + CSS + JS thành 1 file HTML (dùng để chia sẻ bản demo, không cần server).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p dist
{
  echo '<title>GomĐơn POS</title>'
  echo '<meta name="claude:viewport-fit-sides" content="cover">'
  echo '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&display=swap">'
  echo '<style>'; cat src/styles.css; echo '</style>'
  echo '<div id="app"></div>'
  echo '<script>'; cat src/app.js; echo '</script>'
} > dist/gomdon.html
echo "Built dist/gomdon.html ($(wc -c < dist/gomdon.html) bytes)"
