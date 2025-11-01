import { App, Component, MarkdownRenderChild, MarkdownRenderer} from 'obsidian';
import { getAPI } from 'obsidian-dataview';
import { Signal, createMemo, createSignal, For, Accessor, Setter, createResource, Resource, ResourceReturn, } from 'solid-js';
import { render } from 'solid-js/web';
import { CalendarSwitcher } from './calendar-switcher';
import { parseDatePattern ,DatePattern, DateRange} from './datepattern';
import { dateSlug,navTo,firstOfMonth, partition } from './utils';

export interface CalendarProps {
  config: string,
  month: number,
  year: number,
  modified: Accessor<number>,
  events: ResourceReturn<Event[]>,
  sourcePath: string,
  container: Component,
}

export interface Event {
  when:DatePattern,
  display:string,
  link:string,
}

export class CalendarRenderer extends MarkdownRenderChild {
  source:string
  sourcePath:string
  container:HTMLElement
  dv_api: any
  is_modified: Accessor<number>
  modified:Setter<number>
  hasRendered: boolean
  
  constructor(containerEl:HTMLElement, source:string, sourcePath:string,modified:Signal<number>) {
    super(containerEl);
    this.source = source;
    this.sourcePath = sourcePath;
    this.container = containerEl;
    this.dv_api = getAPI();
    this.is_modified=modified[0];
    this.modified=modified[1];
   }
  
  async onload() {
    let today=new Date();
    let [getter,setter] = createSignal([today.getFullYear(),today.getMonth()]);
    
    let events = createResource(this.modified,async ()=>{
      let sorted:Event[] = [];
      if(this.source.length > 0) {
        let all = await this.dv_api.query(this.source);
        for(let evt of all) {
          let start = evt.start;
          let end = evt.end;
          let when = null;
          if(start && end) {
            new DateRange(start,end)
          } else {
            when = parseDatePattern(evt.text);
          }
          let display = all.text.replaceAll(/\[?\[?\d\d\d\d-\d\d-\d\d\]?\]?/g,'').trim();
          sorted.push({
            when:when,
            display:display,
            link:evt.key,
          })
        }
      } else {
        this.dv_api.pages().file.tasks
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
      }
      sorted.sort((a,b)=> a.when.begins().valueOf() - b.when.begins().valueOf());
      return sorted;
    });
    
    render((()=>
      <div class="calendar-container">
        <CalendarSwitcher switcher={[getter,setter]}/>
        <Calendar config={this.source} 
          modified={this.is_modified} 
          year={getter()[0]}
          month={getter()[1]} 
          events={events} 
          sourcePath={this.sourcePath}
          container={this}
        />
      </div>
    ),this.container)
  }
}

export function Calendar(props:CalendarProps) {
  let weekStart = ()=>firstOfMonth(props.month,props.year).getDay();
  let startDate = () => new Date(props.year, props.month, 1-weekStart());
  let lastversion = -1;
  let eventscache:Event[] = [];
 
  if(!this.dv_api) {
    this.dv_api = getAPI();
  } 
  
  let events = props.events;

  /*
  createResource(async () => {
    console.log("Updating calendar events maybe");
    // matching strategy: I want to keep a set of active events, always sorted by their start date. 
    // For each day in the month, I will output *all* of the active events in order, then remove
    // any events that expire that day. All I need to do is sort the array by start date, then remove 
    // items from the list as they expire on the output side.
    let sorted:Event[] = [];
    let newVersion=props.modified(); // call this outside if to ensure it gets noticed by reactive system
    if(lastversion < newVersion) {
      console.log("Really update events.");
      lastversion = newVersion;
      if(this.source.length() > 0) {
        let all = await this.dv_api.query(this.source);
        for(let evt of all) {
          let start = evt.start;
          let end = evt.end;
          let when = null;
          if(start && end) {
            new DateRange(start,end)
          } else {
            when = parseDatePattern(evt.text);
          }
          let display = all.text.replaceAll(/\[?\[?\d\d\d\d-\d\d-\d\d\]?\]?/g,'').trim();
          sorted.push({
            when:when,
            display:display,
            link:evt.key,
          })
        }
      } else {
        this.dv_api.pages().file.tasks
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

      }
      sorted.sort((a,b)=>a.when.begins().valueOf()-b.when.begins().valueOf());
      eventscache = sorted;
    } else {
      console.log(`NOT updating. lastversion=${lastversion}, newVersion=${newVersion}`);
    }
    return eventscache;
  });
*/ 
  // This should be updated whenever events is updated. It returns a map with
  // a list of events for each date in the date range given.
  let evt_map = createMemo(():{[key:string]: Event[]} => {
    let result:{[key:string]: Event[]} = {};
    let curr_date = startDate();
    const days=35;
    let range = new DateRange(startDate(), days);
    let all_events = events.filter(ev=>ev().when.overlaps(range));
    // Start with all of the spans that started before our date range
    let [active_events,remaining] = partition(all_events, ev=>ev.when.begins().valueOf()<curr_date.valueOf()); 
    console.log(`Update evt_map with ${all_events.length} events`);
    while(range.contains(curr_date)) {
      while(remaining.length > 0 && remaining[0].when.contains(curr_date)) {
        active_events.push(remaining.shift());
      }
      active_events = active_events.filter(e => e.when.contains(curr_date));
      //console.log(`Pushing ${active_events.length} events on ${dateSlug(curr_date)}`);
      result[dateSlug(curr_date)] = [...active_events];
      curr_date.setDate(curr_date.getDate()+1);
    }
    return result;
  })
  
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
              (MarkdownRenderer as any).render((window as any).app as App, evt.display, span, props.sourcePath, props.container); 
              return (<li class={"nodecoration event"+(evt.when.spans() > 1 ? " multiday": "")} onclick={()=>navTo(evt.link)}>{span}</li>
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


