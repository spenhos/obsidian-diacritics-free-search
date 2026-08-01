import { App, Editor, MarkdownView } from "obsidian";
import { EditorView, Decoration, DecorationSet } from "@codemirror/view";
import type { Range } from "@codemirror/state";
import { t } from "./i18n";
import type { DFSSettings } from "./main";
import { StateEffect, StateField } from "@codemirror/state";
import { buildNormalizedIndex, findMatchesInIndex } from "./normalize";
import type { NormalizedIndex } from "./normalize";

// CM6 effects for managing highlights
const setDFSHighlights = StateEffect.define<{ matches: Array<{ start: number; end: number }>; current: number }>();
const clearDFSHighlights = StateEffect.define<null>();

// StateField that holds the decorations
const dfsHighlightField = StateField.define<DecorationSet>({
	create() {
		return Decoration.none;
	},
	update(decos, tr) {
		for (const effect of tr.effects) {
			if (effect.is(setDFSHighlights)) {
				const builder: Range<Decoration>[] = [];
				effect.value.matches.forEach((m, i) => {
					if (i === effect.value.current) {
						builder.push(
							Decoration.mark({ class: "dfs-match-current" }).range(m.start, m.end)
						);
					} else {
						builder.push(
							Decoration.mark({ class: "dfs-match" }).range(m.start, m.end)
						);
					}
				});
				// Sort by start position (required by CM6)
				builder.sort((a, b) => a.from - b.from);
				return Decoration.set(builder);
			}
			if (effect.is(clearDFSHighlights)) {
				return Decoration.none;
			}
		}
		return decos.map(tr.changes);
	},
	provide: (f) => EditorView.decorations.from(f),
});

export class LocalSearchBar {
	private app: App;
	private editor: Editor;
	private view: MarkdownView;
	private cmView: EditorView;
	private containerEl: HTMLElement;
	private searchInput: HTMLInputElement;
	private replaceInput: HTMLInputElement;
	private caseSensitive: boolean = false;
	private matches: Array<{ start: number; end: number }> = [];
	private currentMatchIdx: number = -1;
	private statusEl: HTMLElement;
	private isOpen: boolean = false;
	private fieldAdded: boolean = false;
	private scrollbarMarkersEl: HTMLElement | null = null;
	private lastQuery: string = "";
	private lastReplace: string = "";
	private settings?: DFSSettings;
	// Cached diacritics-stripped index of the current note, rebuilt only when the
	// note's text changes — not on every keystroke.
	private index: NormalizedIndex | null = null;
	private indexContent: string | null = null;
	// Debounce timer for "search as you type", and the query the visible matches
	// currently reflect (so Enter knows whether to re-search or jump to next).
	private searchDebounce: number | null = null;
	private lastSearchedQuery: string = "";
	private escHandler: ((e: KeyboardEvent) => void) | null = null;
	private escDoc: Document | null = null;

	constructor(app: App, view: MarkdownView, settings?: DFSSettings) {
		this.app = app;
		this.view = view;
		this.editor = view.editor;
		this.settings = settings;
		if (settings) this.caseSensitive = settings.caseSensitive;
		// Access the CM6 EditorView from Obsidian's editor
		this.cmView = (this.editor as unknown as { cm: EditorView }).cm;
	}

	open() {
		if (this.isOpen) {
			// Already open — select all text in search input like Chrome
			this.searchInput.focus();
			this.searchInput.select();
			return;
		}
		this.isOpen = true;
		this.ensureField();
		this.buildUI();

		// Restore last search query
		if (this.lastQuery) {
			this.searchInput.value = this.lastQuery;
			this.searchInput.select();
			this.doSearch();
		}
		if (this.lastReplace) {
			this.replaceInput.value = this.lastReplace;
		}

		this.searchInput.focus();

		// Global Esc listener — closes bar from anywhere
		this.escHandler = (evt: KeyboardEvent) => {
			if (evt.key === "Escape" && this.isOpen) {
				evt.preventDefault();
				evt.stopPropagation();
				this.close();
			}
		};
		// Use the view's own document so it also works in popout windows
		this.escDoc = this.view.containerEl.ownerDocument;
		this.escDoc.addEventListener("keydown", this.escHandler, true);
	}

	close() {
		if (!this.isOpen) return;

		// Cancel any pending debounced search
		if (this.searchDebounce !== null) {
			window.clearTimeout(this.searchDebounce);
			this.searchDebounce = null;
		}

		// Save current query before closing
		if (this.searchInput) {
			this.lastQuery = this.searchInput.value;
		}
		if (this.replaceInput) {
			this.lastReplace = this.replaceInput.value;
		}

		// Remove global Esc listener
		if (this.escHandler && this.escDoc) {
			this.escDoc.removeEventListener("keydown", this.escHandler, true);
			this.escHandler = null;
			this.escDoc = null;
		}

		this.isOpen = false;
		this.clearHighlights();
		this.removeScrollbarMarkers();
		if (this.containerEl) {
			this.containerEl.remove();
		}
		this.editor.focus();
	}

	private ensureField() {
		// Add the StateField to the editor if not already present
		if (!this.fieldAdded) {
			try {
				this.cmView.dispatch({
					effects: StateEffect.appendConfig.of([dfsHighlightField]),
				});
				this.fieldAdded = true;
			} catch {
				// Field might already exist from a previous instance
				this.fieldAdded = true;
			}
		}
	}

	private buildUI() {
		const editorContainer = this.view.contentEl;
		this.containerEl = editorContainer.createDiv({ cls: "dfs-search-bar" });

		// Row 1: Search
		const searchRow = this.containerEl.createDiv({ cls: "dfs-bar-row" });

		this.searchInput = searchRow.createEl("input", {
			type: "text",
			placeholder: t("searchPlaceholder"),
			cls: "dfs-bar-input",
		});

		this.statusEl = searchRow.createSpan({ cls: "dfs-bar-status" });

		const prevBtn = searchRow.createEl("button", { text: "▲", cls: "dfs-bar-btn", attr: { "aria-label": t("prev") } });
		const nextBtn = searchRow.createEl("button", { text: "▼", cls: "dfs-bar-btn", attr: { "aria-label": t("next") } });
		prevBtn.addEventListener("click", () => this.navigateMatch(-1));
		nextBtn.addEventListener("click", () => this.navigateMatch(1));

		const caseLabel = searchRow.createEl("label", { cls: "dfs-bar-option" });
		const caseCheckbox = caseLabel.createEl("input", { type: "checkbox" });
		caseCheckbox.checked = this.caseSensitive;
		caseLabel.appendText(" Aa");
		caseCheckbox.addEventListener("change", () => {
			this.caseSensitive = caseCheckbox.checked;
			this.doSearch();
		});

		const closeBtn = searchRow.createEl("button", { text: "✕", cls: "dfs-bar-btn dfs-bar-close", attr: { "aria-label": t("close") } });
		closeBtn.addEventListener("click", () => this.close());

		// Row 2: Replace
		const replaceRow = this.containerEl.createDiv({ cls: "dfs-bar-row" });

		this.replaceInput = replaceRow.createEl("input", {
			type: "text",
			placeholder: t("replacePlaceholder"),
			cls: "dfs-bar-input",
		});

		const replaceOneBtn = replaceRow.createEl("button", { text: t("replace"), cls: "dfs-bar-btn dfs-bar-btn-text" });
		const replaceAllBtn = replaceRow.createEl("button", { text: t("all"), cls: "dfs-bar-btn dfs-bar-btn-text" });
		replaceOneBtn.addEventListener("click", () => this.replaceCurrent());
		replaceAllBtn.addEventListener("click", () => this.replaceAll());

		// Events
		this.searchInput.addEventListener("input", () => {
			// "enter" mode: don't search while typing — wait for the Enter key.
			const trigger = this.settings?.searchTrigger ?? "pause";
			if (trigger === "enter") return;
			// "pause" mode: search once the user stops typing (debounced).
			if (this.searchDebounce !== null) window.clearTimeout(this.searchDebounce);
			const delay = this.settings?.searchDelay ?? 400;
			this.searchDebounce = window.setTimeout(() => this.doSearch(), delay);
		});
		this.searchInput.addEventListener("keydown", (evt) => {
			if (evt.key === "Enter") {
				evt.preventDefault();
				if (this.searchDebounce !== null) {
					window.clearTimeout(this.searchDebounce);
					this.searchDebounce = null;
				}
				// If the query changed since the last search, search now (this is
				// what triggers the search in "enter" mode, and lets an impatient
				// user in "pause" mode skip the wait). Otherwise, jump between the
				// existing matches.
				if (this.searchInput.value !== this.lastSearchedQuery) this.doSearch();
				else if (evt.shiftKey) this.navigateMatch(-1);
				else this.navigateMatch(1);
			}
			if (evt.key === "Escape") this.close();
		});
		this.replaceInput.addEventListener("keydown", (evt) => {
			if (evt.key === "Enter") {
				this.replaceCurrent();
				evt.preventDefault();
			}
			if (evt.key === "Escape") this.close();
		});

		editorContainer.insertBefore(this.containerEl, editorContainer.firstChild);
	}

	private doSearch() {
		const query = this.searchInput.value;
		this.lastSearchedQuery = query;

		if (!query) {
			this.matches = [];
			this.currentMatchIdx = -1;
			this.statusEl.setText("");
			this.clearHighlights();
			return;
		}

		// Rebuild the diacritics-stripped index only when the note text changed;
		// typing a query reuses the cached index and just re-scans it.
		const content = this.editor.getValue();
		if (this.index === null || content !== this.indexContent) {
			this.index = buildNormalizedIndex(content);
			this.indexContent = content;
		}
		this.matches = findMatchesInIndex(this.index, query, this.caseSensitive);

		if (this.matches.length > 0) {
			this.currentMatchIdx = 0;
			this.applyHighlights();
			this.scrollToCurrentMatch();
		} else {
			this.currentMatchIdx = -1;
			this.clearHighlights();
		}

		this.updateStatus();
	}

	private navigateMatch(direction: number) {
		if (this.matches.length === 0) return;
		this.currentMatchIdx =
			(this.currentMatchIdx + direction + this.matches.length) % this.matches.length;
		this.applyHighlights();
		this.scrollToCurrentMatch();
		this.updateStatus();
	}

	private applyHighlights() {
		try {
			this.cmView.dispatch({
				effects: setDFSHighlights.of({
					matches: this.matches,
					current: this.currentMatchIdx,
				}),
			});
		} catch {
			// Fallback: just select current match
			this.scrollToCurrentMatch();
		}
		this.updateScrollbarMarkers();
	}

	private scrollToCurrentMatch() {
		if (this.currentMatchIdx < 0 || this.currentMatchIdx >= this.matches.length) return;

		const match = this.matches[this.currentMatchIdx];
		const from = this.offsetToPos(match.start);
		const to = this.offsetToPos(match.end);

		this.editor.setSelection(from, to);
		this.editor.scrollIntoView({ from, to }, true);
	}

	private replaceCurrent() {
		if (this.currentMatchIdx < 0 || this.matches.length === 0) return;

		const match = this.matches[this.currentMatchIdx];
		const from = this.offsetToPos(match.start);
		const to = this.offsetToPos(match.end);
		const replacement = this.replaceInput.value;

		this.editor.replaceRange(replacement, from, to);
		this.doSearch();
	}

	private replaceAll() {
		if (this.matches.length === 0) return;

		const replacement = this.replaceInput.value;
		const content = this.editor.getValue();
		const count = this.matches.length;

		let newContent = content;
		for (let i = this.matches.length - 1; i >= 0; i--) {
			const match = this.matches[i];
			newContent =
				newContent.substring(0, match.start) +
				replacement +
				newContent.substring(match.end);
		}

		this.editor.setValue(newContent);
		this.clearHighlights();
		this.statusEl.setText(t("replaced", { count }));
		this.matches = [];
		this.currentMatchIdx = -1;
	}

	private updateStatus() {
		if (this.matches.length === 0) {
			this.statusEl.setText(this.searchInput.value ? "0/0" : "");
		} else {
			this.statusEl.setText(`${this.currentMatchIdx + 1}/${this.matches.length}`);
		}
	}

	private offsetToPos(offset: number): { line: number; ch: number } {
		const content = this.editor.getValue();
		let line = 0;
		let ch = 0;
		for (let i = 0; i < offset && i < content.length; i++) {
			if (content[i] === "\n") {
				line++;
				ch = 0;
			} else {
				ch++;
			}
		}
		return { line, ch };
	}

	private updateScrollbarMarkers() {
		this.removeScrollbarMarkers();

		if (this.matches.length === 0) return;

		// Find the .cm-editor element and use it as anchor
		const cmEditor = this.view.contentEl.querySelector(".cm-editor") as HTMLElement;
		if (!cmEditor) return;

		// Ensure cm-editor is a positioning context via CSS class
		cmEditor.addClass("dfs-cm-editor-relative");

		// Create overlay — fixed to the right edge of cm-editor, over the scrollbar track
		const markersEl = cmEditor.createDiv({ cls: "dfs-scrollbar-markers" });
		this.scrollbarMarkersEl = markersEl;

		const content = this.editor.getValue();
		const totalLines = content.split("\n").length;

		// Matches are in ascending start order, so count newlines with a single
		// forward sweep instead of re-scanning from the start for every match.
		let scanPos = 0;
		let linesBeforeMatch = 0;
		for (let i = 0; i < this.matches.length; i++) {
			const match = this.matches[i];
			while (scanPos < match.start) {
				if (content.charCodeAt(scanPos) === 10) linesBeforeMatch++;
				scanPos++;
			}
			const percent = (linesBeforeMatch / totalLines) * 100;

			const marker = markersEl.createDiv({ cls: "dfs-scrollbar-tick" });
			if (i === this.currentMatchIdx) {
				marker.addClass("dfs-scrollbar-tick-current");
			}
			marker.setCssProps({ "--dfs-tick-top": `${percent}%` });
			const matchIdx = i;
			marker.addEventListener("click", (evt) => {
				evt.stopPropagation();
				this.currentMatchIdx = matchIdx;
				this.applyHighlights();
				this.scrollToCurrentMatch();
				this.updateStatus();
			});
		}
	}

	private removeScrollbarMarkers() {
		if (this.scrollbarMarkersEl) {
			this.scrollbarMarkersEl.remove();
			this.scrollbarMarkersEl = null;
		}
	}

	private clearHighlights() {
		try {
			this.cmView.dispatch({
				effects: clearDFSHighlights.of(null),
			});
		} catch {
			// ignore
		}
		const cursor = this.editor.getCursor();
		this.editor.setSelection(cursor, cursor);
	}
}
