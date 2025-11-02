import { DateTime, Duration } from "luxon";
import { App } from "obsidian";

export const MS_PER_DAY=1000*60*60*24;

export function dateSlug(date:DateTime): string {
  return `${date.year}-${("0"+(date.month)).slice(-2)}-${("0"+date.day).slice(-2)}`;
}

export function navTo(link:any) {
  console.log(`Navigate to ${link}`);
  ((window as any).app as App).workspace.openLinkText(
    link.toFile().obsidianLink(),
    link.path
  );
}

export function firstOfMonth(month:number, year: number): DateTime {
  let result = DateTime.local(year,month,1);
  return result;
}

export function daysInMonth(month:number, year:number): number {
  return DateTime.local(year,month+1,1).minus(Duration.fromObject({days:1})).day;
}

// Return the date whose day number is greater than the initial value by `days`. If you're using this in 
// DateRange, this will give you the first day that is _NOT_ within the range!
export function daysAfter(date:DateTime,days:number):DateTime {
  let result = DateTime.local(date);
  result.set({
    day:result.day+days
  });
  return result;
}

export function partition<T>(list:T[], func: (arg0:T)=>boolean ):[T[],T[]] {
  let yes:T[] = [];
  let no:T[] = [];
  for(let element of list) {
    if(func(element)) {
      yes.push(element);
    } else {
      no.push(element);
    }
  }
  return [yes,no]
}
