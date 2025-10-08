import { daysAfter, MS_PER_DAY } from "./utils";

export interface DatePattern {
  contains(_date:Date):boolean ;
  within(_range: DateRange):boolean;
  begins():Date;
}

export class SimpleDate implements DatePattern {
  date: Date
  constructor(date:Date) {
    this.date = date;
  }
  contains(target:Date):boolean {
    return target.getDate() == this.date.getDate() 
      && target.getMonth() == this.date.getMonth() 
      && target.getFullYear() == this.date.getFullYear();
  }
  within(range:DateRange): boolean {
    return range.contains(this.date)
  }
  begins():Date {
    return this.date;
  }
  static parse(text:string): SimpleDate|undefined {
    let match = text.match(/(\d\d\d\d)-(\d\d)-(\d\d)/);
    if(match) {
      return new SimpleDate(new Date(parseInt(match[1]),parseInt(match[2]),parseInt(match[3])));
    }
  }
}

// A date range. The number of days **includes** the start date, so if days is 1, then this range
// is equivalent to a SimpleDate. 
export class DateRange implements DatePattern {
  start: Date
  days: number
  constructor(start:Date,length:number) {
    this.start = start;
    this.days=length;
  }
  begins():Date{
    return this.start
  }
  contains(target:Date) : boolean {
    let end = daysAfter(this.start,this.days);
    return target.valueOf() >= this.start.valueOf() && target.valueOf() < end.valueOf();
  }
  within(other:DateRange) : boolean {
    const myEnd=daysAfter(this.start,this.days);
    const otherEnd=daysAfter(other.start,other.days);

    // The range with the earliest start has to include the start of the other range
    return (this.start.valueOf() <= other.start.valueOf() && myEnd.valueOf() > other.start.valueOf())
    || (other.start.valueOf() <= this.start.valueOf() && otherEnd.valueOf() > this.start.valueOf())
  }
  static parse(text:string): DateRange|undefined {
    let parts = text.match(/(\d\d\d\d)-(\d\d)-(\d\d)\w*(-|through)\w*(\d\d\d\d)-(\d\d)-(\d\d)/);
    if(parts) {
      let start = new Date(parseInt(parts[1]),parseInt(parts[2]),parseInt(parts[2]));
      let end = new Date(parseInt(parts[5]),parseInt(parts[6]),parseInt(parts[7]));
      let days:number = (end.valueOf() - start.valueOf()) / MS_PER_DAY;
      return new DateRange(start,days);
    }
    return undefined;
  }
}

export function parseDatePattern(text:string):DatePattern|undefined {
  return DateRange.parse(text) || SimpleDate.parse(text)
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


