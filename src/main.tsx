import { Plugin } from 'obsidian';
import { CalendarPluginSettings, DEFAULT_SETTINGS } from './settings';
import { CalendarSettingTab } from './settings-tab';
import {Calendar, CalendarRenderer} from './calendar';
import {CalendarSwitcher} from './calendar-switcher';
import {render} from 'solid-js/web';
import {getAPI} from 'obsidian-dataview';
import { createSignal } from 'solid-js';


export default class CalendarPlugin extends Plugin {
  settings: CalendarPluginSettings;
  dv_api: any;
  async onload() {
    await this.loadSettings();
    this.dv_api = getAPI();
    let [is_modified,modified] = createSignal(1);
    this.addSettingTab(new CalendarSettingTab(this.app, this));
    
    this.registerMarkdownCodeBlockProcessor('calendar', (source, el, ctx) => {
      ctx.addChild(new CalendarRenderer(el, source, ctx.sourcePath, is_modified));
    });

    this.registerEvent(this.app.metadataCache.on('resolved',(...args)=>{
      console.log(`Got the resolved event. args = ${JSON.stringify(args)}`);
      modified(is_modified()+1);
    }));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

