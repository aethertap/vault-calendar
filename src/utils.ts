import { DateTime, Duration } from "luxon";
import { App } from "obsidian";

/**
 * Number of milliseconds in one day.
 * Used for date calculations throughout the calendar code.
 */
export const MS_PER_DAY=1000*60*60*24;

/**
 * Converts a DateTime to an ISO date string (YYYY-MM-DD format).
 * Ensures consistent two-digit month and day formatting.
 * Used for creating consistent date identifiers and file links.
 *
 * @param date - The date to format
 * @returns ISO formatted date string (e.g., "2025-11-02")
 */
export function dateSlug(date:DateTime): string {
  return `${date.year}-${("0"+(date.month)).slice(-2)}-${("0"+date.day).slice(-2)}`;
}

/**
 * Navigates to a file in Obsidian by opening a link.
 * Uses the Obsidian workspace API to open the linked file.
 * Called when user clicks on calendar events.
 *
 * @param link - The link object (from DataView) containing file path information
 */
export function navTo(link:any) {
  console.log(`Navigate to ${link}`);
  ((window as any).app as App).workspace.openLinkText(
    link.toFile().obsidianLink(),
    link.path
  );
}

/**
 * Creates a DateTime representing the first day of the given month.
 * Used by calendar renderer to determine the starting point for rendering a month.
 *
 * @param month - Month number (1-12)
 * @param year - Year number
 * @returns DateTime for the first day of the month at midnight
 */
export function firstOfMonth(month:number, year: number): DateTime {
  let result = DateTime.local(year,month,1);
  return result;
}

/**
 * Calculates the number of days in a given month.
 * Accounts for leap years by calculating the last day of the month.
 * Used by calendar renderer to determine calendar grid size.
 *
 * @param month - Month number (1-12)
 * @param year - Year number
 * @returns Number of days in the month (28-31)
 */
export function daysInMonth(month:number, year:number): number {
  return DateTime.local(year,month+1,1).minus(Duration.fromObject({days:1})).day;
}

/**
 * Returns a date that is a specified number of days after the given date.
 * Note: When used with DateRange, this returns the first day NOT within the range.
 * Used for date range calculations and iteration.
 *
 * @param date - The starting date
 * @param days - Number of days to add
 * @returns A new DateTime representing the date after adding days
 */
export function daysAfter(date:DateTime,days:number):DateTime {
  let result = DateTime.local(date);
  result.set({
    day:result.day+days
  });
  return result;
}

/**
 * Splits an array into two arrays based on a predicate function.
 * Elements that pass the test go into the first array, others into the second.
 * Used for filtering and categorizing collections.
 *
 * @template T - The type of elements in the array
 * @param list - The array to partition
 * @param func - Predicate function that returns true for first partition, false for second
 * @returns Tuple of [matching elements, non-matching elements]
 */
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
