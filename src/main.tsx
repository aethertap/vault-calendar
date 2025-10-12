import { Plugin } from 'obsidian';
import { CalendarPluginSettings, DEFAULT_SETTINGS } from './settings';
import { CalendarSettingTab } from './settings-tab';
import {CalendarRenderer} from './calendar';
import {getAPI} from 'obsidian-dataview';
import { createSignal } from 'solid-js';


export default class CalendarPlugin extends Plugin {
  settings: CalendarPluginSettings;
  dv_api: any;
  async onload() {
    await this.loadSettings();
    this.dv_api = getAPI();
    let timeoutHandle = -1;
    
    let modified = createSignal(1);
    this.addSettingTab(new CalendarSettingTab(this.app, this));
    
    this.registerMarkdownCodeBlockProcessor('calendar', (source, el, ctx) => {
      ctx.addChild(new CalendarRenderer(el, source, ctx.sourcePath, modified));
    });

    this.registerEvent(this.app.metadataCache.on('dataview:index-ready' as any,(...args)=>{
      console.log(`Got the resolved event. args = ${JSON.stringify(args)}`);
      if(timeoutHandle > 0){
        window.clearTimeout(timeoutHandle);
      }
      timeoutHandle = window.setTimeout(()=>{
          modified[1]((version)=>version+1)
        },
        this.settings.updateDelayms);
    }));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

