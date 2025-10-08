import { App, MarkdownRenderer, moment } from 'obsidian';
import { getAPI } from 'obsidian-dataview';
import { Signal, createMemo, createSignal, For, Accessor, Index } from 'solid-js';
import { parseDatePattern } from './datepattern';
import { CalendarPluginSettings } from './settings';
import { dateSlug,navTo,firstOfMonth,daysInMonth } from './utils';

export interface CalendarProps {
  month: number,
  year: number,
  modified: Accessor<number>,
  events: any[],
}


export interface Event {
  start:string,
  display:string,
  end?:string,
  link:string,
}

export function Calendar(props:CalendarProps) {
  let weekStart = ()=>firstOfMonth(props.month,props.year).getDay();
  let startDate = () => new Date(props.year, props.month, 1-weekStart());
  console.log(`startDate: ${startDate()}`);
  let dv = getAPI();
  let dates = () => {
    let result = [];
    let d = new Date(startDate());
    for(let i=0; i<35; i++) {
      result.push(dateSlug(d));
      d.setDate(d.getDate()+1);
    }
    return result;
  }
  let events = createMemo(() => {
    // matching strategy: I want to keep a set of active events, always sorted by their start date. 
    // For each day in the month, I will output *all* of the active events in order, then remove
    // any events that expire that day. All I need to do is sort the array by start date, then remove 
    // items from the list as they expire on the output side.

    let result:{[key:string]:Event[]} = {};
    console.log(`Calendar: Reloading events... version ${props.modified()}`);
   
    dv.pages().file.tasks
      .where((t:any) => !t.completed && t.text.match(/\d\d\d\d-\d\d-\d\d/))
      .forEach((t:any,_i:number) => {
        let when = parseDatePattern(t.text);
        let due = t.text.match(/\d\d\d\d-\d\d-\d\d/);
        if(due && due[0]) {
          if(!result.hasOwnProperty(due[0])){
            result[due[0]] = [];
          }
          result[due[0]].push({
            start:t.text.match(/\d\d\d\d-\d\d-\d\d/,'')[0],
            display:t.text.replaceAll(/\d\d\d\d-\d\d-\d\d/g,'').trim(),
            link: t.link,
          });
          //console.log(`got event ${i}: ${t.text}`);
        } 
      });
    return result;
  });
  let days = ["sun","mon","tue","wed","thu","fri","sat"];
  let today = dateSlug(new Date());
  return (
    <div class="vault-calendar">
      <div class="header">Sun</div>
      <div class="header">Mon</div>
      <div class="header">Tue</div>
      <div class="header">Wed</div>
      <div class="header">Thu</div>
      <div class="header">Fri</div>
      <div class="header">Sat</div>
      <For each={dates()}>{(day:string,i:Accessor<number>)=> {
        let bgclass="";
        if(!events()[day] || events()[day].length<1) {
           bgclass="empty";
        }
       
        return <div class={`day ${bgclass} ${days[i()%7]}`} data-date={day}>
          <ul class="nodecoration">
            <li class={`nodecoration daynum ${day == today? "today" : ""}`}>{day.match(/\d\d\d\d-\d\d-0?(\d+)/)[1]}</li>
            <For each={events()[day]}>{(evt:Event) => {
              let span = <span></span> ;
              (MarkdownRenderer as any).render((window as any).app as App, evt.display, span); 
              return <li class="nodecoration event" onclick={()=>navTo(evt.link)}>{span}</li>
            }
            }</For>
          </ul>
        </div>
        }
      }</For> 
    </div>
  )
}


