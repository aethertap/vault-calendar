import { moment } from 'obsidian';
import { getAPI } from 'obsidian-dataview';
import { createSignal, For } from 'solid-js';
import { CalendarPluginSettings } from './settings';

export interface CalendarProps {
  month: number,
  year: number,
  events: any[],
}

function dateSlug(date:Date): string {
  return `${date.getFullYear()}-${("0"+(date.getMonth()+1)).slice(-2)}-${("000"+date.getDate()).slice(-2)}`;
}

export function Calendar(props:CalendarProps) {
  console.log("RESCAN**************************");
  let weekStart = ()=>firstOfMonth(props.month,props.year).getDay();
  let days = ()=>{
    let month:{[key:string]:string []} = {  };
    for(let i=0; i<35; i++) {
      month[dateSlug(new Date(props.year,props.month,i-weekStart()+1))]=[];
    }
    return month;
  };
  let dv = getAPI();
  
  let events = () => {
    let result = days();
    dv.pages().file.tasks
      .where((t:any) => !t.complete && t.text.match(/\d\d\d\d-\d\d-\d\d/))
      .forEach((t:any,i:number) => {
        let due = t.text.match(/\d\d\d\d-\d\d-\d\d/);
        if(due && due[0]) {
          result[due[0]].push(t.text.replaceAll(/\d\d\d\d-\d\d-\d\d/g,'').trim());
          console.log(`got event ${i}: ${t.text}`);
        } 
      });
    return result;
  };

  return (
    <div class="calendar">
      <div class="header">Sun</div>
      <div class="header">Mon</div>
      <div class="header">Tue</div>
      <div class="header">Wed</div>
      <div class="header">Thu</div>
      <div class="header">Fri</div>
      <div class="header">Sat</div>
      <For each={Object.keys(events())}>{(day:string,_i:any)=>
        <div class="day" data-date={day}>
          <ul class="nodecoration">
            <li class="nodecoration daynum">{day.match(/\d\d\d\d-\d\d-0?(\d+)/)[1]}</li>
            <For each={events()[day]}>{(evt:string) => 
              <li class="nodecoration event">{evt}</li>
            }</For>
          </ul>
        </div>
        }</For> 
    </div>
  )
}

function firstOfMonth(month:number, year: number): Date {
  let result = new Date(year,month,1);
  return result;
}

function daysInMonth(month:number, year:number): number {
  return new Date(year,month,0).getDate()
}

