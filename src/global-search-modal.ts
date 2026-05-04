import { App, MarkdownView, Modal, TFile } from "obsidian";
import { findMatchesIgnoringDiacritics } from "./normalize";

interface SearchResult {
	file: TFile;
	matches: Array<{ start: number; end: number }>;
	contextParts: Array<{ text: string; highlight: boolean }>;
	lineNumber: number;
	matchCount: number;
}

export class GlobalSearchModal extends Modal {
	private searchInput: HTMLInputElement;
	private replaceInput: HTMLInputElement;
	private resultsContainer: HTMLElement;
	private statusEl: HTMLElement;
	private caseSensitive: boolean = false;
	private results: SearchResult[] = [];
	private debounceTimer: number | null = null;

	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClass("dfs-global-search-modal");

		contentEl.createEl("h3", { text: "Global search" });

		// Search input
		const searchRow = contentEl.createDiv({ cls: "dfs-row" });
		this.searchInput = searchRow.createEl("input", {
			type: "text",
			placeholder: "Search across all notes...",
			cls: "dfs-search-input dfs-global-input",
		});
		this.searchInput.focus();

		// Replace input
		const replaceRow = contentEl.createDiv({ cls: "dfs-row" });
		this.replaceInput = replaceRow.createEl("input", {
			type: "text",
			placeholder: "Replace with... (optional)",
			cls: "dfs-search-input dfs-global-input",
		});
		const replaceAllBtn = replaceRow.createEl("button", {
			text: "Replace all",
			cls: "dfs-btn dfs-btn-danger",
		});
		replaceAllBtn.addEventListener("click", () => {
			void this.replaceAllGlobal();
		});

		// Options
		const optionsRow = contentEl.createDiv({ cls: "dfs-row dfs-options" });
		const caseLabel = optionsRow.createEl("label", { cls: "dfs-option-label" });
		const caseCheckbox = caseLabel.createEl("input", { type: "checkbox" });
		caseLabel.appendText(" Case sensitive");
		caseCheckbox.addEventListener("change", () => {
			this.caseSensitive = caseCheckbox.checked;
			void this.doGlobalSearch();
		});

		// Status
		this.statusEl = contentEl.createDiv({ cls: "dfs-status" });

		// Results
		this.resultsContainer = contentEl.createDiv({ cls: "dfs-results" });

		// Events
		this.searchInput.addEventListener("input", () => {
			if (this.debounceTimer) clearTimeout(this.debounceTimer);
			this.debounceTimer = window.setTimeout(() => {
				void this.doGlobalSearch();
			}, 300);
		});
		this.searchInput.addEventListener("keydown", (evt) => {
			if (evt.key === "Escape") this.close();
		});
	}

	private async doGlobalSearch() {
		const searchQuery = this.searchInput.value.trim();
		this.results = [];
		this.resultsContainer.empty();

		if (!searchQuery || searchQuery.length < 2) {
			this.statusEl.setText(searchQuery ? "Type at least 2 characters" : "");
			return;
		}

		this.statusEl.setText("Searching...");

		const files = this.app.vault.getMarkdownFiles();
		let totalMatches = 0;

		for (const file of files) {
			const content = await this.app.vault.cachedRead(file);
			const matches = findMatchesIgnoringDiacritics(content, searchQuery, this.caseSensitive);

			if (matches.length > 0) {
				totalMatches += matches.length;

				// Get the line containing the first match
				const firstMatch = matches[0];
				const lineStart = content.lastIndexOf("\n", firstMatch.start) + 1;
				const lineEnd = content.indexOf("\n", firstMatch.end);
				const lineText = content.substring(
					lineStart,
					lineEnd === -1 ? content.length : lineEnd
				).trim();
				const lineNumber =
					content.substring(0, firstMatch.start).split("\n").length;

				// Build highlighted context parts
				const contextParts = this.buildHighlightedContext(lineText, searchQuery);

				this.results.push({
					file,
					matches,
					contextParts,
					lineNumber,
					matchCount: matches.length,
				});
			}
		}

		this.statusEl.setText(
			`${totalMatches} matches in ${this.results.length} files`
		);
		this.renderResults();
	}

	private buildHighlightedContext(
		lineText: string,
		query: string
	): Array<{ text: string; highlight: boolean }> {
		const truncated = lineText.substring(0, 150);
		const lineMatches = findMatchesIgnoringDiacritics(truncated, query, this.caseSensitive);

		if (lineMatches.length === 0) {
			return [{ text: truncated, highlight: false }];
		}

		const parts: Array<{ text: string; highlight: boolean }> = [];
		let lastEnd = 0;

		for (const m of lineMatches) {
			if (m.start > lastEnd) {
				parts.push({ text: truncated.substring(lastEnd, m.start), highlight: false });
			}
			parts.push({ text: truncated.substring(m.start, m.end), highlight: true });
			lastEnd = m.end;
		}

		if (lastEnd < truncated.length) {
			parts.push({ text: truncated.substring(lastEnd), highlight: false });
		}

		return parts;
	}

	private renderResults() {
		this.resultsContainer.empty();

		for (const result of this.results.slice(0, 50)) {
			const resultEl = this.resultsContainer.createDiv({ cls: "dfs-result-item" });

			// File header
			const headerEl = resultEl.createDiv({ cls: "dfs-result-header" });
			headerEl.createSpan({
				text: result.file.basename,
				cls: "dfs-result-filename",
			});
			headerEl.createSpan({
				text: ` (${result.matchCount})`,
				cls: "dfs-result-count",
			});

			// Context with highlighted matches
			const contextEl = resultEl.createDiv({ cls: "dfs-result-context" });
			contextEl.createSpan({
				text: `L${result.lineNumber}: `,
				cls: "dfs-result-line-num",
			});

			for (const part of result.contextParts) {
				if (part.highlight) {
					contextEl.createSpan({
						text: part.text,
						cls: "dfs-result-highlight",
					});
				} else {
					contextEl.createSpan({ text: part.text });
				}
			}

			// Store references for the click handler
			const fileRef = result.file;
			const matchRef = result.matches[0];

			// Click to open file — close modal FIRST
			resultEl.addEventListener("click", () => {
				const file = fileRef;
				const match = matchRef;
				this.close();

				// Use activeLeaf or create new
				const leaf = this.app.workspace.getLeaf(false);
				void leaf.openFile(file).then(() => {
					setTimeout(() => {
						const view = this.app.workspace.getActiveViewOfType(MarkdownView);
						if (view) {
							const editor = view.editor;
							const content = editor.getValue();
							const from = this.offsetToPos(content, match.start);
							const to = this.offsetToPos(content, match.end);
							editor.setSelection(from, to);
							editor.scrollIntoView({ from, to }, true);
						}
					}, 200);
				});
			});
		}

		if (this.results.length > 50) {
			this.resultsContainer.createDiv({
				text: `... and ${this.results.length - 50} more files`,
				cls: "dfs-result-overflow",
			});
		}
	}

	private async replaceAllGlobal() {
		const replacement = this.replaceInput.value;
		if (this.results.length === 0) return;

		let totalReplaced = 0;

		for (const result of this.results) {
			let content = await this.app.vault.read(result.file);
			const matches = findMatchesIgnoringDiacritics(
				content,
				this.searchInput.value.trim(),
				this.caseSensitive
			);

			for (let i = matches.length - 1; i >= 0; i--) {
				content =
					content.substring(0, matches[i].start) +
					replacement +
					content.substring(matches[i].end);
				totalReplaced++;
			}

			await this.app.vault.modify(result.file, content);
		}

		this.statusEl.setText(
			`Replaced ${totalReplaced} occurrences in ${this.results.length} files`
		);
		this.results = [];
		this.resultsContainer.empty();
	}

	private offsetToPos(content: string, offset: number): { line: number; ch: number } {
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

	onClose() {
		this.contentEl.empty();
	}
}
