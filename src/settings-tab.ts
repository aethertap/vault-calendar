import { App, PluginSettingTab, Setting } from 'obsidian';
import CalendarPlugin from './main';
import { DEFAULT_SETTINGS } from './settings';

/**
 * Settings tab for the calendar plugin.
 * Provides UI controls for customizing calendar appearance and behavior.
 * Accessible through Obsidian's settings panel under plugin settings.
 */
export class CalendarSettingTab extends PluginSettingTab {
  /** Reference to the calendar plugin instance */
  plugin: CalendarPlugin;

  /**
   * Creates a new settings tab for the calendar plugin.
   *
   * @param app - The Obsidian app instance
   * @param plugin - The calendar plugin instance
   */
  constructor(app: App, plugin: CalendarPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /**
   * Renders the settings UI.
   * Creates controls for all calendar configuration options including
   * week start day, day labels, display options, and formatting.
   * Called by Obsidian when the settings tab is opened.
   */
  display(): void {
    const {containerEl} = this;

    containerEl.empty();

    // containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});
    const weeks: Record<string, string> = {
      '0': 'Sunday',
      '1': 'Monday',
      '2': 'Tuesday',
      '3': 'Wednesday',
      '4': 'Thursday',
      '5': 'Friday',
      '6': 'Saturday'
    };
    new Setting(containerEl)
      .setName('Start Of Week')
      .setDesc('The day a week begins.')
      .addDropdown(
        dropdown => dropdown
          .addOptions(weeks)
          .setValue(this.plugin.settings.startOfWeek)
          .onChange(async (value) => {
            this.plugin.settings.startOfWeek = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Display Table Header')
      .addToggle(
        dropdown => dropdown
          .setValue(this.plugin.settings.displayHead)
          .onChange(async (value) => {
            this.plugin.settings.displayHead = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Enable HTML')
      .setDesc('Treat your input text as HTML. Be careful, it may cause DOM injection attacks')
      .addToggle(
        dropdown => dropdown
          .setValue(this.plugin.settings.enableHTML)
          .onChange(async (value) => {
            this.plugin.settings.enableHTML = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Month Format')
      .setDesc('To format the month text which displays in the header')
      .addText(text => text
        .setValue(this.plugin.settings.monthFormat)
        .onChange(async (value) => {
          this.plugin.settings.monthFormat = value;
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('Sunday Label')
      .setDesc('Default is SUN')
      .addText(text => text
        .setValue(this.plugin.settings.Sunday)
        .onChange(async (value) => {
          this.plugin.settings.Sunday = value || DEFAULT_SETTINGS.Sunday;
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('Monday Label')
      .setDesc('Default is MON')
      .addText(text => text
        .setValue(this.plugin.settings.Monday)
        .onChange(async (value) => {
          this.plugin.settings.Monday = value || DEFAULT_SETTINGS.Monday;
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('Tuesday Label')
      .setDesc('Default is TUE')
      .addText(text => text
        .setValue(this.plugin.settings.Tuesday)
        .onChange(async (value) => {
          this.plugin.settings.Tuesday = value || DEFAULT_SETTINGS.Tuesday;
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('Wednesday Label')
      .setDesc('Default is WED')
      .addText(text => text
        .setValue(this.plugin.settings.Wednesday)
        .onChange(async (value) => {
          this.plugin.settings.Wednesday = value || DEFAULT_SETTINGS.Wednesday;
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('Thursday Label')
      .setDesc('Default is THU')
      .addText(text => text
        .setValue(this.plugin.settings.Thursday)
        .onChange(async (value) => {
          this.plugin.settings.Thursday = value || DEFAULT_SETTINGS.Thursday;
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('Friday Label')
      .setDesc('Default is FRI')
      .addText(text => text
        .setValue(this.plugin.settings.Friday)
        .onChange(async (value) => {
          this.plugin.settings.Friday = value || DEFAULT_SETTINGS.Friday;
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl)
      .setName('Saturday Label')
      .setDesc('Default is SAT')
      .addText(text => text
        .setValue(this.plugin.settings.Saturday)
        .onChange(async (value) => {
          this.plugin.settings.Saturday = value || DEFAULT_SETTINGS.Saturday;
          await this.plugin.saveSettings();
        }));
  }
}
