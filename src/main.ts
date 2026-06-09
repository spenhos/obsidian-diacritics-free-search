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

		// How to use
		new Setting(containerEl).setName("How to use").setHeading();

		const help = containerEl.createDiv();
		help.createEl("p", {
			text: "This plugin adds two commands. Assign hotkeys to them in Settings → Hotkeys (search “diacritics”), or run them from the Command Palette (Cmd/Ctrl+P):",
		});

		const list = help.createEl("ul");
		const li1 = list.createEl("li");
		li1.createEl("strong", { text: "Find and replace in current note" });
		li1.appendText(" — opens a search bar at the top of the active note.");
		const li2 = list.createEl("li");
		li2.createEl("strong", { text: "Search entire vault" });
		li2.appendText(" — searches every note; click a result to jump to it.");

		const nav = help.createEl("p");
		nav.createEl("strong", { text: "While searching: " });
		nav.appendText(
			"Enter / Shift+Enter to move between matches, Esc to close, and toggle “Aa” for case sensitivity."
		);

		help.createEl("p", {
			text: "Tip: searching without diacritics finds text that has them — type בראשית to find בְּרֵאשִׁית, or “cafe” to find “café”.",
		});

		// Settings
		new Setting(containerEl).setName("Settings").setHeading();

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

		new Setting(containerEl)
			.setName("Support this plugin")
			.setDesc(
				"Diacritics-Free Search is free and open source. If it helps your work, you can support its development with a coffee. ☕"
			)
			.addButton((button) =>
				button
					.setButtonText("Support on Ko-fi")
					.setCta()
					.onClick(() => {
						window.open("https://ko-fi.com/elevalma", "_blank");
					})
			);
	}
}
