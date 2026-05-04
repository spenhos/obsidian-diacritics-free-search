# Diacritics-Free Search

An Obsidian plugin that lets you search and replace text **ignoring diacritical marks** — Hebrew nikud, Arabic tashkil, Latin accents, and any other Unicode combining marks.

## The Problem

If your notes contain vocalized Hebrew (בְּרֵאשִׁית), you can't find them by typing just the consonants (בראשית). The same applies to accented Latin (café vs cafe), Arabic with tashkil, and more.

This plugin solves that by normalizing text during search, so diacritics are transparent to the search engine.

## Features

- **Local search** (Ctrl/Cmd+F): Find & Replace in the current note, ignoring diacritics
- **Global search** (Ctrl/Cmd+Shift+F): Search across your entire vault
- **Find & Replace**: Replace matches one by one or all at once
- **Case sensitivity toggle**
- **Multi-script support**: Hebrew, Arabic, Latin, Greek, Cyrillic, Devanagari, and any Unicode Mn category mark

## Installation

### Manual Installation

1. Download the latest release (or build from source)
2. Copy `main.js`, `manifest.json`, and `styles.css` (if present) into your vault's `.obsidian/plugins/diacritics-free-search/` folder
3. Enable the plugin in Obsidian Settings → Community Plugins

### Building from Source

```bash
npm install
npm run build
```

This generates `main.js` in the project root.

## Usage

| Action | Shortcut |
|--------|----------|
| Search in current note | `Ctrl/Cmd + F` |
| Search entire vault | `Ctrl/Cmd + Shift + F` |

You can also access both commands from the Command Palette (Ctrl/Cmd+P).

### Settings

- **Override Ctrl/Cmd+F**: Toggle whether this plugin replaces the native search shortcut
- **Case sensitive by default**: Start searches with case sensitivity on or off

## How It Works

The plugin uses Unicode NFD normalization followed by removal of all characters in the Unicode `Mn` (Mark, Nonspacing) category. This means:

- `בְּרֵאשִׁית` → `בראשית` (Hebrew nikud removed)
- `café` → `cafe` (Latin accent removed)
- `بِسْمِ` → `بسم` (Arabic tashkil removed)

Position mapping ensures that when you replace text, the original characters (including their diacritics) are correctly targeted.

## License

MIT
