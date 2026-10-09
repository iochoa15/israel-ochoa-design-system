#!/bin/zsh
# finish -> render -> compare colors -> fix, N rounds. Usage: loop.sh <name-filter> [rounds]
set -e
HERE=${0:A:h}; ROOT=${HERE:h:h}; PY=${PY:-python3}; SHOOT=${SHOOT:?set SHOOT to shoot2.mjs}
W=$ROOT/06_solid_clay/work; O=$ROOT/06_solid_clay; S="$ROOT/../illustrations and models/Still Illustration"
for i in $(seq 1 ${2:-3}); do
  /Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python $HERE/finish.py -- $W $O "$1" 2>&1 | grep FINISHED | cut -c1-120
  models=(); for g in $O/*"$1"*.glb; do models+=("models-v2/06_solid_clay/${g:t}"); done
  (cd ${SHOOT:h} && node $SHOOT http://localhost:8765 $O/previews $models >/dev/null)
  $PY $HERE/calibrate.py $W $O/previews "$S" "$1"
done
