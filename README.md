<div align="center">

# ✨ Diacritics-Free Search

**Search and replace text ignoring diacritical marks in Obsidian**

Hebrew nikud · Arabic tashkil · Latin accents · Greek polytonic · Any Unicode combining mark

[![GitHub release](https://img.shields.io/github/v/release/spenhos/obsidian-diacritics-free-search?style=flat-square)](https://github.com/spenhos/obsidian-diacritics-free-search/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/LICENSE)
[![Ko-fi](https://img.shields.io/badge/Support-Ko--fi-FF5E5B?style=flat-square&logo=ko-fi&logoColor=white)](https://ko-fi.com/elevalma)

🌐 English | [Español](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README_es.md) | [עברית](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README_he.md) | [العربية](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README_ar.md) | [Français](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README_fr.md) | [Русский](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README_ru.md) | [Português](https://github.com/spenhos/obsidian-diacritics-free-search/blob/main/README_pt.md)

[![Support me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/elevalma)

---

</div>

## The Problem

If your notes contain vocalized Hebrew like **בְּרֵאשִׁית**, searching for **בראשית** (without vowels) won't find it. The same happens with **café** vs **cafe**, Arabic **بِسْمِ** vs **بسم**, and any other diacritical marks.

**Diacritics-Free Search** solves this by making all diacritics transparent during search — type without marks and find text that has them.

```
Search query:    בראשית        →  Finds:  בְּרֵאשִׁית ✓
Search query:    cafe           →  Finds:  café ✓
Search query:    بسم            →  Finds:  بِسْمِ ✓
```

---

## Features

### 🔍 Local Search — Find & Replace in Current Note

<table>
<tr>
<td width="120"><strong>Shortcut</strong></td>
<td><kbd>Option</kbd> + <kbd>F</kbd> <em>(suggested — assign in Settings → Hotkeys)</em></td>
</tr>
<tr>
<td><strong>Behavior</strong></td>
<td>Opens a search bar at the top of the active note (Chrome-style)</td>
</tr>
</table>

**Capabilities:**

- **Real-time highlighting** — All matches highlighted in yellow; current match in orange
- **Match navigation** — Use ▲▼ buttons or <kbd>Enter</kbd> / <kbd>Shift+Enter</kbd> to jump between matches
- **Scrollbar markers** — Yellow ticks on the scrollbar show where matches are (clickable!)
- **Replace one / Replace all** — Replace the current match or all matches at once
- **Case sensitivity toggle** — Click "Aa" to switch between case-sensitive and insensitive
- **Remembers last search** — Reopen the bar and your previous query is still there
- **Escape to close** — Press <kbd>Esc</kbd> from anywhere (even while editing) to dismiss

---

### 🌐 Global Search — Search Entire Vault

<table>
<tr>
<td width="120"><strong>Shortcut</strong></td>
<td><kbd>Shift</kbd> + <kbd>Option</kbd> + <kbd>F</kbd> <em>(suggested — assign in Settings → Hotkeys)</em></td>
</tr>
<tr>
<td><strong>Behavior</strong></td>
<td>Opens a modal to search across all markdown files in your vault</td>
</tr>
</table>

**Capabilities:**

- **Vault-wide search** — Scans every `.md` file in your vault
- **Highlighted context** — Shows the matching line with the found text highlighted
- **Click to navigate** — Click any result to open the file and jump to the exact match
- **Match count per file** — See how many matches each file contains
- **Global Replace All** — Replace a term across all files in one click
- **Debounced input** — Waits 300ms after you stop typing to avoid lag on large vaults

---

### 🎯 How Matching Works

The plugin uses Unicode NFD normalization to decompose characters, then removes all combining marks (Unicode category `Mn`):

| Original | Normalized | Script |
|----------|-----------|--------|
| בְּרֵאשִׁית | בראשית | Hebrew (nikud + cantillation) |
| café | cafe | Latin (acute accent) |
| بِسْمِ ٱللَّهِ | بسم الله | Arabic (tashkil) |
| naïve | naive | Latin (diaeresis) |
| Ἀθῆναι | Αθηναι | Greek (polytonic) |
| résumé | resume | Latin (multiple accents) |
| über | uber | Latin (umlaut) |

> 💡 **Both sides are normalized** — if you search *with* diacritics, it still matches text *without* them (and vice versa).

---

### ⌨️ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open local search | <kbd>Option</kbd> + <kbd>F</kbd> *(suggested — assign in Settings → Hotkeys)* |
| Open global search | <kbd>Shift</kbd> + <kbd>Option</kbd> + <kbd>F</kbd> *(suggested — assign in Settings → Hotkeys)* |
| Next match | <kbd>Enter</kbd> or ▼ button |
| Previous match | <kbd>Shift</kbd> + <kbd>Enter</kbd> or ▲ button |
| Close search | <kbd>Esc</kbd> (works from anywhere) |
| Replace current | <kbd>Enter</kbd> in replace field |

Both commands are also available via the **Command Palette** (<kbd>Cmd</kbd> + <kbd>P</kbd>).

---

### 🗂️ Supported Scripts

| Script | Example | What's stripped |
|--------|---------|----------------|
| 🇮🇱 Hebrew | בְּרֵאשִׁית → בראשית | Nikud, cantillation marks |
| 🇸🇦 Arabic | بِسْمِ → بسم | Tashkil / harakat |
| 🇫🇷 Latin | café → cafe | Accents, umlauts, cedillas, tildes |
| 🇬🇷 Greek | Ἀθῆναι → Αθηναι | Polytonic accents, breathings |
| 🇷🇺 Cyrillic | й → и | Combining breve |
| 🇮🇳 Devanagari | — | Anusvara, virama, etc. |
| 🌍 **Any** | — | All Unicode Mn (Mark, Nonspacing) |

---

## Installation

### From Obsidian (recommended)

1. Open **Settings → Community Plugins** in Obsidian
2. Click **Browse** and search for **"Diacritics-Free Search"**
3. Click **Install**, then **Enable**

Or install in one click: [**Open in Obsidian →**](https://obsidian.md/plugins?id=diacritics-free-search)

### Manual Installation

1. Download `main.js` and `manifest.json` from the [latest release](https://github.com/spenhos/obsidian-diacritics-free-search/releases)
2. Create folder: `<your-vault>/.obsidian/plugins/diacritics-free-search/`
3. Place both files inside
4. Restart Obsidian
5. Go to **Settings → Community Plugins** → Enable "Diacritics-Free Search"

### Building from Source

```bash
git clone https://github.com/spenhos/obsidian-diacritics-free-search.git
cd obsidian-diacritics-free-search
npm install
npm run build
```

Copy `main.js` + `manifest.json` to your vault's plugin folder.

---

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Case sensitive by default | Start searches with case sensitivity enabled | Off |

---

## Support

If this plugin is useful to you, you can support its development:

[![Support me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/elevalma)

[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor-%E2%9D%A4-db61a2?logo=github&style=for-the-badge)](https://github.com/sponsors/spenhos)

---

## Contributing

Issues and PRs are welcome! If you find a script or language where diacritics aren't being properly stripped, please [open an issue](https://github.com/spenhos/obsidian-diacritics-free-search/issues) with an example.

---

<div align="center">

Made with ❤️ for multilingual note-takers

**[Saleh Penhos](https://github.com/spenhos)**

</div>
