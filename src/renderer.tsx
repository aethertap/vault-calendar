import { App, moment } from 'obsidian';
import { getAPI } from 'obsidian-dataview';
import { Signal, createMemo, createSignal, For, Accessor } from 'solid-js';
import { CalendarPluginSettings } from './settings';

export interface CalendarProps {
  month: number,
  year: number,
  events: any[],
}
export interface CalendarSwitcherProps {
  switcher: Signal<number[]|undefined>,
}
export function CalendarSwitcher(props:CalendarSwitcherProps){
  let [getter,setter] = props.switcher;
  return <div class="calendar-switcher">
    <span class={getter()[1]==0?"active":"hidden"} onclick={()=>setter([getter()[0],0])}>Jan</span>
    <span class={getter()[1]==1?"active":"hidden"} onclick={()=>setter([getter()[0],1])}>Feb</span>
    <span class={getter()[1]==2?"active":"hidden"} onclick={()=>setter([getter()[0],2])}>Mar</span>
    <span class={getter()[1]==3?"active":"hidden"} onclick={()=>setter([getter()[0],3])}>Apr</span>
    <span class={getter()[1]==4?"active":"hidden"} onclick={()=>setter([getter()[0],4])}>May</span>
    <span class={getter()[1]==5?"active":"hidden"} onclick={()=>setter([getter()[0],5])}>Jun</span>
    <span class={getter()[1]==6?"active":"hidden"} onclick={()=>setter([getter()[0],6])}>Jul</span>
    <span class={getter()[1]==7?"active":"hidden"} onclick={()=>setter([getter()[0],7])}>Aug</span>
    <span class={getter()[1]==8?"active":"hidden"} onclick={()=>setter([getter()[0],8])}>Sep</span>
    <span class={getter()[1]==9?"active":"hidden"} onclick={()=>setter([getter()[0],9])}>Oct</span>
    <span class={getter()[1]==10?"active":"hidden"} onclick={()=>setter([getter()[0],10])}>Nov</span>
    <span class={getter()[1]==11?"active":"hidden"} onclick={()=>setter([getter()[0],11])}>Dec</span>
  </div>
}

function dateSlug(date:Date): string {
  return `${date.getFullYear()}-${("0"+(date.getMonth()+1)).slice(-2)}-${("000"+date.getDate()).slice(-2)}`;
}

export interface Event {
  start:string,
  display:string,
  end?:string,
  link:string,
}

export function Calendar(props:CalendarProps) {
  console.log("RESCAN**************************");
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
    let result:{[key:string]:Event[]} = {};
    console.log("Reloading events...");
    dv.pages().file.tasks
      .where((t:any) => !t.complete && t.text.match(/\d\d\d\d-\d\d-\d\d/))
      .forEach((t:any,i:number) => {
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
    <div class="calendar">
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
            <For each={events()[day]}>{(evt:Event) => 
              <li class="nodecoration event" onclick={()=>navTo(evt.link)}>{evt.display}</li>
            }</For>
          </ul>
        </div>
        }
      }</For> 
    </div>
  )
}

function navTo(link:any) {
  console.log(`Navigate to ${link}`);
  ((window as any).app as App).workspace.openLinkText(
    link.toFile().obsidianLink(),
    link.path
  );
}

function firstOfMonth(month:number, year: number): Date {
  let result = new Date(year,month,1);
  return result;
}

function daysInMonth(month:number, year:number): number {
  return new Date(year,month,0).getDate()
}

