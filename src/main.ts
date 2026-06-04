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
			name: "Find and replace in current note (diacritics-free)",
			editorCallback: (_editor, view) => {
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
			callback: () => {
				new GlobalSearchModal(this.app).open();
			},
		});

		// Settings tab
		this.addSettingTab(new DFSSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		const data = (await this.loadData()) as Partial<DFSSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
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

		new Setting(containerEl)
			.setName("Case sensitive by default")
			.setDesc("Start searches with case sensitivity enabled")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.caseSensitive)
					.onChange((value) => {
						this.plugin.settings.caseSensitive = value;
						void this.plugin.saveSettings();
					})
			);
	}
}
