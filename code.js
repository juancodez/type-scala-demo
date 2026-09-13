figma.showUI(__html__, { width: 340, height: 620, title: 'Type Scala' });

const LEVELS = [
  { name: 'H1',      step:  5 },
  { name: 'H2',      step:  4 },
  { name: 'H3',      step:  3 },
  { name: 'H4',      step:  2 },
  { name: 'H5',      step:  1 },
  { name: 'Body',    step:  0 },
  { name: 'Small',   step: -1 },
  { name: 'Caption', step: -2 },
];

const SAMPLE = {
  H1:      'Display Heading',
  H2:      'Section Heading',
  H3:      'Sub-section Title',
  H4:      'Card Title',
  H5:      'Label',
  Body:    'The quick brown fox jumps over the lazy dog.',
  Small:   'Supporting text and helper labels.',
  Caption: 'Metadata · caption · timestamp',
};

let allFonts = [];
const FONT_CACHE_KEY = 'typescala:fontFamilies';

(async () => {
  try {
    // 1. Push cached families immediately — instant on 2nd+ opens
    const cached = await figma.clientStorage.getAsync(FONT_CACHE_KEY);
    if (Array.isArray(cached) && cached.length) {
      figma.ui.postMessage({ type: 'fonts', families: cached });
      console.log('[TypeScala] cache hit:', cached.length, 'families');
    }

    // 2. Fetch fresh in background — needed for accurate style picking
    allFonts = await figma.listAvailableFontsAsync();
    const families = [...new Set(allFonts.map(f => f.fontName.family))].sort();
    figma.ui.postMessage({ type: 'fonts', families });
    figma.clientStorage.setAsync(FONT_CACHE_KEY, families).catch(() => {});
    console.log('[TypeScala] fresh:', families.length, 'families');
  } catch (e) {
    console.error('[TypeScala] font list failed', e);
  }
})();

async function loadBestFont(family) {
  const PREFER = ['Regular', 'Book', 'Roman', 'Normal', 'Text', 'Medium', 'Light'];

  if (allFonts.length) {
    const available = allFonts
      .filter(f => f.fontName.family === family)
      .map(f => f.fontName.style);
    for (const s of PREFER) {
      if (available.includes(s)) {
        await figma.loadFontAsync({ family, style: s });
        return s;
      }
    }
    if (available[0]) {
      await figma.loadFontAsync({ family, style: available[0] });
      return available[0];
    }
  }

  for (const s of PREFER) {
    try {
      await figma.loadFontAsync({ family, style: s });
      return s;
    } catch (_) {}
  }
  return null;
}

figma.ui.onmessage = async (msg) => {
  console.log('[TypeScala] message:', msg);

  if (msg.type === 'close') { figma.closePlugin(); return; }
  if (msg.type !== 'generate') return;

  try {
    const { baseSize, ratio, prefix, fontFamily, createFrame } = msg;
    const family = fontFamily || 'Inter';

    console.log('[TypeScala] loading font', family);
    const fontStyle = await loadBestFont(family);
    if (!fontStyle) {
      figma.ui.postMessage({ type: 'error', message: `Could not load font "${family}". Try Inter, Arial, or Roboto.` });
      return;
    }
    console.log('[TypeScala] loaded', family, fontStyle);

    // 1. Create / update text styles
    const existing = figma.getLocalTextStyles();
    console.log('[TypeScala] existing local text styles:', existing.length);
    const created  = [];

    for (const level of LEVELS) {
      // integer sizes — safer, avoids any decimal edge cases
      const size     = Math.max(1, Math.round(baseSize * Math.pow(ratio, level.step)));
      const fullName = prefix ? `${prefix}/${level.name}` : level.name;

      let style = existing.find(s => s.name === fullName);
      if (!style) style = figma.createTextStyle();

      // fontName MUST be set before fontSize is meaningful
      style.name     = fullName;
      style.fontName = { family, style: fontStyle };
      style.fontSize = size;

      created.push({ name: fullName, levelName: level.name, size, styleId: style.id });
      console.log('[TypeScala] created style:', fullName, size, style.id);
    }

    // 2. Optional showcase frame
    if (createFrame) {
      const frame = figma.createFrame();
      frame.name  = prefix ? `Type Scala — ${prefix}` : 'Type Scala';

      // Position at viewport center
      frame.x = Math.round(figma.viewport.center.x);
      frame.y = Math.round(figma.viewport.center.y);

      // Auto-layout
      frame.layoutMode           = 'VERTICAL';
      frame.itemSpacing          = 16;
      frame.paddingTop           = 48;
      frame.paddingBottom        = 48;
      frame.paddingLeft          = 48;
      frame.paddingRight         = 48;
      frame.primaryAxisSizingMode = 'AUTO';
      frame.counterAxisSizingMode = 'AUTO';
      frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

      for (const item of created) {
        const t = figma.createText();
        // fontName MUST be set before characters
        t.fontName    = { family, style: fontStyle };
        t.characters  = SAMPLE[item.levelName] || item.levelName;
        // Apply the style — this overrides individual fontSize
        t.textStyleId = item.styleId;
        frame.appendChild(t);
      }

      // Ensure it's on the current page (createFrame auto-appends, but be explicit)
      if (!frame.parent) figma.currentPage.appendChild(frame);

      figma.currentPage.selection = [frame];
      figma.viewport.scrollAndZoomIntoView([frame]);
      console.log('[TypeScala] frame created:', frame.id);
    }

    figma.ui.postMessage({ type: 'done', styles: created });
    console.log('[TypeScala] done');

  } catch (err) {
    console.error('[TypeScala] generate failed:', err);
    figma.ui.postMessage({ type: 'error', message: (err && err.message) || String(err) });
  }
};
