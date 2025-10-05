import {Signal,Index,Accessor} from 'solid-js';

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


