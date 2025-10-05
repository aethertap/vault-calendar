import { App } from "obsidian";

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

