import { DateTime, Duration} from "luxon";
import { MS_PER_DAY } from "./utils";

/**
 * Interface for date patterns that can represent single dates or date ranges.
 * Used throughout the calendar to handle both point-in-time events and multi-day events.
 * Implemented by SimpleDate and DateRange classes.
 */
export interface DatePattern {
  /**
   * Tests whether this pattern includes the given date.
   *
   * @param _date - The date to test
   * @returns True if the date falls within this pattern
   */
  contains(_date:DateTime):boolean ;

  /**
   * Tests whether this pattern overlaps with a date range.
   *
   * @param _range - The date range to test against
   * @returns True if any dates overlap
   */
  overlaps(_range: DateRange):boolean;

  /**
   * Gets the starting date of this pattern.
   *
   * @returns The first date in the pattern
   */
  begins():DateTime;

  /**
   * Gets the ending date of this pattern.
   *
   * @returns The last date in the pattern
   */
  ends():DateTime;

  /**
   * Gets the number of days this pattern spans.
   *
   * @returns Number of days (1 for single dates)
   */
  spans():number;
}

/**
 * Represents a single calendar date.
 * Used for events that occur on a specific day without spanning multiple days.
 * Implements DatePattern for uniform handling with multi-day events.
 */
export class SimpleDate implements DatePattern {
  /** The date this pattern represents */
  date: DateTime

  /**
   * Creates a new single-date pattern.
   *
   * @param date - DateTime or object with toJSDateTime() method
   */
  constructor(date:any) {
    if(date.toJSDateTime) {
      this.date = date.toJSDateTime();
    } else {
      this.date = date;
    }
  }

  /**
   * Tests whether the target date is the same calendar day as this date.
   * Compares year, month, and day (ignores time).
   * Used by calendar renderer to determine which cell contains this event.
   *
   * @param target - The date to test
   * @returns True if target is the same calendar day
   */
  contains(target:DateTime):boolean {
    return target.day == this.date.day
      && target.month == this.date.month
      && target.year == this.date.year;
  }

  /**
   * Tests whether this date falls within the given range.
   * Used by calendar renderer to filter events for the visible month.
   *
   * @param range - The date range to test against
   * @returns True if this date is contained in the range
   */
  overlaps(range:DateRange): boolean {
    return range.contains(this.date)
  }

  /**
   * Gets the date (same as ends() for single dates).
   *
   * @returns This date
   */
  begins():DateTime {
    return this.date;
  }

  /**
   * Gets the date (same as begins() for single dates).
   *
   * @returns This date
   */
  ends():DateTime{
    return this.date;
  }

  /**
   * Gets the number of days this pattern spans (always 1).
   *
   * @returns 1
   */
  spans():number{
    return 1;
  }

  /**
   * Parses a SimpleDate from ISO-formatted text (YYYY-MM-DD).
   * Used by parseDatePattern to extract dates from event text.
   *
   * @param text - Text containing an ISO date
   * @returns A SimpleDate if found, undefined otherwise
   */
  static parse(text:string): SimpleDate|undefined {
    let match = /(?<y>\d\d\d\d)-(?<m>\d\d)-(?<d>\d\d)/.exec(text);
    if(match) {
      let {y,m,d} = match.groups;
      return new SimpleDate(DateTime.local(parseInt(y),parseInt(m),parseInt(d)));
    }
  }
}

/**
 * Represents a range of consecutive calendar dates.
 * The number of days includes the start date, so days=1 is equivalent to a SimpleDate.
 * Used for multi-day events that span across calendar cells.
 * Implements DatePattern for uniform handling with single-day events.
 */
export class DateRange implements DatePattern {
  /** The first day of the range (inclusive) */
  start: DateTime
  /** Number of days in the range (minimum 1) */
  days: number

  /**
   * Creates a new date range.
   *
   * @param start - The first day of the range
   * @param length - Number of days to span (minimum 1, defaults to 1)
   */
  constructor(start:DateTime,length:number=1) {
    this.start = start;
    this.days=Math.max(1,length);
  }

  /**
   * Sets the start date of this range.
   * Used when building ranges programmatically.
   *
   * @param s - The new start date
   * @returns This DateRange for method chaining
   */
  withStart(s:DateTime):DateRange {
    this.start = s;
    return this
  }

  /**
   * Sets the end date of this range by calculating days from start.
   * Used when building ranges from start/end pairs.
   *
   * @param e - The new end date
   * @returns This DateRange for method chaining
   */
  withEnd(e:DateTime):DateRange {
    this.days = Math.max(1, Math.round((e.valueOf() - this.start.valueOf()) / MS_PER_DAY + 1));
    return this;
  }

  /**
   * Gets the first day of the range.
   *
   * @returns The start date
   */
  begins():DateTime{
    return this.start
  }

  /**
   * Gets the last day of the range (inclusive).
   * Calculated as start + (days - 1).
   *
   * @returns The end date
   */
  ends():DateTime{
    let d = this.start.plus(Duration.fromObject({days:this.days-1}));
    return d;
  }

  /**
   * Gets the number of days this range spans.
   *
   * @returns Number of days
   */
  spans():number{
    return this.days;
  }

  /**
   * Tests whether the target date falls within this range (inclusive).
   * Used by calendar renderer to determine which cells should display this event.
   *
   * @param target - The date to test
   * @returns True if target is between start and end (inclusive)
   */
  contains(target:DateTime) : boolean {
    let end = this.ends();
    let result = target.valueOf() >= this.start.valueOf() && target.valueOf() <= end.valueOf();
    console.log(`${JSON.stringify(this)}.contains(${JSON.stringify(target)}): ${result}`);
    return result;
  }

  /**
   * Tests whether this range has any days in common with another range.
   * Returns true if the ranges share at least one calendar day.
   * Used by calendar renderer to filter events for the visible month.
   *
   * @param other - The date range to test against
   * @returns True if the ranges overlap
   */
  overlaps(other:DateRange) : boolean {
    const myEnd=this.ends()
    const otherEnd=other.ends();

    // The range with the earliest start has to include the start of the other range
    let result =  (this.start.valueOf() <= other.start.valueOf() && myEnd.valueOf() >= other.start.valueOf())
    || (other.start.valueOf() <= this.start.valueOf() && otherEnd.valueOf() >= this.start.valueOf());
    //console.log(`Range ${JSON.stringify(this)} overlaps ${JSON.stringify(other)}: ${result}`);
    return result;
  }

  /**
   * Parses a DateRange from text containing two ISO dates separated by "-" or "through".
   * Format: "YYYY-MM-DD - YYYY-MM-DD" or "YYYY-MM-DD through YYYY-MM-DD"
   * Used by parseDatePattern to extract date ranges from event text.
   *
   * @param text - Text containing a date range
   * @returns A DateRange if found, undefined otherwise
   */
  static parse(text:string): DateRange|undefined {
    let match = /(?<y1>\d\d\d\d)-(?<m1>\d\d)-(?<d1>\d\d)\s*(-|through)\s*(?<y2>\d\d\d\d)-(?<m2>\d\d)-(?<d2>\d\d)/.exec(text)
    if(match) {
      let {
        y1,m1,d1,
        y2,m2,d2
      } = match.groups;
      let start = DateTime.local(parseInt(y1),parseInt(m1),parseInt(d1));
      let end = DateTime.local(parseInt(y2),parseInt(m2),parseInt(d2));
      let days:number = Math.round((end.valueOf() - start.valueOf()) / MS_PER_DAY+1);
      if(days < 1) {
        return undefined;
      } else {
        return new DateRange(start,days);
      }
    }
    return undefined;
  }
}

/**
 * Parses either a single date or a date range from text.
 * Tries to match a date range first, then falls back to a single date.
 * Returns all matches as DatePattern for uniform handling by calendar rendering code.
 * Used by event extractors to parse dates from event text.
 *
 * @param text - Text that may contain a date or date range
 * @returns A DatePattern (DateRange or SimpleDate converted to DateRange), or undefined if no date found
 */
export function parseDatePattern(text:string):DatePattern|undefined {
  let dr = DateRange.parse(text);
  if(dr) {
    return dr;
  } else {
    let sd = SimpleDate.parse(text);
    if(sd) {
      return new DateRange(sd.date,1)
    }
  }
  return undefined;
}

// FUTURE WORK
// This syntax might work for specifying most recurring patterns in plain text
// Start with the period (yearly,quarterly,monthly,weekly,within(start,end)), then specify matchers to narrow it down.
//
// 
// every(month): week [2,4], tuesday; 
// every(month): week [2,4], tuesday & not december; 
// every(month): week [2,4], weekday 3;  // also 2nd and 4th tuesday of every month
// every(year): day 37
// every(month): week [5], friday
// every(week): tuesday,wednesday,thursday
// within(january,march): week 3, friday // every third friday of the month from january to march
// every(weeks 3): (week 1, tuesday) or (week 2 wednesday) or (week 3, friday)
// 


