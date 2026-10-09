# Where we left off (Oct 9 2026)

Read this first when restarting. It covers the 3D clay models and the Framer site state.

## 1. 3D clay models: current state

All versions live in `3d/models-v2/` (details and re-run commands in its `README.md`). Nothing is swapped into Framer yet.

| Folder | What | Israel's verdict |
|---|---|---|
| `01_audit` | Tripo files as they came, rendered | reference |
| `03_final` | first pass: turned, lighter, colors nudged | rough textures, washed-out colors |
| `06_solid_clay` | rebuilt as flat-color clay, no textures | "dull, colors weird, bad painting" |
| **`07_tripo_clean`** | **his Tripo models, only cleaned** (seams stitched, small gaps closed, turned like the still, same matte finish, paint untouched) | **"looking way better": the base to use** |

- Comparison: `3d/models-v2/07_tripo_clean/compare/all_22__5_versions.png` (still, Tripo original, 03, 06, 07, 07 at 3/4).
- All versions in Blender: `07_tripo_clean/compare/all_versions.blend` (local only, ~670 MB, not on GitHub).
- One Blender file per object for hand editing: `07_tripo_clean/blend/<name>.blend` (local only, not on GitHub). Each has a front camera and the still as a hidden see-through reference.
- Cube and Doll had no Tripo file: they use the Blender-built versions in `04_from_scratch`.

## 2. Next steps (in order)

1. **Israel refines the 07 models by hand in Blender** (texture paint for color fixes, sculpt for shape).
2. **Set up the live Blender connector** so he can dictate small changes while Blender is open:
   - Claude Desktop → Customize → Connectors → + → Browse → "Blender" → Add.
   - In Blender 5.2: Edit → Preferences → Add-ons → install the official MCP add-on (blender.org/lab/mcp-server).
   - Each session: open the file, press N, BlenderMCP tab → "Connect to Claude".
   - Dictate with the Mac's Fn key pressed twice. Save before each request.
   - Note: before Oct 9 there was NO live connection. Claude ran Blender in the background with scripts (opens a file, runs, saves, closes).
3. **Make light web copies** once his edits are done. 07 is heavy as is: 54 MB for 20 (Pizza 13 MB, Eva 7.7, Sailor Moon 7.2) because of full-size 4K textures and ~1M triangles on those three. Plan: smaller textures + lower triangles with the detail baked into a bump map, estimated 0.5 to 1 MB each, ~15 MB total (a guess until run). Only export the ones he changed.
4. Swap the web copies into Framer (`Clay3D` / `FloatingClay`) on `/homepage-5` for review. Israel publishes the site himself.

## 3. Framer site: still waiting on Israel

- Videos for the Capabilities deck on /about.
- Avatar image.
- Kind words: real quotes, names, photos, LinkedIn links.
- Which test pizza to remove on /homepage-5 (ZPkDotfzX top right, or iMuo4kdKn bottom right).
- Hover-effect ideas for the clay objects.
- 30 logos, links (LinkedIn, résumé, email).

## 4. Rules to keep

- Never trash old versions: every stage gets its own folder.
- Don't recolor or rebuild his Tripo models unless he asks; he refines them by hand now.
- Big working files stay off GitHub (.gitignore): Tripo sources, `work/` folders, all `.blend` files.
- This repo is public. No client-identifying material, no `_docs/ai-design-references`.
