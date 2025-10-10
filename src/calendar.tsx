import { App, MarkdownRenderer, moment } from 'obsidian';
import { getAPI } from 'obsidian-dataview';
import { Signal, createMemo, createSignal, For, Accessor, Index } from 'solid-js';
import { parseDatePattern ,DatePattern, DateRange} from './datepattern';
import { CalendarPluginSettings } from './settings';
import { dateSlug,navTo,firstOfMonth,daysInMonth, partition } from './utils';

export interface CalendarProps {
  month: number,
  year: number,
  modified: Accessor<number>,
  events: any[],
}


export interface Event {
  when:DatePattern,
  display:string,
  link:string,
}

export function Calendar(props:CalendarProps) {
  let weekStart = ()=>firstOfMonth(props.month,props.year).getDay();
  let startDate = () => new Date(props.year, props.month, 1-weekStart());
  console.log(`startDate: ${startDate()}`);
  let dv = getAPI();
  
  let lastversion = -1;
  let events = createMemo(() => {
    // matching strategy: I want to keep a set of active events, always sorted by their start date. 
    // For each day in the month, I will output *all* of the active events in order, then remove
    // any events that expire that day. All I need to do is sort the array by start date, then remove 
    // items from the list as they expire on the output side.
    let sorted:Event[] = [];
    if(lastversion < props.modified()){
      lastversion = props.modified();
      console.log(`VaultCalendar: Reloading events... version ${props.modified()}`);

      dv.pages().file.tasks
        .where((t:any) => !t.completed && t.text.match(/\d\d\d\d-\d\d-\d\d/))
        .forEach((t:any,_i:number) => {
          let when = parseDatePattern(t.text);
          if(when) {
            sorted.push({
              when:when,
              display: t.text.replaceAll(/\[?\[?\d\d\d\d-\d\d-\d\d\]?\]?/g,'').trim(),
              link: t.link,
            });
            //console.log(`got event ${i}: ${t.text}`);
          } 
        });
      sorted.sort((a,b)=>a.when.begins().valueOf()-b.when.begins().valueOf());
    }
    return sorted;
  });
 
  // This should be updated whenever events is updated. It returns a map with
  // a list of events for each date in the date range given.
  let evt_map = (days:number = 35):{[key:string]: Event[]} => {
    let result:{[key:string]: Event[]} = {};
    let curr_date = startDate();
    let range = new DateRange(startDate(), days);
    let all_events = events().filter(ev=>ev.when.overlaps(range));
    // Start with all of the spans that started before our date range
    let [active_events,remaining] = partition(all_events, ev=>ev.when.begins().valueOf()<curr_date.valueOf()); 
    console.log(`Update evt_map: ${all_events.length} events`);
    while(range.contains(curr_date)) {
      while(remaining.length > 0 && remaining[0].when.contains(curr_date)) {
        //console.log(`adding active event`);
        active_events.push(remaining.shift());
      }
      active_events = active_events.filter(e => e.when.contains(curr_date));
      //console.log(`Pushing ${active_events.length} events on ${dateSlug(curr_date)}`);
      result[dateSlug(curr_date)] = [...active_events];
      curr_date.setDate(curr_date.getDate()+1);
    }
    return result;
  }
  
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
      <For each={Object.entries(evt_map())}>{([day,evts],i:Accessor<number>)=> {
        let bgclass="";
        if(evts.length<1) {
           bgclass="empty";
        }
       
        return <div class={`day ${bgclass} ${days[i()%7]}`} data-date={day}>
          <ul class="nodecoration">
            <li class={`nodecoration daynum ${day == today? "today" : ""}`}>{day.match(/\d\d\d\d-\d\d-0?(\d+)/)[1]}</li>
            <For each={evts}>{(evt:Event) => {
              let span = <span></span> ;
              (MarkdownRenderer as any).render((window as any).app as App, evt.display, span); 
              return (<li class="nodecoration event" onclick={()=>navTo(evt.link)}>{span}</li>
              )}
            }
            </For>
          </ul>
        </div>
        }
      }</For> 
    </div>
  )
}


