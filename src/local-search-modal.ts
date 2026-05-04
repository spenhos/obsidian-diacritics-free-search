import { App, Editor, MarkdownView } from "obsidian";
import { EditorView, Decoration, DecorationSet } from "@codemirror/view";
import { StateEffect, StateField } from "@codemirror/state";
import { findMatchesIgnoringDiacritics } from "./normalize";

// CM6 effects for managing highlights
const setDFSHighlights = StateEffect.define<{ matches: Array<{ start: number; end: number }>; current: number }>();
const clearDFSHighlights = StateEffect.define<null>();

// StateField that holds the decorations
const dfsHighlightField = StateField.define<DecorationSet>({
	create() {
		return Decoration.none;
	},
	update(decos, tr) {
		for (const e of tr.effects) {
			if (e.is(setDFSHighlights)) {
				const builder: any[] = [];
				e.value.matches.forEach((m, i) => {
					if (i === e.value.current) {
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
				builder.sort((a: any, b: any) => a.from - b.from);
				return Decoration.set(builder);
			}
			if (e.is(clearDFSHighlights)) {
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
	private styleEl: HTMLStyleElement;
	private isOpen: boolean = false;
	private fieldAdded: boolean = false;
	private scrollbarMarkersEl: HTMLElement | null = null;
	private lastQuery: string = "";
	private lastReplace: string = "";
	private escHandler: ((e: KeyboardEvent) => void) | null = null;

	constructor(app: App, view: MarkdownView) {
		this.app = app;
		this.view = view;
		this.editor = view.editor;
		this.cmView = (this.editor as any).cm as EditorView;
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
		this.addStyles();
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
		this.escHandler = (e: KeyboardEvent) => {
			if (e.key === "Escape" && this.isOpen) {
				e.preventDefault();
				e.stopPropagation();
				this.close();
			}
		};
		document.addEventListener("keydown", this.escHandler, true);
	}

	close() {
		if (!this.isOpen) return;

		// Save current query before closing
		if (this.searchInput) {
			this.lastQuery = this.searchInput.value;
		}
		if (this.replaceInput) {
			this.lastReplace = this.replaceInput.value;
		}

		// Remove global Esc listener
		if (this.escHandler) {
			document.removeEventListener("keydown", this.escHandler, true);
			this.escHandler = null;
		}

		this.isOpen = false;
		this.clearHighlights();
		this.removeScrollbarMarkers();
		if (this.containerEl) {
			this.containerEl.remove();
		}
		if (this.styleEl) {
			this.styleEl.remove();
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
			} catch (e) {
				// Field might already exist from a previous instance
				this.fieldAdded = true;
			}
		}
	}

	private buildUI() {
		const editorContainer = this.view.contentEl;
		this.containerEl = document.createElement("div");
		this.containerEl.addClass("dfs-search-bar");

		// Row 1: Search
		const searchRow = this.containerEl.createDiv({ cls: "dfs-bar-row" });

		this.searchInput = searchRow.createEl("input", {
			type: "text",
			placeholder: "Search (diacritics-free)...",
			cls: "dfs-bar-input",
		});

		this.statusEl = searchRow.createSpan({ cls: "dfs-bar-status" });

		const prevBtn = searchRow.createEl("button", { text: "▲", cls: "dfs-bar-btn", attr: { "aria-label": "Previous" } });
		const nextBtn = searchRow.createEl("button", { text: "▼", cls: "dfs-bar-btn", attr: { "aria-label": "Next" } });
		prevBtn.addEventListener("click", () => this.navigateMatch(-1));
		nextBtn.addEventListener("click", () => this.navigateMatch(1));

		const caseLabel = searchRow.createEl("label", { cls: "dfs-bar-option" });
		const caseCheckbox = caseLabel.createEl("input", { type: "checkbox" });
		caseLabel.appendText(" Aa");
		caseCheckbox.addEventListener("change", () => {
			this.caseSensitive = caseCheckbox.checked;
			this.doSearch();
		});

		const closeBtn = searchRow.createEl("button", { text: "✕", cls: "dfs-bar-btn dfs-bar-close", attr: { "aria-label": "Close" } });
		closeBtn.addEventListener("click", () => this.close());

		// Row 2: Replace
		const replaceRow = this.containerEl.createDiv({ cls: "dfs-bar-row" });

		this.replaceInput = replaceRow.createEl("input", {
			type: "text",
			placeholder: "Replace with...",
			cls: "dfs-bar-input",
		});

		const replaceOneBtn = replaceRow.createEl("button", { text: "Replace", cls: "dfs-bar-btn dfs-bar-btn-text" });
		const replaceAllBtn = replaceRow.createEl("button", { text: "All", cls: "dfs-bar-btn dfs-bar-btn-text" });
		replaceOneBtn.addEventListener("click", () => this.replaceCurrent());
		replaceAllBtn.addEventListener("click", () => this.replaceAll());

		// Events
		this.searchInput.addEventListener("input", () => this.doSearch());
		this.searchInput.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				if (e.shiftKey) this.navigateMatch(-1);
				else this.navigateMatch(1);
				e.preventDefault();
			}
			if (e.key === "Escape") this.close();
		});
		this.replaceInput.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				this.replaceCurrent();
				e.preventDefault();
			}
			if (e.key === "Escape") this.close();
		});

		editorContainer.insertBefore(this.containerEl, editorContainer.firstChild);
	}

	private doSearch() {
		const query = this.searchInput.value;

		if (!query) {
			this.matches = [];
			this.currentMatchIdx = -1;
			this.statusEl.setText("");
			this.clearHighlights();
			return;
		}

		const content = this.editor.getValue();
		this.matches = findMatchesIgnoringDiacritics(content, query, this.caseSensitive);

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
		} catch (e) {
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
		this.statusEl.setText(`Replaced ${count}`);
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

		// Ensure cm-editor is a positioning context
		if (getComputedStyle(cmEditor).position === "static") {
			cmEditor.style.position = "relative";
		}

		// Create overlay — fixed to the right edge of cm-editor, over the scrollbar track
		this.scrollbarMarkersEl = document.createElement("div");
		this.scrollbarMarkersEl.addClass("dfs-scrollbar-markers");
		cmEditor.appendChild(this.scrollbarMarkersEl);

		const content = this.editor.getValue();
		const totalLines = content.split("\n").length;

		for (let i = 0; i < this.matches.length; i++) {
			const match = this.matches[i];
			const linesBeforeMatch = content.substring(0, match.start).split("\n").length - 1;
			const percent = (linesBeforeMatch / totalLines) * 100;

			const marker = document.createElement("div");
			marker.addClass("dfs-scrollbar-tick");
			if (i === this.currentMatchIdx) {
				marker.addClass("dfs-scrollbar-tick-current");
			}
			marker.style.top = `${percent}%`;
			const matchIdx = i;
			marker.addEventListener("click", (e) => {
				e.stopPropagation();
				this.currentMatchIdx = matchIdx;
				this.applyHighlights();
				this.scrollToCurrentMatch();
				this.updateStatus();
			});
			this.scrollbarMarkersEl.appendChild(marker);
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
		} catch (e) {
			// ignore
		}
		const cursor = this.editor.getCursor();
		this.editor.setSelection(cursor, cursor);
	}

	private addStyles() {
		this.styleEl = document.createElement("style");
		this.styleEl.id = "dfs-local-search-styles";
		this.styleEl.textContent = `
			.dfs-search-bar {
				position: sticky;
				top: 0;
				z-index: 100;
				background: var(--background-secondary);
				border-bottom: 1px solid var(--background-modifier-border);
				padding: 6px 10px;
				display: flex;
				flex-direction: column;
				gap: 4px;
			}
			.dfs-bar-row {
				display: flex;
				gap: 6px;
				align-items: center;
			}
			.dfs-bar-input {
				flex: 1;
				padding: 4px 8px;
				border: 1px solid var(--background-modifier-border);
				border-radius: 4px;
				background: var(--background-primary);
				color: var(--text-normal);
				font-size: 13px;
				min-width: 0;
			}
			.dfs-bar-input:focus {
				border-color: var(--interactive-accent);
				outline: none;
			}
			.dfs-bar-status {
				font-size: 12px;
				color: var(--text-muted);
				min-width: 40px;
				text-align: center;
			}
			.dfs-bar-btn {
				padding: 2px 6px;
				border: 1px solid var(--background-modifier-border);
				border-radius: 4px;
				background: var(--interactive-normal);
				color: var(--text-normal);
				cursor: pointer;
				font-size: 12px;
				line-height: 1.4;
			}
			.dfs-bar-btn:hover {
				background: var(--interactive-hover);
			}
			.dfs-bar-btn-text {
				font-size: 12px;
				padding: 2px 8px;
			}
			.dfs-bar-close {
				font-size: 14px;
				padding: 2px 6px;
			}
			.dfs-bar-close:hover {
				background: var(--background-modifier-error);
				color: white;
			}
			.dfs-bar-option {
				font-size: 12px;
				color: var(--text-muted);
				cursor: pointer;
				display: flex;
				align-items: center;
				gap: 2px;
				white-space: nowrap;
			}
			/* Scrollbar match markers */
			.dfs-scrollbar-markers {
				position: absolute;
				top: 0;
				right: 0;
				bottom: 0;
				width: 12px;
				pointer-events: none;
				z-index: 300;
			}
			.dfs-scrollbar-tick {
				position: absolute;
				right: 1px;
				width: 10px;
				height: 4px;
				background: rgba(255, 190, 0, 0.9);
				border-radius: 1px;
				cursor: pointer;
				pointer-events: auto;
			}
			.dfs-scrollbar-tick:hover {
				background: rgba(255, 140, 0, 1);
			}
			.dfs-scrollbar-tick-current {
				background: rgba(255, 100, 0, 1);
				height: 4px;
				box-shadow: 0 0 3px rgba(255, 100, 0, 0.8);
			}
			/* CM6 match highlights */
			.dfs-match {
				background-color: var(--text-highlight-bg, rgba(255, 208, 0, 0.4));
				border-radius: 2px;
			}
			.dfs-match-current {
				background-color: rgba(255, 140, 0, 0.6);
				border-radius: 2px;
				box-shadow: 0 0 0 1px rgba(255, 140, 0, 0.8);
			}
		`;
		document.head.appendChild(this.styleEl);
	}
}
