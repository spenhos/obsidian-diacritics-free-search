import { App, MarkdownView, Plugin, PluginSettingTab, Setting } from "obsidian";
import { LocalSearchBar } from "./local-search-modal";
import { GlobalSearchModal } from "./global-search-modal";
import { t, initI18n } from "./i18n";

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
		initI18n();

		// Command: Local search (in active note)
		this.addCommand({
			id: "dfs-local-search",
			name: t("cmdLocal"),
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
			name: t("cmdGlobal"),
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
		new Setting(containerEl).setName(t("howToUse")).setHeading();

		const help = containerEl.createDiv();
		help.createEl("p", { text: t("howIntro") });

		const list = help.createEl("ul");
		const li1 = list.createEl("li");
		li1.createEl("strong", { text: t("cmdLocalShort") });
		li1.appendText(t("cmdLocalDesc"));
		const li2 = list.createEl("li");
		li2.createEl("strong", { text: t("cmdGlobalShort") });
		li2.appendText(t("cmdGlobalDesc"));

		const nav = help.createEl("p");
		nav.createEl("strong", { text: t("whileSearching") });
		nav.appendText(t("navHelp"));

		help.createEl("p", { text: t("tip") });

		// Settings
		new Setting(containerEl).setName(t("settings")).setHeading();

		new Setting(containerEl)
			.setName(t("caseDefault"))
			.setDesc(t("caseDefaultDesc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.caseSensitive)
					.onChange((value) => {
						this.plugin.settings.caseSensitive = value;
						void this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t("support"))
			.setDesc(t("supportDesc"))
			.addButton((button) =>
				button
					.setButtonText(t("supportBtn"))
					.setCta()
					.onClick(() => {
						window.open("https://ko-fi.com/elevalma", "_blank");
					})
			);
	}
}
