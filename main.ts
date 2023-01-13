import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	useTab: boolean;
    tabSpaces: number;
    fillIn: string;

}

const DEFAULT_SETTINGS: MyPluginSettings = {
	useTab: false,
    tabSpaces: 4,
    fillIn: ' '
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
        // console.log('loading plugin inline-tab')
        await this.loadSettings()
        // console.log("app:",this.app.vault.config.useTab)
        this.addCommand({
            id: "insert-inline-tab",
            name: "Insert inline tab",
            hotkeys: [{modifiers:["Mod"], key:"]"}, {modifiers:["Alt"], key:"Tab"}],
            editorCallback: (editor: Editor) => {
                const cursor = editor.getCursor()
                const selection = editor.getSelection();
                // console.log({cursor, selection})
                //{ "cursor": { "line": 1, "ch": 7 }, "selection": "lets" }
                let insertCh = selection.length > 0 ? (cursor.ch-selection.length):cursor.ch
                let addSome = ''
                if (this.settings.useTab) {
                    addSome = '\t'
                } else {
                    let tail = this.settings.tabSpaces - (insertCh % this.settings.tabSpaces);
                    for (let index = 0; index < tail; index++) { addSome += this.settings.fillIn }
                }
                editor.replaceRange(addSome, {ch:insertCh, line:cursor.line});
                editor.setCursor({ch:insertCh + addSome.length, line:cursor.line})
            },
          });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new settingTab(this.app, this));
	}

	onunload() {
        console.log('unload plugin inline-tab')
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


class settingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for inline tab plugin.'});

        const settingTabSpaces = new Setting(containerEl)
        .setName('Tab spaces : '+this.plugin.settings.tabSpaces)
        .setDesc('How many spaces to be a inline tab?')
        .setVisibility(!this.plugin.settings.useTab)
        .addSlider(val => val
            .setLimits(1, 10, 1)
            .setValue(this.plugin.settings.tabSpaces)
            .onChange(async (value) => {
                this.plugin.settings.tabSpaces = value;
                await this.plugin.saveSettings();
                settingTabSpaces.setName('Tab spaces : '+this.plugin.settings.tabSpaces)
            }))

        const settingFillIn = new Setting(containerEl)
        .setName('Fill in charactor:')
        .setVisibility(!this.plugin.settings.useTab)
        .setDesc('Leave blank for a space charactor.')
        .addText(text => text
            .setValue(this.plugin.settings.fillIn)
            .onChange(async (value) => {
                value = value.trim()
                if (value == ''){ value = ' '}
                this.plugin.settings.fillIn = value[0];
                await this.plugin.saveSettings();
            }));

        new Setting(containerEl)
        .setName('Use tab instead of spaces?')
        .setDesc('True for \\t , False for spaces.')
        .addToggle(val => val
            .setValue(this.plugin.settings.useTab)
            .onChange(async (value) => {
                console.log('useTabNewVal: ' + value);
                this.plugin.settings.useTab = value;
                await this.plugin.saveSettings();
                if (value) {
                    console.log ('settingTabSpaces', settingTabSpaces)
                    settingTabSpaces.setVisibility(false)
                    settingFillIn.setVisibility(false)
                }else{
                    settingTabSpaces.setVisibility(true)
                    settingFillIn.setVisibility(true)
                }
            }));

    }
}
