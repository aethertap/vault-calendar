import { App, Component, MarkdownRenderChild, MarkdownRenderer} from 'obsidian';
import { Failure, getAPI } from 'obsidian-dataview';
import { Signal, createMemo, createSignal, For, Accessor, Setter, createResource, Resource, ResourceReturn, Show, } from 'solid-js';
import { render } from 'solid-js/web';
import { CalendarSwitcher } from './calendar-switcher';
import { parseDatePattern ,DatePattern, DateRange} from './datepattern';
import { dateSlug,navTo,firstOfMonth, partition } from './utils';
import { DateTime, Duration } from 'luxon';

export interface CalendarProps {
  config: string,
  month: number,
  year: number,
  dv_source: string,
  modified: Accessor<number>,
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
    let today=DateTime.local();
    let [getter,setter] = createSignal([today.year,today.month]);
    
   
    render((()=>
      <div class="calendar-container">
        <CalendarSwitcher switcher={[getter,setter]}/>
        <Calendar config={this.source} 
          modified={this.is_modified} 
          year={getter()[0]}
          month={getter()[1]} 
          dv_source={this.source}
          sourcePath={this.sourcePath}
          container={this}
        />
      </div>
    ),this.container)
  }
}

export function Calendar(props:CalendarProps) {
  let weekStart = ()=>firstOfMonth(props.month,props.year).day;
  let startDate= () => DateTime.local(props.year, props.month, 1).minus(Duration.fromObject({days:weekStart()}));
 
  if(!this.dv_api) {
    this.dv_api = getAPI();
  } 
 
  let [events,_handle] = createResource(props.modified, async ()=>{
    console.log(`fetching events resource, version=${props.modified()}`);
    console.log(`source is ${props.dv_source}`);

    let sorted:Event[] = [];
    if(props.dv_source.length > 0) {
      let all = await this.dv_api.query(props.dv_source);
      console.log(`dataview returned `,all);
      if(!all.successful){
        console.log(`error was: ${all.error}`) ;
        return [];
      }else{
        console.log(`********** got ${all.value.values.length} events`)
      }
      for(let evt of all.value.values) {
        //console.log(`the evt is: ${JSON.stringify(evt)}`);
        let when:DatePattern = null;
        let display:string = evt.text;
        let link:any = evt.key;
        if(evt.value){ // this will be set if the user has specified an object as the output 
          let start = evt.value.start;
          let end = evt.value.end;
          if(start) {
            let rwhen = new DateRange(start,1);
            if(end){
              rwhen.withEnd(end);
            }
            when = rwhen;
          } 
          if(evt.value.link){
            link = evt.value.link;
          }
          if(evt.value.display){
            display=evt.value.display;
          }
        } else {
          when = parseDatePattern(evt.text);
        }
        if(!when) {
          when = parseDatePattern(evt.text);
        }
        if(when) {
          display = display.replaceAll(/\[?\[?\d\d\d\d-\d\d-\d\d\]?\]?/g,'').trim();
          sorted.push({
            when:when,
            display:display,
            link:evt.key||evt.link,
          })
        }
      }
    } else { // no source provided, do the default behavior and search for uncompleted tasks
      (await this.dv_api.pages()).file.tasks
        .where((t:any) => !t.completed && t.text.match(/\d\d\d\d-\d\d-\d\d/))
        .forEach((t:any,_i:number) => {
          let when = parseDatePattern(t.text);
          if(when) {
            sorted.push({
              when:when,
              display: t.text.replaceAll(/\[?\[?\d\d\d\d-\d\d-\d\d\]?\]?/g,'').trim(),
              link: t.link,
            });
          }
        });
    }
    sorted.sort((a,b)=> a.when.begins().valueOf() - b.when.begins().valueOf());
    console.log(`Returning ${sorted.length} events from createResource`);
    return sorted;
  });

  // This should be updated whenever the date range is updated. It returns a map with
  // a list of events for each date in the date range given.
  let evt_map = (): { [key: string]: Event[] } => {
    if(!events()){
      return {};
    }
    let result: { [key: string]: Event[] } = {};
    let curr_date = startDate();
    const days = 35;
    let range = new DateRange(startDate(), days);
    console.log(`Checking events in date range ${JSON.stringify(range)}`)
    let all_events = events().filter(ev => {
      //console.log(`Event is: ${JSON.stringify(ev)}`);
      return ev.when.overlaps(range)
    });
    // Start with all of the spans that started before our date range
    let [active_events, remaining] = partition(all_events, ev => ev.when.begins().valueOf() < curr_date.valueOf());
    console.log(`Update evt_map with ${all_events.length} events (active: ${active_events.length}, remaining: ${remaining.length})`);
    
    while (range.contains(curr_date)) {
      while (remaining.length > 0 && remaining[0].when.contains(curr_date)) {
        active_events.push(remaining.shift());
      }
      active_events = active_events.filter(e => e.when.contains(curr_date));
      //console.log(`Pushing ${active_events.length} events on ${dateSlug(curr_date)}`);
      result[dateSlug(curr_date)] = [...active_events];
      curr_date = curr_date.plus(Duration.fromObject({days:1}));
      console.log(`Advance date to ${curr_date}`);
    }
    return result;
  }
  
  let days = ["sun","mon","tue","wed","thu","fri","sat"];
  let today = dateSlug(DateTime.local());
  return (
    <Show when={evt_map()} fallback={<p>Loading events...</p>}>{
      (mapped)=>{
        return (
          <div class="vault-calendar">
            <div class="header">Sun</div>
            <div class="header">Mon</div>
            <div class="header">Tue</div>
            <div class="header">Wed</div>
            <div class="header">Thu</div>
            <div class="header">Fri</div>
            <div class="header">Sat</div>
            <For each={Object.entries(mapped())}>{([day,evts],i:Accessor<number>)=> {
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
            }}
            </For> 
          </div>
        )
      }
    }
   </Show>
  )
}


