# Clay models v2 (Oct 8 2026)

Goal: 3D models that look as close as possible to the still illustrations in `../illustrations and models/Still Illustration`.
Nothing in `illustrations and models/` was changed. Every stage is kept in its own folder.

## Folders

| Folder | What's inside |
|---|---|
| `01_audit/` | The Tripo files as they came: front / side / 3/4 renders, `audit.json` (triangles, parts, textures), `__web.png` = website look |
| `02_turned_and_light/` | Stage 1: each model turned to face like its still, heavy ones made lighter. No color changes. |
| `03_final/` | **Use these.** Stage 2: stage 1 + colors nudged toward the still + width fixed where the outline was off. `report.json` has the numbers. |
| `04_from_scratch/` | Cube (Rubik's) and Doll (matryoshka): no Tripo file existed, so they were built in Blender from scratch. |
| `05_compare/` | `all_22__still_vs_model.png` (still / website front / website 3/4), `all_models.blend` (all 22 in one Blender scene) |
| `work/` | Working files (points, angle checks, logs). Safe to ignore. |
| `scripts/` | Everything is a script, so it can be re-run when you swap in a new Tripo file. |

Each model has previews in its folder's `previews/`: `__web.png` (front, rendered with the website's real lights in three.js) and `__web34.png` (turned 35°).

## What was done to the Tripo models

1. **Turned to match the still.** `align_to_still.py` tries hundreds of angles and keeps the one whose outline and colors best match the still (so the beer label, the pizza face, the taco filling face you). Hand-picked where the search was fooled: Taco, Cube, Doll (noted in `work/alignment.json`).
2. **Lighter.** Pizza, Evangelion and Sailor Moon were ~1M triangles each: now 40k, with the lost detail baked into a normal map. The skull (58 parts, 174 images) is now one piece with one texture set. Total: **312 MB → 14 MB** for all 20.
3. **Same clay finish**: matte, no metal, same roughness everywhere.
4. **Colors matched to the still** (`color_match.py`): average color difference went from 17.6 to 13.1 (lower = closer). Biggest wins: D, Dumbbell, Kettlebell, Taco, Statue.
5. **Proportions** (`proportions.py`): Beer, Pencil a bit slimmer; Taco, Glove a bit wider, so the outline matches the still.
6. Parts kept for future hover effects: Lego (3 bricks), Beer (3), I (3), Taco (12), Statue (9), Cube (top layer + base, the top can spin), Doll (big + small).

## Re-run

```
B=/Applications/Blender.app/Contents/MacOS/Blender
# 1. sample points, 2. find angles (python with numpy+Pillow), 3. refine, 4. website previews (needs a local server on :8765 at 3d/)
$B -b --factory-startup --python scripts/sample_points.py -- "../illustrations and models/GBL Models" work/points
python scripts/align_to_still.py work/points "../illustrations and models/Still Illustration" work/alignment.json
$B -b --factory-startup --python scripts/refine.py -- "../illustrations and models/GBL Models" 03_final work/alignment.json --color work/color_v1.json --shape work/proportions.json
$B -b --factory-startup --python scripts/build_cube.py -- work/scratch_upright   # and build_doll.py
```

## Known gaps

- Lighting in the stills is softer than the website's, so some models still read a little darker (Taco shell, Beer).
- Tripo guessed the backs (never seen in the stills): e.g. the Guadalupe and Rainbow backs are plain.
- Cube colors are a made-up scramble (the still's exact pattern isn't readable all around).

## 06_solid_clay (Oct 8 2026, the version to use now)

Israel's notes on 03_final: textures rough, edges jagged, colors washed out, light painted in as color (D, O), holes and a bumpy A, the Concha not reading as clay. This pass drops the AI textures entirely:

- **Shape**: every model is rebuilt as one clean closed skin (voxel remesh: no holes, no jagged bits), then softened like hand-rolled clay. Open shells get closed or a thin wall first; low-polygon ones (the I) are rounded off first.
- **Color**: a few flat clay colors per object, named by hand in `scripts/solid/settings.json` ("seeds") and set from the still. Each point takes the closest one to what the AI painted, after removing baked-in light where needed. Neighbors vote, small speckles get absorbed, and some colors are limited to where they belong (zones: pencil tip, dumbbell handle, the four stars).
- **Borders**: the triangle count is lowered first, then each color border is cut as a smooth line (no zigzag, no fraying).
- **Color check loop**: render with the website's lights, compare each color with the still, fix, and repeat. Very bright colors are darkened slightly instead of losing saturation. A few colors are locked by eye (bottle brown, glove label, light blue pencil stripe, Eva base, star red).
- No textures at all: ~120k triangles, about 0.9 MB per model, 20.5 MB for 22. Cube and Doll are copies of 04_from_scratch.

Re-run one model (venv with numpy, scipy, scikit-learn, Pillow; local server on 3d/ at :8765):
```
Blender -b --factory-startup --python scripts/solid/prepare.py -- "../illustrations and models/GBL Models" 06_solid_clay/work work/alignment.json work/proportions.json "Concha"
python scripts/solid/label.py 06_solid_clay/work "../illustrations and models/Still Illustration" scripts/solid/settings.json "Concha"
PY=python SHOOT=<path>/shoot2.mjs scripts/solid/loop.sh "Concha" 3
```
Compare: `06_solid_clay/compare/all_22__still_old_new.png` (still, 03_final, new front, new 3/4) and `all_solid_clay.blend`.
Known gaps: tiny painted details are simplified (Guadalupe's stars and lace, the EVERLAST lettering, the skull's nose). The Beer label is a little paler than the still.

## 07_tripo_clean (Oct 9 2026, base for hand refinement)

Israel's call after 06: keep his Tripo models (shape + paint) and only clean them, then refine details by hand in Blender.
`scripts/clean/clean_tripo.py` changes nothing he designed:

- **Stitched**: Tripo splits the skin wherever the texture is cut (thousands of open edges); those are welded shut, so sculpting doesn't crack it open. The paint layout (UVs) is untouched.
- **Small gaps closed** (short seam leftovers only, 32 in total). Real openings (the skull's nose, pockets) are left as they are. Every face keeps Tripo's facing.
- **Same look**: Tripo's painted texture is untouched and its smooth shading is copied back (hides the joints between pieces). Turned like the still, scaled to 1 x 1.
- **One clay finish**: matte (0.7), no metal, bump (normal map) at 60%. The unplugged Tripo maps stay inside each .blend.
- Full detail kept (Pizza, Eva, Sailor Moon are ~1M triangles). Parts kept: Lego bricks, Beer, I, Taco, Statue, Skull pieces.

Files:
- `07_tripo_clean/blend/<name>.blend`: one per object, for hand editing. Each has a front camera and the still as a see-through reference (`Still (reference)`, hidden: click its eye icon, view from the front with numpad 1).
- `07_tripo_clean/<name>.glb` + `previews/`: website-light renders.
- `07_tripo_clean/compare/all_22__5_versions.png`: still | Tripo original | 03 | 06 | 07 | 07 at 3/4.
- `07_tripo_clean/compare/all_versions.blend`: every version side by side, one collection per version (hide a column with one click).

Re-run: `Blender -b --factory-startup --python scripts/clean/clean_tripo.py -- "../illustrations and models/GBL Models" 07_tripo_clean work/alignment.json "../illustrations and models/Still Illustration" [name]`, then `scripts/clean/compare_sheet.py` and `scripts/clean/compare_scene.py`.

## Local cleanup (Oct 9 2026)

To save space, this Mac only keeps the editables: `07_tripo_clean/blend/*.blend` (all 22, Cube and Doll made with `scripts/clean/make_editable.py`), the scripts, `work/alignment.json` + `proportions.json`, and the comparison sheet.
- Older stages (01 to 06, 07 GLBs and previews) are still on GitHub, hidden locally with git sparse checkout. Bring them back: `git sparse-checkout disable`.
- Files that were never on GitHub (working files, comparison .blend files, .blend1 backups) went to the Mac Trash in `io-c models-v2 cleanup 2026-10-09`. They're gone for good once the Trash is emptied; scripts can rebuild them from the Tripo files.
- 410 iCloud " 2" copies (identical duplicates) went to the same Trash folder.

## 08_web (Oct 9 2026): light copies for the website

`scripts/clean/web_export.py` reads the 22 editables in `07_tripo_clean/blend` (it never saves them) and writes `08_web/<name>.glb`:
- Triangles: only Pizza, Eva and Sailor Moon (~1M each) are reduced to 150k. Everything else keeps every triangle.
- Paint images: each image is sized to what its part needs (2048px for a whole object, smaller for small pieces; bump maps get half). The skull's 174 images were mostly 4096px for tiny pieces.
- Result: 54 MB → 16 MB for all 22, with no visible difference in website-light renders (checked side by side, including 2x close-ups).
Re-run after hand edits: `Blender -b --factory-startup --python scripts/clean/web_export.py -- 07_tripo_clean/blend 08_web ["Concha"]`

## 09_sprites (Oct 9 2026): flipbook versions for /homepage-7

Each 3D object pre-shot from 72 angles (24 turns × tilts 10°/30°/50°, 240px cells), with the website's exact 3D lights and framing (`scripts/web_preview/sprite.html`), packed into one WebP sheet (~200 KB each, 3.8 MB for 19). The hero shows the right photo for the current angle: plain images, no 3D engine, phone-friendly.
Re-make after editing a model: serve `3d/` on :8765, then `node scripts/web_preview/make_sheets.mjs <outDir> "models-v2/08_web/<name>.glb"` and convert the PNG to WebP (q82).
