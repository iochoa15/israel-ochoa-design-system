// Token Frame Generator v4 — Role-based scale · Golden Ratio φ = 1.618
// Newsreader (Display / Italic headings) + Wix Madefor Text (body / some headings)

figma.showUI(__html__, { width: 300, height: 560, title: "Token Frame Generator" });

// ─── Visual constants ────────────────────────────────────────────────────────
var INK    = { r: 0.06, g: 0.06, b: 0.06 };
var SUBTLE = { r: 0.38, g: 0.38, b: 0.38 };
var MUTED  = { r: 0.62, g: 0.62, b: 0.62 };
var XMUTED = { r: 0.78, g: 0.78, b: 0.78 };
var DIVCLR = { r: 0.88, g: 0.88, b: 0.88 };
var ACCENT = { r: 0.898, g: 0.275, b: 0.200 }; // red-coral brand
var BG     = { r: 1.0,  g: 1.0,  b: 1.0 };

var FRAME_W   = 1440;
var PADDING   = 80;
var CONTENT_W = FRAME_W - PADDING * 2; // 1280

var NR  = "Newsreader";
var WXT = "Wix Madefor Text";

var F = {
  nrRegular:     { family: NR,  style: "Regular" },
  nrLight:       { family: NR,  style: "Light" },
  nrLightItalic: { family: NR,  style: "Light Italic" },
  nrItalic:      { family: NR,  style: "Italic" },
  nrBold:        { family: NR,  style: "Bold" },
  wxtRegular:    { family: WXT, style: "Regular" },
  wxtSemiBold:   { family: WXT, style: "SemiBold" },
  wxtBold:       { family: WXT, style: "Bold" },
};

// ─── Font loading ────────────────────────────────────────────────────────────
function tryLoad(font) {
  return figma.loadFontAsync(font).then(function() { return true; }).catch(function() { return false; });
}

async function loadFonts() {
  // Newsreader
  await tryLoad({ family: NR, style: "Regular" });

  var nrLightOk = await tryLoad({ family: NR, style: "Light" });
  if (!nrLightOk) F.nrLight = F.nrRegular;

  var nrLItalicOk = await tryLoad({ family: NR, style: "Light Italic" });
  if (!nrLItalicOk) {
    var nrLItalic2Ok = await tryLoad({ family: NR, style: "LightItalic" });
    F.nrLightItalic = nrLItalic2Ok ? { family: NR, style: "LightItalic" } : F.nrItalic;
  }

  var nrItalicOk = await tryLoad({ family: NR, style: "Italic" });
  if (!nrItalicOk) F.nrItalic = F.nrRegular;

  var nrBoldOk = await tryLoad({ family: NR, style: "Bold" });
  if (!nrBoldOk) F.nrBold = F.nrRegular;

  // Wix Madefor Text
  await tryLoad({ family: WXT, style: "Regular" });

  var wxtSBOk = await tryLoad({ family: WXT, style: "SemiBold" });
  if (!wxtSBOk) {
    var wxtSBSpaceOk = await tryLoad({ family: WXT, style: "Semi Bold" });
    F.wxtSemiBold = wxtSBSpaceOk ? { family: WXT, style: "Semi Bold" } : F.wxtRegular;
  }

  var wxtBoldOk = await tryLoad({ family: WXT, style: "Bold" });
  if (!wxtBoldOk) F.wxtBold = F.wxtRegular;
}

// ─── Layout helpers (flat — auto-layout only where needed) ──────────────────
function hStack(name, gap) {
  var f = figma.createFrame();
  f.name = name; f.fills = []; f.clipsContent = false;
  f.layoutMode = "HORIZONTAL";
  f.primaryAxisSizingMode = "AUTO"; f.counterAxisSizingMode = "AUTO";
  f.itemSpacing = gap || 0;
  f.paddingTop = 0; f.paddingBottom = 0; f.paddingLeft = 0; f.paddingRight = 0;
  return f;
}

function vStack(name, gap) {
  var f = figma.createFrame();
  f.name = name; f.fills = []; f.clipsContent = false;
  f.layoutMode = "VERTICAL";
  f.primaryAxisSizingMode = "AUTO"; f.counterAxisSizingMode = "AUTO";
  f.itemSpacing = gap || 0;
  f.paddingTop = 0; f.paddingBottom = 0; f.paddingLeft = 0; f.paddingRight = 0;
  return f;
}

function rootFrame(name) {
  var f = figma.createFrame();
  f.name = name;
  f.fills = [{ type: "SOLID", color: BG }];
  f.clipsContent = false;
  f.layoutMode = "VERTICAL";
  f.primaryAxisSizingMode = "AUTO"; f.counterAxisSizingMode = "AUTO";
  f.itemSpacing = 0;
  f.paddingTop = PADDING; f.paddingBottom = PADDING + 40;
  f.paddingLeft = PADDING; f.paddingRight = PADDING;
  return f;
}

function txt(chars, font, size, color) {
  var t = figma.createText();
  t.fontName = font; t.fontSize = size;
  t.fills = [{ type: "SOLID", color: color }];
  t.characters = String(chars);
  t.textAutoResize = "WIDTH_AND_HEIGHT";
  return t;
}

function txtW(chars, font, size, color, w) {
  var t = figma.createText();
  t.fontName = font; t.fontSize = size;
  t.fills = [{ type: "SOLID", color: color }];
  t.characters = String(chars);
  t.resize(w, 20); t.textAutoResize = "HEIGHT";
  return t;
}

function divider(w) {
  var r = figma.createRectangle();
  r.name = "divider"; r.resize(w, 1);
  r.fills = [{ type: "SOLID", color: DIVCLR }];
  return r;
}

function spacer(h) {
  var r = figma.createRectangle();
  r.name = "spacer"; r.fills = []; r.resize(1, h);
  return r;
}

function hSpacer(w) {
  var r = figma.createRectangle();
  r.name = "spacer"; r.fills = []; r.resize(w, 1);
  return r;
}

function rgbToHex(r, g, b) {
  function h(v) { return Math.round(v * 255).toString(16).padStart(2, "0").toUpperCase(); }
  return "#" + h(r) + h(g) + h(b);
}

function resolveValue(variable, modeId, allVars) {
  var val = variable.valuesByMode[modeId];
  if (val && typeof val === "object" && val.type === "VARIABLE_ALIAS") {
    for (var i = 0; i < allVars.length; i++) {
      if (allVars[i].id === val.id) {
        var col = figma.variables.getVariableCollectionById(allVars[i].variableCollectionId);
        return resolveValue(allVars[i], col.defaultModeId, allVars);
      }
    }
  }
  return val;
}

function groupVars(variables, allVars) {
  var groups = {};
  for (var i = 0; i < variables.length; i++) {
    var v = variables[i];
    var col = figma.variables.getVariableCollectionById(v.variableCollectionId);
    var modeId = col.defaultModeId;
    var parts = v.name.split("/");
    var tokenName = parts[parts.length - 1];
    var groupPath = parts.length > 1 ? parts.slice(0, -1).join("/") : col.name;
    var key = col.name + "::" + groupPath;
    if (!groups[key]) groups[key] = { collectionName: col.name, groupPath: groupPath, tokens: [] };
    groups[key].tokens.push({ name: tokenName, fullName: v.name, value: resolveValue(v, modeId, allVars) });
  }
  return groups;
}

function formatLabel(path) {
  return path.split("/").map(function(s) {
    return s.replace(/-/g, " ").replace(/\b\w/g, function(c) { return c.toUpperCase(); });
  }).join(" / ");
}

// ─── COLOR FRAME ─────────────────────────────────────────────────────────────
async function generateColorFrame() {
  await loadFonts();
  if (!figma.variables) throw new Error("Variables API not available.");

  var allVars = figma.variables.getLocalVariables();
  var colorVars = allVars.filter(function(v) { return v.resolvedType === "COLOR"; });
  if (colorVars.length === 0) throw new Error("No COLOR variables found. Import your tokens first.");

  var groups = groupVars(colorVars, allVars);
  var groupList = Object.values(groups);
  groupList.forEach(function(g) {
    g.tokens.sort(function(a, b) {
      var na = parseInt(a.name), nb = parseInt(b.name);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.name.localeCompare(b.name);
    });
  });

  var SW_W = 126, SW_H = 80, SW_GAP = 8;
  var MAX_PER_ROW = Math.floor(CONTENT_W / (SW_W + SW_GAP));

  var root = rootFrame("Colors");
  root.appendChild(txt("Colors", F.nrRegular, 44, INK));
  root.appendChild(spacer(8));
  root.appendChild(txt("Design System  \u00B7  Color Tokens", F.wxtRegular, 12, MUTED));
  root.appendChild(spacer(32));
  root.appendChild(divider(CONTENT_W));
  root.appendChild(spacer(48));

  // Group by top-level category
  var cats = {};
  groupList.forEach(function(g) {
    var cat = g.groupPath.split("/")[0];
    if (!cats[cat]) cats[cat] = [];
    cats[cat].push(g);
  });

  var catKeys = Object.keys(cats);
  catKeys.forEach(function(catName, ci) {
    root.appendChild(txt(formatLabel(catName).toUpperCase(), F.wxtSemiBold, 10, MUTED));
    root.appendChild(spacer(24));

    cats[catName].forEach(function(group) {
      var subPath = group.groupPath.split("/").slice(1).join("/");
      if (subPath) {
        root.appendChild(txt(formatLabel(subPath), F.nrRegular, 22, INK));
        root.appendChild(spacer(16));
      }

      var totalRows = Math.ceil(group.tokens.length / MAX_PER_ROW);
      for (var ri = 0; ri < totalRows; ri++) {
        var rowTokens = group.tokens.slice(ri * MAX_PER_ROW, (ri + 1) * MAX_PER_ROW);
        var row = hStack("row", SW_GAP);

        rowTokens.forEach(function(token) {
          // Flat cell: vStack, no nested label frame
          var cell = vStack(token.name, 4);

          var sw = figma.createRectangle();
          sw.name = "swatch"; sw.resize(SW_W, SW_H); sw.cornerRadius = 6;
          var val = token.value;
          if (val && typeof val === "object" && "r" in val) {
            var alpha = typeof val.a === "number" ? val.a : 1;
            sw.fills = [{ type: "SOLID", color: { r: val.r, g: val.g, b: val.b }, opacity: alpha }];
          } else {
            sw.fills = [{ type: "SOLID", color: { r: 0.88, g: 0.88, b: 0.88 } }];
          }
          sw.strokes = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 0.06 }];
          sw.strokeWeight = 1;
          cell.appendChild(sw);
          cell.appendChild(txt(token.name, F.wxtSemiBold, 11, INK));
          if (val && "r" in val) cell.appendChild(txt(rgbToHex(val.r, val.g, val.b), F.wxtRegular, 10, SUBTLE));
          cell.appendChild(txt(token.fullName, F.wxtRegular, 9, XMUTED));

          row.appendChild(cell);
        });

        root.appendChild(row);
        if (ri < totalRows - 1) root.appendChild(spacer(8));
      }
      root.appendChild(spacer(36));
    });

    if (ci < catKeys.length - 1) {
      root.appendChild(divider(CONTENT_W));
      root.appendChild(spacer(40));
    }
  });

  figma.currentPage.appendChild(root);
  figma.viewport.scrollAndZoomIntoView([root]);
}

// ─── TYPOGRAPHY FRAME ─────────────────────────────────────────────────────────
//
// Layout per row:  [Role · Size · Font Name  (fixed 340px)] [sample text]
// "default" marker: Body Medium is the base — rendered in accent color
//
// Scale (Desktop → Tablet → Mobile, ratio ≈ 1/√φ per step):
//   Display:  110/68/42  →  89/55/34  →  68/42/26   (φ ratio between each ✓)
//   Body lh:  px × φ                                  (golden line-height ✓)
// ─────────────────────────────────────────────────────────────────────────────

var LABEL_W = 520; // wide enough for "Display Large · 110px - 6.875rem - 6.875em · Newsreader"

function pxToRem(px) {
  return (Math.round((px / 16) * 10000) / 10000) + "";
}

// Each entry: [role, px, lh, fontKey, fontDesc, sample, isDefault, isAllCaps]
var TYPE_DATA = {
  Desktop: [
    // ── Displays
    { section: "Displays",  subsection: "3 sizes \u00B7 Newsreader Regular \u00B7 Desktop" },
    { role: "Display Large",  px: 110, lh: 128, fk: "nrRegular",     fd: "Newsreader",              sample: "The alternative to good design is always bad design." },
    { role: "Display Medium", px:  68, lh:  84, fk: "nrRegular",     fd: "Newsreader",              sample: "The alternative to good design is always bad design." },
    { role: "Display Small",  px:  42, lh:  52, fk: "nrRegular",     fd: "Newsreader",              sample: "The quick brown fox jumps over the lazy dog." },
    // ── Headings
    { section: "Headings",  subsection: "6 sizes \u00B7 Mixed fonts \u00B7 Desktop" },
    { role: "Heading 1", px: 42, lh: 52, fk: "nrBold",        fd: "Newsreader Bold",          sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Heading 2", px: 34, lh: 42, fk: "nrLight",       fd: "Newsreader Light",         sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Heading 3", px: 26, lh: 32, fk: "nrLightItalic", fd: "Newsreader Light Italic",  sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Heading 4", px: 20, lh: 26, fk: "wxtBold",       fd: "Wix Madefor Text Bold",    sample: "THE QUICK BROWN FOX", isAllCaps: true },
    { role: "Heading 5", px: 20, lh: 26, fk: "nrItalic",      fd: "Newsreader Italic",        sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Heading 6", px: 13, lh: 16, fk: "wxtBold",       fd: "Wix Madefor Text Bold",    sample: "The quick brown fox jumps over the lazy dog.", ls: 2 },
    // ── Body
    { section: "Body",  subsection: "7 styles \u00B7 Mixed fonts \u00B7 Desktop" },
    { role: "Body Large",   px: 20, lh: 32, fk: "wxtRegular",  fd: "Wix Madefor Text",        sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Body Medium",  px: 16, lh: 26, fk: "wxtRegular",  fd: "Wix Madefor Text",        sample: "The quick brown fox jumps over the lazy dog.", isDefault: true },
    { role: "Body Small",   px: 13, lh: 21, fk: "wxtRegular",  fd: "Wix Madefor Text",        sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Body X-Small", px: 10, lh: 16, fk: "wxtRegular",  fd: "Wix Madefor Text",        sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Label",        px: 13, lh: 16, fk: "nrItalic",    fd: "Newsreader Italic",       sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Label 2",      px: 10, lh: 14, fk: "nrItalic",    fd: "Newsreader Italic",       sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Caption",      px: 11, lh: 16, fk: "wxtRegular",  fd: "Wix Madefor Text",        sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Overline",     px: 10, lh: 14, fk: "wxtSemiBold", fd: "Wix Madefor Text",        sample: "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG", isAllCaps: true },
    { role: "Link",         px: 11, lh: 16, fk: "wxtRegular",  fd: "Wix Madefor Text",        sample: "LEARN MORE", isAllCaps: true },
  ],
  Tablet: [
    { section: "Displays",  subsection: "3 sizes \u00B7 Newsreader Regular \u00B7 Tablet" },
    { role: "Display Large",  px: 89, lh: 104, fk: "nrRegular",     fd: "Newsreader",             sample: "The alternative to good design is always bad design." },
    { role: "Display Medium", px: 55, lh:  68, fk: "nrRegular",     fd: "Newsreader",             sample: "The alternative to good design is always bad design." },
    { role: "Display Small",  px: 34, lh:  42, fk: "nrRegular",     fd: "Newsreader",             sample: "The quick brown fox jumps over the lazy dog." },
    { section: "Headings",  subsection: "6 sizes \u00B7 Mixed fonts \u00B7 Tablet" },
    { role: "Heading 1", px: 34, lh: 42, fk: "nrBold",        fd: "Newsreader Bold",         sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Heading 2", px: 26, lh: 32, fk: "nrLight",       fd: "Newsreader Light",        sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Heading 3", px: 20, lh: 26, fk: "nrLightItalic", fd: "Newsreader Light Italic", sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Heading 4", px: 16, lh: 20, fk: "wxtBold",       fd: "Wix Madefor Text Bold",   sample: "THE QUICK BROWN FOX", isAllCaps: true },
    { role: "Heading 5", px: 16, lh: 20, fk: "nrItalic",      fd: "Newsreader Italic",       sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Heading 6", px: 10, lh: 14, fk: "wxtBold",       fd: "Wix Madefor Text Bold",   sample: "The quick brown fox jumps over the lazy dog.", ls: 2 },
    { section: "Body",  subsection: "7 styles \u00B7 Mixed fonts \u00B7 Tablet" },
    { role: "Body Large",   px: 18, lh: 29, fk: "wxtRegular",  fd: "Wix Madefor Text",       sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Body Medium",  px: 16, lh: 26, fk: "wxtRegular",  fd: "Wix Madefor Text",       sample: "The quick brown fox jumps over the lazy dog.", isDefault: true },
    { role: "Body Small",   px: 13, lh: 21, fk: "wxtRegular",  fd: "Wix Madefor Text",       sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Body X-Small", px: 10, lh: 16, fk: "wxtRegular",  fd: "Wix Madefor Text",       sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Label",        px: 13, lh: 16, fk: "nrItalic",    fd: "Newsreader Italic",      sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Label 2",      px: 10, lh: 14, fk: "nrItalic",    fd: "Newsreader Italic",      sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Caption",      px: 11, lh: 16, fk: "wxtRegular",  fd: "Wix Madefor Text",       sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Overline",     px: 10, lh: 14, fk: "wxtSemiBold", fd: "Wix Madefor Text",       sample: "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG", isAllCaps: true },
    { role: "Link",         px: 11, lh: 16, fk: "wxtRegular",  fd: "Wix Madefor Text",       sample: "LEARN MORE", isAllCaps: true },
  ],
  Mobile: [
    { section: "Displays",  subsection: "3 sizes \u00B7 Newsreader Regular \u00B7 Mobile" },
    { role: "Display Large",  px: 68, lh: 84, fk: "nrRegular",     fd: "Newsreader",             sample: "The alternative to good design is always bad design." },
    { role: "Display Medium", px: 42, lh: 52, fk: "nrRegular",     fd: "Newsreader",             sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Display Small",  px: 26, lh: 32, fk: "nrRegular",     fd: "Newsreader",             sample: "The quick brown fox jumps over the lazy dog." },
    { section: "Headings",  subsection: "6 sizes \u00B7 Mixed fonts \u00B7 Mobile" },
    { role: "Heading 1", px: 26, lh: 32, fk: "nrBold",        fd: "Newsreader Bold",         sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Heading 2", px: 20, lh: 26, fk: "nrLight",       fd: "Newsreader Light",        sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Heading 3", px: 16, lh: 20, fk: "nrLightItalic", fd: "Newsreader Light Italic", sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Heading 4", px: 13, lh: 16, fk: "wxtBold",       fd: "Wix Madefor Text Bold",   sample: "THE QUICK BROWN FOX", isAllCaps: true },
    { role: "Heading 5", px: 13, lh: 16, fk: "nrItalic",      fd: "Newsreader Italic",       sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Heading 6", px: 10, lh: 14, fk: "wxtBold",       fd: "Wix Madefor Text Bold",   sample: "The quick brown fox jumps over the lazy dog.", ls: 2 },
    { section: "Body",  subsection: "7 styles \u00B7 Mixed fonts \u00B7 Mobile" },
    { role: "Body Large",   px: 16, lh: 26, fk: "wxtRegular",  fd: "Wix Madefor Text",       sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Body Medium",  px: 14, lh: 22, fk: "wxtRegular",  fd: "Wix Madefor Text",       sample: "The quick brown fox jumps over the lazy dog.", isDefault: true },
    { role: "Body Small",   px: 13, lh: 21, fk: "wxtRegular",  fd: "Wix Madefor Text",       sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Body X-Small", px: 11, lh: 18, fk: "wxtRegular",  fd: "Wix Madefor Text",       sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Label",        px: 13, lh: 16, fk: "nrItalic",    fd: "Newsreader Italic",      sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Label 2",      px: 10, lh: 14, fk: "nrItalic",    fd: "Newsreader Italic",      sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Caption",      px: 11, lh: 16, fk: "wxtRegular",  fd: "Wix Madefor Text",       sample: "The quick brown fox jumps over the lazy dog." },
    { role: "Overline",     px: 10, lh: 14, fk: "wxtSemiBold", fd: "Wix Madefor Text",       sample: "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG", isAllCaps: true },
    { role: "Link",         px: 11, lh: 16, fk: "wxtRegular",  fd: "Wix Madefor Text",       sample: "LEARN MORE", isAllCaps: true },
  ],
};

async function generateTypographyFrame() {
  await loadFonts();

  var root = rootFrame("Typography");
  root.appendChild(txt("Typography", F.nrRegular, 44, INK));
  root.appendChild(spacer(8));
  root.appendChild(txt("Design System  \u00B7  Golden Ratio Scale  \u00B7  \u03C6 = 1.618", F.wxtRegular, 12, MUTED));
  root.appendChild(spacer(32));
  root.appendChild(divider(CONTENT_W));
  root.appendChild(spacer(48));

  var bpNames = ["Desktop", "Tablet", "Mobile"];

  for (var bi = 0; bi < bpNames.length; bi++) {
    var bp = bpNames[bi];
    var entries = TYPE_DATA[bp];

    // Breakpoint label
    root.appendChild(txt(bp.toUpperCase(), F.wxtSemiBold, 10, MUTED));
    root.appendChild(spacer(20));

    for (var ei = 0; ei < entries.length; ei++) {
      var entry = entries[ei];

      // ── Section header ────────────────────────────────────────────────────
      if (entry.section) {
        // Left: section name + subsection info
        var secRow = hStack("section-" + entry.section, 0);
        secRow.primaryAxisAlignItems = "SPACE_BETWEEN";

        var secLeft = vStack("sec-left", 4);
        secLeft.appendChild(txt(entry.section, F.nrRegular, 22, INK));
        secLeft.appendChild(txt(entry.subsection, F.wxtRegular, 12, MUTED));
        secRow.appendChild(secLeft);

        root.appendChild(secRow);
        root.appendChild(spacer(20));
        root.appendChild(divider(CONTENT_W));
        root.appendChild(spacer(20));
        continue;
      }

      // ── Type row ──────────────────────────────────────────────────────────
      // Label: "Role · Size · Font Name" (fixed width column)
      var labelColor = entry.isDefault ? ACCENT : MUTED;
      var remVal = pxToRem(entry.px);
      var labelText = entry.role + "  \u00B7  " + entry.px + "px  \u2012  " + remVal + "rem  \u2012  " + remVal + "em  \u00B7  " + entry.fd;

      var row = hStack(entry.role, 0);
      row.counterAxisAlignItems = "CENTER";
      row.appendChild(txtW(labelText, F.wxtRegular, 11, labelColor, LABEL_W));
      row.appendChild(hSpacer(32));

      // Sample text at actual size / font / line-height
      var sample = figma.createText();
      sample.fontName = F[entry.fk] || F.wxtRegular;
      sample.fontSize = entry.px;
      sample.lineHeight = { unit: "PIXELS", value: entry.lh };
      sample.fills = [{ type: "SOLID", color: INK }];
      sample.characters = entry.sample;
      sample.textAutoResize = "WIDTH_AND_HEIGHT";
      if (entry.ls) sample.letterSpacing = { unit: "PIXELS", value: entry.ls };
      if (entry.isAllCaps) sample.textCase = "UPPER";
      row.appendChild(sample);

      root.appendChild(row);
      root.appendChild(spacer(entry.px > 40 ? 12 : 8)); // tighter spacing for small styles
    }

    // Divider between breakpoints
    if (bi < bpNames.length - 1) {
      root.appendChild(spacer(32));
      root.appendChild(divider(CONTENT_W));
      root.appendChild(spacer(48));
    }
  }

  figma.currentPage.appendChild(root);
  figma.viewport.scrollAndZoomIntoView([root]);
}

// ─── TABLE ROW HELPER ────────────────────────────────────────────────────────
// Creates one horizontal table row with N fixed-width cells
function tableRow(cells, colWidths, isHeader, bg) {
  var rowBg = bg || (isHeader ? null : null);
  var row = figma.createFrame();
  row.name = isHeader ? "thead-row" : "tbody-row";
  row.fills = rowBg ? [{ type: "SOLID", color: rowBg }] : [];
  row.layoutMode = "HORIZONTAL";
  row.counterAxisAlignItems = "CENTER";
  row.primaryAxisSizingMode = "AUTO";
  row.counterAxisSizingMode = "AUTO";
  row.paddingTop = isHeader ? 0 : 16; row.paddingBottom = isHeader ? 0 : 16;
  row.paddingLeft = 0; row.paddingRight = 0;
  row.itemSpacing = 0; row.clipsContent = false;
  cells.forEach(function(cellContent, i) {
    var cell = figma.createFrame();
    cell.name = "cell"; cell.fills = [];
    cell.layoutMode = "HORIZONTAL";
    cell.counterAxisAlignItems = "CENTER";
    cell.primaryAxisSizingMode = "FIXED";
    cell.counterAxisSizingMode = "AUTO";
    cell.resize(colWidths[i], 10);
    cell.paddingTop = 0; cell.paddingBottom = 0;
    cell.paddingLeft = 0; cell.paddingRight = 16;
    cell.itemSpacing = 0; cell.clipsContent = false;
    if (cellContent) cell.appendChild(cellContent);
    row.appendChild(cell);
  });
  return row;
}

// ─── SHARED COMPONENT HELPERS ─────────────────────────────────────────────────

// Token chip: rounded gray pill with label text
function makeChip(label) {
  var CHIP_BG  = { r: 0.910, g: 0.904, b: 0.894 };
  var CHIP_INK = { r: 0.133, g: 0.118, b: 0.094 };
  var c = figma.createFrame();
  c.name = "chip"; c.cornerRadius = 4;
  c.fills = [{ type: "SOLID", color: CHIP_BG }];
  c.layoutMode = "HORIZONTAL";
  c.primaryAxisSizingMode = "AUTO"; c.counterAxisSizingMode = "AUTO";
  c.paddingTop = 4; c.paddingBottom = 4; c.paddingLeft = 8; c.paddingRight = 8;
  c.itemSpacing = 0; c.clipsContent = false;
  var t = figma.createText();
  t.fontName = F.wxtRegular; t.fontSize = 11;
  t.fills = [{ type: "SOLID", color: CHIP_INK }];
  t.characters = label; t.textAutoResize = "WIDTH_AND_HEIGHT";
  c.appendChild(t);
  return c;
}

// Pill-shaped button for the Buttons frame
function makeBtn(label, bgRGB, textRGB, strokeRGB, padY, padX, fs, fk) {
  var b = figma.createFrame();
  b.name = "btn-" + label; b.cornerRadius = 9999;
  b.layoutMode = "HORIZONTAL";
  b.primaryAxisAlignItems = "CENTER"; b.counterAxisAlignItems = "CENTER";
  b.primaryAxisSizingMode = "AUTO"; b.counterAxisSizingMode = "AUTO";
  b.paddingTop = padY; b.paddingBottom = padY;
  b.paddingLeft = padX; b.paddingRight = padX;
  b.itemSpacing = 0; b.clipsContent = false;
  b.fills = bgRGB ? [{ type: "SOLID", color: bgRGB }] : [];
  if (strokeRGB) {
    b.strokes = [{ type: "SOLID", color: strokeRGB }];
    b.strokeWeight = 1.5; b.strokeAlign = "INSIDE";
  } else { b.strokes = []; }
  b.appendChild(txt(label, F[fk] || F.wxtBold, fs, textRGB));
  return b;
}

// ─── SPACING FRAME ───────────────────────────────────────────────────────────
async function generateSpacingFrame() {
  await loadFonts();

  var TEAL = { r: 0.549, g: 0.804, b: 0.831 }; // teal-ish #8CCDD4

  var spacingData = [
    { alias: "spacing/2xs", scale: "brand.scale.25",   px: 1  },
    { alias: "spacing/xs",  scale: "brand.scale.50",   px: 2  },
    { alias: "spacing/sm",  scale: "brand.scale.100",  px: 4  },
    { alias: "spacing/md",  scale: "brand.scale.200",  px: 8  },
    { alias: "spacing/lg",  scale: "brand.scale.400",  px: 16 },
    { alias: "spacing/xl",  scale: "brand.scale.600",  px: 24 },
    { alias: "spacing/2xl", scale: "brand.scale.800",  px: 32 },
    { alias: "spacing/3xl", scale: "brand.scale.900",  px: 40 },
    { alias: "spacing/4xl", scale: "brand.scale.1000", px: 48 },
    { alias: "spacing/5xl", scale: "brand.scale.1100", px: 64 },
  ];

  var root = rootFrame("Spacing");
  root.appendChild(txt("Spacing", F.nrRegular, 44, INK));
  root.appendChild(spacer(8));
  root.appendChild(txtW(
    "Semantic spacing aliases referencing the brand number scale. Spacing tokens stay identical across desktop and mobile \u2014 only layout structure changes responsively.",
    F.wxtRegular, 16, INK, CONTENT_W
  ));
  root.appendChild(spacer(48));

  var rows = vStack("spacing-rows", 12);

  for (var i = 0; i < spacingData.length; i++) {
    var item = spacingData[i];
    var row = hStack("row-" + item.alias, 16);
    row.counterAxisAlignItems = "CENTER";

    row.appendChild(makeChip(item.alias));
    row.appendChild(txt("\u2192", F.wxtRegular, 13, MUTED));
    row.appendChild(makeChip(item.scale));

    var bar = figma.createRectangle();
    bar.name = "bar"; bar.resize(Math.max(item.px, 1), 24); bar.cornerRadius = 4;
    bar.fills = [{ type: "SOLID", color: TEAL }];
    row.appendChild(bar);

    row.appendChild(txt(item.px + "px", F.wxtRegular, 14, INK));
    rows.appendChild(row);
  }

  root.appendChild(rows);
  figma.currentPage.appendChild(root);
  figma.viewport.scrollAndZoomIntoView([root]);
}

// ─── BORDER RADIUS FRAME ─────────────────────────────────────────────────────
async function generateBorderRadiusFrame() {
  await loadFonts();

  var CORAL_FILL   = { r: 1.0,   g: 0.957, b: 0.945 }; // #FFF4F1
  var CORAL_STROKE = { r: 0.969, g: 0.455, b: 0.380 }; // #F77461
  var CORAL_TEXT   = { r: 0.898, g: 0.275, b: 0.200 }; // #E54633

  var radii = [
    { r: 6,    px: "6px",    cssVar: "--radius-sm"  },
    { r: 12,   px: "12px",   cssVar: "--radius-md"  },
    { r: 18,   px: "18px",   cssVar: "--radius-lg"  },
    { r: 24,   px: "24px",   cssVar: "--radius-xl"  },
    { r: 32,   px: "32px",   cssVar: "--radius-2xl" },
    { r: 9999, px: "9999px", cssVar: "--radius-full"},
  ];

  var usage = [
    { component: "Buttons (all sizes)",  token: "--radius-full", value: "9999px" },
    { component: "Chips & Badges",       token: "--radius-full", value: "9999px" },
    { component: "Text Inputs",          token: "--radius-md",   value: "12px"   },
    { component: "Cards (default)",      token: "--radius-xl",   value: "24px"   },
    { component: "Cards (large)",        token: "--radius-2xl",  value: "32px"   },
    { component: "Tags / Pills (compact)",token: "--radius-sm",  value: "6px"    },
    { component: "Glass Panels",         token: "--radius-lg",   value: "18px"   },
    { component: "Modals / Drawers",     token: "--radius-xl",   value: "24px"   },
    { component: "Image containers",     token: "--radius-xl",   value: "24px"   },
    { component: "Tooltips",             token: "--radius-sm",   value: "6px"    },
  ];

  var root = rootFrame("Border Radius");
  root.appendChild(txt("Border Radius", F.nrRegular, 44, INK));
  root.appendChild(spacer(8));
  root.appendChild(txtW(
    "Soft, generous rounding throughout. The system skews large \u2014 rounded corners reinforce the warm, approachable character of the portfolio and complement the organic plasticine visuals.",
    F.wxtRegular, 16, INK, CONTENT_W
  ));
  root.appendChild(spacer(48));

  // Boxes row
  var GAP = Math.floor((CONTENT_W - 6 * 160) / 5);
  var BOX_W = 160; var BOX_H = 140;
  var boxRow = hStack("box-row", GAP);
  boxRow.counterAxisAlignItems = "MIN";

  radii.forEach(function(rad) {
    var cell = vStack("cell", 8);
    cell.counterAxisAlignItems = "CENTER";

    var box = figma.createFrame();
    box.name = "r-" + rad.px; box.resize(BOX_W, BOX_H);
    box.cornerRadius = rad.r;
    box.fills = [{ type: "SOLID", color: CORAL_FILL }];
    box.strokes = [{ type: "SOLID", color: CORAL_STROKE }];
    box.strokeWeight = 1.5; box.strokeAlign = "INSIDE";
    cell.appendChild(box);

    cell.appendChild(txt(rad.px, F.wxtBold, 14, CORAL_TEXT));
    cell.appendChild(txt(rad.cssVar, F.wxtRegular, 11, MUTED));
    boxRow.appendChild(cell);
  });
  root.appendChild(boxRow);

  root.appendChild(spacer(56));
  root.appendChild(txt("Usage by Component", F.wxtBold, 20, INK));
  root.appendChild(spacer(24));

  // Table header
  var COL = [440, 360, 200];
  var DIVCLR2 = { r: 0.88, g: 0.88, b: 0.88 };
  var headerRow = hStack("thead", 0);
  headerRow.counterAxisAlignItems = "CENTER";
  headerRow.paddingBottom = 12;
  [
    txt("COMPONENT", F.wxtSemiBold, 10, MUTED),
    txt("TOKEN", F.wxtSemiBold, 10, MUTED),
    txt("VALUE", F.wxtSemiBold, 10, MUTED),
  ].forEach(function(cell, i) {
    var c = figma.createFrame(); c.fills = []; c.clipsContent = false;
    c.layoutMode = "HORIZONTAL"; c.primaryAxisSizingMode = "FIXED"; c.counterAxisSizingMode = "AUTO";
    c.paddingBottom = 0; c.paddingTop = 0; c.paddingLeft = 0; c.paddingRight = 0;
    c.resize(COL[i], 10);
    c.appendChild(cell);
    headerRow.appendChild(c);
  });
  root.appendChild(headerRow);
  root.appendChild(divider(CONTENT_W));

  usage.forEach(function(u) {
    root.appendChild(spacer(16));
    var row = hStack("urow", 0);
    row.counterAxisAlignItems = "CENTER";
    [
      txt(u.component, F.wxtRegular, 14, INK),
      makeChip(u.token),
      txt(u.value, F.wxtRegular, 14, MUTED),
    ].forEach(function(cell, i) {
      var c = figma.createFrame(); c.fills = []; c.clipsContent = false;
      c.layoutMode = "HORIZONTAL"; c.primaryAxisSizingMode = "FIXED"; c.counterAxisSizingMode = "AUTO";
      c.paddingBottom = 0; c.paddingTop = 0; c.paddingLeft = 0; c.paddingRight = 0;
      c.resize(COL[i], 10);
      c.appendChild(cell);
      row.appendChild(c);
    });
    root.appendChild(row);
    root.appendChild(spacer(16));
    root.appendChild(divider(CONTENT_W));
  });

  figma.currentPage.appendChild(root);
  figma.viewport.scrollAndZoomIntoView([root]);
}

// ─── SHADOWS FRAME ────────────────────────────────────────────────────────────
async function generateShadowsFrame() {
  await loadFonts();

  var CARD_W = 284; var CARD_H = 200;
  var shadowData = [
    { name: "SM", cssVar: "--shadow-sm", desc: "Subtle lift. Input fields,\ninactive cards.", y: 2,  blur: 4,  spread: 0,  a: 0.08 },
    { name: "MD", cssVar: "--shadow-md", desc: "Resting elevation. Active\ncards, dropdowns.", y: 4,  blur: 12, spread: 0,  a: 0.12 },
    { name: "LG", cssVar: "--shadow-lg", desc: "Floating elements.\nModals, featured cards.", y: 8,  blur: 24, spread: 0,  a: 0.16 },
    { name: "XL", cssVar: "--shadow-xl", desc: "Hero elevation. Sticky\npanels, drawers.", y: 16, blur: 48, spread: -4, a: 0.22 },
  ];

  var root = rootFrame("Shadows");
  root.appendChild(txt("Shadows", F.nrRegular, 44, INK));
  root.appendChild(spacer(8));
  root.appendChild(txtW(
    "Four elevation levels. Always use warm-tinted shadows (based on the dark surface color) to stay coherent with the palette\u2019s warm character.",
    F.wxtRegular, 16, INK, CONTENT_W
  ));
  root.appendChild(spacer(56));

  var cardRow = hStack("shadow-cards", 24);
  cardRow.counterAxisAlignItems = "MIN";

  shadowData.forEach(function(s) {
    var cell = vStack("cell-" + s.name, 16);
    cell.counterAxisAlignItems = "CENTER";

    var card = figma.createFrame();
    card.name = "card-" + s.name;
    card.resize(CARD_W, CARD_H);
    card.cornerRadius = 16;
    card.fills = [{ type: "SOLID", color: BG }];
    card.effects = [{
      type: "DROP_SHADOW",
      color: { r: 0.106, g: 0.102, b: 0.094, a: s.a },
      offset: { x: 0, y: s.y },
      radius: s.blur,
      spread: s.spread,
      visible: true,
      blendMode: "NORMAL"
    }];
    card.layoutMode = "VERTICAL";
    card.primaryAxisAlignItems = "CENTER";
    card.counterAxisAlignItems = "CENTER";
    card.primaryAxisSizingMode = "FIXED";
    card.counterAxisSizingMode = "FIXED";
    card.itemSpacing = 0; card.clipsContent = false;
    card.appendChild(txt(s.name, F.wxtBold, 44, INK));
    cell.appendChild(card);

    cell.appendChild(txt(s.cssVar, F.wxtRegular, 12, MUTED));
    cell.appendChild(txtW(s.desc, F.wxtRegular, 13, SUBTLE, CARD_W));
    cardRow.appendChild(cell);
  });

  root.appendChild(cardRow);
  figma.currentPage.appendChild(root);
  figma.viewport.scrollAndZoomIntoView([root]);
}

// ─── BUTTONS FRAME ────────────────────────────────────────────────────────────
async function generateButtonsFrame() {
  await loadFonts();

  var W   = { r: 0.992, g: 0.992, b: 0.992 }; // #FDFDFD
  var NK  = { r: 0.106, g: 0.102, b: 0.094 }; // #1B1A18
  var NK2 = { r: 0.141, g: 0.141, b: 0.141 }; // #242424 dark hover
  var NK0 = { r: 0.957, g: 0.949, b: 0.937 }; // #F4F2EF secondary/ghost hover
  var NK9 = { r: 0.200, g: 0.200, b: 0.200 }; // #333333 ghost text
  var RC7 = { r: 0.898, g: 0.275, b: 0.200 }; // #E54633 primary red
  var RC8 = { r: 0.773, g: 0.227, b: 0.169 }; // #C53A2B primary hover
  var RC1 = { r: 1.0,   g: 0.957, b: 0.945 }; // #FFF4F1 soft red bg
  var RC2 = { r: 1.0,   g: 0.898, b: 0.871 }; // #FFE5DE soft red hover
  var BL5 = { r: 0.561, g: 0.600, b: 0.761 }; // #8F99C2 sky
  var BL6 = { r: 0.365, g: 0.553, b: 0.969 }; // #5D8DF7 sky hover

  // Variant definitions: [label, bg, text, stroke, hoverBg, hoverText, hoverStroke, desc]
  var variants = [
    { label: "Get in touch",  bg: RC7, text: W,   stroke: null, hbg: RC8, ht: W,   hs: null, variantName: "Primary"   },
    { label: "View work",     bg: null,text: NK,  stroke: NK,   hbg: NK0, ht: NK,  hs: NK,   variantName: "Secondary" },
    { label: "Learn more",    bg: null,text: NK9, stroke: null, hbg: NK0, ht: NK9, hs: null, variantName: "Ghost"     },
    { label: "Case study",    bg: BL5, text: W,   stroke: null, hbg: BL6, ht: W,   hs: null, variantName: "Sky"       },
    { label: "Download CV",   bg: NK,  text: W,   stroke: null, hbg: NK2, ht: W,   hs: null, variantName: "Dark"      },
    { label: "AI Projects",   bg: RC1, text: RC7, stroke: null, hbg: RC2, ht: RC7, hs: null, variantName: "Soft Red"  },
  ];

  var root = rootFrame("Buttons");
  root.appendChild(txt("Buttons", F.nrRegular, 44, INK));
  root.appendChild(spacer(32));
  root.appendChild(divider(CONTENT_W));
  root.appendChild(spacer(32));

  // By Variant
  root.appendChild(txt("By Variant", F.wxtBold, 20, INK));
  root.appendChild(spacer(24));

  var varRow = hStack("by-variant", 16);
  varRow.counterAxisAlignItems = "MIN";

  variants.forEach(function(v) {
    var col = vStack("var-col-" + v.variantName, 8);
    col.counterAxisAlignItems = "MIN";

    col.appendChild(makeBtn(v.label, v.bg, v.text, v.stroke, 12, 24, 16, "wxtBold"));

    // Hover state label
    var hoverLabel = txt("hover", F.wxtRegular, 10, XMUTED);
    col.appendChild(hoverLabel);

    // Hover state button (slightly different styling)
    col.appendChild(makeBtn(v.label, v.hbg, v.ht, v.hs, 12, 24, 16, "wxtBold"));

    varRow.appendChild(col);
  });
  root.appendChild(varRow);

  root.appendChild(spacer(40));
  root.appendChild(divider(CONTENT_W));
  root.appendChild(spacer(32));

  // By Size (using Dark/primary variant)
  root.appendChild(txt("By Size", F.wxtBold, 20, INK));
  root.appendChild(spacer(24));
  var sizeRow = hStack("by-size", 12);
  sizeRow.counterAxisAlignItems = "CENTER";
  sizeRow.appendChild(makeBtn("Small",  NK, W, null,  4, 16, 11, "wxtBold"));
  sizeRow.appendChild(makeBtn("Medium", NK, W, null,  8, 20, 13, "wxtBold"));
  sizeRow.appendChild(makeBtn("Large",  NK, W, null, 12, 24, 16, "wxtBold"));
  root.appendChild(sizeRow);

  root.appendChild(spacer(40));
  root.appendChild(divider(CONTENT_W));
  root.appendChild(spacer(32));

  // Token Reference table
  root.appendChild(txt("Token Reference", F.wxtBold, 20, INK));
  root.appendChild(spacer(24));

  var COL2 = [160, 320, 320, 480];

  var thead = hStack("thead", 0);
  thead.paddingBottom = 0;
  ["VARIANT", "BACKGROUND", "COLOR", "WHEN TO USE"].forEach(function(h, i) {
    var c = figma.createFrame(); c.fills = []; c.clipsContent = false;
    c.layoutMode = "HORIZONTAL"; c.primaryAxisSizingMode = "FIXED"; c.counterAxisSizingMode = "AUTO";
    c.paddingBottom = 0; c.paddingTop = 0; c.paddingLeft = 0; c.paddingRight = 0;
    c.resize(COL2[i], 10);
    c.appendChild(txt(h, F.wxtSemiBold, 10, MUTED));
    thead.appendChild(c);
  });
  root.appendChild(thead);
  root.appendChild(spacer(12));
  root.appendChild(divider(CONTENT_W));

  var tokenRows = [
    ["Primary",   "--color-brand-primary",  "#FDFDFD",              "Main CTA. One per section maximum."],
    ["Secondary", "transparent + border",   "--color-text-primary", "Secondary actions, filter options."],
    ["Ghost",     "transparent",            "--color-text-secondary","Tertiary actions, inline navigation."],
    ["Sky",       "--color-brand-secondary","--color-text-primary", "Skill categories, soft feature highlights."],
    ["Dark",      "--color-surface-dark",   "--color-surface-base", "Download, dark-context primary actions."],
    ["Soft Red",  "rgba(brand, 0.10)",      "--color-brand-primary","Tag-like actions, filter toggles."],
  ];

  tokenRows.forEach(function(row) {
    root.appendChild(spacer(16));
    var r = hStack("trow", 0);
    r.counterAxisAlignItems = "CENTER";
    [
      txt(row[0], F.wxtBold, 14, INK),
      makeChip(row[1]),
      makeChip(row[2]),
      txt(row[3], F.wxtRegular, 13, SUBTLE),
    ].forEach(function(cell, i) {
      var c = figma.createFrame(); c.fills = []; c.clipsContent = false;
      c.layoutMode = "HORIZONTAL"; c.primaryAxisSizingMode = "FIXED"; c.counterAxisSizingMode = "AUTO";
      c.paddingBottom = 0; c.paddingTop = 0; c.paddingLeft = 0; c.paddingRight = 0;
      c.resize(COL2[i], 10);
      c.appendChild(cell);
      r.appendChild(c);
    });
    root.appendChild(r);
    root.appendChild(spacer(16));
    root.appendChild(divider(CONTENT_W));
  });

  figma.currentPage.appendChild(root);
  figma.viewport.scrollAndZoomIntoView([root]);
}

// ─── SURFACES & GLASS FRAME ──────────────────────────────────────────────────
async function generateSurfacesFrame() {
  await loadFonts();

  var root = rootFrame("Surfaces & Glass");
  root.appendChild(txt("Surfaces & Glass", F.nrRegular, 44, INK));
  root.appendChild(spacer(8));
  root.appendChild(txtW(
    "Glass morphism layers transparency, blur, and subtle borders to create depth without weight. Always place glass components over rich backgrounds \u2014 gradients, images, or the plasticine objects.",
    F.wxtRegular, 16, INK, CONTENT_W
  ));
  root.appendChild(spacer(40));

  // Gradient container
  var gradH = 400;
  var grad = figma.createFrame();
  grad.name = "gradient-bg";
  grad.resize(CONTENT_W, gradH);
  grad.cornerRadius = 20; grad.clipsContent = true;
  grad.fills = [{
    type: "GRADIENT_LINEAR",
    gradientTransform: [[1, 0, 0], [0, 1, 0]],
    gradientStops: [
      { color: { r: 0.47, g: 0.59, b: 0.84, a: 1 }, position: 0   },
      { color: { r: 0.47, g: 0.79, b: 0.81, a: 1 }, position: 0.5 },
      { color: { r: 0.80, g: 0.81, b: 0.69, a: 1 }, position: 1   }
    ]
  }];

  // Two glass cards: Light + Dark
  var cards = [
    {
      name: "Light Glass",
      title: "Light Glass",
      desc: "Frosted white surface. Ideal for overlaying branded gradients or photography. High readability, warm presence.",
      spec: "bg: rgba(253,253,253,0.55)  \u00B7  blur: 16px",
      fill: { r: 0.992, g: 0.992, b: 0.992 }, opacity: 0.55,
      border: { r: 1, g: 1, b: 1 }, borderOpacity: 0.70,
      textColor: INK, specColor: SUBTLE
    },
    {
      name: "Dark Glass",
      title: "Dark Glass",
      desc: "Smoked charcoal surface. Use for tooltips and overlays that need to feel premium and grounded.",
      spec: "bg: rgba(36,36,36,0.45)  \u00B7  blur: 16px",
      fill: { r: 0.141, g: 0.141, b: 0.141 }, opacity: 0.45,
      border: { r: 1, g: 1, b: 1 }, borderOpacity: 0.12,
      textColor: { r: 0.95, g: 0.95, b: 0.95 }, specColor: { r: 0.70, g: 0.70, b: 0.70 }
    },
  ];

  var CARD_W = Math.floor((CONTENT_W - 24) / 2);
  var CARD_H = gradH - 64;
  var CARD_Y = 32;

  cards.forEach(function(c, i) {
    var card = figma.createFrame();
    card.name = c.name;
    card.resize(CARD_W, CARD_H);
    card.x = i * (CARD_W + 24); card.y = CARD_Y;
    card.cornerRadius = 16;
    card.fills = [{ type: "SOLID", color: c.fill, opacity: c.opacity }];
    card.strokes = [{ type: "SOLID", color: c.border, opacity: c.borderOpacity }];
    card.strokeWeight = 1; card.strokeAlign = "INSIDE";
    card.effects = [{ type: "BACKGROUND_BLUR", radius: 16, visible: true }];
    card.layoutMode = "VERTICAL";
    card.primaryAxisSizingMode = "FIXED"; card.counterAxisSizingMode = "FIXED";
    card.paddingTop = 36; card.paddingBottom = 36;
    card.paddingLeft = 40; card.paddingRight = 40;
    card.itemSpacing = 12; card.clipsContent = false;

    var innerW = CARD_W - 80;
    card.appendChild(txtW(c.title, F.wxtBold, 20, c.textColor, innerW));
    card.appendChild(txtW(c.desc, F.wxtRegular, 15, c.textColor, innerW));
    card.appendChild(spacer(4));
    card.appendChild(txtW(c.spec, F.wxtRegular, 12, c.specColor, innerW));
    grad.appendChild(card);
  });
  root.appendChild(grad);

  root.appendChild(spacer(48));
  root.appendChild(txt("Glass Tokens", F.wxtBold, 20, INK));
  root.appendChild(spacer(24));

  var GCOL = [120, 300, 260, 80, 520];
  var gHead = hStack("g-thead", 0);
  ["VARIANT","BACKGROUND","BORDER","BLUR","WHEN TO USE"].forEach(function(h, i) {
    var c = figma.createFrame(); c.fills = []; c.clipsContent = false;
    c.layoutMode = "HORIZONTAL"; c.primaryAxisSizingMode = "FIXED"; c.counterAxisSizingMode = "AUTO";
    c.paddingBottom = 0; c.paddingTop = 0; c.paddingLeft = 0; c.paddingRight = 0;
    c.resize(GCOL[i], 10);
    c.appendChild(txt(h, F.wxtSemiBold, 10, MUTED));
    gHead.appendChild(c);
  });
  root.appendChild(gHead);
  root.appendChild(spacer(12));
  root.appendChild(divider(CONTENT_W));

  var glassRows = [
    ["Light", "rgba(253,253,253,\n0.55)",  "rgba(255,255,255,\n0.70)", "16px", "Over gradients, images, plasticine graphics"],
    ["Dark",  "rgba(36,36,36, 0.45)", "rgba(255,255,255,\n0.12)", "16px", "Tooltips, overlays on light-to-mid backgrounds"],
  ];

  glassRows.forEach(function(gr) {
    root.appendChild(spacer(16));
    var r = hStack("grow", 0);
    r.counterAxisAlignItems = "CENTER";
    [
      txt(gr[0], F.wxtBold, 14, INK),
      makeChip(gr[1]),
      makeChip(gr[2]),
      txt(gr[3], F.wxtRegular, 13, SUBTLE),
      txt(gr[4], F.wxtRegular, 13, SUBTLE),
    ].forEach(function(cell, i) {
      var c = figma.createFrame(); c.fills = []; c.clipsContent = false;
      c.layoutMode = "HORIZONTAL"; c.primaryAxisSizingMode = "FIXED"; c.counterAxisSizingMode = "AUTO";
      c.paddingBottom = 0; c.paddingTop = 0; c.paddingLeft = 0; c.paddingRight = 0;
      c.resize(GCOL[i], 10);
      c.appendChild(cell);
      r.appendChild(c);
    });
    root.appendChild(r);
    root.appendChild(spacer(16));
    root.appendChild(divider(CONTENT_W));
  });

  figma.currentPage.appendChild(root);
  figma.viewport.scrollAndZoomIntoView([root]);
}

// ─── Message handler ─────────────────────────────────────────────────────────
figma.ui.onmessage = async function(msg) {
  try {
    if (msg.type === "generate-colors") {
      await generateColorFrame();
      figma.ui.postMessage({ type: "done", text: "Color palette created!" });
    } else if (msg.type === "generate-typography") {
      await generateTypographyFrame();
      figma.ui.postMessage({ type: "done", text: "Typography frame created!" });
    } else if (msg.type === "generate-spacing") {
      await generateSpacingFrame();
      figma.ui.postMessage({ type: "done", text: "Spacing frame created!" });
    } else if (msg.type === "generate-border") {
      await generateBorderRadiusFrame();
      figma.ui.postMessage({ type: "done", text: "Border radius frame created!" });
    } else if (msg.type === "generate-shadows") {
      await generateShadowsFrame();
      figma.ui.postMessage({ type: "done", text: "Shadows frame created!" });
    } else if (msg.type === "generate-buttons") {
      await generateButtonsFrame();
      figma.ui.postMessage({ type: "done", text: "Buttons frame created!" });
    } else if (msg.type === "generate-surfaces") {
      await generateSurfacesFrame();
      figma.ui.postMessage({ type: "done", text: "Surfaces & Glass frame created!" });
    } else if (msg.type === "generate-all") {
      await generateColorFrame();
      await generateTypographyFrame();
      await generateSpacingFrame();
      await generateBorderRadiusFrame();
      await generateShadowsFrame();
      await generateButtonsFrame();
      await generateSurfacesFrame();
      figma.ui.postMessage({ type: "done", text: "All frames created!" });
    }
  } catch (err) {
    console.error("[Token Frame Generator]", err);
    var errMsg = err && err.message ? err.message : String(err);
    figma.notify(errMsg, { error: true, timeout: 8000 });
    figma.ui.postMessage({ type: "error", text: errMsg });
  }
};
