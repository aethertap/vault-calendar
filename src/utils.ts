import { App } from "obsidian";

export const MS_PER_DAY=1000*60*60*24;

export function dateSlug(date:Date): string {
  return `${date.getFullYear()}-${("0"+(date.getMonth()+1)).slice(-2)}-${("000"+date.getDate()).slice(-2)}`;
}

export function navTo(link:any) {
  console.log(`Navigate to ${link}`);
  ((window as any).app as App).workspace.openLinkText(
    link.toFile().obsidianLink(),
    link.path
  );
}

export function firstOfMonth(month:number, year: number): Date {
  let result = new Date(year,month,1);
  return result;
}

export function daysInMonth(month:number, year:number): number {
  return new Date(year,month,0).getDate()
}

// Return the date whose day number is greater than the initial value by `days`. If you're using this in 
// DateRange, this will give you the first day that is _NOT_ within the range!
export function daysAfter(date:Date,days:number):Date {
  let result = new Date(date);
  result.setDate(result.getDate()+days);
  return result;
}
