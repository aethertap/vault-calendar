import { Plugin } from 'obsidian';
import { HabitTrackerPluginSettings, DEFAULT_SETTINGS } from './settings';
import { renderTable } from './renderer';
import { HabitTrackerSettingTab } from './settings-tab';
import {SolidSample} from './renderer';
import {render} from 'solid-js/web';

export default class HabitTrackerPlugin extends Plugin {
  settings: HabitTrackerPluginSettings;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new HabitTrackerSettingTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor('habitt', (source, el) => {
      render((()=><SolidSample/>),el)
      //el.appendChild(renderTable(source, this.settings));
    })
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

