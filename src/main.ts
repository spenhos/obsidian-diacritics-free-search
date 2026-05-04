import { App, MarkdownView, Plugin, PluginSettingTab, Setting } from "obsidian";
import { LocalSearchBar } from "./local-search-modal";
import { GlobalSearchModal } from "./global-search-modal";

interface DFSSettings {
	caseSensitive: boolean;
}

const DEFAULT_SETTINGS: DFSSettings = {
	caseSensitive: false,
};

// Keep one search bar per leaf so it remembers the last query
const searchBars = new WeakMap<MarkdownView, LocalSearchBar>();

export default class DiacriticsFreeSearchPlugin extends Plugin {
	settings: DFSSettings;

	async onload() {
		await this.loadSettings();

		// Command: Local search (in active note)
		this.addCommand({
			id: "dfs-local-search",
			name: "Find & Replace in current note (diacritics-free)",
			hotkeys: [{ modifiers: ["Alt"], key: "f" }],
			editorCallback: (editor, view) => {
				if (view instanceof MarkdownView) {
					let bar = searchBars.get(view);
					if (!bar) {
						bar = new LocalSearchBar(this.app, view);
						searchBars.set(view, bar);
					}
					bar.open();
				}
			},
		});

		// Command: Global search (vault-wide)
		this.addCommand({
			id: "dfs-global-search",
			name: "Search entire vault (diacritics-free)",
			hotkeys: [{ modifiers: ["Alt", "Shift"], key: "f" }],
			callback: () => {
				new GlobalSearchModal(this.app).open();
			},
		});

		// Settings tab
		this.addSettingTab(new DFSSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class DFSSettingTab extends PluginSettingTab {
	plugin: DiacriticsFreeSearchPlugin;

	constructor(app: App, plugin: DiacriticsFreeSearchPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Diacritics-Free Search" });

		containerEl.createEl("p", {
			text: "Search and replace text ignoring diacritical marks. Supports Hebrew nikud, Arabic tashkil, Latin accents, and all other Unicode combining marks.",
		});

		new Setting(containerEl)
			.setName("Case sensitive by default")
			.setDesc("Start searches with case sensitivity enabled")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.caseSensitive)
					.onChange(async (value) => {
						this.plugin.settings.caseSensitive = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("h3", { text: "Supported scripts" });
		const list = containerEl.createEl("ul");
		const scripts = [
			"Hebrew (nikud & cantillation marks)",
			"Arabic (tashkil / harakat)",
			"Latin (accents: é→e, ñ→n, ü→u, etc.)",
			"Greek (polytonic accents)",
			"Cyrillic (combining marks)",
			"Devanagari & other Indic scripts",
			"Any Unicode combining mark (category Mn)",
		];
		scripts.forEach((s) => list.createEl("li", { text: s }));
	}
}
