import { Plugin } from 'obsidian';
import { CalendarPluginSettings, DEFAULT_SETTINGS } from './settings';
import { CalendarSettingTab } from './settings-tab';
import {Calendar} from './renderer';
import {render} from 'solid-js/web';
import {getAPI} from 'obsidian-dataview';

export default class CalendarPlugin extends Plugin {
  settings: CalendarPluginSettings;
  dv_api: any;
  async onload() {
    await this.loadSettings();
    this.dv_api = getAPI();
    
    this.addSettingTab(new CalendarSettingTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor('calendar', (source, el) => {
      render((()=><Calendar year={2025} month={9} events={[]}/>),el)
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

