import { Plugin } from 'obsidian';
import { CalendarPluginSettings, DEFAULT_SETTINGS } from './settings';
import { CalendarSettingTab } from './settings-tab';
import {Calendar, CalendarSwitcher} from './renderer';
import {render} from 'solid-js/web';
import {getAPI} from 'obsidian-dataview';
import { createSignal } from 'solid-js';


export default class CalendarPlugin extends Plugin {
  settings: CalendarPluginSettings;
  dv_api: any;
  async onload() {
    await this.loadSettings();
    this.dv_api = getAPI();
    
    this.addSettingTab(new CalendarSettingTab(this.app, this));
    let today=new Date();
    let [getter,setter] = createSignal([today.getFullYear(),today.getMonth()]);
    let [is_modified,modified] = createSignal(0);
    
    this.registerMarkdownCodeBlockProcessor('calendar', (source, el) => {
      render((()=>
        <div class="calendar-container">
        <CalendarSwitcher switcher={[getter,setter]}/>
        <Calendar modified={is_modified} year={getter()[0]} month={getter()[1]} events={[]}/>
        </div>
        ),el)
      //el.appendChild(renderTable(source, this.settings));
    });
    this.registerEvent(this.app.metadataCache.on('resolved',()=>{
      console.log("Got the resolved event");
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

