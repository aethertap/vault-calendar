import { MS_PER_DAY } from "./utils";

export interface DatePattern {
  contains(_date:Date):boolean ;
  overlaps(_range: DateRange):boolean;
  begins():Date;
  ends():Date;
  spans():number;
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
  overlaps(range:DateRange): boolean {
    return range.contains(this.date)
  }
  begins():Date {
    return this.date;
  }
  ends():Date{
    return this.date;
  }
  spans():number{
    return 1;
  }
  static parse(text:string): SimpleDate|undefined {
    let match = /(?<y>\d\d\d\d)-(?<m>\d\d)-(?<d>\d\d)/.exec(text);
    if(match) {
      let {y,m,d} = match.groups;
      return new SimpleDate(new Date(parseInt(y),parseInt(m)-1,parseInt(d)));
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
  ends():Date{
    let d = new Date(this.start);
    d.setDate(this.start.getDate()+this.days - 1);
    return d;
  }
  spans():number{
    return this.days;
  }
  contains(target:Date) : boolean {
    let end = this.ends();
    return target.valueOf() >= this.start.valueOf() && target.valueOf() <= end.valueOf();
  }
  // returns true if this date range has any days in common with the other
  overlaps(other:DateRange) : boolean {
    const myEnd=this.ends()
    const otherEnd=other.ends();

    // The range with the earliest start has to include the start of the other range
    return (this.start.valueOf() <= other.start.valueOf() && myEnd.valueOf() >= other.start.valueOf())
    || (other.start.valueOf() <= this.start.valueOf() && otherEnd.valueOf() >= this.start.valueOf())
  }
  static parse(text:string): DateRange|undefined {
    let match = /(?<y1>\d\d\d\d)-(?<m1>\d\d)-(?<d1>\d\d)\s*(-|through)\s*(?<y2>\d\d\d\d)-(?<m2>\d\d)-(?<d2>\d\d)/.exec(text)
    if(match) {
      let {
        y1,m1,d1,
        y2,m2,d2
      } = match.groups;
      let start = new Date(parseInt(y1),parseInt(m1)-1,parseInt(d1));
      let end = new Date(parseInt(y2),parseInt(m2)-1,parseInt(d2));
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

// Try to find either a single date or a range of dates. In all cases, if something is found, return 
// it as a DateRange so that it can be treated uniformly by the calendar rendering code.
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


