import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INPUT_DIR = path.join(ROOT, "vscode-themes");
const OUTPUT_DIR = path.join(ROOT, "themes");

const THEME_FILES = [
  {
    file: "Cursor Dark Midnight-color-theme.json",
    name: "Cursor Dark Midnight",
  },
  {
    file: "Cursor Dark High Contrast-color-theme.json",
    name: "Cursor Dark High Contrast",
  },
  {
    file: "cursor-dark-color-theme.json",
    name: "Cursor Dark",
  },
  {
    file: "cursor-light-color-theme.json",
    name: "Cursor Light",
  },
];

const SYNTAX_TOKENS = [
  { key: "attribute", scopes: ["entity.other.attribute-name"] },
  { key: "boolean", scopes: ["constant.language"] },
  { key: "comment", scopes: ["comment"] },
  { key: "comment.doc", scopes: ["comment.block.documentation"] },
  { key: "constant", scopes: ["constant", "constant.language", "constant.character"] },
  {
    key: "constructor",
    scopes: ["entity.name.tag", "entity.name.function.definition.special.constructor"],
  },
  { key: "embedded", scopes: ["meta.embedded"] },
  { key: "emphasis", scopes: ["markup.italic"] },
  {
    key: "emphasis.strong",
    scopes: ["markup.bold", "markup.italic markup.bold", "markup.bold markup.italic"],
  },
  { key: "enum", scopes: ["support.type.enum"] },
  { key: "function", scopes: ["entity.function", "entity.name.function", "variable.function"] },
  {
    key: "keyword",
    scopes: [
      "keyword",
      "keyword.other.fn.rust",
      "keyword.control",
      "keyword.control.fun",
      "keyword.control.class",
      "punctuation.accessor",
      "entity.name.tag",
    ],
  },
  { key: "label", scopes: ["label", "entity.name", "entity.name.import", "entity.name.package"] },
  { key: "link_text", scopes: ["markup.underline.link", "string.other.link"] },
  { key: "link_uri", scopes: ["markup.underline.link", "string.other.link"] },
  { key: "number", scopes: ["constant.numeric", "number"] },
  { key: "operator", scopes: ["operator", "keyword.operator"] },
  {
    key: "preproc",
    scopes: ["preproc", "meta.preprocessor", "punctuation.definition.preprocessor"],
  },
  {
    key: "property",
    scopes: [
      "variable.member",
      "support.type.property-name",
      "variable.object.property",
      "variable.other.field",
    ],
  },
  {
    key: "punctuation",
    scopes: [
      "punctuation",
      "punctuation.section",
      "punctuation.accessor",
      "punctuation.separator",
      "punctuation.definition.tag",
    ],
  },
  {
    key: "punctuation.bracket",
    scopes: ["punctuation.bracket", "punctuation.definition.tag.begin", "punctuation.definition.tag.end"],
  },
  {
    key: "punctuation.delimiter",
    scopes: ["punctuation.delimiter", "punctuation.separator", "punctuation.terminator"],
  },
  { key: "punctuation.list_marker", scopes: ["markup.list punctuation.definition.list.begin"] },
  { key: "punctuation.special", scopes: ["punctuation.special"] },
  { key: "string", scopes: ["string"] },
  { key: "string.escape", scopes: ["string.escape", "constant.character", "constant.other"] },
  { key: "string.regex", scopes: ["string.regex"] },
  { key: "string.special", scopes: ["string.special", "constant.other.symbol"] },
  {
    key: "string.special.symbol",
    scopes: ["string.special.symbol", "constant.other.symbol"],
  },
  { key: "tag", scopes: ["tag", "entity.name.tag", "meta.tag.sgml"] },
  { key: "text.literal", scopes: ["text.literal", "string"] },
  { key: "title", scopes: ["title", "entity.name"] },
  {
    key: "type",
    scopes: [
      "entity.name.type",
      "entity.name.type.primitive",
      "entity.name.type.numeric",
      "keyword.type",
      "support.type",
      "support.type.primitive",
      "support.class",
    ],
  },
  {
    key: "variable",
    scopes: [
      "variable",
      "variable.language",
      "variable.member",
      "variable.parameter",
      "variable.parameter.function-call",
    ],
  },
  {
    key: "variable.special",
    scopes: ["variable.special", "variable.member", "variable.annotation", "variable.language"],
  },
  { key: "variant", scopes: ["variant"] },
];

const SYNTAX_TOKEN_LOOKUP = new Map(SYNTAX_TOKENS.map((token) => [token.key, token]));
const SYNTAX_FALLBACKS = new Map([
  ["comment.doc", ["comment"]],
  ["number", ["constant"]],
  ["variable.special", ["variable"]],
  ["punctuation.bracket", ["punctuation"]],
  ["punctuation.delimiter", ["punctuation"]],
  ["punctuation.list_marker", ["punctuation"]],
  ["punctuation.special", ["punctuation"]],
  ["string.escape", ["string"]],
  ["string.regex", ["string"]],
  ["string.special", ["string"]],
  ["string.special.symbol", ["string"]],
]);

function normalizeColor(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  const color = value.trim();

  if (!color) {
    return undefined;
  }

  if (!color.startsWith("#")) {
    return color;
  }

  const hex = color.slice(1);

  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return `#${hex
      .split("")
      .map((char) => `${char}${char}`)
      .join("")}ff`.toLowerCase();
  }

  if (/^[0-9a-fA-F]{4}$/.test(hex)) {
    return `#${hex
      .split("")
      .map((char) => `${char}${char}`)
      .join("")}`.toLowerCase();
  }

  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `#${hex}ff`.toLowerCase();
  }

  if (/^[0-9a-fA-F]{8}$/.test(hex)) {
    return `#${hex}`.toLowerCase();
  }

  return color;
}

function withAlpha(color, alpha) {
  const normalized = normalizeColor(color);

  if (!normalized || !normalized.startsWith("#") || normalized.length !== 9) {
    return normalized;
  }

  return `${normalized.slice(0, 7)}${alpha.toLowerCase()}`;
}

function softenBackground(color, alpha = "1f") {
  const normalized = normalizeColor(color);

  if (!normalized || !normalized.startsWith("#") || normalized.length !== 9) {
    return normalized;
  }

  return normalized.endsWith("ff") ? withAlpha(normalized, alpha) : normalized;
}

function pick(colors, ...keys) {
  for (const key of keys) {
    const value = normalizeColor(colors[key]);

    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

function set(target, key, value) {
  if (value !== undefined && value !== null && value !== "") {
    target[key] = value;
  }
}

function cleanThemeName(name, fileName) {
  const rawName = typeof name === "string" && name.trim() ? name.trim() : fileName.replace(/\.json$/i, "");
  return rawName.replace(/\s+v\d+\.\d+\.\d+$/i, "");
}

function inferAppearance(themeName, fileName) {
  return /light/i.test(`${themeName} ${fileName}`) ? "light" : "dark";
}

function parseFontStyle(fontStyle) {
  if (typeof fontStyle !== "string") {
    return undefined;
  }

  if (fontStyle.includes("italic")) {
    return "italic";
  }

  if (fontStyle.includes("oblique")) {
    return "oblique";
  }

  return undefined;
}

function parseFontWeight(fontStyle) {
  if (typeof fontStyle === "string" && fontStyle.includes("bold")) {
    return 700;
  }

  return undefined;
}

function extractTokenScopes(tokenColor) {
  const scope = tokenColor?.scope;

  if (!scope) {
    return [];
  }

  const scopes = Array.isArray(scope) ? scope : [scope];

  return scopes
    .flatMap((entry) => String(entry).split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function hasHighlightStyle(tokenColor) {
  const settings = tokenColor?.settings ?? {};
  return Boolean(settings.foreground || settings.background || settings.fontStyle);
}

function rankTokenMatch(tokenColor, scopesToMatch) {
  const candidateScopes = extractTokenScopes(tokenColor);

  if (!candidateScopes.length || !scopesToMatch.length) {
    return undefined;
  }

  const scopeCount = scopesToMatch.length;
  let score = 0;

  scopesToMatch.forEach((scope, index) => {
    const weight = scopeCount - index;

    if (candidateScopes.includes(scope)) {
      score += 1 + weight;
    }
  });

  return score > 0 ? score : undefined;
}

function findBestTokenColorMatch(tokenColors, scopesToMatch) {
  let bestMatch;
  let bestScore = 0;

  for (const tokenColor of tokenColors) {
    if (!hasHighlightStyle(tokenColor)) {
      continue;
    }

    const score = rankTokenMatch(tokenColor, scopesToMatch);

    if (score && score > bestScore) {
      bestMatch = tokenColor;
      bestScore = score;
    }
  }

  return bestMatch;
}

function toHighlightStyle(settings) {
  const style = {};

  set(style, "color", normalizeColor(settings.foreground));
  set(style, "background_color", normalizeColor(settings.background));
  set(style, "font_style", parseFontStyle(settings.fontStyle));
  set(style, "font_weight", parseFontWeight(settings.fontStyle));

  return Object.keys(style).length ? style : undefined;
}

function buildSyntax(tokenColors, defaults) {
  const syntax = {};

  for (const token of SYNTAX_TOKENS) {
    let match = findBestTokenColorMatch(tokenColors, token.scopes);

    if (!match) {
      for (const fallbackKey of SYNTAX_FALLBACKS.get(token.key) ?? []) {
        const fallback = SYNTAX_TOKEN_LOOKUP.get(fallbackKey);
        match = fallback ? findBestTokenColorMatch(tokenColors, fallback.scopes) : undefined;

        if (match) {
          break;
        }
      }
    }

    if (!match) {
      continue;
    }

    const style = toHighlightStyle(match.settings);

    if (style) {
      syntax[token.key] = style;
    }
  }

  if (!syntax.primary && defaults.text) {
    syntax.primary = { color: defaults.text };
  }

  if (!syntax.hint && defaults.muted) {
    syntax.hint = { color: defaults.muted };
  }

  if (!syntax.predictive && defaults.placeholder) {
    syntax.predictive = { color: defaults.placeholder };
  }

  if (!syntax.link_text && defaults.accent) {
    syntax.link_text = { color: defaults.accent };
  }

  if (!syntax.link_uri && defaults.accent) {
    syntax.link_uri = { color: defaults.accent };
  }

  if (!syntax.emphasis) {
    syntax.emphasis = { font_style: "italic" };
  }

  if (!syntax["emphasis.strong"]) {
    syntax["emphasis.strong"] = { font_weight: 700 };
  }

  return syntax;
}

function buildPlayers(colors, accent) {
  const palette = [
    accent,
    pick(colors, "terminal.ansiBlue"),
    pick(colors, "terminal.ansiRed"),
    pick(colors, "terminal.ansiYellow"),
    pick(colors, "terminal.ansiMagenta"),
    pick(colors, "terminal.ansiCyan"),
    pick(colors, "terminal.ansiGreen"),
    pick(colors, "list.highlightForeground"),
    pick(colors, "editorCursor.foreground"),
  ].filter(Boolean);

  const uniqueColors = [...new Set(palette)].slice(0, 8);

  return uniqueColors.map((color) => ({
    cursor: color,
    background: color,
    selection: withAlpha(color, "3d"),
  }));
}

function buildAccents(colors, accent) {
  return [...new Set([
    accent,
    pick(colors, "terminal.ansiBlue"),
    pick(colors, "terminal.ansiCyan"),
    pick(colors, "terminal.ansiGreen"),
    pick(colors, "terminal.ansiMagenta"),
    pick(colors, "terminal.ansiYellow"),
  ].filter(Boolean))];
}

function buildStyle(colors, tokenColors) {
  const defaultTokenForeground = normalizeColor(
    tokenColors.find((tokenColor) => tokenColor.scope == null)?.settings?.foreground,
  );
  const text = pick(colors, "foreground", "editor.foreground") ?? defaultTokenForeground;
  const muted = pick(
    colors,
    "descriptionForeground",
    "sideBar.foreground",
    "tab.inactiveForeground",
    "statusBar.foreground",
    "editorCodeLens.foreground",
  );
  const placeholder = pick(colors, "input.placeholderForeground", "tab.inactiveForeground", "statusBar.foreground");
  const accent = pick(
    colors,
    "textLink.foreground",
    "list.highlightForeground",
    "activityBarBadge.background",
    "button.background",
    "editor.findMatchBackground",
    "terminal.ansiBlue",
  );
  const border = pick(colors, "panel.border", "editorGroup.border", "sideBar.border", "titleBar.border", "input.border");
  const borderVariant = pick(
    colors,
    "editorGroupHeader.tabsBorder",
    "tab.border",
    "sideBar.border",
    "panel.border",
    "input.border",
  );
  const style = {};

  set(style, "accents", buildAccents(colors, accent));
  set(style, "background.appearance", "opaque");
  set(style, "background", pick(colors, "editor.background", "panel.background", "sideBar.background"));
  set(style, "border", border);
  set(style, "border.variant", borderVariant);
  set(style, "border.focused", pick(colors, "focusBorder", "inputOption.activeBorder", "editorWidget.resizeBorder"));
  set(style, "border.selected", pick(colors, "panelTitle.activeBorder", "tab.activeBorderTop", "inputOption.activeBorder"));
  set(style, "border.transparent", "#00000000");
  set(style, "border.disabled", pick(colors, "list.invalidItemForeground", "tab.inactiveForeground", "input.placeholderForeground"));
  set(style, "elevated_surface.background", pick(colors, "dropdown.background", "editorWidget.background", "editorHoverWidget.background", "menu.background"));
  set(style, "surface.background", pick(colors, "panel.background", "sideBar.background", "statusBar.background"));
  set(style, "element.background", pick(colors, "input.background", "button.secondaryBackground", "tab.inactiveBackground", "button.background"));
  set(style, "element.hover", pick(colors, "list.hoverBackground", "button.hoverBackground", "tab.hoverBackground", "statusBarItem.hoverBackground"));
  set(style, "element.active", pick(colors, "list.focusBackground", "inputOption.activeBackground", "statusBarItem.activeBackground"));
  set(style, "element.selected", pick(colors, "list.activeSelectionBackground", "tab.activeBackground", "list.inactiveSelectionBackground"));
  set(style, "element.disabled", pick(colors, "tab.inactiveBackground", "input.background"));
  set(style, "drop_target.background", pick(colors, "list.dropBackground", "editorGroup.dropBackground"));
  set(style, "ghost_element.background", "#00000000");
  set(style, "ghost_element.hover", pick(colors, "tab.unfocusedHoverBackground", "list.hoverBackground"));
  set(style, "ghost_element.active", pick(colors, "statusBarItem.activeBackground", "list.focusBackground"));
  set(style, "ghost_element.selected", pick(colors, "list.inactiveSelectionBackground", "tab.activeBackground"));
  set(style, "ghost_element.disabled", pick(colors, "tab.inactiveBackground", "input.background"));
  set(style, "text", text);
  set(style, "text.muted", muted);
  set(style, "text.placeholder", placeholder);
  set(style, "text.disabled", pick(colors, "list.invalidItemForeground", "tab.inactiveForeground", "input.placeholderForeground"));
  set(style, "text.accent", accent);
  set(style, "icon", pick(colors, "icon.foreground", "foreground") ?? text);
  set(style, "icon.muted", pick(colors, "sideBar.foreground", "tab.inactiveForeground", "statusBar.foreground"));
  set(style, "icon.disabled", pick(colors, "icon.foreground", "tab.inactiveForeground", "input.placeholderForeground"));
  set(style, "icon.placeholder", pick(colors, "input.placeholderForeground", "icon.foreground"));
  set(style, "icon.accent", accent);
  set(style, "status_bar.background", pick(colors, "statusBar.background", "statusBar.noFolderBackground"));
  set(style, "title_bar.background", pick(colors, "titleBar.activeBackground", "editorGroupHeader.tabsBackground"));
  set(style, "title_bar.inactive_background", pick(colors, "titleBar.inactiveBackground", "statusBar.background"));
  set(style, "toolbar.background", pick(colors, "breadcrumb.background", "sideBar.background", "panel.background"));
  set(style, "tab_bar.background", pick(colors, "editorGroupHeader.tabsBackground", "titleBar.activeBackground"));
  set(style, "tab.inactive_background", pick(colors, "tab.inactiveBackground", "editorGroupHeader.tabsBackground"));
  set(style, "tab.active_background", pick(colors, "tab.activeBackground", "editor.background"));
  set(style, "search.match_background", pick(colors, "editor.findMatchHighlightBackground", "editor.findMatchBackground"));
  set(style, "search.active_match_background", pick(colors, "editor.findMatchBackground", "editor.findMatchHighlightBackground"));
  set(style, "panel.background", pick(colors, "panel.background", "sideBar.background"));
  set(style, "panel.focused_border", pick(colors, "panelTitle.activeBorder", "focusBorder"));
  set(style, "pane.focused_border", pick(colors, "focusBorder", "editorWidget.resizeBorder"));
  set(style, "pane_group.border", pick(colors, "editorGroup.border", "panel.border"));
  set(style, "panel.indent_guide", pick(colors, "tree.inactiveIndentGuidesStroke", "editorIndentGuide.background1", "editorIndentGuide.background"));
  set(style, "panel.indent_guide_active", pick(colors, "tree.indentGuidesStroke", "editorIndentGuide.activeBackground1", "editorIndentGuide.activeBackground"));
  set(style, "panel.indent_guide_hover", pick(colors, "tree.indentGuidesStroke", "editorIndentGuide.activeBackground1", "editorIndentGuide.activeBackground"));
  set(style, "scrollbar.thumb.background", pick(colors, "scrollbarSlider.background"));
  set(style, "scrollbar.thumb.hover_background", pick(colors, "scrollbarSlider.hoverBackground"));
  set(style, "scrollbar.thumb.border", pick(colors, "scrollbarSlider.activeBackground", "scrollbarSlider.background"));
  set(style, "scrollbar.track.background", "#00000000");
  set(style, "scrollbar.track.border", pick(colors, "editorOverviewRuler.border", "panel.border"));
  set(style, "editor.foreground", pick(colors, "editor.foreground") ?? text);
  set(style, "editor.background", pick(colors, "editor.background", "panel.background"));
  set(style, "editor.gutter.background", pick(colors, "editorGutter.background", "editor.background"));
  set(style, "editor.subheader.background", pick(colors, "editorGroupHeader.tabsBackground", "breadcrumb.background"));
  set(style, "editor.active_line.background", pick(colors, "editor.lineHighlightBackground"));
  set(style, "editor.highlighted_line.background", pick(colors, "editor.rangeHighlightBackground", "editor.selectionHighlightBackground"));
  set(style, "editor.line_number", pick(colors, "editorLineNumber.foreground"));
  set(style, "editor.active_line_number", pick(colors, "editorLineNumber.activeForeground", "editor.foreground"));
  set(style, "editor.invisible", pick(colors, "editorWhitespace.foreground"));
  set(style, "editor.wrap_guide", pick(colors, "editorRuler.foreground", "editorIndentGuide.background1", "editorIndentGuide.background"));
  set(style, "editor.active_wrap_guide", pick(colors, "editorIndentGuide.activeBackground1", "editorIndentGuide.activeBackground", "editorRuler.foreground"));
  set(style, "editor.document_highlight.bracket_background", pick(colors, "editorBracketMatch.background"));
  set(style, "editor.document_highlight.read_background", pick(colors, "editor.wordHighlightBackground", "editor.findRangeHighlightBackground"));
  set(style, "editor.document_highlight.write_background", pick(colors, "editor.wordHighlightStrongBackground", "editor.selectionHighlightBackground"));
  set(style, "editor.indent_guide", pick(colors, "editorIndentGuide.background1", "editorIndentGuide.background", "editorWhitespace.foreground"));
  set(style, "editor.indent_guide_active", pick(colors, "editorIndentGuide.activeBackground1", "editorIndentGuide.activeBackground", "editorIndentGuide.background1", "editorIndentGuide.background"));
  set(style, "terminal.background", pick(colors, "terminal.background", "editor.background"));
  set(style, "terminal.foreground", pick(colors, "terminal.foreground", "editor.foreground"));
  set(style, "terminal.bright_foreground", pick(colors, "terminal.ansiBrightWhite", "terminal.foreground"));
  set(style, "terminal.dim_foreground", pick(colors, "terminal.ansiBrightBlack", "statusBar.foreground"));
  set(style, "terminal.ansi.background", pick(colors, "terminal.background", "editor.background"));
  set(style, "terminal.ansi.black", pick(colors, "terminal.ansiBlack"));
  set(style, "terminal.ansi.bright_black", pick(colors, "terminal.ansiBrightBlack"));
  set(style, "terminal.ansi.red", pick(colors, "terminal.ansiRed"));
  set(style, "terminal.ansi.bright_red", pick(colors, "terminal.ansiBrightRed"));
  set(style, "terminal.ansi.green", pick(colors, "terminal.ansiGreen"));
  set(style, "terminal.ansi.bright_green", pick(colors, "terminal.ansiBrightGreen"));
  set(style, "terminal.ansi.yellow", pick(colors, "terminal.ansiYellow"));
  set(style, "terminal.ansi.bright_yellow", pick(colors, "terminal.ansiBrightYellow"));
  set(style, "terminal.ansi.blue", pick(colors, "terminal.ansiBlue"));
  set(style, "terminal.ansi.bright_blue", pick(colors, "terminal.ansiBrightBlue"));
  set(style, "terminal.ansi.magenta", pick(colors, "terminal.ansiMagenta"));
  set(style, "terminal.ansi.bright_magenta", pick(colors, "terminal.ansiBrightMagenta"));
  set(style, "terminal.ansi.cyan", pick(colors, "terminal.ansiCyan"));
  set(style, "terminal.ansi.bright_cyan", pick(colors, "terminal.ansiBrightCyan"));
  set(style, "terminal.ansi.white", pick(colors, "terminal.ansiWhite"));
  set(style, "terminal.ansi.bright_white", pick(colors, "terminal.ansiBrightWhite"));
  set(style, "link_text.hover", pick(colors, "textLink.activeForeground", "textLink.foreground"));
  set(style, "created", pick(colors, "editorGutter.addedBackground", "gitDecoration.addedResourceForeground"));
  set(style, "created.background", softenBackground(pick(colors, "diffEditor.insertedTextBackground", "diffEditor.insertedLineBackground")));
  set(style, "created.border", pick(colors, "minimapGutter.addedBackground", "editorGutter.addedBackground"));
  set(style, "deleted", pick(colors, "editorGutter.deletedBackground", "gitDecoration.deletedResourceForeground"));
  set(style, "deleted.background", softenBackground(pick(colors, "diffEditor.removedTextBackground", "diffEditor.removedLineBackground")));
  set(style, "deleted.border", pick(colors, "minimapGutter.deletedBackground", "editorGutter.deletedBackground"));
  set(style, "error", pick(colors, "editorError.foreground", "errorForeground", "inputValidation.errorForeground"));
  set(style, "error.background", softenBackground(pick(colors, "editorError.background", "diffEditor.removedTextBackground", "inputValidation.errorBackground")));
  set(style, "error.border", pick(colors, "inputValidation.errorBorder", "editorError.border"));
  set(style, "hidden", pick(colors, "tab.inactiveForeground", "list.invalidItemForeground"));
  set(style, "hidden.background", pick(colors, "tab.inactiveBackground", "list.inactiveSelectionBackground"));
  set(style, "hidden.border", borderVariant);
  set(style, "hint", pick(colors, "editorInlayHint.foreground", "editorCodeLens.foreground", "descriptionForeground"));
  set(style, "hint.background", pick(colors, "editorInlayHint.background"));
  set(style, "hint.border", pick(colors, "editorWidget.resizeBorder", "focusBorder"));
  set(style, "ignored", pick(colors, "gitDecoration.ignoredResourceForeground", "tab.inactiveForeground"));
  set(style, "ignored.background", pick(colors, "tab.inactiveBackground"));
  set(style, "ignored.border", borderVariant);
  set(style, "info", pick(colors, "list.highlightForeground", "textLink.foreground", "inputValidation.infoBorder", "inputValidation.infoForeground"));
  set(style, "info.background", softenBackground(pick(colors, "editor.findMatchHighlightBackground", "inputValidation.infoBackground")));
  set(style, "info.border", pick(colors, "inputValidation.infoBorder", "focusBorder"));
  set(style, "modified", pick(colors, "editorGutter.modifiedBackground", "gitDecoration.modifiedResourceForeground"));
  set(style, "modified.background", pick(colors, "editor.selectionHighlightBackground", "editor.rangeHighlightBackground"));
  set(style, "modified.border", pick(colors, "minimapGutter.modifiedBackground", "editorGutter.modifiedBackground"));
  set(style, "predictive", pick(colors, "editorInlayHint.foreground", "input.placeholderForeground"));
  set(style, "predictive.background", pick(colors, "editorInlayHint.background"));
  set(style, "predictive.border", borderVariant);
  set(style, "renamed", pick(colors, "gitDecoration.untrackedResourceForeground", "list.highlightForeground"));
  set(style, "renamed.background", pick(colors, "editor.findMatchHighlightBackground"));
  set(style, "renamed.border", pick(colors, "gitDecoration.untrackedResourceForeground", "focusBorder"));
  set(style, "success", pick(colors, "editorGutter.addedBackground", "gitDecoration.addedResourceForeground"));
  set(style, "success.background", softenBackground(pick(colors, "diffEditor.insertedTextBackground", "diffEditor.insertedLineBackground")));
  set(style, "success.border", pick(colors, "minimapGutter.addedBackground", "editorGutter.addedBackground"));
  set(style, "unreachable", pick(colors, "tab.inactiveForeground", "descriptionForeground"));
  set(style, "unreachable.background", pick(colors, "tab.inactiveBackground"));
  set(style, "unreachable.border", borderVariant);
  set(style, "warning", pick(colors, "editorWarning.foreground", "inputValidation.warningForeground", "list.warningForeground"));
  set(style, "warning.background", softenBackground(pick(colors, "inputValidation.warningBackground")));
  set(style, "warning.border", pick(colors, "inputValidation.warningBorder", "editorWarning.border"));
  set(style, "players", buildPlayers(colors, accent));
  set(
    style,
    "syntax",
    buildSyntax(tokenColors, {
      text,
      muted,
      placeholder,
      accent,
    }),
  );

  return style;
}

function toThemeFileName(name) {
  return `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}.json`;
}

function convertTheme(themeConfig) {
  const themePath = path.join(INPUT_DIR, themeConfig.file);
  const theme = JSON.parse(fs.readFileSync(themePath, "utf8"));
  const name = themeConfig.name ?? cleanThemeName(theme.name, themeConfig.file);

  return {
    name,
    appearance: inferAppearance(name, themeConfig.file),
    style: buildStyle(theme.colors ?? {}, theme.tokenColors ?? []),
  };
}

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const entry of fs.readdirSync(OUTPUT_DIR)) {
    if (entry.endsWith(".json")) {
      fs.rmSync(path.join(OUTPUT_DIR, entry));
    }
  }

  for (const themeConfig of THEME_FILES) {
    const theme = convertTheme(themeConfig);
    const outputPath = path.join(OUTPUT_DIR, toThemeFileName(theme.name));
    const themeFamily = {
      $schema: "https://zed.dev/schema/themes/v0.2.0.json",
      name: theme.name,
      author: "Nexmoe",
      themes: [theme],
    };

    fs.writeFileSync(outputPath, `${JSON.stringify(themeFamily, null, 2)}\n`);
    console.log(`Wrote ${path.relative(ROOT, outputPath)}`);
  }
}

main();
