#!/bin/zsh
# Clean a folder of Tripo .glb exports for the website.
#   ./3d/process.sh <exports_folder> [--tris 40000] [--bake]
# Output: 3d/web/<name>.glb, 3d/web/previews/*.png, 3d/web/report.json
set -e
HERE="${0:A:h}"
IN="${1:?give the folder with the Tripo .glb files}"
shift
BLENDER="/Applications/Blender.app/Contents/MacOS/Blender"
"$BLENDER" --background --factory-startup --python "$HERE/scripts/clean_models.py" -- "$IN" "$HERE/web" "$@"
