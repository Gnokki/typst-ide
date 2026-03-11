#!/usr/bin/env bash
# demo.sh — record demo GIFs for Typst IDE
#
# Usage:
#   cd demo && bash demo.sh              # full pipeline: build + record + gif
#   cd demo && bash demo.sh --skip-build # skip the Tauri build step
#   cd demo && bash demo.sh --gif-only   # only convert existing PNGs to GIFs
#
# Prerequisites:
#   cargo install tauri-driver
#   sudo apt install ffmpeg

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEMO_DIR="$REPO_ROOT/demo"
OUTPUT_DIR="$DEMO_DIR/output"
IMAGES_DIR="$REPO_ROOT/images"

# ## Build #################################################################

if [[ "${1:-}" != "--skip-build" && "${1:-}" != "--gif-only" ]]; then
    echo "==> Building frontend…"
    (cd "$REPO_ROOT/frontend" && npm run build)

    echo "==> Building Tauri release binary…"
    (cd "$REPO_ROOT/crates/app" && cargo tauri build --no-bundle)
fi

# ## Record screenshots ######################################################

if [[ "${1:-}" != "--gif-only" ]]; then
    rm -rf "$OUTPUT_DIR"
    mkdir -p "$OUTPUT_DIR"

    echo "==> Recording demos via WebdriverIO…"
    (cd "$DEMO_DIR" && npx wdio run wdio.conf.js)
fi

# ## Convert PNG sequences to GIFs #############################################

echo "==> Converting to GIFs..."

for dir in "$OUTPUT_DIR"/*/; do
    [ -d "$dir" ] || continue
    name="$(basename "$dir")"
    pngs=("$dir"*.png)
    [[ -f "${pngs[0]}" ]] || { echo "  skip $name (no PNGs)"; continue; }

    echo "  $name (${#pngs[@]} frames)"

    list=$(mktemp)
    for f in "${pngs[@]}"; do
        printf "file '%s'\nduration 0.1\n" "$f" >> "$list"
    done

    ffmpeg -y -loglevel warning \
        -f concat -safe 0 -i "$list" \
        -vf "fps=10,scale=1200:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer" \
        "$OUTPUT_DIR/${name}.gif"

    rm -f "$list"
    cp "$OUTPUT_DIR/${name}.gif" "$IMAGES_DIR/${name}.gif"
    echo "    -> images/${name}.gif"
done

echo ""
echo "Done. GIFs written to images/"
