import { App, MarkdownView, Plugin, PluginSettingTab, Setting } from "obsidian";
import { LocalSearchBar } from "./local-search-modal";
import { GlobalSearchModal } from "./global-search-modal";
import { t, initI18n } from "./i18n";

export interface DFSSettings {
	caseSensitive: boolean;
	highlightColor: string;
	currentColor: string;
	minChars: number;
	maxFiles: number;
}

const DEFAULT_SETTINGS: DFSSettings = {
	caseSensitive: false,
	highlightColor: "#ffd000",
	currentColor: "#ff8c00",
	minChars: 2,
	maxFiles: 50,
};

const GITHUB_URL = "https://github.com/spenhos/obsidian-diacritics-free-search";
const KOFI_URL = "https://ko-fi.com/elevalma";

// Keep one search bar per leaf so it remembers the last query
const searchBars = new WeakMap<MarkdownView, LocalSearchBar>();

export default class DiacriticsFreeSearchPlugin extends Plugin {
	settings: DFSSettings;

	async onload() {
		await this.loadSettings();
		initI18n();
		this.applyColors();

		// Command: Local search (in active note)
		this.addCommand({
			id: "dfs-local-search",
			name: t("cmdLocal"),
			editorCallback: (_editor, view) => {
				if (view instanceof MarkdownView) {
					let bar = searchBars.get(view);
					if (!bar) {
						bar = new LocalSearchBar(this.app, view, this.settings);
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
				new GlobalSearchModal(this.app, this.settings).open();
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
		this.applyColors();
	}

	applyColors() {
		const root = activeDocument.body;
		root.style.setProperty("--dfs-highlight", this.settings.highlightColor);
		root.style.setProperty("--dfs-current", this.settings.currentColor);
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

		const s = this.plugin.settings;
		const save = () => void this.plugin.saveSettings();

		// Search
		new Setting(containerEl).setName(t("searchHeading")).setHeading();

		new Setting(containerEl)
			.setName(t("caseDefault"))
			.setDesc(t("caseDefaultDesc"))
			.addToggle((toggle) =>
				toggle.setValue(s.caseSensitive).onChange((value) => {
					s.caseSensitive = value;
					save();
				})
			);

		new Setting(containerEl)
			.setName(t("highlightColor"))
			.setDesc(t("highlightColorDesc"))
			.addColorPicker((cp) =>
				cp.setValue(s.highlightColor).onChange((value) => {
					s.highlightColor = value;
					save();
				})
			);

		new Setting(containerEl)
			.setName(t("currentColor"))
			.setDesc(t("currentColorDesc"))
			.addColorPicker((cp) =>
				cp.setValue(s.currentColor).onChange((value) => {
					s.currentColor = value;
					save();
				})
			);

		new Setting(containerEl)
			.setName(t("minChars"))
			.setDesc(t("minCharsDesc"))
			.addSlider((sl) =>
				sl
					.setLimits(1, 5, 1)
					.setValue(s.minChars)
					.onChange((value) => {
						s.minChars = value;
						save();
					})
			);

		new Setting(containerEl)
			.setName(t("maxFiles"))
			.setDesc(t("maxFilesDesc"))
			.addText((txt) =>
				txt.setValue(String(s.maxFiles)).onChange((value) => {
					const n = parseInt(value, 10);
					if (!isNaN(n) && n > 0) {
						s.maxFiles = n;
						save();
					}
				})
			);

		// Support
		new Setting(containerEl).setName(t("support")).setHeading();

		new Setting(containerEl)
			.setName(t("supportBtn"))
			.setDesc(t("supportDesc"))
			.addButton((button) => {
				button
					.setButtonText("☕ " + t("supportBtn"))
					.onClick(() => window.open(KOFI_URL, "_blank"));
				button.buttonEl.addClass("dfs-kofi-btn");
				return button;
			});

		// About
		const about = containerEl.createDiv({ cls: "dfs-about" });
		about.createSpan({
			text: `Diacritics-Free Search v${this.plugin.manifest.version} · `,
		});
		const gh = about.createEl("a", { text: t("viewGithub"), href: GITHUB_URL });
		gh.setAttr("target", "_blank");
		about.createSpan({ text: " · " });
		const issue = about.createEl("a", {
			text: t("reportIssue"),
			href: GITHUB_URL + "/issues",
		});
		issue.setAttr("target", "_blank");
	}
}
