import { App, MarkdownRenderer, moment } from 'obsidian';
import { getAPI } from 'obsidian-dataview';
import { Signal, createMemo, createSignal, For, Accessor, Index } from 'solid-js';
import { CalendarPluginSettings } from './settings';

export interface CalendarProps {
  month: number,
  year: number,
  modified: Accessor<number>,
  events: any[],
}
export interface CalendarSwitcherProps {
  switcher: Signal<number[]|undefined>,
}
export function CalendarSwitcher(props:CalendarSwitcherProps){
  let [getter,setter] = props.switcher;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return <div class="calendar-switcher">
    <Index each={[0,1,2,3,4,5,6,7,8,9,10,11]}>{(month:Accessor<number>)=>
      <span class={getter()[1]==month()?"active":"hidden"} onclick={()=>setter([getter()[0],month()])}>{months[month()]}</span>
    }</Index>
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
    console.log(`Calendar: Reloading events... version ${props.modified()}`);
    
    dv.pages().file.tasks
      .where((t:any) => !t.completed && t.text.match(/\d\d\d\d-\d\d-\d\d/))
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

